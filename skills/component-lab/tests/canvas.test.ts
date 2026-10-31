import assert from "node:assert/strict";
import { test } from "node:test";
import * as Schema from "../assets/schema/index.ts";
import { resolveComponents } from "../assets/schema/entries.ts";
import {
  createCanvas,
  duplicateInstance,
  editInstance,
  isCanvas,
  removeInstance,
  selectedInstance,
  selectInstance,
} from "../assets/app/canvas.ts";
import { replaceCanvas, restoreWorkspace } from "../assets/app/state.ts";
import { isRenderMessage, isSelectInstanceMessage } from "../assets/app/types.ts";
import { canvasMessage } from "./messages.ts";
import type { Settings } from "../assets/settings.ts";

const schema = Schema.Component("Example", {
  controls: {
    size: Schema.Control.Number({ default: 44, min: 28, max: 72 }),
    padding: Schema.Control.Spacing({ default: { top: 8, right: 8, bottom: 8, left: 8 } }),
    gradient: Schema.Control.Gradient({
      default: {
        angle: 90,
        stops: [
          { color: "#000000", position: 0 },
          { color: "#ffffff", position: 100 },
        ],
      },
    }),
  },
  states: { default: { props: { size: 28 } }, large: { props: { size: 72 } } },
});

const bound = schema.from(() => null);

const components = resolveComponents({
  "@drafts/components/pin/index.ts": { default: bound },
  "@drafts/components/second/index.ts": { default: bound },
});

const persisted: Settings = { version: 1, components: { pin: schema.defaults } };

test("existing saved tweaks migrate to one instance without applying a named state", () => {
  const workspace = restoreWorkspace(
    {
      selectedId: "pin",
      settings: { version: 1, components: { pin: { ...schema.defaults, size: 60 } } },
    },
    persisted,
    components,
  );

  assert.equal(workspace.id, "pin");
  assert.equal(workspace.canvases.pin!.instances.length, 1);
  assert.equal(selectedInstance(workspace.canvases.pin!).props.size, 60);
  assert.equal(workspace.canvases.second!.instances.length, 1);
  assert.deepEqual(bound.render({ size: 60 }).props, { ...schema.defaults, size: 60 });
  assert.deepEqual(bound.render({ size: 60 }, "default").props, { ...schema.defaults, size: 28 });
});

test("duplicates deep-copy configured props and edits and resets stay within their instance", () => {
  const original = createCanvas(schema.defaults);
  const copy = duplicateInstance(original, "copy");

  assert.equal(copy.selectedId, "copy");
  const first = schema.parse(copy.instances[0]!.props);
  const duplicate = copy.instances[1]!.props;

  assert.notEqual(duplicate.gradient, original.instances[0]!.props.gradient);
  const edited = editInstance(copy, "copy", (props) => ({
    ...props,
    size: 65,
    padding: { top: 20, right: 20, bottom: 20, left: 20 },
  }));

  assert.deepEqual(edited.instances[0]!.props, first);
  assert.equal(selectedInstance(edited).props.size, 65);
  const reset = editInstance(edited, "copy", () => schema.parse({}));

  assert.deepEqual(selectedInstance(reset).props, schema.defaults);
  assert.equal(original.instances.length, 1);
  assert.equal(duplicateInstance(copy, "copy"), copy);
  assert.equal(selectInstance(copy, "missing"), copy);
  assert.equal(selectInstance(copy, "initial").selectedId, "initial");
  const gradient = duplicate.gradient as Schema.Gradient;

  gradient.stops[0]!.color = "#ff0000";
  assert.equal(
    (original.instances[0]!.props.gradient as Schema.Gradient).stops[0]!.color,
    "#000000",
  );
});

test("removing the selected copy chooses a neighbor and keeps the last preview", () => {
  const one = createCanvas(schema.defaults);
  const three = duplicateInstance(duplicateInstance(one, "two"), "three");
  const removedMiddle = removeInstance(selectInstance(three, "two"));

  assert.deepEqual(
    removedMiddle.instances.map(({ id }) => id),
    ["initial", "three"],
  );
  assert.equal(removedMiddle.selectedId, "three");
  const remaining = removeInstance(removedMiddle);

  assert.equal(remaining.selectedId, "initial");
  assert.equal(removeInstance(remaining), remaining);
});

