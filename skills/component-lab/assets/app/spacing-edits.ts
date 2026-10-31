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
export type SpacingEdits = Record<string, Partial<Record<SpacingProperty, number>>>;
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
  const step = fine ? 10 : 1;

  return Math.min(
    4096,
    Math.max(
      property.startsWith("margin") ? -4096 : 0,
      Math.round((base - delta * (fine ? 0.025 : 0.25)) * step) / step,
    ),
  );
}
