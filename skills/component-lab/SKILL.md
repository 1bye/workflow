---
name: component-lab
description: Open a local workbench for previewing and tweaking draft UI components side by side. Use when the user wants a component playground with a component picker, live controls, and multiple visible states.
---

# Component Lab

The prototype uses Vite, React, and Tailwind. With Node.js 22.12 or newer,
install its locked dependencies once, then launch it:

```sh
npm --prefix <skill-dir> ci
node <skill-dir>/scripts/serve.mjs <project-dir>
```

Open the printed local URL. Use `--port 4320` if the default port, 4317, is busy.
Stop the process when the preview is no longer needed.

The launcher creates `.component-lab/` in the project on first use, with a pin
example, an editable `registry.js`, and `settings.json`. Existing workspaces
are preserved. The shell stays bundled in this skill.

Each registry entry exports controls, defaults, named states, a thumbnail URL,
and a React component as `component`. The example definition is
[assets/workspace/components/pin/preview.js](assets/workspace/components/pin/preview.js).
Vite handles JSX and hot updates; Tailwind scans both the shell and the project
draft folder. Save writes the current controls and canvas choice to
`settings.json`. Panel sizes and unsaved tweaks are stored in the browser.

Existing workspaces are never overwritten. Drafts from the original DOM
prototype need their `render` function converted to a React `component`.
Project-specific styles/providers and the detailed authoring workflow are deferred.

For validation, run `npm --prefix <skill-dir> test` and
`npm --prefix <skill-dir> run build`. The build checks the bundled example;
the launcher serves the selected project's drafts.
