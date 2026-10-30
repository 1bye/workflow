import { createRoot } from "react-dom/client";
import components from "@drafts/registry.js";
import App from "./App.jsx";
import { componentValues } from "./state.js";
import "./styles.css";

const root = createRoot(document.getElementById("root"));

try {
  const response = await fetch("/api/settings");

  if (!response.ok) throw new Error(await response.text());

  const settings = await response.json();

  if (!Array.isArray(components) || !components.length) throw new Error("Add at least one component to registry.js.");

  for (const definition of components) {
    if (!/^[a-z][a-z0-9-]*$/.test(definition.id) || typeof definition.component !== "function" || !definition.states?.length || !Array.isArray(definition.controls)) {
      throw new Error("Each preview definition needs an id, a React component, controls, and states.");
    }

    settings.components[definition.id] = componentValues(definition, settings.components[definition.id]);
  }

  const baseline = JSON.stringify(settings);
  const storageKey = `component-lab-draft-${response.headers.get("X-Component-Lab-Session")}`;
  let pending;

  try { pending = JSON.parse(sessionStorage.getItem(storageKey) ?? "null"); } catch { /* Browser storage is optional. */ }

  const restore = pending?.base === baseline && pending.settings?.version === 1;

  root.render(<App components={components} initialSettings={restore ? pending.settings : settings} initialId={restore ? pending.selectedId : components[0].id} baseline={baseline} storageKey={storageKey} />);
} catch (error) {
  root.render(<p role="alert" className="m-6 rounded-md border border-[#d9b4a3] bg-[#fff5ef] p-4 text-[#8e452c]">{error.message}</p>);
}
