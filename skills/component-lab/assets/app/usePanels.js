import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clampPanels, panelBounds } from "./state.js";

export default function usePanels() {
  const ref = useRef(null);

  const [sizes, setSizes] = useState(() => {
    let stored;

    try { stored = JSON.parse(localStorage.getItem("component-lab-panels") ?? "null"); } catch { /* Browser storage is optional. */ }

    return { width: innerWidth <= 600 ? 180 : 264, height: 244, ...stored };
  });

  const [bounds, setBounds] = useState(() => panelBounds(innerWidth, innerHeight));

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
      const next = panelBounds(ref.current.clientWidth, ref.current.clientHeight);

      setBounds(next);
      setSizes((current) => clampPanels(current, next));
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    try { localStorage.setItem("component-lab-panels", JSON.stringify(sizes)); } catch { /* Browser storage is optional. */ }
  }, [sizes]);

  return { ref, sizes, bounds, resize: (key, value) => setSizes((current) => clampPanels({ ...current, [key]: value }, bounds)) };
}
