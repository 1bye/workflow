/** Real viewer gestures, stroke geometry, and compact routing; synthetic events, no browser required. */
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const viewer = readFileSync(new URL("../skills/atlas/viewer/index.html", import.meta.url), "utf8");

function input() {
  const state = { view: { x: 30, y: 50, k: 2 } };
  const listeners = new Map<string, (event: object) => void>();

  const context = createContext({
    state,
    world: { style: { opacity: 1 } },
    cancelViewAnimation() {},
    svg: {
      addEventListener: (name: string, handler: (event: object) => void) => listeners.set(name, handler),
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 800, height: 600 }),
    },
    applyView() {},
  });

  runInContext(viewer.slice(viewer.indexOf("// ---------- input ----------"), viewer.indexOf('window.addEventListener("keydown"')), context);

  const send = (name: string, props = {}) => {
    let prevented = false;

    const event = {
      deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, metaKey: false,
      clientX: 260, clientY: 220, scale: 1,
      preventDefault() { prevented = true; },
      ...props,
    };

    listeners.get(name)!(event);
    expect(prevented).toBe(true);
  };

  return { state, send };
}

test("two-finger scrolling pans both axes in screen pixels without changing zoom", () => {
  const { state, send } = input();

  send("wheel", { deltaX: 40, deltaY: -25 });
  expect(state.view).toEqual({ x: -10, y: 75, k: 2 });
  send("wheel", { deltaX: -8, deltaY: 12 });
  expect(state.view).toEqual({ x: -2, y: 63, k: 2 });
});

test("wheel panning normalizes line and page units", () => {
  const { state, send } = input();

  send("wheel", { deltaX: 2, deltaY: 3, deltaMode: 1 });
  expect(state.view).toEqual({ x: -2, y: 2, k: 2 });
  send("wheel", { deltaY: 1, deltaMode: 2 });
  expect(state.view).toEqual({ x: -2, y: -598, k: 2 });
});

test("pinch and modifier-wheel zoom stay anchored at the cursor and respect limits", () => {
  for (const key of ["ctrlKey", "metaKey"]) {
    const { state, send } = input();
    const point = { x: (250 - state.view.x) / state.view.k, y: (200 - state.view.y) / state.view.k };

    for (const deltaY of [-10, -10000, 10000]) {
      send("wheel", { deltaY, [key]: true });
      expect((250 - state.view.x) / state.view.k).toBeCloseTo(point.x);
      expect((200 - state.view.y) / state.view.k).toBeCloseTo(point.y);
      expect(state.view.k).toBeGreaterThanOrEqual(0.15);
      expect(state.view.k).toBeLessThanOrEqual(4);
    }

    expect(state.view.k).toBe(0.15);
  }
});

test("Safari pinch scale is relative to gesture start, and ends cleanly", () => {
  const { state, send } = input();

  send("gesturestart");
  send("gesturechange", { scale: 1.2 });
  expect(state.view.k).toBeCloseTo(2.4);
  send("gesturechange", { scale: 1.5 });
  expect(state.view.k).toBe(3);
  send("gestureend");
  send("gesturechange", { scale: 2 });
  expect(state.view.k).toBe(3);
  send("gesturestart");
  send("gesturechange", { scale: 0.5 });
  expect(state.view.k).toBe(1.5);
});

test("clean strokes round corners and preserve connection endpoints", () => {
  const context = createContext({});

  runInContext(viewer.slice(viewer.indexOf("// Straight runs"), viewer.indexOf("// Lucide icons")), context);

  const { linePath, boxPath } = runInContext("({ linePath, boxPath })", context) as {
    linePath: (points: { x: number; y: number }[]) => string;
    boxPath: (w: number, h: number, r: number) => string;
  };

  const points = [{ x: 10, y: 20 }, { x: 100, y: 20 }, { x: 100, y: 150 }];
  const path = linePath(points);

  expect(path.startsWith("M10 20 ")).toBe(true);
  expect(path.endsWith("100 150")).toBe(true);
  expect(path).toContain("Q100 20 ");
  expect(linePath([{ x: 0, y: 0 }, { x: 0, y: 0 }])).not.toMatch(/NaN|Infinity/);
  expect(boxPath(150, 56, 10).endsWith("Z")).toBe(true);
  expect(boxPath(150, 56, 10)).not.toMatch(/NaN|Infinity/);
});

type Box = { id: string; p: string; x: number; y: number; w: number; h: number; frame?: boolean };
type Point = { x: number; y: number };
type Route = { pts: Point[]; label: false | { x: number; y: number; width: number; height: number } };
type Arc = { a: Point; b: Point; c1: Point; c2: Point };
type Meaning = { s: string; t: string; fwd: boolean; back: boolean };
type BundleEdge = { s: string; t: string; m: Meaning; text: string; pts?: Point[]; arcs?: Arc[] };
type Connector = { m: Meaning; strokes: { arcs?: Arc[]; pts?: Point[]; startArrow: boolean; endArrow: boolean }[]; label?: false | { text: string; x: number; y: number; width: number; height: number } };

