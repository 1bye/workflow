import * as Schema from "@local";

const schema = Schema.Component("Quantity stepper", {
	thumbnail: new URL("./thumbnail.svg", import.meta.url).href,
	preview: { minWidth: 300 },
	controls: {
		label: Schema.Control.Text({ default: "A few good things", maxLength: 60 }),
		caption: Schema.Control.Text({
			default: "Make room for one more.",
			maxLength: 100,
		}),
		quantity: Schema.Control.Number({ default: 2, min: 0, max: 20, step: 1 }),
		maximum: Schema.Control.Number({ default: 10, min: 1, max: 20, step: 1 }),
		size: Schema.Control.Number({ default: 40, min: 28, max: 56, unit: "px" }),
		radius: Schema.Control.Number({ default: 12, min: 0, max: 28, unit: "px" }),
		accent: Schema.Control.Color({ default: "#7c79ba" }),
		disabled: Schema.Control.Boolean({ default: false }),
	},
});

export default schema;
export type QuantityStepperProps = Schema.Props<typeof schema>;
