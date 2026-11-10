# Checklist template

Copy into `.component-craft/<component>/checklist.md`. Status values:
`[ ]` todo, `[~]` in progress, `[x]` done, `[-]` not applicable (with reason),
`[>]` deferred (with reason). Keep notes short: decisions and why, not prose.

```markdown
# <Component> checklist

Mode: new | remake
Kind: <from component-kinds.md>
Owner decisions pending: <list, or "none">

## Frame
- [ ] Purpose and non-goals written (frame.md#purpose)
- [ ] Usage inventory: where it will render and who consumes it (frame.md#usage)
- [ ] Prior art checked: existing project components and patterns (frame.md#prior-art)

## Contract
- [ ] Anatomy: parts named, which are optional (api.md#anatomy)
- [ ] Props: names, types, defaults, required set (api.md#props)
- [ ] Variants and sizes justified, not speculative (api.md#variants)
- [ ] Control mode: controlled, uncontrolled, or both (api.md#control)
- [ ] Ref, rest props, className, and slot passthrough (api.md#passthrough)
- [ ] Composition shape: single, compound, or slot API (api.md#composition)

## Behavior
- [ ] State matrix listed and each state reachable (states.md)
- [ ] State combinations checked (states.md#combinations)
- [ ] Pointer and touch behavior (interaction.md#pointer)
- [ ] Keyboard map (interaction.md#keyboard)
- [ ] Focus management (interaction.md#focus)
- [ ] Semantics and accessible name (accessibility.md#semantics)
- [ ] Descriptions, errors, and announcements (accessibility.md#announce)
- [ ] Contrast, forced colors, and user preferences (accessibility.md#preferences)
- [ ] Content edge cases (content.md)
- [ ] Localization and direction (content.md#locale)

## Look
- [ ] Tokens only, no stray literal values (visual.md#tokens)
- [ ] Themes: light, dark, any brand themes (visual.md#themes)
- [ ] Sizing, density, and alignment with siblings (visual.md#sizing)
- [ ] Responsive and touch-target behavior (visual.md#responsive)
- [ ] Motion and reduced motion (visual.md#motion)

## Integration
- [ ] Form participation and validation (integration.md#forms)
- [ ] Works inside common containers (integration.md#composition)
- [ ] Layering: portals, z-index, overflow clipping (integration.md#layering)
- [ ] SSR and hydration (integration.md#ssr)
- [ ] Platform quirks for this kind (integration.md#platform)
- [ ] Performance at realistic scale (integration.md#performance)

## Prove
- [ ] Preview matrix shown to the user (verify.md#matrix)
- [ ] Tests for behavior, not markup (verify.md#tests)
- [ ] Usage docs and examples (verify.md#docs)

## Remake only
- [ ] Old component audited: API, behaviors, quirks consumers rely on (remake.md#audit)
- [ ] Migration plan: compatible API, codemod, or staged (remake.md#migration)
- [ ] All usages migrated and visually checked (remake.md#rollout)

## Kind-specific
- [ ] <added from component-kinds.md>

## Decisions log
- <date> <decision> — <why>
```