function compactHelpers() {
  const model = {
    title: "Fixture",
    nodes: [
      { id: "screen", label: "Screen", kind: "client" },
      { id: "server", label: "Server", kind: "service", display: "frame", children: [
        { id: "input", label: "Input", kind: "module" },
        { id: "worker", label: "Worker", kind: "module" },
      ] },
      { id: "storage", label: "Storage", kind: "db" },
      { id: "shared", label: "Shared", kind: "store" },
    ],
  };

  const source = viewer.slice(viewer.indexOf("const MODEL ="), viewer.indexOf("// ---------- rendering ----------"))
    .replace("/*__ATLAS_MODEL__*/null", JSON.stringify(model));

  const context = createContext({ document: { getElementById: () => ({}) }, window: {}, structuredClone });

  runInContext(source, context);

  return { context, ...runInContext("({ compactGraph, compactRoute, layoutCost, readLayout, bundleEdges, inlineLabel })", context) } as {
    context: ReturnType<typeof createContext>;
    compactGraph: (graph: object, boxes: Map<string, object>, drawn: object[]) => { graph: { children: { id: string; children?: { id: string }[] }[]; edges: { id: string }[] }; deferred: Set<string> };
    compactRoute: (edge: { s: string; t: string; text: string }, boxes: Map<string, Box>, traffic?: BundleEdge[]) => Route | null;
    layoutCost: (layout: { w: number; h: number }) => number;
    readLayout: (graph: object, boxes: Map<string, Box>, drawn: object[], deferred: Set<string>) => object | null;
    bundleEdges: (layout: { boxes: Map<string, Box>; edges: BundleEdge[] }) => Connector[];
    inlineLabel: (points: Point[], label: { x: number; y: number; width: number; height: number; text: string }) => { x: number; y: number; width: number; height: number; text: string };
  };
}

test("only containers with internal connections open, and cards show descriptions instead of counts", () => {
  const child = { id: "part", label: "Part", kind: "module" };

  const model = { title: "Fixture", nodes: [
    { id: "api", label: "API", kind: "module", display: "chips", desc: "Commands for clients.", children: [child] },
    { id: "bot", label: "Bot", kind: "process", desc: "An independent OS process.", children: [child, { ...child, id: "other" }] },
    { id: "relay", label: "Relay", kind: "service", display: "frame", children: [child, { ...child, id: "other" }] },
    { id: "empty", label: "Empty", kind: "module", children: [child] },
    { id: "leaf", label: "Leaf", kind: "module" },
  ], edges: [
    { from: "api.part", to: "leaf" },
    { from: "bot.part", to: "bot.other" },
    { from: "relay.part", to: "relay.other" },
    { from: "empty", to: "empty.part" },
  ] };

  const context = createContext({ document: { getElementById: () => ({}) } });

  runInContext(viewer.slice(viewer.indexOf("const MODEL ="), viewer.indexOf("// ---------- layout ----------"))
    .replace("/*__ATLAS_MODEL__*/null", JSON.stringify(model)), context);
  runInContext(`
    const state = { sel: null }, visits = [];
    let dragMoved = false;
    function el(tag, attrs = {}, parent) {
      const e = { tag, attrs, children: [], handlers: {},
        setAttribute(k, v) { this.attrs[k] = v; },
        addEventListener(k, v) { this.handlers[k] = v; } };
      if (parent) parent.children.push(e);
      return e;
    }
    function boxPath() { return ""; }
    function icon(parent) { return el("g", {}, parent); }
    function drill(b) { visits.push(b.p); }
    function select() {}
  `, context);
  runInContext(viewer.slice(viewer.indexOf("function text("), viewer.indexOf("// Straight runs")), context);
  runInContext(viewer.slice(viewer.indexOf("function shell("), viewer.indexOf("function select(")), context);

  for (const p of ["bot", "relay"]) {
    runInContext(`
      var n = byPath.get(${JSON.stringify(p)}), b = { p: n.path, id: n.path, ...size(n, false) };
      var g = shell(null, b, []).g, heading = g.children.find(c => c.attrs.role === "button");
    `, context);
    expect(runInContext('heading.attrs["aria-label"]', context)).toBe("Open " + model.nodes.find((n) => n.id === p)!.label);
    expect(runInContext("heading.attrs.tabindex", context)).toBe("0");
    expect(runInContext('heading.children.some(c => /\\d+ components?/.test(c.textContent || ""))', context)).toBe(false);
    runInContext('heading.handlers.click({ stopPropagation() {} }); heading.handlers.keydown({ key: "Enter", preventDefault() {}, stopPropagation() {} }); heading.handlers.keydown({ key: " ", preventDefault() {}, stopPropagation() {} });', context);
    expect(runInContext("visits.slice(-3)", context)).toEqual([p, p, p]);
  }

  expect(runInContext('size(byPath.get("bot"), false).h', context)).toBe(92);
  expect(runInContext('size(byPath.get("api"), false).h', context)).toBe(134);
  expect(runInContext('shell(null, { p: "api", w: 280, h: 152 }, []).g.children.some(c => c.textContent === "Commands for clients.")', context)).toBe(true);
  expect(runInContext('summaryLines(byPath.get("bot"), 164).join(" ")', context)).toBe("An independent OS process.");
  expect(runInContext('summaryLines({desc: "A long description with enough words to require more than two lines in this card."}, 100).length', context)).toBe(2);
  expect(runInContext('summaryLines({desc: "A long description with enough words to require more than two lines in this card."}, 100)[1].endsWith("…")', context)).toBe(true);

  for (const p of ["api", "empty", "leaf"]) {
    expect(runInContext(`drillable(byPath.get(${JSON.stringify(p)}))`, context)).toBe(false);
    expect(runInContext(`shell(null, { p: ${JSON.stringify(p)}, w: 280, h: 152 }, []).g.children.some(c => c.attrs.role === "button")`, context)).toBe(false);
  }

  expect(runInContext('shell(null, { p: "bot", w: 160, h: 76, ghost: true }, []).g.children.some(c => c.attrs.role === "button")', context)).toBe(false);
  expect(runInContext('drillable(byPath.get("leaf"))', context)).toBe(false);
});

