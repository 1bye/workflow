import { isSpacingEdits, type SpacingEdits } from "./spacing-edits";
import type { Values } from "../schema/index";
import { isRecord, isValues } from "../settings";

export type PreviewInstance = {
  id: string;
  props: Values;
  spacing?: SpacingEdits;
};
export type Canvas = { instances: PreviewInstance[]; selectedId: string };
export type Canvases = Record<string, Canvas>;

export const isInstanceId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);

export function isCanvas(value: unknown): value is Canvas {
  if (
    !isRecord(value) ||
    !Array.isArray(value.instances) ||
    !value.instances.length ||
    !isInstanceId(value.selectedId)
  )
    return false;

  const ids = new Set<string>();

  for (const instance of value.instances) {
    if (
      !isRecord(instance) ||
      !isInstanceId(instance.id) ||
      !isValues(instance.props) ||
      (instance.spacing !== undefined && !isSpacingEdits(instance.spacing)) ||
      ids.has(instance.id)
    )
      return false;

    ids.add(instance.id);
  }

  return ids.has(value.selectedId);
}

export function createCanvas(props: Values): Canvas {
  return {
    instances: [{ id: "initial", props: structuredClone(props) }],
    selectedId: "initial",
  };
}

export function selectedInstance(canvas: Canvas): PreviewInstance {
  return (
    canvas.instances.find((instance) => instance.id === canvas.selectedId) ?? canvas.instances[0]!
  );
}

export function selectInstance(canvas: Canvas, id: string): Canvas {
  return canvas.instances.some((instance) => instance.id === id) && canvas.selectedId !== id
    ? { ...canvas, selectedId: id }
    : canvas;
}

export function duplicateInstance(canvas: Canvas, id: string): Canvas {
  if (!isInstanceId(id) || canvas.instances.some((instance) => instance.id === id)) return canvas;

  const index = canvas.instances.findIndex((instance) => instance.id === canvas.selectedId);

  const instances = [...canvas.instances];

  // Copy configured props; component-local interaction state starts fresh.
  instances.splice(index + 1, 0, {
    ...structuredClone(selectedInstance(canvas)),
    id,
  });

  return { instances, selectedId: id };
}

export function removeInstance(canvas: Canvas): Canvas {
  if (canvas.instances.length === 1) return canvas;

  const index = canvas.instances.findIndex((instance) => instance.id === canvas.selectedId);

  const instances = canvas.instances.filter((instance) => instance.id !== canvas.selectedId);

  return {
    instances,
    selectedId: instances[Math.min(index, instances.length - 1)]!.id,
  };
}

export function editInstance(
  canvas: Canvas,
  id: string,
  update: (props: Values) => Values,
): Canvas {
  return {
    ...canvas,
    instances: canvas.instances.map((instance) =>
      instance.id === id ? { ...instance, props: update(instance.props) } : instance,
    ),
  };
}

export function editSpacing(
  canvas: Canvas,
  id: string,
  update: (spacing: SpacingEdits) => SpacingEdits,
): Canvas {
  return {
    ...canvas,
    instances: canvas.instances.map((instance) =>
      instance.id === id ? { ...instance, spacing: update(instance.spacing ?? {}) } : instance,
    ),
  };
}
