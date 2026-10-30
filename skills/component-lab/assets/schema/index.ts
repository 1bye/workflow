import { createElement, type ComponentType, type ReactElement } from "react";
import { Compound, parseCompound, type CompoundControl } from "./compound";
import { sameValue, type Value, type Values } from "./values";
import { isAssetSource } from "./asset";

export type {
  Value,
  Values,
  Vector2,
  Interval,
  Spacing,
  Easing,
  GradientStop,
  Gradient,
  Shadow,
  Corners,
  Typography,
} from "./values";
export { gradientCSS, shadowCSS, cornersCSS } from "./styles";
export type Presentation = { label?: string; hidden?: boolean };
export type NumberControl = Presentation & {
  type: "number";
  default: number;
  min: number;
  max: number;
  step: number;
  unit: string;
};
export type ColorControl = Presentation & {
  type: "color";
  default: string;
  options: readonly string[];
};
export type BooleanControl = Presentation & { type: "boolean"; default: boolean };
export type TextControl = Presentation & { type: "text"; default: string; maxLength: number };
export type SelectControl<T extends string = string> = Presentation & {
  type: "select";
  default: T;
  options: readonly T[];
};
export type AssetControl = Presentation & { type: "asset"; default: string };
export type ActionContext = { element: HTMLElement };
export type ActionControl = Presentation & {
  type: "action";
  button: string;
  onClick: (context: ActionContext) => void | Promise<void>;
};
export type AnyControl =
  | NumberControl
  | ColorControl
  | BooleanControl
  | TextControl
  | SelectControl
  | AssetControl
  | ActionControl
  | CompoundControl;
export type ControlMap = Record<string, AnyControl>;
type ValueControl = Exclude<AnyControl, ActionControl>;
type ControlProps<C extends ControlMap> = {
  -readonly [K in keyof C as C[K] extends ActionControl ? never : K]: C[K] extends {
    default: infer D extends Value;
  }
    ? D
    : never;
};
export type Props<S extends { controls: ControlMap }> = ControlProps<S["controls"]>;
export type State<P> = { name?: string; description?: string; props?: Partial<P> };

export const Control = {
  ...Compound,
  Asset(options: Presentation & { default: string }): AssetControl {
    if (!isAssetSource(options.default))
      throw new Error(
        "Assets need a local image path, an embedded image up to 256 KB, or an empty default.",
      );

    return { ...options, type: "asset" };
  },
  Action(
    options: Presentation & {
      button?: string;
      onClick: ActionControl["onClick"];
    },
  ): ActionControl {
    const button = options.button ?? "Run";

    if (!button.trim() || typeof options.onClick !== "function")
      throw new Error("Actions need a button label and a callback.");

    return { ...options, button, type: "action" };
  },
  Number(
    options: Presentation & {
      default: number;
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
    },
  ): NumberControl {
    const result: NumberControl = {
      min: 0,
      max: 100,
      step: 1,
      unit: "",
      ...options,
      type: "number",
    };

    if (
      ![result.default, result.min, result.max, result.step].every(Number.isFinite) ||
      result.min >= result.max ||
      result.step <= 0 ||
      result.default < result.min ||
      result.default > result.max
    )
      throw new Error(
        "Number controls need finite bounds, a positive step, and a default within bounds.",
      );

    return result;
  },
  Color(options: Presentation & { default: string; options?: readonly string[] }): ColorControl {
    const result: ColorControl = { options: [], ...options, type: "color" };

    if (![result.default, ...result.options].every((value) => /^#[a-f0-9]{6}$/i.test(value)))
      throw new Error("Colors must use six-digit hex values.");

    return result;
  },
  Boolean(options: Presentation & { default: boolean }): BooleanControl {
    return { ...options, type: "boolean" };
  },
  Text(options: Presentation & { default: string; maxLength?: number }): TextControl {
    const result: TextControl = { maxLength: 120, ...options, type: "text" };

    if (
      !Number.isInteger(result.maxLength) ||
      result.maxLength < 1 ||
      result.maxLength > 500 ||
      result.default.length > result.maxLength
    )
      throw new Error(
        "Text controls need a maximum length between 1 and 500 that fits their default.",
      );

    return result;
  },
  Select<const T extends readonly [string, ...string[]]>(
    options: T,
    config: Presentation & { default: NoInfer<T[number]> },
  ): SelectControl<T[number]> {
    if (!options.includes(config.default) || new Set(options).size !== options.length)
      throw new Error("Select options must be unique and contain the default.");

    return { ...config, type: "select", options };
  },
};

function parseControl(control: ValueControl, value: unknown): Value {
  switch (control.type) {
    case "asset":
      return isAssetSource(value) ? value : control.default;
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? Math.min(control.max, Math.max(control.min, value))
        : control.default;
    case "color":
      return typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value) ? value : control.default;
    case "boolean":
      return typeof value === "boolean" ? value : control.default;
    case "text":
      return typeof value === "string" ? value.slice(0, control.maxLength) : control.default;
    case "select":
      return typeof value === "string" && control.options.includes(value) ? value : control.default;
    case "vector2":
    case "interval":
    case "spacing":
    case "easing":
    case "gradient":
    case "shadow":
    case "corners":
    case "typography":
      return parseCompound(control, value);
  }
}

export type BoundComponent = {
  id?: string;
  name: string;
  thumbnail?: string;
  controls: ControlMap;
  defaults: Values;
  states: Record<string, State<Values>>;
  parse: (input: unknown) => Values;
  render: (input: unknown, state: string) => ReactElement;
};

export function Component<const C extends ControlMap>(
  name: string,
  options: {
    id?: string;
    thumbnail?: string;
    controls: C;
    states?: Record<string, State<NoInfer<ControlProps<C>>>>;
  },
) {
  if (!name.trim()) throw new Error("A component needs a name.");

  const defaults = Object.fromEntries(
    Object.entries(options.controls)
      .filter((entry): entry is [string, ValueControl] => entry[1].type !== "action")
      .map(([key, control]) => [key, control.default]),
  ) as ControlProps<C>;

  const states: Record<string, State<ControlProps<C>>> = options.states ?? { default: {} };

  if (!Object.keys(states).length) throw new Error("A component needs at least one state.");

  for (const [state, definition] of Object.entries(states)) {
    for (const [key, value] of Object.entries(definition.props ?? {})) {
      const control = options.controls[key];

      if (!control || control.type === "action" || !sameValue(parseControl(control, value), value))
        throw new Error(`Invalid prop "${key}" in state "${state}".`);
    }
  }

  function parse(input: unknown): ControlProps<C> {
    const source =
      input !== null && typeof input === "object" && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {};

    // Object.fromEntries cannot retain the mapped relationship between control keys and values.
    return Object.fromEntries(
      Object.entries(options.controls)
        .filter((entry): entry is [string, ValueControl] => entry[1].type !== "action")
        .map(([key, control]) => [key, parseControl(control, source[key])]),
    ) as ControlProps<C>;
  }

  return {
    ...options,
    name,
    defaults,
    states,
    parse,
    from(component: ComponentType<ControlProps<C>>): BoundComponent {
      return {
        ...options,
        name,
        defaults,
        states,
        parse,
        render(input, state) {
          const snapshot = states[state];

          if (!snapshot) throw new Error(`Unknown state "${state}" for ${name}.`);

          return createElement(component, { ...parse(input), ...snapshot.props });
        },
      };
    },
  };
}
