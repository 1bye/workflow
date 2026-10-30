import type { Value, Values } from "../schema/index";
import { isRecord, isValues } from "../settings";
import { isTheme, type Theme } from "./theme";

export type RenderMessage = {
  type: "render";
  id: string;
  props: Values;
  theme: Theme;
};

export function isRenderMessage(value: unknown): value is RenderMessage {
  return (
    isRecord(value) &&
    value.type === "render" &&
    typeof value.id === "string" &&
    isValues(value.props) &&
    isTheme(value.theme)
  );
}

export type ActionMessage = { type: "action"; id: string; key: string; requestId: string };
export type ActionResult = { type: "action-result"; requestId: string; error: string | null };

export function isActionMessage(value: unknown): value is ActionMessage {
  return (
    isRecord(value) &&
    value.type === "action" &&
    typeof value.id === "string" &&
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
  key: string;
  requestId: string;
  busy: boolean;
  error: string | null;
};

export type ChangeControl = (key: string, value: Value) => void;
export type PanelSizes = { width: number; height: number };
export type PanelBounds = Record<keyof PanelSizes, { min: number; max: number }>;
