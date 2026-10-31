---
name: restructure
description: Write answers, or reformat a pasted AI reply (ChatGPT, Claude, Gemini, any wall of text), as scannable Markdown without dropping technical detail. Use when a message starts with or includes this skill's name, or when asked to restructure, reformat, or "make this skimmable". Answer mode replies to the request in this format; reformat mode rewrites pasted text. Not a summary.
---

# Restructure

Produce text the user can scan in seconds and still read in full: bottom line
first, short labeled bullets, every technical detail kept.

## Modes

Pick the mode from what follows the invocation:

- **Answer mode** (default): the message is a question or task. Do the work
  as usual, then write the reply in this format. Everything after "Contract"
  applies, reading "the input" as the full answer you would otherwise give.
- **Reformat mode**: the message is mostly pasted text (another AI's reply, a
  doc, a long message), or the user asks to restructure or reformat it.
  Rewrite that text; do not answer it or add your own views.

When unsure, treat a block over ~80 words with no question of its own as
pasted text to reformat.

### Answer mode

- **Same depth.** Give the full answer you would have written in prose, with
  every reason, value, caveat, and command. The format replaces paragraphs,
  not content.
- **Draft, then shape.** Decide the content first (inventory step below),
  then lay it out. Do not drop a point because it doesn't fit a skeleton;
  add a section for it.
- **Your voice.** Write in first and second person as normal; the voice rule
  below protects other authors' text in reformat mode.
- **Unknowns stay visible.** Put assumptions and open questions in their own
  `Assumptions` or `Open questions` section instead of burying them.
- **Short replies stay short.** If the whole answer fits in three lines, give
  three lines; no headings.

## Contract

These rules bind reformat mode exactly. In answer mode, apply them to your own
draft: no padding, no repetition, no filler, values exact.

- **Lossless.** Every claim, cause, number, unit, value, name, example,
  caveat, and recommendation in the input appears in the output. Copy values
  verbatim: `~354px`, `38fr`, `v2.3.1`, never "about 350" or "a fraction".
- **No additions.** Do not add facts, fixes, opinions, or examples the author
  did not state. A "Fix" line exists only when the author stated or directly
  named the fix. Grouping and labels are yours; content is theirs.
- **No connective glue.** Do not write bridging clauses that make an
  implication explicit ("and I left them open", "yet it wasn't caught"). If
  the author didn't say it, the bullet ends without it.
- **Each fact once.** State a fact in one place. A later section that needs
  it refers back ("see Options") instead of repeating it. Never put the same
  item in both a table and bullets.
- **Not a summary.** Output length lands between 0.75x and 1.4x of the input's
  words. Labels and headings add words; filler removal cuts them.
- **Cut only filler.** Preambles ("Great question"), sign-offs ("Hope this
  helps", "Let me know if…"), restated conclusions, and empty hedges always
  go, never as their own section. If you drop anything with content, list it
  under a final `Dropped` line so the user can check.
- **Code and quotes untouched.** Fenced code, commands, error messages, and
  quoted text stay byte-for-byte.

## Workflow

1. **Inventory.** Before writing, list (privately) every atomic fact: each
   cause, number, named thing, recommendation, and caveat. This list is the
   checklist for step 4.
2. **Classify the shape.** Pick the closest skeleton below. Mixed messages get
   one section per shape, in the author's order of importance.
3. **Write.** Apply the skeleton and the formatting rules.
4. **Check.** Walk the inventory: each item must be findable in the output.
   Check every number from the input appears with its unit. Then reread each
   bullet against the input: delete any clause the author did not write the
   meaning of, and any fact stated a second time. Fix gaps before returning.

Return only the Markdown. No "Here is the restructured version", no "Sure!".

## Skeletons

Every output starts with a **bottom line**: one or two sentences, at most 40
words, stating the author's main conclusion. Reuse the author's own
conclusion sentence nearly verbatim when one exists; do not compress a
multi-step cause into a single "because" that drops a step. Then:

| Shape | Signals | Sections after the bottom line |
| --- | --- | --- |
| Diagnosis / postmortem | "caused", "the problem was", numbered failures | `What went wrong` (one item per cause), `What to change`, other remarks |
| Recommendation | "I'd suggest", options, trade-offs | `Recommendation`, `Options` (table if 3+ share attributes), `Why`, `Caveats` |
| Explanation | "how X works", mechanism, steps | `Short version`, `How it works` (ordered steps), `Details`, `Gotchas` |
| Plan / instructions | steps, commands, "first … then" | `Steps` (numbered, commands in code blocks), `Prerequisites`, `Verify` |
| Comparison | "vs", "differs", pros/cons | Table with one row per option, then `Notes` for what the table can't hold |

Name sections with the author's vocabulary when it is more specific than the
skeleton's ("Validation", not "Other").

## Formatting rules

- **One idea per bullet.** A bullet holds at most two short sentences. Split
  compound causes ("X, which caused Y") into a cause bullet and an effect
  bullet.
- **Label enumerated items.** Numbered causes or options get a bold 2–5 word
  label, then sub-bullets.
- **Problem / Effect / Fix only for diagnoses.** Use these sub-labels only in
  a diagnosis section, only for parts the author gave, and each at most once
  per item. Explanations, caveats, and steps use plain bullets; there, a
  cause and its consequence can share one bullet joined with "so".
- **Tables only for parallel data.** Use one when 3+ items share the same
  2+ attributes and each cell stays under ~12 words. Long reasoning goes in
  bullets, not cells.
- **No paragraph longer than three lines.** Prose survives only for context
  that has no list shape (one or two sentences under a heading).
- **Bold is for labels.** Do not bold phrases mid-sentence.
- **Keep the author's voice and person.** "I under-specified X" stays first
  person; do not turn it into "The spec was under-specified". "I'd improve
  the skill with X" stays "I'd improve…", not the imperative "Improve…".
  Addressing the reader ("your query") stays second person.
- **Keep the author's order** within a section unless reordering puts the
  conclusion first.
- **Collect actions.** When the author says what should be done next, gather
  it under `What to change` / `Next steps`, worded as the author worded it.
  Commands the author gave as instructions to the reader stay imperative.
- **Inline code** for values, identifiers, file names, CSS units, and flags.

## Example

Input (excerpt):

> 3. Some geometry was ambiguous. The bar percentages mixed full-track widths
> with gaps. The subagent calculated the leftover as 38fr, producing a longer
> gray segment. Explicit segment bounds would have prevented that.

Output:

```markdown
3. **Ambiguous geometry**
   - *Problem:* bar percentages mixed full-track widths with gaps.
   - *Effect:* the subagent calculated the leftover as `38fr`, so the gray
     segment came out longer.
   - *Fix:* explicit segment bounds would have prevented it.
```

## Evals

[evals/README.md](evals/README.md) holds cases, the scorer, the judge rubric,
and the rating log used to improve this skill. When editing this file, run the
evals before and after and compare.
