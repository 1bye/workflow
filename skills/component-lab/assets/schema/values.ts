export type Vector2 = { x: number; y: number };
export type Interval = [min: number, max: number];
export type Spacing = { top: number; right: number; bottom: number; left: number };
export type Easing = [x1: number, y1: number, x2: number, y2: number];
export type Value = string | number | boolean | Vector2 | Interval | Spacing | Easing;
export type Values = Record<string, Value>;

function numericObject<K extends string>(
  value: unknown,
  keys: readonly K[],
): value is Record<K, number> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every(
      (key) =>
        Object.hasOwn(value, key) &&
        typeof (value as Record<string, unknown>)[key] === "number" &&
        Number.isFinite((value as Record<string, unknown>)[key]),
    )
  );
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

export function isValue(value: unknown): value is Value {
  return (
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.length <= 500) ||
    isVector2(value) ||
    isSpacing(value) ||
    isInterval(value) ||
    isEasing(value)
  );
}

export function sameValue(a: Value, b: unknown): boolean {
  if (Array.isArray(a))
    return Array.isArray(b) && a.length === b.length && a.every((n, i) => n === b[i]);

  if (typeof a === "object")
    return (
      b !== null &&
      typeof b === "object" &&
      !Array.isArray(b) &&
      Object.keys(a).length === Object.keys(b).length &&
      Object.entries(a).every(([key, n]) => n === (b as Record<string, unknown>)[key])
    );

  return a === b;
}
