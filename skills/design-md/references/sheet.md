# Visual sheet

An optional single HTML page that renders both files so people can see the
system: swatches, the type scale, radius and spacing samples, and every
component from COMPONENTS.md in its variants and states, each labelled with its
name and props (for example `Button variant="danger"`).

## Rules

- Generate it from DESIGN.md and COMPONENTS.md; never edit values in the sheet
  directly. If the sheet and the files disagree, the files win.
- Use the exported CSS variables (`export --format css-vars`) so the sheet
  uses the same values as code.
- Label every sample with its token or component name.
- Show light and dark if the system has both.
- Show every state listed in COMPONENTS.md; missing ones become visible gaps.

## Where it goes

- In a project with a dev server or `component-lab`, render components there
  instead, since real components beat drawn ones.
- Otherwise write `design-sheet.html` next to the files, or publish it as an
  Artifact if the user wants to share it.
- On a Claude Design canvas, a "Components" artboard plays this role; keep it
  in sync by regenerating it from the files.
