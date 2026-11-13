/**
 * Eval harness for the component-craft skill. Copies a fixture app into a fresh
 * working dir outside the repository, installs the skill, runs Codex, then
 * scores the checklist, the component source, the typecheck, and the report.
 *
 *   bun skills/component-craft/evals/eval.ts run [--case <id>] [--model <id>]
 *   bun skills/component-craft/evals/eval.ts score <case> <workdir> [<final message file>]
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = import.meta.dir;
const skillDir = join(root, "..");
const runsDir = join(root, "runs");
const cacheDir = join(root, ".cache");
const casesDir = join(root, "cases");

type Terms = (string | string[])[];
type Case = {
  fixture: string;
  prompt: string;
  component: string;
  /** Per call site, terms of which one must appear in the checklist audit (file stem or feature name). */
  callSiteKeys: string[][];
  checklist: { mode: string; kind: string[] };
  /** Passes when the code matches `any`, or when the checklist records a decision mentioning `record`. */
  code: { id: string; any: string[]; record?: string[] }[];
  forbidden: { id: string; pattern: string }[];
  /** Paths the agent must not create (scope creep), relative to the working dir. */
  forbiddenPaths?: string[];
  report: { id: string; must: Terms; minBullets?: number }[];
};
type Check = { name: string; pass: boolean; detail: string };

const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : "");
const loadCase = (id: string): Case => JSON.parse(read(join(casesDir, id, "case.json")));

function hasTerms(text: string, must: Terms) {
  const lower = text.toLowerCase();
  return must.every((term) => (Array.isArray(term) ? term : [term]).some((alt) => lower.includes(alt.toLowerCase())));
}

function skillHash() {
  const hash = createHash("sha256");
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === "evals") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else hash.update(entry.name).update(readFileSync(path));
    }
  };
  walk(skillDir);
  return hash.digest("hex").slice(0, 8);
}

/** Installs fixture dependencies once per package.json and returns the node_modules path. */
function fixtureModules(fixture: string) {
  const pkg = read(join(root, "fixtures", fixture, "package.json"));
  const key = createHash("sha256").update(pkg).digest("hex").slice(0, 12);
  const dir = join(cacheDir, `${fixture}-${key}`);
  if (!existsSync(join(dir, "node_modules"))) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), pkg);
    const install = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts"], { cwd: dir, stdio: "inherit" });
    if (install.status !== 0) throw new Error(`npm install failed for fixture ${fixture}`);
  }
  return join(dir, "node_modules");
}

function findChecklist(work: string) {
  const base = join(work, ".component-craft");
  if (!existsSync(base)) return { path: "", text: "" };
  for (const name of readdirSync(base)) {
    const path = join(base, name, "checklist.md");
    if (existsSync(path)) return { path: `.component-craft/${name}/checklist.md`, text: read(path) };
  }
  return { path: "", text: "" };
}

