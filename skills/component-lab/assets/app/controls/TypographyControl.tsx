import type { TypographyControl } from "../../schema/compound";
import { typographyBounds } from "../../schema/compound";
import { Heading, NumberField, type EditorProps } from "./shared";

const fields = [
  { key: "fontSize", name: "size", short: "Size", step: 1 },
  { key: "fontWeight", name: "weight", short: "Weight", step: 1 },
  { key: "lineHeight", name: "line height", short: "Line", step: 0.05 },
  { key: "letterSpacing", name: "letter spacing", short: "Track", step: 0.1 },
] as const;

const fontLabels: Record<string, string> = {
  "system-ui": "System UI",
  serif: "Serif",
  monospace: "Monospace",
};

export default function TypographyControlEditor({
  label,
  control,
  value,
  onChange,
}: EditorProps<TypographyControl>) {
  return (
    <>
      <Heading label={label} />
      <label className="mb-1 flex h-6 min-w-0 items-center gap-2 rounded-[4px] bg-(--lab-surface) px-1.5">
        <span aria-hidden="true" className="shrink-0 text-[9px] text-(--lab-faint)">
          Font
        </span>
        <select
          aria-label={`${label} font family`}
          value={value.fontFamily}
          className="h-6 min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-right text-[10px] text-(--lab-text)"
          onChange={(event) => onChange({ ...value, fontFamily: event.target.value })}
        >
          {control.fonts.map((font) => (
            <option key={font} value={font}>
              {fontLabels[font] ?? font}
            </option>
          ))}
        </select>
      </label>
      <div data-typography-values className="grid grid-cols-2 gap-1">
        {fields.map(({ key, name, short, step }) => (
          <NumberField
            key={key}
            label={`${label} ${name}`}
            short={short}
            value={value[key]}
            {...typographyBounds[key]}
            step={step}
            onChange={(n) => onChange({ ...value, [key]: n })}
          />
        ))}
      </div>
    </>
  );
}
