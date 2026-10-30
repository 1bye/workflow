# Workspace

Read this when launching the workbench or working with project files and saved tweaks.

## Launch

With Node.js 22.12 or newer, install the skill's locked dependencies once, then launch:

```sh
npm --prefix <skill-dir> ci
npm --prefix <skill-dir> run dev -- <project-dir>
```

Open the printed local URL. The default port is 4317; append `--port 4320` when
that port is busy. Stop the process when the preview is no longer needed.

## Project files

On first use the launcher creates:

```text
<project-dir>/.component-lab/
├── components/
│   ├── pin/
│   └── controls-demo/
├── tsconfig.json
└── settings.json
```

Existing workspaces and TypeScript configs are preserved. Put project component
drafts and assets here; the React shell and schema API stay in the skill.
Use TypeScript schemas and TSX components. Older JavaScript drafts need conversion
to the typed schema and entry format described in [Components](components.md).

Vite handles TSX and hot updates. Tailwind scans the shell and project draft folder.
Local assets can be imported through Vite or referenced under `/drafts/`, which
maps to the `.component-lab/` directory. Project-specific styles/providers and
timeline support remain deferred.

## Persistence

`settings.json` supplies starting values. Control values and component selection
autosave in browser local storage, separately for each project. Interface theme
and panel sizes are also remembered. Autosave does not rewrite component source
or `settings.json`; transfer chosen values into source defaults when needed.
Action callbacks and clicks are excluded from saved settings.

## Validation

```sh
npm --prefix <skill-dir> run check-types
npm --prefix <skill-dir> test
npm --prefix <skill-dir> run build
```

The build checks the bundled example. For project drafts, also run the skill's
TypeScript compiler against `<project-dir>/.component-lab/tsconfig.json` and check
the live preview. See [SVG thumbnails](thumbnails.md) when verifying component tiles.
