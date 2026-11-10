# Remake

Replacing a widely used component (a shadcn default, a legacy wrapper) is a
migration, not just a rewrite.

## Audit

Before designing, read:
- The current component source and any library it wraps.
- Every call site. Count them, group by usage pattern, and note which props,
  variants, and `className` overrides are actually used.
- Local wrappers or one-off forks that exist because the original fell short;
  they are requirements in disguise.

Ask the user:
- What exactly do they dislike: the look, the API, the behavior, or that it
  looks like every other shadcn app? Each leads to a different remake.
- Must the new API stay compatible?

Often forgotten:
- Behaviors consumers depend on without knowing it (ref target, `data-state`
  attributes used in CSS selectors, forwarded props).
- `className` overrides at call sites that will conflict with new styles.

Done when: the checklist lists the dislikes, the used API surface, and the
implicit behaviors to keep or deliberately drop.

## Migration

Choose one and record why:
- **Drop-in**: same file path and API; only internals and styles change.
  Lowest risk, but keeps any API problems.
- **New API with codemod or scripted edits**: when the API itself is the problem.
- **Staged**: new component lives beside the old one; migrate feature by
  feature, then delete the old one.

Done when: the strategy is chosen and the list of call sites to change exists.

## Rollout

- Migrate call sites and remove now-obsolete `className` overrides.
- Visually check each distinct usage pattern, not only the playground.
- Delete the old component and dead wrappers once nothing imports them.

Done when: no imports of the old component remain and each usage pattern was viewed.
