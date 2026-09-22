import { createHash, randomUUID } from "node:crypto";
import {
  lstatSync,
  linkSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { type Profile, profiles, type Skill, skills } from "./profiles";

const bundle = ".agents/workflow";
const recordPath = `${bundle}/install.json`;
const begin = "<!-- workflow:begin -->";
const end = "<!-- workflow:end -->";
const guideFiles = [
  "AGENTS.md",
  "react.md",
  "stacks.md",
  "configs/README.md",
  "configs/biome.json",
  "configs/tsconfig.base.json",
];

type InstallRecord = {
  version: 1;
  profiles: Profile[];
  extraSkills: Skill[];
  configs: boolean;
  files: Record<string, string>;
  agentsBlockHash: string;
};

type Options = {
  target: string;
  source?: string;
  profiles?: string[];
  skills?: string[];
  configs?: boolean;
};

type Change = {
  path: string;
  status: "add" | "update" | "remove" | "unchanged" | "conflict";
  before: Buffer | null;
  after: Buffer | null;
  reason?: string;
};

export type InstallPlan = { target: string; changes: Change[] };

export class WorkflowInstaller {
  private static hash(content: Buffer | string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  private static isManagedPath(path: string): boolean {
    if (["biome.json", "tsconfig.base.json"].includes(path)) return true;
    if (guideFiles.some((name) => path === `${bundle}/${name}`)) return true;
    return (
      skills.some((name) => path.startsWith(`.agents/skills/${name}/`)) &&
      path.split("/").every((part) => part !== "" && part !== "." && part !== "..") &&
      !path.includes("\\")
    );
  }

  // Walk every component so a symlinked parent cannot redirect reads or writes.
  private static read(root: string, path: string): Buffer | null {
    if (
      isAbsolute(path) ||
      path.includes("\\") ||
      path.split("/").some((part) => !part || part === "." || part === "..")
    ) {
      throw new Error(`Invalid relative path: ${path}`);
    }
    const parts = path.split("/");
    for (let index = 0; index < parts.length; index++) {
      const current = resolve(root, ...parts.slice(0, index + 1));
      const stat = lstatSync(current, { throwIfNoEntry: false });
      if (!stat) return null;
      if (stat.isSymbolicLink()) throw new Error(`Symlink requires manual handling: ${path}`);
      if (index < parts.length - 1 && !stat.isDirectory())
        throw new Error(`Parent is not a directory: ${path}`);
      if (index === parts.length - 1 && !stat.isFile())
        throw new Error(`Not a regular file: ${path}`);
    }
    return readFileSync(resolve(root, path));
  }

  private static selection<T extends string>(
    values: string[],
    allowed: readonly T[],
    label: string,
  ): T[] {
    if (values.some((value) => !allowed.includes(value as T))) {
      throw new Error(`Unknown ${label}. Choose from: ${allowed.join(", ")}`);
    }
    return [...new Set(values)] as T[];
  }

  private static record(content: Buffer | null): InstallRecord | null {
    if (!content) return null;
    const data: unknown = JSON.parse(content.toString());
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("Invalid install record");
    const record = data as Partial<InstallRecord>;
    if (
      record.version !== 1 ||
      !Array.isArray(record.profiles) ||
      !record.profiles.length ||
      !Array.isArray(record.extraSkills) ||
      typeof record.configs !== "boolean" ||
      !record.files ||
      typeof record.files !== "object" ||
      Array.isArray(record.files) ||
      typeof record.agentsBlockHash !== "string" ||
      !/^[a-f0-9]{64}$/.test(record.agentsBlockHash)
    ) {
      throw new Error("Invalid or unsupported install record");
    }
    WorkflowInstaller.selection(
      record.profiles,
      Object.keys(profiles),
      "profile in install record",
    );
    WorkflowInstaller.selection(record.extraSkills, skills, "skill in install record");
    for (const [path, hash] of Object.entries(record.files)) {
      if (
        !WorkflowInstaller.isManagedPath(path) ||
        typeof hash !== "string" ||
        !/^[a-f0-9]{64}$/.test(hash)
      ) {
        throw new Error(`Invalid install record entry: ${path}`);
      }
    }
    return record as InstallRecord;
  }

  private static stackGuide(source: string, selected: Profile[], installed: Set<string>): Buffer {
    const text = WorkflowInstaller.read(source, "ts/stacks.md");
    if (!text) throw new Error("Missing source: ts/stacks.md");
    const sections = new Map(
      text
        .toString()
        .split(/(?=^## )/m)
        .slice(1)
        .map((section) => {
          const title = section.split("\n", 1)[0]?.slice(3);
          return [title, section.trim()] as const;
        }),
    );
    const titles = [
      "Apply a profile",
      ...selected.flatMap((name) => profiles[name].section ?? []),
      "Common skills and optional dependencies",
    ];
    const body = [...new Set(titles)]
      .map((title) => {
        const section = sections.get(title);
        if (!section) throw new Error(`Missing stack section: ${title}`);
        return section;
      })
      .join("\n\n");
    const guide = `# Installed TypeScript profiles\n\nSelected: ${selected.join(", ")}.\n\nUse [the baseline](AGENTS.md), [React guidance](react.md) where applicable,\nand [config guidance](configs/README.md).\n\n${body}\n`;
    return Buffer.from(
      guide.replace(
        /\[([^\]]+)\]\(skills\/([^/]+)\/SKILL\.md\)/g,
        (_match, label: string, skill: string) =>
          installed.has(skill)
            ? `[${label}](../skills/${skill}/SKILL.md)`
            : `${label} (skill not installed)`,
      ),
    );
  }

  static plan(options: Options): InstallPlan {
    const target = realpathSync(options.target);
    const source = realpathSync(options.source ?? resolve(import.meta.dir, ".."));
    if (!lstatSync(target).isDirectory())
      throw new Error("Target must be an existing project directory");
    const contains = (parent: string, child: string) => {
      const path = relative(parent, child);
      return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
    };
    if (contains(source, target) || contains(target, source))
      throw new Error("Source and target directories must not overlap");

    const previous = WorkflowInstaller.record(WorkflowInstaller.read(target, recordPath));
    const selected = WorkflowInstaller.selection(
      options.profiles ?? previous?.profiles ?? ["core"],
      Object.keys(profiles) as Profile[],
      "profile",
    );
    if (!selected.length) throw new Error("Choose at least one profile");
    const extras = WorkflowInstaller.selection(
      options.skills ?? previous?.extraSkills ?? [],
      skills,
      "skill",
    );
    const installed = new Set<string>([
      ...selected.flatMap((name) => [...profiles[name].skills]),
      ...extras,
    ]);
    const configs = options.configs ?? previous?.configs ?? false;
    const desired = new Map<string, Buffer>();
    for (const name of guideFiles) {
      const content = WorkflowInstaller.read(source, `ts/${name}`);
      if (!content) throw new Error(`Missing source: ts/${name}`);
      desired.set(
        `${bundle}/${name}`,
        name === "stacks.md" ? WorkflowInstaller.stackGuide(source, selected, installed) : content,
      );
    }
    const copySkill = (path: string) => {
      const stat = lstatSync(resolve(source, path));
      if (stat.isSymbolicLink())
        throw new Error(`Source symlink requires manual handling: ${path}`);
      if (stat.isDirectory()) {
        for (const child of readdirSync(resolve(source, path)).sort())
          copySkill(`${path}/${child}`);
      } else {
        const content = WorkflowInstaller.read(source, path);
        if (!content) throw new Error(`Missing source: ${path}`);
        desired.set(path.replace(/^ts\/skills\//, ".agents/skills/"), content);
      }
    };
    for (const skill of [...installed].sort()) {
      if (!WorkflowInstaller.read(source, `ts/skills/${skill}/SKILL.md`))
        throw new Error(`Missing skill: ${skill}`);
      copySkill(`ts/skills/${skill}`);
    }
    if (configs) {
      for (const name of ["biome.json", "tsconfig.base.json"]) {
        const template = desired.get(`${bundle}/configs/${name}`);
        if (!template) throw new Error(`Missing config template: ${name}`);
        desired.set(name, template);
      }
    }

    const changes: Change[] = [];
    const fileChange = (path: string, after: Buffer | null): Change => {
      try {
        const before = WorkflowInstaller.read(target, path);
        const oldHash = previous?.files[path];
        const result = { path, before, after };
        if (!before && !oldHash) return { ...result, status: after ? "add" : "unchanged" };
        if (!before)
          return {
            ...result,
            status: after ? "conflict" : "unchanged",
            reason: "Managed file was deleted locally",
          };
        if (!oldHash)
          return {
            ...result,
            status: "conflict",
            reason: "Existing file is not managed by workflow",
          };
        if (after?.equals(before)) return { ...result, status: "unchanged" };
        if (WorkflowInstaller.hash(before) !== oldHash)
          return { ...result, status: "conflict", reason: "Managed file has local edits" };
        return { ...result, status: after ? "update" : "remove" };
      } catch (error) {
        return { path, before: null, after, status: "conflict", reason: String(error) };
      }
    };
    for (const [path, content] of desired) changes.push(fileChange(path, content));
    for (const path of Object.keys(previous?.files ?? {})) {
      if (!desired.has(path)) changes.push(fileChange(path, null));
    }

    // These siblings can supersede or conflict with the files we install.
    for (const path of ["AGENTS.override.md", ...(configs ? ["biome.jsonc"] : [])]) {
      const change = fileChange(path, null);
      if (change.before || change.status === "conflict") {
        changes.push({
          ...change,
          status: "conflict",
          reason: change.reason ?? "Existing alternate configuration requires manual handling",
        });
      } else changes.push(change);
    }

    const instructions = [
      begin,
      "## TypeScript workflow",
      "",
      `For TypeScript work, read \`${bundle}/AGENTS.md\`.`,
      `For runtime and stack work, read \`${bundle}/stacks.md\`.`,
      "Preserve this project's specific instructions and existing tooling.",
      end,
    ].join("\n");
    let block = instructions;
    try {
      const before = WorkflowInstaller.read(target, "AGENTS.md");
      const text = before?.toString() ?? "";
      if (text.includes("\r\n")) block = block.replaceAll("\n", "\r\n");
      const start = text.indexOf(begin);
      const finish = text.indexOf(end);
      const marked = start !== -1 || finish !== -1;
      let after: string;
      if (marked) {
        if (
          start < 0 ||
          finish < start ||
          text.indexOf(begin, start + begin.length) !== -1 ||
          text.indexOf(end, finish + end.length) !== -1
        )
          throw new Error("Malformed or duplicate workflow markers");
        if (!previous) throw new Error("Workflow markers already exist without an install record");
        const existing = text.slice(start, finish + end.length);
        if (WorkflowInstaller.hash(existing) !== previous.agentsBlockHash && existing !== block)
          throw new Error("Managed instruction block has local edits");
        after = text.slice(0, start) + block + text.slice(finish + end.length);
      } else {
        if (previous) throw new Error("Managed instruction block was removed locally");
        const newline = text.includes("\r\n") ? "\r\n" : "\n";
        after = `${text}${text ? (text.endsWith("\n") ? newline : newline + newline) : ""}${block}${newline}`;
      }
      const content = Buffer.from(after);
      changes.push({
        path: "AGENTS.md",
        before,
        after: content,
        status: !before ? "add" : content.equals(before) ? "unchanged" : "update",
      });
    } catch (error) {
      changes.push({
        path: "AGENTS.md",
        before: null,
        after: null,
        status: "conflict",
        reason: String(error),
      });
    }

    const record: InstallRecord = {
      version: 1,
      profiles: selected,
      extraSkills: extras,
      configs,
      files: Object.fromEntries(
        [...desired].map(([path, content]) => [path, WorkflowInstaller.hash(content)]),
      ),
      agentsBlockHash: WorkflowInstaller.hash(block),
    };
    const before = WorkflowInstaller.read(target, recordPath);
    const after = Buffer.from(`${JSON.stringify(record, null, 2)}\n`);
    changes.push({
      path: recordPath,
      before,
      after,
      status: !before ? "add" : before.equals(after) ? "unchanged" : "update",
    });
    return { target, changes };
  }

  static apply(plan: InstallPlan): void {
    if (plan.changes.some((change) => change.status === "conflict"))
      throw new Error("Conflicts found; no files were written");
    for (const change of plan.changes) {
      const now = WorkflowInstaller.read(plan.target, change.path);
      if (now === null ? change.before !== null : !change.before?.equals(now)) {
        throw new Error(`Changed since preview; no files were written: ${change.path}`);
      }
    }
    // ponytail: files are atomic, not the whole install; add rollback if interrupted-install recovery needs automation.
    for (const change of plan.changes) {
      if (change.status === "unchanged") continue;
      const path = resolve(plan.target, change.path);
      if (change.after === null) unlinkSync(path);
      else {
        mkdirSync(dirname(path), { recursive: true });
        const temporary = resolve(dirname(path), `.workflow-${randomUUID()}.tmp`);
        try {
          const mode = change.before ? lstatSync(path).mode & 0o777 : 0o666;
          writeFileSync(temporary, change.after, { flag: "wx", mode });
          if (change.status === "add") linkSync(temporary, path);
          else renameSync(temporary, path);
        } finally {
          if (lstatSync(temporary, { throwIfNoEntry: false })) unlinkSync(temporary);
        }
      }
    }
  }
}

if (import.meta.main) {
  try {
    const { values, positionals } = parseArgs({
      args: Bun.argv.slice(2),
      allowPositionals: true,
      strict: true,
      options: {
        profile: { type: "string", multiple: true },
        skills: { type: "string", multiple: true },
        configs: { type: "boolean" },
        "dry-run": { type: "boolean" },
        help: { type: "boolean", short: "h" },
      },
    });
    if (values.help) {
      console.log(
        `Usage: bun run scripts/install.ts <project> [options]\n\n--profile <names>  Comma-separated or repeated: ${Object.keys(profiles).join(", ")}\n--skills <names>   Extra skills: ${skills.join(", ")}\n--configs         Copy Biome and TypeScript base templates into the project root\n--dry-run         Preview without writing\n\nNew installs default to core. Omitted selections retain the last install.\nUse --skills none to clear extra skills. Profile changes remove unedited obsolete files.\nConflicts abort the entire install. No dependencies are installed.`,
      );
    } else {
      if (positionals.length !== 1 || !positionals[0])
        throw new Error("Provide one existing project directory; use --help for options");
      const split = (items?: string[]) =>
        items?.flatMap((item) => item.split(",").map((part) => part.trim()));
      const extras = split(values.skills);
      const plan = WorkflowInstaller.plan({
        target: positionals[0],
        profiles: split(values.profile),
        skills: extras?.length === 1 && extras[0] === "none" ? [] : extras,
        configs: values.configs,
      });
      for (const change of plan.changes) {
        if (change.status !== "unchanged" || change.after !== null)
          console.log(
            `${change.status.padEnd(9)} ${change.path}${change.reason ? ` — ${change.reason}` : ""}`,
          );
      }
      if (plan.changes.some((change) => change.status === "conflict")) {
        console.error("Conflicts found; no files were written.");
        process.exitCode = 1;
      } else if (values["dry-run"]) console.log("Preview only; no files were written.");
      else {
        WorkflowInstaller.apply(plan);
        console.log(
          `Installed in ${plan.target}. Review the diff and verify agent discovery.${values.configs ? " Root config templates need their documented dependencies and runtime-specific setup." : ""}`,
        );
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
