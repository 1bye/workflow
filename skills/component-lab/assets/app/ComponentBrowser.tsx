import { useState } from "react";
import { title, type Components } from "../schema/entries";
import { libraryEntries } from "./library";

export default function ComponentBrowser({
  components,
  selectedId,
  comparisonIds,
  comparing,
  onSelect,
  onToggle,
  onCompare,
  onClear,
}: {
  components: Components;
  selectedId: string;
  comparisonIds: string[];
  comparing: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onCompare: () => void;
  onClear: () => void;
}) {
  const [folder, setFolder] = useState("");
  const [search, setSearch] = useState("");
  const entries = libraryEntries(components, folder, search);

  return (
    <section aria-label="Components" className="min-h-0 overflow-auto p-3">
      <label className="flex items-center gap-[7px] rounded-[5px] border-0 bg-(--lab-surface) px-[9px] py-1.5 text-(--lab-faint)">
        <span aria-hidden="true" className="text-[19px] leading-[15px]">
          ⌕
        </span>
        <input
          id="search"
          aria-label="Find a component"
          type="search"
          placeholder={`Search ${components.length} component${components.length === 1 ? "" : "s"}…`}
          className="min-w-0 w-full border-0 bg-transparent text-[10px] text-(--lab-text) placeholder:text-(--lab-faint)"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {folder && !search.trim() ? (
        <nav
          aria-label="Component folders"
          className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-(--lab-faint)"
        >
          <button
            type="button"
            onClick={() => setFolder("")}
            className="rounded px-1 py-0.5 hover:text-(--lab-text)"
          >
            Components
          </button>
          {folder.split("/").map((part, index, parts) => (
            <span key={index} className="flex min-w-0 items-center gap-1">
              <span aria-hidden="true">/</span>
              <button
                type="button"
                aria-current={index === parts.length - 1 ? "page" : undefined}
                onClick={() => setFolder(parts.slice(0, index + 1).join("/"))}
                className="truncate rounded px-1 py-0.5 hover:text-(--lab-text)"
              >
                {title(part)}
              </button>
            </span>
          ))}
        </nav>
      ) : null}
      {comparisonIds.length > 0 ? (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-(--lab-muted)">
          <button
            type="button"
            disabled={comparisonIds.length < 2}
            onClick={onCompare}
            className="h-6 rounded bg-(--lab-control) px-2 hover:bg-(--lab-active) disabled:opacity-40"
          >
            {comparing ? "Comparing" : "Compare"} {comparisonIds.length}
          </button>
          <button
            type="button"
            aria-label="Clear comparison selection"
            onClick={onClear}
            className="ml-auto grid size-6 place-items-center rounded text-(--lab-faint) hover:bg-(--lab-control)"
          >
            ×
          </button>
        </div>
      ) : null}
      <div
        id="component-list"
        className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2"
      >
        {entries.folders.map((entry) => (
          <button
            key={entry.path}
            type="button"
            aria-label={`Open ${title(entry.name)} folder, ${entry.count} component${entry.count === 1 ? "" : "s"}`}
            onClick={() => setFolder(entry.path)}
            className="flex min-w-0 flex-col items-stretch rounded-[7px] border-0 p-[5px] text-left hover:bg-(--lab-control)"
          >
            <span className="grid h-[62px] place-items-center rounded bg-(--lab-surface) text-(--lab-muted)">
              <svg
                aria-hidden="true"
                viewBox="0 0 40 32"
                className="w-9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              >
                <path
                  d="M4 11V7a3 3 0 0 1 3-3h9l4 5h13a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V11Z"
                  fill="currentColor"
                  fillOpacity=".07"
                />
                <path d="M4 11h32" />
              </svg>
            </span>
            <span className="flex items-center gap-1 px-[3px] pt-[7px] pb-[3px] text-[10px]">
              <span className="truncate">{title(entry.name)}</span>
              <span className="ml-auto text-[9px] text-(--lab-faint)">{entry.count}</span>
            </span>
          </button>
        ))}
        {entries.components.map((component) => (
          <button
            key={component.id}
            type="button"
            data-id={component.id}
            aria-label={
              search.trim() && component.folder
                ? `${component.name} · ${component.folder}`
                : component.name
            }
            aria-pressed={
              comparisonIds.length
                ? comparisonIds.includes(component.id)
                : selectedId === component.id
            }
            title="Command/Ctrl-click to select for comparison"
            className="relative flex min-w-0 flex-col items-stretch rounded-[7px] border-0 bg-(--lab-panel) p-[5px] text-left hover:bg-(--lab-control) aria-pressed:bg-(--lab-control)"
            onClick={(event) =>
              event.metaKey || event.ctrlKey ? onToggle(component.id) : onSelect(component.id)
            }
          >
            {component.thumbnail ? (
              <img
                alt=""
                src={component.thumbnail}
                className="h-[62px] w-full rounded object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid h-[62px] place-items-center rounded bg-(--lab-surface) text-xl text-(--lab-faint)"
              >
                ◇
              </span>
            )}
            {comparisonIds.includes(component.id) ? (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-(--lab-panel) text-[9px] text-(--lab-text)"
              >
                ✓
              </span>
            ) : null}
            <span className="px-[3px] pt-[7px] pb-[3px] text-[10px] font-[550]">
              {component.name}
            </span>
            {search.trim() && component.folder ? (
              <span className="truncate px-[3px] text-[9px] text-(--lab-faint)">
                {component.folder}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {!entries.components.length && !entries.folders.length ? (
        <p id="empty-search" className="mt-5 text-[11px] text-(--lab-faint)">
          No matching components.
        </p>
      ) : null}
    </section>
  );
}
