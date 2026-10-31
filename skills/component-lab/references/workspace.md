# Workspace

Read this when launching the workbench or working with project files and saved tweaks.

## Install and launch

Keep this entire skill folder together, including its lockfile, scripts, and assets.
It can live in a project's `.agents/skills/component-lab/` or a personal skills
directory. The host project does not need React, Vite, Tailwind, or a Node package
manifest: dependencies are installed inside the skill. Draft components use React
and TypeScript; host-project providers and build configuration are not imported.

With Node.js 22.12 or newer, install the skill's locked dependencies once, then launch:

```sh
npm --prefix "<skill-dir>" ci
npm --prefix "<skill-dir>" run dev -- "<project-dir>"
```

Open the printed local URL. The default port is 4317; append `--port 4320` when
that port is busy. Stop the process when the preview is no longer needed.

## Project files

On first use the launcher creates:

```text
<project-dir>/.component-lab/
├── components/
│   ├── pin/
│   ├── controls-demo/
│   └── …
├── tsconfig.json
├── tsconfig.generated.json
└── settings.json
```

Existing workspaces and TypeScript configs are preserved. Put project component
drafts and assets here; the React shell and schema API stay in the skill.
`tsconfig.json` is editable and extends `tsconfig.generated.json`, which the launcher
refreshes with the current skill paths on every launch. Keep custom compiler options
in `tsconfig.json`. Untouched configs from the earlier launcher upgrade automatically;
for an older custom config, extend `./tsconfig.generated.json` and remove its old
skill-specific `types`/`paths` entries once before relocating the skill.
Keep `tsconfig.generated.json` out of version control; launching recreates it.
Use TypeScript schemas and TSX components. Older JavaScript drafts need conversion
to the typed schema and entry format described in [Components](components.md).

Vite handles TSX and hot updates. Tailwind scans the shell and project draft folder.
Local assets can be imported through Vite or referenced under `/drafts/`, which
maps to the `.component-lab/` directory. Project-specific styles/providers and
timeline support remain deferred.

## Update

Stop the running lab, update the skill folder, run `npm ci` there again, and relaunch
it against the same project directory. With this repository's workflow installer,
rerun its recorded installation after updating the source checkout. Keep custom
components in the project's `.component-lab/`, rather than changing the bundled
shell or examples; this keeps skill updates separate from project work.

Relaunching preserves existing drafts, project settings, and custom TypeScript
configuration. It does not replace an existing workspace with new sample files.
Browser tweaks remain available at the same project path and localhost port;
changing the project path or port gives a different browser-storage location.

## Persistence

`settings.json` supplies starting values. Each component starts with one centered
preview. Duplicate/remove buttons manage copies, and clicking an instance selects
its controls. Control values, spacing edits, instances, and selection autosave in browser local
storage, separately for each project. Existing saved tweaks migrate into the first
instance. Interface theme
and panel sizes are also remembered. Autosave does not rewrite component source
or `settings.json`; transfer chosen values into source defaults when needed.
Action callbacks and clicks are excluded from saved settings.

## Validation

```sh
npm --prefix "<skill-dir>" run check-types
npm --prefix "<skill-dir>" test
npm --prefix "<skill-dir>" run build
node "<skill-dir>/node_modules/typescript/bin/tsc" --project "<project-dir>/.component-lab/tsconfig.json"
```

The build checks the bundled examples; the final command checks the project's
drafts. Also inspect the live preview. See [SVG thumbnails](thumbnails.md) when
verifying component tiles.
