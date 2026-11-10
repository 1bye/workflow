#!/usr/bin/env node
// Cross-checks COMPONENTS.md against DESIGN.md front matter.
// Usage: node crosscheck.mjs [DESIGN.md] [COMPONENTS.md]
// Exits 1 when a reference is broken; prints warnings for softer issues.
import { readFileSync } from "node:fs";

const [designPath = "DESIGN.md", componentsPath = "COMPONENTS.md"] = process.argv.slice(2);
const design = readFileSync(designPath, "utf8");
const components = readFileSync(componentsPath, "utf8");

const front = design.match(/^---\n([\s\S]*?)\n---/);
if (!front) {
  console.error(`${designPath}: no YAML front matter`);
  process.exit(1);
}

// Collect "group.key" for every second-level key under a top-level group.
const tokens = new Set();
const componentKeys = [];
let group = null;
for (const line of front[1].split("\n")) {
  const top = line.match(/^([A-Za-z][\w-]*):/);
  if (top) {
    group = top[1];
    continue;
  }
  const child = line.match(/^ {2}([\w-]+):/);
  if (group && child) {
    tokens.add(`${group}.${child[1]}`);
    if (group === "components") componentKeys.push(child[1]);
  }
}

let errors = 0;
const refs = new Set([...components.matchAll(/\{([a-z]+\.[\w-]+)\}/g)].map((m) => m[1]));
for (const ref of [...refs].sort()) {
  if (!tokens.has(ref)) {
    console.log(`error  broken reference {${ref}}`);
    errors++;
  }
}

for (const key of componentKeys) {
  // pair-* entries exist only so lint checks a text/background contrast pair.
  if (key.startsWith("pair-")) continue;
  if (!components.includes(`{components.${key}}`)) {
    console.log(`warn   components.${key} in DESIGN.md is not referenced by any COMPONENTS.md entry`);
  }
}

components.split("\n").forEach((line, i) => {
  if (/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/.test(line)) {
    console.log(`warn   raw color at ${componentsPath}:${i + 1}: ${line.trim()}`);
  }
});

console.log(`${refs.size} references checked, ${errors} broken`);
process.exit(errors ? 1 : 0);
