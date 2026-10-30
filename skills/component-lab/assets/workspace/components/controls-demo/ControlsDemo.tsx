import type { ControlsProps } from "./controls.schema";

export default function ControlsDemo({
  fontSize,
  color,
  text,
  showIcon,
  appearance,
  weight,
}: ControlsProps) {
  return (
    <div className="flex min-h-[160px] max-w-full items-center justify-center px-3 py-5">
      <button
        type="button"
        className="inline-flex max-w-full items-center justify-center gap-2.5 rounded-xl border border-solid px-5 py-3.5 leading-snug shadow-sm"
        style={{
          fontSize,
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
  );
}
