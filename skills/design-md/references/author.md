# Author mode

Create a new system. The user decides the look; your job is to ask the
questions that pin it down and then make it consistent.

## Ask (only what is not already known)

1. Product, audience, platform (web, iOS, Android, desktop), and density
   (calm consumer vs dense pro tool).
2. Three words for the feel, and one product whose feel is close (for
   direction only; never copy its values).
3. Brand constraints: existing logo colors, required fonts, licensing.
4. Color stance: neutral base with one accent, multi-accent, or expressive.
5. Light, dark, or both.
6. Shape stance: sharp, soft, pill-heavy.
7. Motion stance: none, subtle feedback, or expressive.
8. Which screens come first; they decide the first components.

## Then build, in this order

1. **Color**: neutrals ladder (background, surface, hairline, muted, ink)
   first, then accent, then status colors (success, warning, danger, info) only
   as needed. Check text contrast for every text-on-surface pair before
   writing it down.
2. **Type**: pick families, then a scale from the smallest readable label to
   the largest display use, with line heights and letter spacing.
3. **Space and shape**: a spacing scale and how it maps to gutters, padding,
   and gaps; radius per element class.
4. **Motion**: durations and easings, plus reduced-motion behavior.
5. **Components**: only those the first screens need. Add the rest when they
   are built (via `component-craft`).
6. **Rules**: write Do's and Don'ts that protect the feel the user described.

Present the foundations to the user before writing COMPONENTS.md; foundation
changes ripple through every component.
