# component-craft evals

Runs the skill through Codex (default model `gpt-6.1-sol`) against a fixture
app and scores what it produced: the checklist, the component, whether every
call site still typechecks, and the final report.

## Layout

| Path | Purpose |
| --- | --- |
| `fixtures/<name>/` | A small app copied into each run (no `node_modules`) |
| `cases/<id>/case.json` | Prompt, target component, and expectations |
| `eval.ts` | Runner and scorer |
| `.cache/` | Fixture `node_modules`, installed once per `package.json` (gitignored) |
| `runs/<time>-<skill hash>-<model>/<case>/` | `final.md`, `diff.patch`, `new-files.txt`, `events.jsonl`, `work/`, `score.json` (gitignored) |

## Checks

| Group | Fails when |
| --- | --- |
| checklist | no `.component-craft/*/checklist.md`; wrong mode or kind; any `[ ]`/`[~]` left; a `[-]`/`[>]` item without a reason; a call site missing from the audit (`callSiteKeys`) |
| handled | a concern is neither in the component source (`any`) nor recorded as a decision in the checklist (`record`) |
| code | a forbidden pattern (raw color literals) is in the component; the component is still stock |
| scope | the agent created a path it should not (`forbiddenPaths`, e.g. `.component-lab`) |
| typecheck | `tsc --noEmit` fails, so a call site broke |
| report | the final message lacks required terms, or has fewer than `minBullets` list items |

`handled` accepts a recorded decision because the skill's job is to make the
agent think about a concern, not to force one implementation (leaving autofill
to the browser is a valid, recorded choice).

## Run

```sh
bun skills/component-craft/evals/eval.ts run
bun skills/component-craft/evals/eval.ts run --case remake-shadcn-input --model gpt-6-luna

# Re-score a saved run, or prepare a working dir to try a case by hand.
bun skills/component-craft/evals/eval.ts score remake-shadcn-input runs/<run>/remake-shadcn-input/work runs/<run>/remake-shadcn-input/final.md
bun skills/component-craft/evals/eval.ts prepare remake-shadcn-input
```

Each run takes 7 to 13 minutes. The working dir is a fresh git repository
outside this one, so `diff.patch` shows exactly what the agent changed.

Codex's `workspace-write` sandbox limits file writes, not GUI apps: agents
have opened Safari and Chrome on the host to verify a component. Expect
browser windows during a run.

## Adding a case

Add a fixture (or reuse one) and a `case.json`. Put the concerns agents
usually forget for that component kind under `code`, each with code patterns
and, when a deliberate non-implementation is acceptable, `record` terms.
