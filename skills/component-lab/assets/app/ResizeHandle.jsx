import { useEffect, useRef, useState } from "react";

export default function ResizeHandle({ orientation, value, bounds, onResize }) {
  const vertical = orientation === "vertical";
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    document.body.classList.add("resizing");

    return () => document.body.classList.remove("resizing");
  }, [dragging]);
  const finish = () => { drag.current = null; setDragging(false); };

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
      className={`relative z-2 touch-none bg-[#f6f6f2] outline-offset-[-2px] after:absolute after:inset-0 after:bg-[#aab99d] after:opacity-0 after:transition-opacity hover:after:opacity-65 focus-visible:after:opacity-65 ${dragging ? "after:opacity-65" : ""} ${vertical ? "cursor-col-resize border-x border-[#e4e5de]" : "cursor-row-resize border-y border-[#e4e5de]"}`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;

        drag.current = { start: vertical ? event.clientX : event.clientY, size: value };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();
        setDragging(true);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        if (drag.current) onResize(drag.current.size + (vertical ? event.clientX : event.clientY) - drag.current.start);
      }}
      onPointerUp={finish}
      onLostPointerCapture={finish}
      onKeyDown={(event) => {
        const keys = vertical ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];

        if (!keys.includes(event.key)) return;

        event.preventDefault();
        onResize(value + (event.key === keys[0] ? -1 : 1) * (event.shiftKey ? 30 : 10));
      }}
    ><span className={vertical ? "absolute top-1/2 left-px h-6 border-l-2 border-[#cbd0c1]" : "absolute top-px left-[calc(50%-12px)] w-6 border-t-2 border-[#cbd0c1]"} /></div>
  );
}
