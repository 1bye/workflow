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

## Composition

Aim for a canvas a person would sketch on paper to explain the system: the
first canvas shows about two levels at once, and each later canvas tells one
part of the story. Pick each node's `display` deliberately:

- **`frame`** when its parts are the point of this level and there are 2–5 of
  them. Example: a relay server shown open with its parts inside.
- **`sections`** when a unit is split into areas that sit side by side, such as
  `API` | `Runtime` inside a relay.
- **`chips`** for 2–8 simple leaves that only need naming: plugins, skills,
  MCP; or conversations, memory, teams, crons, triggers.
- **`choice`** for interchangeable implementations behind one role: engine
  is Pi or Codex or ACP; environment is local or sandboxed VM.
- **`box`** (default) when the inside is large or secondary; the user clicks
  to open it as its own canvas.
- **`count`** on anything that runs as several instances (worker processes,
  bots, tenants, shards) so the canvas shows them as several boxes.

## Modeling rules

- **Names.** Use the system's own vocabulary from docs, package names, and
  code. Never add wrapper nodes the system does not have (such as "host" or
  "backend") just to group things; use a `frame` only for a real unit.
- **Levels.** Each canvas holds 3–9 visible units, counting what open frames
  show. Give a closed `box` children only when its inside has at least 3 parts
  worth showing. Depth follows the target: a workspace may go system →
  package → module → class; a class may go class → methods.
- **Shared things.** A shared resource (database, registry, shared package)
  sits beside the things that use it, never inside one of them, and each user
  connects to it.
- **Ownership.** Each node lives under exactly one parent, at the level where
  its users meet.
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
