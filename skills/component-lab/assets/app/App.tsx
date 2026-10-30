import { useEffect, useRef, useState, type CSSProperties } from "react";
import Controls from "./Controls.tsx";
import ResizeHandle from "./ResizeHandle.tsx";
import usePanels from "./usePanels.ts";
import ThemeSwitch from "./ThemeSwitch";
import type { Theme } from "./theme";
import type { Components } from "../schema/entries";
import type { Value } from "../schema/index";
import { isRecord, type Settings } from "../settings";
import type { RenderMessage } from "./types";

type Props = {
  initialTheme: Theme;
  components: Components;
  initialSettings: Settings;
  initialId: string;
  storageKey: string;
};

export default function App({
  initialTheme,
  components,
  initialSettings,
  initialId,
  storageKey,
}: Props) {
  const [theme, setTheme] = useState(initialTheme);
  const [settings, setSettings] = useState(initialSettings);
  const [selectedId, setSelectedId] = useState(initialId);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);
  const preview = useRef<HTMLIFrameElement>(null);
  const panels = usePanels();
  const selected = components.find((component) => component.id === selectedId) ?? components[0];
  const values = settings.components[selected.id] ?? selected.defaults;

  const filtered = components.filter((component) =>
    component.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("component-lab-theme", theme);
    } catch {
      /* Browser storage is optional. */
    }
  }, [theme]);
  useEffect(() => {
    const receive = (event: MessageEvent<unknown>) => {
      if (event.origin !== location.origin || event.source !== preview.current?.contentWindow)
        return;

      if (!isRecord(event.data)) return;

      if (event.data.type === "ready") setPreviewVersion((version) => version + 1);

      if (event.data.type === "error" && typeof event.data.message === "string")
        setError(event.data.message);
    };

    window.addEventListener("message", receive);

    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    preview.current?.contentWindow?.postMessage(
      {
        type: "render",
        id: selected.id,
        props: values,
        theme,
      } satisfies RenderMessage,
      location.origin,
    );
  }, [selected.id, values, theme, previewVersion]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ settings, selectedId: selected.id }));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [settings, selected.id, storageKey]);

  function updateControl(key: string, value: Value) {
    setSettings((current) => ({
      ...current,
      components: {
        ...current.components,
        [selected.id]: { ...current.components[selected.id], [key]: value },
      },
    }));
  }

  return (
    <div className="grid h-dvh min-h-[480px] grid-rows-[minmax(0,1fr)]">
      <main
        id="workbench"
        ref={panels.ref}
        className="grid min-h-0 grid-cols-[var(--sidebar-width)_6px_minmax(0,1fr)]"
        style={
          {
            "--sidebar-width": `${panels.sizes.width}px`,
            "--library-height": `${panels.sizes.height}px`,
          } as CSSProperties
        }
      >
        <aside
          id="sidebar"
          aria-label="Components and tweaks"
          className="grid min-h-0 min-w-0 grid-rows-[var(--library-height)_6px_minmax(0,1fr)] bg-(--lab-panel)"
        >
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
            <div
              id="component-list"
              className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2"
            >
              {filtered.map((component) => (
                <button
                  key={component.id}
                  type="button"
                  data-id={component.id}
                  aria-pressed={selected.id === component.id}
                  className="flex min-w-0 flex-col items-stretch rounded-[7px] border-0 bg-(--lab-panel) p-[5px] text-left hover:bg-(--lab-control) aria-pressed:bg-(--lab-control)"
                  onClick={() => setSelectedId(component.id)}
                >
                  <img
                    alt=""
                    src={component.thumbnail}
                    className="h-[62px] w-full rounded object-cover"
                  />
                  <span className="px-[3px] pt-[7px] pb-[3px] text-[10px] font-[550]">
                    {component.name}
                  </span>
                </button>
              ))}
            </div>
            {!filtered.length ? (
              <p id="empty-search" className="mt-5 text-[11px] text-(--lab-faint)">
                No matching components.
              </p>
            ) : null}
          </section>
          <ResizeHandle
            orientation="horizontal"
            value={panels.sizes.height}
            bounds={panels.bounds.height}
            onResize={(value) => panels.resize("height", value)}
          />
          <section aria-label="Component controls" className="min-h-0 overflow-auto p-3">
            <div className="flex items-center justify-end gap-1">
              <button
                id="reset"
                type="button"
                className="h-6 rounded border-0 bg-transparent px-1.5 text-[10px] text-(--lab-muted) hover:bg-(--lab-control) hover:text-(--lab-text)"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    components: {
                      ...current.components,
                      [selected.id]: { ...selected.defaults },
                    },
                  }))
                }
              >
                Reset
              </button>
              <ThemeSwitch theme={theme} onChange={setTheme} />
            </div>
            <Controls component={selected} values={values} onChange={updateControl} />
            {storageError ? (
              <p role="alert" className="mt-2 text-[9px] text-(--lab-error-text)">
                Couldn’t save changes in this browser.
              </p>
            ) : null}
          </section>
        </aside>
        <ResizeHandle
          orientation="vertical"
          value={panels.sizes.width}
          bounds={panels.bounds.width}
          onResize={(value) => panels.resize("width", value)}
        />
        <section
          aria-label={`${selected.name} preview`}
          className="relative grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)]"
        >
          <iframe
            id="preview"
            ref={preview}
            src="/preview.html"
            title="Live component states"
            className="h-full w-full border-0 bg-(--lab-bg)"
            onLoad={() => setPreviewVersion((version) => version + 1)}
          />
          {error ? (
            <div
              id="error"
              role="alert"
              className="absolute inset-x-5 bottom-5 rounded-md border border-(--lab-error-border) bg-(--lab-error-bg) p-[15px] text-xs text-(--lab-error-text)"
            >
              {error}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
