import type { PanelBounds, PanelSizes } from "./types";
import type { Components } from "../schema/entries";
import { isRecord, validateSettings, type Settings } from "../settings";

export function restoreWorkspace(pending: unknown, persisted: Settings, components: Components) {
  const normalize = (settings: Settings): Settings => ({
    ...settings,
    components: {
      ...settings.components,
      ...Object.fromEntries(
        components.map((component) => [
          component.id,
          component.parse(settings.components[component.id]),
        ]),
      ),
    },
  });

  const settings = normalize(persisted);

  const result = {
    settings,
    id: components[0].id,
  };

  try {
    if (isRecord(pending) && typeof pending.selectedId === "string") {
      const stored = validateSettings(pending.settings);

      return {
        settings: normalize({
          ...stored,
          components: { ...persisted.components, ...stored.components },
        }),
        id: components.some(({ id }) => id === pending.selectedId) ? pending.selectedId : result.id,
      };
    }
  } catch {
    /* Ignore corrupt browser data while keeping the project defaults. */
  }

  return result;
}

export function panelBounds(width: number, height: number): PanelBounds {
  const narrow = width <= 600;

  return {
    width: {
      min: narrow ? 160 : 220,
      max: Math.max(narrow ? 160 : 220, Math.min(480, width - (narrow ? 170 : 320))),
    },
    height: { min: 180, max: Math.max(180, height - 160) },
  };
}

export function clampPanels(sizes: PanelSizes, bounds: PanelBounds): PanelSizes {
  const clamp = (key: keyof PanelSizes) =>
    Math.round(
      Math.max(bounds[key].min, Math.min(bounds[key].max, Number(sizes[key]) || bounds[key].min)),
    );

  return { width: clamp("width"), height: clamp("height") };
}
