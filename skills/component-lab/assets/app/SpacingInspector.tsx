import { useEffect, useId, useRef, useState } from "react";
import {
  isSpacingPath,
  isSpacingProperty,
  wheelSpacing,
  type SpacingProperty,
} from "./spacing-edits";
import type { Canvas } from "./canvas";
import type { SpacingMessage } from "./types";
import type { Theme } from "./theme";
import {
  gapRegions,
  marginRegions,
  paddingRegions,
  type Edges,
  type Rect,
  type Region,
} from "./spacing";

type Measurement = { box: Rect; tag: string; regions: Region[] };
const colors = { margin: "#f5ad66", padding: "#79cda3", gap: "#b69af5" };

function measure(element: HTMLElement): Measurement {
  const rect = element.getBoundingClientRect();
  const box = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  const css = getComputedStyle(element);
  const px = (value: string) => Number.parseFloat(value) || 0;

  const layoutWidth = !Number.isFinite(Number.parseFloat(css.width))
    ? 0
    : px(css.width) +
      (css.boxSizing === "border-box"
        ? 0
        : px(css.paddingLeft) +
          px(css.paddingRight) +
          px(css.borderLeftWidth) +
          px(css.borderRightWidth));

  const layoutHeight = !Number.isFinite(Number.parseFloat(css.height))
    ? 0
    : px(css.height) +
      (css.boxSizing === "border-box"
        ? 0
        : px(css.paddingTop) +
          px(css.paddingBottom) +
          px(css.borderTopWidth) +
          px(css.borderBottomWidth));

  const scaleX = layoutWidth > 0 ? rect.width / layoutWidth : 1;
  const scaleY = layoutHeight > 0 ? rect.height / layoutHeight : 1;

  const edges = (prefix: "padding" | "margin" | "border"): Edges => ({
    top: px(css.getPropertyValue(`${prefix}-top${prefix === "border" ? "-width" : ""}`)) * scaleY,
    right:
      px(css.getPropertyValue(`${prefix}-right${prefix === "border" ? "-width" : ""}`)) * scaleX,
    bottom:
      px(css.getPropertyValue(`${prefix}-bottom${prefix === "border" ? "-width" : ""}`)) * scaleY,
    left: px(css.getPropertyValue(`${prefix}-left${prefix === "border" ? "-width" : ""}`)) * scaleX,
  });

  const border = edges("border");

  const inner = {
    x: box.x + border.left,
    y: box.y + border.top,
    width: Math.max(0, box.width - border.left - border.right),
    height: Math.max(0, box.height - border.top - border.bottom),
  };

  const regions = [
    ...marginRegions(box, edges("margin")),
    ...paddingRegions(inner, edges("padding")),
  ];

  if (css.display.includes("flex") || css.display.includes("grid")) {
    const children = Array.from(element.children)
      .filter((child) => {
        const style = getComputedStyle(child);

        return (
          style.position !== "absolute" && style.position !== "fixed" && style.display !== "none"
        );
      })
      .slice(0, 100)
      .map((child) => {
        const r = child.getBoundingClientRect();

        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })
      .filter((child) => child.width > 0 && child.height > 0);

    regions.push(...gapRegions(children, px(css.columnGap) * scaleX, px(css.rowGap) * scaleY));
  }

  return { box, tag: element.localName, regions };
}

