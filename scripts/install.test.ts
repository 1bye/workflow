/**
 * Covers: previews, installation, updates, conflicts, and managed path boundaries.
 * Real: installer, CLI, source templates, skill resources, and temporary files.
 * Doubles: none; scenarios use isolated source copies and temporary projects.
 * Requires: Bun and a writable temporary directory; no network or external service.
 */
import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { WorkflowInstaller } from "./install";
import { profiles } from "./profiles";

const repository = resolve(import.meta.dir, "..");
const temporary: string[] = [];

afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "workflow-install-"));

  temporary.push(root);
  const source = join(root, "source");
  const target = join(root, "target project");

  mkdirSync(target);
  cpSync(join(repository, "ts"), join(source, "ts"), { recursive: true });
  cpSync(join(repository, "rust"), join(source, "rust"), { recursive: true });

  return { root, source, target };
}

function snapshot(root: string): Record<string, string> {
  const files: Record<string, string> = {};

  const visit = (path: string) => {
    for (const entry of readdirSync(join(root, path), { withFileTypes: true })) {
      const child = path ? `${path}/${entry.name}` : entry.name;

      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) files[child] = readFileSync(join(root, child)).toString("base64");
    }
  };

  visit("");

  return files;
}

function checkLinks(target: string) {
  for (const [path, bytes] of Object.entries(snapshot(target))) {
    if (!path.endsWith(".md")) continue;

    const text = Buffer.from(bytes, "base64").toString();

    for (const [, link] of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
      if (!link || /^[a-z]+:|^#|^\//.test(link)) continue;

      expect(existsSync(resolve(target, dirname(path), link.split("#")[0] ?? ""))).toBe(true);
    }
  }
}

test("CLI previews without creating anything, including for a target with spaces", () => {
  const { target } = fixture();

  writeFileSync(join(target, "AGENTS.md"), "# Project rules\n");
  const before = snapshot(target);

  const result = Bun.spawnSync(
    [
      process.execPath,
      join(repository, "scripts/install.ts"),
      target,
      "--profile",
      "web",
      "--skills",
      "shadcn,bro,unslop",
      "--oxlint",
      "--dry-run",
    ],
    { cwd: tmpdir() },
  );

  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("Preview only");
  expect(result.stdout.toString()).toContain("shadcn/assets/shadcn.png");
  expect(result.stdout.toString()).toContain("bro/agents/openai.yaml");
  expect(result.stdout.toString()).toContain("unslop/agents/openai.yaml");
  expect(result.stdout.toString()).toContain(".oxlintrc.json");
  expect(snapshot(target)).toEqual(before);
  expect(existsSync(join(target, ".agents"))).toBe(false);
});

test("installs whole skills, preserves project instructions, and keeps all references local", () => {
  const options = fixture();
  const original = "# Application\n\nUse the existing test runner.\n";

  writeFileSync(join(options.target, "AGENTS.md"), original);
  WorkflowInstaller.apply(
    WorkflowInstaller.plan({ ...options, profiles: ["web"], skills: ["shadcn", "bro", "unslop"] }),
  );
  const instructions = readFileSync(join(options.target, "AGENTS.md"), "utf8");

  expect(instructions.startsWith(original)).toBe(true);
  expect(instructions).toContain(".agents/workflow/AGENTS.md");

  for (const name of [
    "shadcn",
    "bro",
    "unslop",
    "vercel-react-best-practices",
    "vercel-composition-patterns",
  ]) {
    expect(snapshot(join(options.target, ".agents/skills", name))).toEqual(
      snapshot(join(options.source, "ts/skills", name)),
    );
  }

  expect(existsSync(join(options.target, ".agents/skills/turborepo"))).toBe(false);
  expect(existsSync(join(options.target, "biome.json"))).toBe(false);
  expect(readFileSync(join(options.target, ".oxlintrc.json"))).toEqual(
    readFileSync(join(options.source, "ts/configs/oxlint.json")),
  );
  expect(readFileSync(join(options.target, ".agents/workflow/testing.md"))).toEqual(
    readFileSync(join(options.source, "ts/testing.md")),
  );
  checkLinks(options.target);
});

test("repeat installation is a no-op and omitted options retain selections", () => {
  const options = fixture();

  WorkflowInstaller.apply(
    WorkflowInstaller.plan({
      ...options,
      profiles: ["web", "workspace"],
      skills: ["tdd"],
      configs: true,
    }),
  );
  const before = snapshot(options.target);
  const repeated = WorkflowInstaller.plan(options);

  expect(repeated.changes.every((change) => change.status === "unchanged")).toBe(true);
  WorkflowInstaller.apply(repeated);
  expect(snapshot(options.target)).toEqual(before);
  expect(
    readFileSync(join(options.target, "AGENTS.md"), "utf8").match(/workflow:begin/g),
  ).toHaveLength(1);
});

test("updates unchanged managed copies and preserves edits outside the AGENTS block", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  const agentPath = join(options.target, "AGENTS.md");

  writeFileSync(
    agentPath,
    readFileSync(agentPath, "utf8") + "\n## Local commands\nUse bun test.\n",
  );
  const sourcePath = join(options.source, "ts/react.md");

  writeFileSync(sourcePath, readFileSync(sourcePath, "utf8") + "\nNew shared guidance.\n");
  const plan = WorkflowInstaller.plan(options);

  expect(plan.changes.find((change) => change.path.endsWith("/react.md"))?.status).toBe("update");
  WorkflowInstaller.apply(plan);
  expect(readFileSync(join(options.target, ".agents/workflow/react.md"))).toEqual(
    readFileSync(sourcePath),
  );
  expect(readFileSync(agentPath, "utf8")).toContain("## Local commands\nUse bun test.");
});

