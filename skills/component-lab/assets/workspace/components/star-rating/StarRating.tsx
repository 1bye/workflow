import { useId, useState } from "react";
import type { StarRatingProps } from "./rating.schema";

export default function StarRating(props: StarRatingProps) {
	return <Rating key={props.rating} {...props} />;
}

function Rating({
	heading,
	caption,
	rating,
	size,
	gap,
	accent,
	disabled,
}: StarRatingProps) {
	const [value, setValue] = useState(rating);
	const [hover, setHover] = useState(0);
	const id = useId();

	return (
		<section className="w-full max-w-[320px] rounded-2xl border border-(--lab-border) bg-(--lab-surface) p-6 text-center">
			<p className="text-[9px] uppercase tracking-[2px] text-(--lab-faint)">
				Your experience
			</p>
			<h2 className="mt-3 text-base font-medium text-(--lab-text) wrap-anywhere">
				{heading}
			</h2>
			<p className="mt-2 text-[11px] leading-relaxed text-(--lab-faint) wrap-anywhere">
				{caption}
			</p>
			<fieldset
				disabled={disabled}
				className="mt-5 flex flex-wrap justify-center disabled:opacity-40"
				style={{ gap }}
				onMouseLeave={() => setHover(0)}
			>
				<legend className="sr-only">Rating out of five stars</legend>
				{[1, 2, 3, 4, 5].map((star) => (
					<label
						key={star}
						className="relative cursor-pointer"
						onMouseEnter={() => setHover(star)}
					>
						<input
							type="radio"
							name={id}
							value={star}
							checked={value === star}
							onChange={() => setValue(star)}
							aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
							className="peer sr-only"
						/>
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							style={{
								width: size,
								height: size,
								color: star <= (hover || value) ? accent : "var(--lab-border)",
							}}
							className="transition-colors peer-focus-visible:opacity-60"
							fill="currentColor"
						>
							<path d="m12 2 3.1 6.3 7 .9-5.1 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-5 7-.9Z" />
						</svg>
					</label>
				))}
			</fieldset>
			<p
				aria-live="polite"
				className="mt-4 text-[10px] tabular-nums text-(--lab-faint)"
			>
				{value ? `${value} of 5 · Thank you` : "Choose a star"}
			</p>
		</section>
	);
}
