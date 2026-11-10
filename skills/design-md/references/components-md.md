# COMPONENTS.md guide

COMPONENTS.md is the inventory of everything screens are built from. It is
not part of Google's spec; it is this skill's companion format. It holds what
DESIGN.md cannot: names that map to code, props, variants, states, usage
rules, composition, motion, and links to logic.

## Shape

```markdown
# <System name> components

Tokens and principles: [DESIGN.md](DESIGN.md). Values are never repeated
here; components reference token names.

## Motifs

Recurring visual ideas that span components (for example "one big thin
number with a small grey unit"). One short paragraph each.

## <Group>            (Actions, Navigation, Inputs, Data display, Feedback, ...)

One or two sentences on rules shared by the group.

### <ComponentName>

<One sentence: what it is for.>

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "secondary" \| "danger"` | `"secondary"` | |

- **Sizes**: <name: height/padding tokens, and where each size is used>
- **States**: <default, pressed, focus-visible, disabled, loading, ... and how each looks>
- **Tokens**: `{colors.accent}`, `{typography.body}`, `{rounded.pill}`
- **Rules**: <usage rules: when to use, when not, limits per screen>
- **Motion**: <what animates, motion token, reduced-motion behavior>
- **A11y**: <role, name, keyboard notes>
- **Logic**: <data or functions it depends on, e.g. getAvailabilityState>
- **Code**: <path to implementation, or "not built">
```

Omit bullets that do not apply. Keep entries short; a component that needs a
page of text is probably two components.

## Naming

- Component names are PascalCase and match the code (existing or intended).
- Prop names match the platform and project conventions (`disabled`, `value`,
  `onChange`), as in `component-craft`'s API guide.
- Variants of one component share an entry; a different behavior is a
  different entry.

## What belongs here vs DESIGN.md

| Put in DESIGN.md | Put in COMPONENTS.md |
| --- | --- |
| Token values | Token references |
| `components:` styling tokens (bg, text, radius, padding, height) | Props, variants, sizes by context, states |
| System-wide principles and Do's/Don'ts | Component-specific usage rules |
| Motion tokens | Which component uses which motion and when |

If a value appears in COMPONENTS.md that is not a token, either it should be a
token (add it to DESIGN.md) or it is component geometry the spec has no group
for (state it once in the component entry and note it).

## Cross-file checks

After writing both files, run the bundled script (Node, no dependencies):

```sh
node <this skill>/scripts/crosscheck.mjs DESIGN.md COMPONENTS.md
```

It fails on any `{group.token}` reference in COMPONENTS.md that DESIGN.md does
not define, and warns about `components:` keys no entry references (except
`pair-*` contrast entries) and raw hex colors in COMPONENTS.md.

Then check by reading:

1. Every component with variants in DESIGN.md `components:` lists the same
   variants in its props table.
2. If code exists, each **Code** path exists.
