import * as Schema from "@local";

const avatars = Schema.Component("Avatar stack", {
  thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
  controls: {
    title: Schema.Control.Text({ default: "Design team", maxLength: 40 }),
    count: Schema.Control.Number({ default: 4, min: 1, max: 6 }),
    size: Schema.Control.Number({ default: 44, min: 28, max: 64, unit: "px" }),
    overlap: Schema.Control.Number({ default: 12, min: 0, max: 24, unit: "px" }),
    shape: Schema.Control.Select(["circle", "soft", "square"], { default: "circle" }),
    showStatus: Schema.Control.Boolean({ default: true }),
    border: Schema.Control.Number({ default: 3, min: 0, max: 6, unit: "px" }),
    accent: Schema.Control.Color({
      default: "#7c79ba",
      options: ["#7c79ba", "#668977", "#3f80ac", "#c28a70"],
    }),
    image: Schema.Control.Asset({ label: "First avatar", default: "" }),
  },
  states: {
    default: { name: "Circle", description: "Click a person to reveal their profile." },
    soft: { props: { shape: "soft", size: 52 } },
    quiet: { props: { showStatus: false, count: 3 } },
  },
});

export default avatars;
export type AvatarProps = Schema.Props<typeof avatars>;
