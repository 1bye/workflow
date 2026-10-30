import * as Schema from "@local";

const controls = Schema.Component("Controls demo", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  controls: {
    fontSize: Schema.Control.Number({
      label: "Number",
      default: 16,
      min: 12,
      max: 32,
      unit: "px",
    }),
    color: Schema.Control.Color({
      label: "Color",
      default: "#7c79ba",
      options: ["#e76e50", "#668977", "#7c79ba", "#3f80ac", "#d39a37"],
    }),
    text: Schema.Control.Text({ label: "Text", default: "Make it yours", maxLength: 60 }),
    showIcon: Schema.Control.Boolean({ label: "Boolean", default: true }),
    appearance: Schema.Control.Select(["filled", "soft", "outline"], {
      label: "Select",
      default: "filled",
    }),
    weight: Schema.Control.Select(["light", "regular", "medium", "semibold", "bold"], {
      label: "Weight",
      default: "medium",
    }),
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
        x: 0,
        y: 8,
        blur: 24,
        spread: -4,
        color: "#000000",
        opacity: 0.25,
        inset: false,
      },
    }),
    typography: Schema.Control.Typography({
      default: {
        fontFamily: "system-ui",
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: 0,
      },
    }),
    corners: Schema.Control.Corners({
      default: {
        topLeft: 12,
        topRight: 12,
        bottomRight: 12,
        bottomLeft: 12,
      },
    }),
    position: Schema.Control.Vector2({
      label: "Vector2",
      default: { x: 0, y: 0 },
      min: -60,
      max: 60,
      unit: "px",
    }),
    width: Schema.Control.Interval({
      label: "Interval",
      default: [120, 240],
      min: 80,
      max: 320,
      unit: "px",
    }),
    padding: Schema.Control.Spacing({
      label: "Spacing",
      default: { top: 14, right: 20, bottom: 14, left: 20 },
      max: 40,
      unit: "px",
    }),
    easing: Schema.Control.Easing({ label: "Easing", default: [0.25, 0.1, 0.25, 1] }),
  },
  states: { preview: { name: "Live preview", description: "Your changes, live." } },
});

export default controls;
export type ControlsProps = Schema.Props<typeof controls>;
