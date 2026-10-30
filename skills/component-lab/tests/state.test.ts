import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPanels, panelBounds, restoreWorkspace } from "../assets/app/state.ts";
import * as Schema from "../assets/schema/index.ts";
import { resolveComponents } from "../assets/schema/entries.ts";
import { validateSettings, type Settings } from "../assets/settings.ts";

test("stored component values respect control limits and reject malformed values", () => {
  const component = Schema.Component("Example", {
    controls: {
      size: Schema.Control.Number({ default: 44, min: 28, max: 72 }),
      color: Schema.Control.Color({ default: "#e76e50" }),
      label: Schema.Control.Text({ default: "Place", maxLength: 10 }),
      showLabel: Schema.Control.Boolean({ default: true }),
    },
  });

  assert.deepEqual(
    component.parse({ size: 999, color: "bad", label: "A very long place", showLabel: false }),
    { size: 72, color: "#e76e50", label: "A very lon", showLabel: false },
  );
  assert.equal(component.parse({ size: Infinity }).size, 44);
  assert.equal(component.parse({ size: 1 }).size, 28);
  assert.equal(component.parse({ showLabel: "false" }).showLabel, true);
});

test("resizing leaves room for the preview and tweaks at desktop and narrow widths", () => {
  assert.deepEqual(clampPanels({ width: 999, height: 999 }, panelBounds(1280, 720)), {
    width: 480,
    height: 560,
  });
  assert.deepEqual(clampPanels({ width: 999, height: 999 }, panelBounds(390, 720)), {
    width: 220,
    height: 560,
  });
  assert.deepEqual(clampPanels({ width: -50, height: 0 }, panelBounds(1280, 720)), {
    width: 220,
    height: 180,
  });
});

test("saved tweaks survive new components and project defaults, retaining temporarily absent components", () => {
  const schema = Schema.Component("Example", {
    controls: { size: Schema.Control.Number({ default: 44 }) },
  });

  const bound = schema.from(() => null);

  const components = resolveComponents({
    "@drafts/components/pin/index.ts": { default: bound },
    "@drafts/components/new/index.ts": { default: bound },
  });

  const persisted: Settings = {
    version: 1,
    components: { pin: { size: 44 }, absent: { size: 20 } },
  };

  const pending = {
    selectedId: "pin",
    settings: { ...persisted, components: { ...persisted.components, pin: { size: 60 } } },
  };

  const restored = restoreWorkspace(pending, persisted, components);

  assert.equal(restored.settings.components.pin?.size, 60);
  assert.equal(restored.settings.components.new?.size, 44);
  assert.equal(restored.settings.components.absent?.size, 20);
  assert.equal(restored.id, "pin");
  assert.equal(
    restoreWorkspace(pending, { ...persisted, components: { pin: { size: 20 } } }, components)
      .settings.components.pin?.size,
    60,
  );
  assert.equal(
    restoreWorkspace({ ...pending, selectedId: "removed" }, persisted, components).id,
    components[0].id,
  );
  assert.equal(
    restoreWorkspace({ ...pending, settings: { version: 99 } }, persisted, components).settings
      .components.pin?.size,
    44,
  );
});

test("removing workbench backgrounds preserves saved controls from older workspaces", () => {
  const components = { pin: { size: 48, color: "#668977" } };

  assert.deepEqual(validateSettings({ version: 1, canvas: "map", components }), {
    version: 1,
    components,
  });
});
