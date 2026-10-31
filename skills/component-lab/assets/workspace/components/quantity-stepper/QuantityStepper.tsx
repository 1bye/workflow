import { useState } from "react";
import type { QuantityStepperProps } from "./stepper.schema";

export default function QuantityStepper(props: QuantityStepperProps) {
	return <Stepper key={`${props.quantity}:${props.maximum}`} {...props} />;
}
function Stepper({
	label,
	caption,
	quantity,
	maximum,
	size,
	radius,
	accent,
	disabled,
}: QuantityStepperProps) {
	const [value, setValue] = useState(Math.min(quantity, maximum));

	return (
		<section className="flex w-full max-w-[340px] flex-col gap-5 rounded-2xl border border-(--lab-border) bg-(--lab-surface) p-5">
			<div>
				<h2 className="text-[13px] font-medium text-(--lab-text) wrap-anywhere">
					{label}
				</h2>
				<p className="mt-1 text-[10px] text-(--lab-faint) wrap-anywhere">
					{caption}
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<span className="text-[10px] text-(--lab-faint)">
					Quantity <span className="ml-1 opacity-60">/ {maximum}</span>
				</span>
				<div
					className="inline-flex items-center gap-1 p-1"
					style={{
						borderRadius: radius + 4,
						background: `color-mix(in srgb, ${accent} 10%, var(--lab-bg))`,
					}}
				>
					<button
						type="button"
						aria-label="Decrease quantity"
						disabled={disabled || value === 0}
						onClick={() => setValue((v) => Math.max(0, v - 1))}
						className="grid place-items-center bg-(--lab-surface) text-lg text-(--lab-text) disabled:opacity-25"
						style={{ width: size, height: size, borderRadius: radius }}
					>
						−
					</button>
					<output
						aria-label="Quantity"
						aria-live="polite"
						className="text-center text-sm font-medium tabular-nums"
						style={{ minWidth: size, color: accent }}
					>
						{value}
					</output>
					<button
						type="button"
						aria-label="Increase quantity"
						disabled={disabled || value === maximum}
						onClick={() => setValue((v) => Math.min(maximum, v + 1))}
						className="grid place-items-center bg-(--lab-surface) text-lg text-(--lab-text) disabled:opacity-25"
						style={{ width: size, height: size, borderRadius: radius }}
					>
						+
					</button>
				</div>
			</div>
		</section>
	);
}