test("compact packing stacks local parts and single-use leaves without moving shared data into a frame", () => {
  const { compactGraph, context } = compactHelpers();

  const graph = {
    id: "root", layoutOptions: {}, children: [
      { id: "screen", width: 150, height: 80 },
      { id: "server", layoutOptions: {}, children: [
        { id: "server.input", width: 200, height: 80 },
        { id: "server.worker", width: 200, height: 80 },
      ] },
      { id: "storage", width: 150, height: 80 },
      { id: "shared", width: 150, height: 80 },
    ],
    edges: [0, 1, 2, 3, 4].map((i) => ({ id: "e" + i })),
  };

  const boxes = new Map(["screen", "server", "server.input", "server.worker", "storage", "shared"].map((p) => [p, { p, frame: p === "server" }]));

  const drawn = [
    { s: "screen", t: "server.input" },
    { s: "server.input", t: "server.worker" },
    { s: "server.input", t: "storage" },
    { s: "server.input", t: "shared" },
    { s: "server.worker", t: "shared" },
  ];

  const compact = compactGraph(graph, boxes, drawn);

  expect(compact.graph.children[0]!.children!.map((n) => n.id)).toEqual(["screen", "server", "storage"]);
  expect(compact.graph.children[1]!.id).toBe("shared");
  expect([...compact.deferred]).toEqual(["e1", "e0", "e2"]);
  expect(compact.graph.edges.map((e) => e.id)).toEqual(["e3", "e4"]);
  expect(graph.children.map((n) => n.id)).toEqual(["screen", "server", "storage", "shared"]);
  expect(runInContext('byPath.get("storage").parent.path', context)).toBe("");
});

test("compact connections avoid intervening nodes and keep labels off frame borders", () => {
  const { compactRoute } = compactHelpers();

  const boxes = new Map<string, Box>([
    ["server", { id: "server", p: "server", x: 80, y: 40, w: 240, h: 320, frame: true }],
    ["server.input", { id: "server.input", p: "server.input", x: 100, y: 100, w: 200, h: 80 }],
    ["server.worker", { id: "server.worker", p: "server.worker", x: 100, y: 260, w: 200, h: 80 }],
    ["storage", { id: "storage", p: "storage", x: 130, y: 430, w: 140, h: 68 }],
  ]);

  const edge = { s: "server.input", t: "storage", text: "records" };
  const route = compactRoute(edge, boxes)!;
  const worker = boxes.get("server.worker")!;

  expect(route).not.toBeNull();
  expect(route.label).toBeTruthy();

  for (let i = 1; i < route.pts.length; i++) {
    const a = route.pts[i - 1]!, b = route.pts[i]!;

    expect(a.x === b.x || a.y === b.y).toBe(true);

    if (a.x === b.x && a.x > worker.x && a.x < worker.x + worker.w) {
      expect(Math.max(a.y, b.y) <= worker.y || Math.min(a.y, b.y) >= worker.y + worker.h).toBe(true);
    }

    if (a.y === b.y && a.y > worker.y && a.y < worker.y + worker.h) {
      expect(Math.max(a.x, b.x) <= worker.x || Math.min(a.x, b.x) >= worker.x + worker.w).toBe(true);
    }
  }

  if (route.label) {
    const label = route.label, frame = boxes.get("server")!;
    const inside = label.x > frame.x && label.x + label.width < frame.x + frame.w && label.y > frame.y && label.y + label.height < frame.y + frame.h;
    const outside = label.x + label.width < frame.x || label.x > frame.x + frame.w || label.y + label.height < frame.y || label.y > frame.y + frame.h;

    expect(inside || outside).toBe(true);
  }
});

test("a blocked compact route rejects the candidate so standard routing can be kept", () => {
  const { compactRoute, readLayout, layoutCost } = compactHelpers();

  const boxes = new Map<string, Box>([
    ["a", { id: "a", p: "a", x: 100, y: 100, w: 50, h: 50 }],
    ["b", { id: "b", p: "b", x: 300, y: 100, w: 50, h: 50 }],
    ["wall", { id: "wall", p: "wall", x: 70, y: 70, w: 120, h: 120 }],
  ]);

  const edge = { s: "a", t: "b", text: "blocked" };

  expect(compactRoute(edge, boxes)).toBeNull();
  expect(readLayout({ width: 400, height: 200, children: [], edges: [] }, boxes, [edge], new Set(["e0"]))).toBeNull();
  expect(layoutCost({ w: 1400, h: 1000 })).toBeLessThan(layoutCost({ w: 2800, h: 500 }));
});

test("external routes exit frames immediately and never cross frame headings", () => {
  const { compactRoute, readLayout } = compactHelpers();
  const frame = { id: "server", p: "server", x: 100, y: 220, w: 320, h: 480, frame: true };

  const boxes = new Map<string, Box>([
    ["server", frame],
    ["server.input", { id: "server.input", p: "server.input", x: 124, y: 320, w: 272, h: 120 }],
    ["server.worker", { id: "server.worker", p: "server.worker", x: 124, y: 540, w: 272, h: 120 }],
    ["screen", { id: "screen", p: "screen", x: 148, y: 32, w: 240, h: 100 }],
    ["storage", { id: "storage", p: "storage", x: 220, y: 820, w: 80, h: 96 }],
  ]);

  for (const [s, t, text] of [
    ["server.input", "storage", "records"], ["storage", "server.input", "records"],
    ["screen", "server.input", "commands · events"], ["server.input", "screen", "commands · events"],
  ]) {
    const edge = { s: s!, t: t!, text: text! };
    const route = compactRoute(edge, boxes)!;

    expect(route).not.toBeNull();
    expect(route.label).toBeTruthy();

    for (let i = 1; i < route.pts.length; i++) {
      const a = route.pts[i - 1]!, b = route.pts[i]!;
      const insideX = Math.max(a.x, b.x) > frame.x && Math.min(a.x, b.x) < frame.x + frame.w;
      const insideY = Math.max(a.y, b.y) > frame.y && Math.min(a.y, b.y) < frame.y + frame.h;

      if (insideX && insideY) {
        expect(i === 1 || i === route.pts.length - 1).toBe(true);
        expect(a.y).toBe(b.y);
        expect(a.y).toBeGreaterThan(frame.y + 40);
      }
    }

    if (route.label) {
      const l = route.label;

      expect(l.x + l.width <= frame.x || l.x >= frame.x + frame.w || l.y + l.height <= frame.y || l.y >= frame.y + frame.h).toBe(true);
    }

    // Even a standard engine route through the heading must be replaced.
    const result = readLayout({ width: 700, height: 1000, children: [], edges: [{
      id: "e0", sections: [{ startPoint: { x: 260, y: 132 }, endPoint: { x: 260, y: 320 } }],
    }] }, boxes, [edge], new Set()) as { edges: Route[] };

    expect(result.edges[0]!.pts).toEqual(route.pts);
  }
});

