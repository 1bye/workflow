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
        const definition = components.find((component) => component.id === data?.id);

        const element = Array.from(
          document.querySelectorAll<HTMLElement>("[data-component-preview]"),
        ).find((item) => item.dataset.instanceId === message.instanceId);

        if (!definition || definition.id !== message.id || !element)
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
  }, [data?.id]);

  if (!data) return null;

  const definition = components.find((component) => component.id === data.id);

  if (!definition) throw new Error(`Unknown component: ${data.id}`);

  function select(instanceId: string) {
    if (!data || data.canvas.selectedId === instanceId) return;

    parent.postMessage(
      {
        type: "select-instance",
        id: data.id,
        instanceId,
      } satisfies SelectInstanceMessage,
      location.origin,
    );
  }

  return (
    <>
      <style>{spacingCSS(data.canvas.instances)}</style>
      <main
        id="preview-canvas"
        aria-label={`${definition.name} canvas`}
        data-theme={data.theme}
        data-inspecting={data.inspectSpacing ?? false}
        data-multiple={data.canvas.instances.length > 1}
        className="preview-canvas bg-(--lab-bg) text-(--lab-text)"
      >
        {data.canvas.instances.map((instance, index) => (
          <section
            key={`${definition.id}:${instance.id}`}
            data-instance={instance.id}
            data-selected={data.canvas.selectedId === instance.id}
            aria-label={`${definition.name} preview ${index + 1}`}
            aria-current={data.canvas.selectedId === instance.id ? "true" : undefined}
            tabIndex={data.canvas.instances.length > 1 ? 0 : -1}
            className="preview-instance"
            style={
              {
                "--preview-min-width": `${definition.preview?.minWidth ?? 0}px`,
              } as CSSProperties
            }
            onPointerDownCapture={() => select(instance.id)}
            onFocusCapture={() => select(instance.id)}
            onKeyDown={(event) => {
              if (
                event.target === event.currentTarget &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                select(instance.id);
              }
            }}
          >
            <div
              data-component-preview
              data-instance-id={instance.id}
              className="flex w-full min-w-0 items-center justify-center"
            >
              {definition.render(instance.props)}
            </div>
            {data.canvas.instances.length > 1 && data.canvas.selectedId === instance.id ? (
              <span aria-hidden="true" className="preview-selection">
                Selected
              </span>
            ) : null}
          </section>
        ))}
      </main>
      <SpacingInspector
        enabled={data.inspectSpacing ?? false}
        scope={data.spacingScope ?? "Side"}
        theme={data.theme}
        componentId={data.id}
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
