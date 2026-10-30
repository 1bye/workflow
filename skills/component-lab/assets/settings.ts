import type { Values } from "./schema/index";
import { isComponentId } from "./schema/entries";

export type Settings = { version: 1; components: Record<string, Values> };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function isValues(value: unknown): value is Values {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (prop) =>
        typeof prop === "boolean" ||
        (typeof prop === "number" && Number.isFinite(prop)) ||
        (typeof prop === "string" && prop.length <= 500),
    )
  );
}
export function validateSettings(value: unknown): Settings {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.components))
    throw new Error("Invalid settings: expected version 1 and component values.");

  const components: Record<string, Values> = {};

  for (const [id, props] of Object.entries(value.components)) {
    if (!isComponentId(id) || !isValues(props))
      throw new Error("Invalid component settings: expected strings, finite numbers, or booleans.");

    components[id] = props;
  }

  return { version: 1, components };
}