test("nested frame exits stay straight through every ancestor boundary", () => {
  const { compactRoute } = compactHelpers();

  const frames = [
    { id: "server", p: "server", x: 100, y: 160, w: 360, h: 540, frame: true },
    { id: "server.input", p: "server.input", x: 124, y: 240, w: 312, h: 250, frame: true },
  ];

  const boxes = new Map<string, Box>([
    ...frames.map((f): [string, Box] => [f.id, f]),
    ["part", { id: "part", p: "server.input.part", x: 148, y: 320, w: 264, h: 100 }],
    ["storage", { id: "storage", p: "storage", x: 240, y: 820, w: 80, h: 96 }],
  ]);

  const route = compactRoute({ s: "part", t: "storage", text: "records" }, boxes)!;

  expect(route).not.toBeNull();

  for (const frame of frames) for (let i = 1; i < route.pts.length; i++) {
    const a = route.pts[i - 1]!, b = route.pts[i]!;

    if (Math.max(a.x, b.x) > frame.x && Math.min(a.x, b.x) < frame.x + frame.w && Math.max(a.y, b.y) > frame.y && Math.min(a.y, b.y) < frame.y + frame.h) {
      expect(i).toBe(1);
      expect(a.y).toBe(b.y);
      expect(a.y).toBeGreaterThan(frame.y + 40);
    }
  }
});

test("links above and below a frame avoid the side used by its lateral trunk", () => {
  const { compactRoute, readLayout, bundleEdges } = compactHelpers();

  for (const mirrored of [false, true]) {
    const boxes = new Map<string, Box>([
      ["server", { id: "server", p: "server", x: 100, y: 220, w: 320, h: 480, frame: true }],
      ["server.input", { id: "server.input", p: "server.input", x: 124, y: 320, w: 272, h: 120 }],
      ["server.worker", { id: "server.worker", p: "server.worker", x: 124, y: 540, w: 272, h: 120 }],
      ["screen", { id: "screen", p: "screen", x: 168, y: 32, w: 240, h: 100 }],
      ["storage", { id: "storage", p: "storage", x: 240, y: 820, w: 80, h: 96 }],
      ...[350, 500, 650].map((y, i): [string, Box] => ["worker" + i, { id: "worker" + i, p: "worker", x: 750, y, w: 160, h: 80 }]),
    ]);

    const trunk = { s: "server.worker", t: "worker", fwd: true, back: false };

    const traffic: BundleEdge[] = [
      { s: "screen", t: "server.input", text: "commands · events", m: { s: "screen", t: "server.input", fwd: true, back: true },
        pts: [{ x: 288, y: 132 }, { x: 288, y: 156 }, { x: 444, y: 156 }, { x: 444, y: 380 }, { x: 396, y: 380 }] },
      { s: "server.input", t: "storage", text: "records", m: { s: "server.input", t: "storage", fwd: true, back: true },
        pts: [{ x: 396, y: 380 }, { x: 444, y: 380 }, { x: 444, y: 868 }, { x: 320, y: 868 }] },
      ...[390, 540, 690].map((y, i) => ({ s: "server.worker", t: "worker" + i, text: "worker protocol", m: trunk,
        pts: [{ x: 396, y: 600 }, { x: 700, y: 600 }, { x: 700, y }, { x: 750, y }] })),
    ];

    if (mirrored) {
      for (const b of boxes.values()) b.x = 1100 - b.x - b.w;

      for (const edge of traffic) for (const p of edge.pts!) p.x = 1100 - p.x;
    }

    const api = boxes.get("server.input")!;
    const exit = mirrored ? api.x + api.w : api.x;
    const ui = compactRoute(traffic[0]!, boxes, traffic)!;
    const db = compactRoute(traffic[1]!, boxes, traffic)!;
    const worker = compactRoute(traffic[2]!, boxes, traffic)!;

    expect(ui.pts.at(-1)!.x).toBe(exit);
    expect(db.pts[0]!.x).toBe(exit);
    expect(worker.pts[0]!.x).toBe(mirrored ? 704 : 396);
    expect(worker.pts[1]!.y).toBe(600);

    if (!mirrored) {
      const graph = { width: 1200, height: 1000, children: [], edges: traffic.map((e, i) => ({ id: "e" + i,
        sections: [{ startPoint: e.pts![0], bendPoints: e.pts!.slice(1, -1), endPoint: e.pts!.at(-1) }],
      })) };

      const result = readLayout(graph, boxes, traffic, new Set()) as { boxes: Map<string, Box>; edges: BundleEdge[] };

      expect(result.edges[0]!.pts!.at(-1)!.x).toBe(api.x);
      expect(result.edges[1]!.pts![0]!.x).toBe(api.x);
      expect(bundleEdges(result).find((c) => c.m === trunk)!.strokes).toHaveLength(4);
    }
  }
});

