# Components

Read this when adding or changing a draft component, its props, or its visible states.

## Files and binding

Entries are discovered at `.component-lab/components/**/index.ts`. A typical draft has:

```text
components/button/
├── button.schema.ts
├── Button.tsx
├── index.ts
└── thumbnail.svg
```

Define controls by prop name in `button.schema.ts`:

```ts
import * as Schema from "@local";

const button = Schema.Component("Button", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  controls: {
    label: Schema.Control.Text({ default: "Continue", maxLength: 60 }),
    size: Schema.Control.Number({ default: 16, min: 12, max: 24, unit: "px" }),
    disabled: Schema.Control.Boolean({ default: false, hidden: true }),
  },
  states: {
    default: {},
    disabled: { description: "Unavailable", props: { disabled: true } },
  },
});

export default button;
export type ButtonProps = Schema.Props<typeof button>;
```

Consume the inferred props in `Button.tsx`:

```tsx
import type { ButtonProps } from "./button.schema";

export default function Button({ label, size, disabled }: ButtonProps) {
  return (
    <button type="button" disabled={disabled}
      className="rounded-md bg-neutral-800 px-4 py-2 text-white disabled:opacity-40"
      style={{ fontSize: size }}>
      {label}
    </button>
  );
}
```

Bind the implementation in `index.ts`:

```ts
import schema from "./button.schema";
import Button from "./Button";

export default schema.from(Button);
```

Use [Controls](controls.md) for value shapes and [SVG thumbnails](thumbnails.md)
to generate the component-list preview. The bundled [pin example](../assets/workspace/components/pin/pin.schema.ts)
and [controls demo](../assets/workspace/components/controls-demo/controls.schema.ts)
show the current API in use.

## States and identity

Named states render side by side. Each state's `props` override the shared control
values; `name` and `description` configure its label and caption. Omitted states
produce one default state. Hidden controls still contribute props, so they can
represent forced hover/loading/disabled variants. Action controls contribute no props.

IDs default to the entry's path inside `components/`, such as `maps/pin`.
Use the optional component `id` when identity must survive moving the entry.
IDs use letters, digits, `/`, `_`, or `-`, starting with a letter or digit;
`constructor`, `prototype`, and `__proto__` are reserved. Duplicate IDs are errors.
