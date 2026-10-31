import assert from "node:assert/strict";
import { test } from "node:test";
import * as Schema from "../assets/schema/index.ts";
import { validateSettings } from "../assets/settings.ts";
import { isRenderMessage } from "../assets/app/types.ts";
import { canvasMessage } from "./messages.ts";

const schema = Schema.Component("Compound values", {
  controls: {
    position: Schema.Control.Vector2({ default: { x: 0, y: 0 }, min: -60, max: 60 }),
    width: Schema.Control.Interval({ default: [120, 240], min: 80, max: 320 }),
    padding: Schema.Control.Spacing({
      default: { top: 12, right: 20, bottom: 12, left: 20 },
      max: 40,
    }),
    easing: Schema.Control.Easing({ default: [0.25, 0.1, 0.25, 1] }),
  },
  states: {
    initial: {},
    shifted: { props: { position: { y: 20, x: 10 }, easing: [0.34, 1.56, 0.64, 1] } },
  },
});

test("compound values normalize persisted bounds and reject malformed shapes without mutating defaults", () => {
  const result = schema.parse({
    position: { x: -100, y: 100 },
    width: [400, 0],
    padding: { top: -1, right: 80, bottom: 10, left: 20 },
    easing: [-1, -2, 2, 3],
  });

  assert.deepEqual(result, {
    position: { x: -60, y: 60 },
    width: [80, 320],
    padding: { top: 0, right: 40, bottom: 10, left: 20 },
    easing: [0, -2, 1, 3],
  });
  const malformed = schema.parse({
    position: { x: 0, y: NaN },
    width: [120],
    padding: { top: 10 },
    easing: [0, 1, Infinity, 1],
  });

  assert.deepEqual(malformed, schema.defaults);
  malformed.position.x = 50;
  malformed.width[0] = 200;
  assert.deepEqual(schema.defaults.position, { x: 0, y: 0 });
  assert.deepEqual(schema.defaults.width, [120, 240]);
});

test("structured snapshot props validate by value and bind through schema.from", () => {
  const entry = schema.from(() => null);

  assert.deepEqual(entry.render({ width: [100, 200] }, "shifted").props, {
    ...schema.defaults,
    width: [100, 200],
    position: { y: 20, x: 10 },
    easing: [0.34, 1.56, 0.64, 1],
  });
  assert.throws(
    () =>
      Schema.Component("Invalid state", {
        controls: schema.controls,
        states: { broken: { props: { width: [240, 120] } } },
      }),
    /Invalid prop/,
  );
  assert.throws(
    () =>
      Schema.Component("Invalid state", {
        controls: schema.controls,
        states: { broken: { props: { position: { x: 100, y: 0 } } } },
      }),
    /Invalid prop/,
  );
});

test("compound settings survive JSON storage and iframe validation rejects unsupported nested data", () => {
  const serialized: unknown = JSON.parse(
    JSON.stringify({ version: 1, components: { demo: schema.defaults } }),
  );

  assert.deepEqual(validateSettings(serialized).components.demo, schema.defaults);
  assert.equal(isRenderMessage(canvasMessage(schema.defaults)), true);

  for (const invalid of [
    { x: 0, y: Infinity },
    [1, 2, 3],
    { top: 0, right: 1, bottom: 2, left: "3" },
    { nested: { x: 0, y: 0 } },
    new Array<unknown>(2),
    new Array<unknown>(4),
  ]) {
    assert.throws(
      () => validateSettings({ version: 1, components: { demo: { value: invalid } } }),
      /Invalid component settings/,
    );
    assert.equal(isRenderMessage(canvasMessage({ value: invalid }, "light")), false);
  }
});

test("compound builders reject invalid bounds, reversed intervals, and non-CSS easing handles", () => {
  assert.throws(
    () => Schema.Control.Vector2({ default: { x: 0, y: 0 }, min: 10, max: 0 }),
    /bounds/,
  );
  assert.throws(() => Schema.Control.Vector2({ default: { x: Infinity, y: 0 } }), /coordinates/);
  assert.throws(() => Schema.Control.Interval({ default: [20, 10] }), /ordered/);
  assert.throws(
    () => Schema.Control.Spacing({ default: { top: 1, right: -1, bottom: 1, left: 1 } }),
    /sides/,
  );
  assert.throws(() => Schema.Control.Easing({ default: [-0.1, 0, 1, 1] }), /between 0 and 1/);
  assert.throws(() => Schema.Control.Easing({ default: [0, 0, 1, NaN] }), /finite/);
});
