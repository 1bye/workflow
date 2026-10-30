import type { Gradient, Shadow, Corners } from "./values";

export function gradientCSS(value: Gradient): string {
  return `linear-gradient(${value.angle}deg, ${value.stops.map((stop) => `${stop.color} ${stop.position}%`).join(", ")})`;
}

export function shadowCSS(value: Shadow): string {
  const rgb = [1, 3, 5].map((offset) => Number.parseInt(value.color.slice(offset, offset + 2), 16));

  return `${value.inset ? "inset " : ""}${value.x}px ${value.y}px ${value.blur}px ${value.spread}px rgb(${rgb.join(" ")} / ${value.opacity})`;
}

export function cornersCSS(value: Corners): string {
  return `${value.topLeft}px ${value.topRight}px ${value.bottomRight}px ${value.bottomLeft}px`;
}
