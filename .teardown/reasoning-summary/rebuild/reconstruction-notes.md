# Reconstruction notes

- Used a 0.5 CSS-pixel-per-native-raster-pixel scale: the estimated 1246 × 708 card becomes approximately 623 × 354 CSS px.
- Embedded the semantic aliases from `tokens.json` as CSS custom properties; no external fonts, assets, frameworks, or network resources are used.
- Kept the pictured activity order and gray remainder (Search → Read → Code → Write → remainder), including the two-column legend and exact visible copy.
- Provider marks are restrained inline SVG approximations because the source marks and font are unknown. The system sans fallback is intentional.
- `Details` is a semantic button that dispatches `reasoning-summary:details` with run metadata; it does not invent an unobserved destination or expanded screen.
- The responsive rules reduce inset/type sizes below 520 px and 380 px so the card remains usable without horizontal overflow.
- Desktop spacing now targets the README anatomy at half scale: approximately 165 px run-summary band, 124 px model-attribution band, and 65 px footer. Activity labels remain muted while their durations and model durations use the default dark text role.

Validation performed: checked the HTML structure and content with a local parser/grep pass. Parent browser QA verified a 623 × 355.6 CSS px card at desktop width, no horizontal overflow or model-row collisions at 375 px and 320 px viewports, and keyboard focus/Enter activation of Details. A standalone Node check verified the Details event name and payload. The browser viewport override was reset afterward.

Blind reconstruction boundary: the subagent started with fresh context and a separate brief directory containing only README.md and tokens.json. It reported no source-image access. Parent revision feedback referred only to written spec geometry and token roles. Input restrictions were instructions, not a separate filesystem sandbox.