test("flow-only links use the frame router instead of drawing an unsafe fallback curve", () => {
  const attempts: object[] = [];

  const context = createContext({
    state: { focus: "", step: 0, flow: { steps: [{ from: "server.input", to: "storage", label: "records" }] }, layout: {
      boxes: new Map([["server.input", { id: "server.input" }], ["storage", { id: "storage" }]]), edges: [],
    } },
    proxy: (p: string) => p,
    $: () => ({ textContent: "" }),
    world: { querySelectorAll: () => [] },
    overlayAnim: null,
    compactRoute: (edge: object) => { attempts.push(edge);

 return null; },
  });

  runInContext(viewer.slice(viewer.indexOf("function showStep("), viewer.indexOf("function edgePoint(")), context);
  runInContext("showStep()", context);
  expect(attempts).toEqual([{ s: "server.input", t: "storage", text: "records" }]);
});

test("routing prefers a detour over crossing an unrelated connection", () => {
  const { compactRoute } = compactHelpers();

  const boxes = new Map<string, Box>([
    ["a", { id: "a", p: "a", x: 100, y: 200, w: 100, h: 60 }],
    ["b", { id: "b", p: "b", x: 500, y: 200, w: 100, h: 60 }],
    ["c", { id: "c", p: "c", x: 300, y: 100, w: 80, h: 60 }],
    ["d", { id: "d", p: "d", x: 300, y: 300, w: 80, h: 60 }],
  ]);

  const traffic = [{ s: "c", t: "d", text: "", m: { s: "c", t: "d", fwd: true, back: false }, pts: [{ x: 340, y: 160 }, { x: 340, y: 300 }] }];
  const edge = { s: "a", t: "b", text: "messages" };
  const route = compactRoute(edge, boxes, traffic)!;

  expect(compactRoute(edge, boxes)!.pts).toEqual([{ x: 200, y: 230 }, { x: 500, y: 230 }]);

  for (let i = 1; i < route.pts.length; i++) {
    const a = route.pts[i - 1]!, b = route.pts[i]!;

    if (a.y === b.y && Math.min(a.x, b.x) < 340 && Math.max(a.x, b.x) > 340) expect(a.y <= 160 || a.y >= 300).toBe(true);
  }
});

test("the grid fallback keeps frames as closed cards so no connection loses an endpoint", async () => {
  const { context } = compactHelpers();

  runInContext('edgesAll.push({ from: "server", to: "storage", label: "records" })', context);

  const result = await runInContext('layout(buildLevel("", null))', context) as {
    boxes: Map<string, Box>;
    edges: { s: string; t: string }[];
    connectors: Connector[];
  };

  expect(result.boxes.get("server")!.frame).toBe(false);
  expect(result.boxes.has("server.input")).toBe(true);
  expect(result.edges).toHaveLength(1);
  expect(result.edges.every((e) => result.boxes.has(e.s) && result.boxes.has(e.t))).toBe(true);
  expect(result.connectors).toHaveLength(1);
});

function repeatedConnections() {
  const boxes = new Map<string, Box>([
    ["source", { id: "source", p: "source", x: 40, y: 130, w: 120, h: 60 }],
    ...[20, 140, 260].map((y, i): [string, Box] => ["worker" + i, { id: "worker" + i, p: "worker", x: 400, y, w: 120, h: 60 }]),
    ["target", { id: "target", p: "target", x: 800, y: 140, w: 160, h: 60 }],
  ]);

  const outgoing = { s: "source", t: "worker", fwd: true, back: true };
  const incoming = { s: "worker", t: "target", fwd: true, back: false };

  const edges: BundleEdge[] = [
    ...[0, 1, 2].map((i) => ({ s: "source", t: "worker" + i, m: outgoing, text: "jobs" })),
    ...[0, 1, 2].map((i) => ({ s: "worker" + i, t: "target", m: incoming, text: "results" })),
  ];

  return { boxes, edges, outgoing, incoming };
}

test("repeated connections share trunks, preserve arrow directions, and label each relationship once", () => {
  const { bundleEdges } = compactHelpers();
  const layout = repeatedConnections();
  const positions = [...layout.boxes.values()].map((b) => ({ ...b }));
  const connectors = bundleEdges(layout);
  const out = connectors.find((c) => c.m === layout.outgoing)!;
  const into = connectors.find((c) => c.m === layout.incoming)!;

  expect(connectors).toHaveLength(2);
  expect(out.strokes).toHaveLength(4);
  expect(into.strokes).toHaveLength(4);
  expect(connectors.map((c) => c.label && c.label.text)).toEqual(["jobs", "results"]);
  expect(out.strokes.filter((s) => s.startArrow)).toHaveLength(1);
  expect(out.strokes.filter((s) => s.endArrow)).toHaveLength(3);
  expect(into.strokes.filter((s) => s.startArrow)).toHaveLength(0);
  expect(into.strokes.filter((s) => s.endArrow)).toHaveLength(1);
  expect([...layout.boxes.values()]).toEqual(positions);

  for (const connector of [out, into]) {
    const trunk = connector.strokes[0]!.arcs!;
    const sourceY = connector === out ? 160 : 170;

    expect(trunk.every((c) => c.a.y === sourceY && c.b.y === sourceY && c.c1.y === sourceY && c.c2.y === sourceY)).toBe(true);

    if (connector.label) {
      expect(connector.label.x).toBeGreaterThan(trunk[0]!.a.x);
      expect(connector.label.x + connector.label.width).toBeLessThan(trunk.at(-1)!.b.x);
      expect(connector.label.y + connector.label.height / 2).toBe(sourceY);
    }
  }

  for (let i = 0; i < 3; i++) {
    const route = layout.edges[i]!.arcs!, reverse = layout.edges[i + 3]!.arcs!;
    const worker = layout.boxes.get("worker" + i)!;

    expect(route.at(-1)!.b).toEqual({ x: worker.x, y: worker.y + worker.h / 2 });
    expect(reverse[0]!.a).toEqual({ x: worker.x + worker.w, y: worker.y + worker.h / 2 });
    expect(route[1]!.b).toEqual(out.strokes[0]!.arcs!.at(-1)!.b);
  }
});

