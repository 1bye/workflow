import { useEffect, useId, useRef, useState } from "react";
import {
  isSpacingPath,
  isSpacingProperty,
  scopedProperties,
  wheelSpacingValues,
  type SpacingProperty,
  type SpacingScope,
  type SpacingValues,
} from "./spacing-edits";
import { edgeHandles, gapHandles, handlePoint, handleScore } from "./spacing-handles";
import type { Canvas } from "./canvas";
import type { SpacingMessage } from "./types";
import { isRecord } from "../settings";
import type { Theme } from "./theme";
import {
  gapRegions,
  marginRegions,
  paddingRegions,
  type Edges,
  type Rect,
  type Region,
} from "./spacing";

type Measurement = { box: Rect; regions: Region[]; handles: Region[] };
type Handle = { region: Region; x: number; y: number; vertical: boolean };
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

  const handles = [
    ...edgeHandles(inner, edges("padding"), "padding"),
    ...edgeHandles(box, edges("margin"), "margin"),
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
    handles.push(...gapHandles(children, px(css.columnGap) * scaleX, px(css.rowGap) * scaleY));
  }

  return { box, regions, handles };
}

export default function SpacingInspector({
  enabled,
  scope,
  theme,
  componentId,
  revision,
}: {
  enabled: boolean;
  scope: SpacingScope;
  theme: Theme;
  componentId: string;
  revision: Canvas;
}) {
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [targets, setTargets] = useState<Region[]>([]);
  const [handle, setHandle] = useState<Handle | null>(null);
  const scopeRef = useRef(scope);
  const refresh = useRef<() => void>(() => {});
  const pattern = useId().replace(/:/g, "");

  useEffect(() => {
    setMeasurement(null);
    setTargets([]);
    setHandle(null);

    if (!enabled) return;

    let hovered: HTMLElement | null = null;
    let frame = 0;

    let gesture: {
      element: HTMLElement;
      property: SpacingProperty;
      label: string;
      base: SpacingValues;
      values: SpacingValues;
      scope: SpacingScope;
      delta: number;
      fine: boolean;
      x: number;
      y: number;
    } | null = null;

    let pointer = { x: 0, y: 0, alt: false, meta: false };
    let raw: HTMLElement | null = null;
    let active: { element: HTMLElement; region: Region } | null = null;

    const clearGesture = () => {
      gesture = null;
    };

    const effectiveScope = () => (pointer.meta ? "All" : scopeRef.current);

    const propertyOf = (region: Region) =>
      region.label.toLowerCase().replaceAll(" ", "-") as SpacingProperty;

    const readValues = (
      element: HTMLElement,
      property: SpacingProperty,
      scope: SpacingScope,
    ): SpacingValues => {
      const css = getComputedStyle(element);

      return Object.fromEntries(
        scopedProperties(property, scope).map((key) => {
          const value = css.getPropertyValue(key);

          return [key, value === "normal" || value === "auto" ? 0 : Number.parseFloat(value)];
        }),
      );
    };

    const resolve = () => {
      if (gesture?.element.isConnected) {
        const result = measure(gesture.element);
        const region = result.handles.find((item) => item.label === gesture!.label);

        if (region) return { element: gesture.element, region, result };
      }

      let best: {
        element: HTMLElement;
        region: Region;
        result: Measurement;
        score: number;
      } | null = null;

      const candidates = new Map<HTMLElement, number>();
      let element = raw;

      while (
        element &&
        !element.hasAttribute("data-component-preview") &&
        element.closest("[data-component-preview]")
      ) {
        candidates.set(element, candidates.size);
        element = element.parentElement;

        if (candidates.size === 8) break;
      }

      if (hovered?.isConnected && !candidates.has(hovered)) candidates.set(hovered, 0);

      // A child's margin receives pointer events on its parent.
      for (const child of Array.from(raw?.children ?? []).slice(0, 100)) {
        if (child instanceof HTMLElement && !candidates.has(child)) candidates.set(child, 0);
      }

      for (const [candidate, depth] of candidates) {
        const result = measure(candidate);

        if (!result.box.width || !result.box.height) continue;

        for (const region of result.handles) {
          const distance = handleScore(region, pointer.x, pointer.y, pointer.alt);

          if (distance === null) continue;

          const score = distance + depth * 0.25 + (candidate.childElementCount ? 0 : 1);

          if (!best || score < best.score) best = { element: candidate, region, result, score };
        }
      }

      return best;
    };

    const update = () => {
      const target = resolve();

      active = target;
      hovered = target?.element ?? raw;

      if (!hovered?.isConnected) {
        setMeasurement(null);
        setHandle(null);
        setTargets([]);

        return;
      }

      const result = target?.result ?? measure(hovered);

      setMeasurement(result.box.width > 0 && result.box.height > 0 ? result : null);

      if (target) {
        const properties = scopedProperties(propertyOf(target.region), effectiveScope());

        setTargets(result.handles.filter((region) => properties.includes(propertyOf(region))));
        const vertical =
          target.region.label.endsWith("left") ||
          target.region.label.endsWith("right") ||
          target.region.label === "Column gap";

        setHandle({
          region: target.region,
          ...handlePoint(target.region, pointer.x, pointer.y, vertical),
          vertical,
        });
      } else {
        setHandle(null);
        setTargets([]);
      }
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    refresh.current = schedule;

    const move = (event: PointerEvent) => {
      pointer = {
        x: event.clientX,
        y: event.clientY,
        alt: event.altKey,
        meta: event.metaKey,
      };

      if (gesture && Math.hypot(pointer.x - gesture.x, pointer.y - gesture.y) <= 4) {
        schedule();

        return;
      }

      clearGesture();
      let target = event.target instanceof Element ? event.target : null;

      while (target && !(target instanceof HTMLElement)) target = target.parentElement;

      const root = target?.closest("[data-component-preview]");

      raw = root && target !== root ? (target as HTMLElement) : null;
      schedule();
    };

    const leave = () => {
      clearGesture();
      hovered = null;
      raw = null;
      active = null;
      setHandle(null);
      setTargets([]);
      setMeasurement(null);
    };

    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      pointer = {
        x: event.clientX,
        y: event.clientY,
        alt: event.altKey,
        meta: event.metaKey,
      };

      if (
        gesture &&
        (!gesture.element.isConnected ||
          Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 4)
      )
        clearGesture();

      if (!gesture) {
        active = resolve();

        if (!active) return;

        hovered = active.element;
        const region = active.region;
        const property = propertyOf(region);

        if (!isSpacingProperty(property)) return;

        const base = readValues(hovered, property, effectiveScope());

        if (!Object.values(base).every(Number.isFinite)) return;

        gesture = {
          element: hovered,
          property,
          label: region.label,
          base,
          values: base,
          scope: effectiveScope(),
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

      if (gesture.scope !== effectiveScope() || gesture.fine !== event.shiftKey) {
        gesture.base =
          gesture.scope !== effectiveScope()
            ? readValues(gesture.element, gesture.property, effectiveScope())
            : gesture.values;

        if (!Object.values(gesture.base).every(Number.isFinite)) return;

        gesture.delta = 0;
        gesture.fine = event.shiftKey;
        gesture.scope = effectiveScope();
      }

      gesture.delta +=
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? document.documentElement.clientHeight
            : 1);
      const values = wheelSpacingValues(gesture.base, gesture.delta, gesture.fine);

      if (
        Object.entries(values).some(
          ([key, value]) => value !== gesture!.values[key as SpacingProperty],
        )
      )
        parent.postMessage(
          {
            type: "spacing-change",
            id: componentId,
            instanceId: root.dataset.instanceId,
            path,
            edits: values,
          } satisfies SpacingMessage,
          location.origin,
        );

      gesture.values = values;

      if (
        Object.entries(values).some(
          ([key, value]) => value === 4096 || value === (key.startsWith("margin") ? -4096 : 0),
        )
      ) {
        gesture.base = values;
        gesture.delta = 0;
      }

      schedule();
    };

    const exit = () => parent.postMessage({ type: "spacing-exit" }, location.origin);

    const click = (event: MouseEvent) => {
      if (event.target instanceof Element && !event.target.closest("[data-component-preview] *"))
        exit();
    };

    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") exit();

      if (event.altKey !== pointer.alt || event.metaKey !== pointer.meta) {
        if (event.altKey !== pointer.alt) clearGesture();

        pointer.alt = event.altKey;
        pointer.meta = event.metaKey;
        schedule();
      }
    };

    const modifier = (event: MessageEvent<unknown>) => {
      if (
        event.source === parent &&
        event.origin === location.origin &&
        isRecord(event.data) &&
        event.data.type === "spacing-modifier" &&
        typeof event.data.alt === "boolean" &&
        typeof event.data.meta === "boolean"
      ) {
        if (pointer.alt !== event.data.alt) clearGesture();

        pointer.alt = event.data.alt;
        pointer.meta = event.data.meta;
        schedule();
      }
    };

    const blur = () => {
      pointer.alt = false;
      pointer.meta = false;
      clearGesture();
      schedule();
    };

    window.addEventListener("message", modifier);
    window.addEventListener("blur", blur);
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
    document.addEventListener("keyup", key, true);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      refresh.current = () => {};
      window.removeEventListener("message", modifier);
      window.removeEventListener("blur", blur);
      document.removeEventListener("wheel", wheel, true);
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("keyup", key, true);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, componentId]);

  useEffect(() => refresh.current(), [revision]);
  useEffect(() => {
    scopeRef.current = scope;
    refresh.current();
  }, [scope]);

  if (!enabled || !measurement) return null;

  const { box, regions } = measurement;

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
          <g
            key={index}
            data-spacing={region.kind}
            data-spacing-active={targets.some((target) => target.label === region.label)}
          >
            <rect
              x={region.x}
              y={region.y}
              width={region.width}
              height={region.height}
              fill={colors[region.kind]}
              fillOpacity={
                targets.some((target) => target.label === region.label)
                  ? 0.45
                  : region.kind === "margin"
                    ? 0.28
                    : 0.22
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
      {targets.map((region, index) => (
        <rect
          key={index}
          data-spacing-target={region.label}
          x={region.x}
          y={region.y}
          width={region.width || 1}
          height={region.height || 1}
          fill="none"
          stroke={colors[region.kind]}
          strokeWidth="1"
          strokeOpacity=".7"
        />
      ))}
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
      {handle ? (
        <g data-spacing-handle={handle.region.label}>
          <rect
            x={handle.x - (handle.vertical ? 2 : 9)}
            y={handle.y - (handle.vertical ? 9 : 2)}
            width={handle.vertical ? 4 : 18}
            height={handle.vertical ? 18 : 4}
            rx="2"
            fill={colors[handle.region.kind]}
            stroke="var(--lab-bg)"
            strokeWidth="1"
          />
        </g>
      ) : null}
    </svg>
  );
}
