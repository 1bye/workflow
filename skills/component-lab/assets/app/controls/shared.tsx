import { useState, type PointerEvent, type ReactNode } from "react";
import type { CompoundControl } from "../../schema/compound";

export type EditorProps<C extends CompoundControl> = {
  label: string;
  control: C;
  value: C["default"];
  onChange: (value: C["default"]) => void;
};

export function Heading({
  label,
  unit,
  children,
}: {
  label: string;
  unit?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-1.5 flex h-4 min-w-0 items-center justify-between gap-2">
      <span className="min-w-0 truncate" title={label}>
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-2 text-[9px] text-(--lab-faint)">
        {unit}
        {children}
      </div>
    </div>
  );
}

export function NumberField({
  label,
  short,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  short: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <label className="flex min-w-0 items-center gap-1 rounded-[4px] bg-(--lab-surface) px-1.5 py-1">
      <span className="shrink-0 text-[9px] text-(--lab-faint)" aria-hidden="true">
        {short}
      </span>
      <input
        type="number"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={draft ?? value}
        className="w-full min-w-0 border-0 bg-transparent p-0 text-right font-mono text-[10px] leading-4 text-(--lab-text) tabular-nums"
        onChange={(event) => {
          setDraft(event.target.value);
          const next = event.target.valueAsNumber;

          if (Number.isFinite(next)) onChange(clamp(next, min ?? -Infinity, max ?? Infinity));
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur();
        }}
      />
    </label>
  );
}

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const snap = (n: number, min: number, max: number, step: number) =>
  clamp(Number((Math.round((n - min) / step) * step + min).toFixed(6)), min, max);

export function point(event: PointerEvent<SVGSVGElement>) {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
  };
}
