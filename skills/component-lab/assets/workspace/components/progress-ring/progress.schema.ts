import * as Schema from "@local";

const schema = Schema.Component("Progress ring", {
	thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
	preview: { minWidth: 240 },
	controls: {
		label: Schema.Control.Text({ default: "Daily focus", maxLength: 60 }),
		caption: Schema.Control.Text({
			default: "Small steps, steady progress.",
			maxLength: 100,
		}),
		progress: Schema.Control.Number({
			default: 68,
			min: 0,
			max: 100,
			step: 1,
			unit: "%",
		}),
		size: Schema.Control.Number({
			default: 144,
			min: 80,
			max: 220,
			unit: "px",
		}),
		thickness: Schema.Control.Number({
			default: 8,
			min: 2,
			max: 16,
			unit: "px",
		}),
		accent: Schema.Control.Color({ default: "#3f80ac" }),
		rounded: Schema.Control.Boolean({ default: true }),
		showSlider: Schema.Control.Boolean({ default: true }),
	},
});

export default schema;
export type ProgressRingProps = Schema.Props<typeof schema>;
