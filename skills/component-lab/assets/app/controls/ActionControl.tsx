import type { ActionControl } from "../../schema/index";

export default function ActionControlEditor({
  label,
  control,
  busy,
  disabled,
  error,
  onClick,
}: {
  label: string;
  control: ActionControl;
  busy: boolean;
  disabled: boolean;
  error: string | null;
  onClick: () => void;
}) {
  return (
    <div
      data-control="action"
      className="min-w-0 rounded-[6px] bg-(--lab-control) px-2 text-[11px] text-(--lab-muted)"
    >
      <div className="flex min-h-[30px] min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 truncate" title={label}>
          {label}
        </span>
        <button
          type="button"
          disabled={disabled}
          aria-busy={busy}
          onClick={onClick}
          className="my-1 min-w-0 truncate rounded-[4px] border-0 bg-(--lab-active) px-2 py-1 text-[10px] leading-none text-(--lab-text) shadow-[0_1px_3px_var(--lab-shadow)] hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Running…" : control.button}
        </button>
      </div>
      {error ? (
        <p role="alert" className="pb-1.5 text-[9px] text-(--lab-error-text)">
          {error}
        </p>
      ) : null}
    </div>
  );
}
