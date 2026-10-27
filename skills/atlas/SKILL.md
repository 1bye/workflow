---
name: atlas
description: Map a system, package, module, class, or flow into a nested drill-down canvas (an "atlas") rendered as a standalone HTML viewer. Use when asked to overview, map, diagram, or explain how a codebase or part of it is structured and how data moves through it.
---

# Atlas

Build an atlas: a nested model of the target where each box can be opened to
show its own canvas, plus optional flows that animate along the connections.
You write only a compact JSON model. The bundled viewer lays it out and renders
it; never read, edit, or regenerate the viewer.

## Workflow

1. **Scope.** Use the user's target: whole workspace, package, directory,
   class, or a named flow ("what happens when a user sends a message"). If none
   is given, map the workspace root.
2. **Explore cheaply.** Read in this order and stop once the level is clear:
   existing architecture docs and diagrams, workspace and package manifests,
   entry points, then only the files needed to confirm a connection. Prefer
   `ls`, `grep`, and manifest reads over opening source files. Do not read
   tests, generated code, lockfiles, or vendored code.
3. **Model.** Write `.atlas/<name>.json` in the target project following
   [schema.md](references/schema.md). Write it once; fix it with small edits.
4. **Render.** Run the bundled script with any of `node` or `bun`:

   ```sh
   node <skill-dir>/scripts/atlas.mjs .atlas/<name>.json
   ```

   It validates the model and writes `.atlas/<name>.html`. Fix only the errors
   it reports, then rerun. Warnings are advice, not failures.
5. **Report.** Give the HTML path and a two-line summary: top-level nodes and
   any inferred connections the user should confirm.

## Modeling rules

- **Levels.** Each canvas holds 3–9 nodes. Give a node children only when its
  inside has at least 3 parts worth showing. Depth follows the target: a
  workspace may go system → package → module → class; a class may go
  class → methods.
- **Ownership.** Each node lives under exactly one parent. A shared thing
  (database, registry, shared package) lives at the level where its users meet,
  and other nodes connect to it with edges.
- **Edges.** Connect the most specific nodes that actually talk. The viewer
  rolls edges up to the visible level, so do not repeat an edge at each level.
  Label edges with what moves: `"HTTP commands"`, `"spawn + IPC"`, `"SQL"`.
- **Evidence.** Put `src` (`path` or `path:line`, relative to the project root)
  on nodes and edges you confirmed. Mark connections taken from docs or naming
  without confirmation as `"inferred": true`. Never invent connections to fill
  a canvas.
- **Flows.** Add flows only when the user asks how something moves, or when
  one or two flows explain the system better than boxes alone. Each step goes
  from one node to another; use the deepest node you confirmed.
- **Text.** Labels are 1–4 words. `desc` is one sentence about responsibility,
  not implementation detail.
