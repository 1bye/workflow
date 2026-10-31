import {
  isSpacingPath,
  isSpacingProperty,
  isSpacingValue,
  isSpacingScope,
  type SpacingScope,
  type SpacingValues,
} from "./spacing-edits";
import type { Value } from "../schema/index";
import { isRecord } from "../settings";
import { isTheme, type Theme } from "./theme";
import { isCanvas, isInstanceId, type Canvas } from "./canvas";

export type RenderMessage = {
  type: "render";
  id: string;
  canvas: Canvas;
  theme: Theme;
  inspectSpacing?: boolean;
  spacingScope?: SpacingScope;
};

export function isRenderMessage(value: unknown): value is RenderMessage {
  return (
    isRecord(value) &&
    value.type === "render" &&
    typeof value.id === "string" &&
    isCanvas(value.canvas) &&
    isTheme(value.theme) &&
    (value.inspectSpacing === undefined || typeof value.inspectSpacing === "boolean") &&
    (value.spacingScope === undefined || isSpacingScope(value.spacingScope))
  );
}

export type ActionMessage = {
  type: "action";
  id: string;
  instanceId: string;
  key: string;
  requestId: string;
};
export type ActionResult = {
  type: "action-result";
  requestId: string;
  error: string | null;
};

export function isActionMessage(value: unknown): value is ActionMessage {
  return (
    isRecord(value) &&
    value.type === "action" &&
    typeof value.id === "string" &&
    isInstanceId(value.instanceId) &&
    typeof value.key === "string" &&
    typeof value.requestId === "string"
  );
}

export function isActionResult(value: unknown): value is ActionResult {
  return (
    isRecord(value) &&
    value.type === "action-result" &&
    typeof value.requestId === "string" &&
    (value.error === null || typeof value.error === "string")
  );
}

export type ActionStatus = {
  id: string;
  instanceId: string;
  key: string;
  requestId: string;
  busy: boolean;
  error: string | null;
};

export type SelectInstanceMessage = {
  type: "select-instance";
  id: string;
  instanceId: string;
};
export function isSelectInstanceMessage(value: unknown): value is SelectInstanceMessage {
  return (
    isRecord(value) &&
    value.type === "select-instance" &&
    typeof value.id === "string" &&
    isInstanceId(value.instanceId)
  );
}

export type ChangeControl = (key: string, value: Value) => void;
export type PanelSizes = { width: number; height: number };
export type PanelBounds = Record<keyof PanelSizes, { min: number; max: number }>;

export type SpacingMessage = {
  type: "spacing-change";
  id: string;
  instanceId: string;
  path: string;
  edits: SpacingValues;
};
export function isSpacingMessage(value: unknown): value is SpacingMessage {
  return (
    isRecord(value) &&
    value.type === "spacing-change" &&
    typeof value.id === "string" &&
    isInstanceId(value.instanceId) &&
    isSpacingPath(value.path) &&
    isRecord(value.edits) &&
    Object.keys(value.edits).length > 0 &&
    Object.entries(value.edits).every(
      ([property, amount]) => isSpacingProperty(property) && isSpacingValue(property, amount),
    )
  );
}
