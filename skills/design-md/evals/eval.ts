/**
 * Eval harness for the design-md skill. Runs each case through Codex in a
 * fresh working copy, then scores the output with deterministic checks.
 *
 *   bun skills/design-md/evals/eval.ts run [--case <id>] [--model <id>]
 *   bun skills/design-md/evals/eval.ts score <case> <workdir> [<final message file>]
 *
 * Cases live in cases/<id>/ (committed) and cases-private/<id>/ (gitignored,
 * for client designs). Each has case.json and an optional source/ folder.
 */
import { spawnSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = import.meta.dir;
const skillDir = join(root, "..");
const runsDir = join(root, "runs");
const caseRoots = [join(root, "cases"), join(root, "cases-private")];

type Terms = (string | string[])[];
type Fact = { id: string; must: Terms; why?: string };
type Case = { prompt: string; noInventedColors: boolean; facts: Fact[]; report: Fact[]; todos: boolean };
type Check = { name: string; pass: boolean; detail: string };

function findCase(id: string) {
  for (const base of caseRoots) {
    const dir = join(base, id);
    if (existsSync(join(dir, "case.json"))) return dir;
  }
  throw new Error(`unknown case ${id}`);
}

function allCases() {
  return caseRoots.flatMap((base) =>
    existsSync(base) ? readdirSync(base).filter((id) => existsSync(join(base, id, "case.json"))) : [],
  );
}

function skillHash() {
  const hash = createHash("sha256");
  const walk = (dir: string) => {
    for (const name of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (name.name === "evals") continue;
      const path = join(dir, name.name);
      if (name.isDirectory()) walk(path);
      else hash.update(name.name).update(readFileSync(path));
    }
  };
  walk(skillDir);
  return hash.digest("hex").slice(0, 8);
}

const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : "");

function hexes(text: string) {
  const found = new Set<string>();
  for (const [, raw] of text.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const hex = raw!.length === 3 ? [...raw!].map((c) => c + c).join("") : raw!;
    found.add(hex.toLowerCase());
  }
  return found;
}

function hasTerms(text: string, must: Terms) {
  const lower = text.toLowerCase();
  return must.every((term) => (Array.isArray(term) ? term : [term]).some((alt) => lower.includes(alt.toLowerCase())));
}

function sourceText(dir: string) {
  const source = join(dir, "source");
  if (!existsSync(source)) return "";
  return readdirSync(source).map((name) => read(join(source, name))).join("\n");
}

