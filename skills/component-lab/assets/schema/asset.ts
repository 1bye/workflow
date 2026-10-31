export const MAX_ASSET_BYTES = 256 * 1024;
export const ASSET_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const maxSourceLength = Math.ceil((MAX_ASSET_BYTES * 4) / 3) + 256;

export function isAssetSource(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= maxSourceLength &&
    (value === "" ||
      (/^\/(?!\/)/.test(value) && !/[\u0000-\u001f\u007f\\]/.test(value)) ||
      /^data:image\/(?:png|jpeg|webp|gif|svg\+xml)(?:;base64)?,/i.test(value))
  );
}
