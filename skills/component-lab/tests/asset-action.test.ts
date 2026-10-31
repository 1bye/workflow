import assert from "node:assert/strict";
import { test } from "node:test";
import * as Schema from "../assets/schema/index.ts";
import { isAssetSource, MAX_ASSET_BYTES } from "../assets/schema/asset.ts";
import { runAction } from "../assets/app/actions.ts";
import { isActionMessage, isActionResult, isRenderMessage } from "../assets/app/types.ts";
import { validateSettings } from "../assets/settings.ts";
import { canvasMessage } from "./messages.ts";

test("assets accept local and embedded images and normalize unsupported sources", () => {
  const schema = Schema.Component("Asset", {
    controls: { image: Schema.Control.Asset({ default: "/drafts/image.svg" }) },
  });

  for (const source of [
    "",
    "/drafts/images/photo.png",
    "/@fs/project/image.svg?import",
    "data:image/png;base64,aGVsbG8=",
    "data:image/svg+xml,%3Csvg/%3E",
    `data:image/png;base64,${"a".repeat(4096)}`,
  ]) {
    assert.equal(isAssetSource(source), true);
    const props = schema.parse({ image: source });

    assert.equal(props.image, source);
    assert.equal(isRenderMessage(canvasMessage(props)), true);
    assert.deepEqual(
      validateSettings(JSON.parse(JSON.stringify({ version: 1, components: { demo: props } })))
        .components.demo,
      props,
    );
  }

  for (const source of [
    null,
    4,
    "https://example.com/photo.png",
    "//example.com/photo.png",
    "/\\example.com/photo.png",
    "javascript:alert(1)",
    "data:text/html,hello",
    `data:image/png;base64,${"a".repeat(MAX_ASSET_BYTES * 2)}`,
  ]) {
    assert.equal(isAssetSource(source), false);
    assert.deepEqual(schema.parse({ image: source }), schema.defaults);
    assert.throws(() => Schema.Control.Asset({ default: source as string }), /local image/);
  }
});

test("actions never enter inferred props, settings, or state snapshots", () => {
  let calls = 0;

  const schema = Schema.Component("Action", {
    controls: {
      image: Schema.Control.Asset({ default: "" }),
      replay: Schema.Control.Action({
        onClick: () => {
          calls++;
        },
      }),
    },
  });

  assert.deepEqual(schema.defaults, { image: "" });
  assert.deepEqual(schema.parse({ replay: 99 }), { image: "" });
  assert.deepEqual(schema.from(() => null).render({ replay: 99 }, "default").props, { image: "" });
  assert.equal(calls, 0);
  assert.throws(
    () =>
      Schema.Component("Bad state", {
        controls: schema.controls,
        states: { invalid: { props: { replay: 1 } as never } },
      }),
    /Invalid prop/,
  );
  assert.throws(() => Schema.Control.Action({ button: " ", onClick: () => {} }), /button label/);
});

test("actions invoke each visible specimen, await callbacks, and report failures", async () => {
  const elements = [{}, {}] as HTMLElement[];
  const seen: HTMLElement[] = [];

  const controls = {
    replay: Schema.Control.Action({
      onClick: async ({ element }) => {
        await Promise.resolve();
        seen.push(element);
      },
    }),
    broken: Schema.Control.Action({
      onClick: () => {
        throw new Error("Could not replay");
      },
    }),
    text: Schema.Control.Text({ default: "" }),
  };

  await runAction(controls, "replay", elements);
  assert.deepEqual(seen, elements);
  await assert.rejects(runAction(controls, "broken", elements), /Could not replay/);
  await assert.rejects(runAction(controls, "missing", elements), /Unknown action/);
  await assert.rejects(runAction(controls, "constructor", elements), /Unknown action/);
  await assert.rejects(runAction(controls, "text", elements), /Unknown action/);
  await assert.rejects(runAction(controls, "replay", []), /not ready/);
});

test("preview action messages validate identifiers and response errors", () => {
  assert.equal(
    isActionMessage({
      type: "action",
      id: "demo",
      instanceId: "initial",
      key: "replay",
      requestId: "one",
    }),
    true,
  );
  assert.equal(
    isActionMessage({
      type: "action",
      id: "demo",
      instanceId: "initial",
      key: 1,
      requestId: "one",
    }),
    false,
  );
  assert.equal(
    isActionMessage({ type: "action", id: "demo", instanceId: "initial", key: "replay" }),
    false,
  );
  assert.equal(
    isActionMessage({ type: "action", id: "demo", key: "replay", requestId: "one" }),
    false,
  );
  assert.equal(isActionResult({ type: "action-result", requestId: "one", error: null }), true);
  assert.equal(isActionResult({ type: "action-result", requestId: "one", error: "Failed" }), true);
  assert.equal(isActionResult({ type: "action-result", requestId: "one", error: {} }), false);
});
