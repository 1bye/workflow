import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import * as Schema from "../assets/schema/index.ts";
import { resolveComponents } from "../assets/schema/entries.ts";

const schema = Schema.Component("Example", {
  controls: {
    size: Schema.Control.Number({ default: 44, min: 28, max: 72 }),
    loading: Schema.Control.Boolean({ default: false }),
    open: Schema.Control.Boolean({ default: false }),
    variant: Schema.Control.Select(["quiet", "bright"], { default: "quiet" }),
  },
  states: {
    initial: {},
    loading: { props: { loading: true } },
    expanded: { props: { open: true } },
  },
});

function Example(props: Schema.Props<typeof schema>) {
  return createElement("div", null, props.size);
}

test("schema.from binds the component and applies each snapshot over normalized shared props", () => {
  const entry = schema.from(Example);
  const loading = entry.render({ size: 60, variant: "bright" }, "loading");

  assert.equal(loading.type, Example);
  assert.deepEqual(loading.props, { size: 60, loading: true, open: false, variant: "bright" });
  assert.deepEqual(entry.render({ size: 60 }, "expanded").props, {
    size: 60,
    loading: false,
    open: true,
    variant: "quiet",
  });
  assert.deepEqual(entry.parse({ variant: "invalid", unknown: "ignored" }), schema.defaults);
  assert.throws(() => entry.render({}, "missing"), /Unknown state/);
});

test("automatic ids follow entry paths, explicit ids survive moves, and collisions are reported", () => {
  const bound = schema.from(Example);

  const entries = resolveComponents({
    "@drafts/components/maps/pin/index.ts": { default: bound },
    "@drafts/components/buttons/pin/index.ts": { default: bound },
  });

  assert.deepEqual(
    entries.map(({ id }) => id),
    ["buttons/pin", "maps/pin"],
  );
  assert.equal(entries[0].states[0]?.name, "Initial");
  const pinned = { ...bound, id: "stable-pin" };

  assert.equal(
    resolveComponents({ "@drafts/components/renamed/index.ts": { default: pinned } })[0].id,
    "stable-pin",
  );
  assert.throws(
    () => resolveComponents({ a: { default: pinned }, b: { default: pinned } }),
    /Duplicate component id/,
  );
  assert.throws(() => resolveComponents({}), /Add a component entry/);
});

test("invalid control configuration and invalid snapshot props fail at schema creation", () => {
  assert.throws(() => Schema.Control.Number({ default: 101 }), /within bounds/);
  assert.throws(() => Schema.Control.Number({ default: 1, min: 2, max: 1 }), /bounds/);
  assert.throws(() => Schema.Control.Color({ default: "red" }), /six-digit/);
  assert.throws(() => Schema.Control.Text({ default: "too long", maxLength: 2 }), /maximum length/);
  assert.throws(
    () =>
      Schema.Component("Example", {
        controls: { size: Schema.Control.Number({ default: 10, max: 20 }) },
        states: { invalid: { props: { size: 50 } } },
      }),
    /Invalid prop/,
  );
});
