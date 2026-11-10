---
name: walkthrough
description: Turn "what's next?" into a concrete, reviewable preview of the change before it is made. Lists remaining work as specific cards (files, change, risk), and expands a picked step into before/after code snippets, what each snippet does, what code or behavior goes away, what could fail, and how to check it worked. Use when the user asks what is left to do, what to do next, to pick or explain a step of a plan, or says a plan is too vague; or when a message starts with or includes this skill's name.
---

# Walkthrough

The user should be able to read one reply and know exactly what will change in
their code, why, what disappears, and what could break, without opening an
editor. Vague verbs ("handle errors", "refactor the service", "wire it up")
are failures of this skill. Every step points at real code.

## Modes

Pick the mode from the request:

- **Menu mode**: "what's left?", "what can we do next?", "what else is in the
  plan?". Return the remaining work as step cards (below), then stop and let
  the user pick.
- **Step mode**: "do the first one", "show me step 2", "how would we do X?".
  Expand one step into a full preview (below). Do not apply it yet.
- **Apply mode**: the user approved a previewed step ("go", "do it", "yes").
  Make exactly the previewed change. If something has to differ from the
  preview, stop and show the difference first.

When the user names a step directly ("let's add retries"), skip menu mode.

## Ground rules

- **Look before you preview.** Read the files the step touches before writing
  snippets. Snippets quote the real current code, not a guess at it.
- **Never invent code you have not seen.** If you cannot read the file (for
  example in a chat without repo access), say which file and which part you
  need, or label the snippet `sketch: not checked against your file`.
- **Concrete nouns only.** Name the file, function, component, route, table,
  or command. "Update the handler" becomes "`src/api/orders.ts`,
  `createOrder()`".
- **Small steps.** A step fits in one review: about 1–3 files and under ~60
  changed lines. Split anything larger and say how it was split.
- **Preview, then wait.** In step mode, end with the go/no-go question. Do not
  edit files until the user approves.

## Menu mode: step cards

Start with one line: where the plan stands (done / remaining count). Then one
card per remaining step, in the order you recommend:

```markdown
### 1. Add retry to payment webhook
- **Change:** wrap the Stripe call in `handleWebhook()` with 3 retries and backoff
- **Files:** `src/payments/webhook.ts`, `src/lib/retry.ts` (new)
- **Why now:** step 3 (refunds) calls the same function
- **Risk:** low — new code path only runs on network errors
- **Size:** ~40 lines, 2 files
```

- Each `Change` line is one sentence a developer could start on without
  asking a follow-up question.
- `Risk` is `low`, `medium`, or `high`, plus the reason in a few words.
- Mark steps that depend on another step ("needs step 1").
- End with: "Which one should I preview?" and your recommendation.

## Step mode: the preview

Use these sections, in this order. Skip a section only when it is truly empty,
and say so in one line ("Nothing removed.").

1. **Bottom line.** One or two sentences: what this step changes and what the
   user gets from it.
2. **Where.** The files and symbols touched, as a short list. Mark new files
   `(new)` and deleted files `(deleted)`.
3. **The change.** One block per logical edit. Each block has:
   - a bold label naming the edit,
   - one line saying what it does in plain words,
   - the snippet as a `diff` block with a few lines of real context, or
     before/after blocks if the diff would be unreadable,
   - at most two bullets explaining any line that is not obvious.
   Keep snippets to the lines that matter; use `// ...` for unchanged code.
4. **What goes away.** Code, files, props, config, behavior, or data that is
   removed, renamed, or stops working the old way, and who relied on it
   (callers, tests, users). This is the section people forget; check it by
   searching for usages of anything you remove or rename.
5. **What could fail.** The failure points, most likely first. For each:
   - **What:** the specific way it breaks (input, state, timing, environment),
   - **You'd notice:** the symptom (error message, wrong value, silent no-op),
   - **Guard:** what in this change prevents it, or what we accept and why.
   Include edge cases (empty, null, very large, concurrent, offline, slow),
   migrations and existing data, and anything outside the diff that depends
   on the changed code.
6. **How we check it.** The exact command, test, or manual click path that
   proves the step works, and what passing looks like.
7. **Go?** One question: approve, adjust, or pick another step. Mention
   anything you need from the user to proceed.

## Writing rules

- One idea per bullet, at most two short sentences.
- Code identifiers, paths, values, and commands in inline code.
- No preambles, no "Great question", no recap of the menu.
- Do not pad empty sections with generic risks ("bugs may occur"). A failure
  point names a concrete trigger.
- If a step turns out bigger or riskier than its card said, say so at the top
  of the preview and offer a split.

## Example (step mode, shortened)

````markdown
**Bottom line:** Webhook calls to Stripe retry up to 3 times on network
errors, so a blip no longer drops a payment event.

**Where**
- `src/lib/retry.ts` (new): `withRetry()`
- `src/payments/webhook.ts`: `handleWebhook()`

**1. Retry helper**
Runs a function again with growing delays when it throws a network error.

```diff
+export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
+  for (let i = 1; ; i++) {
+    try { return await fn() }
+    catch (e) {
+      if (i >= tries || !isNetworkError(e)) throw e
+      await sleep(200 * 2 ** i)
+    }
+  }
+}
```
- Only network errors retry; a card decline fails immediately.

**2. Use it in the webhook**
```diff
 export async function handleWebhook(event: Stripe.Event) {
-  const charge = await stripe.charges.retrieve(event.data.object.id)
+  const charge = await withRetry(() => stripe.charges.retrieve(event.data.object.id))
```

**What goes away**
- Nothing removed. The webhook now takes up to ~1.4s longer on failures.

**What could fail**
- **What:** Stripe resends the same event while we are still retrying.
  **You'd notice:** the charge is processed twice.
  **Guard:** none yet — `handleWebhook()` has no idempotency check. Suggest
  adding it as the next step.
- **What:** `isNetworkError()` misses a timeout shape.
  **You'd notice:** timeouts still fail on the first try.
  **Guard:** test below covers `ETIMEDOUT` and `ECONNRESET`.

**How we check it**
- `bun test src/lib/retry.test.ts` — 4 tests pass, including "does not retry
  a decline".

**Go?** Apply this, or add the idempotency check first?
````
