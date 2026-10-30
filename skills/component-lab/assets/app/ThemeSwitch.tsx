import type { Theme } from "./theme";

type Props = { theme: Theme; onChange: (theme: Theme) => void };

export default function ThemeSwitch({ theme, onChange }: Props) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      onClick={() => onChange(nextTheme)}
      className="grid size-6 shrink-0 place-items-center rounded border-0 bg-transparent text-(--lab-faint) hover:bg-(--lab-control) hover:text-(--lab-text)"
    >
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {nextTheme === "light" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
          </>
        ) : (
          <path d="M20 13a8 8 0 0 1-9-9 8 8 0 1 0 9 9Z" />
        )}
      </svg>
    </button>
  );
}
