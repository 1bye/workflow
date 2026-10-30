import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import components from "./components";
import { isActionMessage, isRenderMessage, type ActionResult, type RenderMessage } from "./types";
import { runAction } from "./actions";
import "./preview.css";

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

        if (!definition || definition.id !== message.id)
          throw new Error("The preview is not ready.");

        await runAction(
          definition.controls,
          message.key,
          Array.from(document.querySelectorAll<HTMLElement>("[data-component-preview]")),
        );
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }

      parent.postMessage(
        { type: "action-result", requestId: message.requestId, error } satisfies ActionResult,
        location.origin,
      );
    };

    window.addEventListener("message", receive);

    return () => window.removeEventListener("message", receive);
  }, [data?.id]);

  if (!data) return null;

  const definition = components.find((component) => component.id === data.id);

  if (!definition) throw new Error(`Unknown component: ${data.id}`);

  return (
    <div data-theme={data.theme} className="min-h-dvh bg-(--lab-bg) p-3 text-(--lab-text)">
      <div className="mx-auto mb-3 flex max-w-[1120px] items-center justify-between gap-3">
        <div>
          <span className="text-[9px] font-semibold tracking-[1.8px] text-(--lab-faint) max-[460px]:text-[8px]">
            THE STATE BOARD
          </span>
          <p className="mt-1.5 text-base font-[450] tracking-[-.4px] text-(--lab-muted) max-[460px]:text-[13px]">
            One component. Every little moment.
          </p>
        </div>
        <span className="text-[10px] text-(--lab-faint) max-[800px]:hidden">
          Changes appear together{" "}
          <span aria-hidden="true" className="ml-2 text-[18px]">
            ↙
          </span>
        </span>
      </div>
      <main
        id="specimens"
        data-count={definition.states.length}
        className="specimens mx-auto grid max-w-[1120px] grid-cols-6 gap-3 max-[800px]:grid-cols-2 max-[460px]:grid-cols-1"
        aria-label="Component states"
      >
        {definition.states.map((state, index) => (
          <section
            key={state.id}
            data-state={state.id}
            aria-label={`${definition.name}: ${state.name}`}
            className="specimen col-span-2 min-w-0 overflow-hidden rounded-[10px] border border-(--lab-border) bg-(--lab-surface) max-[800px]:col-span-1"
          >
            <header className="flex items-center gap-2 px-3 py-2">
              <span className="font-mono text-[9px] text-(--lab-faint)">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="text-[10px] font-[550] text-(--lab-muted)">{state.name}</h2>
            </header>
            <div
              data-component-preview
              className="flex min-h-[136px] items-center justify-center px-3 py-2 max-[460px]:min-h-[180px]"
            >
              {definition.render(data.props, state.id)}
            </div>
            <p className="px-2 pt-2 pb-2.5 text-center text-[9px] text-(--lab-faint)">
              {state.description}
            </p>
          </section>
        ))}
      </main>
      <footer className="mx-auto mt-3 flex max-w-[340px] items-center gap-3 text-[9px] whitespace-nowrap text-(--lab-faint) max-[460px]:gap-2 max-[460px]:text-[8px]">
        <span className="h-px flex-1 bg-(--lab-border)" />
        <span>A little room to try things.</span>
        <span className="h-px flex-1 bg-(--lab-border)" />
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!, {
  onUncaughtError: (error) =>
    parent.postMessage(
      { type: "error", message: error instanceof Error ? error.message : String(error) },
      location.origin,
    ),
}).render(<Preview />);