test("upgrades an older managed instruction block without replacing surrounding content", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  const path = join(options.target, "AGENTS.md");
  const oldBlock = "<!-- workflow:begin -->\nPrevious installer guidance.\n<!-- workflow:end -->";

  writeFileSync(path, `# Local rules\n\n${oldBlock}\n\nKeep this footer.\n`);
  const recordPath = join(options.target, ".agents/workflow/install.json");
  const record = JSON.parse(readFileSync(recordPath, "utf8"));

  record.agentsBlockHash = createHash("sha256").update(oldBlock).digest("hex");
  writeFileSync(recordPath, JSON.stringify(record));
  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  const result = readFileSync(path, "utf8");

  expect(result.startsWith("# Local rules\n\n")).toBe(true);
  expect(result.endsWith("\n\nKeep this footer.\n")).toBe(true);
  expect(result).toContain(".agents/workflow/AGENTS.md");
  expect(result).not.toContain("Previous installer guidance");
});

test("preserves restricted permissions when updating an existing instruction file", () => {
  const options = fixture();
  const path = join(options.target, "AGENTS.md");

  writeFileSync(path, "# Private project instructions\n");
  chmodSync(path, 0o600);
  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  expect(statSync(path).mode & 0o777).toBe(0o600);
});

test("local managed-file edits block every write", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  writeFileSync(join(options.target, ".agents/workflow/react.md"), "Local customization");
  const before = snapshot(options.target);
  const plan = WorkflowInstaller.plan({ ...options, skills: ["tdd"] });

  expect(plan.changes.some((change) => change.status === "conflict")).toBe(true);
  expect(() => WorkflowInstaller.apply(plan)).toThrow("no files were written");
  expect(snapshot(options.target)).toEqual(before);
});

test("locally deleted managed files are reported instead of silently recreated", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  rmSync(join(options.target, ".agents/workflow/react.md"));
  const plan = WorkflowInstaller.plan(options);

  expect(plan.changes.find((change) => change.path.endsWith("/react.md"))?.status).toBe("conflict");
});

test.each([
  "biome.json",
  "biome.jsonc",
  "tsconfig.base.json",
])("root config %s is opt-in and existing content is preserved", (name) => {
  const options = fixture();

  writeFileSync(join(options.target, name), '{"local":true}\n');
  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  const before = snapshot(options.target);
  const plan = WorkflowInstaller.plan({ ...options, configs: true });

  expect(plan.changes.find((change) => change.path === name)?.status).toBe("conflict");
  expect(() => WorkflowInstaller.apply(plan)).toThrow();
  expect(snapshot(options.target)).toEqual(before);
});

test("copies requested root templates without changing the application's tsconfig", () => {
  const options = fixture();

  writeFileSync(join(options.target, "tsconfig.json"), '{"extends":"expo/tsconfig.base"}\n');
  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, configs: true }));

  for (const name of ["biome.json", "tsconfig.base.json"]) {
    expect(readFileSync(join(options.target, name))).toEqual(
      readFileSync(join(options.source, "ts/configs", name)),
    );
  }

  expect(readFileSync(join(options.target, "tsconfig.json"), "utf8")).toBe(
    '{"extends":"expo/tsconfig.base"}\n',
  );
});

