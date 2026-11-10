# States

Agents usually build the default state and hover. Everything else ships broken.

## Matrix

List every state that applies, then make each one reachable in the preview:

| State | Question to answer |
| --- | --- |
| Default / empty | What shows with no value? Placeholder or nothing? |
| Filled | Does a value change layout or color? |
| Hover | Is hover only an enhancement, never required? |
| Focus-visible | Keyboard focus clearly visible on every background? |
| Focus (pointer) | Should a mouse click show a ring? Usually no. |
| Active / pressed | Feedback on press, especially on touch. |
| Disabled | Still readable? Cursor? Tooltip explaining why, if needed? |
| Read-only | Visually distinct from disabled; text still selectable and copyable. |
| Invalid / error | Indicated by more than color; message linked. |
| Warning / success | Only if a real usage needs them. |
| Loading / pending | Width stable, interaction blocked or not, announced. |
| Selected / checked / open | Distinct from hover and focus. |
| Indeterminate / mixed | For checkboxes, trees, progress. |
| Dragging / resizing | If applicable. |

Often forgotten:
- Read-only. Most libraries treat it as an afterthought.
- Disabled elements are skipped by focus and screen readers often
  cannot discover why; consider `aria-disabled` when discoverability matters.
- Placeholder used as a label. It disappears once the user types.

## Combinations

Check the combinations that collide visually:
- invalid + focused (which border wins?)
- disabled + invalid
- disabled + checked / filled
- loading + disabled
- selected + hover + focus-visible
- every state in dark mode

Done when: each listed state and the risky combinations are visible in the
preview matrix, and each has a decision about styling priority.
