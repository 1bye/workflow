import type { CompoundControl } from "../schema/compound";
import {
  isEasing,
  isInterval,
  isSpacing,
  isVector2,
  isGradient,
  isShadow,
  isCorners,
  isTypography,
  type Value,
} from "../schema/values";
import Vector2Editor from "./controls/Vector2Control";
import IntervalEditor from "./controls/IntervalControl";
import SpacingEditor from "./controls/SpacingControl";
import EasingEditor from "./controls/EasingControl";
import GradientEditor from "./controls/GradientControl";
import ShadowEditor from "./controls/ShadowControl";
import CornersEditor from "./controls/CornersControl";
import TypographyEditor from "./controls/TypographyControl";

export default function CompoundControlEditor({
  control,
  label,
  value,
  onChange,
}: {
  control: CompoundControl;
  label: string;
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <fieldset
      aria-label={label}
      data-control={control.type}
      className="min-w-0 rounded-[6px] border-0 bg-(--lab-control) p-2 text-[11px] text-(--lab-muted)"
    >
      {control.type === "vector2" ? (
        <Vector2Editor
          control={control}
          label={label}
          value={isVector2(value) ? value : control.default}
          onChange={onChange}
        />
      ) : control.type === "interval" ? (
        <IntervalEditor
          control={control}
          label={label}
          value={isInterval(value) ? value : control.default}
          onChange={onChange}
        />
      ) : control.type === "spacing" ? (
        <SpacingEditor
          control={control}
          label={label}
          value={isSpacing(value) ? value : control.default}
          onChange={onChange}
        />
      ) : control.type === "gradient" ? (
        <GradientEditor
          control={control}
          label={label}
          value={isGradient(value) ? value : control.default}
          onChange={onChange}
        />
      ) : control.type === "shadow" ? (
        <ShadowEditor
          control={control}
          label={label}
          value={isShadow(value) ? value : control.default}
          onChange={onChange}
        />
      ) : control.type === "corners" ? (
        <CornersEditor
          control={control}
          label={label}
          value={isCorners(value) ? value : control.default}
          onChange={onChange}
        />
      ) : control.type === "typography" ? (
        <TypographyEditor
          control={control}
          label={label}
          value={isTypography(value) ? value : control.default}
          onChange={onChange}
        />
      ) : (
        <EasingEditor
          control={control}
          label={label}
          value={isEasing(value) ? value : control.default}
          onChange={onChange}
        />
      )}
    </fieldset>
  );
}
