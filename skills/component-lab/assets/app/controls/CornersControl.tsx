import { useState } from "react";
import type { CornersControl } from "../../schema/compound";
import { LinkButton, NumberField, type EditorProps } from "./shared";

const corners = [
  { key: "topLeft", name: "top left", short: "TL" },
  { key: "topRight", name: "top right", short: "TR" },
  { key: "bottomLeft", name: "bottom left", short: "BL" },
  { key: "bottomRight", name: "bottom right", short: "BR" },
] as const;

export default function CornersControlEditor({
  label,
  control,
  value,
  onChange,
}: EditorProps<CornersControl>) {
  const [linked, setLinked] = useState(() => new Set(Object.values(value)).size === 1);

  return (
    <div
      data-corners-control
      className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-2"
    >
      <div data-corners-heading className="min-w-0">
        <span className="block truncate" title={label}>
          {label}
        </span>
        <div
          data-corners-actions
          className="mt-1 flex items-center gap-1 text-[9px] text-(--lab-faint)"
        >
          {control.unit}
          <LinkButton
            label={`${linked ? "Unlink" : "Link"} ${label.toLowerCase()}`}
            linked={linked}
            onClick={() => {
              setLinked(!linked);

              if (!linked)
                onChange({
                  topLeft: value.topLeft,
                  topRight: value.topLeft,
                  bottomLeft: value.topLeft,
                  bottomRight: value.topLeft,
                });
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {corners.map(({ key, name, short }) => (
          <NumberField
            key={key}
            label={`${label} ${name}`}
            short={short}
            value={value[key]}
            min={control.min}
            max={control.max}
            step={control.step}
            onChange={(n) =>
              onChange(
                linked
                  ? { topLeft: n, topRight: n, bottomLeft: n, bottomRight: n }
                  : { ...value, [key]: n },
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
