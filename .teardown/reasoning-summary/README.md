# Reasoning summary card — Teardown

| Source | Evidence | Date |
| --- | --- | --- |
| [Image 1](source.png), native 1719 × 2048 raster | `inferred`: screenshot only; no matching implementation found in this project | 2026-10-28 |

**Scope — `inferred`.** One summary card, including activity timing, two model rows, and a source footer. “Reasoning summary card” and all token names are descriptive names introduced here. Surrounding application, expanded details, and model configuration are outside the visible boundary.

**User tasks — `inferred`.** F1: read total duration and step count. F2: understand activity and model contributions. F3: inspect the sources or execution details through **Details**.

**Evidence convention.** Every screenshot observation and derived estimate below is `inferred`, including items marked observed. `measured` is reserved for implementation or computed-style evidence; none is available. `unknown` means the screenshot cannot establish the behavior or value. Text such as model names is transcribed artwork, not a claim about available products. Recommendations are explicitly marked `inferred — proposed`.

## 1. Essence

`inferred` — A compact receipt for an AI run: elapsed time first, activity breakdown second, model participation third, and provenance last. Its soft surface, restrained typography, aligned numbers, and generous space create a calm, inspectable presentation.

`inferred` — The visual hierarchy makes the run easy to scan, but the timing graphic is hard to interpret: the listed activities sum to the headline duration while their colored segments leave a large gray remainder. A screenshot cannot establish whether that remainder represents capacity, progress, or something else.

## 2. Principles

- **P1. Put the outcome before its explanation.** Show total time and step count before activity or model detail. Flows: F1, F2. `inferred`
- **P2. Keep related evidence together.** Separate run totals, model attribution, and sources with quiet dividers inside one card. Flows: F1–F3. `inferred`
- **P3. Pair visual encodings with words and values.** Give each activity a colored key, a label, and a duration; retain readable model names beside logos. Flow: F2. `inferred`
- **P4. Align comparable values to support scanning.** Right-align durations and keep repeated rows consistent. Flow: F2. `inferred`
- **P5. Reveal deeper detail through a clear entry point.** Keep the summary readable and place **Details** beside provenance. Flow: F3; destination behavior `unknown`. `inferred`

## 3. Flows

`inferred` — These are task reconstructions, not tested interaction traces. Counts apply to the stated steps. KLM uses M = 1.2 s, P = 1.1 s, K = 0.2 s; it does not model reading or comprehension reliably. The artwork’s **8 steps** describes the run, not these user flows.

### F1. Read the run summary

1. Locate and read **Reasoned for 6.2s** and **8 steps**. `inferred`

| Version | Steps | Clicks | Keys | Mode switches | Hand swaps | KLM | Est. time |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Current, inferred | 1 | 0 | 0 | 0 | 0 | M | ~1.2 s preparation + unknown reading time |

**Friction — `inferred`.** No obvious detour in the visible summary. **No change proposed.**

### F2. Understand where the time went

1. Inspect the colored bar and map its colors to the four activity labels. `inferred`
2. Read the activity durations and reconcile them with **6.2s**. `inferred`
3. Read both model rows to compare **Planning 2.4s** and **Writing 3.8s**. `inferred`

| Version | Steps | Clicks | Keys | Mode switches | Hand swaps | KLM | Est. time |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Current, inferred | 3 | 0 | 0 | 0 | 0 | M M M | ~3.6 s preparation + unknown reading/reconciliation time |
| Proposed, inferred | 3 | 0 | 0 | 0 | 0 | M M M | ~3.6 s preparation + unknown reading time |

**Friction — `inferred`.** Bar order is Search → Read → Code → Write, while conventional row-wise legend reading gives Search → Code → Read → Write. The gray tail occupies roughly 36% of the track without a label. Colored widths are roughly 21%, 14%, 9%, 18% of the full track, whereas the listed times imply 33.9%, 22.6%, 14.5%, 29.0% of a 6.2 s total. The colored widths appear approximately proportional to durations, but their denominator is unexplained. Both activity and model durations sum to 6.2 s; whether these are separate views of the same elapsed interval, additive work, or overlapping execution is `unknown`.

**Proposal — `inferred — proposed`.** Define the bar’s denominator. If it is a breakdown of 6.2 s, normalize the four colored segments to fill the available width after gaps. If it is progress against a larger budget, label that budget and the remainder. Match the legend’s reading order to the bar. Clarify whether model times overlap. Applies P2–P4.

