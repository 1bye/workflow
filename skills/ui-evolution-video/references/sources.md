# Source capture and historical fallbacks

## Isolate a revision

Resolve a source and export committed files without modifying its checkout:

```sh
node "$PROJECT/scripts/snapshot-revision.mjs" "$REPO" "$REVISION" "$SNAPSHOT"
```

The printed SHA belongs in `source.revision`. The destination must not exist.
Exports exclude Git metadata, uncommitted files, submodule contents, and external
LFS objects. If the build needs these, use an isolated detached Git worktree and
resolve its dependencies deliberately. Preserve the original checkout and any
uncommitted work. Start servers only in the isolated environment.

Inspect package scripts before choosing install and build commands. Preserve its
lockfile and toolchain where possible. Do not run a migration, deployment, or
production data write merely to obtain a screen. Use fixed local data for capture.

Bound an install/build attempt with the remaining troubleshooting budget:

```sh
node "$PROJECT/scripts/run-bounded.mjs" 120 "$SNAPSHOT" npm ci
node "$PROJECT/scripts/run-bounded.mjs" 60 "$SNAPSHOT" npm run build
```

Arguments are passed directly without a shell. The wrapper returns exit 124 on
timeout and terminates the process group on macOS/Linux. Give a server its own
tracked process and close it after capture; the bounded wrapper is for finite
commands, not server lifetime management.

## Fallbacks

1. **Full app:** its historical dependencies, route, styles, and local data.
2. **Component harness:** mount the relevant component with its assets, styles,
   and mocked inputs in a small existing Vite/Storybook harness when available.
3. **Source rebuild:** reproduce visible markup and styling in an isolated HTML
   or component page. Read the historical source; do not invent an endpoint from
   its commit message.
4. **Screenshot rebuild:** reconstruct editable text, surfaces, and controls
   from the image. Record missing fonts, uncertain geometry, and hidden content.

Use 300 seconds total for troubleshooting historical installs/builds and harness
setup per revision, not per retry. Stop retrying on expiry. The budget does not
pretend that subsequent design and rendering require no time. Record actual
attempt durations and distinguish reconstruction from a running historical app.

If source rebuild is already straightforward, do not spend the entire budget
on obsolete infrastructure. Record why earlier modes were skipped.

## Source provenance file

Pass a source JSON to capture, for example:

```json
{
  "kind": "git",
  "ref": "v1.2.0",
  "revision": "0123456789abcdef0123456789abcdef01234567",
  "method": "source-rebuild",
  "assumptions": ["Local fixture data replaces the unavailable API."],
  "attempts": [
    {"method": "full-app", "status": "failed", "seconds": 22, "reason": "Historical package is unavailable."},
    {"method": "component-harness", "status": "skipped", "seconds": 0, "reason": "The component depends on the missing package."},
    {"method": "source-rebuild", "status": "succeeded", "seconds": 15, "reason": "Rebuilt the visible component from its source and assets."}
  ]
}
```

For screenshot inputs, use `kind: "screenshot"`, its filename in `ref`, and
`method: "screenshot-rebuild"`. For current code use `kind: "code"`; for the
uncommitted checkout use `kind: "working-tree"` and record the captured content.
Never label a screenshot-derived reconstruction as a captured full application.

## Layer instrumentation

Prefer explicit tags in the isolated source:

```html
<div data-anim-id="name-input" data-anim-kind="box">
  <span data-anim-id="name-value" data-anim-kind="text">Acme</span>
</div>
```

Or pass `--map selectors.json`:

```json
[
  {"id": "name-label", "selector": "label[for='name']", "kind": "text"},
  {"id": "name-field", "selector": ".name-field", "kind": "box"},
  {"id": "name-value", "selector": ".name-field .value", "kind": "text"}
]
```

Each selector must match exactly one visible element. IDs must be unique per
state. Optional `z` overrides DOM-order stacking. Use wrappers or spans to obtain
text-only geometry. A button containing both background and text needs two
primitives if both are to remain editable. Native input/control appearance and
pseudo-elements are not automatically serialized.

`kind: "image"` captures the selected element to `public/assets/`. Do not also
capture its descendants, which would duplicate content. A raster layer is useful
for an icon or complex unchanged region; rebuild text-heavy regions as primitives
when resizing them would distort typography. Image filenames are state-specific.

The capture tool records geometry, selected computed styles, ancestor opacity,
semantic evidence, and the nearest selected parent. It does not reproduce the
browser's full paint/compositing model. Resolve warnings about clipping, transforms,
gradients, native controls, and asymmetric borders before claiming fidelity.

For custom fonts, copy licensed font assets into `public/`, add `manifest.fonts`,
and verify an endpoint preview against the screenshot. The renderer waits for
those fonts to load. System-font fallback must be disclosed when material.

## Commit range selection

Inspect a bounded history, for example `git log --first-parent --reverse` plus
file-specific diffs. Render candidate states. Keep visual milestones and explain
omitted SHAs in the manifest. Do not drop a visually important intermediate state
solely because the first and last versions look similar.

Normalize viewport and data before judging whether a commit changes appearance.
Record traversal explicitly; branch comparisons are not necessarily chronological.
