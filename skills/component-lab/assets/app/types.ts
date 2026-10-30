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

export type ChangeControl = (key: string, value: Value) => void;
export type PanelSizes = { width: number; height: number };
export type PanelBounds = Record<keyof PanelSizes, { min: number; max: number }>;
