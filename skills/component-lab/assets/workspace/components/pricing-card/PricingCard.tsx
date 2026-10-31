import { useState } from "react";
import { cornersCSS, gradientCSS } from "@local";
import type { PricingProps } from "./pricing.schema";

const dollars = (amount: number) => amount.toFixed(Number.isInteger(amount) ? 0 : 2);

export default function PricingCard(props: PricingProps) {
  return <Plan key={props.billing} {...props} />;
}

function Plan({
  name,
  description,
  price,
  discount,
  billing,
  featured,
  showFeatures,
  accent,
  ink,
  gradient,
  corners,
  padding,
}: PricingProps) {
  const [yearly, setYearly] = useState(billing === "yearly");
  const [selected, setSelected] = useState(false);
  const amount = yearly ? price * (1 - discount / 100) : price;

  return (
    <article
      className="w-full min-w-0 max-w-[300px] border shadow-sm"
      style={{
        color: ink,
        borderRadius: cornersCSS(corners),
        borderColor: featured ? accent : "#80808025",
        backgroundImage: gradientCSS(gradient),
        padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
      }}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <h3 className="text-[16px] font-semibold tracking-tight wrap-anywhere">{name}</h3>
        {featured ? (
          <span
            className="rounded-full px-2 py-1 text-[8px] font-semibold tracking-wider text-white"
            style={{ backgroundColor: accent }}
          >
            POPULAR
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed opacity-60 wrap-anywhere">{description}</p>
      <div className="my-5 flex items-baseline gap-1.5">
        <span className="text-[38px] leading-none font-semibold tracking-[-2px]">
          ${dollars(amount)}
        </span>
        <span className="text-[10px] opacity-50">/ month</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-label="Annual billing"
        aria-checked={yearly}
        onClick={() => {
          setYearly(!yearly);
          setSelected(false);
        }}
        className="mb-4 flex w-full flex-wrap items-center gap-2 rounded-lg bg-black/4 px-2.5 py-2 text-left text-[9px]"
      >
        <span
          className="relative h-3.5 w-6 shrink-0 rounded-full transition-colors"
          style={{ backgroundColor: yearly ? accent : "#80808055" }}
        >
          <span
            className="absolute top-0.5 left-0.5 size-2.5 rounded-full bg-white transition-transform motion-reduce:transition-none"
            style={{ transform: yearly ? "translateX(10px)" : "none" }}
          />
        </span>
        <span>Annual billing</span>
        <span className="ml-auto font-medium" style={{ color: accent }}>
          −{discount}%
        </span>
      </button>
      {showFeatures ? (
        <ul className="mb-5 grid gap-2.5 text-[10px]">
          {["Unlimited drafts", "Version history", "Shareable previews"].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                className="size-3 shrink-0"
                fill="none"
                stroke={accent}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m2 6 2.5 2.5L10 3" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => setSelected(!selected)}
        className="w-full rounded-lg px-3 py-2.5 text-[11px] font-medium text-white transition-[filter] hover:brightness-110"
        style={{ backgroundColor: accent }}
      >
        {selected ? "Selected ✓" : "Choose plan"}
      </button>
      <p className="mt-2.5 text-center text-[8px] opacity-45">
        {yearly
          ? `$${dollars(amount * 12)} billed yearly`
          : "Billed monthly · cancel any time"}
      </p>
    </article>
  );
}
