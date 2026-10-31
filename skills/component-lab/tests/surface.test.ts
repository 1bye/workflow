import assert from "node:assert/strict";
import { test } from "node:test";
import * as Schema from "../assets/schema/index.ts";
import { MAX_GRADIENT_STOPS } from "../assets/schema/values.ts";
import { validateSettings } from "../assets/settings.ts";
import { isRenderMessage } from "../assets/app/types.ts";
import { canvasMessage } from "./messages.ts";

const gradient: Schema.Gradient = {
  angle: 135,
  stops: [
    { color: "#7c79ba", position: 0 },
    { color: "#3f80ac", position: 100 },
  ],
};

const shadow: Schema.Shadow = {
  x: 0,
  y: 8,
  blur: 24,
  spread: -4,
  color: "#000000",
  opacity: 0.25,
  inset: false,
};

const schema = Schema.Component("Surfaces", {
  controls: {
    gradient: Schema.Control.Gradient({ default: gradient }),
    shadow: Schema.Control.Shadow({ default: shadow }),
  },
  states: {
    initial: {},
    warm: {
      props: {
        gradient: {
          angle: 90,
          stops: [
            { position: 0, color: "#e76e50" },
            { position: 100, color: "#d39a37" },
          ],
        },
        shadow: { ...shadow, inset: true },
      },
    },
  },
});

test("surface controls clamp persisted values, sort stops, and keep defaults independent", () => {
  assert.deepEqual(
    schema.parse({
      gradient: {
        angle: 999,
        stops: [
          { color: "#000000", position: 120 },
          { color: "#ffffff", position: -10 },
        ],
      },
      shadow: { ...shadow, x: -999, y: 999, blur: -1, spread: 999, opacity: 4 },
    }),
    {
      gradient: {
        angle: 360,
        stops: [
          { color: "#ffffff", position: 0 },
          { color: "#000000", position: 100 },
        ],
      },
      shadow: { ...shadow, x: -100, y: 100, blur: 0, spread: 100, opacity: 1 },
    },
  );
  const parsed = schema.parse({
    gradient: { angle: 0, stops: [] },
    shadow: { ...shadow, color: "bad" },
  });

  assert.deepEqual(parsed, schema.defaults);
  parsed.gradient.stops[0]!.color = "#ffffff";
  parsed.shadow.blur = 10;
  assert.equal(gradient.stops[0]!.color, "#7c79ba");
  assert.equal(shadow.blur, 24);
});

test("surface defaults and states reject invalid colors, shapes, ranges, and stop counts", () => {
  for (const invalid of [
    { ...gradient, angle: -1 },
    { ...gradient, stops: [...gradient.stops].reverse() },
    { ...gradient, stops: [{ color: "red", position: 0 }, gradient.stops[1]!] },
    { ...gradient, stops: [gradient.stops[0]!] },
    {
      ...gradient,
      stops: Array.from({ length: MAX_GRADIENT_STOPS + 1 }, () => gradient.stops[0]!),
    },
  ])
    assert.throws(() => Schema.Control.Gradient({ default: invalid }), /Gradient defaults/);

  assert.throws(
    () => Schema.Control.Shadow({ default: { ...shadow, blur: -1 } }),
    /Shadow defaults/,
  );
  assert.throws(
    () => Schema.Control.Shadow({ default: { ...shadow, opacity: NaN } }),
    /Shadow defaults/,
  );
  assert.throws(
    () =>
      Schema.Component("Wrong state", {
        controls: schema.controls,
        states: { bad: { props: { gradient: { ...gradient, angle: 999 } } } },
      }),
    /Invalid prop/,
  );
  assert.deepEqual(schema.from(() => null).render({}, "warm").props, {
    ...schema.defaults,
    ...schema.states.warm!.props,
  });
});

test("nested surface values survive storage and preview messages while malformed data is rejected", () => {
  const settings = validateSettings(
    JSON.parse(JSON.stringify({ version: 1, components: { demo: schema.defaults } })),
  );

  assert.deepEqual(settings.components.demo, schema.defaults);
  assert.equal(isRenderMessage(canvasMessage(settings.components.demo)), true);

  for (const invalid of [
    { ...gradient, stops: new Array<unknown>(2) },
    { ...gradient, stops: [{ color: "#000000", position: Infinity }, gradient.stops[1]] },
    { ...gradient, extra: true },
    { ...shadow, inset: "false" },
    { ...shadow, color: "url(secret)" },
  ]) {
    assert.throws(
      () => validateSettings({ version: 1, components: { demo: { value: invalid } } }),
      /Invalid component settings/,
    );
    assert.equal(isRenderMessage(canvasMessage({ value: invalid }, "light")), false);
  }
});

test("surface CSS helpers preserve stops, negative spread, opacity, and inset", () => {
  assert.equal(Schema.gradientCSS(gradient), "linear-gradient(135deg, #7c79ba 0%, #3f80ac 100%)");
  assert.equal(Schema.shadowCSS(shadow), "0px 8px 24px -4px rgb(0 0 0 / 0.25)");
  assert.equal(
    Schema.shadowCSS({ ...shadow, color: "#ff8040", inset: true }),
    "inset 0px 8px 24px -4px rgb(255 128 64 / 0.25)",
  );
});
