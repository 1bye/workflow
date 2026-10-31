import { useEffect, useRef, useState, type CSSProperties } from "react";
import Controls from "./Controls.tsx";
import ResizeHandle from "./ResizeHandle.tsx";
import usePanels from "./usePanels.ts";
import ThemeSwitch from "./ThemeSwitch";
import type { Theme } from "./theme";
import type { Components } from "../schema/entries";
import type { Value } from "../schema/index";
import { isRecord, type Settings } from "../settings";
import {
  isActionResult,
  isSpacingMessage,
  isSelectInstanceMessage,
  type ActionMessage,
  type ActionStatus,
  type RenderMessage,
} from "./types";
import { restoreWorkspace, replaceCanvas } from "./state";
import {
  createCanvas,
  selectedInstance,
  selectInstance,
  duplicateInstance,
  removeInstance,
  editInstance,
  editSpacing,
  type Canvas,
} from "./canvas";

type Props = {
  initialTheme: Theme;
  components: Components;
  initialSettings: Settings;
  storageKey: string;
};

export default function App({ initialTheme, components, initialSettings, storageKey }: Props) {
  const [theme, setTheme] = useState(initialTheme);

  const [workspace, setWorkspace] = useState(() => {
    let pending: unknown;

    try {
      pending = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    } catch {
      /* Browser storage is optional. */
    }

    return restoreWorkspace(pending, initialSettings, components);
  });

  const [inspecting, setInspecting] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [action, setAction] = useState<ActionStatus | null>(null);
  const preview = useRef<HTMLIFrameElement>(null);
  const panels = usePanels();

  const selected = components.find((component) => component.id === workspace.id) ?? components[0];

  const canvas =
    workspace.canvases[selected.id] ??
    createCanvas(selected.parse(workspace.settings.components[selected.id]));

  const instance = selectedInstance(canvas);
  const values = instance.props;

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

      if (event.data.type === "spacing-exit") {
        setInspecting(false);

        return;
      }

      if (isSpacingMessage(event.data)) {
        const message = event.data;

        setWorkspace((current) => {
          const canvas = current.canvases[message.id];

          if (
            current.id !== message.id ||
            !canvas ||
            !canvas.instances.some((item) => item.id === message.instanceId)
          )
            return current;

          const next = editSpacing(
            selectInstance(canvas, message.instanceId),
            message.instanceId,
            (spacing) =>
              Object.keys(spacing).length >= 500 && !spacing[message.path]
                ? spacing
                : {
                    ...spacing,
                    [message.path]: { ...spacing[message.path], [message.property]: message.value },
                  },
          );

          return replaceCanvas(current, message.id, next);
        });

        return;
      }

      if (isSelectInstanceMessage(event.data)) {
        const message = event.data;

        setWorkspace((current) => {
          const currentCanvas = current.canvases[message.id];

          if (current.id !== message.id || !currentCanvas) return current;

          const next = selectInstance(currentCanvas, message.instanceId);

          return next === currentCanvas ? current : replaceCanvas(current, message.id, next);
        });
        setAction((current) =>
          current?.id === message.id && current.instanceId !== message.instanceId ? null : current,
        );

        return;
      }

      if (isActionResult(event.data)) {
        const result = event.data;

        setAction((current) =>
          current?.requestId === result.requestId
            ? { ...current, busy: false, error: result.error }
            : current,
        );

        return;
      }

      if (event.data.type === "ready") {
        setPreviewVersion((version) => version + 1);
        setAction(null);
      }

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
        canvas,
        theme,
        inspectSpacing: inspecting,
      } satisfies RenderMessage,
      location.origin,
    );
  }, [selected.id, canvas, theme, previewVersion, inspecting]);
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 2,
          settings: workspace.settings,
          selectedId: selected.id,
          canvases: workspace.canvases,
        }),
      );
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [workspace, selected.id, storageKey]);

  useEffect(() => {
    const exit = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInspecting(false);
    };

    window.addEventListener("keydown", exit);

    return () => window.removeEventListener("keydown", exit);
  }, []);

  function modifyCanvas(update: (current: Canvas) => Canvas) {
    setWorkspace((current) =>
      replaceCanvas(
        current,
        selected.id,
        update(
          current.canvases[selected.id] ??
            createCanvas(selected.parse(current.settings.components[selected.id])),
        ),
      ),
    );
  }

  function updateControl(key: string, value: Value) {
    modifyCanvas((current) =>
      editInstance(current, instance.id, (props) => ({
        ...props,
        [key]: value,
      })),
    );
  }

  function triggerAction(key: string) {
    if (action?.busy) return;

    const requestId = crypto.randomUUID();

    setAction({
      id: selected.id,
      instanceId: instance.id,
      key,
      requestId,
      busy: true,
      error: null,
    });
    preview.current?.contentWindow?.postMessage(
      {
        type: "action",
        id: selected.id,
        instanceId: instance.id,
        key,
        requestId,
      } satisfies ActionMessage,
      location.origin,
    );
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
                  onClick={() => {
                    setWorkspace((current) => ({
                      ...current,
                      id: component.id,
                    }));
                    setInspecting(false);
                    setAction(null);
                  }}
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
                type="button"
                aria-label="Inspect spacing"
                title={inspecting ? "Spacing inspector · Esc to exit" : "Inspect spacing"}
                aria-pressed={inspecting}
                onClick={() => setInspecting((value) => !value)}
                className="mr-auto grid size-6 place-items-center rounded text-(--lab-muted) hover:bg-(--lab-control) aria-pressed:bg-(--lab-active) aria-pressed:text-(--lab-text)"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                >
                  <path d="m3 2 10 6-5 1-2 5Z" />
                </svg>
              </button>
              {Object.keys(instance.spacing ?? {}).length ? (
                <button
                  type="button"
                  aria-label="Reset spacing"
                  className="h-6 rounded px-1 text-[9px] text-(--lab-faint) hover:bg-(--lab-control)"
                  onClick={() =>
                    modifyCanvas((current) => editSpacing(current, instance.id, () => ({})))
                  }
                >
                  Reset spacing
                </button>
              ) : null}
              <button
                id="reset"
                type="button"
                className="h-6 rounded border-0 bg-transparent px-1.5 text-[10px] text-(--lab-muted) hover:bg-(--lab-control) hover:text-(--lab-text)"
                onClick={() =>
                  modifyCanvas((current) =>
                    editInstance(current, instance.id, () => selected.parse({})),
                  )
                }
              >
                Reset
              </button>
              <ThemeSwitch theme={theme} onChange={setTheme} />
            </div>
            {inspecting ? (
              <div
                aria-label="Spacing colors"
                title="Scroll over a colored region to adjust it. Shift for fine adjustment."
                className="mt-2 flex flex-wrap gap-3 text-[9px] text-(--lab-faint)"
              >
                {[
                  ["Margin", "#f5ad66"],
                  ["Padding", "#79cda3"],
                  ["Gap", "#b69af5"],
                ].map(([name, color]) => (
                  <span key={name} className="flex items-center gap-1">
                    <span className="size-1.5 rounded-sm" style={{ background: color }} />
                    {name}
                  </span>
                ))}
              </div>
            ) : null}
            <Controls
              key={`${selected.id}:${instance.id}`}
              component={selected}
              values={values}
              onChange={updateControl}
              onAction={triggerAction}
              action={
                action?.id === selected.id && action.instanceId === instance.id ? action : null
              }
              previewReady={previewVersion > 0}
            />
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
            title="Live component preview"
            className="h-full w-full border-0 bg-(--lab-bg)"
            onLoad={() => setPreviewVersion((version) => version + 1)}
          />
          <div
            role="toolbar"
            aria-label="Preview instances"
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-(--lab-panel) px-1.5 py-1 shadow-[0_2px_12px_var(--lab-shadow)]"
          >
            <span
              aria-live="polite"
              aria-label={`Editing preview ${canvas.instances.findIndex((item) => item.id === instance.id) + 1} of ${canvas.instances.length}`}
              className="px-2 font-mono text-[10px] whitespace-nowrap text-(--lab-faint)"
            >
              {canvas.instances.findIndex((item) => item.id === instance.id) + 1} /{" "}
              {canvas.instances.length}
            </span>
            <button
              type="button"
              aria-label="Duplicate instance"
              title="Duplicate instance"
              className="grid size-7 place-items-center rounded border-0 text-(--lab-muted) hover:bg-(--lab-control)"
              onClick={() => {
                modifyCanvas((current) => duplicateInstance(current, crypto.randomUUID()));
                setAction(null);
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              >
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                <path d="M10.5 3V2.5H2.5v8H3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Remove instance"
              title={
                canvas.instances.length === 1
                  ? "Keep at least one preview"
                  : "Remove selected instance"
              }
              disabled={canvas.instances.length === 1}
              className="grid size-7 place-items-center rounded border-0 text-(--lab-muted) hover:bg-(--lab-control) disabled:opacity-30"
              onClick={() => {
                modifyCanvas(removeInstance);
                setAction(null);
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4.5h10M6 4.5V2.5h4v2M4.5 4.5l.5 9h6l.5-9M6.5 7v4M9.5 7v4" />
              </svg>
            </button>
          </div>
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
