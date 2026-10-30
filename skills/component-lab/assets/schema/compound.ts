import type { Presentation } from "./index";
import {
  isEasing,
  isInterval,
  isSpacing,
  isVector2,
  type Easing,
  type Interval,
  type Spacing,
  type Value,
  type Vector2,
} from "./values";

type Bounds = { min: number; max: number; step: number; unit: string };
type BoundedOptions = Presentation & Partial<Bounds>;
export type Vector2Control = Presentation & Bounds & { type: "vector2"; default: Vector2 };
export type IntervalControl = Presentation & Bounds & { type: "interval"; default: Interval };
export type SpacingControl = Presentation & Bounds & { type: "spacing"; default: Spacing };
export type EasingControl = Presentation & { type: "easing"; default: Easing };
export type CompoundControl = Vector2Control | IntervalControl | SpacingControl | EasingControl;

function bounds(options: Partial<Bounds>, min: number, max: number): Bounds {
  const result = {
    min: options.min ?? min,
    max: options.max ?? max,
    step: options.step ?? 1,
    unit: options.unit ?? "",
  };

  if (
    ![result.min, result.max, result.step].every(Number.isFinite) ||
    result.min >= result.max ||
    result.step <= 0
  )
    throw new Error("Controls need finite bounds and a positive step.");

  return result;
}

function within(values: number[], range: Bounds): boolean {
  return values.every((n) => n >= range.min && n <= range.max);
}

export const Compound = {
  Vector2(options: BoundedOptions & { default: Vector2 }): Vector2Control {
    const range = bounds(options, -100, 100);

    if (!isVector2(options.default) || !within(Object.values(options.default), range))
      throw new Error("Vector2 defaults need finite x/y coordinates within bounds.");

    return { ...options, ...range, type: "vector2" };
  },
  Interval(options: BoundedOptions & { default: Interval }): IntervalControl {
    const range = bounds(options, 0, 100);

    if (
      !isInterval(options.default) ||
      !within(options.default, range) ||
      options.default[0] > options.default[1]
    )
      throw new Error("Interval defaults need two ordered finite numbers within bounds.");

    return { ...options, ...range, type: "interval" };
  },
  Spacing(options: BoundedOptions & { default: Spacing }): SpacingControl {
    const range = bounds(options, 0, 64);

    if (!isSpacing(options.default) || !within(Object.values(options.default), range))
      throw new Error("Spacing defaults need four finite sides within bounds.");

    return { ...options, ...range, type: "spacing" };
  },
  Easing(options: Presentation & { default: Easing }): EasingControl {
    if (
      !isEasing(options.default) ||
      [options.default[0], options.default[2]].some((n) => n < 0 || n > 1)
    )
      throw new Error(
        "Easing defaults need four finite handles with x coordinates between 0 and 1.",
      );

    return { ...options, type: "easing" };
  },
};

export function parseCompound(control: CompoundControl, value: unknown): Value {
  if (control.type === "easing")
    return isEasing(value)
      ? [Math.max(0, Math.min(1, value[0])), value[1], Math.max(0, Math.min(1, value[2])), value[3]]
      : [...control.default];

  const clamp = (n: number) => Math.max(control.min, Math.min(control.max, n));

  switch (control.type) {
    case "vector2":
      return isVector2(value) ? { x: clamp(value.x), y: clamp(value.y) } : { ...control.default };
    case "spacing":
      return isSpacing(value)
        ? {
            top: clamp(value.top),
            right: clamp(value.right),
            bottom: clamp(value.bottom),
            left: clamp(value.left),
          }
        : { ...control.default };
    case "interval":
      return isInterval(value)
        ? [clamp(Math.min(...value)), clamp(Math.max(...value))]
        : [...control.default];
  }
}
