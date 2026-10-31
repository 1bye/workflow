import { createElement } from "react";
import * as Schema from "../assets/schema/index";

const schema = Schema.Component("Typed example", {
  preview: { minWidth: 320 },
  controls: {
    size: Schema.Control.Number({ default: 44 }),
    color: Schema.Control.Color({ default: "#668977" }),
    open: Schema.Control.Boolean({ default: false }),
    label: Schema.Control.Text({ default: "Place" }),
    variant: Schema.Control.Select(["quiet", "bright"], { default: "quiet" }),
    position: Schema.Control.Vector2({ default: { x: 0, y: 0 } }),
    interval: Schema.Control.Interval({ default: [0, 10] }),
    padding: Schema.Control.Spacing({ default: { top: 8, right: 8, bottom: 8, left: 8 } }),
    easing: Schema.Control.Easing({ default: [0.25, 0.1, 0.25, 1] }),
    gradient: Schema.Control.Gradient({
      default: {
        angle: 90,
        stops: [
          { color: "#000000", position: 0 },
          { color: "#ffffff", position: 100 },
        ],
      },
    }),
    shadow: Schema.Control.Shadow({
      default: {
        x: 0,
        y: 4,
        blur: 12,
        spread: 0,
        color: "#000000",
        opacity: 0.2,
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
      default: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
    }),
    asset: Schema.Control.Asset({ default: "" }),
    replay: Schema.Control.Action({ onClick: () => {} }),
  },
  states: { expanded: { props: { open: true, variant: "bright" } } },
});

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type InferredProps = Assert<
  Equal<
    Schema.Props<typeof schema>,
    {
      size: number;
      color: string;
      open: boolean;
      label: string;
      variant: "quiet" | "bright";
      position: Schema.Vector2;
      interval: Schema.Interval;
      padding: Schema.Spacing;
      easing: Schema.Easing;
      gradient: Schema.Gradient;
      shadow: Schema.Shadow;
      typography: Schema.Typography;
      corners: Schema.Corners;
      asset: string;
    }
  >
>;

export function acceptedBinding() {
  return schema.from((props: Schema.Props<typeof schema>) =>
    createElement("div", null, props.label),
  );
}

export function rejectedExamples() {
  Schema.Component("Wrong preview width", {
    // @ts-expect-error Preview minimum width uses a number of CSS pixels.
    preview: { minWidth: "320px" },
    controls: {},
  });
  // @ts-expect-error Asset sources must be strings.
  Schema.Control.Asset({ default: 123 });
  // @ts-expect-error Action callbacks are required.
  Schema.Control.Action({ button: "Run" });
  Schema.Component("Actions are not props", {
    controls: {
      replay: Schema.Control.Action({ onClick: () => {} }),
      text: Schema.Control.Text({ default: "" }),
    },
    // @ts-expect-error Actions cannot be overridden by state snapshots.
    states: { wrong: { props: { replay: 1 } } },
  });
  // @ts-expect-error A number control cannot bind to a string prop.
  schema.from((props: { size: string }) => createElement("div", null, props.size));
  // @ts-expect-error Required props must be supplied by the schema.
  schema.from((props: { size: number; required: string }) =>
    createElement("div", null, props.required),
  );
  Schema.Component("Wrong state", {
    controls: { size: Schema.Control.Number({ default: 44 }) },
    // @ts-expect-error State props must match the inferred control types.
    states: { broken: { props: { size: "large" } } },
  });
  Schema.Component("Unknown prop", {
    controls: { size: Schema.Control.Number({ default: 44 }) },
    // @ts-expect-error Unknown props cannot be introduced by a snapshot.
    states: { broken: { props: { extra: true } } },
  });
  // @ts-expect-error Select defaults must belong to the options union.
  Schema.Control.Select(["quiet", "bright"], { default: "missing" });
  // @ts-expect-error Interval values must have exactly two numbers.
  Schema.Control.Interval({ default: [0, 1, 2] });
  // @ts-expect-error Vector2 coordinates must be numeric.
  Schema.Control.Vector2({ default: { x: "0", y: 0 } });
  // @ts-expect-error Spacing requires all four sides.
  Schema.Control.Spacing({ default: { top: 8, right: 8 } });
  // @ts-expect-error Easing requires four numeric handles.
  Schema.Control.Easing({ default: [0, 1] });
  // @ts-expect-error Gradient stops require a numeric position.
  Schema.Control.Gradient({ default: { angle: 90, stops: [{ color: "#000000", position: "0" }] } });
  Schema.Control.Shadow({
    // @ts-expect-error Shadow values require an inset boolean.
    default: { x: 0, y: 4, blur: 12, spread: 0, color: "#000000", opacity: 0.2 },
  });
  // @ts-expect-error Corners requires all four named radii.
  Schema.Control.Corners({ default: { topLeft: 8, topRight: 8 } });
  Schema.Control.Typography({
    default: {
      fontFamily: "system-ui",
      fontSize: 16,
      // @ts-expect-error Typography weights must be numeric.
      fontWeight: "bold",
      lineHeight: 1.4,
      letterSpacing: 0,
    },
  });
}
