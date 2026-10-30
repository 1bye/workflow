import { useEffect, useRef, useState } from "react";
import Controls from "./Controls.jsx";
import ResizeHandle from "./ResizeHandle.jsx";
import usePanels from "./usePanels.js";

export default function App({ components, initialSettings, initialId, baseline, storageKey }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(baseline);
  const [selectedId, setSelectedId] = useState(initialId);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);
  const preview = useRef(null);
  const panels = usePanels();
  const selected = components.find((component) => component.id === selectedId) ?? components[0];
  const values = settings.components[selected.id];
  const dirty = JSON.stringify(settings) !== saved;
  const filtered = components.filter((component) => component.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const receive = (event) => {
      if (event.origin !== location.origin || event.source !== preview.current?.contentWindow) return;

      if (event.data?.type === "ready") setPreviewVersion((version) => version + 1);

      if (event.data?.type === "error") setError(event.data.message);
    };

    window.addEventListener("message", receive);

    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    preview.current?.contentWindow.postMessage({ type: "render", id: selected.id, props: values, canvas: settings.canvas }, location.origin);
  }, [selected.id, values, settings.canvas, previewVersion]);
  useEffect(() => {
    try {
      if (dirty) sessionStorage.setItem(storageKey, JSON.stringify({ base: saved, settings, selectedId }));
      else sessionStorage.removeItem(storageKey);
    } catch { /* Browser storage is optional. */ }
  }, [dirty, settings, saved, selectedId, storageKey]);

  function updateControl(key, value) {
    setSettings((current) => ({ ...current, components: { ...current.components, [selected.id]: { ...current.components[selected.id], [key]: value } } }));
  }

  async function save() {
    const snapshot = JSON.stringify(settings);

    setSaving(true);

    try {
      const response = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: snapshot });

      if (!response.ok) throw new Error(await response.text());

      setSaved(snapshot);
      setError(null);
    } catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid h-dvh min-h-[480px] grid-rows-[minmax(0,1fr)]">
      <main id="workbench" ref={panels.ref} className="grid min-h-0 grid-cols-[var(--sidebar-width)_6px_minmax(0,1fr)]" style={{ "--sidebar-width": `${panels.sizes.width}px`, "--library-height": `${panels.sizes.height}px` }}>
        <aside id="sidebar" aria-label="Components and tweaks" className="grid min-h-0 min-w-0 grid-rows-[var(--library-height)_6px_minmax(0,1fr)] bg-white">
          <section aria-labelledby="components-heading" className="min-h-0 overflow-auto px-[21px] py-[22px] max-[600px]:px-3.5">
            <div className="mb-[18px] flex items-center gap-2"><h2 id="components-heading" className="text-xs font-semibold tracking-[-.1px]">Components</h2><span id="component-count" className="min-w-[18px] rounded bg-[#f0f1ec] px-[5px] py-0.5 text-center text-[9px] text-[#818676]">{components.length}</span></div>
            <label className="flex items-center gap-[7px] rounded-[5px] border border-[#e8e9e3] bg-[#fcfcfa] px-[9px] py-1.5 text-[#93998a]"><span aria-hidden="true" className="text-[19px] leading-[15px]">⌕</span><input id="search" aria-label="Find a component" type="search" placeholder="Find a component…" className="min-w-0 w-full border-0 bg-transparent text-[10px] text-[#4f5449] outline-offset-7 placeholder:text-[#9b9e94]" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <div id="component-list" className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2.5">
              {filtered.map((component) => <button key={component.id} type="button" data-id={component.id} aria-pressed={selected.id === component.id} className="flex min-w-0 flex-col items-stretch rounded-[7px] border border-[#d8dfcf] bg-white p-[5px] text-left aria-pressed:bg-[#f4f6ef] aria-pressed:shadow-[0_0_0_1px_#d8dfcf]" onClick={() => setSelectedId(component.id)}><img alt="" src={component.thumbnail} className="h-[62px] w-full rounded object-cover" /><span className="px-[3px] pt-[7px] pb-[3px] text-[10px] font-[550]">{component.name}</span></button>)}
            </div>
            {!filtered.length ? <p id="empty-search" className="mt-5 text-[11px] text-[#92958a]">No matching components.</p> : null}
          </section>
          <ResizeHandle orientation="horizontal" value={panels.sizes.height} bounds={panels.bounds.height} onResize={(value) => panels.resize("height", value)} />
          <section aria-labelledby="tweaks-heading" className="min-h-0 overflow-auto p-[21px] max-[600px]:px-3.5">
            <div className="mb-2.5 flex items-center gap-2"><h2 id="tweaks-heading" className="text-xs font-semibold tracking-[-.1px]">Tweaks</h2><button id="reset" type="button" className="ml-auto border-0 bg-transparent p-0 text-[10px] text-[#8a8d81] hover:text-[#404b38]" onClick={() => setSettings((current) => ({ ...current, components: { ...current.components, [selected.id]: { ...selected.defaults } } }))}>Reset</button></div>
            <div className="flex items-center gap-1.5 text-[9px] text-[#8d9283]"><span className="size-[5px] shrink-0 rounded-full bg-[#8da180]" />Shared across all states</div>
            <Controls component={selected} values={values} onChange={updateControl} />
          </section>
        </aside>
        <ResizeHandle orientation="vertical" value={panels.sizes.width} bounds={panels.bounds.width} onResize={(value) => panels.resize("width", value)} />
        <section aria-labelledby="preview-title" className="relative grid min-h-0 min-w-0 grid-rows-[65px_minmax(0,1fr)] max-[600px]:grid-rows-[auto_minmax(0,1fr)]">
          <header className="flex items-center justify-between gap-[15px] border-b border-[#e6e7e0] bg-[#fdfdfa] px-[30px] max-[900px]:px-[18px] max-[600px]:flex-col max-[600px]:items-start max-[600px]:justify-center max-[600px]:gap-[7px] max-[600px]:py-2">
            <div className="flex min-w-0 items-center gap-2.5"><span aria-hidden="true" className="text-[21px] text-[#8b9681]">◈</span><h1 id="preview-title" className="text-xs font-[550] whitespace-nowrap max-[600px]:text-[11px]">{selected.name}</h1><span className="border-l border-[#e2e4da] pl-[11px] text-[9px] whitespace-nowrap text-[#969a8d] max-[900px]:hidden">{selected.states.length} states</span></div>
            <div className="flex items-center gap-[18px] max-[900px]:gap-2.5 max-[600px]:flex-wrap max-[600px]:gap-[7px]">
              <div role="group" aria-label="Canvas background" className="flex gap-0.5 rounded-md border border-[#e4e6dc] bg-[#eeefe8] p-[3px]">{["paper", "map", "dark"].map((canvas) => <button key={canvas} type="button" data-canvas={canvas} aria-pressed={settings.canvas === canvas} className="rounded-[3px] border-0 bg-transparent px-2.5 py-[5px] text-[10px] text-[#89907e] capitalize aria-pressed:bg-white aria-pressed:text-[#4c5543] aria-pressed:shadow-[0_1px_3px_#343c2510] max-[600px]:px-1 max-[600px]:py-[3px]" onClick={() => setSettings((current) => ({ ...current, canvas }))}>{canvas}</button>)}</div>
              <div className="flex items-center gap-3"><span id="save-status" role="status" className="text-[10px] text-[#888c81] max-[1100px]:hidden">{saving ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}</span><button id="save" type="button" disabled={!dirty || saving} onClick={save} className="flex items-center gap-[18px] rounded-md border border-[#394637] bg-[#414e3e] px-3 py-[9px] text-[11px] font-[550] whitespace-nowrap text-white hover:enabled:bg-[#303d2e] disabled:opacity-60 max-[600px]:gap-2 max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-[10px]">Save changes <span aria-hidden="true">↗</span></button></div>
            </div>
          </header>
          <iframe id="preview" ref={preview} src="/preview.html" title="Live component states" className="h-full w-full border-0 bg-[#f4f4ef]" onLoad={() => setPreviewVersion((version) => version + 1)} />
          {error ? <div id="error" role="alert" className="absolute inset-x-5 bottom-5 rounded-md border border-[#d9b4a3] bg-[#fff5ef] p-[15px] text-xs text-[#8e452c]">{error}</div> : null}
        </section>
      </main>
    </div>
  );
}
