import { useId, type CSSProperties } from "react";
import type { SegmentedProps } from "./segmented.schema";

const options = [
  { name: "Board", path: "M2 2h5v12H2zM10 2h4v7h-4z" },
  { name: "List", path: "M5 3h9M5 8h9M5 13h9M1 3h1M1 8h1M1 13h1" },
  { name: "Calendar", path: "M3 3h10v11H3zM3 6h10M5 1v4M11 1v4M6 9h1M9 9h1" },
];

export default function Segmented({
  label,
  selected,
  appearance,
  height,
  radius,
  showIcons,
  accent,
}: SegmentedProps) {
  const name = useId();

  const active = {
    soft: "peer-checked:bg-(--lab-active) peer-checked:text-(--seg-accent) peer-checked:shadow-sm",
    solid: "peer-checked:bg-(--seg-accent) peer-checked:text-white peer-checked:shadow-sm",
    underline:
      "peer-checked:text-(--seg-accent) peer-checked:shadow-[inset_0_-2px_0_var(--seg-accent)]",
  }[appearance];

  return (
    <fieldset
      className="w-full min-w-0 max-w-[340px] border-0 py-4"
      aria-label={label}
      style={{ "--seg-accent": accent } as CSSProperties}
    >
      <legend className="mb-2 text-[10px] font-medium text-(--lab-faint)">{label}</legend>
      <div
        key={selected}
        className="flex min-w-0 gap-1 p-1"
        style={{
          borderRadius: radius + 4,
          background: appearance === "underline" ? "transparent" : "var(--lab-control)",
        }}
      >
        {options.map((option) => (
          <label key={option.name} className="min-w-0 flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.name}
              aria-label={option.name}
              defaultChecked={selected === option.name}
              className="peer sr-only"
            />
            <span
              className={`flex min-w-0 items-center justify-center gap-1.5 px-1 text-[10px] font-medium text-(--lab-faint) transition-colors ${active}`}
              style={{ height, borderRadius: appearance === "underline" ? 0 : radius }}
            >
              {showIcons ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-3 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={option.path} />
                </svg>
              ) : null}
              <span className="truncate">{option.name}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
