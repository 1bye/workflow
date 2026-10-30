import * as Schema from "@local";

const pin = Schema.Component("Location pin", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  controls: {
    color: Schema.Control.Color({
      label: "Accent",
      default: "#e76e50",
      options: ["#e76e50", "#668977", "#7c79ba", "#3f80ac", "#d39a37"],
    }),
    size: Schema.Control.Number({ default: 44, min: 28, max: 72, unit: "px" }),
    radius: Schema.Control.Number({ label: "Roundness", default: 22, min: 4, max: 36, unit: "px" }),
    border: Schema.Control.Number({ default: 3, min: 0, max: 6, unit: "px" }),
    shadow: Schema.Control.Number({ default: 24, min: 0, max: 40, unit: "%" }),
    label: Schema.Control.Text({ label: "Place name", default: "Little coffee", maxLength: 60 }),
    showLabel: Schema.Control.Boolean({ label: "Show label", default: true }),
    variant: Schema.Control.Select(["default", "hover", "selected", "disabled", "loading"], {
      default: "default",
      hidden: true,
    }),
  },
  states: {
    default: { description: "Ready to explore", props: { variant: "default" } },
    hover: { description: "A little lift on approach", props: { variant: "hover" } },
    selected: { description: "The place in focus", props: { variant: "selected" } },
    disabled: { description: "Unavailable for now", props: { variant: "disabled" } },
    loading: { description: "Finding your place", props: { variant: "loading" } },
  },
});

export default pin;
export type PinProps = Schema.Props<typeof pin>;