**Cost / risk — `inferred — proposed`.** Low to medium design/implementation cost, conditional on the timing data model. Normalizing without confirming that model could misrepresent concurrent work. Keep textual durations available. Estimated savings: 0 clicks; comprehension time saved `unknown` and requires testing.

### F3. Inspect details and sources

1. Locate **Details ›** in the source footer. `inferred`
2. Point and activate it. Actionability is `inferred`; the resulting surface, wait, and completion path are `unknown`.

| Version | Steps | Clicks | Keys | Mode switches | Hand swaps | KLM | Est. time |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Current entry only, inferred | 2 | 1 assumed | 0 | unknown | 0 assumed | M P K + R(?) | ~2.5 s to activate + unknown response time |

**Friction — `inferred`.** The entry is visible and adjacent to provenance. “Details” does not specify whether it opens the 24 sources, run steps, or both. **No change proposed** to the entry path without seeing its destination. Full-flow efficiency and keyboard access remain `unknown`.

## 4. Opportunities

`inferred — proposed` — Ranking reflects visible ambiguity and the likely frequency of scanning this summary, not usage data. No verified time savings are available.

| # | Change | Flow | Estimated savings | Cost / risk |
| --- | --- | --- | --- | --- |
| 1 | Explain the bar’s denominator; normalize only if it represents the stated total | F2 | 0 clicks; time unknown; removes one visible arithmetic ambiguity | Low–medium; incorrect treatment of overlapping timings |
| 2 | Match legend reading order to bar order | F2 | 0 clicks; time unknown; removes color-order remapping | Low; column scanning preference may differ |
| 3 | State the relationship between model timings and run elapsed time | F2 | 0 clicks; time unknown; avoids manual interpretation | Medium if instrumentation is needed; extra copy can crowd the card |

---

## 5. Anatomy

`inferred` — One component; no subpart has an independently evidenced flow or state machine that warrants a part file.

```text
Reasoning summary card
├── Run summary
│   ├── “Reasoned for 6.2s” / “8 steps”
│   ├── Activity bar: Search / Read / Code / Write / gray remainder
│   └── Activity legend: two columns, two rows
├── Model attribution
│   ├── GPT 6 Astra · Low    | Planning 2.4s
│   └── Opus 5.5 · High      | green dot · Writing 3.8s
└── Source footer
    ├── Three overlapping colored circles
    ├── “24 sources from @shedsgns”
    └── “Details ›”
```

**Coordinate convention — `inferred`.** Geometry and dimension tokens use native-image pixels, not CSS pixels. The displayed attachment was scaled to 1440 × 1715. Device pixel ratio, browser zoom, actual viewport, and original component size are `unknown`. Do not use these dimensions as production CSS without selecting and verifying a scale.

| Part | Role and layout | Approximate native-image geometry | Semantic tokens | Evidence |
| --- | --- | --- | --- | --- |
| Card | Single rounded container with three bands; no distinct shadow visible | x 236, y 671; width 1246, height 708; radius 50 | `color.surface.raised`, `color.border.default`, `radius.card` | inferred |
| Run summary | Header left/right; bar below; legend below bar | Top band ~329 high; horizontal inset ~48 | `space.inset.card`, `font.size.body` | inferred |
| Header | Muted label, dark duration; muted step count at right | Common baseline; right edge ~1433 | `color.text.default`, `color.text.muted` | inferred |
| Bar | Rounded horizontal segments with narrow surface-colored gaps | x ~285 to 1433; y ~790; height ~20; gap ~8 | `size.activityBar`, `space.inline.segment`, `radius.segment`, `color.activity.*`, `color.chart.remainder` | inferred |
| Legend | Left: Search 2.1s / Read 1.4s; right: Code 0.9s / Write 1.8s | Left column x ~285; right column x ~894; row pitch ~70 | `size.legendKey`, `space.inline.label`, `space.stack.legend`, `color.activity.*` | inferred |
| Model attribution | Two rows; provider mark, name, effort badge; right-aligned task and time | Band y ~1000–1248; row pitch ~96 | `size.providerIcon`, `space.stack.model`, `color.badge.*`, `radius.badge` | inferred |
| Writing indicator | Small green dot before “Writing” | Diameter ~16; no movement established | `size.statusDot`, `color.activity.read` | inferred; semantic relationship to Read unknown |
| Source footer | Circle cluster and provenance left; Details and chevron right | Band y ~1248–1379; height ~131 | `size.sourceAvatar`, `space.inline.avatarOverlap`, `color.text.*` | inferred |
| Dividers | Thin full-width rules | y ~1000 and ~1248; thickness ~2 | `size.divider`, `color.border.default` | inferred |

