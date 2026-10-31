import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clampPanels, panelBounds } from "./state.ts";
import { isRecord } from "../settings";
import type { PanelSizes } from "./types";

export default function usePanels() {
  const ref = useRef<HTMLElement>(null);

  const [sizes, setSizes] = useState<PanelSizes>(() => {
    let stored: unknown;

    try {
      stored = JSON.parse(localStorage.getItem("component-lab-panels") ?? "null");
    } catch {
      /* Browser storage is optional. */
    }

    return {
      width:
        isRecord(stored) && typeof stored.width === "number"
          ? stored.width
          : innerWidth <= 600
            ? 180
            : 264,
      height: isRecord(stored) && typeof stored.height === "number" ? stored.height : 244,
    };
  });

  const [bounds, setBounds] = useState(() => panelBounds(innerWidth, innerHeight));

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new ResizeObserver(() => {
      const next = panelBounds(element.clientWidth, element.clientHeight);

      setBounds(next);
      setSizes((current) => clampPanels(current, next));
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("component-lab-panels", JSON.stringify(sizes));
    } catch {
      /* Browser storage is optional. */
    }
  }, [sizes]);

  return {
    ref,
    sizes,
    bounds,
    resize: (key: keyof PanelSizes, value: number) =>
      setSizes((current) => clampPanels({ ...current, [key]: value }, bounds)),
  };
}
