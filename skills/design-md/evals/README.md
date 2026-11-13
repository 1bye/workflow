# design-md evals

Runs the skill through Codex (default model `gpt-6.1-sol`) on fixed cases and
scores the output with deterministic checks, so skill edits can be compared
across runs and models.

## Layout

| Path | Purpose |
| --- | --- |
| `cases/<id>/case.json` | Prompt and expectations (committed, public fixtures) |
| `cases/<id>/source/` | Files the agent extracts from, copied into the working dir |
| `cases-private/<id>/` | Same shape, gitignored, for client designs |
| `eval.ts` | Runner and scorer |
| `runs/<time>-<skill hash>-<model>/<case>/` | `work/` output, `final.md`, `events.jsonl`, `score.json` (gitignored) |

## Checks

| Check | Fails when |
| --- | --- |
| files exist | DESIGN.md or COMPONENTS.md missing |
| lint: no errors | `@google/design.md lint` reports errors (warnings are listed, not failed) |
| crosscheck passes | `scripts/crosscheck.mjs` finds a broken token reference |
| facts kept | a `facts` term (or all its alternatives) is absent from the two files |
| no invented token colors | extract cases: a hex in the DESIGN.md front matter or COMPONENTS.md does not occur in `source/` (prose may show derived colors, such as composited alpha layers) |
| gaps marked | extract cases: no `TODO(confirm)` anywhere |
| reported | a `report` finding's terms (including the concrete color) are absent from the agent's final message; documenting it only inside the files does not count |

## Run

```sh
# All cases, Codex with gpt-6.1-sol, in parallel.
bun skills/design-md/evals/eval.ts run

# One case or another model.
bun skills/design-md/evals/eval.ts run --case fernway-mockup --model gpt-6-luna

# Re-score an existing working dir.
bun skills/design-md/evals/eval.ts score fernway-mockup runs/<run>/fernway-mockup/work runs/<run>/fernway-mockup/final.md
```

Each run copies the skill (without `evals/`) into
`work/.agents/skills/design-md/` and tells the agent to use it. The Codex
sandbox gets network access so the agent can run the lint CLI.

## Adding a case

Keep a case when a real extraction goes wrong. Put the design in `source/`,
then list in `case.json` the exact values and names any correct output must
contain (`facts`), and the problems the agent must tell the user about
(`report`). Use alternatives (`["SyncStatus", "SyncIndicator"]`) where naming
can reasonably vary.
