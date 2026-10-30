import type { CSSProperties } from "react";
import type { ControlMap, Values } from "../schema/index";
import { title } from "../schema/entries";
import type { ChangeControl } from "./types";
import SelectControl from "./SelectControl";

type Props = { component: { controls: ControlMap }; values: Values; onChange: ChangeControl };

export default function Controls({ component, values, onChange }: Props) {
  return (
    <form
      id="controls"
      className="mt-2.5 grid gap-1"
      aria-label="Component appearance"
      onSubmit={(event) => event.preventDefault()}
    >
      {Object.entries(component.controls)
        .filter(([, control]) => !control.hidden)
        .map(([key, control]) => {
          const id = `control-${key}`;
          const value = values[key] ?? control.default;
          const label = control.label ?? title(key);

          return (
            <div
              key={key}
              data-control={control.type}
              className="relative flex min-h-[30px] min-w-0 items-center gap-2 rounded-[6px] bg-(--lab-control) px-2 text-[11px] text-(--lab-muted)"
              style={
                control.type === "number"
                  ? ({
                      "--fill": `${(100 * (Number(value) - control.min)) / (control.max - control.min)}%`,
                    } as CSSProperties)
                  : undefined
              }
            >
              {control.type === "boolean" ? (
                <>
                  <span id={`${id}-label`} className="mr-auto min-w-0 truncate" title={label}>
                    {label}
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby={`${id}-label`}
                    className="flex shrink-0 gap-0.5 py-1"
                  >
                    {[false, true].map((option) => (
                      <label key={String(option)} className="cursor-pointer">
                        <input
                          type="radio"
                          name={key}
                          value={String(option)}
                          checked={value === option}
                          className="peer sr-only"
                          onChange={() => onChange(key, option)}
                        />
                        <span className="block rounded-[4px] px-2 py-1 text-[10px] leading-none text-(--lab-faint) peer-checked:bg-(--lab-active) peer-checked:text-(--lab-text) peer-checked:shadow-[0_1px_3px_var(--lab-shadow)]">
                          {option ? "On" : "Off"}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label
                    id={`${id}-label`}
                    className="relative mr-auto min-w-0 max-w-[45%] shrink-0 truncate"
                    htmlFor={id}
                    title={label}
                  >
                    {label}
                  </label>
                  {control.type === "color" ? (
                    <>
                      <div className="flex min-w-0 flex-wrap items-center py-1">
                        {control.options.map((color) => (
                          <button
                            key={color}
                            type="button"
                            data-color={color}
                            aria-label={`Use ${color}`}
                            aria-pressed={value === color}
                            className="flex size-4 shrink-0 items-center justify-center rounded-full border border-transparent p-0 hover:border-(--lab-focus) aria-pressed:border-(--lab-focus)"
                            onClick={() => onChange(key, color)}
                          >
                            <span
                              className="size-3 rounded-full shadow-[inset_0_0_0_1px_var(--lab-shadow)]"
                              style={{ backgroundColor: color }}
                            />
                          </button>
                        ))}
                      </div>
                      <output
                        data-color-value
                        htmlFor={id}
                        className="shrink-0 font-mono text-[10px] text-(--lab-faint)"
                      >
                        {String(value).toUpperCase()}
                      </output>
                      <input
                        id={id}
                        name={key}
                        type="color"
                        aria-label={`Custom ${label.toLowerCase()} color`}
                        title={`Custom color: ${String(value).toUpperCase()}`}
                        value={String(value)}
                        onChange={(event) => onChange(key, event.target.value)}
                      />
                    </>
                  ) : control.type === "number" ? (
                    <>
                      <output
                        className="pointer-events-none relative shrink-0 font-mono text-[10px] text-(--lab-muted) tabular-nums"
                        htmlFor={id}
                      >
                        {value}
                        <span className="ml-0.5 text-(--lab-muted)">{control.unit}</span>
                      </output>
                      <input
                        id={id}
                        name={key}
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={Number(value)}
                        aria-valuetext={`${value}${control.unit}`}
                        onChange={(event) => onChange(key, Number(event.target.value))}
                      />
                    </>
                  ) : control.type === "select" ? (
                    <SelectControl
                      id={id}
                      name={key}
                      options={control.options}
                      value={String(value)}
                      onChange={(option) => onChange(key, option)}
                    />
                  ) : (
                    <input
                      id={id}
                      name={key}
                      type="text"
                      maxLength={control.maxLength}
                      value={String(value)}
                      className="h-[30px] min-w-0 flex-1 border-0 bg-transparent p-0 text-right text-[11px] text-(--lab-text)"
                      onChange={(event) => onChange(key, event.target.value)}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
    </form>
  );
}
