# Contract

The API outlives the styling. Design it for the call sites you listed.

## Anatomy

Think about:
- Name every part (root, label, control, icon, adornment, description,
  error, indicator). Names become class names, slots, and data attributes.
- Which parts are optional, and what the layout does when they are absent?

Often forgotten:
- Description and error text belonging to the component vs the surrounding
  field. Decide one owner.

Done when: a parts list with optional/required marks is in the checklist.

## Props

Think about:
- Match platform names (`disabled`, `value`, `onChange`, `name`, `required`)
  instead of inventing (`isDisabled`, `onValueChange`) unless the project
  already uses a convention. Follow the project's convention when it exists.
- Required props are the minimum to render something correct.
- Defaults that are safe in the most common usage.
- Boolean props that combine into impossible states (`primary` + `danger`)
  should be one enum instead.

Often forgotten:
- Event signatures: native event vs value. Pick one and be consistent.
- Props that only exist to override style; prefer `className` or tokens.

Done when: a typed props list with defaults exists and every prop maps to a
listed usage.

## Variants

Think about:
- Each variant must come from a real usage. Speculative variants are removed.
- Is a "variant" actually a different component (a search input with
  a results popover is a combobox, not an input variant)?
- Sizes: do they align with sibling components (button, select) at the same size?

Done when: variants and sizes are listed with the call site that needs each.

## Control

Think about:
- Controlled (`value` + `onChange`), uncontrolled (`defaultValue`), or both.
  Form inputs normally support both.
- Switching between controlled and uncontrolled at runtime should warn or be
  impossible, not silently misbehave.
- For open/close components: `open`, `defaultOpen`, `onOpenChange`.

Done when: control mode is decided and both modes are previewed if supported.

## Passthrough

Think about:
- Forward the ref to the element consumers need (usually the native control,
  not the wrapper).
- Spread remaining native props onto that same element.
- `className` and `style`: which element receives them? Document it.
- Data attributes for state (`data-state`, `data-invalid`, `data-disabled`)
  so consumers can style without new props.

Often forgotten:
- `id`, `aria-*`, and `name` reaching the native element when a wrapper exists.
- Merging consumer event handlers with internal ones instead of replacing them.

Done when: a consumer can attach a ref, an `aria-describedby`, and an
`onBlur` and all three work.

## Composition

Think about:
- Single component with props, compound components (`Field.Label`,
  `Field.Control`), or slots. Choose by how often consumers rearrange parts.
- `asChild` / polymorphic `as`: only if consumers truly render other elements.

Done when: the shape is chosen and one non-default arrangement is previewed.
