import { useEffect, useRef, useState } from "react";

type Props = {
  orientation: "vertical" | "horizontal";
  value: number;
  bounds: { min: number; max: number };
  onResize: (value: number) => void;
};

export default function ResizeHandle({ orientation, value, bounds, onResize }: Props) {
  const vertical = orientation === "vertical";
  const drag = useRef<{ start: number; size: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    document.body.classList.add("resizing");

    return () => document.body.classList.remove("resizing");
  }, [dragging]);
  const finish = () => {
    drag.current = null;
    setDragging(false);
  };

  return (
    <div
      id={vertical ? "column-handle" : "row-handle"}
      role="separator"
      tabIndex={0}
      aria-label={vertical ? "Resize sidebar" : "Resize component list"}
      aria-controls={vertical ? "sidebar" : "component-list"}
      aria-orientation={orientation}
      aria-valuenow={value}
      aria-valuemin={bounds.min}
      aria-valuemax={bounds.max}
      className={`group relative z-2 touch-none border-(--lab-border) bg-(--lab-panel) ${vertical ? "cursor-col-resize border-r" : "cursor-row-resize border-t"}`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;

        drag.current = { start: vertical ? event.clientX : event.clientY, size: value };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();
        setDragging(true);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        if (drag.current)
          onResize(
            drag.current.size + (vertical ? event.clientX : event.clientY) - drag.current.start,
          );
      }}
      onPointerUp={finish}
      onLostPointerCapture={finish}
      onKeyDown={(event) => {
        const keys = vertical ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];

        if (!keys.includes(event.key)) return;

        event.preventDefault();
        onResize(value + (event.key === keys[0] ? -1 : 1) * (event.shiftKey ? 30 : 10));
      }}
    >
      <span
        className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--lab-focus) opacity-0 group-hover:opacity-60 ${vertical ? "h-6 w-0.5" : "h-0.5 w-6"}`}
      />
    </div>
  );
}
