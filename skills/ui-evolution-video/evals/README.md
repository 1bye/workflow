# UI evolution evals

Install the pinned package dependencies, then run `npm test` for toolkit checks.
Use `UI_EVOLUTION_BROWSER=/absolute/path/to/chrome` or install Chromium with
`npx playwright install chromium`.

Generate raw evaluation inputs in a new temporary directory:

```sh
node evals/eval.mjs fixtures /tmp/ui-evolution-fixtures
```

The generator creates a tiny Git repository with known visual and nonvisual
changes, an intentionally failing old build, and a screenshot/code pair.
It does not generate answers or pretend to evaluate an agent.

For each case in `cases/`, give an agent the skill, that case's prompt, and
the allowed raw inputs. Replace `revisions.NAME` using `sources.json`.
Use an empty output directory and do not supply the scorer or intended mapping.
For screenshot-code, provide only `before.png` and `after.html`.
Do not expose before.html or the fixture repository to that case.

Score the resulting project:

```sh
node evals/eval.mjs score two-commits /tmp/agent-output /tmp/ui-evolution-fixtures
```

The scorer validates JSON contracts, complete one-use correspondence, track
timing, parent identity, provenance, milestone selection, and fallback disclosure.
It accepts different explanations and timings. Explicit fixture IDs are stable
for code capture; screenshot reconstruction may use its own IDs.

Evaluate all four cases against the same toolkit revision. Record the skill Git
revision, agent/model, case, output path, elapsed time, structured score, and
visual ratings in the evaluation report. Do not conflate fixture integration
tests with a completed independent agent evaluation.

## Visual rubric

Rate each 1–5 after opening endpoints, contact sheets, and actual playback:

- Endpoint fidelity: text, content, hierarchy, and geometry match the evidence.
- Identity: corresponding controls remain recognizable without jumps.
- Choreography: the order and overlap make the redesign understandable.
- Finish: readable type, controlled arrivals, no clipping or visible flicker.
- Reference fit: composition, restraint, and rhythm match the intended treatment.

Describe the worst observed issue and link its frame/time. Mark playback
unreviewed when unavailable. A high artifact score is not a visual rating.
