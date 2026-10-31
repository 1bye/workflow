import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import type { EasingControl } from "../../schema/compound";
import type { Easing } from "../../schema/values";
import { sameValue } from "../../schema/values";
import { Heading, NumberField, clamp, point, type EditorProps } from "./shared";

const presets: { name: string; value: Easing }[] = [
  { name: "Linear", value: [0, 0, 1, 1] },
  { name: "Ease", value: [0.25, 0.1, 0.25, 1] },
  { name: "Ease in", value: [0.42, 0, 1, 1] },
  { name: "Ease out", value: [0, 0, 0.58, 1] },
  { name: "Ease in out", value: [0.42, 0, 0.58, 1] },
];

export default function EasingControlEditor({
  label,
  value,
  onChange,
}: EditorProps<EasingControl>) {
  const pad = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState(100);

  useLayoutEffect(() => {
    const element = pad.current;

    if (!element) return;

    const measure = () => {
      const width = element.getBoundingClientRect().width;

      if (width > 16) setSize(width);
    };

    measure();
    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Fit once on open so editing or releasing a handle never moves the axes.
  const [{ min, max }] = useState(() => ({
    min: Math.min(-0.25, Math.floor(Math.min(value[1], value[3]) * 4) / 4 - 0.25),
    max: Math.max(1.25, Math.ceil(Math.max(value[1], value[3]) * 4) / 4 + 0.25),
  }));

  const [drag, setDrag] = useState<0 | 2 | null>(null);
  // Match SVG units to CSS pixels so resizing the pad keeps handles, strokes, and grid spacing crisp.
  const span = size - 16;
  const x = (n: number) => 8 + n * span;
  const y = (n: number) => 8 + ((max - n) / (max - min)) * span;

  const update = (event: PointerEvent<SVGSVGElement>, index: 0 | 2) => {
    const p = point(event);
    const next: Easing = [...value];

    next[index] = Number(clamp((p.x * size - 8) / span, 0, 1).toFixed(3));
    next[index + 1] = Number(
      clamp(max - ((p.y * size - 8) / span) * (max - min), min, max).toFixed(3),
    );
    onChange(next);
  };

  return (
    <>
      <Heading label={label}>
        <select
          aria-label={`${label} preset`}
          value={presets.find((preset) => sameValue(preset.value, value))?.name ?? "custom"}
          className="h-5 min-w-0 cursor-pointer border-0 bg-transparent text-[10px] text-(--lab-text)"
          onChange={(event) => {
            const preset = presets.find(({ name }) => name === event.target.value);

            if (preset) onChange([...preset.value]);
          }}
        >
          <option value="custom" disabled>
            Custom
          </option>
          {presets.map(({ name }) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </Heading>
      <svg
        ref={pad}
        aria-hidden="true"
        viewBox={`0 0 ${size} ${size}`}
        className="aspect-square w-full touch-none cursor-crosshair rounded-[4px] bg-(--lab-surface)"
        onPointerDown={(event) => {
          if (event.button !== 0) return;

          const p = point(event);

          const distance = (index: 0 | 2) =>
            Math.hypot(p.x * size - x(value[index]), p.y * size - y(value[index + 1]!));

          const index = distance(0) <= distance(2) ? 0 : 2;

          event.currentTarget.setPointerCapture(event.pointerId);
          setDrag(index);
          update(event, index);
        }}
        onPointerMove={(event) => {
          if (drag !== null && event.currentTarget.hasPointerCapture(event.pointerId))
            update(event, drag);
        }}
        onPointerUp={() => setDrag(null)}
        onLostPointerCapture={() => setDrag(null)}
      >
        <path
          d={`M8 ${y(0)}H${size - 8}M8 ${y(1)}H${size - 8}M${x(0.5)} 8V${size - 8}`}
          stroke="var(--lab-border)"
          strokeDasharray="2 3"
          fill="none"
        />
        <path
          d={`M8 ${y(0)}L${x(value[0])} ${y(value[1])}M${size - 8} ${y(1)}L${x(value[2])} ${y(value[3])}`}
          stroke="var(--lab-faint)"
          fill="none"
        />
        <path
          d={`M8 ${y(0)}C${x(value[0])} ${y(value[1])} ${x(value[2])} ${y(value[3])} ${size - 8} ${y(1)}`}
          stroke="var(--lab-text)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx={x(value[0])}
          cy={y(value[1])}
          r="3"
          fill="var(--lab-surface)"
          stroke="var(--lab-text)"
          strokeWidth="1.5"
        />
        <circle
          cx={x(value[2])}
          cy={y(value[3])}
          r="3"
          fill="var(--lab-surface)"
          stroke="var(--lab-text)"
          strokeWidth="1.5"
        />
      </svg>
      <div data-easing-values className="mt-1 grid grid-cols-2 gap-1">
        {([0, 1, 2, 3] as const).map((index) => (
          <NumberField
            key={index}
            label={`${label} ${["x1", "y1", "x2", "y2"][index]}`}
            short={["x₁", "y₁", "x₂", "y₂"][index]!}
            value={value[index]}
            {...(index === 0 || index === 2 ? { min: 0, max: 1 } : {})}
            step={0.01}
            onChange={(n) => {
              const next: Easing = [...value];

              next[index] = n;
              onChange(next);
            }}
          />
        ))}
      </div>
    </>
  );
}