**Typography — `inferred`.** Neutral sans serif; main labels and values appear around 41 native px, badge labels around 31 px. Text looks regular to medium. Exact family, weights, line heights, letter spacing, font metrics, and numeric features are `unknown`. Badges **Low** and **High** share the same blue treatment; their exact meaning and editability are `unknown`.

## 6. States

✓ observed in the static image (`inferred` evidence) · ~ inferred behavior · — confirmed absent · ? unknown. No state is marked absent solely because it was not pictured.

| Part | Default | Hover | Focus-visible | Active/pressed | Disabled | Loading | Empty | Error | Success | Selected | Custom |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Card / totals | ✓ | ? | ? | ? | ? | ? | ? | ? | ? | ? | completion status ? |
| Activity bar / legend | ✓ | ? | ? | ? | ? | ? | ? | ? | ? | ? | gray remainder ✓; meaning ? |
| Model rows / badges | ✓ | ? | ? | ? | ? | ? | ? | ? | ? | ? | Low / High ✓ |
| Writing indicator | ✓ | ? | ? | ? | ? | ? | ? | ? | ? | ? | Writing label and green dot ✓ |
| Source footer | ✓ | ? | ? | ? | ? | ? | ? | ? | ? | ? | 24 sources ✓ |
| Details | ✓ | ? | ? | ? | ? | ? | ? | ? | ? | ? | actionable affordance ~; expanded state ? |

| State | Content / appearance | Trigger → end | Evidence |
| --- | --- | --- | --- |
| Pictured summary | “Reasoned for 6.2s”, “8 steps”; four activity values; two model rows; source count | unknown → unknown | inferred |
| Writing | Green dot beside “Writing 3.8s” | unknown → unknown; may represent activity or a historical label | inferred; loading/animation unknown |
| Loading / empty / error / success | Copy and presentation unknown | unknown | unknown |
| Details expanded | Surface type, contents, close/back affordance unknown | activation inferred → dismissal unknown | unknown |

## 7. Tokens

The full primitive and semantic sets are in [tokens.json](tokens.json). Every value is `inferred` from Image 1. Colors use representative raster samples; small color variation is visible around edges and within fills. Names are introduced for this teardown; they are not recovered product tokens.

| Semantic role | Approximate value | Use | Evidence |
| --- | --- | --- | --- |
| `color.surface.base` / `.raised` | #F2F2F2 / #F8F8F8 | Canvas / card | inferred |
| `color.text.default` / `.muted` | #262628 / #707077 | Names and durations / labels | inferred |
| `color.border.default` | #EAE9EE | Container edge and dividers | inferred |
| `color.activity.search` / `.read` | #BC5BFA / #73D0A3 | Bar, legend, source circles | inferred |
| `color.activity.code` / `.write` | #FF9C40 / #3B82F4 | Bar, legend, source circles where present | inferred |
| `color.chart.remainder` | #E4E3E8 | Unexplained gray track segment | inferred |
| `color.badge.surface` / `.text` | #DBEAFF / #3882FB | Both effort chips | inferred |
| `color.brand.opus` | #D77B56 | Orange provider symbol | inferred |
| `space.inset.card` | ~48 native px | Horizontal content padding | inferred |
| `space.inline.segment` / `.label` | ~8 / ~20 native px | Bar gaps / key-to-label spacing | inferred |
| `space.stack.legend` / `.model` | ~70 / ~96 native px | Baseline-to-baseline row pitch, not CSS gap | inferred |
| `radius.card` / `.badge` / `.segment` | ~50 / ~24 / ~8 native px | Rounded container / chips / segments | inferred |
| `font.size.body` / `.badge` | ~41 / ~31 native px | Main text / chip text | inferred |
| `size.providerIcon` / `.legendKey` / `.statusDot` | ~48 / ~25 / ~16 native px | Marks / activity keys / status dot | inferred |
| `size.sourceAvatar` / `space.inline.avatarOverlap` | ~48 / ~16 native px | Decorative source cluster | inferred |

