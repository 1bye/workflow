# Deriving tokens

Tokens have two layers. **Primitives** are raw values (`blue.500 = #3B6CF6`).
**Semantic tokens** name a role and point to a primitive
(`color.action.primary → {color.blue.500}`). The teardown always has both;
parts and the rebuild contract use only semantic names.

## When the source has tokens

Use them. Read the theme, CSS variables, Tailwind config, or design-token
files and keep the source's names. Add semantic aliases only for roles the
source leaves unnamed, and mark those as `inferred`.

## When it does not

1. **Collect** every distinct value per category: colors, spacing (padding,
   gap, margin, offsets), radii, font sizes, weights and line heights,
   shadows, durations, easings, z-layers.
2. **Snap to a scale.** Find the base unit the values share (usually 4px or
   8px) and express each value as a step. Keep values that fit; list the ones
   that do not under "breaks scale". Do not round them silently.
3. **Assign roles by use:**
   - the most frequent action color → `color.action.primary`; the next →
     `color.action.secondary`
   - page background → `color.surface.base`; cards and panels →
     `color.surface.raised`; overlays → `color.surface.overlay`
   - body text → `color.text.default`; low-contrast text → `color.text.muted`
   - dividers and outlines → `color.border.default`
   - destructive, warning, success, info → `color.status.*`
   - padding inside a container → `space.inset.*`; gaps between siblings →
     `space.stack.*` (vertical) and `space.inline.*` (horizontal)
4. **Name sizes** `xs sm md lg xl`, in order, per category.

## Categories

| Category | Semantic prefix | Notes |
| --- | --- | --- |
| Color | `color.action`, `color.surface`, `color.text`, `color.border`, `color.status` | Include hover, active, and disabled variants as `color.action.primary.hover` |
| Spacing | `space.inset`, `space.stack`, `space.inline` | |
| Radius | `radius` | |
| Typography | `font.family`, `font.size`, `font.weight`, `font.lineHeight` | Or composite `typography.body`, `typography.label` |
| Elevation | `shadow` | Pair each with its surface |
| Motion | `motion.duration`, `motion.ease` | Easing as cubic-bezier |
| Layer | `layer` | z-index roles: base, popover, modal, toast |
| Size | `size` | Icons, hit targets, control heights |

## tokens.json

Use the W3C Design Tokens (DTCG) format. Put evidence in `$extensions` and the
use in `$description`.

```json
{
  "color": {
    "blue": {
      "500": {
        "$type": "color",
        "$value": "#3B6CF6",
        "$extensions": { "teardown": { "evidence": "measured", "src": "src/theme.ts:8" } }
      }
    },
    "action": {
      "primary": {
        "$type": "color",
        "$value": "{color.blue.500}",
        "$description": "Primary buttons, selected marker",
        "$extensions": { "teardown": { "evidence": "inferred" } }
      }
    }
  },
  "motion": {
    "duration": {
      "fast": { "$type": "duration", "$value": "150ms" }
    },
    "ease": {
      "out": { "$type": "cubicBezier", "$value": [0.2, 0, 0, 1] }
    }
  }
}
```

Colors from video or screenshots are `inferred`: compression shifts them.
Prefer a value read from code whenever one exists.
