import type { AccordionProps } from "./accordion.schema";

export default function Accordion({
  title,
  body,
  open,
  appearance,
  showIcon,
  accent,
  radius,
  padding,
}: AccordionProps) {
  return (
    <details
      key={String(open)}
      open={open}
      className="group w-full min-w-0 max-w-[340px] overflow-hidden"
      style={{
        borderRadius: appearance === "line" ? 0 : radius,
        border: appearance === "card" ? "1px solid var(--lab-border)" : "none",
        borderBottom: appearance === "line" ? "1px solid var(--lab-border)" : undefined,
        background:
          appearance === "soft"
            ? `color-mix(in srgb, ${accent} 10%, var(--lab-surface))`
            : "transparent",
      }}
    >
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-medium text-(--lab-text) [&::-webkit-details-marker]:hidden"
        style={{
          padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
        }}
      >
        <span className="wrap-anywhere">{title}</span>
        {showIcon ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
        ) : null}
      </summary>
      <p
        className="text-[11px] leading-[1.8] text-(--lab-faint) wrap-anywhere"
        style={{ padding: `0 ${padding.right}px ${padding.bottom}px ${padding.left}px` }}
      >
        {body}
      </p>
    </details>
  );
}
