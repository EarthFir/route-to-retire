// ─── Hex color mixing ──────────────────────────────────────────────────────
// Small linear-RGB interpolation helper used to derive lighter/darker shades
// and pale tints of a partner's brand colors (see partners/theme.js), so a
// config only has to supply a handful of base colors rather than every shade
// the calculator's UI happens to need.

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex(n) {
  return Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
}

/** Mix `hex` toward `target` (another hex color) by `amount` (0–1). */
export function mixHex(hex, target, amount) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const r = a.r + (b.r - a.r) * amount;
  const g = a.g + (b.g - a.g) * amount;
  const bl = a.b + (b.b - a.b) * amount;
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}
