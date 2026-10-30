export type Vector2 = { x: number; y: number };
export type Interval = [min: number, max: number];
export type Spacing = { top: number; right: number; bottom: number; left: number };
export type Easing = [x1: number, y1: number, x2: number, y2: number];
export type GradientStop = { color: string; position: number };
export type Gradient = { angle: number; stops: GradientStop[] };
export type Shadow = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
};
export type Value =
  | string
  | number
  | boolean
  | Vector2
  | Interval
  | Spacing
  | Easing
  | Gradient
  | Shadow;
export type Values = Record<string, Value>;
export const MAX_GRADIENT_STOPS = 8;

function hasKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value);

function numericObject<K extends string>(
  value: unknown,
  keys: readonly K[],
): value is Record<K, number> {
  return hasKeys(value, keys) && keys.every((key) => finite(value[key]));
}

export const isVector2 = (value: unknown): value is Vector2 => numericObject(value, ["x", "y"]);
export const isSpacing = (value: unknown): value is Spacing =>
  numericObject(value, ["top", "right", "bottom", "left"]);
export const isInterval = (value: unknown): value is Interval =>
  Array.isArray(value) &&
  value.length === 2 &&
  Array.from(value).every((n) => typeof n === "number" && Number.isFinite(n));
export const isEasing = (value: unknown): value is Easing =>
  Array.isArray(value) &&
  value.length === 4 &&
  Array.from(value).every((n) => typeof n === "number" && Number.isFinite(n));

export function isGradient(value: unknown): value is Gradient {
  return (
    hasKeys(value, ["angle", "stops"]) &&
    finite(value.angle) &&
    Array.isArray(value.stops) &&
    value.stops.length >= 2 &&
    value.stops.length <= MAX_GRADIENT_STOPS &&
    Array.from(value.stops).every(
      (stop) =>
        hasKeys(stop, ["color", "position"]) && hexColor(stop.color) && finite(stop.position),
    )
  );
}

export function isShadow(value: unknown): value is Shadow {
  return (
    hasKeys(value, ["x", "y", "blur", "spread", "color", "opacity", "inset"]) &&
    ["x", "y", "blur", "spread", "opacity"].every((key) => finite(value[key])) &&
    hexColor(value.color) &&
    typeof value.inset === "boolean"
  );
}

export function isValue(value: unknown): value is Value {
  return (
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.length <= 500) ||
    isVector2(value) ||
    isSpacing(value) ||
    isInterval(value) ||
    isEasing(value) ||
    isGradient(value) ||
    isShadow(value)
  );
}

export function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a))
    return Array.isArray(b) && a.length === b.length && a.every((n, i) => sameValue(n, b[i]));

  if (a !== null && typeof a === "object")
    return (
      b !== null &&
      typeof b === "object" &&
      !Array.isArray(b) &&
      Object.keys(a).length === Object.keys(b).length &&
      Object.entries(a).every(
        ([key, n]) => Object.hasOwn(b, key) && sameValue(n, (b as Record<string, unknown>)[key]),
      )
    );

  return a === b;
}
