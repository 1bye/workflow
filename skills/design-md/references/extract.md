# Extract mode

Turn an existing design into DESIGN.md and COMPONENTS.md. Accuracy beats
completeness: a confirmed small system is better than a guessed large one.

## Sources, most precise first

1. **Code**: theme files, Tailwind config, CSS variables, component source.
   Exact values and real component names. If code exists, it wins over any
   mockup; note disagreements as `TODO(confirm)`.
2. **Claude Design canvas or other HTML mockups**: read the artboard files
   (with the Artifact tool's read action for claude.ai links). Inline styles
   carry exact values. A components or "sheet" artboard, if present, is the
   best single source: it usually names components and props already.
3. **Live URL**: computed styles in the browser for real values, hover/focus
   behavior, and transitions.
4. **Screenshots or video**: proportions, hierarchy, motion feel. Values
   from images are estimates; mark them.

`ui-teardown` output, if it exists, already holds measured tokens and states;
reuse it.

## Steps

1. **Inventory values.** Collect every color, font, size, weight, radius,
   spacing, shadow, duration, and easing with where it is used. Count uses.
2. **Cluster.** Merge near-duplicates; values used once are suspects (a bug or
   a one-off). Ask before promoting a one-off to a token.
3. **Name by role.** Prefer names the source already uses. Otherwise name by
   role (`ink`, `muted`, `hairline`), not by appearance (`grey-2`).
4. **Find the rules.** Look for the patterns the design repeats: one accent
   only, button heights by context, empty and error states sharing a shape.
   These become Do's and Don'ts and component Rules. They are the most
   valuable part; do not skip them.
5. **Inventory components.** One entry per distinct component. Variants are
   props, not entries. Note states the source shows, and list states it does
   *not* show as gaps (for example no focus-visible state drawn).
6. **Write, lint, cross-check** as in SKILL.md.

## Report gaps

End with a short list of what the source did not define: missing states,
missing dark mode, unmeasured motion, unnamed components. These are the next
design tasks, and `component-craft` can pick them up.