test("instance order, selection and independent values survive storage and components switching", () => {
  const initial = restoreWorkspace(null, persisted, components);

  const copy = editInstance(duplicateInstance(initial.canvases.pin!, "copy"), "copy", (props) => ({
    ...props,
    size: 999,
  }));

  const workspace = replaceCanvas(initial, "pin", copy);

  const restored = restoreWorkspace(
    JSON.parse(
      JSON.stringify({
        version: 2,
        selectedId: "second",
        settings: workspace.settings,
        canvases: { ...workspace.canvases, absent: createCanvas({ size: 50 }) },
      }),
    ),
    persisted,
    components,
  );

  assert.equal(restored.id, "second");
  assert.deepEqual(
    restored.canvases.pin!.instances.map(({ id }) => id),
    ["initial", "copy"],
  );
  assert.equal(restored.canvases.pin!.selectedId, "copy");
  assert.equal(restored.canvases.pin!.instances[0]!.props.size, 44);
  assert.equal(restored.canvases.pin!.instances[1]!.props.size, 72);
  assert.equal(restored.settings.components.pin!.size, 72);
  assert.equal(restored.canvases.absent!.instances[0]!.props.size, 50);
});

test("malformed saved canvases fall back per component without discarding legacy values", () => {
  const base = restoreWorkspace(null, persisted, components);
  const second = duplicateInstance(base.canvases.second!, "second-copy");

  const restored = restoreWorkspace(
    {
      version: 2,
      selectedId: "pin",
      settings: { ...persisted, components: { pin: { ...schema.defaults, size: 61 } } },
      canvases: { pin: { selectedId: "missing", instances: [] }, second },
    },
    persisted,
    components,
  );

  assert.equal(restored.canvases.pin!.instances.length, 1);
  assert.equal(selectedInstance(restored.canvases.pin!).props.size, 61);
  assert.equal(restored.canvases.second!.instances.length, 2);
});

test("preview messages require a unique nonempty instance list, valid props and a valid selection", () => {
  const message = canvasMessage(schema.defaults);

  assert.equal(isRenderMessage(message), true);

  for (const canvas of [
    { selectedId: "initial", instances: [] },
    { selectedId: "missing", instances: [{ id: "initial", props: {} }] },
    {
      selectedId: "same",
      instances: [
        { id: "same", props: {} },
        { id: "same", props: {} },
      ],
    },
    { selectedId: "bad id", instances: [{ id: "bad id", props: {} }] },
    { selectedId: "initial", instances: [{ id: "initial", props: { value: Infinity } }] },
  ]) {
    assert.equal(isCanvas(canvas), false);
    assert.equal(isRenderMessage({ ...message, canvas }), false);
  }

  assert.equal(
    isSelectInstanceMessage({ type: "select-instance", id: "pin", instanceId: "copy" }),
    true,
  );
  assert.equal(
    isSelectInstanceMessage({ type: "select-instance", id: "pin", instanceId: "bad id" }),
    false,
  );
  assert.equal(isSelectInstanceMessage({ type: "select-instance", id: "pin" }), false);
});

test("retired layer layouts and style overrides are discarded without losing preview props", () => {
  const workspace = restoreWorkspace(
    {
      version: 2,
      selectedId: "pin",
      settings: persisted,
      canvases: {
        pin: {
          selectedId: "copy",
          instances: [
            { id: "initial", props: schema.defaults, overrides: { "div:0": { paddingTop: 50 } } },
            {
              id: "copy",
              props: { ...schema.defaults, size: 60 },
              layout: [{ type: "remove", id: "div:0" }],
            },
          ],
        },
      },
    },
    persisted,
    components,
  );

  assert.deepEqual(workspace.canvases.pin, {
    selectedId: "copy",
    instances: [
      { id: "initial", props: schema.defaults },
      { id: "copy", props: { ...schema.defaults, size: 60 } },
    ],
  });
});
