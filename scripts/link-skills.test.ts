/**
 * Covers: global skill discovery, previews, reruns, backups, and CLI validation.
 * Real: CLI, repository skills, symlinks, and an isolated temporary home.
 * Doubles: none.
 * Requires: Bun and filesystem symlink support; no network.
 */
import { afterEach, expect, test } from "bun:test";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repository = resolve(import.meta.dir, "..");
const homes: string[] = [];

afterEach(() => {
  for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true });
});

function fixture() {
  const home = mkdtempSync(join(tmpdir(), "workflow-link-skills-"));

  homes.push(home);

  const run = (...args: string[]) =>
    Bun.spawnSync({
      cmd: [process.execPath, join(repository, "scripts/link-skills.ts"), ...args],
      cwd: tmpdir(),
      env: { ...process.env, HOME: home, USERPROFILE: home },
    });

  return { home, run };
}

test("preview writes nothing; linking includes every skill and reruns change nothing", () => {
  const { home, run } = fixture();
  const preview = run("--dry-run");

  expect(preview.exitCode).toBe(0);
  expect(preview.stdout.toString()).toContain("Preview:");
  expect(readdirSync(home)).toEqual([]);
  const installed = run();

  expect(installed.exitCode).toBe(0);
  const targets = [...installed.stdout.toString().matchAll(/^Link (.+) -> (.+)$/gm)];

  expect(targets.length).toBeGreaterThan(0);

  for (const [, target, source] of targets) {
    expect(lstatSync(target!).isSymbolicLink()).toBe(true);
    expect(realpathSync(target!)).toBe(realpathSync(source!));
    expect(existsSync(join(target!, "SKILL.md"))).toBe(true);
  }

  for (const root of ["skills", "ts/skills", "rust/skills"]) {
    for (const name of readdirSync(join(repository, root))) {
      if (!existsSync(join(repository, root, name, "SKILL.md"))) continue;

      expect(realpathSync(join(home, ".agents/skills", name))).toBe(
        join(repository, root, name),
      );
    }
  }

  const repeated = run();

  expect(repeated.exitCode).toBe(0);
  expect(repeated.stdout.toString()).toContain("0 links");
  expect(existsSync(join(home, ".local"))).toBe(false);
});

test("preserves existing folders, dangling links, and unrelated skills", () => {
  const { home, run } = fixture();
  const root = join(home, ".claude/skills");

  mkdirSync(join(root, "atlas"), { recursive: true });
  writeFileSync(join(root, "atlas/SKILL.md"), "custom skill");
  writeFileSync(join(root, "unrelated"), "keep me");
  symlinkSync(join(home, "missing"), join(root, "bro"), "dir");
  expect(run("--dry-run").exitCode).toBe(0);
  expect(readFileSync(join(root, "atlas/SKILL.md"), "utf8")).toBe("custom skill");
  expect(existsSync(join(home, ".local"))).toBe(false);
  expect(run().exitCode).toBe(0);
  const backups = join(home, ".local/state/workflow-skill-backups");
  const [batch] = readdirSync(backups);

  expect(readFileSync(join(backups, batch!, ".claude/skills/atlas/SKILL.md"), "utf8")).toBe(
    "custom skill",
  );
  expect(lstatSync(join(backups, batch!, ".claude/skills/bro")).isSymbolicLink()).toBe(true);
  expect(readFileSync(join(root, "unrelated"), "utf8")).toBe("keep me");
});

test("help and invalid arguments do not write files", () => {
  const { home, run } = fixture();

  expect(run("--help").exitCode).toBe(0);
  expect(run("--unknown").exitCode).toBe(1);
  expect(run("unexpected-target").exitCode).toBe(1);
  expect(readdirSync(home)).toEqual([]);
});
