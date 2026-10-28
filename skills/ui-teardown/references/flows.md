# Scoring flows

A flow is one user task from intent to done, such as "add a marker" or
"rename a file". Score each flow as it is today, and score a proposed version
next to it wherever you find friction.

## Steps

Write the steps as the user experiences them: what they look at, decide,
point at, click, or type, and what the UI does in response. Include waits the
user notices (loading, animations that block input).

## Counts

| Column | Count |
| --- | --- |
| Steps | Visible step-by-step actions in the list |
| Clicks | Pointer presses, including double-clicks as one |
| Keys | Non-text keys (Enter, Esc, shortcuts); write `text` for free typing |
| Mode switches | Times the UI enters or leaves a mode (tool, edit, cursor mode) |
| Hand swaps | Moves between pointer and keyboard |

## KLM estimate

Use the Keystroke-Level Model to estimate time without user testing. Write the
operator string, then sum it.

| Op | Meaning | Time |
| --- | --- | --- |
| `K` | Key press or click | 0.2 s |
| `P` | Point at a target | 1.1 s |
| `H` | Move hand between pointer and keyboard | 0.4 s |
| `M` | Mental preparation: decide, find, or recall | 1.2 s |
| `R(t)` | Wait for the system | t |
| `[text]` | Free text entry; left out of the total | — |

Placing `M`: add one before each action that needs a decision or a visual
search (finding a button, choosing a location). Do not add one inside a
practiced chunk (typing then Enter, a shortcut chord). Add `R(t)` only when
the user must wait before acting.

The number is an estimate for comparing versions, not a prediction. Always
report it with `~` and compare like with like.

## Friction to look for

- **Detours:** reaching a toolbar or menu before the real action.
- **Modes:** the user must enter a mode, remember it, and leave it.
- **Context loss:** a modal or page change hides what the user was working on.
- **Focus hand-off:** the user must click into a field the UI could have
  focused.
- **Hand swaps:** pointer → keyboard → pointer just to confirm.
- **Confirmation tax:** OK/Save for a reversible action that could commit on
  Enter or blur, with undo.
- **Distance and size:** small or far targets for frequent actions (Fitts's
  law).
- **Choice load:** many equal options at a decision point (Hick's law); an
  obvious default is faster.
- **Blocking waits:** spinners or animations that stop input.

## Proposals

Each proposal names the principles it applies and states its risk. Common
risks: accidental actions (prefer undo over confirmation), hidden features
(lost discoverability), conflicts with existing gestures, and accessibility
(keyboard-only and screen-reader paths must stay possible). A proposal that
removes clicks but breaks a keyboard path is not an improvement.

When a flow has no friction, write "No change proposed." Do not propose
changes to fill the section.

## Ranking opportunities

Rank by time saved times how often the task happens. A frequent task saving
1 s beats a rare one saving 5 s. Say how you judged frequency (stated by the
user, obvious from the UI's purpose, or a guess).
