export function componentValues(component, stored = {}) {
  const values = { ...component.defaults };

  for (const control of component.controls) {
    const value = stored[control.key];

    if (control.type === "range" && Number.isFinite(value)) values[control.key] = Math.min(control.max, Math.max(control.min, value));
    else if (control.type === "color" && typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value)) values[control.key] = value;
    else if (control.type === "boolean" && typeof value === "boolean") values[control.key] = value;
    else if (control.type === "text" && typeof value === "string") values[control.key] = value.slice(0, control.maxLength);
  }

  return values;
}

export function panelBounds(width, height) {
  const narrow = width <= 600;

  return {
    width: { min: narrow ? 160 : 220, max: Math.max(narrow ? 160 : 220, Math.min(480, width - (narrow ? 170 : 320))) },
    height: { min: 180, max: Math.max(180, height - 160) },
  };
}

export function clampPanels(sizes, bounds) {
  return Object.fromEntries(Object.entries(bounds).map(([key, { min, max }]) => [key, Math.round(Math.max(min, Math.min(max, Number(sizes[key]) || min)))]));
}
