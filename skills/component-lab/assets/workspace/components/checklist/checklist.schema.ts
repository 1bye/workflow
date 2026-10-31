import * as Schema from "@local";

const schema = Schema.Component("Task checklist", {
	thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
	preview: { minWidth: 300 },
	controls: {
		title: Schema.Control.Text({ default: "A fresh start", maxLength: 60 }),
		first: Schema.Control.Text({
			default: "Find a little inspiration",
			maxLength: 80,
		}),
		second: Schema.Control.Text({
			default: "Make something worth keeping",
			maxLength: 80,
		}),
		third: Schema.Control.Text({
			default: "Share it with the world",
			maxLength: 80,
		}),
		completed: Schema.Control.Number({ default: 1, min: 0, max: 3, step: 1 }),
		accent: Schema.Control.Color({ default: "#668977" }),
		radius: Schema.Control.Number({ default: 16, min: 0, max: 28, unit: "px" }),
		spacing: Schema.Control.Number({
			default: 14,
			min: 6,
			max: 24,
			unit: "px",
		}),
		showProgress: Schema.Control.Boolean({ default: true }),
	},
});

export default schema;
export type ChecklistProps = Schema.Props<typeof schema>;
