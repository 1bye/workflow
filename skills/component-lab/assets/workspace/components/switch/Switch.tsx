import type { CSSProperties } from "react";
import type { SwitchProps } from "./switch.schema";

export default function Switch({
  label,
  description,
  checked,
  disabled,
  size,
  radius,
  accent,
  easing,
}: SwitchProps) {
  return (
    <label
      className="flex min-w-0 cursor-pointer items-center gap-3 py-4 has-disabled:cursor-default"
      style={{ "--switch-accent": accent, "--switch-travel": `${size * 0.85}px` } as CSSProperties}
    >
      <input
        key={String(checked)}
        type="checkbox"
        role="switch"
        aria-label={label}
        defaultChecked={checked}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        className="relative block shrink-0 bg-(--lab-border) transition-colors peer-checked:bg-(--switch-accent) peer-checked:[&>span]:translate-x-(--switch-travel) peer-disabled:opacity-35"
        style={{ width: size * 1.85, height: size, borderRadius: radius }}
      >
        <span
          className="absolute top-[3px] left-[3px] block bg-white shadow-sm transition-transform duration-300 motion-reduce:transition-none"
          style={{
            width: size - 6,
            height: size - 6,
            borderRadius: Math.max(0, radius - 3),
            transitionTimingFunction: `cubic-bezier(${easing.join(",")})`,
          }}
        />
      </span>
      <span className="min-w-0 peer-disabled:opacity-40">
        <span className="block text-[13px] font-medium text-(--lab-text) wrap-anywhere">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-[10px] leading-relaxed text-(--lab-faint) wrap-anywhere">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