test.each([
  ".oxlintrc.json",
  ".oxlintrc.jsonc",
  "oxlint.config.ts",
  "oxlint.config.mts",
])("Oxlint adoption preserves existing %s before any writes", (name) => {
  const options = fixture();

  writeFileSync(join(options.target, name), "Local config\n");
  const before = snapshot(options.target);

  const plan = WorkflowInstaller.plan(options);

  expect(plan.changes.find((change) => change.path === name)?.status).toBe("conflict");
  expect(() => WorkflowInstaller.apply(plan)).toThrow("no files were written");
  expect(snapshot(options.target)).toEqual(before);
});

test("combined Oxlint config is installed by default, retained, and removable", () => {
  const options = fixture();
  const rootConfig = join(options.target, ".oxlintrc.json");

  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  expect(readFileSync(rootConfig)).toEqual(
    readFileSync(join(options.source, "ts/configs/oxlint.json")),
  );
  expect(
    WorkflowInstaller.plan(options).changes.every(({ status }) => status === "unchanged"),
  ).toBe(true);

  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, oxlint: false }));
  expect(existsSync(rootConfig)).toBe(false);
  expect(existsSync(join(options.target, ".agents/workflow/configs/oxlint.json"))).toBe(true);
  expect(
    WorkflowInstaller.plan(options).changes.every(({ status }) => status === "unchanged"),
  ).toBe(true);
});

test("Oxlint changes and removal never overwrite local edits", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, oxlint: true }));
  writeFileSync(join(options.target, ".oxlintrc.json"), '{"rules":{}}\n');
  const before = snapshot(options.target);

  for (const oxlint of [true, false]) {
    expect(() => WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, oxlint }))).toThrow();
    expect(snapshot(options.target)).toEqual(before);
  }
});

test("existing install records without Oxlint remain valid and do not activate it", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, oxlint: false }));
  const path = join(options.target, ".agents/workflow/install.json");
  const record = JSON.parse(readFileSync(path, "utf8"));

  delete record.oxlint;
  writeFileSync(path, JSON.stringify(record));

  WorkflowInstaller.apply(WorkflowInstaller.plan(options));

  expect(existsSync(join(options.target, ".oxlintrc.json"))).toBe(false);
  writeFileSync(path, JSON.stringify({ ...record, oxlint: "unknown" }));
  expect(() => WorkflowInstaller.plan(options)).toThrow("Invalid or unsupported install record");
});

test("omits Biome references for projects using another formatter", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, biome: false }));

  expect(existsSync(join(options.target, ".agents/workflow/configs/biome.json"))).toBe(false);
  expect(
    readFileSync(join(options.target, ".agents/workflow/configs/README.md"), "utf8"),
  ).not.toContain("Biome");
  const guide = readFileSync(join(options.target, ".agents/workflow/stacks.md"), "utf8");

  expect(guide).not.toContain("Ultracite");
  expect(guide).toContain("configs/README.md");
  checkLinks(options.target);

  expect(() => WorkflowInstaller.plan({ ...options, biome: false, configs: true })).toThrow(
    "--configs requires Biome guidance",
  );
  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, biome: true }));
  expect(existsSync(join(options.target, ".agents/workflow/configs/biome.json"))).toBe(true);
});

test("changing profiles removes obsolete managed skills while preserving unrelated files", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: ["web", "workspace"] }));
  const userFile = join(options.target, ".agents/skills/turborepo/personal.txt");

  writeFileSync(userFile, "Keep me");
  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: ["bun-api"] }));
  expect(existsSync(join(options.target, ".agents/skills/turborepo/SKILL.md"))).toBe(false);
  expect(readFileSync(userFile, "utf8")).toBe("Keep me");
  const guide = readFileSync(join(options.target, ".agents/workflow/stacks.md"), "utf8");

  expect(guide).toContain("## Bun API");
  expect(guide).not.toContain("## React web");
  checkLinks(options.target);
});

test("refuses to remove edited skill files when changing selection", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, skills: ["tdd"] }));
  writeFileSync(join(options.target, ".agents/skills/tdd/SKILL.md"), "Customized skill");
  const before = snapshot(options.target);

  expect(() =>
    WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, skills: [] })),
  ).toThrow();
  expect(snapshot(options.target)).toEqual(before);
});

