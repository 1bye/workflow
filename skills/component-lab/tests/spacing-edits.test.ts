import assert from "node:assert/strict";
import { test } from "node:test";
import { isSpacingEdits, spacingCSS, wheelSpacing } from "../assets/app/spacing-edits.ts";
import { isSpacingMessage } from "../assets/app/types.ts";
import { createCanvas, duplicateInstance, editSpacing, isCanvas } from "../assets/app/canvas.ts";
import { restoreWorkspace, replaceCanvas } from "../assets/app/state.ts";
import * as Schema from "../assets/schema/index.ts";
import { resolveComponents } from "../assets/schema/entries.ts";

test("spacing gestures clamp padding and gaps, retain negative margins and offer fine adjustment", () => {
  assert.equal(wheelSpacing(20, -40, "padding-top", false), 30);
  assert.equal(wheelSpacing(20, 40, "padding-top", false), 10);
  assert.equal(wheelSpacing(20, -40, "padding-top", true), 21);
  assert.equal(wheelSpacing(4, 100, "row-gap", false), 0);
  assert.equal(wheelSpacing(4, 100, "margin-top", false), -21);
  assert.equal(wheelSpacing(4090, -100, "column-gap", false), 4096);
});

test("spacing edits validate finite, allowlisted values and safe component paths", () => {
  assert.equal(
    isSpacingEdits({ "section:0/div:1": { "padding-top": 24, "margin-left": -8 } }),
    true,
  );

  for (const edits of [
    { "*": { "padding-top": 12 } },
    { "div:0": { position: 12 } },
    { "div:0": { "row-gap": -1 } },
    { "div:0": { "padding-top": Infinity } },
    { "div:0": { "margin-left": -4097 } },
  ])
    assert.equal(isSpacingEdits(edits), false);

  const message = {
    type: "spacing-change",
    id: "demo",
    instanceId: "initial",
    path: "div:0",
    property: "row-gap",
    value: 16,
  };

  assert.equal(isSpacingMessage(message), true);
  assert.equal(isSpacingMessage({ ...message, value: "16px" }), false);
  assert.equal(isSpacingMessage({ ...message, instanceId: "bad id" }), false);
  assert.equal(
    isCanvas({
      instances: [{ id: "initial", props: {}, spacing: { "div:0": { "column-gap": NaN } } }],
      selectedId: "initial",
    }),
    false,
  );
  const css = spacingCSS([
    { id: "initial", spacing: { "section:0/div:1": { "padding-top": 24 } } },
    { id: "copy" },
  ]);

  assert.match(
    css,
    /\[data-instance-id="initial"\] > section:nth-child\(1\) > div:nth-child\(2\)\{padding-top:24px!important\}/,
  );
  assert.doesNotMatch(css, /data-instance-id="copy"/);
});

test("spacing saves and duplicates independently without changing schema props", () => {
  const component = Schema.Component("Example", {
    controls: { size: Schema.Control.Number({ default: 12 }) },
  }).from(() => null);

  const components = resolveComponents({
    "@drafts/components/demo/index.ts": { default: component },
  });

  const defaults = { version: 1, components: {} } as const;
  const initial = restoreWorkspace(null, defaults, components);

  const edited = editSpacing(createCanvas(component.defaults), "initial", () => ({
    "div:0": { "padding-top": 24 },
  }));

  const copied = duplicateInstance(edited, "copy");

  assert.notEqual(copied.instances[0]!.spacing, copied.instances[1]!.spacing);
  const reset = editSpacing(copied, "copy", () => ({}));

  assert.deepEqual(reset.instances[0]!.spacing, { "div:0": { "padding-top": 24 } });
  const workspace = replaceCanvas(initial, "demo", reset);

  const restored = restoreWorkspace(
    JSON.parse(
      JSON.stringify({
        version: 2,
        selectedId: "demo",
        settings: workspace.settings,
        canvases: workspace.canvases,
      }),
    ),
    defaults,
    components,
  );

  assert.deepEqual(restored.canvases.demo, reset);
  assert.deepEqual(restored.settings.components.demo, { size: 12 });
});
