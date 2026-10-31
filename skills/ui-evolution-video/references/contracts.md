# Artifact contracts

The authoritative machine contracts are in `schemas/`. All artifacts have
`version: 1`. Project paths below are relative to the generated project.

```text
data/
  states/a.json             Geometry, style, semantic evidence, provenance
  states/a.png              Endpoint screenshot from capture
  states/b.json
  states/b.png
  correspondence.json       One complete map per adjacent pair
  timeline.json             Integer frame intervals and per-match tracks
  manifest.json             Chosen sources, omissions, assumptions, review
public/assets/              Portable image/font assets
src/index.jsx               Editable React/Remotion composition
scripts/                    Capture, plan, validate, render, review tools
schemas/                    Versioned JSON Schemas
package.json
package-lock.json
artifacts/                  Rendered output and review frames
```

## State

`capture-state.mjs` emits a state. Screenshot reconstructions can produce the same
format manually or via an instrumented reconstruction page. Its main fields are:

- `id`, `viewport`, `background`, `source`, `warnings`.
- `elements[]`: `id`, `parent`, `kind`, `rect`, `style`, `opacity`, `z`, `evidence`.
- `kind`: `box`, `text` with `text`, or `image` with a public-relative `asset`.

Coordinates are viewport-relative absolute pixels. Parent IDs preserve semantic
grouping; rendering uses flat screen-space coordinates so parent changes do not
change element position. All milestones use the same captured viewport. The
output canvas can differ; the renderer scales and centers the entire scene
uniformly. Capture off-screen content only when deliberately relevant.

## Correspondence

```json
{
  "version": 1,
  "transitions": [{
    "from": "a",
    "to": "b",
    "matches": [{
      "id": "name-control",
      "a": ["name-field"],
      "b": ["workspace-name-input"],
      "category": "persistent",
      "reason": "Same Workspace name label, field value, and form purpose.",
      "confidence": 0.95,
      "reviewed": true
    }]
  }]
}
```

This is a shape example; a real map must cover every element on both sides once.
Cardinalities: persistent/content-change = 1:1; added = 0:1; removed = 1:0;
split = 1:many; merge = many:1. For split/merge, the first pair carries the
continuous primary identity and additional members fade locally.

The matching helper proposes exact semantic IDs first, then unique matching
text/name and role/kind. It leaves ambiguous candidates as low-confidence
additions/removals. Review and correct them; the helper does not infer intent.

## Timeline

```json
{
  "version": 1,
  "width": 1080,
  "height": 1080,
  "fps": 60,
  "durationInFrames": 540,
  "transitions": [{
    "from": "a", "to": "b", "start": 60, "end": 360,
    "tracks": [{"match": "name-control", "start": 60, "end": 180}]
  }]
}
```

Every correspondence needs one track within its transition interval. Transition
intervals are ordered and nonoverlapping; tracks within an interval may overlap.
Frames before/after the transitions hold the corresponding milestone. At a
track's `start`, its source is exact; at `end`, its destination is exact.
The default easing is cubic ease-out, with no overshoot. Edit `scripts/motion.mjs`
for different curves or custom motion; keep the frame-driven contract.

## Manifest

```json
{
  "version": 1,
  "milestones": [
    {"id": "a", "file": "states/a.json", "reason": "Original settings layout."},
    {"id": "b", "file": "states/b.json", "reason": "Aligned controls and separated groups."}
  ],
  "omitted": [],
  "traversal": "Two supplied revisions in user-selected order.",
  "budgetSeconds": 300,
  "reference": "Bundled reference.mp4: restrained shared-element transformation.",
  "assumptions": [],
  "review": {"frames": "pending", "playback": "not-inspected", "notes": []}
}
```

Put immutable Git revisions and capture/reconstruction attempts in each state's
`source`. Put historical omissions and selection reasons in the manifest.
Optional `fonts` entries use `{family, src, weight?, style?}`, with `src` relative
to `public/`. Font files must be bundled; the renderer loads them before export.

Source files record where evidence came from; the manifest references those files
instead of duplicating all provenance. `data/scene.json` is generated for rendering.
Regenerate it from the validated source artifacts rather than editing it directly.