test("an unmanaged skill is a conflict even when its entry matches the source", () => {
  const options = fixture();
  const path = join(options.target, ".agents/skills/tdd");

  mkdirSync(path, { recursive: true });
  cpSync(join(options.source, "ts/skills/tdd/SKILL.md"), join(path, "SKILL.md"));
  const before = snapshot(options.target);

  expect(() =>
    WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, skills: ["tdd"] })),
  ).toThrow();
  expect(snapshot(options.target)).toEqual(before);
});

test.each([
  "AGENTS.override.md",
  "malformed",
  "duplicate",
  "edited",
  "removed",
])("protects instruction ownership: %s", (kind) => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  const path = join(options.target, "AGENTS.md");
  const original = readFileSync(path, "utf8");

  if (kind === "AGENTS.override.md") writeFileSync(join(options.target, kind), "Overrides");

  if (kind === "malformed") writeFileSync(path, original.replace("<!-- workflow:end -->", ""));

  if (kind === "duplicate") writeFileSync(path, original + original);

  if (kind === "edited")
    writeFileSync(path, original.replace("TypeScript workflow", "Custom workflow"));

  if (kind === "removed") writeFileSync(path, "Only local instructions\n");

  const before = snapshot(options.target);

  expect(() => WorkflowInstaller.apply(WorkflowInstaller.plan(options))).toThrow();
  expect(snapshot(options.target)).toEqual(before);
});

test("preserves CRLF project content and does not duplicate its instruction block", () => {
  const options = fixture();
  const path = join(options.target, "AGENTS.md");
  const original = "# Local\r\n\r\nFollow our rules.\r\n";

  writeFileSync(path, original);
  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  const first = readFileSync(path, "utf8");

  expect(first.startsWith(original)).toBe(true);
  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  expect(readFileSync(path, "utf8")).toBe(first);
});

test.each([
  ".agents",
  "AGENTS.md",
  ".agents/skills/tdd",
])("rejects symlink destinations: %s", (path) => {
  const options = fixture();
  const outside = join(options.root, "outside");

  mkdirSync(outside);
  mkdirSync(dirname(join(options.target, path)), { recursive: true });
  symlinkSync(outside, join(options.target, path));
  expect(() =>
    WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, skills: ["tdd"] })),
  ).toThrow();
  expect(readdirSync(outside)).toEqual([]);
});

test("rejects traversal in an install record before any writes", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  const path = join(options.target, ".agents/workflow/install.json");
  const record = JSON.parse(readFileSync(path, "utf8"));

  record.files[".agents/skills/tdd/../../../../outside"] = "0".repeat(64);
  writeFileSync(path, JSON.stringify(record));
  const before = snapshot(options.target);

  expect(() => WorkflowInstaller.plan(options)).toThrow("Invalid install record entry");
  expect(snapshot(options.target)).toEqual(before);
});

test("rechecks all planned paths before writing, including an added override", () => {
  const options = fixture();
  const plan = WorkflowInstaller.plan(options);

  writeFileSync(join(options.target, "AGENTS.override.md"), "New instructions");
  expect(() => WorkflowInstaller.apply(plan)).toThrow("Changed since preview");
  expect(existsSync(join(options.target, ".agents"))).toBe(false);
});

test("validates source, profiles, skill names, and overlapping targets", () => {
  const options = fixture();

  expect(() => WorkflowInstaller.plan({ ...options, profiles: ["unknown"] })).toThrow(
    "Unknown profile",
  );
  expect(() => WorkflowInstaller.plan({ ...options, skills: ["../outside"] })).toThrow(
    "Unknown skill",
  );
  expect(() => WorkflowInstaller.plan({ ...options, target: options.source })).toThrow("overlap");
  rmSync(join(options.source, "ts/skills/tdd/agents/openai.yaml"));
  symlinkSync(
    join(options.source, "ts/react.md"),
    join(options.source, "ts/skills/tdd/agents/openai.yaml"),
  );
  expect(() => WorkflowInstaller.plan({ ...options, skills: ["tdd"] })).toThrow("symlink");
  expect(readdirSync(options.target)).toEqual([]);
});

test.each(
  Object.keys(profiles),
)("profile %s produces a usable guide and complete links", (profile) => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: [profile] }));
  checkLinks(options.target);
});

