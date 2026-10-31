import type { PointerEvent } from "react";
import type { Vector2Control } from "../../schema/compound";
import { Heading, NumberField, point, snap, type EditorProps } from "./shared";

export default function Vector2ControlEditor({
  label,
  control,
  value,
  onChange,
}: EditorProps<Vector2Control>) {
  const { min, max, step, unit } = control;
  const percent = (n: number) => 4 + 46 * ((n - min) / (max - min));

  const update = (event: PointerEvent<SVGSVGElement>) => {
    const p = point(event);

    onChange({
      x: snap(min + ((p.x * 54 - 4) / 46) * (max - min), min, max, step),
      y: snap(min + ((p.y * 54 - 4) / 46) * (max - min), min, max, step),
    });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_46px] items-center gap-x-1.5">
      <div className="col-start-1 row-start-1 self-start">
        <Heading label={label} unit={unit} />
      </div>
      <div className="contents">
        <svg
          aria-hidden="true"
          viewBox="0 0 54 54"
          className="col-start-2 row-span-2 row-start-1 size-[46px] touch-none cursor-crosshair rounded-[4px] bg-(--lab-surface)"
          onPointerDown={(event) => {
            if (event.button !== 0) return;

            event.currentTarget.setPointerCapture(event.pointerId);
            update(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event);
          }}
          onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
        >
          <path d="M27 4V50M4 27H50" stroke="var(--lab-border)" strokeDasharray="2 2" />
          <path d={`M27 27L${percent(value.x)} ${percent(value.y)}`} stroke="var(--lab-faint)" />
          <circle cx={percent(value.x)} cy={percent(value.y)} r="3" fill="var(--lab-text)" />
        </svg>
        <div data-vector-values className="col-start-1 row-start-2 grid grid-cols-2 gap-1">
          {(["x", "y"] as const).map((axis) => (
            <NumberField
              key={axis}
              label={`${label} ${axis.toUpperCase()}`}
              short={axis.toUpperCase()}
              value={value[axis]}
              min={min}
              max={max}
              step={step}
              onChange={(n) => onChange({ ...value, [axis]: n })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
