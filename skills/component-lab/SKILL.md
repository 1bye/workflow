---
name: component-lab
description: Open a local workbench for previewing and tweaking draft UI components side by side. Use when the user wants a component playground with a component picker, live controls, and multiple visible states.
---

# Component Lab

The prototype uses TypeScript, Vite, React, and Tailwind. With Node.js 22.12 or newer,
install its locked dependencies once, then launch it:

```sh
npm --prefix <skill-dir> ci
npm --prefix <skill-dir> run dev -- <project-dir>
```

Open the printed local URL. Use `--port 4320` if the default port, 4317, is busy.
Stop the process when the preview is no longer needed.

The launcher creates `.component-lab/` in the project on first use, with pin and
controls examples, a TypeScript config, and `settings.json`. Existing workspaces are
preserved. The shell and schema implementation stay bundled in this skill.

Components are discovered at `components/**/index.ts`. Define controls with
`Schema.Component` and `Schema.Control` from `@local`, infer component props
with `Schema.Props<typeof schema>`, and export `schema.from(Component)` from
the entry. See [pin.schema.ts](assets/workspace/components/pin/pin.schema.ts),
[Pin.tsx](assets/workspace/components/pin/Pin.tsx), and
[index.ts](assets/workspace/components/pin/index.ts).

Controls are keyed by prop name. Number, Color, Boolean, Text, and Select
builders provide defaults; `label` and `hidden` configure the tweaks panel.
Named states override shared props. IDs default to the entry's path inside
`components/` (for example `maps/pin`); an optional explicit `id` preserves
identity when moving files. Duplicate IDs are errors.

Vite handles TSX and hot updates; Tailwind scans both the shell and the project
draft folder. Controls and component selection save
automatically in browser local storage, separately for each project. Theme and
panel sizes are also remembered. `settings.json` supplies starting values.

Existing workspaces are never overwritten. Older JavaScript drafts need to be
converted to the typed schema and entry format. Project-specific styles/providers
and timeline support are deferred.

For validation, run `npm --prefix <skill-dir> run check-types`,
`npm --prefix <skill-dir> test`, and
`npm --prefix <skill-dir> run build`. The build checks the bundled example;
the launcher serves the selected project's drafts.
