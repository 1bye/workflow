import { isRecord } from "../settings";

export const spacingProperties = [
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "row-gap",
  "column-gap",
] as const;
export type SpacingProperty = (typeof spacingProperties)[number];
export type SpacingValues = Partial<Record<SpacingProperty, number>>;
export type SpacingEdits = Record<string, SpacingValues>;
export const spacingScopes = ["Side", "X", "Y", "All"] as const;
export type SpacingScope = (typeof spacingScopes)[number];
export const isSpacingScope = (value: unknown): value is SpacingScope =>
  spacingScopes.includes(value as SpacingScope);

export function scopedProperties(
  property: SpacingProperty,
  scope: SpacingScope,
): SpacingProperty[] {
  if (scope === "Side" || property.endsWith("gap")) return [property];

  const prefix = property.startsWith("margin") ? "margin" : "padding";

  const sides =
    scope === "X"
      ? ["left", "right"]
      : scope === "Y"
        ? ["top", "bottom"]
        : ["top", "right", "bottom", "left"];

  return sides.map((side) => `${prefix}-${side}` as SpacingProperty);
}
export const isSpacingPath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 1500 &&
  /^[a-z][a-z0-9-]*:\d{1,4}(\/[a-z][a-z0-9-]*:\d{1,4}){0,29}$/.test(value);
export const isSpacingProperty = (value: unknown): value is SpacingProperty =>
  typeof value === "string" && spacingProperties.includes(value as SpacingProperty);
export const isSpacingValue = (property: SpacingProperty, value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= (property.startsWith("margin") ? -4096 : 0) &&
  value <= 4096;
export function isSpacingEdits(value: unknown): value is SpacingEdits {
  return (
    isRecord(value) &&
    Object.keys(value).length <= 500 &&
    Object.entries(value).every(
      ([path, edits]) =>
        isSpacingPath(path) &&
        isRecord(edits) &&
        Object.entries(edits).every(
          ([property, amount]) => isSpacingProperty(property) && isSpacingValue(property, amount),
        ),
    )
  );
}
export function spacingCSS(instances: { id: string; spacing?: SpacingEdits }[]) {
  return instances
    .flatMap((instance) =>
      Object.entries(instance.spacing ?? {}).map(([path, edits]) => {
        const selector = path
          .split("/")
          .map((part) => {
            const [tag, index] = part.split(":");

            return `${tag}:nth-child(${Number(index) + 1})`;
          })
          .join(" > ");

        return `[data-component-preview][data-instance-id="${instance.id}"] > ${selector}{${Object.entries(
          edits,
        )
          .map(([property, value]) => `${property}:${value}px!important`)
          .join(";")}}`;
      }),
    )
    .join("\n");
}
export function wheelSpacing(
  base: number,
  delta: number,
  property: SpacingProperty,
  fine: boolean,
) {
  return wheelSpacingValues({ [property]: base }, delta, fine)[property]!;
}

export function wheelSpacingValues(
  base: SpacingValues,
  delta: number,
  fine: boolean,
): SpacingValues {
  const step = fine ? 10 : 1;
  const entries = Object.entries(base) as [SpacingProperty, number][];
  let change = Math.round(-delta * (fine ? 0.025 : 0.25) * step) / step;

  // Clamp the shared change so unequal sides retain their differences at the limit.
  const minimum = Math.max(
    ...entries.map(([property, value]) => (property.startsWith("margin") ? -4096 : 0) - value),
  );

  const maximum = Math.min(...entries.map(([, value]) => 4096 - value));

  change = Math.max(minimum, Math.min(maximum, change));

  return Object.fromEntries(
    entries.map(([property, value]) => [property, Number((value + change).toFixed(4))]),
  );
}
