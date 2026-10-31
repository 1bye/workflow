import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isSpacingEdits,
  scopedProperties,
  spacingCSS,
  wheelSpacing,
  wheelSpacingValues,
} from "../assets/app/spacing-edits.ts";
import { isRenderMessage, isSpacingMessage } from "../assets/app/types.ts";
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

test("scopes affect only the hovered element's padding or margin axes, leaving gaps independent", () => {
  assert.deepEqual(scopedProperties("padding-left", "Side"), ["padding-left"]);
  assert.deepEqual(scopedProperties("padding-top", "X"), ["padding-left", "padding-right"]);
  assert.deepEqual(scopedProperties("margin-left", "Y"), ["margin-top", "margin-bottom"]);
  assert.deepEqual(scopedProperties("margin-left", "All"), [
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
  ]);
  assert.deepEqual(scopedProperties("column-gap", "All"), ["column-gap"]);
});

test("group scrolling preserves asymmetric spacing, including when a side reaches a limit", () => {
  const base = { "padding-top": 8, "padding-right": 12, "padding-bottom": 8, "padding-left": 12 };

  assert.deepEqual(wheelSpacingValues(base, -8, false), {
    "padding-top": 10,
    "padding-right": 14,
    "padding-bottom": 10,
    "padding-left": 14,
  });
  assert.deepEqual(wheelSpacingValues(base, 100, false), {
    "padding-top": 0,
    "padding-right": 4,
    "padding-bottom": 0,
    "padding-left": 4,
  });
  assert.deepEqual(wheelSpacingValues({ "margin-left": -8, "margin-right": 12 }, 8, false), {
    "margin-left": -10,
    "margin-right": 10,
  });
  assert.deepEqual(wheelSpacingValues({ "padding-left": 8.25, "padding-right": 12.5 }, -8, true), {
    "padding-left": 8.45,
    "padding-right": 12.7,
  });
  assert.deepEqual(
    wheelSpacingValues({ "padding-left": 4090, "padding-right": 4095 }, -100, false),
    { "padding-left": 4091, "padding-right": 4096 },
  );
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
    edits: { "row-gap": 16 },
  };

  assert.equal(isSpacingMessage(message), true);
  assert.equal(
    isSpacingMessage({ ...message, edits: { "padding-left": 12, "padding-right": 16 } }),
    true,
  );
  assert.equal(
    isSpacingMessage({ ...message, edits: { "padding-left": 12, "padding-right": "16px" } }),
    false,
  );
  assert.equal(isSpacingMessage({ ...message, edits: { position: 16 } }), false);
  assert.equal(isSpacingMessage({ ...message, edits: {} }), false);
  assert.equal(isSpacingMessage({ ...message, instanceId: "bad id" }), false);
  const render = {
    type: "render",
    id: "demo",
    canvas: createCanvas({}),
    theme: "dark",
    spacingScope: "X",
  };

  assert.equal(isRenderMessage(render), true);
  assert.equal(isRenderMessage({ ...render, spacingScope: "invalid" }), false);
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
