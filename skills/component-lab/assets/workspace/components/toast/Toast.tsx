import { useState } from "react";
import { cornersCSS, shadowCSS } from "@local";
import type { ToastProps } from "./toast.schema";

const tones = {
  success: { color: "#78a68b", path: "m5 9 2.5 2.5L13 6" },
  info: { color: "#8097bd", path: "M9 8v5M9 5v.1" },
  warning: { color: "#c29a57", path: "M9 5v5M9 13v.1" },
  error: { color: "#ce877b", path: "m6 6 6 6M12 6l-6 6" },
};

export default function Toast({
  title,
  message,
  tone,
  actionLabel,
  dismissible,
  corners,
  padding,
  shadow,
}: ToastProps) {
  const [dismissed, setDismissed] = useState(false);
  const [acted, setActed] = useState(false);
  const { color, path } = tones[tone];

  if (dismissed)
    return (
      <button
        type="button"
        onClick={() => {
          setDismissed(false);
          setActed(false);
        }}
        className="w-full max-w-[340px] rounded-xl border border-dashed border-(--lab-border) px-4 py-6 text-[11px] text-(--lab-faint) hover:bg-(--lab-control)"
      >
        Restore notification
      </button>
    );

  return (
    <div
      role="status"
      className="w-full min-w-0 max-w-[340px] border border-(--lab-border) bg-(--lab-panel)"
      style={{
        borderRadius: cornersCSS(corners),
        boxShadow: shadowCSS(shadow),
        padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full"
          style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 18 18"
            className="size-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={path} />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-relaxed font-medium text-(--lab-text) wrap-anywhere">
            {title}
          </p>
          {message ? (
            <p className="mt-1 text-[10px] leading-relaxed text-(--lab-faint) wrap-anywhere">
              {message}
            </p>
          ) : null}
          {actionLabel ? (
            <button
              type="button"
              onClick={() => setActed(!acted)}
              className="mt-3 rounded-md border border-(--lab-border) px-2.5 py-1.5 text-[10px] font-medium text-(--lab-muted) hover:bg-(--lab-control)"
            >
              {acted ? "Done ✓" : actionLabel}
            </button>
          ) : null}
        </div>
        {dismissible ? (
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setDismissed(true)}
            className="grid size-5 shrink-0 place-items-center rounded text-[16px] leading-none text-(--lab-faint) hover:bg-(--lab-control)"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
