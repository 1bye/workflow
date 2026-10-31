import { useState } from "react";
import type { ProgressRingProps } from "./progress.schema";

export default function ProgressRing(props: ProgressRingProps) {
	return <Progress key={props.progress} {...props} />;
}
function Progress({
	label,
	caption,
	progress,
	size,
	thickness,
	accent,
	rounded,
	showSlider,
}: ProgressRingProps) {
	const [value, setValue] = useState(progress);
	const radius = (size - thickness) / 2;
	const circumference = 2 * Math.PI * radius;

	return (
		<section className="flex w-full max-w-[300px] flex-col items-center rounded-2xl border border-(--lab-border) bg-(--lab-surface) p-6 text-center">
			<h2 className="mb-5 text-[12px] font-medium text-(--lab-text) wrap-anywhere">
				{label}
			</h2>
			<div
				role="progressbar"
				aria-label={label}
				aria-valuenow={value}
				aria-valuemin={0}
				aria-valuemax={100}
				className="relative max-w-full"
				style={{ width: size, aspectRatio: "1" }}
			>
				<svg
					aria-hidden="true"
					viewBox={`0 0 ${size} ${size}`}
					className="size-full -rotate-90"
					fill="none"
				>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="var(--lab-border)"
						strokeWidth={thickness}
					/>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke={accent}
						strokeWidth={thickness}
						strokeLinecap={rounded ? "round" : "butt"}
						strokeDasharray={circumference}
						strokeDashoffset={circumference * (1 - value / 100)}
					/>
				</svg>
				<div
					aria-hidden="true"
					className="absolute inset-0 grid place-content-center"
				>
					<span
						className="font-light tracking-[-1px] text-(--lab-text)"
						style={{ fontSize: size * 0.23 }}
					>
						{value}
						<span className="ml-0.5 text-[11px] text-(--lab-faint)">%</span>
					</span>
				</div>
			</div>
			<p className="mt-5 text-[10px] leading-relaxed text-(--lab-faint) wrap-anywhere">
				{caption}
			</p>
			{showSlider ? (
				<input
					aria-label="Adjust progress"
					type="range"
					min={0}
					max={100}
					value={value}
					onChange={(e) => setValue(Number(e.target.value))}
					className="mt-5 h-1 w-full cursor-pointer"
					style={{ accentColor: accent }}
				/>
			) : null}
		</section>
	);
}