export function score(caseId: string, workDir: string, finalFile?: string) {
  const work = resolve(workDir);
  const spec = loadCase(caseId);
  const checks: Check[] = [];
  const final = finalFile ? read(finalFile) : "";

  // Checklist.
  const checklist = findChecklist(work);
  checks.push({ name: "checklist file exists", pass: checklist.text.length > 0, detail: checklist.path || "none" });
  if (checklist.text) {
    const lower = checklist.text.toLowerCase();
    checks.push({ name: `checklist: mode ${spec.checklist.mode}`, pass: /mode:\s*\**\s*remake/i.test(checklist.text), detail: "" });
    checks.push({ name: "checklist: kind", pass: spec.checklist.kind.some((kind) => lower.includes(kind)), detail: "" });

    const items = checklist.text.split("\n").filter((line) => /^\s*-\s*\[[ x~>\-]\]/i.test(line));
    const open = items.filter((line) => /^\s*-\s*\[[ ~]\]/.test(line));
    checks.push({ name: "checklist: no open items", pass: open.length === 0, detail: `${items.length} items, ${open.length} open` });

    // Skipped or deferred items need a reason after the guide reference.
    const unexplained = items
      .filter((line) => /^\s*-\s*\[[>\-]\]/.test(line))
      .filter((line) => {
        const tail = line.slice(line.lastIndexOf(")") + 1).replace(/[—–:\-\s]+/, " ").trim();
        const words = tail.split(/\s+/).filter(Boolean).length;
        return words < 3 && !/because|n\/a|not applicable|reason/i.test(line);
      });
    checks.push({
      name: "checklist: skipped items explained",
      pass: unexplained.length === 0,
      detail: unexplained.map((line) => line.trim().slice(0, 60)).join(" | ") || "ok",
    });

    const missingSites = spec.callSiteKeys.filter((keys) => !keys.some((key) => lower.includes(key.toLowerCase())));
    checks.push({
      name: "checklist: audit lists every call site",
      pass: missingSites.length === 0,
      detail: missingSites.map((keys) => keys[0]).join(", ") || `${spec.callSiteKeys.length}/${spec.callSiteKeys.length}`,
    });
  }

  // Component source.
  const source = read(join(work, spec.component));
  checks.push({ name: "component exists", pass: source.length > 0, detail: spec.component });
  const record = checklist.text.toLowerCase();
  for (const rule of spec.code) {
    const inCode = rule.any.some((pattern) => new RegExp(pattern).test(source));
    const recorded = !inCode && (rule.record ?? []).some((term) => record.includes(term.toLowerCase()));
    checks.push({ name: `handled: ${rule.id}`, pass: inCode || recorded, detail: inCode ? "in code" : recorded ? "recorded decision" : "" });
  }
  for (const rule of spec.forbidden) {
    const match = source.match(new RegExp(rule.pattern));
    checks.push({ name: `code: no ${rule.id}`, pass: !match, detail: match?.[0] ?? "" });
  }
  for (const path of spec.forbiddenPaths ?? []) {
    checks.push({ name: `scope: did not create ${path}`, pass: !existsSync(join(work, path)), detail: "" });
  }
  const stillShadcn = /shadow-xs/.test(source) && /rounded-md/.test(source) && /h-9/.test(source);
  checks.push({ name: "code: actually changed from stock shadcn", pass: source.length > 0 && !stillShadcn, detail: "" });

  // Every call site still typechecks against the new API. Saved runs omit node_modules.
  if (!existsSync(join(work, "node_modules"))) symlinkSync(fixtureModules(spec.fixture), join(work, "node_modules"), "dir");
  const tsc = spawnSync(join(work, "node_modules", ".bin", "tsc"), ["--noEmit", "-p", "."], { cwd: work, encoding: "utf8" });
  const errors = (tsc.stdout.match(/error TS/g) ?? []).length;
  checks.push({ name: "typecheck passes", pass: tsc.status === 0, detail: tsc.status === 0 ? "" : `${errors} errors: ${tsc.stdout.split("\n")[0]}` });

  // Final message.
  const bullets = final.split("\n").filter((line) => /^\s*(?:[-*+]|\d+[.)])\s+\S/.test(line)).length;
  for (const finding of spec.report) {
    const enough = bullets >= (finding.minBullets ?? 0);
    checks.push({
      name: `report: ${finding.id}`,
      pass: hasTerms(final, finding.must) && enough,
      detail: finding.minBullets ? `${bullets} bullets` : "",
    });
  }

  const passed = checks.filter((check) => check.pass).length;
  return { case: caseId, passed, total: checks.length, checks };
}

