import * as Schema from "@local";

const accordion = Schema.Component("Accordion", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  preview: { minWidth: 340 },
  controls: {
    title: Schema.Control.Text({ default: "Can I make this my own?", maxLength: 80 }),
    body: Schema.Control.Text({
      default:
        "Every detail is yours to change. Adjust the shape, find a color, and make a little room for your next idea.",
      maxLength: 280,
    }),
    open: Schema.Control.Boolean({ default: false }),
    appearance: Schema.Control.Select(["card", "soft", "line"], { default: "card" }),
    showIcon: Schema.Control.Boolean({ default: true }),
    accent: Schema.Control.Color({
      default: "#668977",
      options: ["#668977", "#7c79ba", "#3f80ac", "#d39a37"],
    }),
    radius: Schema.Control.Number({ default: 12, min: 0, max: 24, unit: "px" }),
    padding: Schema.Control.Spacing({
      default: { top: 16, right: 16, bottom: 16, left: 16 },
      min: 8,
      max: 32,
      unit: "px",
    }),
  },
  states: {
    default: { name: "Collapsed", description: "Click the question to open it." },
    expanded: { props: { open: true } },
    minimal: { props: { appearance: "line", open: true } },
  },
});

export default accordion;
export type AccordionProps = Schema.Props<typeof accordion>;
