import assert from "node:assert/strict";
import { test } from "node:test";
import {
  edgeHandles,
  gapHandles,
  handlePoint,
  handleScore,
  regionDistance,
} from "../assets/app/spacing-handles.ts";

const box = { x: 100, y: 100, width: 100, height: 80 };
const zero = { top: 0, right: 0, bottom: 0, left: 0 };

test("visible margins beat inflated padding targets without needing Alt", () => {
  const margin = edgeHandles(box, { ...zero, top: 4 }, "margin")[0]!;
  const padding = edgeHandles(box, zero, "padding")[0]!;

  assert.ok(handleScore(margin, 150, 98, false)! < handleScore(padding, 150, 98, false)!);
  assert.equal(handleScore(margin, 150, 105, false), null);
  assert.equal(handleScore(padding, 150, 98, true), null);
});

test("zero margins require Alt so they do not steal padding handles", () => {
  const margin = edgeHandles(box, zero, "margin")[0]!;

  assert.equal(handleScore(margin, 150, 100, false), null);
  assert.notEqual(handleScore(margin, 150, 100, true), null);
  assert.equal(handleScore(margin, 150, 111, true), null);
});

test("zero padding has four targets and a ten pixel tolerance on either side", () => {
  const handles = edgeHandles(box, zero, "padding");

  assert.equal(handles.length, 4);
  const left = handles.find((handle) => handle.label === "Padding left")!;

  assert.equal(left.width, 0);
  assert.equal(left.value, 0);
  assert.equal(regionDistance(left, 109, 140), 9);
  assert.equal(regionDistance(left, 91, 140), 9);
  assert.ok(regionDistance(left, 111, 140) > 10);
});

test("thin padding keeps its true size while remaining easy to target", () => {
  const top = edgeHandles(box, { ...zero, top: 2 }, "padding")[0]!;

  assert.equal(top.height, 2);
  assert.equal(regionDistance(top, 150, 110), 8);
  assert.equal(regionDistance(top, 150, 95), 5);
  assert.deepEqual(handlePoint(top, 150, 110, false), { x: 150, y: 101 });
});

test("margin handles distinguish outside positive spacing and negative overlaps", () => {
  const positive = edgeHandles(box, { ...zero, left: 8 }, "margin").find(
    (handle) => handle.label === "Margin left",
  )!;

  const negative = edgeHandles(box, { ...zero, left: -8 }, "margin").find(
    (handle) => handle.label === "Margin left",
  )!;

  assert.equal(positive.x, 92);
  assert.equal(negative.x, 100);
  assert.equal(negative.value, -8);
  assert.equal(edgeHandles(box, zero, "margin").length, 4);
});

test("touching children expose zero gap handles on the correct axis", () => {
  const horizontal = [
    { x: 0, y: 0, width: 40, height: 20 },
    { x: 40, y: 0, width: 40, height: 20 },
  ];

  const handles = gapHandles(horizontal, 0, 0);

  assert.equal(handles.length, 1);
  assert.equal(handles[0]!.label, "Column gap");
  assert.equal(handles[0]!.width, 0);
  assert.equal(regionDistance(handles[0]!, 45, 10), 5);
  const vertical = gapHandles(
    [
      { x: 0, y: 0, width: 40, height: 20 },
      { x: 0, y: 20, width: 40, height: 20 },
    ],
    0,
    0,
  );

  assert.equal(vertical[0]!.label, "Row gap");
  assert.equal(vertical[0]!.height, 0);
  assert.deepEqual(gapHandles([box], 0, 0), []);
});