export default function SpacingInspector({
  enabled,
  theme,
  componentId,
  revision,
}: {
  enabled: boolean;
  theme: Theme;
  componentId: string;
  revision: Canvas;
}) {
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [editing, setEditing] = useState<{ label: string; value: number } | null>(null);
  const refresh = useRef<() => void>(() => {});
  const pattern = useId().replace(/:/g, "");

  useEffect(() => {
    setMeasurement(null);
    setEditing(null);

    if (!enabled) return;

    let hovered: HTMLElement | null = null;
    let frame = 0;
    let feedback: ReturnType<typeof setTimeout> | undefined;

    let gesture: {
      element: HTMLElement;
      property: SpacingProperty;
      label: string;
      base: number;
      value: number;
      delta: number;
      fine: boolean;
      x: number;
      y: number;
    } | null = null;

    const contains = (region: Rect, x: number, y: number) =>
      x >= region.x &&
      x <= region.x + region.width &&
      y >= region.y &&
      y <= region.y + region.height;

    const clearGesture = () => {
      gesture = null;
      clearTimeout(feedback);
      setEditing(null);
    };

    const update = () => {
      if (!hovered?.isConnected) {
        setMeasurement(null);

        return;
      }

      const result = measure(hovered);

      setMeasurement(result.box.width > 0 && result.box.height > 0 ? result : null);
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    refresh.current = schedule;

    const move = (event: PointerEvent) => {
      if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) <= 4) {
        schedule();

        return;
      }

      clearGesture();

      if (
        hovered?.isConnected &&
        measure(hovered).regions.some(
          (region) => region.kind === "margin" && contains(region, event.clientX, event.clientY),
        )
      ) {
        schedule();

        return;
      }

      let target = event.target instanceof Element ? event.target : null;

      while (target && !(target instanceof HTMLElement)) target = target.parentElement;

      const root = target?.closest("[data-component-preview]");

      hovered = root && target !== root ? (target as HTMLElement) : null;
      schedule();
    };

    const leave = () => {
      clearGesture();
      hovered = null;
      setMeasurement(null);
    };

    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      if (
        gesture &&
        (!gesture.element.isConnected ||
          Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 4)
      )
        clearGesture();

      if (!gesture) {
        if (!hovered?.isConnected) return;

        const region = measure(hovered).regions.find((region) =>
          contains(region, event.clientX, event.clientY),
        );

        const property = region?.label.toLowerCase().replaceAll(" ", "-");

        if (!region || !isSpacingProperty(property)) return;

        const base = Number.parseFloat(getComputedStyle(hovered).getPropertyValue(property));

        if (!Number.isFinite(base)) return;

        gesture = {
          element: hovered,
          property,
          label: region.label,
          base,
          value: base,
          delta: 0,
          fine: event.shiftKey,
          x: event.clientX,
          y: event.clientY,
        };
      }

      const root = gesture.element.closest<HTMLElement>("[data-component-preview]");
      const parts: string[] = [];
      let element: Element | null = gesture.element;

      while (element && element !== root) {
        const parent: Element | null = element.parentElement;

        if (!parent) return;

        parts.unshift(`${element.localName}:${Array.from(parent.children).indexOf(element)}`);
        element = parent;
      }

      const path = parts.join("/");

      if (!root?.dataset.instanceId || !isSpacingPath(path)) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (gesture.fine !== event.shiftKey) {
        gesture.base = gesture.value;
        gesture.delta = 0;
        gesture.fine = event.shiftKey;
      }

      gesture.delta +=
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? document.documentElement.clientHeight
            : 1);
      const value = wheelSpacing(gesture.base, gesture.delta, gesture.property, gesture.fine);

      if (value !== gesture.value)
        parent.postMessage(
          {
            type: "spacing-change",
            id: componentId,
            instanceId: root.dataset.instanceId,
            path,
            property: gesture.property,
            value,
          } satisfies SpacingMessage,
          location.origin,
        );

      gesture.value = value;

      if (value === 4096 || value === (gesture.property.startsWith("margin") ? -4096 : 0)) {
        gesture.base = value;
        gesture.delta = 0;
      }

      setEditing({ label: gesture.label, value });
      clearTimeout(feedback);
      feedback = setTimeout(() => setEditing(null), 350);
      schedule();
    };

    const exit = () => parent.postMessage({ type: "spacing-exit" }, location.origin);

    const click = (event: MouseEvent) => {
      if (event.target instanceof Element && !event.target.closest("[data-component-preview] *"))
        exit();
    };

    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") exit();
    };

    const root = document.getElementById("preview-canvas");
    const observer = new MutationObserver(schedule);
    const resize = new ResizeObserver(schedule);

    if (root) {
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
      resize.observe(root);
    }

    document.addEventListener("wheel", wheel, { capture: true, passive: false });
    document.addEventListener("pointermove", move, true);
    document.addEventListener("pointerleave", leave);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key, true);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(feedback);
      refresh.current = () => {};
      document.removeEventListener("wheel", wheel, true);
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, componentId]);

  useEffect(() => refresh.current(), [revision]);

  if (!enabled || !measurement) return null;

  const { box, regions, tag } = measurement;

  return (
    <svg
      aria-hidden="true"
      data-theme={theme}
      data-spacing-overlay
      className="pointer-events-none fixed inset-0 z-[2147483647] h-dvh w-full overflow-hidden"
    >
      <defs>
        <pattern
          id={pattern}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="5" stroke={colors.gap} strokeWidth="1" opacity=".65" />
        </pattern>
      </defs>
      {regions.map((region, index) => {
        const vertical = region.width < 18 && region.height >= 24;
        const label = Math.round(region.value * 10) / 10;
        const x = region.x + region.width / 2;
        const y = region.y + region.height / 2;

        return (
          <g key={index} data-spacing={region.kind}>
            <title>
              {region.label}: {label}px
            </title>
            <rect
              x={region.x}
              y={region.y}
              width={region.width}
              height={region.height}
              fill={colors[region.kind]}
              fillOpacity={
                editing?.label === region.label ? 0.45 : region.kind === "margin" ? 0.28 : 0.22
              }
            />
            {region.kind === "gap" ? (
              <rect
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                fill={`url(#${pattern})`}
              />
            ) : null}
            {(region.width >= 18 && region.height >= 10) || vertical ? (
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                transform={vertical ? `rotate(-90 ${x} ${y})` : undefined}
                fill="var(--lab-text)"
                stroke="var(--lab-bg)"
                strokeWidth="2"
                paintOrder="stroke"
                fontSize="9"
                fontFamily="ui-monospace,monospace"
              >
                {label}
              </text>
            ) : null}
          </g>
        );
      })}
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        fill="none"
        stroke="var(--lab-muted)"
        strokeOpacity=".4"
        strokeWidth=".5"
      />
      <g
        transform={`translate(${Math.max(4, Math.min(box.x, document.documentElement.clientWidth - 132))},${Math.max(4, box.y - 23)})`}
      >
        <rect
          width={editing ? "170" : "128"}
          height="19"
          rx="4"
          fill="var(--lab-panel)"
          stroke="var(--lab-border)"
        />
        <text x="7" y="13" fill="var(--lab-muted)" fontSize="9" fontFamily="ui-monospace,monospace">
          {editing
            ? `${editing.label} · ${editing.value}px`
            : `${tag} · ${Math.round(box.width)} × ${Math.round(box.height)}`}
        </text>
      </g>
    </svg>
  );
}
