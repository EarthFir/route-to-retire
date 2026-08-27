import { mixHex } from "../colorMix.js";

// ─── Partner calculator theming ───────────────────────────────────────────────
// RetirementCalculator.jsx reads its brand colors from CSS custom properties
// (--calc-primary, --calc-accent, etc.), each with a fallback equal to Route
// to Retire's own palette — so the calculator renders exactly as it does
// today when nothing overrides them. This turns a partner's four base colors
// into the full set of CSS variables (including derived tints/shades) and
// returns them as a React inline-style object to spread onto a wrapper div.
export function calculatorThemeVars({ primary, secondary, accent, positive, tabActiveText, resultsTabActiveText, headingFont, secondaryText }) {
  return {
    "--calc-primary": primary,
    "--calc-secondary": secondary,
    "--calc-accent": accent,
    "--calc-positive": positive,
    // Optional: overrides the active-tab text color on light cards, for
    // partners whose accent is too close in hue/lightness to their primary
    // to read clearly there (falls back to --calc-accent when unset).
    ...(tabActiveText ? { "--calc-tab-active-text": tabActiveText } : {}),
    // Optional: overrides the active-tab text color on the dark "Your
    // Projection" card (falls back to --calc-primary when unset). No safe
    // universal default here, unlike secondaryText above — this text sits
    // directly on --calc-accent, which ranges from pale yellow to a bold
    // red across partners, so the readable color depends entirely on that
    // partner's own accent.
    ...(resultsTabActiveText ? { "--calc-results-tab-active-text": resultsTabActiveText } : {}),
    // Optional: overrides Tailwind's own --font-serif variable within this
    // subtree, so every `font-serif` class and `var(--font-serif)` inline
    // style (calculator headings/labels, the partner page's own H1/H2)
    // switches font for partners who don't want Route to Retire's serif.
    ...(headingFont ? { "--font-serif": headingFont } : {}),
    // Secondary/tertiary text colour used for labels, chart legends, and
    // other supporting text on the dark "Your Projection" panel. Defaults to
    // white — RetirementCalculator.jsx's own fallback chain would otherwise
    // fall through to --calc-positive, which reads as unintentional green
    // leftover branding for any partner whose positive colour isn't meant
    // for text (e.g. Churchill's sage green). Only override per-partner
    // (see innesReid.js) when white doesn't suit their palette.
    "--calc-secondary-text": secondaryText || "#FFFFFF",
    "--calc-primary-mid": mixHex(primary, "#FFFFFF", 0.18),
    "--calc-primary-deep": mixHex(primary, "#000000", 0.4),
    "--calc-accent-tint": mixHex(accent, "#FFFFFF", 0.9),
    "--calc-secondary-tint": mixHex(secondary, "#FFFFFF", 0.9),
  };
}
