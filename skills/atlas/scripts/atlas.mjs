#!/usr/bin/env node
// Validate an atlas model and render it into the bundled viewer.
// Usage: node atlas.mjs <model.json> [-o out.html] [--root <project-dir>]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KINDS = new Set(["actor", "client", "service", "process", "package", "module", "class", "function", "db", "store", "queue", "external", "group"]);
const ID = /^[a-z0-9][a-z0-9-]*$/;

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args.splice(i, 2)[1];
};
const outArg = flag("-o");
const rootArg = flag("--root");
const modelPath = args[0];

if (!modelPath) {
  console.error("Usage: node atlas.mjs <model.json> [-o out.html] [--root <project-dir>]");
  process.exit(2);
}

const absModel = resolve(modelPath);
const projectRoot = resolve(rootArg ?? (basename(dirname(absModel)) === ".atlas" ? dirname(dirname(absModel)) : process.cwd()));
const errors = [];
const warnings = [];
let model;

try {
  model = JSON.parse(readFileSync(absModel, "utf8"));
} catch (error) {
  console.error(`error: cannot read model: ${error.message}`);
  process.exit(1);
}

const paths = new Set();
const checkSrc = (where, src) => {
  for (const s of [src].flat()) {
    if (typeof s !== "string") errors.push(`${where}: src entries must be strings`);
    else if (!existsSync(join(projectRoot, s.replace(/:\d+$/, "")))) warnings.push(`${where}: src not found: ${s}`);
  }
};

function walk(nodes, parent) {
  if (!Array.isArray(nodes)) return errors.push(`${parent || "root"}: nodes/children must be an array`);
  const seen = new Set();

  for (const n of nodes) {
    const path = parent ? `${parent}.${n?.id}` : n?.id;
    const where = `node ${path}`;

    if (!n || typeof n.id !== "string" || !ID.test(n.id)) {
      errors.push(`${where}: id must match ${ID}`);
      continue;
    }

    if (seen.has(n.id)) errors.push(`${where}: duplicate id among siblings`);
    seen.add(n.id);
    paths.add(path);

    if (typeof n.label !== "string" || !n.label) errors.push(`${where}: missing label`);
    if (!KINDS.has(n.kind)) errors.push(`${where}: kind must be one of ${[...KINDS].join(", ")}`);
    if (n.src) checkSrc(where, n.src);

    if (n.children) {
      walk(n.children, path);
      const count = n.children.length;
      if (count > 0 && count < 3) warnings.push(`${where}: only ${count} children; consider inlining them`);
      if (count > 9) warnings.push(`${where}: ${count} children; consider grouping`);
    }
  }
}

if (typeof model.title !== "string") errors.push("title: required string");
walk(model.nodes, "");
if (Array.isArray(model.nodes) && model.nodes.length > 9) warnings.push(`root: ${model.nodes.length} nodes; consider grouping`);

const ref = (where, p) => {
  if (!paths.has(p)) errors.push(`${where}: unknown node "${p}"`);
};

for (const [i, e] of (model.edges ?? []).entries()) {
  const where = `edge ${i} (${e.from} -> ${e.to})`;
  ref(where, e.from);
  ref(where, e.to);
  if (e.from === e.to) errors.push(`${where}: self edge`);
  if (e.src) checkSrc(where, e.src);
}

for (const f of model.flows ?? []) {
  if (!f.id || !f.label || !Array.isArray(f.steps) || !f.steps.length) {
    errors.push(`flow ${f.id ?? "?"}: needs id, label, and steps`);
    continue;
  }
  for (const [i, s] of f.steps.entries()) {
    ref(`flow ${f.id} step ${i + 1}`, s.from);
    ref(`flow ${f.id} step ${i + 1}`, s.to);
  }
}

for (const w of warnings) console.log(`warn: ${w}`);
for (const e of errors) console.log(`error: ${e}`);

if (errors.length) process.exit(1);

const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(here, "../viewer/index.html"), "utf8");
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const html = template
  .replace("/*__ATLAS_MODEL__*/null", () => json(model))
  .replace("/*__ATLAS_ROOT__*/null", () => json(projectRoot))
  .replace("<title>Atlas</title>", () => `<title>${model.title.replace(/[<&]/g, "")} · Atlas</title>`);
const out = resolve(outArg ?? absModel.replace(/\.json$/, "") + ".html");

writeFileSync(out, html);
const inferred = (model.edges ?? []).filter((e) => e.inferred).length;
console.log(`ok: ${paths.size} nodes, ${(model.edges ?? []).length} edges (${inferred} inferred), ${(model.flows ?? []).length} flows -> ${out}`);
