import { useState } from "react";
import type { SpacingControl } from "../../schema/compound";
import { NumberField, type EditorProps } from "./shared";

export default function SpacingControlEditor({
  label,
  control,
  value,
  onChange,
}: EditorProps<SpacingControl>) {
  const [linked, setLinked] = useState(() => new Set(Object.values(value)).size === 1);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-2">
      <div className="min-w-0">
        <span className="block truncate" title={label}>
          {label}
        </span>
        <div className="mt-1 flex items-center gap-1 text-[9px] text-(--lab-faint)">
          {control.unit}
          <button
            type="button"
            aria-label={`${linked ? "Unlink" : "Link"} ${label.toLowerCase()} sides`}
            aria-pressed={linked}
            className="grid size-5 place-items-center rounded border-0 text-(--lab-faint) hover:bg-(--lab-surface) aria-pressed:bg-(--lab-active) aria-pressed:text-(--lab-text)"
            onClick={() => {
              setLinked(!linked);

              if (!linked)
                onChange({ top: value.top, right: value.top, bottom: value.top, left: value.top });
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <path d="M6 10l4-4M6.5 5l1.8-1.8a3 3 0 014.2 4.2L11 9M5 7L3.5 8.5a3 3 0 004.2 4.2L9.5 11" />
            </svg>
          </button>
        </div>
      </div>
      <div data-spacing-values className="grid grid-cols-2 gap-1">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <NumberField
            key={side}
            label={`${label} ${side}`}
            short={{ top: "T", right: "R", bottom: "B", left: "L" }[side]}
            value={value[side]}
            min={control.min}
            max={control.max}
            step={control.step}
            onChange={(n) =>
              onChange(linked ? { top: n, right: n, bottom: n, left: n } : { ...value, [side]: n })
            }
          />
        ))}
      </div>
    </div>
  );
}
