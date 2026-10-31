import { createRoot } from "react-dom/client";
import components from "./components";
import App from "./App";
import { validateSettings } from "../settings";
import { resolveTheme } from "./theme";
import "./styles.css";

let storedTheme: string | null = null;

try {
  storedTheme = localStorage.getItem("component-lab-theme");
} catch {
  /* Browser storage is optional. */
}

const initialTheme = resolveTheme(storedTheme, matchMedia("(prefers-color-scheme: dark)").matches);

document.documentElement.dataset.theme = initialTheme;

const root = createRoot(document.getElementById("root")!);

try {
  const response = await fetch("/api/settings");

  if (!response.ok) throw new Error(await response.text());

  const persisted = validateSettings(await response.json());
  const workspaceId = response.headers.get("X-Component-Lab-Workspace");

  if (!workspaceId) throw new Error("Restart Component Lab to enable automatic workspace storage.");

  const storageKey = `component-lab-workspace-v1-${workspaceId}`;

  root.render(
    <App
      initialTheme={initialTheme}
      components={components}
      initialSettings={persisted}
      storageKey={storageKey}
    />,
  );
} catch (error) {
  root.render(
    <p
      role="alert"
      className="m-6 rounded-md border border-(--lab-error-border) bg-(--lab-error-bg) p-4 text-(--lab-error-text)"
    >
      {error instanceof Error ? error.message : String(error)}
    </p>,
  );
}