test("connection labels sit on horizontal and vertical routes without changing their text", () => {
  const { inlineLabel } = compactHelpers();
  const label = { x: 160, y: 60, width: 80, height: 16, text: "jobs" };
  const horizontal = inlineLabel([{ x: 100, y: 100 }, { x: 300, y: 100 }], label);
  const vertical = inlineLabel([{ x: 100, y: 0 }, { x: 100, y: 200 }], label);

  expect(horizontal.x + horizontal.width / 2).toBe(200);
  expect(horizontal.y + horizontal.height / 2).toBe(100);
  expect(vertical.x + vertical.width / 2).toBe(100);
  expect(horizontal.text).toBe("jobs");
  expect(inlineLabel([{ x: 100, y: 100 }, { x: 100, y: 100 }], label)).toEqual(label);
});

test("a sibling above the trunk inside its source frame does not prevent curved bundling", () => {
  const { bundleEdges } = compactHelpers();
  const layout = repeatedConnections();

  layout.boxes.get("source")!.p = "server.worker";
  layout.boxes.set("frame", { id: "frame", p: "server", x: 20, y: 0, w: 160, h: 210, frame: true });
  layout.boxes.set("sibling", { id: "sibling", p: "server.input", x: 40, y: 20, w: 120, h: 60 });

  for (const edge of layout.edges.filter((e) => e.m === layout.outgoing)) {
    edge.pts = [{ x: 160, y: 160 }, { x: 204, y: 160 }];
  }

  expect(bundleEdges(layout).find((c) => c.m === layout.outgoing)!.strokes).toHaveLength(4);

  layout.boxes.get("sibling")!.y = 140;
  expect(bundleEdges(layout).filter((c) => c.m === layout.outgoing)).toHaveLength(3);
});

test("bundling cannot replace a safe frame exit with a different side", () => {
  const { bundleEdges } = compactHelpers();
  const layout = repeatedConnections();

  layout.boxes.get("source")!.p = "server.worker";
  layout.boxes.set("frame", { id: "frame", p: "server", x: 32, y: 0, w: 280, h: 340, frame: true });

  for (const edge of layout.edges.filter((e) => e.m === layout.outgoing)) {
    layout.boxes.get(edge.t)!.x = 700;
    edge.pts = [{ x: 40, y: 160 }, { x: 8, y: 160 }];
  }

  expect(bundleEdges(layout).filter((c) => c.m === layout.outgoing)).toHaveLength(3);
});

test("bundling leaves blocked corridors and unrelated relationships individually routed", () => {
  const { bundleEdges } = compactHelpers();
  const blocked = repeatedConnections();

  blocked.boxes.set("obstacle", { id: "obstacle", p: "obstacle", x: 240, y: 100, w: 60, h: 60 });

  const blockedConnectors = bundleEdges(blocked).filter((c) => c.m === blocked.outgoing);

  expect(blockedConnectors).toHaveLength(3);
  expect(blockedConnectors.every((c) => !c.strokes[0]!.arcs)).toBe(true);

  const separate = repeatedConnections();
  const other = { s: "source", t: "worker", fwd: false, back: true };

  separate.edges.push({ s: "source", t: "worker0", m: other, text: "health" });

  const connectors = bundleEdges(separate);

  expect(connectors).toHaveLength(3);
  expect(connectors.find((c) => c.m === other)!.strokes).toHaveLength(1);
});

test("arcs reverse cleanly for flow animations", () => {
  const context = createContext({});

  runInContext(viewer.slice(viewer.indexOf("// Straight runs"), viewer.indexOf("// Lucide icons")), context);

  const { arcPath, reverseArcs } = runInContext("({ arcPath, reverseArcs })", context) as {
    arcPath: (arcs: Arc[]) => string;
    reverseArcs: (arcs: Arc[]) => Arc[];
  };

  const arcs = [{ a: { x: 10, y: 20 }, b: { x: 210, y: 120 }, c1: { x: 110, y: 20 }, c2: { x: 110, y: 120 } }];
  const path = arcPath(arcs);

  expect(path.startsWith("M10 20 ")).toBe(true);
  expect(path.endsWith(" 210 120")).toBe(true);
  expect(path).not.toMatch(/NaN|Infinity/);
  expect(reverseArcs(reverseArcs(arcs))).toEqual(arcs);
  expect(arcPath(reverseArcs(arcs)).endsWith(" 10 20")).toBe(true);
});

