import { createElement } from "react";
import * as Schema from "../assets/schema/index";

const schema = Schema.Component("Typed example", {
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
    }
  >
>;

export function acceptedBinding() {
  return schema.from((props: Schema.Props<typeof schema>) =>
    createElement("div", null, props.label),
  );
}

export function rejectedExamples() {
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
}
