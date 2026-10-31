---
name: component-lab
description: Open a local workbench for previewing and tweaking draft UI components side by side. Use when the user wants a component playground with a component picker, live controls, and independent preview instances.
---

# Component Lab

Use the bundled TypeScript, Vite, React, and Tailwind workbench to develop draft
components with live controls, folders, independent preview instances, and temporary
side-by-side comparison. Keep project drafts in
`.component-lab/`; the workbench and schema implementation stay bundled here.

Read the guide for the work at hand:

- [Workspace](references/workspace.md): launching, project files, persistence, and validation.
- [Components](references/components.md): schema definitions, inferred props, binding, folders, comparison, and preview instances.
- [Controls](references/controls.md): choosing and configuring the available control types.
- [SVG thumbnails](references/thumbnails.md): generating minimal component-list previews and wiring them into the schema.

When adding a component, use the component and thumbnail guides; consult controls
for the inputs it needs. Preserve existing workspace files and user tweaks.

Presets, project-specific styles/providers, timeline support, and the broader design and
promotion workflow remain deferred.
