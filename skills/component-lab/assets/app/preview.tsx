import { useEffect, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import components from "./components";
import {
  isActionMessage,
  isRenderMessage,
  type ActionResult,
  type RenderMessage,
  type SelectInstanceMessage,
} from "./types";
import { runAction } from "./actions";
import "./preview.css";
import { spacingCSS } from "./spacing-edits";
import SpacingInspector from "./SpacingInspector";

function Preview() {
  const [data, setData] = useState<RenderMessage | null>(null);

  useEffect(() => {
    const receive = (event: MessageEvent<unknown>) => {
      if (event.origin !== location.origin || event.source !== parent) return;

      if (isRenderMessage(event.data)) setData(event.data);
    };

    window.addEventListener("message", receive);
    parent.postMessage({ type: "ready" }, location.origin);

    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    const receive = async (event: MessageEvent<unknown>) => {
      if (
        event.origin !== location.origin ||
        event.source !== parent ||
        !isActionMessage(event.data)
      )
        return;

      const message = event.data;
      let error: string | null = null;

      try {
        const definition = components.find((component) => component.id === message.id);
        const visible = data?.comparison ?? (data ? [{ id: data.id, canvas: data.canvas }] : []);

        const element = Array.from(
          document.querySelectorAll<HTMLElement>("[data-component-preview]"),
        ).find(
          (item) =>
            item.dataset.componentId === message.id &&
            item.dataset.instanceId === message.instanceId,
        );

        if (!definition || !visible.some((item) => item.id === message.id) || !element)
          throw new Error("The preview is not ready.");

        await runAction(definition.controls, message.key, [element]);
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }

      parent.postMessage(
        {
          type: "action-result",
          requestId: message.requestId,
          error,
        } satisfies ActionResult,
        location.origin,
      );
    };

    window.addEventListener("message", receive);

    return () => window.removeEventListener("message", receive);
  }, [data]);

  if (!data) return null;

  const groups = (data.comparison ?? [{ id: data.id, canvas: data.canvas }]).map((item) => {
    const definition = components.find((component) => component.id === item.id);

    if (!definition) throw new Error(`Unknown component: ${item.id}`);

    return { ...item, definition };
  });

  const count = groups.reduce((sum, group) => sum + group.canvas.instances.length, 0);

  function select(id: string, instanceId: string) {
    if (!data || (data.id === id && data.canvas.selectedId === instanceId)) return;

    parent.postMessage(
      {
        type: "select-instance",
        id,
        instanceId,
      } satisfies SelectInstanceMessage,
      location.origin,
    );
  }

  return (
    <>
      <style>
        {groups.map((group) => spacingCSS(group.canvas.instances, group.id)).join("\n")}
      </style>
      <main
        id="preview-canvas"
        aria-label={
          data.comparison ? "Component comparison canvas" : `${groups[0]!.definition.name} canvas`
        }
        data-theme={data.theme}
        data-inspecting={data.inspectSpacing ?? false}
        data-multiple={count > 1}
        data-comparing={!!data.comparison}
        className="preview-canvas bg-(--lab-bg) text-(--lab-text)"
      >
        {groups.flatMap(({ definition, canvas }) =>
          canvas.instances.map((instance, index) => (
            <section
              key={`${definition.id}:${instance.id}`}
              data-instance={instance.id}
              data-component-id={definition.id}
              data-selected={data.id === definition.id && data.canvas.selectedId === instance.id}
              aria-label={`${definition.name} preview ${index + 1}`}
              aria-current={
                data.id === definition.id && data.canvas.selectedId === instance.id
                  ? "true"
                  : undefined
              }
              tabIndex={count > 1 ? 0 : -1}
              className="preview-instance"
              style={
                {
                  "--preview-min-width": `${definition.preview?.minWidth ?? 0}px`,
                } as CSSProperties
              }
              onPointerDownCapture={() => select(definition.id, instance.id)}
              onFocusCapture={() => select(definition.id, instance.id)}
              onKeyDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  select(definition.id, instance.id);
                }
              }}
            >
              <div
                data-component-preview
                data-component-id={definition.id}
                data-instance-id={instance.id}
                className="flex w-full min-w-0 items-center justify-center"
              >
                {definition.render(instance.props)}
              </div>
              {data.comparison ||
              (count > 1 && data.id === definition.id && data.canvas.selectedId === instance.id) ? (
                <span aria-hidden="true" className="preview-selection">
                  {data.comparison
                    ? `${definition.name}${canvas.instances.length > 1 ? ` ${index + 1}` : ""}${data.id === definition.id && data.canvas.selectedId === instance.id ? " · Selected" : ""}`
                    : "Selected"}
                </span>
              ) : null}
            </section>
          )),
        )}
      </main>
      <SpacingInspector
        enabled={data.inspectSpacing ?? false}
        scope={data.spacingScope ?? "Side"}
        theme={data.theme}
        contextId={groups.map((group) => group.id).join("|")}
        revision={data.canvas}
      />
    </>
  );
}

createRoot(document.getElementById("root")!, {
  onUncaughtError: (error) =>
    parent.postMessage(
      {
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      },
      location.origin,
    ),
}).render(<Preview />);
