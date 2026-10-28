---
name: ui-teardown
description: Tear down a UI (component, screen, or interactive surface such as a map or editor) from any source (code, live URL, video, or screenshots) into a structured Markdown spec covering interaction flows, design principles, parts, states, design tokens, and motion. Use when asked to reverse engineer, analyze, document, capture, or improve how a UI looks, feels, and works, or to extract its tokens or user flows so another agent can rebuild or enhance it.
---

# UI Teardown

Turn a UI into a teardown: one Markdown document (plus part files and a token
file for composite UIs) that explains how the UI works, why it feels the way
it does, and exactly what it is made of. Two readers use it:

- **The user** reads Essence, Principles, Flows, and Opportunities to judge
  and improve the interaction.
- **Agents** use Anatomy, States, Tokens, Motion, Access, and the Rebuild
  contract to rebuild the UI faithfully or apply improvements.

Choose the emphasis from the request; do not ask the user to pick a mode:

- **Analysis:** prioritize flows and the principles behind them.
- **Reconstruction:** prioritize the appearance and behavior another agent
  needs to reproduce. Capture distinctive relationships and high-impact
  details; ordinary implementation choices can use sensible defaults.

A screenshot can support a useful appearance contract while interactions
remain unknown. Keep unsupported flows, state inventories, and motion brief.

## Workflow

1. **Scope.** Name the target and its boundary: one component, a screen, or a
   composite surface. List the user tasks it supports ("add a marker", "filter
   results") before analyzing anything; flows are written per task.
2. **Gather evidence.** Use every source available, most precise first:
   - **Source code** for exact tokens, states, timings, easing, and keyboard
     handling. When the UI is in a codebase you can read, read it, even if the
     user pointed at a video or URL: specs must be as accurate as possible.
     Follow the theme or token files, component files, and their styles; skip
     unrelated code, tests, and generated files.
   - **Live UI** for computed styles, real hover, focus, and transition
     behavior, and actual click paths.
   - **Video or screenshots** for flow, motion feel, timing, and anything the
     other sources cannot show.

   How a source is read (browser, frame extraction, image viewing) is up to
   you and the tools available. Judge flows from the experience the user
   pointed at; take exact values from the most precise source.
3. **Write.** Adapt [template.md](references/template.md) to the emphasis.
   Score actionable flows with [flows.md](references/flows.md). Derive tokens
   with [tokens.md](references/tokens.md), binding them to the actual parts.
4. **Check.** Reconcile units, dimensions, spacing, and element roles before
   handing off. When a rebuild or render is in scope, compare it at the
   chosen scale: bounds, alignment, typography, emphasis, and asset shapes.
   Record what was checked and the remaining differences; valid token JSON
   alone does not establish visual fidelity.
5. **Report.** Give the document path, the 3–5 principles, and the top
   opportunities with their estimated savings where supportable. State
   material unknowns and the working assumptions used to proceed.

## Output location

Write to `.teardown/<name>/` in the target project unless the user names a
place:

```
.teardown/<name>/
  README.md      # the teardown
  tokens.json    # DTCG design tokens, the single source of truth
  parts/<part>.md  # only for parts that earn their own file
```

A small component may be a single `README.md` with tokens inline in a JSON
block; create `tokens.json` once there are more than about 15 tokens or any
part files.

**Part files.** Give a part its own file when it has its own states or its own
flow (a marker popover, a toolbar). Otherwise describe it as a section of the
parent's Anatomy. Parts reference tokens by name and never redefine them.
Nest no deeper than the UI does.

## Rules

- **Evidence tags.** Mark every value and claim as `measured` (read from code
  or computed styles), `inferred` (estimated from video, screenshots, or
  patterns), or `unknown`. Add `src` as `path:line` for values read from code.
  Never present a guess as measured. When the original value is unknown,
  say so; a useful fallback may still be recorded separately as an
  `inferred` implementation choice.
- **Proceed with judgment.** Do not require complete source knowledge or
  ask the user to resolve every unknown. Choose reasonable approximations
  consistent with the evidence. Ask only when a missing detail materially
  blocks the requested outcome and cannot be reasonably inferred.
- **Use the UI's vocabulary.** Name parts and tokens the way the code or the
  product does. Invent names only when none exist, and say so.
- **Semantic over raw.** Describe colors, spacing, and motion by role
  (`color.action.primary`, `space.inset.md`, `motion.duration.fast`) mapped to
  raw values. Bind roles to elements, including differently styled spans
  within a label; token names alone do not specify their placement.
- **States.** Cover default, hover, focus-visible, active, disabled, loading,
  empty, error, success, and selected wherever they apply, plus any states
  specific to the UI (dragging, editing, placing). Mark each as observed,
  inferred, absent, or unknown; an absent state is a finding, not a gap to fill.
- **Improvements are honest.** Propose a better flow only where you found
  friction, always with its cost and risk (accidental actions, discoverability,
  accessibility). When a flow is already minimal, write "No change proposed."
- **Principles are transferable.** Each principle is one imperative rule that
  would carry over to a different component ("Edit inline; never open a modal
  for a single field"), tied to the flows that rely on it. Not "uses blue".
- **Concise.** Use tables for specs and prose for intent, reasoning, and
  important limitations. The user-facing overview should read in about two
  minutes.
