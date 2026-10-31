import * as Schema from "@local";

const pricing = Schema.Component("Pricing card", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  controls: {
    name: Schema.Control.Text({ default: "Studio", maxLength: 30 }),
    description: Schema.Control.Text({ default: "For people who make things.", maxLength: 100 }),
    price: Schema.Control.Number({ default: 24, min: 0, max: 99, unit: "$" }),
    discount: Schema.Control.Number({ default: 20, min: 0, max: 50, unit: "%" }),
    billing: Schema.Control.Select(["monthly", "yearly"], { default: "monthly" }),
    featured: Schema.Control.Boolean({ default: false }),
    showFeatures: Schema.Control.Boolean({ default: true }),
    accent: Schema.Control.Color({
      default: "#7c79ba",
      options: ["#7c79ba", "#668977", "#3f80ac", "#292929"],
    }),
    ink: Schema.Control.Color({ label: "Text color", default: "#292933" }),
    gradient: Schema.Control.Gradient({
      default: {
        angle: 145,
        stops: [
          { color: "#f5f4fa", position: 0 },
          { color: "#e3e2ed", position: 100 },
        ],
      },
    }),
    corners: Schema.Control.Corners({
      default: { topLeft: 18, topRight: 18, bottomRight: 18, bottomLeft: 18 },
    }),
    padding: Schema.Control.Spacing({
      default: { top: 22, right: 20, bottom: 22, left: 20 },
      min: 12,
      max: 32,
      unit: "px",
    }),
  },
  states: {
    default: { name: "Monthly", description: "Switch billing or choose the plan." },
    yearly: { props: { billing: "yearly", featured: true } },
    compact: { props: { showFeatures: false } },
  },
});

export default pricing;
export type PricingProps = Schema.Props<typeof pricing>;
