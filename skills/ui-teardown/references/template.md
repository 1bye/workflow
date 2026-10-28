# Teardown template

Use this structure for `.teardown/<name>/README.md`. For reconstruction,
bring Anatomy, Tokens, and the Rebuild contract forward. Compress sections
unsupported by the evidence into a short limitations note rather than filling
tables with unknowns. Part files use the same structure from **Anatomy** down,
plus their own Flows if they have any.

````markdown
# <Name> — Teardown

| Source | Evidence | Date |
| --- | --- | --- |
| `src/components/Map/` · video `demo.mp4` | mostly measured | 2026-10-28 |

State the target boundary and goal. For a screenshot handoff, declare the
coordinate space and chosen image-to-CSS scale. Separate unknown original
values from the working assumptions used to proceed.

## 1. Essence

Two or three sentences: what it is, who uses it for what, and how it feels
(dense or airy, calm or snappy, playful or precise, mouse-first or
keyboard-first).

## 2. Principles

The rules that make it feel this way. Keep these when rebuilding.

- **P1. Creation is the default mode.** Clicking empty map space creates a
  marker; there is no "add" tool. Flows: F1.
- **P2. Edit inline, never in a modal.** Flows: F1, F3.
- **P3. The keyboard finishes what the pointer starts.** Enter commits, Esc
  cancels, focus lands in the field. Flows: F1.

## 3. Flows

One block per actionable user task. Score with references/flows.md. For a
static readout, briefly describe the scanning task; omit speculative timing.

### F1. Add a marker

| | Steps | Clicks | Keys | Mode switches | Hand swaps | KLM | Est. time |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Current | 4 | 3 | text | 1 | 2 | `M P K M P K H [text] H P K` | ~7.1 s + text |
| Proposed | 3 | 1 | text + Enter | 0 | 1 | `M P K H [text] K` | ~3.1 s + text |

1. Click **New marker** (top right) → cursor becomes a marker.
2. Click the map → modal opens.
3. Type label → click **OK**.

**Friction.** Toolbar detour and a mode switch before the real action; the
modal hides the map context; OK forces a return to the pointer.
**Proposal.** Click-to-create (P1), autofocused inline popover anchored to the
marker (P2), Enter commits (P3).
**Risk.** Accidental markers on pan clicks → require a drag threshold and keep
Esc/undo one key away.

### F2. ...

No change proposed.

## 4. Opportunities

Ranked by impact (time saved × how often the task happens).

| # | Change | Flow | Saves | Cost / risk |
| --- | --- | --- | --- | --- |
| 1 | Click-to-create markers | F1 | ~4 s, 2 clicks | pan-click misfires |

---

## 5. Anatomy

Part tree. Link parts that have their own file.

```
Map
├── Toolbar            → parts/toolbar.md
├── Marker
│   └── MarkerPopover  → parts/marker-popover.md
└── ZoomControls
```

Per part (sections here, or in its file): role, layout (direction, alignment,
sizing), spacing and color tokens used, and children.

| Part | Role | Layout | Tokens | Evidence |
| --- | --- | --- | --- | --- |
| ZoomControls | Zoom in/out | column, gap `space.stack.xs`, fixed bottom-right `space.inset.md` | `color.surface.raised`, `radius.md` | measured `ZoomControls.tsx:12` |

For reconstruction, make the important visual relationships explicit:

- Bind text roles to specific elements or spans: color, relative emphasis,
  and typography (family/fallback, size, weight, line height as useful).
- Describe key anchors, insets, column sizing, and row alignment. Distinguish
  baseline pitch from empty gap; check that band sizes and insets reconcile
  with the overall bounds. Prefer a few clear constraints over every pixel.
- For charts, define the width denominator and treatment of gaps; segment
  widths plus gaps must fit the stated track.
- Identify distinctive marks and assets. If exact assets are unavailable,
  describe their visible silhouette and a suitable approximation. Unknown
  asset provenance does not make visible shape unknowable.

## 6. States

✓ observed · ~ inferred · — absent · ? unknown

| Part | default | hover | focus | active | disabled | loading | empty | error | selected | <custom> |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marker | ✓ | ✓ | ? | ✓ | — | — | — | — | ✓ | dragging ✓ |

Then one line per non-trivial state: what changes (tokens, content, motion)
and what triggers it and ends it. Empty, loading, and error states also get
their copy text if observed.

## 7. Tokens

Summary by role; the full set lives in `tokens.json` (see references/tokens.md).

| Token | Value | Use | Evidence |
| --- | --- | --- | --- |
| `color.action.primary` | `#3B6CF6` | primary buttons, selected marker | measured `theme.ts:8` |
| `space.inset.md` | `12px` | panel padding | measured |

Scale summary: spacing base (e.g. 4px grid, steps 4/8/12/16/24), radius
steps, type scale, elevation levels. List values that break the scale.
Label inferred implementation choices where the original value is unknown.

## 8. Motion

| Trigger | Part | Properties | Duration | Easing | Notes |
| --- | --- | --- | --- | --- | --- |
| marker created | Marker | scale 0.6→1, opacity 0→1 | `motion.duration.fast` 150 ms | `motion.ease.out` | popover follows after 50 ms |

Describe choreography (what moves first, staggering, what stays still) and
whether reduced motion is respected.

## 9. Access and input

- **Keyboard map:** keys, scope, and effect.
- **Focus order** and where focus goes after each flow step (open, commit,
  cancel, delete).
- **Hit targets:** sizes of the smallest interactive parts.
- **Contrast** of text and key UI against its surface, where measurable.
- **Screen reader:** roles, labels, live regions, where known.

## 10. Rebuild contract

A checklist an agent must satisfy for a faithful rebuild (or for the proposed
version, if the user asks for it). Every line is verifiable. Match precision
to the evidence: use approximate bounds or relationships where exact values
are unavailable, and identify acceptable fallbacks for important unknowns.

- [ ] Clicking empty map space creates a marker without a tool switch (P1).
- [ ] The label field is focused when the popover opens; Enter commits, Esc
      cancels and removes an empty marker (P3).
- [ ] Recovered values use semantic tokens; important fallbacks are identified
      as implementation choices.
- [ ] Every state marked ✓ in States exists with the listed changes.

For reconstruction, include checks for the important geometry, text-role
assignments, typography, and asset shapes described in Anatomy. When a render
is produced, record which checks passed and what remains approximate. For a
requested blind trial, evaluate the builder's output against the reference
separately and record whether the result is an initial or refined pass.
````