**Scale — `inferred`.** No dependable original spacing grid can be recovered from this raster. A ~24 native px unit might explain 48 and 96, but smaller offsets and the ~70 row pitch do not establish a consistent scale. Do not silently snap them. The listed row pitches, 41/31 typography, and 50 radius remain explicit estimates. Exact font, shadow, z-order values, responsive breakpoints, and all motion tokens are `unknown` and omitted from the token file.

## 8. Motion

| Trigger | Part | Properties | Duration | Easing | Evidence |
| --- | --- | --- | --- | --- | --- |
| New or updated run | Totals / bar | Update, interpolation, or replacement unknown | unknown | unknown | unknown |
| Model writing | Green dot / status text | Static, pulse, or other behavior unknown | unknown | unknown | unknown |
| Activate Details | Details destination | Expansion, navigation, or overlay unknown | unknown | unknown | unknown |

`unknown` — Choreography, staggering, blocking waits, count-up behavior, and reduced-motion support cannot be inferred from one still. The visible 6.2 s, 2.4 s, and 3.8 s are content durations, not animation timings.

## 9. Access and input

| Concern | Evidence and implication |
| --- | --- |
| Keyboard map | `unknown`: no key bindings or activation behavior observed. `inferred — proposed`: if Details is a button, use Enter/Space; if navigation, use a link with Enter. |
| Focus order / return | `unknown`: whether Details is the only stop, and where focus goes on open/close. `inferred — proposed`: match semantic DOM order to the visual sections; return focus to the trigger when dismissing an overlay. |
| Hit targets | `inferred`: Details text plus chevron occupies roughly 180 × 48 native px; actual clickable bounds and CSS size `unknown`. Do not infer touch-target compliance from raster dimensions. |
| Text contrast | `inferred`: representative #262628 on #F8F8F8 gives ~14:1; #707077 on #F8F8F8 gives ~4.6:1; blue #3882FB on #DBEAFF gives ~3.0:1. These calculations use approximate colors, not computed styles; verify chip readability at intended size. |
| Color independence | `inferred`: legend labels and explicit times let users read values without distinguishing hues. Bar-to-label mapping still relies on color and position. |
| Screen reader | `unknown`: roles, accessible name for Details, grouping, and live announcements. `inferred — proposed`: expose activity/value and model/task/value pairs as structured text; hide redundant logos and decorative circles. |
| Live updates | `unknown`: no evidence that values update. `inferred — proposed`: if they do, avoid announcing every elapsed-time tick; announce meaningful state changes. |

## 10. Rebuild contract

### Faithful pictured state

- [ ] `inferred`: At the reference raster scale, reproduce the card’s approximate bounds, three horizontal bands, soft outline, round corners, and content alignment from Anatomy.
- [ ] `inferred`: Reproduce the exact visible copy: “Reasoned for 6.2s”, “8 steps”, Search 2.1s, Read 1.4s, Code 0.9s, Write 1.8s.
- [ ] `inferred`: Preserve bar order Search → Read → Code → Write → gray remainder and the pictured two-column legend layout for the faithful version.
- [ ] `inferred`: Preserve GPT 6 Astra / Low / Planning 2.4s and Opus 5.5 / High / green dot / Writing 3.8s, with values aligned to the right.
- [ ] `inferred`: Preserve the three overlapping circles, “24 sources from @shedsgns”, and “Details ›” in the footer.
- [ ] `inferred`: Use semantic aliases in tokens.json for recovered colors and dimensions; select an explicit raster-to-CSS scale and compare the resulting render to source.png.
- [ ] `unknown`: Obtain the provider marks and exact font from the owner before claiming asset or typography fidelity.
- [ ] `unknown`: Confirm Details behavior and every unobserved interactive state before claiming functional parity; do not present an invented destination as recovered behavior.

### Optional improvements, separate from faithful reproduction

- [ ] `inferred — proposed`: Confirm timing semantics before changing the chart. For an elapsed-time breakdown, use 33.9 / 22.6 / 14.5 / 29.0% of usable colored width and no unexplained remainder.
- [ ] `inferred — proposed`: Match the legend’s reading order to the bar and explain any overlapping model timings.
- [ ] `inferred — proposed`: Verify keyboard activation, focus behavior, accessible grouping, chip contrast, and reduced motion in a live implementation.

**Owner inputs still needed — `unknown`.** Source component/theme, intended CSS size and font, chart denominator and gray-segment meaning, concurrency semantics, meaning/editability of Low and High, Details destination and dismissal behavior, update lifecycle, empty/error copy, keyboard map, and motion/reduced-motion behavior.
