import * as Schema from "@local";

const segmented = Schema.Component("Segmented navigation", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  controls: {
    label: Schema.Control.Text({ default: "Workspace view", maxLength: 40 }),
    selected: Schema.Control.Select(["Board", "List", "Calendar"], { default: "Board" }),
    appearance: Schema.Control.Select(["soft", "solid", "underline"], { default: "soft" }),
    height: Schema.Control.Number({ default: 38, min: 28, max: 52, unit: "px" }),
    radius: Schema.Control.Number({ default: 9, min: 0, max: 24, unit: "px" }),
    showIcons: Schema.Control.Boolean({ default: true }),
    accent: Schema.Control.Color({
      default: "#7482a6",
      options: ["#7482a6", "#668977", "#7c79ba", "#292929"],
    }),
  },
  states: {
    default: { name: "Soft", description: "Choose a view with click or arrow keys." },
    solid: { props: { appearance: "solid", selected: "List" } },
    underline: { props: { appearance: "underline", selected: "Calendar" } },
  },
});

export default segmented;
export type SegmentedProps = Schema.Props<typeof segmented>;
