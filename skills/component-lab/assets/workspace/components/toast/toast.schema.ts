import * as Schema from "@local";

const toast = Schema.Component("Toast notification", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  controls: {
    title: Schema.Control.Text({ default: "Your changes are live", maxLength: 60 }),
    message: Schema.Control.Text({
      default: "Everything is saved and ready to share.",
      maxLength: 160,
    }),
    tone: Schema.Control.Select(["success", "info", "warning", "error"], { default: "success" }),
    actionLabel: Schema.Control.Text({ default: "View", maxLength: 20 }),
    dismissible: Schema.Control.Boolean({ default: true }),
    corners: Schema.Control.Corners({
      default: { topLeft: 14, topRight: 14, bottomRight: 14, bottomLeft: 14 },
    }),
    padding: Schema.Control.Spacing({
      default: { top: 16, right: 16, bottom: 16, left: 16 },
      min: 8,
      max: 28,
      unit: "px",
    }),
    shadow: Schema.Control.Shadow({
      default: { x: 0, y: 6, blur: 24, spread: -8, color: "#000000", opacity: 0.18, inset: false },
    }),
  },
  states: {
    default: { name: "Success", description: "Try the action or dismiss and restore." },
    warning: {
      props: {
        tone: "warning",
        title: "A little room is running out",
        message: "Your workspace is almost at capacity.",
        actionLabel: "Manage",
      },
    },
    error: {
      props: {
        tone: "error",
        title: "Upload interrupted",
        message: "Check the connection and give it another try.",
        actionLabel: "Retry",
      },
    },
  },
});

export default toast;
export type ToastProps = Schema.Props<typeof toast>;
