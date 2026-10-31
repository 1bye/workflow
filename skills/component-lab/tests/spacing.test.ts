import assert from "node:assert/strict";
import { test } from "node:test";
import { paddingRegions, marginRegions, gapRegions } from "../assets/app/spacing.ts";
import { isRenderMessage } from "../assets/app/types.ts";
import { canvasMessage } from "./messages.ts";

const box = { x: 100, y: 100, width: 100, height: 80 };

test("padding fills the inner edges without overlapping or covering content", () => {
  const bands = paddingRegions(box, { top: 10, right: 20, bottom: 10, left: 20 });

  assert.equal(bands.length, 4);
  assert.equal(
    bands.reduce((area, band) => area + band.width * band.height, 0),
    4400,
  );
  assert.deepEqual(
    bands.find((band) => band.label === "Padding left"),
    { x: 100, y: 110, width: 20, height: 60, kind: "padding", label: "Padding left", value: 20 },
  );
  assert.equal(paddingRegions(box, { top: 0, right: 0, bottom: 0, left: 0 }).length, 0);
  assert.ok(
    paddingRegions(box, { top: 100, right: 200, bottom: 100, left: 200 }).every(
      (band) => band.width >= 0 && band.height >= 0,
    ),
  );
});

test("margins extend beyond the border box and retain negative values", () => {
  const bands = marginRegions(box, { top: 12, right: 0, bottom: -8, left: 5 });

  assert.equal(bands.find((band) => band.label === "Margin top")?.y, 88);
  assert.equal(bands.find((band) => band.label === "Margin left")?.x, 95);
  assert.equal(bands.find((band) => band.label === "Margin bottom")?.value, -8);
  assert.equal(bands.find((band) => band.label === "Margin bottom")?.y, 172);
});

test("gap previews use CSS sizes between adjacent items and handle wrapped rows", () => {
  const children = [
    { x: 0, y: 0, width: 40, height: 20 },
    { x: 60, y: 0, width: 40, height: 20 },
    { x: 0, y: 32, width: 40, height: 20 },
    { x: 60, y: 32, width: 40, height: 20 },
  ];

  const gaps = gapRegions(children, 10, 12);

  assert.equal(gaps.filter((gap) => gap.label === "Column gap").length, 2);
  assert.equal(gaps.filter((gap) => gap.label === "Row gap").length, 2);
  assert.equal(gaps[0]!.width, 10); // Remaining distributed space is not painted as gap.
  assert.deepEqual(gapRegions(children, 0, 0), []);
  assert.equal(gapRegions([{ x: 0, y: 0, width: 40, height: 20 }], 10, 10).length, 0);
});

test("the preview accepts only a boolean spacing-inspector flag", () => {
  const message = canvasMessage({});

  assert.equal(isRenderMessage(message), true);
  assert.equal(isRenderMessage({ ...message, inspectSpacing: true }), true);
  assert.equal(isRenderMessage({ ...message, inspectSpacing: "true" }), false);
});
