import assert from "node:assert/strict";
import { test } from "node:test";
import * as Schema from "../assets/schema/index.ts";
import { validateSettings } from "../assets/settings.ts";
import { isRenderMessage } from "../assets/app/types.ts";

const typography: Schema.Typography = {
  fontFamily: "system-ui",
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: 0,
};

const corners: Schema.Corners = { topLeft: 8, topRight: 12, bottomRight: 16, bottomLeft: 20 };

const schema = Schema.Component("Type and corners", {
  controls: {
    typography: Schema.Control.Typography({ default: typography }),
    corners: Schema.Control.Corners({ default: corners, max: 40 }),
  },
  states: {
    initial: {},
    serif: {
      props: {
        typography: { ...typography, fontFamily: "serif" },
        corners: { ...corners, bottomLeft: 0 },
      },
    },
  },
});

test("typography and corner values normalize stored ranges and unsupported fonts independently", () => {
  assert.deepEqual(
    schema.parse({
      typography: {
        fontFamily: "unknown font",
        fontSize: 999,
        fontWeight: -1,
        lineHeight: 99,
        letterSpacing: -99,
      },
      corners: { topLeft: -10, topRight: 99, bottomLeft: 12, bottomRight: 30 },
    }),
    {
      typography: {
        fontFamily: "system-ui",
        fontSize: 256,
        fontWeight: 1,
        lineHeight: 4,
        letterSpacing: -10,
      },
      corners: { topLeft: 0, topRight: 40, bottomLeft: 12, bottomRight: 30 },
    },
  );
  const result = schema.parse({
    typography: { ...typography, lineHeight: NaN },
    corners: { topLeft: 3 },
  });

  assert.deepEqual(result, schema.defaults);
  result.typography.fontSize = 48;
  result.corners.topLeft = 0;
  assert.equal(typography.fontSize, 16);
  assert.equal(corners.topLeft, 8);
});

test("font menus and non-negative corner defaults validate at schema creation", () => {
  assert.deepEqual(
    Schema.Control.Typography({ default: { ...typography, fontFamily: "Inter" } }).fonts,
    ["Inter", "system-ui", "serif", "monospace"],
  );
  assert.throws(
    () => Schema.Control.Typography({ default: typography, fonts: ["serif"] }),
    /include the default/,
  );
  assert.throws(
    () => Schema.Control.Typography({ default: typography, fonts: ["system-ui", "system-ui"] }),
    /unique/,
  );
  assert.throws(
    () => Schema.Control.Typography({ default: { ...typography, lineHeight: 0 } }),
    /within bounds/,
  );
  assert.throws(
    () => Schema.Control.Corners({ default: { ...corners, topLeft: -1 } }),
    /non-negative/,
  );
  assert.throws(() => Schema.Control.Corners({ default: corners, max: 10 }), /within bounds/);
  assert.throws(() => Schema.Control.Corners({ default: corners, step: 0 }), /positive step/);
  assert.throws(
    () =>
      Schema.Component("Wrong state", {
        controls: schema.controls,
        states: { bad: { props: { typography: { ...typography, fontFamily: "unknown" } } } },
      }),
    /Invalid prop/,
  );
});

test("typography and corner props bind, serialize, and cross the preview boundary", () => {
  const settings = validateSettings(
    JSON.parse(JSON.stringify({ version: 1, components: { demo: schema.defaults } })),
  );

  assert.deepEqual(settings.components.demo, schema.defaults);
  assert.equal(
    isRenderMessage({ type: "render", id: "demo", props: settings.components.demo, theme: "dark" }),
    true,
  );
  assert.deepEqual(schema.from(() => null).render({}, "serif").props, {
    ...schema.defaults,
    ...schema.states.serif!.props,
  });

  for (const value of [
    { ...typography, fontWeight: "bold" },
    { ...typography, fontFamily: " " },
    { ...corners, topLeft: Infinity },
    { topLeft: 8, topRight: 8 },
    { ...corners, extra: 8 },
  ]) {
    assert.throws(
      () => validateSettings({ version: 1, components: { demo: { value } } }),
      /Invalid component settings/,
    );
    assert.equal(
      isRenderMessage({ type: "render", id: "demo", props: { value }, theme: "light" }),
      false,
    );
  }
});

test("corner CSS follows clockwise order independently of the editor grid order", () => {
  assert.equal(Schema.cornersCSS(corners), "8px 12px 16px 20px");
});
