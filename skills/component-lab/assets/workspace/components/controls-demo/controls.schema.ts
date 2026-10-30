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
  },
  states: { preview: { name: "Live preview", description: "Your changes, live." } },
});

export default controls;
export type ControlsProps = Schema.Props<typeof controls>;
