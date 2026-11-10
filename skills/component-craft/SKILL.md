---
name: component-craft
description: Guide the build or remake of a UI component through a tracked to-do list of the concerns agents usually forget (API contract, states, keyboard, accessibility, edge-case content, theming, forms, composition, platform quirks, verification). Use when the user asks to create a new UI component, replace or remake an existing one (for example a shadcn input they dislike), or iterate on a component until it is production-ready. It does not dictate visual style.
---

# Component Craft

Build components by working through a checklist, not by writing JSX first.
Every to-do links to a guide of questions, commonly forgotten details, and a
"done when" bar. The guides never choose a look; the user and the project
decide style. Your job is to make sure nothing was skipped by accident.

## Workflow

1. **Intake.** Identify the mode and the component kind:
   - **New**: nothing exists yet.
   - **Remake**: a component exists (often a library default such as shadcn)
     and the user wants it replaced. Read the current implementation and its
     usages before planning anything; see [remake](references/guides/remake.md).
   Classify the kind with [component kinds](references/component-kinds.md);
   it tells you which to-dos matter most and adds kind-specific traps.
2. **Create the checklist.** Copy [checklist template](references/checklist-template.md)
   to `.component-craft/<component>/checklist.md` in the project. Drop to-dos
   that clearly do not apply and say why in one line, rather than silently
   deleting them. Add kind-specific to-dos from the kinds file.
3. **Ask only what you cannot infer.** Before building, collect the decisions
   that are truly the user's (what they dislike, required variants, whether
   the API must stay compatible). Infer the rest from the codebase and record
   the inference in the checklist so the user can correct it.
4. **Work the list in order.** Phases build on each other: Frame, Contract,
   Behavior, Look, Integration, Prove. For each to-do, open its guide, answer
   its questions in the checklist's notes, implement, and tick it only when
   its "done when" bar is met. Mark a to-do `deferred` with a reason instead
   of ticking something half done.
5. **Iterate visibly.** Show the component in every state you claim to
   support. If the project has [component-lab](../component-lab/SKILL.md)
   installed, use it for side-by-side variants and live controls; otherwise
   use the project's own playground, Storybook, or a temporary page.
6. **Close out.** Summarize decisions, deferred items, and anything the user
   should review. Keep the checklist file: it is the component's design
   record for the next iteration.

## Guides

| Phase | Guide | Covers |
| --- | --- | --- |
| Frame | [frame](references/guides/frame.md) | Purpose, scope, usage inventory, prior art |
| Contract | [api](references/guides/api.md) | Anatomy, props, variants, control modes, refs, composition API |
| Behavior | [states](references/guides/states.md) | Full state matrix and state combinations |
| Behavior | [interaction](references/guides/interaction.md) | Pointer, keyboard, focus, touch |
| Behavior | [accessibility](references/guides/accessibility.md) | Semantics, names, announcements, contrast, preferences |
| Behavior | [content](references/guides/content.md) | Long, empty, hostile, localized, and dynamic content |
| Look | [visual](references/guides/visual.md) | Tokens, theming, sizing, density, alignment, motion |
| Integration | [integration](references/guides/integration.md) | Forms, composition, layering, SSR, platform quirks, performance |
| Prove | [verify](references/guides/verify.md) | Preview matrix, tests, docs |
| Remake | [remake](references/guides/remake.md) | Auditing the old component and migrating usages |

## Rules

- Never pick a visual style the user did not ask for. When a to-do needs a
  look decision (radius, color, density), follow the project's tokens or ask.
- Prefer the platform: native elements and attributes before ARIA and custom
  handlers.
- A to-do is only done when it is visible or tested, not when the code
  "should" handle it.
- Follow the project's conventions for file placement, styling, and testing;
  in this repository's projects, see `ts/react.md` and `ts/testing.md`.
