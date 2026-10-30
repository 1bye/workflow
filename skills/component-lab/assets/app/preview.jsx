import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import components from "@drafts/registry.js";
import "./preview.css";

function Preview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const receive = (event) => {
      if (event.origin === location.origin && event.source === parent && event.data?.type === "render") setData(event.data);
    };

    window.addEventListener("message", receive);
    parent.postMessage({ type: "ready" }, location.origin);

    return () => window.removeEventListener("message", receive);
  }, []);

  if (!data) return null;

  const definition = components.find((component) => component.id === data.id);

  if (!definition) throw new Error(`Unknown component: ${data.id}`);

  const Component = definition.component;

  return (
    <div data-canvas={data.canvas} className="preview-board min-h-dvh bg-[#f4f4ef] px-[30px] pt-6 pb-[18px] max-[800px]:px-6 max-[800px]:py-7 max-[460px]:px-[15px] max-[460px]:py-[22px]">
      <div className="board-heading mx-auto mb-5 flex max-w-[1120px] items-center justify-between gap-5">
        <div><span className="text-[9px] font-semibold tracking-[1.8px] text-[#929987] max-[460px]:text-[8px]">THE STATE BOARD</span><p className="mt-[9px] text-base font-[450] tracking-[-.4px] text-[#59624f] max-[460px]:text-[13px]">One component. Every little moment.</p></div>
        <span className="text-[10px] text-[#929987] max-[800px]:hidden">Changes appear together <span aria-hidden="true" className="ml-2 text-[18px]">↙</span></span>
      </div>
      <main id="specimens" data-count={definition.states.length} className="specimens mx-auto grid max-w-[1120px] grid-cols-6 gap-[18px] max-[800px]:grid-cols-2 max-[800px]:gap-[15px] max-[460px]:grid-cols-1" aria-label="Component states">
        {definition.states.map((state, index) => (
          <section key={state.id} data-state={state.id} aria-label={`${definition.name}: ${state.name}`} className="specimen col-span-2 min-w-0 overflow-hidden rounded-[10px] border border-[#e0e3d8] bg-[#fcfcf8] max-[800px]:col-span-1">
            <header className="flex items-center gap-2 px-4 py-3"><span className="font-mono text-[9px] text-[#a7af9d]">{String(index + 1).padStart(2, "0")}</span><h2 className="text-[10px] font-[550] text-[#707968]">{state.name}</h2></header>
            <div className="specimen-stage flex min-h-[136px] items-center justify-center px-4 py-2.5 max-[460px]:min-h-[180px]"><Component {...data.props} {...state.props} state={state.id} /></div>
            <p className="state-description px-2 pt-[11px] pb-[13px] text-center text-[9px] text-[#9aa18f]">{state.description}</p>
          </section>
        ))}
      </main>
      <footer className="mx-auto mt-5 flex max-w-[340px] items-center gap-[15px] text-[9px] whitespace-nowrap text-[#a0a691] max-[460px]:gap-2 max-[460px]:text-[8px]"><span className="footer-line h-px flex-1 bg-[#dfe3d6]" /><span>A little room to try things.</span><span className="footer-line h-px flex-1 bg-[#dfe3d6]" /></footer>
    </div>
  );
}

createRoot(document.getElementById("root"), {
  onUncaughtError: (error) => parent.postMessage({ type: "error", message: error.message }, location.origin),
}).render(<Preview />);