test("outside and history navigation animate out while drill-in keeps its existing transition", () => {
  const renders: object[] = [];
  const handlers = new Map<string, () => void>();
  const state = { focus: "bot", sel: null as string | null, layout: {} as object | null };
  const location = { hash: "#bot" };

  const context = createContext({
    state, location, encodeURIComponent, decodeURIComponent,
    byPath: new Map([["", {}], ["bot", {}]]),
    window: { addEventListener: (name: string, fn: () => void) => handlers.set(name, fn) },
    render: (options: object) => renders.push(options),
  });

  runInContext(viewer.slice(viewer.indexOf("let pendingZoom ="), viewer.indexOf("function crumbs(")), context);
  runInContext('go("", "relay")', context);
  handlers.get("hashchange")!();
  expect(state.focus).toBe("");
  expect(state.sel).toBe("relay");
  expect(renders.at(-1)).toEqual({ zoomIn: false, zoomOut: true });

  runInContext('go("bot", null, true)', context);
  handlers.get("hashchange")!();
  expect(renders.at(-1)).toEqual({ zoomIn: true, zoomOut: false });

  location.hash = "#";
  handlers.get("hashchange")!();
  expect(renders.at(-1)).toEqual({ zoomIn: false, zoomOut: true });

  state.layout = null;
  location.hash = "#bot";
  handlers.get("hashchange")!();
  expect(renders.at(-1)).toEqual({ zoomIn: false, zoomOut: false });
});

test("floating scenarios become centered step cards and returning restores the original canvas", () => {
  const model = JSON.parse(readFileSync(new URL("../skills/atlas/examples/onbot.json", import.meta.url), "utf8"));
  const context = createContext({});

  runInContext(`
    const elements = new Map(), visits = [], renders = [];
    function fakeElement() {
      return { children: [], attrs: {}, className: "", checked: true, isConnected: true,
        offsetLeft: 0, offsetWidth: 248, clientWidth: 448, scrollLeft: 0,
        get textContent() { return this.value || ""; },
        set textContent(value) { this.value = value; this.children = []; },
        append(...children) { for (const child of children) { child.offsetLeft = this.children.length * 268 + 100; this.children.push(child); } },
        setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; },
        get classList() { const node = this; return { toggle(name, on) {
          const classes = new Set(node.className.split(" ")); on ? classes.add(name) : classes.delete(name); node.className = [...classes].join(" ");
        } }; },
        scrollTo({ left }) { this.scrollLeft = left; },
      };
    }
    const document = { createElement: fakeElement, getElementById(id) {
      if (!elements.has(id)) elements.set(id, fakeElement()); return elements.get(id);
    } };
    const state = { focus: "", flow: null, step: 0 }, cache = { clear() {} };
    function applyView() {} function stopPlay() {} function showStep() {}
    function render(options) { renders.push(options); }
    function go(p) { state.focus = p; visits.push(p); }
    function requestAnimationFrame(fn) { fn(); }
    function matchMedia() { return { matches: true }; }
  `, context);
  runInContext(viewer.slice(viewer.indexOf("const MODEL ="), viewer.indexOf("// ---------- layout ----------"))
    .replace("/*__ATLAS_MODEL__*/null", JSON.stringify(model)), context);
  runInContext(viewer.slice(viewer.indexOf("function h("), viewer.indexOf("function showStep(")), context);
  runInContext('renderScenarioDock()', context);
  expect(runInContext('$("scenario-track").children.length', context)).toBe(1);
  runInContext('$("scenario-track").children[0].onclick()', context);
  expect(runInContext('$("scenario-track").children.length', context)).toBe(12);
  expect(runInContext('$("scenario-track").children[0].attrs["aria-label"]', context)).toBe("Back to scenarios");
  expect(runInContext('$("scenario-track").children[0].className', context)).toBe("scenario-card back-card");
  expect(runInContext('$("scenario-track").children[0].attrs["aria-current"]', context)).toBeUndefined();
  expect(runInContext('$("scenario-track").children[1].attrs["aria-current"]', context)).toBe("step");
  expect(runInContext('$("scenario-track").scrollLeft', context)).toBe(268);

  for (const step of [4, 10]) {
    runInContext(`setStep(${step})`, context);
    expect(runInContext('$("scenario-track").scrollLeft', context)).toBe((step + 1) * 268);
    expect(runInContext('$("scenario-track").children.filter(c => c.className.split(" ").includes("active")).length', context)).toBe(1);
    expect(runInContext(`$("scenario-track").children[${step + 1}].attrs["aria-current"]`, context)).toBe("step");
  }

  runInContext('setStep(4)', context);
  expect(runInContext('state.focus', context)).toBe("bot");
  runInContext('$("scenario-track").children[0].onclick()', context);
  expect(runInContext('state.focus', context)).toBe("");
  expect(runInContext('$("scenario-track").className', context)).toBe("scenario-list");
  expect(runInContext('$("scenario-track").children.length', context)).toBe(1);
  runInContext('flows.splice(0); renderScenarioDock()', context);
  expect(runInContext('$("scenario-dock").hidden', context)).toBe(true);
});

test("camera transitions interpolate view and opacity, and honor reduced motion", async () => {
  for (const reducedMotion of [false, true]) {
    const frames: ((time: number) => void)[] = [];
    const state = { view: { x: 0, y: 0, k: 1 } };
    const world = { style: { opacity: 0 } };

    const context = createContext({
      state, world,
      matchMedia: () => ({ matches: reducedMotion }),
      getComputedStyle: () => ({ opacity: world.style.opacity }),
      performance: { now: () => 0 },
      requestAnimationFrame: (fn: (time: number) => void) => frames.push(fn),
      applyView() {},
    });

    runInContext(viewer.slice(viewer.indexOf("// ---------- camera animation ----------"), viewer.indexOf("async function render(")), context);

    const animation = runInContext('tween({ x: 100, y: 80, k: 0.5 }, 260, 1)', context) as Promise<boolean>;

    if (reducedMotion) expect(frames).toHaveLength(0);
    else {
      frames.shift()!(130);
      expect(state.view.k).toBeGreaterThan(0.5);
      expect(state.view.k).toBeLessThan(1);
      expect(state.view.x).toBeGreaterThan(0);
      expect(state.view.x).toBeLessThan(100);
      expect(world.style.opacity).toBeGreaterThan(0);
      expect(world.style.opacity).toBeLessThan(1);
      frames.shift()!(260);
    }

    expect(await animation).toBe(true);
    expect(state.view).toEqual({ x: 100, y: 80, k: 0.5 });
    expect(world.style.opacity).toBe(1);
  }
});

