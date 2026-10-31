import type { Edges, Rect, Region } from "./spacing";

export function regionDistance(region: Rect, x: number, y: number) {
  return Math.hypot(
    Math.max(region.x - x, 0, x - region.x - region.width),
    Math.max(region.y - y, 0, y - region.y - region.height),
  );
}

export function handleScore(region: Region, x: number, y: number, alt: boolean) {
  const distance = regionDistance(region, x, y);

  if (distance > 10 || (alt && region.kind !== "margin")) return null;

  // Visible margins take priority over nearby zero-padding handles.
  if (region.kind === "margin" && !alt && (!region.value || distance > 0)) return null;

  return distance + (region.kind === "margin" ? -4 : region.kind === "gap" ? -2 : 0);
}

export function edgeHandles(box: Rect, edges: Edges, kind: "padding" | "margin"): Region[] {
  return (["top", "right", "bottom", "left"] as const).map((side) => {
    const value = edges[side];
    const outside = kind === "margin" && value >= 0;
    const size = Math.abs(value);
    const horizontal = side === "top" || side === "bottom";
    let x = box.x;
    let y = box.y;

    if (side === "top") y += outside ? -size : 0;

    if (side === "bottom") y += box.height - (outside ? 0 : size);

    if (side === "left") x += outside ? -size : 0;

    if (side === "right") x += box.width - (outside ? 0 : size);

    return {
      x,
      y,
      width: horizontal ? box.width : size,
      height: horizontal ? size : box.height,
      kind,
      label: `${kind === "margin" ? "Margin" : "Padding"} ${side}`,
      value,
    };
  });
}

// Zero CSS gaps still have a target at the boundary between adjacent children.
export function gapHandles(children: Rect[], columnGap: number, rowGap: number): Region[] {
  const result: Region[] = [];

  for (const box of children) {
    const right = children
      .filter(
        (other) =>
          other !== box &&
          other.x >= box.x + box.width - 0.5 &&
          Math.min(box.y + box.height, other.y + other.height) > Math.max(box.y, other.y),
      )
      .sort((a, b) => a.x - b.x)[0];

    if (right) {
      const distance = right.x - box.x - box.width;

      if (distance >= columnGap - 0.5)
        result.push({
          x: box.x + box.width + (distance - columnGap) / 2,
          y: Math.max(box.y, right.y),
          width: columnGap,
          height: Math.min(box.y + box.height, right.y + right.height) - Math.max(box.y, right.y),
          kind: "gap",
          label: "Column gap",
          value: columnGap,
        });
    }

    const below = children
      .filter(
        (other) =>
          other !== box &&
          other.y >= box.y + box.height - 0.5 &&
          Math.min(box.x + box.width, other.x + other.width) > Math.max(box.x, other.x),
      )
      .sort((a, b) => a.y - b.y)[0];

    if (below) {
      const distance = below.y - box.y - box.height;

      if (distance >= rowGap - 0.5)
        result.push({
          x: Math.max(box.x, below.x),
          y: box.y + box.height + (distance - rowGap) / 2,
          width: Math.min(box.x + box.width, below.x + below.width) - Math.max(box.x, below.x),
          height: rowGap,
          kind: "gap",
          label: "Row gap",
          value: rowGap,
        });
    }
  }

  return result;
}

export function handlePoint(region: Rect, x: number, y: number, vertical: boolean) {
  const clamp = (value: number, start: number, length: number) =>
    length < 24 ? start + length / 2 : Math.max(start + 12, Math.min(start + length - 12, value));

  return vertical
    ? { x: region.x + region.width / 2, y: clamp(y, region.y, region.height) }
    : { x: clamp(x, region.x, region.width), y: region.y + region.height / 2 };
}
