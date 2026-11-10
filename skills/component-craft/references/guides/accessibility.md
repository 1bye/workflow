# Accessibility

Native semantics first; ARIA only to fill gaps. No ARIA is better than wrong ARIA.

## Semantics

Think about:
- What role does a screen reader announce? Is it the native element for that role?
- Accessible name: visible label linked by `for`/`id` or wrapping, then
  `aria-labelledby`, then `aria-label` as last resort.
- Icon-only controls always have a name; decorative icons are `aria-hidden`.
- Generate stable ids with the framework's id utility (`useId`), never random
  per render (breaks SSR).

Often forgotten:
- A visible label that is not programmatically linked.
- Headings or landmarks inside a primitive, which pollutes page structure.

Done when: the accessibility tree shows the right role, name, and value for
every state (inspect it in the browser).

## Announce

Think about:
- Description and error text linked with `aria-describedby`; `aria-invalid`
  set when invalid.
- Required indicated with `required` / `aria-required`, not just an asterisk.
- Dynamic changes (results count, saved, error) announced via a live region,
  politely, and only once.
- State changes exposed (`aria-expanded`, `aria-pressed`, `aria-checked`,
  `aria-selected`, `aria-busy`).

Often forgotten:
- Errors that appear but are never announced.
- Announcing on every keystroke.

Done when: each dynamic message was checked with a screen reader or the
accessibility tree, and error association is verified.

## Preferences

Think about:
- Contrast for text, placeholder, borders that define the control, and the
  focus ring, in every theme.
- Windows forced colors (`forced-colors: active`): borders and focus must
  survive when backgrounds are removed. Use `outline` or `border`, not
  only `box-shadow`, for essential edges.
- `prefers-reduced-motion`, `prefers-contrast`, and 200% zoom / text resize.
- Information never conveyed by color alone.

Done when: forced colors and 200% zoom were viewed, and contrast checked for
the risky pairs (placeholder, disabled, borders).