test("a new camera transition cancels the old one and settles its waiting caller", async () => {
  const frames = new Map<number, (time: number) => void>();
  const state = { view: { x: 0, y: 0, k: 1 } };
  const world = { style: { opacity: 1 } };
  let frameId = 0;

  const context = createContext({
    state, world,
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ opacity: world.style.opacity }),
    performance: { now: () => 0 },
    requestAnimationFrame: (fn: (time: number) => void) => { frames.set(++frameId, fn);

 return frameId; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    applyView() {},
  });

  runInContext(viewer.slice(viewer.indexOf("// ---------- camera animation ----------"), viewer.indexOf("async function render(")), context);

  const first = runInContext('tween({ x: 100, y: 80, k: 2 }, 260, 0)', context) as Promise<boolean>;
  const second = runInContext('tween({ x: -50, y: 40, k: 0.5 }, 260, 1)', context) as Promise<boolean>;

  expect(await first).toBe(false);
  expect(frames).toHaveLength(1);

  const [id, frame] = [...frames][0]!;

  frames.delete(id);
  frame(260);
  expect(await second).toBe(true);
  expect(state.view).toEqual({ x: -50, y: 40, k: 0.5 });
  expect(world.style.opacity).toBe(1);

  const interrupted = runInContext('tween({ x: 500, y: 400, k: 3 }, 260, 0)', context) as Promise<boolean>;

  runInContext("cancelViewAnimation()", context);
  expect(await interrupted).toBe(false);
  expect(frames).toHaveLength(0);
});

test("drill-in remembers the departure view before its temporary zoom", async () => {
  const camera = { x: 132, y: -45, k: 1.7 };
  const state = { focus: "", view: { ...camera }, layout: { focus: "" } };
  const viewMemory = new Map<string, typeof camera>();
  const visits: string[] = [];

  const context = createContext({
    state, viewMemory,
    world: { setAttribute() {} },
    svg: { getBoundingClientRect: () => ({ width: 800, height: 600 }) },
    center: (b: { x: number; y: number; w: number; h: number }) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 }),
    tween: (to: typeof camera) => { state.view = { ...to };

 return Promise.resolve(true); },
    go: (focus: string) => visits.push(focus),
  });

  runInContext(viewer.slice(viewer.indexOf("function applyView("), viewer.indexOf("function fitView(")), context);
  runInContext(viewer.slice(viewer.indexOf("async function drill("), viewer.indexOf("let pendingZoom =")), context);
  await runInContext('drill({ p: "bot", x: 200, y: 100, w: 160, h: 48 })', context);

  expect(viewMemory.get("")).toEqual(camera);
  expect(state.view.k).toBeGreaterThan(camera.k);
  expect(visits).toEqual(["bot"]);
  expect(viewMemory.get("")).not.toBe(state.view);

  state.focus = "bot";
  runInContext("applyView(true)", context);
  expect(viewMemory.has("bot")).toBe(false);
});

test("returning to a canvas restores its own pan and zoom and first visits still fit", async () => {
  const overview = { x: 132, y: -45, k: 1.7 };
  const botView = { x: -200, y: 60, k: 2.2 };
  const firstVisit = { x: 20, y: 30, k: 0.9 };
  const state = { focus: "", view: { x: -999, y: -999, k: 4 }, layout: null as object | null, flow: null };
  const viewMemory = new Map([["", { ...overview }]]);
  const world = { textContent: "", style: { opacity: 1 }, setAttribute() {} };
  let fits = 0;

  const context = createContext({
    state, viewMemory, world, renderVersion: 0, overlayAnim: null,
    svg: { getBoundingClientRect: () => ({ width: 800, height: 600 }) },
    cancelViewAnimation() {},
    $: () => ({ checked: true }),
    buildLevel() {},
    layout: async () => ({ focus: state.focus, boxes: new Map(), connectors: [], w: 100, h: 80 }),
    fitView: () => { fits++;

 return { ...firstVisit }; },
    el: () => ({}),
    crumbs() {},
    tween: (to: typeof overview, _ms: number, opacity: number) => { state.view = { ...to }; world.style.opacity = opacity;

 return Promise.resolve(true); },
  });

  runInContext(viewer.slice(viewer.indexOf("function applyView("), viewer.indexOf("function fitView(")), context);
  runInContext(viewer.slice(viewer.indexOf("async function render("), viewer.indexOf("function center(")), context);
  await runInContext("render({ zoomOut: true })", context);
  expect(state.view).toEqual(overview);
  expect(fits).toBe(0);

  state.focus = "bot";
  await runInContext("render({ zoomIn: true })", context);
  expect(state.view).toEqual(firstVisit);
  expect(fits).toBe(1);

  state.view = { ...botView };
  runInContext("applyView(true)", context);
  state.focus = "";
  await runInContext("render({ zoomOut: true })", context);
  expect(state.view).toEqual(overview);
  expect(viewMemory.get("bot")).toEqual(botView);

  state.focus = "bot";
  await runInContext("render({ zoomIn: true })", context);
  expect(state.view).toEqual(botView);
  expect(viewMemory.get("bot")).not.toBe(state.view);
  expect(fits).toBe(1);
});
