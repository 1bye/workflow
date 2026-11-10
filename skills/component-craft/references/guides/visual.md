# Look

This guide asks questions about consistency and resilience. It never picks the
style; the user or the project's tokens do.

## Tokens

Think about:
- Every color, radius, spacing, font, shadow, and duration comes from the
  project's tokens or theme variables.
- Missing token? Add it to the theme deliberately or ask, rather than
  hardcoding a literal in the component.
- Which tokens are component-level (e.g. `--input-height`) so consumers can tune
  them without new props?

Done when: a search of the component's styles finds no stray literal colors
or magic numbers that should be tokens.

## Themes

Think about:
- Light and dark, plus any brand or high-contrast themes the project has.
- Elevated surfaces (inside a card, dialog, or sidebar) where the background
  differs; does the control still have edges?
- Autofill, selection highlight, scrollbar, and caret color in each theme.

Done when: every state was viewed in each theme on at least two surfaces.

## Sizing

Think about:
- Intrinsic width vs fills its container; who decides?
- Heights align with siblings at the same size (input next to button next to select).
- Baseline alignment of text across adjacent controls.
- Density modes if the project has them.
- Borders inside vs outside the box: does focus or invalid change size and
  shift layout? Prefer rings or outlines that do not affect layout.

Often forgotten:
- An input and button in the same row being 1–2px different in height.
- Icon size and optical alignment with text.

Done when: the component sits in a row with its sibling controls at each size
and edges line up.

## Responsive

Think about:
- Behavior in narrow containers, not only narrow viewports (container queries).
- Touch target sizes on coarse pointers (`@media (pointer: coarse)`).
- Font size at least 16px on mobile text inputs to avoid iOS zoom.

Done when: viewed at a phone width and inside a narrow container.

## Motion

Think about:
- What animates and why: state feedback, not decoration.
- Durations and easing from tokens; enter and exit both defined.
- Reduced motion: replace movement with fade or nothing.
- Animations must not delay input or focus.

Done when: motion is listed in the checklist and checked with reduced motion on.
