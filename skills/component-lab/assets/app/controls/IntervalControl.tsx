import type { IntervalControl } from "../../schema/compound";
import { NumberField, type EditorProps } from "./shared";

export default function IntervalControlEditor({
  label,
  control,
  value,
  onChange,
}: EditorProps<IntervalControl>) {
  const { min, max, step, unit } = control;
  const percent = (n: number) => (100 * (n - min)) / (max - min);

  return (
    <>
      <div
        data-interval-fields
        className="grid grid-cols-[minmax(0,1fr)_minmax(0,3fr)] items-center gap-1.5"
      >
        <div className="min-w-0">
          <span className="block truncate" title={label}>
            {label}
          </span>
          <span className="text-[9px] text-(--lab-faint)">{unit}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <NumberField
            label={`${label} minimum`}
            short="Min"
            value={value[0]}
            min={min}
            max={value[1]}
            step={step}
            onChange={(n) => onChange([n, value[1]])}
          />
          <NumberField
            label={`${label} maximum`}
            short="Max"
            value={value[1]}
            min={value[0]}
            max={max}
            step={step}
            onChange={(n) => onChange([value[0], n])}
          />
        </div>
      </div>
      <div className="relative mt-1 h-4">
        <div className="pointer-events-none absolute inset-x-1 top-[7px] h-0.5 rounded-full bg-(--lab-border)">
          <span
            className="absolute h-full rounded-full bg-(--lab-muted)"
            style={{ left: `${percent(value[0])}%`, right: `${100 - percent(value[1])}%` }}
          />
        </div>
        <input
          type="range"
          aria-label={`${label} lower bound`}
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(event) => onChange([Math.min(event.target.valueAsNumber, value[1]), value[1]])}
        />
        <input
          type="range"
          aria-label={`${label} upper bound`}
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(event) => onChange([value[0], Math.max(event.target.valueAsNumber, value[0])])}
        />
      </div>
    </>
  );
}
