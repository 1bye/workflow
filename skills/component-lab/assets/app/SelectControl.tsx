import { useLayoutEffect, useRef, useState } from "react";
import { title } from "../schema/entries";

type Props = {
  id: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
};

const segmentClass =
  "block rounded-[4px] px-2 py-1 text-[10px] leading-none text-(--lab-faint) peer-checked:bg-(--lab-active) peer-checked:text-(--lab-text) peer-checked:shadow-[0_1px_3px_var(--lab-shadow)]";

export default function SelectControl({ id, name, options, value, onChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(false);
  const fewOptions = options.length <= 3;

  useLayoutEffect(() => {
    const field = container.current;
    const segments = probe.current;

    if (!field || !segments) return;

    const measure = () =>
      setFits(Math.ceil(segments.getBoundingClientRect().width) <= field.clientWidth);

    measure();
    const observer = new ResizeObserver(measure);

    observer.observe(field);
    observer.observe(segments);

    return () => observer.disconnect();
  }, [options]);

  return (
    <div ref={container} className="relative flex h-[30px] min-w-0 flex-1 items-center justify-end">
      {fewOptions ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div ref={probe} className="invisible inline-flex w-max gap-0.5 py-1">
            {options.map((option) => (
              <span key={option} className={segmentClass}>
                {title(option)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {fewOptions && fits ? (
        <div
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          className="flex shrink-0 gap-0.5 py-1"
        >
          {options.map((option, index) => (
            <label key={option} className="cursor-pointer">
              <input
                id={value === option ? id : `${id}-${index}`}
                type="radio"
                name={name}
                value={option}
                checked={value === option}
                className="peer sr-only"
                onChange={() => onChange(option)}
              />
              <span className={segmentClass}>{title(option)}</span>
            </label>
          ))}
        </div>
      ) : (
        <select
          id={id}
          name={name}
          value={value}
          className="h-[30px] min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-right text-[11px] text-(--lab-text)"
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {title(option)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
