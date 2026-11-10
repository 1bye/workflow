# DESIGN.md guide

Follow Google's DESIGN.md format (`npx -y @google/design.md spec` prints the
current version). This guide adds what makes the file *good*, and the
extensions this skill uses for things the spec has no tokens for.

## Shape

```markdown
---
version: alpha
name: <System name>
description: <one line>
colors:
  primary: "#..."          # required by lint; alias your accent if needed
typography:
  <level>: { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing }
rounded:
  <level>: <px>
spacing:
  <level>: <px or number>
components:                # styling tokens only; behavior goes in COMPONENTS.md
  <component-variant>:
    backgroundColor: "{colors.x}"
    textColor: "{colors.y}"
    typography: "{typography.z}"
    rounded: "{rounded.r}"
    padding: <px>
    height: <px>
---

# <System name>

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Motion            <- extension, see below
## Components
## Do's and Don'ts
```

Keep the official sections in this order; lint warns otherwise. Omit sections
that do not apply, and list deliberately missing token groups under `omitted`
with a reason.

## What the spec validates (and what it does not)

- Valid top-level token groups: `colors`, `typography`, `rounded`, `spacing`,
  `components`. Any other token-like group (for example `motion:`) triggers
  `token-like-ignored` and is dropped by export. Do not add one.
- Valid component sub-tokens: `backgroundColor`, `textColor`, `typography`,
  `rounded`, `padding`, `size`, `height`, `width`. Anything else
  (`borderColor`, `transition`) warns. Put it in prose or COMPONENTS.md.
- Contrast is checked only for component `backgroundColor`/`textColor` pairs.
  For every text-on-surface pair no real component covers (muted text on bg,
  muted on surface), add an entry named `pair-<text>-on-<background>` with
  just those two properties so lint checks it. The cross-check script skips
  `pair-` entries.
- `orphaned-tokens` warns for tokens no component references. Either reference
  them or accept the warning for pure palette tokens; say which in your report.
- Dimensions accept `px`, `em`, `rem` only.

## Extensions (prose sections, lint-clean)

Values the spec has no group for go in prose sections as a table, so agents
still get exact numbers:

- **Motion** (own `## Motion` section, after Shapes): durations, easings,
  what animates and why, reduced-motion behavior.

  | Token | Value | Use |
  | --- | --- | --- |
  | `motion-fast` | 120ms `cubic-bezier(0.2,0,0,1)` | Press feedback |

- **Elevation** (inside `## Elevation & Depth`): shadow values or the explicit
  statement that the system is flat and how depth is shown instead.
- **Layers and breakpoints** (inside `## Layout`): z-index scale, breakpoints,
  safe areas, max widths, screen gutters.
- **Icons, imagery, voice**: unknown `##` sections are preserved by consumers;
  add `## Iconography` or similar after Do's and Don'ts only if the project
  needs them.

Name prose tokens like real tokens (`motion-fast`, `z-overlay`) so code can
adopt the same names.

## Quality bar

A really good DESIGN.md:

- **Overview** states the look in a few concrete sentences an agent can act
  on ("one accent on neutral greys; no gradients; numbers are the hero"), plus
  the audience and density. No adjectives without consequences.
- **Colors**: every token has a role ("muted: secondary text, never on accent").
  Semantic names (`ink`, `surface`, `danger`) over raw palette names
  (`blue-600`), unless the code already uses a palette scale. State which
  pairs are allowed together.
- **Typography**: a complete scale (most systems need 8–15 levels) with
  family, size, weight, line height, letter spacing. Name where each level is
  used. Note font features (tabular numbers for figures) via `fontFeature`.
- **Layout**: the spacing scale *and* how it is applied (screen gutter, card
  padding, gap between cards, section spacing).
- **Shapes**: radius per element class (tile, card, sheet, pill) not just a scale.
- **Motion**: present whenever anything animates, including reduced motion.
- **Do's and Don'ts**: rules that prevent the most likely wrong output
  ("one primary button per screen", "never color alone for availability").
  Each rule should be checkable by looking at a screen.
- **Dark mode / themes**: if the product has them, define the alternate values
  (for example a `colors` token per mode with a suffix such as `surface-dark`)
  and state the mapping in Colors prose.

## Expected lint output

Clean target: zero errors. Acceptable warnings, each mentioned in the report:
`orphaned-tokens` for palette tokens only used in prose, and
`missing-sections` infos for groups listed in `omitted`.
