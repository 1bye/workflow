# Components

Read this when adding or changing a draft component, its props, or its preview behavior.

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
    disabled: Schema.Control.Boolean({ default: false }),
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

## Preview instances and identity

Each component opens as one centered, interactive preview using its configured
props. Duplicate the selected instance to compare another configuration, click an
instance to edit its controls, and remove copies when finished. At least one instance
remains. Instances arrange in a centered row and wrap as needed. When several are
present, a small “Selected” label appears below the active instance.

For components that need room, add `preview: { minWidth: 320 }` to the component
schema's options. This reserves at least 320 CSS pixels for its preview content,
while allowing it to shrink to the available canvas width on narrow screens.
This is workbench metadata, separate from component props and controls. See the
[accordion example](../assets/workspace/components/accordion/accordion.schema.ts).

Props, instance order, and selection save per component in browser storage.
Duplicating copies configured props; transient component-local interaction state
starts fresh. Reset and Action target the selected instance. Canvas layout and
selection belong to the workbench, so do not add them as component controls.
The cursor button enables a spacing inspector. Hover a rendered element
to preview its margin in orange, padding in green, and CSS flex/grid gaps in purple.
The overlay follows the cursor without selecting layers. With the cursor over a
colored spacing region, two-finger vertical scrolling adjusts that exact CSS property:
scroll up to increase, down to decrease; hold Shift for finer adjustments. Padding
and gaps stop at zero; margins may be negative. The gesture keeps its target while
the layout moves and releases it when the pointer moves away. Pinch-to-zoom and
horizontal scrolling retain their normal behavior. Outside spacing regions, scrolling
remains normal.

Spacing edits autosave per preview instance and duplicate independently. They are
preview CSS overrides, separate from schema props, and do not update component source.
“Reset spacing” clears them for the selected instance. Targets follow rendered DOM
child paths, so source structure changes may require resetting spacing edits.
Component controls and live interactions remain available. Escape, the cursor button, or clicking empty
canvas space exits inspection.

Existing `states` declarations no longer render automatically; presets are deferred.
Hidden controls still contribute props. Action controls contribute no props.

IDs default to the entry's path inside `components/`, such as `maps/pin`.
Use the optional component `id` when identity must survive moving the entry.
IDs use letters, digits, `/`, `_`, or `-`, starting with a letter or digit;
`constructor`, `prototype`, and `__proto__` are reserved. Duplicate IDs are errors.
