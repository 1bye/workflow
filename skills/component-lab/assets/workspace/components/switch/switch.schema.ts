import * as Schema from "@local";

const toggle = Schema.Component("Switch", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  controls: {
    label: Schema.Control.Text({ default: "Focus mode", maxLength: 40 }),
    description: Schema.Control.Text({ default: "A little less noise.", maxLength: 80 }),
    checked: Schema.Control.Boolean({ default: false }),
    disabled: Schema.Control.Boolean({ default: false }),
    size: Schema.Control.Number({ default: 28, min: 20, max: 40, unit: "px" }),
    radius: Schema.Control.Number({ default: 24, min: 0, max: 32, unit: "px" }),
    accent: Schema.Control.Color({
      default: "#668977",
      options: ["#668977", "#7c79ba", "#3f80ac", "#d39a37"],
    }),
    easing: Schema.Control.Easing({ default: [0.22, 1, 0.36, 1] }),
  },
  states: {
    default: { name: "Interactive", description: "Click the switch or press Space." },
    on: { name: "On", props: { checked: true } },
    disabled: { name: "Disabled", props: { checked: true, disabled: true } },
  },
});

export default toggle;
export type SwitchProps = Schema.Props<typeof toggle>;
