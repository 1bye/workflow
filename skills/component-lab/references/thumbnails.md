# Minimal SVG thumbnails

Read this when creating or updating a component's small preview in the component
list. This is a static `thumbnail.svg` beside the draft component; the large live
preview is rendered from TSX. Generate the SVG alongside each new component and
update it when the component's identifying shape changes.

## Visual language

- Show one representative default state and its identifying silhouette: a button
  and label bar, a toggle track and thumb, a slider line and knob, or a pin outline.
- Write SVG directly with a few `rect`, `circle`, `line`, and `path` elements.
  Use filled bars for incidental text; the component name already appears below.
- Start with `viewBox="0 0 120 80"` and matching width/height. Center the artwork
  with generous padding; keep essential details roughly within `x=12…108`,
  `y=14…66` so a compact tile can crop its edges without losing the shape.
- Prefer a flat neutral background and two or three neutral tones. Add one muted
  accent only when color helps identify the component. Use consistent radii and
  strokes around 2 viewBox units so details survive shrinking.
- Omit surrounding app chrome, decorative scenes, tiny labels, complex shadows,
  and gradients unless one is essential to recognizing this particular component.
  Keep the file self-contained: no fonts, external images, scripts, or `foreignObject`.

Thumbnails render as `<img>` elements about 62 CSS pixels tall with `object-fit:
cover`; their width changes as the sidebar resizes. Use explicit SVG colors:
workbench CSS variables and `currentColor` do not inherit into the image document.
A quiet neutral background should sit comfortably in either interface theme.

## Example: a pin

Save as `components/pin/thumbnail.svg` inside the project workspace:

```svg
<svg xmlns="http://www.w3.org/2000/svg"
     width="120" height="80" viewBox="0 0 120 80" fill="none">
  <rect width="120" height="80" rx="6" fill="#eeeeee"/>
  <path d="M77 32c0 12-17 27-17 27S43 44 43 32a17 17 0 1 1 34 0Z"
        fill="#737373"/>
  <circle cx="60" cy="32" r="5" fill="#ffffff"/>
</svg>
```

For another component, keep the framing and palette but replace the pin with its
own simplified shape. Avoid reusing a generic placeholder across unrelated components.

## Connect and verify

Point the component schema at its sibling SVG:

```ts
import * as Schema from "@local";

const pin = Schema.Component("Location pin", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  controls: {
    size: Schema.Control.Number({ default: 44, min: 28, max: 72 }),
  },
});
```

The `thumbnail` field is optional in the API; it does not generate an SVG
automatically. Supply it for new drafts so the component list has a useful preview.
See [Components](components.md) for the complete schema and binding pattern.

Check that the SVG parses, then inspect it in the actual component tile at a small
sidebar width and in both themes. The shape should remain recognizable without
reading text, with no clipped essential details or broken image. Simplify details
that disappear at tile size instead of scaling up the whole drawing.
