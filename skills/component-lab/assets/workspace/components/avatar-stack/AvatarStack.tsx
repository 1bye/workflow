import { useState } from "react";
import type { AvatarProps } from "./avatars.schema";

const people = [
  { name: "Mina Chen", initials: "MC", role: "Product designer", color: "#7c79ba" },
  { name: "Alex Rivera", initials: "AR", role: "Creative developer", color: "#789b8a" },
  { name: "Noah Park", initials: "NP", role: "Design engineer", color: "#bc9279" },
  { name: "Iris Stone", initials: "IS", role: "Art director", color: "#8097b1" },
  { name: "Jules Martin", initials: "JM", role: "Motion designer", color: "#ae8ba1" },
  { name: "Luca Costa", initials: "LC", role: "Brand designer", color: "#a49e72" },
];

export default function AvatarStack({
  title,
  count,
  size,
  overlap,
  shape,
  showStatus,
  border,
  accent,
  image,
}: AvatarProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const visible = people.slice(0, count);
  const person = selected !== null && selected < count ? people[selected] : null;
  const radius = shape === "circle" ? size / 2 : shape === "soft" ? size * 0.28 : 6;

  return (
    <div className="flex w-full min-w-0 max-w-[320px] flex-col items-center py-4">
      <p className="mb-4 text-[11px] font-medium text-(--lab-muted) wrap-anywhere">{title}</p>
      <div className="flex max-w-full flex-wrap items-center justify-center gap-y-1 pl-1">
        {visible.map((item, index) => (
          <button
            key={item.name}
            type="button"
            aria-label={item.name}
            aria-pressed={selected === index}
            onClick={() => setSelected(selected === index ? null : index)}
            className="relative grid shrink-0 place-items-center text-white shadow-sm transition-transform duration-200 hover:-translate-y-1 aria-pressed:-translate-y-1 motion-reduce:transition-none"
            style={{
              width: size,
              height: size,
              marginLeft: index ? -Math.min(overlap, size - 12) : 0,
              border: `${border}px solid var(--lab-surface)`,
              borderRadius: radius,
              backgroundColor: index === 0 ? accent : item.color,
              zIndex: selected === index ? 10 : count - index,
              fontSize: size * 0.25,
            }}
          >
            {index === 0 && image ? (
              <img
                src={image}
                alt=""
                className="size-full object-cover"
                style={{ borderRadius: Math.max(0, radius - border) }}
              />
            ) : (
              <span className="font-medium tracking-tight">{item.initials}</span>
            )}
            {showStatus ? (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-(--lab-surface)"
                style={{ backgroundColor: index === 2 ? "#d1b27c" : "#83b29a" }}
              />
            ) : null}
          </button>
        ))}
      </div>
      {person ? (
        <div className="mt-4 w-full rounded-xl border border-(--lab-border) bg-(--lab-panel) px-3 py-2.5 text-center">
          <p className="text-[11px] font-medium text-(--lab-text)">{person.name}</p>
          <p className="mt-0.5 text-[9px] text-(--lab-faint)">{person.role}</p>
        </div>
      ) : (
        <p className="mt-3 text-[9px] text-(--lab-faint)">{count} people, one shared space.</p>
      )}
    </div>
  );
}
