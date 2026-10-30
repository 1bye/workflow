import type { ControlsProps } from "./controls.schema";

export default function ControlsDemo({
  fontSize,
  color,
  text,
  showIcon,
  appearance,
  weight,
  position,
  width,
  padding,
  easing,
}: ControlsProps) {
  return (
    <div className="flex min-h-[180px] w-full min-w-0 flex-col items-center justify-center gap-5 px-3 py-6">
      <div
        className="max-w-full"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-solid leading-snug shadow-sm transition-transform duration-700 hover:-translate-y-1.5 motion-reduce:transition-none"
          style={{
            fontSize,
            minWidth: `min(${width[0]}px, 100%)`,
            maxWidth: `min(${width[1]}px, 100%)`,
            padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
            transitionTimingFunction: `cubic-bezier(${easing.join(",")})`,
            fontWeight: { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 }[weight],
            color: appearance === "filled" ? "#ffffff" : color,
            backgroundColor:
              appearance === "filled"
                ? color
                : appearance === "soft"
                  ? `color-mix(in srgb, ${color} 14%, transparent)`
                  : "transparent",
            borderColor: appearance === "outline" ? color : "transparent",
          }}
        >
          {showIcon ? <span aria-hidden="true">✦</span> : null}
          <span className="wrap-anywhere">{text || "Button"}</span>
        </button>
      </div>
      <p className="text-center font-mono text-[9px] text-(--lab-faint)">
        {width[0]}–{width[1]}px width · hover for easing
      </p>
    </div>
  );
}
