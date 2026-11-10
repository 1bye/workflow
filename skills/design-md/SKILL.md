---
name: design-md
description: Write and maintain a project's design system as two agent-readable files - DESIGN.md (tokens and principles in Google's open DESIGN.md format, validated with its CLI) and COMPONENTS.md (a named component inventory with props, variants, states, usage rules, and motion). Use when the user wants to create, extract, update, or validate a DESIGN.md, design tokens, typography or color system, or component inventory, including extracting one from a Claude Design canvas, code, a live URL, or screenshots.
---

# Design MD

A design system for agents lives in two files at the project root:

| File | Job | Read by agents |
| --- | --- | --- |
| `DESIGN.md` | Foundations: tokens (colors, typography, spacing, radius, component styling) and the principles behind them. Official format, lintable, exportable. | On every UI task. Keep it short. |
| `COMPONENTS.md` | Inventory: every component with its code name, props, variants, sizes, states, usage rules, motion, and the tokens it uses. | When building or using a specific component. |

DESIGN.md says *what the system is made of*; COMPONENTS.md says *what is built
from it and how each piece behaves*. COMPONENTS.md references tokens by name
and never repeats a value.

## Modes

Pick from the request:

- **Extract**: a design already exists (Claude Design canvas, code, live URL,
  screenshots, a Figma export). Follow [extract](references/extract.md).
- **Author**: a new system. Follow [author](references/author.md).
- **Update**: files exist. Read both, change only what was asked, keep token
  names stable (renames break code), then validate.

## Workflow

1. Gather sources (extract) or answers (author).
2. Write `DESIGN.md` following [DESIGN.md guide](references/design-md.md).
3. Write `COMPONENTS.md` following [COMPONENTS.md guide](references/components-md.md).
4. Validate:

   ```sh
   npx -y @google/design.md lint DESIGN.md
   ```

   Fix every error. Fix warnings or justify them in one line in your reply
   (see the guide for which are expected). A contrast warning is a real
   design finding: report it to the user rather than silently changing the
   color in extract mode. Then cross-check the two files:

   ```sh
   node <this skill>/scripts/crosscheck.mjs DESIGN.md COMPONENTS.md
   ```

   and the manual checks in [COMPONENTS.md guide](references/components-md.md#cross-file-checks).
5. If the project has code, offer to export tokens instead of hand-copying:

   ```sh
   npx -y @google/design.md export --format css-tailwind DESIGN.md
   ```

   Formats: `css-tailwind` (Tailwind v4 `@theme`), `json-tailwind` (v3),
   `css-vars`, `dtcg` (W3C tokens). Motion, elevation, and layer values live in
   prose, so export skips them; add them to the generated CSS by hand.
6. Optionally render a visual sheet from both files: [sheet](references/sheet.md).
7. Report: what was written, inferred values the user should confirm, lint
   result, and open gaps.

## Rules

- Never invent values in extract mode. A value you could not measure is
  marked `TODO(confirm)` in prose, not guessed into a token.
- Every token has a role. A hex with no stated purpose is not done.
- Prefer fewer tokens. Merge near-duplicates (two greys 1% apart) and say so.
- Use the project's existing token names when code already has them; DESIGN.md
  follows code, not the other way round.
- Do not copy another company's design system into a user's project as their
  own. Public examples (such as VoltAgent/awesome-design-md) are for learning
  structure only.

## Related skills

- `ui-teardown` produces evidence (tokens, states, flows) that extract mode can reuse.
- `component-craft` records a component's decisions; when a component is done,
  write or update its COMPONENTS.md entry.
- `component-lab` previews COMPONENTS.md entries live.