export function score(caseId: string, work: string, finalFile?: string) {
  const dir = findCase(caseId);
  const spec: Case = JSON.parse(read(join(dir, "case.json")));
  const design = read(join(work, "DESIGN.md"));
  const components = read(join(work, "COMPONENTS.md"));
  const final = finalFile ? read(finalFile) : "";
  const output = `${design}\n${components}`;
  const checks: Check[] = [];

  checks.push({ name: "DESIGN.md exists", pass: design.length > 0, detail: "" });
  checks.push({ name: "COMPONENTS.md exists", pass: components.length > 0, detail: "" });

  if (design) {
    const lint = spawnSync("npx", ["-y", "@google/design.md", "lint", "DESIGN.md"], { cwd: work, encoding: "utf8" });
    try {
      const result = JSON.parse(lint.stdout);
      const warnings = result.findings.filter((f: { severity: string }) => f.severity === "warning");
      checks.push({ name: "lint: no errors", pass: result.summary.errors === 0, detail: `${result.summary.errors} errors` });
      checks.push({
        name: "lint: warnings",
        pass: true,
        detail: warnings.map((f: { rule: string; path?: string }) => `${f.rule}:${f.path ?? ""}`).join(", ") || "none",
      });
    } catch {
      checks.push({ name: "lint: no errors", pass: false, detail: (lint.stderr || lint.stdout).slice(0, 200) });
    }
  }

  if (design && components) {
    const cross = spawnSync("node", [join(skillDir, "scripts", "crosscheck.mjs"), "DESIGN.md", "COMPONENTS.md"], {
      cwd: work,
      encoding: "utf8",
    });
    checks.push({ name: "crosscheck passes", pass: cross.status === 0, detail: cross.stdout.trim().split("\n").at(-1) ?? "" });
  }

  const missing = spec.facts.filter((fact) => !hasTerms(output, fact.must)).map((fact) => fact.id);
  checks.push({
    name: "facts kept",
    pass: missing.length === 0,
    detail: `${spec.facts.length - missing.length}/${spec.facts.length}${missing.length ? ` missing: ${missing.join(", ")}` : ""}`,
  });

  if (spec.noInventedColors) {
    const allowed = hexes(sourceText(dir));
    // Only normative values count: front matter tokens and COMPONENTS.md. Prose may
    // legitimately show derived colors, such as alpha layers composited for a contrast check.
    const tokens = design.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const invented = [...hexes(`${tokens}\n${components}`)].filter((hex) => !allowed.has(hex));
    checks.push({ name: "no invented token colors", pass: invented.length === 0, detail: invented.map((h) => `#${h}`).join(", ") || "none" });
  }

  if (spec.todos) {
    const count = (output.match(/TODO\(confirm\)/g) ?? []).length;
    checks.push({ name: "gaps marked TODO(confirm)", pass: count > 0, detail: `${count}` });
  }

  for (const finding of spec.report) {
    checks.push({ name: `reported: ${finding.id}`, pass: hasTerms(final, finding.must), detail: finding.why ?? "" });
  }

  const passed = checks.filter((check) => check.pass).length;
  return { case: caseId, passed, total: checks.length, checks };
}

function runCodex(prompt: string, work: string, out: string, model: string) {
  return new Promise<number>((resolve) => {
    const args = [
      "exec",
      "-m", model,
      "-C", work,
      "-s", "workspace-write",
      "-c", "sandbox_workspace_write.network_access=true",
      "--skip-git-repo-check",
      "--json",
      "-o", join(out, "final.md"),
      prompt,
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

async function run(args: string[]) {
  const only = args.includes("--case") ? args[args.indexOf("--case") + 1] : undefined;
  const model = args.includes("--model") ? args[args.indexOf("--model") + 1]! : "gpt-6.1-sol";
  const ids = only ? [only] : allCases();
  const stamp = `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}-${skillHash()}-${model}`;
  const runDir = join(runsDir, stamp);

  const results = await Promise.all(
    ids.map(async (id) => {
      const dir = findCase(id);
      const spec: Case = JSON.parse(read(join(dir, "case.json")));
      const out = join(runDir, id);
      mkdirSync(out, { recursive: true });
      // Work outside the repository so the agent only sees the installed copy.
      const work = mkdtempSync(join(tmpdir(), `design-md-${id}-`));
      if (existsSync(join(dir, "source"))) cpSync(join(dir, "source"), join(work, "source"), { recursive: true });
      const installed = join(work, ".agents", "skills", "design-md");
      mkdirSync(installed, { recursive: true });
      for (const name of readdirSync(skillDir)) {
        if (name !== "evals") cpSync(join(skillDir, name), join(installed, name), { recursive: true });
      }
      const prompt = `Use the design-md skill at .agents/skills/design-md/SKILL.md.\n\n${spec.prompt}`;
      const started = Date.now();
      const code = await runCodex(prompt, work, out, model);
      cpSync(work, join(out, "work"), { recursive: true });
      const result = { ...score(id, join(out, "work"), join(out, "final.md")), exit: code, seconds: Math.round((Date.now() - started) / 1000) };
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
else if (command === "score") {
  const [caseId, work, finalFile] = rest;
  console.log(JSON.stringify(score(caseId!, work!, finalFile), null, 2));
} else {
  console.log("usage: eval.ts run [--case <id>] [--model <id>] | score <case> <workdir> [final.md]");
}
