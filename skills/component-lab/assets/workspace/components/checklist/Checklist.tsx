import { useState } from "react";
import type { ChecklistProps } from "./checklist.schema";

export default function Checklist(props: ChecklistProps) {
	return <Tasks key={props.completed} {...props} />;
}
function Tasks({
	title,
	first,
	second,
	third,
	completed,
	accent,
	radius,
	spacing,
	showProgress,
}: ChecklistProps) {
	const [checked, setChecked] = useState([0, 1, 2].map((i) => i < completed));
	const count = checked.filter(Boolean).length;

	return (
		<section
			className="w-full max-w-[340px] border border-(--lab-border) bg-(--lab-surface) p-5"
			style={{ borderRadius: radius }}
		>
			<div className="mb-5 flex items-center justify-between gap-3">
				<h2 className="text-sm font-medium text-(--lab-text) wrap-anywhere">
					{title}
				</h2>
				<span
					aria-live="polite"
					className="shrink-0 rounded-full px-2 py-1 text-[9px] tabular-nums"
					style={{
						color: accent,
						background: `color-mix(in srgb, ${accent} 12%, transparent)`,
					}}
				>
					{count} / 3
				</span>
			</div>
			<div className="flex flex-col" style={{ gap: spacing }}>
				{[first, second, third].map((label, i) => (
					<label
						key={i}
						className="flex cursor-pointer items-center gap-3 text-[11px] text-(--lab-text)"
					>
						<input
							type="checkbox"
							checked={checked[i] ?? false}
							onChange={(e) =>
								setChecked((values) =>
									values.map((v, index) =>
										index === i ? e.target.checked : v,
									),
								)
							}
							style={{ accentColor: accent }}
							className="size-4 shrink-0"
						/>
						<span
							className={
								checked[i]
									? "text-(--lab-faint) line-through wrap-anywhere"
									: "wrap-anywhere"
							}
						>
							{label}
						</span>
					</label>
				))}
			</div>
			{showProgress ? (
				<div
					role="progressbar"
					aria-label="Tasks completed"
					aria-valuenow={count}
					aria-valuemin={0}
					aria-valuemax={3}
					className="mt-5 h-1 overflow-hidden rounded-full bg-(--lab-border)"
				>
					<div
						className="h-full rounded-full transition-[width] motion-reduce:transition-none"
						style={{ width: `${(count / 3) * 100}%`, background: accent }}
					/>
				</div>
			) : null}
		</section>
	);
}
