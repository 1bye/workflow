import type { BoundComponent } from "./index";

export type ResolvedComponent = Omit<BoundComponent, "id" | "states"> & {
  id: string;
  folder: string;
  states: { id: string; name: string; description: string }[];
};
export type Components = readonly [ResolvedComponent, ...ResolvedComponent[]];

export function isComponentId(id: string): boolean {
  return (
    /^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(id) &&
    !["constructor", "prototype", "__proto__"].includes(id)
  );
}

export function title(value: string): string {
  const spaced = value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function resolveComponents(
  entries: Record<string, { default: BoundComponent }>,
): Components {
  const seen = new Set<string>();

  const components = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, { default: definition }]) => {
      const source = path.replaceAll("\\", "/").split("/components/").at(-1) ?? path;
      const id = definition.id ?? source.replace(/\/index\.ts$/, "");

      if (!isComponentId(id)) throw new Error(`Invalid component id "${id}" in ${path}.`);

      if (seen.has(id)) throw new Error(`Duplicate component id "${id}".`);

      seen.add(id);

      return {
        ...definition,
        id,
        folder: source.split("/").slice(0, -2).join("/"),
        states: Object.entries(definition.states).map(([key, state]) => ({
          id: key,
          name: state.name ?? title(key),
          description: state.description ?? "",
        })),
      };
    });

  const first = components[0];

  if (!first) throw new Error("Add a component entry at components/<name>/index.ts.");

  return [first, ...components.slice(1)];
}
