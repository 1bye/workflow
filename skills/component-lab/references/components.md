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

## Folders and comparison

Directories above a component's own directory appear as folders in the component
grid. For example, `components/inputs/button/index.ts` appears inside Inputs;
`components/inputs/toggles/switch/index.ts` appears inside Inputs / Toggles.
Folder tiles show descendant counts, breadcrumbs navigate back, and search looks
across all folders by component name or directory path.

Before moving an existing draft into a folder, set its explicit schema `id` to
its current ID. Move the complete component directory, including sibling assets.
This preserves saved tweaks, instances, and spacing overrides. New components may
continue to use automatic IDs. The first version browses filesystem folders;
folder creation and moves are performed in the project files, not by dragging tiles.

Command/Ctrl-click component tiles to select them for comparison. The current
component is included when starting a selection. Click Compare once at least two
are selected; selections can span folders and search results. Click a rendered
preview to edit that component and instance in controls. Names below previews
identify components; the selected preview gets the same small Selected label.
Duplicate, reset, actions, and spacing edits target the selected component's
instance. All instances stay independent, including different components with the
same instance ID. The comparison row wraps when space runs out.

Done or clearing the comparison selection returns to the original component.
Comparison selection is temporary; edits and instance changes still autosave.
Leaving comparison does not delete previews or reset values. Selecting an unrelated
component normally opens its single-component view. Presets and synchronized
controls remain deferred.

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
The overlay follows the cursor without selecting layers. Spacing targets extend
10 pixels beyond their visible regions, so thin and zero values are easy to reach.
Near an edge, one compact handle shows the padding value, including zero. Hold
Option/Alt to target zero margins or resolve overlapping edges. Visible margin
regions target margins directly without a modifier. A gap handle appears between adjacent flex
or grid children even when the gap is zero. Only the nearest handle is shown;
internal gap boundaries take priority over overlapping child edges. With the cursor over a
colored spacing region or its handle, two-finger vertical scrolling adjusts that exact CSS property:
scroll up to increase, down to decrease; hold Shift for finer adjustments. Padding
and gaps stop at zero; margins may be negative. The compact Side / X / Y / All
selector controls which padding or margin sides change on the hovered element.
X changes left/right, Y changes top/bottom, and All changes all four sides. Hold
Command to temporarily use All; releasing it restores the selected scope. Gaps
keep their individual row or column axis. Affected sides are highlighted before
scrolling, including zero edges. Group changes use the same delta on every side,
preserve asymmetric spacing, and stop together when one side reaches a limit.
The gesture keeps its target while
the layout moves and releases it when the pointer moves away. Pinch-to-zoom and
horizontal scrolling retain their normal behavior. Outside spacing regions, scrolling
remains normal.

Spacing edits autosave per preview instance and duplicate independently. They are
preview CSS overrides, separate from schema props, and do not update component source.
The Reset dropdown offers “Reset tweaks” for schema props and “Reset spacing” for
preview spacing overrides, independently on the selected instance. Targets follow rendered DOM
child paths, so source structure changes may require resetting spacing edits.
Component controls and live interactions remain available. Escape, the cursor button, or clicking empty
canvas space exits inspection.

Existing `states` declarations no longer render automatically; presets are deferred.
Hidden controls still contribute props. Action controls contribute no props.

IDs default to the entry's path inside `components/`, such as `maps/pin`.
Use the optional component `id` when identity must survive moving the entry.
IDs use letters, digits, `/`, `_`, or `-`, starting with a letter or digit;
`constructor`, `prototype`, and `__proto__` are reserved. Duplicate IDs are errors.
