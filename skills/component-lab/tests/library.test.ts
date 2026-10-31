import assert from "node:assert/strict";
import { test } from "node:test";
import * as Schema from "../assets/schema/index.ts";
import { resolveComponents } from "../assets/schema/entries.ts";
import { libraryEntries, toggleComparison } from "../assets/app/library.ts";
import { isRenderMessage } from "../assets/app/types.ts";
import {
  createCanvas,
  editInstance,
  selectedInstance,
  selectInstance,
} from "../assets/app/canvas.ts";
import { replaceCanvas, restoreWorkspace } from "../assets/app/state.ts";
import { spacingCSS } from "../assets/app/spacing-edits.ts";

const bound = Schema.Component("Button", {
  controls: { label: Schema.Control.Text({ default: "Continue" }) },
}).from(() => null);

const components = resolveComponents({
  "@drafts/components/inputs/button/index.ts": { default: bound },
  "@drafts/components/inputs/toggles/switch/index.ts": { default: { ...bound, name: "Switch" } },
  "@drafts/components/maps/pin/index.ts": { default: { ...bound, name: "Location pin" } },
  "@drafts/components/toast/index.ts": { default: { ...bound, name: "Toast" } },
});

test("folders follow directories, count descendants, and open one level at a time", () => {
  const root = libraryEntries(components, "", "");

  assert.deepEqual(root.folders, [
    { name: "inputs", path: "inputs", count: 2 },
    { name: "maps", path: "maps", count: 1 },
  ]);
  assert.deepEqual(
    root.components.map(({ id }) => id),
    ["toast"],
  );
  const inputs = libraryEntries(components, "inputs", "");

  assert.deepEqual(
    inputs.components.map(({ id }) => id),
    ["inputs/button"],
  );
  assert.deepEqual(inputs.folders, [{ name: "toggles", path: "inputs/toggles", count: 1 }]);
  assert.deepEqual(
    libraryEntries(components, "inputs/toggles", "").components.map(({ id }) => id),
    ["inputs/toggles/switch"],
  );
  assert.deepEqual(libraryEntries(components, "input", "").folders, []);
});

test("search crosses folders and comparison selection persists between folders", () => {
  assert.deepEqual(
    libraryEntries(components, "inputs", " PIN ").components.map(({ id }) => id),
    ["maps/pin"],
  );
  assert.equal(libraryEntries(components, "", "inputs/toggles").components[0]?.name, "Switch");
  assert.deepEqual(libraryEntries(components, "", "missing"), { folders: [], components: [] });
  const pair = toggleComparison([], "maps/pin", "inputs/button");

  assert.deepEqual(pair, ["inputs/button", "maps/pin"]);
  assert.deepEqual(toggleComparison(pair, "maps/pin", "inputs/button"), ["inputs/button"]);
  assert.deepEqual(toggleComparison(pair, "toast", "inputs/button"), [...pair, "toast"]);
});

test("a stable component id preserves saved tweaks when moving into a folder", () => {
  const before = resolveComponents({
    "@drafts/components/button/index.ts": { default: { ...bound, id: "button" } },
  });

  const after = resolveComponents({
    "@drafts/components/inputs/button/index.ts": { default: { ...bound, id: "button" } },
  });

  const defaults = { version: 1, components: {} } as const;
  const original = restoreWorkspace(null, defaults, before);

  const edited = replaceCanvas(
    original,
    "button",
    editInstance(original.canvases.button!, "initial", (props) => ({ ...props, label: "Saved" })),
  );

  const restored = restoreWorkspace(
    { version: 2, settings: edited.settings, selectedId: "button", canvases: edited.canvases },
    defaults,
    after,
  );

  assert.equal(after[0].folder, "inputs");
  assert.equal(selectedInstance(restored.canvases.button!).props.label, "Saved");
});

test("comparison validates distinct components and keeps identically named instances independent", () => {
  const first = createCanvas({ label: "First" });
  const second = createCanvas({ label: "Second" });

  const message = {
    type: "render",
    id: "one",
    canvas: first,
    theme: "dark",
    comparison: [
      { id: "one", canvas: first },
      { id: "two", canvas: second },
    ],
  };

  assert.equal(isRenderMessage(message), true);
  assert.equal(isRenderMessage({ ...message, comparison: [message.comparison[0]] }), false);
  assert.equal(
    isRenderMessage({ ...message, comparison: [message.comparison[0], message.comparison[0]] }),
    false,
  );
  assert.equal(isRenderMessage({ ...message, id: "absent" }), false);
  assert.equal(
    isRenderMessage({ ...message, comparison: [message.comparison[0], { id: "two", canvas: {} }] }),
    false,
  );
  const workspace = restoreWorkspace(null, { version: 1, components: {} }, components);
  const id = components[0].id;

  const updated = replaceCanvas(
    workspace,
    id,
    editInstance(selectInstance(workspace.canvases[id]!, "initial"), "initial", (props) => ({
      ...props,
      label: "Only this one",
    })),
  );

  assert.equal(selectedInstance(updated.canvases[id]!).props.label, "Only this one");
  assert.deepEqual(updated.canvases[components[1]!.id], workspace.canvases[components[1]!.id]);
  const overrides = [{ id: "initial", spacing: { "div:0": { "padding-top": 24 } } }];

  assert.match(spacingCSS(overrides, "one"), /data-component-id="one"/);
  assert.match(spacingCSS(overrides, "two"), /data-component-id="two"/);
  assert.doesNotMatch(spacingCSS(overrides, "one"), /data-component-id="two"/);
});
