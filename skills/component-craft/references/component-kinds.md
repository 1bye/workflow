# Component kinds

Classify the component, then add its extra to-dos to the checklist. A component
can belong to more than one kind (a combobox is a text input and an overlay).

## Text input (input, textarea, search, number, password, OTP)

Emphasize: states, content, forms, platform.

- Native `<input>` with the right `type`, `inputMode`, `autoComplete`, and
  `enterKeyHint`; each changes the mobile keyboard and autofill.
- Browser autofill styling (`:autofill`) overrides your background; check it.
- iOS Safari zooms on focus when the font size is below 16px.
- Adornments (icons, prefix, suffix, clear button, counters): clicking them
  should focus the input; they must not steal focus or break the label.
- Clear button: restores focus to the input and fires a change.
- Number inputs: scroll-wheel changes, locale decimal separators, `e` accepted.
- Password: reveal toggle, password managers, `autoComplete="new-password"`.
- IME composition (`compositionstart`/`end`): do not validate or submit mid-composition.
- `readOnly` vs `disabled`: read-only is focusable, selectable, and submitted.

## Choice control (checkbox, radio, switch, toggle, segmented control)

Emphasize: semantics, keyboard, forms.

- Checkbox indeterminate state; radio groups use arrow keys, not Tab, between options.
- Switch means immediate effect; checkbox means submit later. Confirm which.
- The whole label is the hit target.
- Hidden native input keeps form submission and validation working.

## Button and action (button, icon button, link button, menu trigger)

Emphasize: semantics, states.

- Button vs link: navigation is a link even when it looks like a button.
- Icon-only buttons need an accessible name.
- Loading state: keep width stable, prevent double submit, keep focus.
- `type="button"` by default inside forms unless it submits.

## Overlay (dialog, popover, tooltip, dropdown, sheet, toast)

Emphasize: focus, layering, interaction.

- Focus moves in on open, is contained when modal, and returns to the trigger on close.
- Escape and outside click close it; decide what happens to unsaved input.
- Scroll lock and layout shift from the disappearing scrollbar.
- Positioning near viewport edges, inside scroll containers, and with the
  virtual keyboard open on mobile.
- Tooltips are not for essential content and never for touch-only info.
- Nested overlays: Escape closes the top one only.

## Selection from options (select, combobox, autocomplete, listbox, menu)

Emphasize: keyboard, content, performance.

- Typeahead, Home/End, PageUp/PageDown, and wrap-around decisions.
- Active descendant vs roving focus; screen readers must hear the active option.
- Empty results, loading results, async errors, and very long option labels.
- Hundreds or thousands of options: virtualization and search.
- Mobile: a native `<select>` is often the better experience; decide explicitly.

## Collection and data display (table, list, grid, tree, card list)

Emphasize: content, performance, keyboard.

- Empty, loading, partial, and error states for the collection as a whole.
- Sorting, selection, and focus survive data refresh.
- Column or item overflow, sticky headers, horizontal scroll on small screens.

## Navigation (tabs, breadcrumb, pagination, sidebar, stepper)

Emphasize: semantics, keyboard, responsive.

- Current item indicated to assistive tech (`aria-current`, `aria-selected`).
- Tabs: automatic vs manual activation; panels linked to tabs.
- Overflow when items do not fit.

## Feedback and status (alert, badge, progress, skeleton, spinner, toast)

Emphasize: announcements, motion.

- Live region politeness; do not announce on every render.
- Skeletons match final layout to avoid shift.
- Progress: determinate vs indeterminate, and value text.

## Layout primitive (stack, card, container, divider)

Emphasize: api, visual.

- Keep the API tiny; resist behavior props.
- Polymorphism (`as`, `asChild`) only if consumers need other elements.
