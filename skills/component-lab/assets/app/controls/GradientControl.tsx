import { useRef, useState } from "react";
import type { GradientControl } from "../../schema/compound";
import { MAX_GRADIENT_STOPS, type GradientStop } from "../../schema/values";
import { gradientCSS } from "../../schema/styles";
import { ColorField, NumberField, clamp, type EditorProps } from "./shared";

const buttonClass =
  "grid size-5 shrink-0 place-items-center rounded border-0 text-(--lab-faint) hover:bg-(--lab-surface) hover:text-(--lab-text) disabled:cursor-default disabled:opacity-30";

export default function GradientControlEditor({
  label,
  value,
  onChange,
}: EditorProps<GradientControl>) {
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected, value.stops.length - 1);
  const stop = value.stops[active]!;
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ index: number; x: number; position: number } | null>(null);

  const limits = (index: number) => ({
    min: value.stops[index - 1]?.position ?? 0,
    max: value.stops[index + 1]?.position ?? 100,
  });

  function updateStop(index: number, next: Partial<GradientStop>) {
    onChange({
      ...value,
      stops: value.stops.map((item, i) => (i === index ? { ...item, ...next } : item)),
    });
  }

  function addStop() {
    let index = 0;

    for (let i = 1; i < value.stops.length - 1; i++) {
      if (
        value.stops[i + 1]!.position - value.stops[i]!.position >
        value.stops[index + 1]!.position - value.stops[index]!.position
      )
        index = i;
    }

    const left = value.stops[index]!;
    const position = Number(((left.position + value.stops[index + 1]!.position) / 2).toFixed(1));
    const stops = [...value.stops];

    stops.splice(index + 1, 0, { color: left.color, position });
    setSelected(index + 1);
    onChange({ ...value, stops });
  }

  return (
    <>
      <div className="mb-1 flex min-h-6 min-w-0 items-center gap-1.5">
        <span className="mr-auto min-w-0 truncate" title={label}>
          {label}
        </span>
        <div className="w-[62px] shrink-0">
          <NumberField
            label={`${label} angle`}
            short="°"
            value={value.angle}
            min={0}
            max={360}
            onChange={(angle) => onChange({ ...value, angle })}
          />
        </div>
        <button
          type="button"
          aria-label={`Add ${label.toLowerCase()} stop`}
          title="Add stop"
          disabled={value.stops.length >= MAX_GRADIENT_STOPS}
          className={buttonClass}
          onClick={addStop}
        >
          +
        </button>
      </div>
      <div
        ref={track}
        role="group"
        aria-label={`${label} stops`}
        className="relative mx-1 mb-1 h-6"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-1 h-4 rounded-[4px]"
          style={{ backgroundImage: gradientCSS({ ...value, angle: 90 }) }}
        />
        {value.stops.map((item, index) => (
          <button
            key={index}
            type="button"
            aria-label={`${label} stop ${index + 1}`}
            aria-pressed={active === index}
            title={`Stop ${index + 1}: ${item.position}%`}
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-(--lab-panel) shadow-[0_0_0_1px_var(--lab-shadow)] aria-pressed:border-(--lab-text)"
            style={{ left: `${item.position}%`, backgroundColor: item.color }}
            onClick={() => setSelected(index)}
            onPointerDown={(event) => {
              if (event.button !== 0) return;

              setSelected(index);
              drag.current = { index, x: event.clientX, position: item.position };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const start = drag.current;

              if (
                !start ||
                !track.current ||
                !event.currentTarget.hasPointerCapture(event.pointerId)
              )
                return;

              const range = limits(start.index);

              const position = Math.round(
                start.position +
                  ((event.clientX - start.x) / track.current.getBoundingClientRect().width) * 100,
              );

              updateStop(start.index, { position: clamp(position, range.min, range.max) });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

              event.preventDefault();
              setSelected(index);
              const range = limits(index);

              const position =
                event.key === "Home"
                  ? range.min
                  : event.key === "End"
                    ? range.max
                    : item.position +
                      (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 10 : 1);

              updateStop(index, { position: clamp(position, range.min, range.max) });
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_20px] items-center gap-1">
        <ColorField
          label={`${label} stop color`}
          value={stop.color}
          onChange={(color) => updateStop(active, { color })}
        />
        <NumberField
          key={active}
          label={`${label} stop position`}
          short="%"
          value={stop.position}
          min={limits(active).min}
          max={limits(active).max}
          step={0.1}
          onChange={(position) => updateStop(active, { position })}
        />
        <button
          type="button"
          aria-label={`Remove ${label.toLowerCase()} stop`}
          title="Remove stop"
          disabled={value.stops.length <= 2}
          className={buttonClass}
          onClick={() => {
            onChange({ ...value, stops: value.stops.filter((_, index) => index !== active) });
            setSelected(Math.max(0, active - 1));
          }}
        >
          −
        </button>
      </div>
    </>
  );
}
