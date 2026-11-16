import { randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  renameSync,
  symlinkSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

// Global paths: https://github.com/vercel-labs/skills/blob/main/docs/agents.md
const destinations = [
  ".agents/skills",
  ".codex/skills",
  ".claude/skills",
  ".cursor/skills",
  ".copilot/skills",
  ".gemini/skills",
  ".gemini/config/skills",
  ".codeium/windsurf/skills",
  ".config/opencode/skills",
  ".config/agents/skills",
  ".continue/skills",
  ".roo/skills",
  ".kilo/skills",
  ".kiro/skills",
  ".augment/skills",
  ".factory/skills",
];

function main() {
  const { values } = parseArgs({
    options: { "dry-run": { type: "boolean" }, help: { type: "boolean" } },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(
      "Usage: bun run link-skills [--dry-run]\nLink every repository skill globally; existing entries are backed up.",
    );

    return;
  }

  const repository = resolve(import.meta.dir, "..");
  const home = homedir();

  const sources = ["skills", "ts/skills", "rust/skills"].flatMap((root) =>
    readdirSync(join(repository, root), { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() && existsSync(join(repository, root, entry.name, "SKILL.md")),
      )
      .map((entry) => ({
        name: entry.name,
        path: join(repository, root, entry.name),
      })),
  );

  if (!sources.length || new Set(sources.map(({ name }) => name)).size !== sources.length) {
    throw new Error("Expected repository skills with unique directory names.");
  }

  const backupRoot = join(home, ".local/state/workflow-skill-backups", randomUUID());

  let linked = 0;
  let unchanged = 0;
  let backedUp = 0;

  for (const destination of destinations) {
    for (const source of sources) {
      const target = join(home, destination, source.name);
      const existing = lstatSync(target, { throwIfNoEntry: false });

      if (
        existing?.isSymbolicLink() &&
        existsSync(target) &&
        realpathSync(target) === realpathSync(source.path)
      ) {
        unchanged++;
        continue;
      }

      if (existing) {
        const backup = join(backupRoot, destination, source.name);

        console.log(`Backup ${target} -> ${backup}`);

        if (!values["dry-run"]) {
          mkdirSync(dirname(backup), { recursive: true });
          renameSync(target, backup);
        }

        backedUp++;
      }

      console.log(`Link ${target} -> ${source.path}`);

      if (!values["dry-run"]) {
        mkdirSync(dirname(target), { recursive: true });
        symlinkSync(source.path, target, "dir");
      }

      linked++;
    }
  }

  console.log(
    `${values["dry-run"] ? "Preview" : "Done"}: ${sources.length} skills, ${destinations.length} global directories; ${linked} links, ${unchanged} unchanged, ${backedUp} backups.`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
