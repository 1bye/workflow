export function canvasMessage(props: unknown, theme: unknown = "dark") {
  return {
    type: "render",
    id: "demo",
    theme,
    canvas: { selectedId: "initial", instances: [{ id: "initial", props }] },
  };
}
