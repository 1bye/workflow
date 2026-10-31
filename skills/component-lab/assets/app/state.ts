import type { PanelBounds, PanelSizes } from "./types";
import type { Components } from "../schema/entries";
import { isRecord, validateSettings, type Settings } from "../settings";
import { isComponentId } from "../schema/entries";
import { createCanvas, isCanvas, selectedInstance, type Canvas, type Canvases } from "./canvas";

export type Workspace = { settings: Settings; id: string; canvases: Canvases };

export function replaceCanvas(workspace: Workspace, id: string, canvas: Canvas): Workspace {
  return {
    ...workspace,
    canvases: { ...workspace.canvases, [id]: canvas },
    settings: {
      ...workspace.settings,
      components: {
        ...workspace.settings.components,
        [id]: selectedInstance(canvas).props,
      },
    },
  };
}

export function restoreWorkspace(
  pending: unknown,
  persisted: Settings,
  components: Components,
): Workspace {
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

  let settings = normalize(persisted);
  let id = components[0].id;
  let savedCanvases: unknown;

  try {
    if (isRecord(pending) && typeof pending.selectedId === "string") {
      const stored = validateSettings(pending.settings);

      settings = normalize({
        ...stored,
        components: { ...persisted.components, ...stored.components },
      });
      id = components.some(({ id }) => id === pending.selectedId) ? pending.selectedId : id;

      if (pending.version === 2) savedCanvases = pending.canvases;
    }
  } catch {
    /* Ignore corrupt browser data while keeping the project defaults. */
  }

  const canvases: Canvases = {};

  if (isRecord(savedCanvases)) {
    for (const [key, canvas] of Object.entries(savedCanvases)) {
      if (isComponentId(key) && isCanvas(canvas))
        canvases[key] = {
          selectedId: canvas.selectedId,
          instances: canvas.instances.map(({ id, props, spacing }) =>
            spacing ? { id, props, spacing } : { id, props },
          ),
        };
    }
  }

  for (const component of components) {
    const saved = canvases[component.id];

    const canvas = saved
      ? {
          ...saved,
          instances: saved.instances.map((instance) => ({
            ...instance,
            props: component.parse(instance.props),
          })),
        }
      : createCanvas(settings.components[component.id]!);

    canvases[component.id] = canvas;
    settings.components[component.id] = selectedInstance(canvas).props;
  }

  return { settings, id, canvases };
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
