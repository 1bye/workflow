import { useId, useRef, type CSSProperties } from "react";

export default function ResetMenu({
  onResetTweaks,
  onResetSpacing,
  hasSpacing,
}: {
  onResetTweaks: () => void;
  onResetSpacing: () => void;
  hasSpacing: boolean;
}) {
  const id = useId();
  const anchor = `--reset-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const itemClass =
    "flex h-7 w-full items-center rounded px-2 text-left text-[11px] text-(--lab-muted) hover:bg-(--lab-control) focus:bg-(--lab-control) disabled:opacity-35";

  function reset(action: () => void) {
    action();
    menu.current?.hidePopover();
    trigger.current?.focus();
  }

  return (
    <>
      <button
        ref={trigger}
        id="reset"
        type="button"
        popoverTarget={id}
        aria-haspopup="menu"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            menu.current?.showPopover();
          }
        }}
        style={{ anchorName: anchor } as CSSProperties}
        className="flex h-6 items-center gap-1 rounded border-0 bg-transparent px-1.5 text-[10px] text-(--lab-muted) hover:bg-(--lab-control) hover:text-(--lab-text)"
      >
        Reset
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="size-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3.5 4.75 2.5 2.5 2.5-2.5" />
        </svg>
      </button>
      <div
        ref={menu}
        id={id}
        popover="auto"
        role="menu"
        aria-label="Reset component"
        data-reset-menu
        style={{ positionAnchor: anchor } as CSSProperties}
        className="min-w-[140px] rounded-lg border border-(--lab-border) bg-(--lab-panel) p-1 shadow-lg"
        onToggle={(event) => {
          if (event.newState === "open")
            menu.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();

            return;
          }

          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

          event.preventDefault();
          const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
          );

          const current = items.indexOf(document.activeElement as HTMLButtonElement);

          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? items.length - 1
                : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;

          items[next]?.focus();
        }}
      >
        <button
          type="button"
          role="menuitem"
          className={itemClass}
          onClick={() => reset(onResetTweaks)}
        >
          Reset tweaks
        </button>
        <button
          type="button"
          role="menuitem"
          className={itemClass}
          disabled={!hasSpacing}
          onClick={() => reset(onResetSpacing)}
        >
          Reset spacing
        </button>
      </div>
    </>
  );
}