function runCodex(prompt: string, work: string, out: string, model: string) {
  return new Promise<number>((resolve) => {
    const args = [
      "exec", "-m", model, "-C", work, "-s", "workspace-write",
      "--skip-git-repo-check", "--json", "-o", join(out, "final.md"), prompt,
    ];
    const child = spawn("codex", args, { stdio: ["ignore", "pipe", "pipe"] });
    const events: Buffer[] = [];
    child.stdout.on("data", (chunk) => events.push(chunk));
    child.stderr.on("data", (chunk) => events.push(chunk));
    child.on("close", (code) => {
      writeFileSync(join(out, "events.jsonl"), Buffer.concat(events));
      resolve(code ?? 1);
    });
  });
}

function prepare(id: string) {
  const spec = loadCase(id);
  const work = mkdtempSync(join(tmpdir(), `component-craft-${id}-`));
  cpSync(join(root, "fixtures", spec.fixture), work, { recursive: true });
  symlinkSync(fixtureModules(spec.fixture), join(work, "node_modules"), "dir");
  const installed = join(work, ".agents", "skills", "component-craft");
  mkdirSync(installed, { recursive: true });
  for (const name of readdirSync(skillDir)) {
    if (name !== "evals") cpSync(join(skillDir, name), join(installed, name), { recursive: true });
  }
  // A git baseline lets reviewers diff what the agent changed.
  spawnSync("git", ["init", "-q"], { cwd: work });
  spawnSync("git", ["add", "-A"], { cwd: work });
  spawnSync("git", ["-c", "user.name=eval", "-c", "user.email=eval@example.invalid", "commit", "-qm", "baseline"], { cwd: work });
  return { spec, work };
}

async function run(args: string[]) {
  const only = args.includes("--case") ? args[args.indexOf("--case") + 1] : undefined;
  const model = args.includes("--model") ? args[args.indexOf("--model") + 1]! : "gpt-6.1-sol";
  const ids = only ? [only] : readdirSync(casesDir).filter((id) => existsSync(join(casesDir, id, "case.json")));
  const stamp = `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}-${skillHash()}-${model}`;
  const runDir = join(runsDir, stamp);

  const results = await Promise.all(
    ids.map(async (id) => {
      const out = join(runDir, id);
      mkdirSync(out, { recursive: true });
      const { spec, work } = prepare(id);
      const prompt = `Use the component-craft skill at .agents/skills/component-craft/SKILL.md.\n\n${spec.prompt}`;
      const started = Date.now();
      const code = await runCodex(prompt, work, out, model);
      writeFileSync(join(out, "diff.patch"), spawnSync("git", ["diff", "HEAD"], { cwd: work, encoding: "utf8" }).stdout);
      spawnSync("git", ["add", "-A"], { cwd: work });
      writeFileSync(join(out, "new-files.txt"), spawnSync("git", ["diff", "--cached", "--name-status", "HEAD"], { cwd: work, encoding: "utf8" }).stdout);
      cpSync(work, join(out, "work"), { recursive: true, filter: (path) => !path.endsWith("node_modules") && !path.includes("/.git") });
      const result = { ...score(id, work, join(out, "final.md")), exit: code, seconds: Math.round((Date.now() - started) / 1000), work };
      writeFileSync(join(out, "score.json"), JSON.stringify(result, null, 2));
      return result;
    }),
  );

  writeFileSync(join(runDir, "scores.json"), JSON.stringify(results, null, 2));
  for (const result of results) {
    console.log(`\n${result.case}: ${result.passed}/${result.total} (exit ${result.exit}, ${result.seconds}s)`);
    for (const check of result.checks) console.log(`  ${check.pass ? "pass" : "FAIL"}  ${check.name}  ${check.detail}`);
  }
  console.log(`\nrun: ${runDir}`);
}

const [command, ...rest] = process.argv.slice(2);
if (command === "run") await run(rest);
else if (command === "prepare") console.log(prepare(rest[0]!).work);
else if (command === "score") {
  const [caseId, work, finalFile] = rest;
  console.log(JSON.stringify(score(caseId!, work!, finalFile), null, 2));
} else {
  console.log("usage: eval.ts run [--case <id>] [--model <id>] | prepare <case> | score <case> <workdir> [final.md]");
}
