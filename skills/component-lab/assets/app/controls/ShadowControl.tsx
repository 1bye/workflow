import { shadowBounds, type ShadowControl } from "../../schema/compound";
import { ColorField, Heading, NumberField, type EditorProps } from "./shared";

export default function ShadowControlEditor({
  label,
  value,
  onChange,
}: EditorProps<ShadowControl>) {
  return (
    <>
      <Heading label={label}>
        <button
          type="button"
          aria-label={`${label} inset`}
          aria-pressed={value.inset}
          className="h-5 rounded border-0 px-1.5 text-[9px] hover:bg-(--lab-surface) aria-pressed:bg-(--lab-active) aria-pressed:text-(--lab-text)"
          onClick={() => onChange({ ...value, inset: !value.inset })}
        >
          Inset
        </button>
      </Heading>
      <div className="grid grid-cols-2 gap-1">
        {(["x", "y", "blur", "spread"] as const).map((key) => (
          <NumberField
            key={key}
            label={`${label} ${key}`}
            short={{ x: "X", y: "Y", blur: "Blur", spread: "Spread" }[key]}
            value={value[key]}
            {...shadowBounds[key]}
            onChange={(n) => onChange({ ...value, [key]: n })}
          />
        ))}
        <ColorField
          label={`${label} color`}
          value={value.color}
          onChange={(color) => onChange({ ...value, color })}
        />
        <NumberField
          label={`${label} opacity`}
          short="%"
          value={Math.round(value.opacity * 100)}
          min={0}
          max={100}
          onChange={(opacity) => onChange({ ...value, opacity: opacity / 100 })}
        />
      </div>
    </>
  );
}
