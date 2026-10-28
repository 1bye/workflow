# Restructure evals

Measures whether the skill keeps every fact while making the message scannable,
and records your own ratings so changes to `SKILL.md` can be compared over time.

## Layout

| Path | Purpose |
| --- | --- |
| `cases/<id>/input.md` | The raw AI reply, pasted as-is |
| `cases/<id>/facts.json` | Atomic facts; each `must` term (or one of its alternatives) has to appear in the output |
| `cases/<id>/golden.md` | Optional output you rated highly; the judge uses it as a shape reference |
| `rubric.md` | LLM judge prompt: fidelity, completeness, scannability, hierarchy, voice (1-5) |
| `eval.ts` | Runner, scorer, rating log, report |
| `runs/<date>-<skill hash>/` | Outputs and `scores.json` per run (gitignored) |
| `ratings.jsonl` | Your ratings, tied to run and skill hash (committed) |

## Score

`score = 70% facts kept + 30% structural checks`. Checks: every input number
kept, no invented numbers, code blocks verbatim, length 0.75-1.4x input, no 6-word run repeated, no
block over 45 words, short bottom line first, has lists or headings, no
preamble.

The automatic score catches loss. Only you and the judge can say whether the
result reads well, so rate outputs.

## Loop

```sh
# 1. Run all cases (uses `claude -p`; EVAL_MODEL defaults to sonnet).
bun skills/restructure/evals/eval.ts run --judge

# 2. Read the outputs, rate them. --golden saves a great one as the reference.
bun skills/restructure/evals/eval.ts rate <run> drift-postmortem 4 "causes clear, bottom line too long"

# 3. Edit SKILL.md to fix the worst pattern, then rerun and compare.
bun skills/restructure/evals/eval.ts report
```

Score an output from elsewhere (for example a manual ChatGPT reformat):

```sh
bun skills/restructure/evals/eval.ts score drift-postmortem path/to/output.md
```

## Adding a case

When a real reply comes out badly, keep it: create `cases/<id>/input.md` with
the raw text and list its facts in `facts.json`. Use exact values (`38fr`,
`354px`) as terms and alternatives (`["text width", "text-width"]`) where
wording can reasonably vary. Prefer 10-20 facts per case.
