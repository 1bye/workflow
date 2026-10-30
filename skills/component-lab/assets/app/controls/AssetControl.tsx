import { useRef, useState } from "react";
import { ASSET_TYPES, isAssetSource, MAX_ASSET_BYTES } from "../../schema/asset";
import { Heading } from "./shared";

async function readImage(file: File): Promise<string> {
  if (!ASSET_TYPES.includes(file.type))
    throw new Error("Choose a PNG, JPEG, WebP, GIF, or SVG image.");

  if (file.size > MAX_ASSET_BYTES)
    throw new Error("Choose an image up to 256 KB, or use a project path.");

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn’t read this file."));
    reader.readAsDataURL(file);
  });

  const image = new Image();

  image.src = source;

  try {
    await image.decode();
  } catch {
    throw new Error("This file could not be opened as an image.");
  }

  return source;
}

export default function AssetControlEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const embedded = value.startsWith("data:");

  function commitSource() {
    if (draft === null) return;

    let source = draft.trim();

    try {
      const url = new URL(source, location.href);

      if (url.origin === location.origin && source.startsWith(location.origin))
        source = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      /* The source validator below supplies the inline error. */
    }

    if (!isAssetSource(source)) {
      setError("Use a local image path such as /drafts/images/photo.png.");

      return;
    }

    onChange(source);
    setDraft(null);
    setError(null);
    setFailedSource(null);
  }

  return (
    <fieldset
      aria-label={label}
      data-control="asset"
      className="min-w-0 rounded-[6px] border-0 bg-(--lab-control) p-2 text-[11px] text-(--lab-muted)"
    >
      <Heading label={label}>
        <button
          type="button"
          disabled={busy}
          onClick={() => picker.current?.click()}
          aria-label={`Choose ${label.toLowerCase()}`}
          className="rounded border-0 px-1 text-[10px] hover:bg-(--lab-active) hover:text-(--lab-text) disabled:opacity-50"
        >
          {busy ? "Reading…" : "Choose"}
        </button>
      </Heading>
      <input
        ref={picker}
        type="file"
        accept={ASSET_TYPES.join(",")}
        className="hidden"
        tabIndex={-1}
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];

          event.currentTarget.value = "";

          if (!file) return;

          setBusy(true);
          setError(null);

          try {
            onChange(await readImage(file));
            setDraft(null);
            setFailedSource(null);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : String(caught));
          } finally {
            setBusy(false);
          }
        }}
      />
      <div className="flex min-w-0 items-center gap-1.5">
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[4px] bg-(--lab-surface)">
          {value && failedSource !== value ? (
            <img
              src={value}
              alt={`${label} thumbnail`}
              className="size-full object-cover"
              onError={() => setFailedSource(value)}
            />
          ) : (
            <span aria-hidden="true" className="text-base text-(--lab-faint)">
              ◇
            </span>
          )}
        </div>
        <input
          type="text"
          aria-label={`${label} source`}
          disabled={busy}
          placeholder={embedded ? "Embedded image" : "/drafts/image.png"}
          value={draft ?? (embedded ? "" : value)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitSource}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          className="h-7 w-full min-w-0 border-0 bg-transparent p-0 text-[10px] text-(--lab-text) placeholder:text-(--lab-faint)"
        />
        <button
          type="button"
          aria-label={`Clear ${label.toLowerCase()}`}
          disabled={!value || busy}
          className="size-5 shrink-0 rounded border-0 text-(--lab-faint) hover:bg-(--lab-active) hover:text-(--lab-text) disabled:opacity-30"
          onClick={() => {
            onChange("");
            setDraft(null);
            setError(null);
            setFailedSource(null);
          }}
        >
          ×
        </button>
      </div>
      {error || (value && failedSource === value) ? (
        <p role="alert" className="mt-1 text-[9px] text-(--lab-error-text)">
          {error ?? "Image unavailable. Check its path."}
        </p>
      ) : null}
    </fieldset>
  );
}
