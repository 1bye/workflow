# Content

Design with real and hostile content, not "Label" and "Lorem".

## Edge cases

Preview each that applies:
- Empty, one character, typical, very long (single unbroken word, URL, email).
- Long labels, descriptions, and error messages wrapping to several lines.
- Many items, one item, zero items.
- Numbers: zero, negative, huge, decimals, units.
- User-pasted content: leading/trailing spaces, newlines, emoji, rich text.
- Values arriving late (async default value) or changing from outside.

Think about:
- Truncate, wrap, or scroll? Decide per part. Truncated text needs a way
  to read the full value.
- Does content change the component's height and shift surrounding layout?
- `min-width: 0` on flex children so truncation actually works.

Often forgotten:
- Error text longer than the field.
- Emoji and combined characters breaking counters (`maxLength` counts UTF-16 units).

Done when: the preview includes the long, empty, and pasted cases and none
overflows its container.

## Locale

Think about:
- Right-to-left: use logical properties (`margin-inline-start`, `inset-inline`)
  so icons and padding flip; directional icons (arrows, chevrons) mirror.
- Translations 30–50% longer than English.
- Number, date, and currency formatting via `Intl`, not hardcoded.
- Hardcoded strings inside the component (clear, show password, loading)
  must be overridable for translation.

Done when: the component was previewed with `dir="rtl"` and a long translation,
and no internal string is unoverridable.
