import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTheme } from "../assets/app/theme.ts";
import { isRenderMessage } from "../assets/app/types.ts";

test("a saved theme overrides the system, with invalid preferences falling back to the system", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme("invalid", false), "light");
});

test("preview messages require a valid interface theme", () => {
  const message = { type: "render", id: "pin", props: {}, theme: "dark" };

  assert.equal(isRenderMessage(message), true);
  assert.equal(isRenderMessage({ ...message, theme: "light" }), true);
  assert.equal(isRenderMessage({ ...message, theme: "invalid" }), false);
  assert.equal(isRenderMessage({ ...message, theme: undefined }), false);
});
