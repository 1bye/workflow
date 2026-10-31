import { useEffect, useRef, useState, type CSSProperties } from "react";
import Controls from "./Controls.tsx";
import ResizeHandle from "./ResizeHandle.tsx";
import usePanels from "./usePanels.ts";
import ThemeSwitch from "./ThemeSwitch";
import ResetMenu from "./ResetMenu";
import ComponentBrowser from "./ComponentBrowser";
import { toggleComparison } from "./library";
import type { Theme } from "./theme";
import { spacingScopes, type SpacingScope } from "./spacing-edits";
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
  const [spacingScope, setSpacingScope] = useState<SpacingScope>("Side");

  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [comparisonReturnId, setComparisonReturnId] = useState<string | null>(null);
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

  const compared = comparisonIds.filter((id) =>
    components.some((component) => component.id === id),
  );

  const comparing =
    comparisonReturnId !== null && compared.length >= 2 && compared.includes(selected.id);

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
            !(comparing ? compared.includes(message.id) : current.id === message.id) ||
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
                    [message.path]: { ...spacing[message.path], ...message.edits },
                  },
          );

          return { ...replaceCanvas(current, message.id, next), id: message.id };
        });

        return;
      }

      if (isSelectInstanceMessage(event.data)) {
        const message = event.data;

        setWorkspace((current) => {
          const currentCanvas = current.canvases[message.id];

          if (
            !(comparing ? compared.includes(message.id) : current.id === message.id) ||
            !currentCanvas ||
            !currentCanvas.instances.some((item) => item.id === message.instanceId)
          )
            return current;

          const next = selectInstance(currentCanvas, message.instanceId);

          return next === currentCanvas && current.id === message.id
            ? current
            : { ...replaceCanvas(current, message.id, next), id: message.id };
        });
        setAction((current) =>
          current && (current.id !== message.id || current.instanceId !== message.instanceId)
            ? null
            : current,
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
  }, [comparisonIds, comparing, components]);
  useEffect(() => {
    preview.current?.contentWindow?.postMessage(
      {
        type: "render",
        id: selected.id,
        canvas,
        theme,
        inspectSpacing: inspecting,
        spacingScope,
        ...(comparing
          ? {
              comparison: compared.map((id) => ({
                id,
                canvas:
                  workspace.canvases[id] ??
                  createCanvas(
                    components
                      .find((component) => component.id === id)!
                      .parse(workspace.settings.components[id]),
                  ),
              })),
            }
          : {}),
      } satisfies RenderMessage,
      location.origin,
    );
  }, [
    selected.id,
    canvas,
    theme,
    previewVersion,
    inspecting,
    spacingScope,
    comparing,
    comparisonIds,
    workspace.canvases,
    components,
  ]);
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
      if (event.key === "Escape" && event.type === "keydown") setInspecting(false);

      preview.current?.contentWindow?.postMessage(
        { type: "spacing-modifier", alt: event.altKey, meta: event.metaKey },
        location.origin,
      );
    };

    const blur = () =>
      preview.current?.contentWindow?.postMessage(
        { type: "spacing-modifier", alt: false, meta: false },
        location.origin,
      );

    window.addEventListener("keydown", exit);
    window.addEventListener("keyup", exit);
    window.addEventListener("blur", blur);

    return () => {
      window.removeEventListener("keydown", exit);
      window.removeEventListener("keyup", exit);
      window.removeEventListener("blur", blur);
    };
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

  function endComparison() {
    if (comparisonReturnId && components.some((component) => component.id === comparisonReturnId))
      setWorkspace((current) => ({ ...current, id: comparisonReturnId }));

    setComparisonReturnId(null);
    setComparisonIds([]);
    setAction(null);
    setInspecting(false);
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
          <ComponentBrowser
            components={components}
            selectedId={selected.id}
            comparisonIds={compared}
            comparing={comparing}
            onSelect={(id) => {
              setWorkspace((current) => ({ ...current, id }));

              if (!comparing || !compared.includes(id)) {
                setComparisonIds([]);
                setComparisonReturnId(null);
              }

              setInspecting(false);
              setAction(null);
            }}
            onToggle={(id) => {
              const next = toggleComparison(compared, id, selected.id);

              if (comparing && next.length < 2) {
                endComparison();

                return;
              }

              setComparisonIds(next);

              if (comparing && !next.includes(selected.id))
                setWorkspace((current) => ({ ...current, id: next[0]! }));
            }}
            onCompare={() => {
              if (compared.length < 2) return;

              if (!comparing) setComparisonReturnId(selected.id);

              if (!compared.includes(selected.id))
                setWorkspace((current) => ({ ...current, id: compared[0]! }));

              setAction(null);
              setInspecting(false);
            }}
            onClear={endComparison}
          />
          <ResizeHandle
            orientation="horizontal"
            value={panels.sizes.height}
            bounds={panels.bounds.height}
            onResize={(value) => panels.resize("height", value)}
          />
          <section aria-label="Component controls" className="min-h-0 overflow-auto p-3">
            <div className="flex flex-wrap items-center justify-end gap-1">
              <div className="mr-auto flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Inspect spacing"
                  title={inspecting ? "Spacing inspector · Esc to exit" : "Inspect spacing"}
                  aria-pressed={inspecting}
                  onClick={() => setInspecting((value) => !value)}
                  className="grid size-6 place-items-center rounded text-(--lab-muted) hover:bg-(--lab-control) aria-pressed:bg-(--lab-active) aria-pressed:text-(--lab-text)"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="currentColor"
                    fillOpacity=".08"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5.4 3.6c-.7-.4-1.5.2-1.3 1l3.4 14c.2.9 1.4 1 1.8.2l2.4-5 5.5-1.8c.9-.3 1-1.5.2-2L5.4 3.6Z" />
                  </svg>
                </button>
                {inspecting ? (
                  <div
                    role="group"
                    aria-label="Spacing scope"
                    className="flex rounded bg-(--lab-control) p-0.5"
                  >
                    {spacingScopes.map((scope) => (
                      <button
                        key={scope}
                        type="button"
                        aria-pressed={spacingScope === scope}
                        onClick={() => setSpacingScope(scope)}
                        className="h-5 rounded px-1 text-[9px] text-(--lab-faint) hover:text-(--lab-text) aria-pressed:bg-(--lab-active) aria-pressed:text-(--lab-text)"
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <ResetMenu
                hasSpacing={!!Object.keys(instance.spacing ?? {}).length}
                onResetTweaks={() =>
                  modifyCanvas((current) =>
                    editInstance(current, instance.id, () => selected.parse({})),
                  )
                }
                onResetSpacing={() =>
                  modifyCanvas((current) => editSpacing(current, instance.id, () => ({})))
                }
              />
              <ThemeSwitch theme={theme} onChange={setTheme} />
            </div>
            {inspecting ? (
              <div
                aria-label="Spacing colors"
                title="Scroll to adjust spacing. Command temporarily targets all sides. Shift for fine adjustment. Option/Alt targets margins."
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
          aria-label={comparing ? "Component comparison" : `${selected.name} preview`}
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
              {comparing ? `${selected.name} · ` : ""}
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
            {comparing ? (
              <button
                type="button"
                aria-label="Exit comparison"
                onClick={endComparison}
                className="h-7 rounded px-2 text-[10px] whitespace-nowrap text-(--lab-muted) hover:bg-(--lab-control)"
              >
                Done
              </button>
            ) : null}
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
