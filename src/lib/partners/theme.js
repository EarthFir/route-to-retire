import { mixHex } from "../colorMix.js";

// ─── Partner calculator theming ───────────────────────────────────────────────
// RetirementCalculator.jsx reads its brand colors from CSS custom properties
// (--calc-primary, --calc-accent, etc.), each with a fallback equal to Route
// to Retire's own palette — so the calculator renders exactly as it does
// today when nothing overrides them. This turns a partner's four base colors
// into the full set of CSS variables (including derived tints/shades) and
// returns them as a React inline-style object to spread onto a wrapper div.
export function calculatorThemeVars({ primary, secondary, accent, positive }) {
  return {
    "--calc-primary": primary,
    "--calc-secondary": secondary,
    "--calc-accent": accent,
    "--calc-positive": positive,
    "--calc-primary-mid": mixHex(primary, "#FFFFFF", 0.18),
    "--calc-primary-deep": mixHex(primary, "#000000", 0.4),
    "--calc-accent-tint": mixHex(accent, "#FFFFFF", 0.9),
    "--calc-secondary-tint": mixHex(secondary, "#FFFFFF", 0.9),
  };
}
