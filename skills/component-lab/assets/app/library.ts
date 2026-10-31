import type { ResolvedComponent } from "../schema/entries";

export function libraryEntries(
  components: readonly ResolvedComponent[],
  folder: string,
  search: string,
) {
  const query = search.trim().toLowerCase();

  if (query)
    return {
      folders: [],
      components: components.filter((component) =>
        `${component.folder}/${component.name}`.toLowerCase().includes(query),
      ),
    };

  const folders = new Map<string, { name: string; path: string; count: number }>();
  const prefix = folder ? `${folder}/` : "";

  for (const component of components) {
    if (!component.folder.startsWith(prefix) || component.folder === folder) continue;

    const name = component.folder.slice(prefix.length).split("/")[0]!;
    const path = `${prefix}${name}`;
    const entry = folders.get(path);

    folders.set(path, { name, path, count: (entry?.count ?? 0) + 1 });
  }

  return {
    folders: [...folders.values()].sort((a, b) => a.name.localeCompare(b.name)),
    components: components.filter((component) => component.folder === folder),
  };
}

export function toggleComparison(ids: string[], id: string, selectedId: string) {
  const current = ids.length ? ids : [selectedId];

  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}
