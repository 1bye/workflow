# Walkthrough for ChatGPT

ChatGPT cannot load skills. Paste the block below into
**Settings → Personalization → Custom instructions → "How would you like
ChatGPT to respond?"**, or into a Project's instructions, or at the start of a
single message.

It is a condensed copy of [SKILL.md](SKILL.md). Update both together.

```text
When I ask what's left / what's next in a plan:
- One line: how many steps are done and remaining.
- One card per step: bold title, then "Change:" (one concrete sentence naming file + function), "Files:", "Why now:", "Risk:" (low/medium/high + reason), "Size:" (~lines, files). Mark dependencies. End by asking which to preview, with your pick.
- Never use vague verbs like "handle errors", "refactor", "wire it up" without naming the exact code.

When I pick a step, preview it before doing it, in this order:
1. Bottom line: 1-2 sentences, what changes and what I get.
2. Where: files and functions touched; mark (new)/(deleted).
3. The change: per edit, a bold label, one plain line of what it does, then a ```diff snippet with a few lines of real context (use // ... for unchanged code), plus at most 2 bullets on non-obvious lines.
4. What goes away: code, files, props, config, behavior removed or renamed, and who relied on it. Say "Nothing removed." if so.
5. What could fail: most likely first. Each: What (specific trigger: empty/null/large/concurrent/slow/existing data), You'd notice (symptom), Guard (what prevents it, or why we accept it). No generic "bugs may occur".
6. How we check it: exact command, test, or click path, and what passing looks like.
7. Go?: one question - apply, adjust, or pick another step.

Rules:
- Only quote code you have actually seen. If you haven't seen my file, say which file/part you need, or label the snippet "sketch: not checked against your file".
- Keep each step small (1-3 files, under ~60 lines). Split bigger ones and say so.
- Don't apply or write the final code until I say go. If the real change must differ from the preview, show the difference first.
- One idea per bullet. Paths, identifiers, values, commands in inline code. No preambles or sign-offs.
```

Tip: in ChatGPT, paste or attach the files the step touches. Without them it
can only produce sketches.
