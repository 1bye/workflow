# Integration

A component that works alone can still fail where it is used.

## Forms

For any component that holds a value:
- Native form submission: `name` and value reach `FormData`, including for
  custom controls (hidden input or `form`-associated element).
- `form.reset()` restores the default value.
- Native constraint validation (`required`, `pattern`, `min`, `max`) works
  or is deliberately replaced.
- Works with the project's form library (React Hook Form, TanStack Form,
  Conform, server actions): `register` / `Controller` receives the ref and
  `onBlur`, and errors flow back in.
- Label, description, and error wiring when used inside a Field wrapper.

Often forgotten:
- `onBlur` not forwarded, so "touched" validation never fires.
- `defaultValue` ignored after a form reset.

Done when: a test form submits, resets, and shows an error through the
project's form library.

## Composition

Check the component inside:
- a form, a dialog, a popover, a table cell, a toolbar, a flex row, a grid
- a scroll container
- another instance of itself if nesting is possible

Often forgotten:
- Event propagation: Escape or Enter handled twice by parent and child.
- Context providers the component silently requires.

Done when: previewed in at least the containers from the usage inventory.

## Layering

Think about:
- Portals for overlays so they escape `overflow: hidden` and stacking contexts.
- A z-index scale from tokens, not arbitrary values.
- Overlays rendered inside a dialog must stack above it and remain inside
  its focus trap.

Done when: an overlay part opened inside a dialog and a scroll container
displays and behaves correctly.

## SSR

Think about:
- No `window` / `document` access during render.
- Stable ids across server and client.
- No layout jump when client-only behavior attaches.

Done when: the component renders on the server without warnings, if the project uses SSR.

## Platform

Check the quirks for this kind in [component kinds](../component-kinds.md),
plus:
- Safari focus behavior (buttons not focused on click on macOS).
- iOS virtual keyboard resizing the visual viewport.
- Firefox and Safari rendering of native controls you restyled.

Done when: tested in at least one WebKit and one Chromium browser for
interaction-heavy components.

## Performance

Think about:
- Re-renders on each keystroke rippling to parents.
- Large option lists or rows: virtualize beyond a few hundred.
- Expensive effects or measurement on every render.

Done when: the component behaves smoothly at the largest realistic data size
from the usage inventory.
