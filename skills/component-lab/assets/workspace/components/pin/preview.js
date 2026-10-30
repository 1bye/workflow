import Pin from "./Pin.jsx";

export default {
  id: "pin",
  name: "Location pin",
  category: "Map components",
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  defaults: { color: "#e76e50", size: 44, radius: 22, border: 3, shadow: 24, label: "Little coffee", showLabel: true },
  controls: [
    { key: "color", label: "Accent", type: "color", options: ["#e76e50", "#668977", "#7c79ba", "#3f80ac", "#d39a37"] },
    { key: "size", label: "Size", type: "range", min: 28, max: 72, step: 1, unit: "px" },
    { key: "radius", label: "Roundness", type: "range", min: 4, max: 36, step: 1, unit: "px" },
    { key: "border", label: "Border", type: "range", min: 0, max: 6, step: 1, unit: "px" },
    { key: "shadow", label: "Shadow", type: "range", min: 0, max: 40, step: 1, unit: "%" },
    { key: "label", label: "Place name", type: "text", maxLength: 60 },
    { key: "showLabel", label: "Show label", type: "boolean" },
  ],
  states: [
    { id: "default", name: "Default", description: "Ready to explore" },
    { id: "hover", name: "Hover", description: "A little lift on approach" },
    { id: "selected", name: "Selected", description: "The place in focus" },
    { id: "disabled", name: "Disabled", description: "Unavailable for now" },
    { id: "loading", name: "Loading", description: "Finding your place" },
  ],
  component: Pin,
};
