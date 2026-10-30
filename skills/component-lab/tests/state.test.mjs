import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPanels, componentValues, panelBounds } from "../assets/app/state.js";

test("stored component values respect control limits and reject malformed values", () => {
  const component = {
    defaults: { size: 44, color: "#e76e50", label: "Place", showLabel: true },
    controls: [
      { key: "size", type: "range", min: 28, max: 72 },
      { key: "color", type: "color" },
      { key: "label", type: "text", maxLength: 10 },
      { key: "showLabel", type: "boolean" },
    ],
  };

  assert.deepEqual(componentValues(component, { size: 999, color: "bad", label: "A very long place", showLabel: false }), { size: 72, color: "#e76e50", label: "A very lon", showLabel: false });
  assert.equal(componentValues(component, { size: Infinity }).size, 44);
  assert.equal(componentValues(component, { size: 1 }).size, 28);
  assert.equal(componentValues(component, { showLabel: "false" }).showLabel, true);
});

test("resizing leaves room for the preview and tweaks at desktop and narrow widths", () => {
  assert.deepEqual(clampPanels({ width: 999, height: 999 }, panelBounds(1280, 720)), { width: 480, height: 560 });
  assert.deepEqual(clampPanels({ width: 999, height: 999 }, panelBounds(390, 720)), { width: 220, height: 560 });
  assert.deepEqual(clampPanels({ width: -50, height: 0 }, panelBounds(1280, 720)), { width: 220, height: 180 });
});
