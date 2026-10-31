# Controls

Read this when choosing a control or configuring its value and editor. Import
`* as Schema from "@local"` and use `Schema.Control` inside a component schema.
Keys become inferred prop names. Every builder accepts optional `label` and
`hidden`; all value controls require `default`. Action is the exception: it runs
a callback and contributes neither props nor saved values.

## Basic values

| Builder | Example | Inferred value |
| --- | --- | --- |
| Number | `Schema.Control.Number({ default: 16, min: 8, max: 64, step: 1, unit: "px" })` | `number` |
| Color | `Schema.Control.Color({ default: "#668977", options: ["#668977", "#7c79ba"] })` | Six-digit hex `string` |
| Boolean | `Schema.Control.Boolean({ default: true })` | `boolean` |
| Text | `Schema.Control.Text({ default: "Continue", maxLength: 60 })` | `string` |
| Select | `Schema.Control.Select(["filled", "soft", "outline"], { default: "filled" })` | Union of option strings |

Number defaults to bounds 0–100 and step 1. Text defaults to 120 characters;
`maxLength` may be 1–500. Select uses compact tabs when a few short options fit,
and a dropdown for larger option sets.

## Geometry and easing

```ts
const geometry = {
  position: Schema.Control.Vector2({
    default: { x: 0, y: 0 }, min: -60, max: 60, unit: "px",
  }),
  width: Schema.Control.Interval({
    default: [120, 240], min: 80, max: 320, unit: "px",
  }),
  padding: Schema.Control.Spacing({
    default: { top: 8, right: 12, bottom: 8, left: 12 }, max: 40, unit: "px",
  }),
  corners: Schema.Control.Corners({
    default: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
    max: 64,
  }),
  easing: Schema.Control.Easing({ default: [0.25, 0.1, 0.25, 1] }),
};
```

Vector2, Interval, and Spacing accept `min`, `max`, `step`, and `unit`.
Their default bounds are −100–100, 0–100, and 0–64 respectively. Corners uses
non-negative pixel radii and accepts `max` and `step`. Spacing and Corners have
linked or independent fields. Interval values are ordered `[min, max]`.

Easing is `[x1, y1, x2, y2]` for CSS cubic Bézier curves. X handles must stay in
0–1; Y handles may overshoot. Use `cubic-bezier(${easing.join(",")})` in a style.

## Surface and typography

```ts
const appearance = {
  gradient: Schema.Control.Gradient({
    default: {
      angle: 135,
      stops: [
        { color: "#7c79ba", position: 0 },
        { color: "#3f80ac", position: 100 },
      ],
    },
  }),
  shadow: Schema.Control.Shadow({
    default: {
      x: 0, y: 8, blur: 24, spread: -4,
      color: "#000000", opacity: 0.25, inset: false,
    },
  }),
  typography: Schema.Control.Typography({
    default: {
      fontFamily: "system-ui", fontSize: 16, fontWeight: 500,
      lineHeight: 1.4, letterSpacing: 0,
    },
    fonts: ["system-ui", "serif", "monospace"],
  }),
};
```

Gradient uses an angle of 0–360 degrees and 2–8 ordered six-digit hex color stops
at positions 0–100. Shadow offsets/spread use pixels, blur is non-negative, and
opacity is 0–1. `Schema.gradientCSS(value)`, `Schema.shadowCSS(value)`, and
`Schema.cornersCSS(value)` format values for React styles.

Typography maps directly to React styles: size and letter spacing use pixels;
line height is unitless. Optional `fonts` lists available families and must include
the default. It does not load font files. Without a list, the menu includes the
default family plus system UI, serif, and monospace.

## Asset and Action

```ts
const extras = {
  image: Schema.Control.Asset({ default: "/drafts/images/photo.png" }),
  replay: Schema.Control.Action({
    button: "Replay",
    onClick: async ({ element }) => {
      await element.animate([{ opacity: 0.25 }, { opacity: 1 }], {
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500,
      }).finished;
    },
  }),
};
```

Asset supplies a source string: an imported local image, a root-relative path,
an embedded image, or `""` for no image. `/drafts/` maps to the project workspace.
The picker supports PNG, JPEG, WebP, GIF, and SVG files up to 256 KB, embeds them
in browser storage, and provides a thumbnail and clear button. Use project paths
for larger images. Remote image URLs are not supported by the local workbench.

Action runs its callback inside the selected preview instance. `element` is that
instance's preview wrapper. Returning a promise keeps the button busy until
completion; failures appear inline. Actions run only when clicked, never on reload.

See the complete [controls demo](../assets/workspace/components/controls-demo/controls.schema.ts)
and its [React implementation](../assets/workspace/components/controls-demo/ControlsDemo.tsx).
