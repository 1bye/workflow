/**
 * Eval harness for the restructure skill.
 *
 *   bun skills/restructure/evals/eval.ts run [--case <id>] [--judge]
 *   bun skills/restructure/evals/eval.ts score <case> <output.md>
 *   bun skills/restructure/evals/eval.ts rate <run> <case> <1-5> "<note>" [--golden]
 *   bun skills/restructure/evals/eval.ts report
 */
import { createHash } from "node:crypto";
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = import.meta.dir;
const casesDir = join(root, "cases");
const runsDir = join(root, "runs");
const ratingsFile = join(root, "ratings.jsonl");
const skillFile = join(root, "..", "SKILL.md");
const model = process.env.EVAL_MODEL ?? "sonnet";

type Fact = { id: string; must: (string | string[])[] };
type Check = { name: string; pass: boolean; detail: string };

export type Score = {
  case: string;
  score: number;
  facts: { kept: number; total: number; missing: string[] };
  checks: Check[];
  judge?: Record<string, unknown>;
};

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;
const normalize = (text: string) => text.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[`*_]/g, "");

/** Numbers with an optional unit; list markers like "3." at line start are not facts. */
function numbers(text: string) {
  const body = text.replace(/^\s*(?:#+\s*)?\d+[.)]\s/gm, "");
  return new Set(body.match(/\d+(?:\.\d+)?(?:px|ms|fr|%|rem|em)?/g) ?? []);
}

function codeBlocks(text: string) {
  return [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((match) => match[1]!.trim());
}

/** Longest run of words in one paragraph or one bullet, ignoring code. */
function longestBlock(text: string) {
  const blocks = text.replace(/```[\s\S]*?```/g, "").split(/\n\s*\n|\n(?=\s*(?:[-*+]|\d+[.)]|#+|\|)\s)/);
  return Math.max(0, ...blocks.map(words));
}

/** 6-word sequences that occur more often in the output than in the input: restated facts. */
function repeats(input: string, output: string) {
  const counts = (text: string) => {
    const tokens = normalize(text.replace(/```[\s\S]*?```/g, "")).match(/[a-z0-9$%.'-]+/g) ?? [];
    const map = new Map<string, number>();
    for (let i = 0; i + 6 <= tokens.length; i++) {
      const key = tokens.slice(i, i + 6).join(" ");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  };
  const before = counts(input);
  return [...counts(output)].filter(([key, n]) => n > Math.max(1, before.get(key) ?? 0)).map(([key]) => key);
}

export function score(caseId: string, input: string, output: string): Score {
  const { facts } = JSON.parse(readFileSync(join(casesDir, caseId, "facts.json"), "utf8")) as { facts: Fact[] };
  const out = normalize(output);

  const missing = facts.filter((fact) =>
    !fact.must.every((term) => [term].flat().some((alt) => out.includes(normalize(alt))))).map((fact) => fact.id);

  const inNumbers = numbers(input);
  const outNumbers = numbers(output);
  const lostNumbers = [...inNumbers].filter((n) => !outNumbers.has(n));
  const newNumbers = [...outNumbers].filter((n) => !inNumbers.has(n));
  const lostCode = codeBlocks(input).filter((block) => !output.includes(block));
  const ratio = words(output) / words(input);
  const longest = longestBlock(output);
  const firstLine = output.trim().split("\n")[0] ?? "";
  const repeated = repeats(input, output.trim().split("\n").slice(1).join("\n")); // the bottom line restates by design

  const checks: Check[] = [
    { name: "numbers kept", pass: lostNumbers.length === 0, detail: lostNumbers.join(", ") || "all" },
    { name: "no new numbers", pass: newNumbers.length === 0, detail: newNumbers.join(", ") || "none" },
    { name: "code verbatim", pass: lostCode.length === 0, detail: `${lostCode.length} block(s) changed` },
    { name: "length 0.75-1.4x", pass: ratio >= 0.75 && ratio <= 1.4, detail: ratio.toFixed(2) },
    { name: "block <= 45 words", pass: longest <= 45, detail: `${longest}` },
    { name: "bottom line first", pass: words(firstLine) <= 45 && !firstLine.startsWith("#"), detail: `${words(firstLine)} words` },
    { name: "no repeated facts", pass: repeated.length === 0, detail: repeated.slice(0, 3).join(" | ") },
    { name: "has structure", pass: /^\s*(?:#+|[-*]|\d+\.|\|)\s/m.test(output), detail: "" },
    { name: "no preamble", pass: !/^(here('s| is)|sure|certainly|great question)/i.test(output.trim()), detail: "" },
  ];

  const factScore = (facts.length - missing.length) / facts.length;
  const checkScore = checks.filter((check) => check.pass).length / checks.length;

  return {
    case: caseId,
    score: Math.round((factScore * 0.7 + checkScore * 0.3) * 100),
    facts: { kept: facts.length - missing.length, total: facts.length, missing },
    checks,
  };
}

async function claude(prompt: string) {
  const proc = Bun.spawn(["claude", "-p", "--model", model], { stdin: new Blob([prompt]), stdout: "pipe", stderr: "inherit" });
  const text = await new Response(proc.stdout).text();

  if ((await proc.exited) !== 0) throw new Error("claude -p failed");
  return text.trim();
}

async function judge(caseId: string, input: string, output: string) {
  const rubric = readFileSync(join(root, "rubric.md"), "utf8");
  const golden = join(casesDir, caseId, "golden.md");
  const reference = existsSync(golden) ? `\n\n<golden>\n${readFileSync(golden, "utf8")}\n</golden>` : "";
  const reply = await claude(`${rubric}\n\n<input>\n${input}\n</input>\n\n<output>\n${output}\n</output>${reference}`);

  try {
    return JSON.parse(reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1)) as Record<string, unknown>;
  } catch {
    return { unparsed: reply };
  }
}

const skillHash = () => createHash("sha256").update(readFileSync(skillFile)).digest("hex").slice(0, 8);
const caseIds = () => readdirSync(casesDir).filter((id) => existsSync(join(casesDir, id, "input.md"))).sort();
const flag = (args: string[], name: string) => args.includes(name);
const option = (args: string[], name: string) => args[args.indexOf(name) + 1];

function print(scores: Score[]) {
  for (const result of scores) {
    const failed = result.checks.filter((check) => !check.pass).map((check) => `${check.name} (${check.detail})`);
    console.log(`${result.case.padEnd(20)} ${String(result.score).padStart(3)}  facts ${result.facts.kept}/${result.facts.total}`);
    if (result.facts.missing.length) console.log(`  missing facts: ${result.facts.missing.join(", ")}`);
    if (failed.length) console.log(`  failed checks: ${failed.join("; ")}`);
    if (result.judge) console.log(`  judge: ${JSON.stringify(result.judge)}`);
  }
}

async function run(args: string[]) {
  const skill = readFileSync(skillFile, "utf8");
  const ids = flag(args, "--case") ? [option(args, "--case")!] : caseIds();
  const runId = `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}-${skillHash()}`;
  const dir = join(runsDir, runId);
  mkdirSync(dir, { recursive: true });

  const scores = await Promise.all(ids.map(async (id) => {
    const input = readFileSync(join(casesDir, id, "input.md"), "utf8");
    const output = await claude(`${skill}\n\n---\n\nApply the skill above. Restructure this message:\n\n<message>\n${input}\n</message>`);
    writeFileSync(join(dir, `${id}.md`), `${output}\n`);

    const result = score(id, input, output);
    if (flag(args, "--judge")) result.judge = await judge(id, input, output);
    return result;
  }));

  writeFileSync(join(dir, "scores.json"), `${JSON.stringify({ skill: skillHash(), model, scores }, null, 2)}\n`);
  print(scores);
  console.log(`\nrun ${runId}  mean ${Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)}  outputs in ${dir}`);
}

function rate(args: string[]) {
  const [runId, caseId, rating, note = ""] = args;
  const file = join(runsDir, runId!, `${caseId}.md`);
  const value = Number(rating);

  if (!existsSync(file) || !(value >= 1 && value <= 5)) throw new Error("usage: rate <run> <case> <1-5> \"<note>\" [--golden]");

  appendFileSync(ratingsFile, `${JSON.stringify({ at: new Date().toISOString(), run: runId, case: caseId, skill: runId!.split("-").at(-1), rating: value, note })}\n`);
  if (flag(args, "--golden")) copyFileSync(file, join(casesDir, caseId!, "golden.md"));
  console.log(`rated ${caseId} ${value}/5${flag(args, "--golden") ? ", saved as golden" : ""}`);
}

function report() {
  const rows = existsSync(runsDir) ? readdirSync(runsDir).filter((id) => existsSync(join(runsDir, id, "scores.json"))).sort() : [];
  const ratings = existsSync(ratingsFile)
    ? readFileSync(ratingsFile, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as { run: string; rating: number })
    : [];

  for (const id of rows) {
    const { scores } = JSON.parse(readFileSync(join(runsDir, id, "scores.json"), "utf8")) as { scores: Score[] };
    const mine = ratings.filter((entry) => entry.run === id).map((entry) => entry.rating);
    const human = mine.length ? (mine.reduce((a, b) => a + b, 0) / mine.length).toFixed(1) : "-";
    console.log(`${id}  auto ${Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)}  human ${human} (${mine.length})`);
  }
}

if (import.meta.main) {
  const [command, ...args] = process.argv.slice(2);

  if (command === "run") await run(args);
  else if (command === "score") {
    const [caseId, file] = args;
    print([score(caseId!, readFileSync(join(casesDir, caseId!, "input.md"), "utf8"), readFileSync(file!, "utf8"))]);
  } else if (command === "rate") rate(args);
  else if (command === "report") report();
  else console.log("commands: run [--case id] [--judge] | score <case> <file> | rate <run> <case> <1-5> \"note\" [--golden] | report");
}
