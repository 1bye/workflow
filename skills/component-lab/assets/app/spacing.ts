export type Rect = { x: number; y: number; width: number; height: number };
export type Edges = { top: number; right: number; bottom: number; left: number };
export type Region = Rect & { kind: "margin" | "padding" | "gap"; label: string; value: number };

export function paddingRegions(box: Rect, edges: Edges): Region[] {
  const top = Math.min(edges.top, box.height);
  const bottom = Math.min(edges.bottom, box.height - top);
  const left = Math.min(edges.left, box.width);
  const right = Math.min(edges.right, box.width - left);

  return [
    { ...box, height: top, label: "Padding top", value: edges.top },
    {
      ...box,
      y: box.y + box.height - bottom,
      height: bottom,
      label: "Padding bottom",
      value: edges.bottom,
    },
    {
      x: box.x,
      y: box.y + top,
      width: left,
      height: box.height - top - bottom,
      label: "Padding left",
      value: edges.left,
    },
    {
      x: box.x + box.width - right,
      y: box.y + top,
      width: right,
      height: box.height - top - bottom,
      label: "Padding right",
      value: edges.right,
    },
  ]
    .filter((region) => region.width > 0 && region.height > 0)
    .map((region) => ({ ...region, kind: "padding" }));
}
export function marginRegions(box: Rect, edges: Edges): Region[] {
  const horizontal = {
    x: box.x - Math.max(0, edges.left),
    width: box.width + Math.max(0, edges.left) + Math.max(0, edges.right),
  };

  return [
    {
      ...horizontal,
      y: edges.top >= 0 ? box.y - edges.top : box.y,
      height: Math.abs(edges.top),
      label: "Margin top",
      value: edges.top,
    },
    {
      ...horizontal,
      y: edges.bottom >= 0 ? box.y + box.height : box.y + box.height + edges.bottom,
      height: Math.abs(edges.bottom),
      label: "Margin bottom",
      value: edges.bottom,
    },
    {
      x: edges.left >= 0 ? box.x - edges.left : box.x,
      y: box.y,
      width: Math.abs(edges.left),
      height: box.height,
      label: "Margin left",
      value: edges.left,
    },
    {
      x: edges.right >= 0 ? box.x + box.width : box.x + box.width + edges.right,
      y: box.y,
      width: Math.abs(edges.right),
      height: box.height,
      label: "Margin right",
      value: edges.right,
    },
  ]
    .filter((region) => region.width > 0 && region.height > 0)
    .map((region) => ({ ...region, kind: "margin" }));
}

// Show the CSS gap, not extra space supplied by justify-content or child margins.
export function gapRegions(children: Rect[], columnGap: number, rowGap: number): Region[] {
  const regions: Region[] = [];

  for (const box of children) {
    if (columnGap > 0) {
      const next = children
        .filter(
          (other) =>
            other.x >= box.x + box.width - 0.5 &&
            Math.min(box.y + box.height, other.y + other.height) > Math.max(box.y, other.y),
        )
        .sort((a, b) => a.x - b.x)[0];

      if (next) {
        const distance = next.x - box.x - box.width;

        if (distance >= columnGap - 0.5)
          regions.push({
            x: box.x + box.width + (distance - columnGap) / 2,
            y: Math.max(box.y, next.y),
            width: columnGap,
            height: Math.min(box.y + box.height, next.y + next.height) - Math.max(box.y, next.y),
            kind: "gap",
            label: "Column gap",
            value: columnGap,
          });
      }
    }

    if (rowGap > 0) {
      const next = children
        .filter(
          (other) =>
            other.y >= box.y + box.height - 0.5 &&
            Math.min(box.x + box.width, other.x + other.width) > Math.max(box.x, other.x),
        )
        .sort((a, b) => a.y - b.y)[0];

      if (next) {
        const distance = next.y - box.y - box.height;

        if (distance >= rowGap - 0.5)
          regions.push({
            x: Math.max(box.x, next.x),
            y: box.y + box.height + (distance - rowGap) / 2,
            width: Math.min(box.x + box.width, next.x + next.width) - Math.max(box.x, next.x),
            height: rowGap,
            kind: "gap",
            label: "Row gap",
            value: rowGap,
          });
      }
    }
  }

  return regions;
}