test("CLI rejects unknown options and conflicts, and can clear extra skills", () => {
  const options = fixture();

  const cli = (args: string[]) =>
    Bun.spawnSync([
      process.execPath,
      join(repository, "scripts/install.ts"),
      options.target,
      ...args,
    ]);

  expect(cli(["--unknown"]).exitCode).toBe(1);
  expect(cli(["--oxlint", "unknown"]).exitCode).toBe(1);
  expect(cli(["--profile", "library", "--skills", "tdd"]).exitCode).toBe(0);
  expect(cli(["--oxlint", "--no-oxlint"]).exitCode).toBe(1);
  expect(cli(["--oxlint"]).exitCode).toBe(0);
  expect(readFileSync(join(options.target, ".oxlintrc.json"))).toEqual(
    readFileSync(join(repository, "ts/configs/oxlint.json")),
  );
  expect(cli(["--no-oxlint"]).exitCode).toBe(0);
  expect(existsSync(join(options.target, ".oxlintrc.json"))).toBe(false);
  expect(cli(["--skills", "none"]).exitCode).toBe(0);
  expect(existsSync(join(options.target, ".agents/skills/tdd/SKILL.md"))).toBe(false);
  writeFileSync(join(options.target, ".agents/workflow/react.md"), "Local edits");
  const result = cli(["--dry-run"]);

  expect(result.exitCode).toBe(1);
  expect(result.stdout.toString()).toContain("conflict");
});

test("Rust-only installation supplies complete guides and skill without TypeScript tooling", () => {
  const options = fixture();
  const cargo = '[package]\nname = "existing"\nversion = "0.1.0"\n';
  const toolchain = '[toolchain]\nchannel = "1.85.0"\n';

  writeFileSync(join(options.target, "Cargo.toml"), cargo);
  writeFileSync(join(options.target, "rust-toolchain.toml"), toolchain);
  writeFileSync(join(options.target, "biome.jsonc"), "Unrelated config\n");
  writeFileSync(join(options.target, ".oxlintrc.json"), "Unrelated lint config\n");
  WorkflowInstaller.apply(
    WorkflowInstaller.plan({
      ...options,
      profiles: ["rust-library", "rust-workspace"],
      configs: true,
    }),
  );

  const files = snapshot(options.target);
  const instructions = readFileSync(join(options.target, "AGENTS.md"), "utf8");

  expect(instructions).toContain(".agents/workflow/rust/AGENTS.md");
  expect(instructions).not.toContain("TypeScript work");
  expect(files[".agents/workflow/AGENTS.md"]).toBeUndefined();
  expect(files[".agents/workflow/react.md"]).toBeUndefined();
  expect(files["biome.json"]).toBeUndefined();
  expect(readFileSync(join(options.target, ".oxlintrc.json"), "utf8")).toBe(
    "Unrelated lint config\n",
  );
  expect(readFileSync(join(options.target, "Cargo.toml"), "utf8")).toBe(cargo);
  expect(readFileSync(join(options.target, "rust-toolchain.toml"), "utf8")).toBe(toolchain);
  expect(readFileSync(join(options.target, "rustfmt.toml"))).toEqual(
    readFileSync(join(options.source, "rust/configs/rustfmt.toml")),
  );
  expect(snapshot(join(options.target, ".agents/skills/rust-development"))).toEqual(
    snapshot(join(options.source, "rust/skills/rust-development")),
  );
  const guide = readFileSync(join(options.target, ".agents/workflow/rust/stacks.md"), "utf8");

  expect(guide).toContain("## Library");
  expect(guide).toContain("## Workspace layer");
  expect(guide).not.toContain("## CLI");
  checkLinks(options.target);
  expect(
    WorkflowInstaller.plan(options).changes.every(({ status }) => status === "unchanged"),
  ).toBe(true);
});

test("adding and removing Rust profiles preserves an existing TypeScript installation", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: ["web"], configs: true }));
  const before = snapshot(options.target);

  WorkflowInstaller.apply(
    WorkflowInstaller.plan({ ...options, profiles: ["web", "rust-native-wasm"] }),
  );

  for (const [path, content] of Object.entries(before)) {
    if (path === "AGENTS.md" || path.endsWith("/install.json")) continue;

    expect(snapshot(options.target)[path]).toBe(content);
  }

  expect(readFileSync(join(options.target, "AGENTS.md"), "utf8")).toContain(
    "TypeScript and Rust workflow",
  );
  expect(existsSync(join(options.target, "rustfmt.toml"))).toBe(true);
  checkLinks(options.target);
  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: ["web"] }));
  expect(snapshot(options.target)).toEqual(before);
});

