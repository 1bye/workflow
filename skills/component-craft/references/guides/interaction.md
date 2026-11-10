# Interaction

## Pointer

Think about:
- Hit target vs visual size: small visuals can still have large hit areas.
- What happens on click of every part (icon, label, padding, adornment)?
- Double click, text selection, and drag starting inside the component.
- Hover-only affordances are invisible on touch; provide another path.

Often forgotten:
- Clicking padding inside an input wrapper does not focus the input.
- `pointerdown` vs `click`: menus that open on pointer down feel faster,
  but break drag-to-select. Decide.

Done when: every visible part has a defined click result and touch has an
equivalent for every hover affordance.

## Keyboard

Write the keyboard map as a table: key, context, result. Then test it.

Think about:
- Tab enters and leaves the component once (composite widgets use roving
  focus or active descendant inside).
- Enter, Space, Escape, arrows, Home/End, typeahead as the pattern requires.
  Use the WAI-ARIA Authoring Practices pattern for the kind as the baseline.
- Escape behavior when nested inside a dialog: stop propagation only if the
  component consumed it.
- Enter inside a form submits; does this component prevent or allow it?

Often forgotten:
- Shift+Tab.
- Modifier keys (Cmd/Ctrl+A, Cmd+Enter) passing through untouched.
- IME composition: Enter confirms a character, not a submit.

Done when: the keyboard map is in the checklist and each row was exercised.

## Focus

Think about:
- Where focus goes on open, on close, after delete, after an item is
  removed, and after async content loads.
- Focus ring visibility on every surface and theme.
- `autoFocus` only where the user expects to type immediately.
- Programmatic `focus()` exposed through the ref.

Often forgotten:
- Focus lost to `<body>` after the focused element unmounts.
- Focus ring clipped by `overflow: hidden` on a parent.

Done when: no interaction leaves focus on `<body>` and the ring is never clipped.

## Touch

Think about:
- Minimum target size (around 24px at least, 44px preferred for primary actions).
- Long press, swipe, and scroll conflicts.
- The virtual keyboard covering the component or its popover.

Done when: the component was used at a mobile viewport with touch emulation.
