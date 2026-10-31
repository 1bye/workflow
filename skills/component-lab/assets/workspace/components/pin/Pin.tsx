import type { CSSProperties } from "react";
import type { PinProps } from "./pin.schema";

export default function Pin({
  color,
  size,
  radius,
  border,
  shadow,
  label,
  showLabel,
  variant: state,
}: PinProps) {
  const selected = state === "selected";
  const loading = state === "loading";
  const hover = state === "hover";
  const disabled = state === "disabled";

  return (
    <div
      data-component="pin"
      className={`isolate flex flex-col items-center gap-4 font-sans ${disabled ? "opacity-[.38] grayscale-[.45]" : ""}`}
      style={{ "--pin-color": color, "--pin-size": `${size}px` } as CSSProperties}
    >
      <button
        type="button"
        data-part="button"
        className="group relative grid cursor-pointer place-items-center border-0 bg-transparent p-0 after:absolute after:-bottom-[9px] after:h-[3px] after:w-[7px] after:rounded-[50%] after:bg-[color-mix(in_srgb,var(--pin-color)_35%,transparent)] focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-(--pin-color) disabled:cursor-default"
        style={{ width: size + 24, height: size + 24 }}
        disabled={disabled || loading}
        aria-label={`${label || "Location"} · ${state}`}
        aria-pressed={selected ? true : undefined}
        aria-busy={loading || undefined}
      >
        <span
          aria-hidden="true"
          data-part="halo"
          className={`absolute -inset-[7px] rounded-full ${selected ? "border border-[color-mix(in_srgb,var(--pin-color)_25%,transparent)] bg-[color-mix(in_srgb,var(--pin-color)_11%,transparent)]" : ""}`}
        />
        <span
          aria-hidden="true"
          data-part="shape"
          className={`absolute rotate-45 border-solid border-white transition-[translate,box-shadow] duration-180 motion-reduce:transition-none ${hover ? "-translate-y-1.5" : "group-enabled:group-hover:-translate-y-1.5"}`}
          style={{
            width: size,
            height: size,
            background: color,
            borderWidth: border,
            borderRadius: `${radius}px ${radius}px 7px ${radius}px`,
            boxShadow: `4px 7px 15px rgb(55 38 30 / ${shadow / 100})`,
          }}
        />
        {loading ? (
          <span
            aria-hidden="true"
            data-part="spinner"
            className="relative size-[17px] animate-spin rounded-full border-2 border-white/40 border-t-white [animation-duration:900ms] motion-reduce:animate-none motion-reduce:border-dotted"
          />
        ) : (
          <span
            aria-hidden="true"
            data-part="symbol"
            className={`relative leading-none text-white ${hover ? "-translate-y-1.5" : "group-enabled:group-hover:-translate-y-1.5"}`}
            style={{ fontSize: size * 0.52 }}
          >
            ✦
          </span>
        )}
      </button>
      {showLabel ? (
        <span
          data-part="label"
          className="max-w-[190px] rounded-[7px] bg-white px-3 py-[7px] text-center text-[11px] font-[550] wrap-anywhere shadow-[0_2px_6px_#3531260c,0_0_0_1px_#35312609]"
          style={{
            background: selected ? color : undefined,
            color: selected ? "white" : hover ? color : "#35342f",
          }}
        >
          {label || "Location"}
        </span>
      ) : null}
    </div>
  );
}
