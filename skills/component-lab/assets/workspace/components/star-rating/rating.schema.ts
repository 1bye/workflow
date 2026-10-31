import * as Schema from "@local";

const schema = Schema.Component("Star rating", {
	thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
	preview: { minWidth: 300 },
	controls: {
		heading: Schema.Control.Text({
			default: "How was your stay?",
			maxLength: 60,
		}),
		caption: Schema.Control.Text({
			default: "A little feedback goes a long way.",
			maxLength: 100,
		}),
		rating: Schema.Control.Number({ default: 3, min: 0, max: 5, step: 1 }),
		size: Schema.Control.Number({ default: 28, min: 16, max: 44, unit: "px" }),
		gap: Schema.Control.Number({ default: 8, min: 0, max: 20, unit: "px" }),
		accent: Schema.Control.Color({ default: "#d39a37" }),
		disabled: Schema.Control.Boolean({ default: false }),
	},
});

export default schema;
export type StarRatingProps = Schema.Props<typeof schema>;
