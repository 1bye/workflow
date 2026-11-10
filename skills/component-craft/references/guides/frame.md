# Frame

Decide what the component is for before deciding what it looks like.

## Purpose

Think about:
- What job does it do for the end user, in one sentence?
- What is it explicitly *not* responsible for? (An input does not own
  validation rules; a dialog does not own the form inside it.)
- Is this one component or two that share a look? Different behavior usually
  means different components.

Often forgotten:
- Non-goals. Without them, props grow until the component does everything.

Done when: purpose and two or more non-goals are written in the checklist.

## Usage

Think about:
- Where will it render? List real screens or features, not hypothetical ones.
- Which contexts: forms, toolbars, tables, dialogs, mobile sheets, dense admin views?
- Who consumes the API: app developers, other primitives, generated code?

Often forgotten:
- Searching the codebase for existing call sites and wrappers. Usages reveal
  required variants faster than imagination does.
- Dense contexts (tables, toolbars) that need a smaller size.

Done when: at least the known call sites or target screens are listed, with
the variant or size each one needs.

## Prior art

Think about:
- Does the project already have a similar component, a wrapper, or tokens
  for this? Reuse or replace deliberately; do not add a parallel one.
- What does the platform give for free (`<dialog>`, `<details>`,
  `popover` attribute, native `<select>`)?
- If a headless library is in use (Radix, React Aria, Base UI, Ariakit),
  is building on it acceptable to the user?

Done when: the build base is decided (native, headless library, or custom)
with a one-line reason.