test("switching languages removes only unedited managed files and keeps tooling choices", () => {
  const options = fixture();

  WorkflowInstaller.apply(
    WorkflowInstaller.plan({ ...options, profiles: ["core"], configs: true }),
  );
  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: ["rust"] }));
  expect(existsSync(join(options.target, ".oxlintrc.json"))).toBe(false);
  expect(existsSync(join(options.target, "biome.json"))).toBe(false);
  expect(existsSync(join(options.target, "rustfmt.toml"))).toBe(true);

  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: ["core"] }));
  expect(existsSync(join(options.target, ".oxlintrc.json"))).toBe(true);
  expect(existsSync(join(options.target, "rustfmt.toml"))).toBe(false);
  expect(existsSync(join(options.target, ".agents/workflow/rust/AGENTS.md"))).toBe(false);
});

test.each([
  "rustfmt.toml",
  ".rustfmt.toml",
])("Rust formatter adoption preserves existing %s", (name) => {
  const options = fixture();

  writeFileSync(join(options.target, name), "max_width = 88\n");
  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: ["rust"] }));
  const before = snapshot(options.target);
  const plan = WorkflowInstaller.plan({ ...options, configs: true });

  expect(plan.changes.find(({ path }) => path === name)?.status).toBe("conflict");
  expect(() => WorkflowInstaller.apply(plan)).toThrow("no files were written");
  expect(snapshot(options.target)).toEqual(before);
});

test.each([
  "rustfmt.toml",
  ".agents/workflow/rust/architecture.md",
  ".agents/skills/rust-development/references/ownership.md",
])("Rust updates and removal protect local edits in %s", (path) => {
  const options = fixture();

  WorkflowInstaller.apply(
    WorkflowInstaller.plan({ ...options, profiles: ["rust"], configs: true }),
  );
  writeFileSync(join(options.target, path), "Local changes\n");
  const before = snapshot(options.target);

  for (const selected of [["rust"], ["core"]]) {
    const plan = WorkflowInstaller.plan({ ...options, profiles: selected });

    expect(() => WorkflowInstaller.apply(plan)).toThrow("no files were written");
    expect(snapshot(options.target)).toEqual(before);
  }
});

test("Rust source updates propagate through recorded selections", () => {
  const options = fixture();

  WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: ["rust-cli"] }));
  const sourcePath = join(options.source, "rust/architecture.md");

  writeFileSync(sourcePath, readFileSync(sourcePath, "utf8") + "\nNew architecture guidance.\n");
  WorkflowInstaller.apply(WorkflowInstaller.plan(options));
  expect(readFileSync(join(options.target, ".agents/workflow/rust/architecture.md"))).toEqual(
    readFileSync(sourcePath),
  );
});

test("Rust CLI preview is read-only and profiles control active tools", () => {
  const options = fixture();

  const cli = (...args: string[]) =>
    Bun.spawnSync([
      process.execPath,
      join(repository, "scripts/install.ts"),
      options.target,
      ...args,
    ]);

  const preview = cli("--profile", "rust-cli,rust-async", "--configs", "--dry-run");

  expect(preview.exitCode).toBe(0);
  expect(preview.stdout.toString()).toContain("rustfmt.toml");
  expect(preview.stdout.toString()).not.toContain(".oxlintrc.json");
  expect(snapshot(options.target)).toEqual({});
  expect(cli("--profile", "rust", "--oxlint").exitCode).toBe(1);
  expect(cli("--profile", "rust", "--configs", "--no-biome").exitCode).toBe(0);
  checkLinks(options.target);
});

test("Rust destinations reject symlinked guide parents", () => {
  const options = fixture();
  const outside = join(options.root, "outside");

  mkdirSync(outside);
  mkdirSync(join(options.target, ".agents/workflow"), { recursive: true });
  symlinkSync(outside, join(options.target, ".agents/workflow/rust"));
  expect(() =>
    WorkflowInstaller.apply(WorkflowInstaller.plan({ ...options, profiles: ["rust"] })),
  ).toThrow();
  expect(readdirSync(outside)).toEqual([]);
});
