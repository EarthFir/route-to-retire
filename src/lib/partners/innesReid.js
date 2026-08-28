// ─── Partner config: Innes Reid (real prospect) ────────────────────────────────
// A branded prototype built to pitch Innes Reid (innesreid.co.uk), a chartered
// financial planning firm and Titan Wealth company — not yet a paying
// customer, and not affiliated with or endorsed by them. Colours are pulled
// from their live site CSS (wp-content/themes/innis/css/additional.css) so
// the mockup shows accurately what a commissioned build would look like. No
// logo asset yet — see logoText fallback in PartnerCalculatorPage.jsx's
// PartnerHeader; swap in logoSrc once a real logo file is supplied.
//
// Innes Reid's own headings use a plain sans-serif, not a serif display face
// — headingFont overrides Route to Retire's default Source Serif 4 (see
// calculatorThemeVars in theme.js) so the prototype doesn't read as a
// generic Route to Retire page wearing their colours.

import innesReidLogo from "../../assets/partners/innes-reid-logo.png";

export const INNES_REID = {
  slug: "innes-reid",
  fictional: false,
  whiteLabel: true,
  firmName: "Innes Reid",
  logoText: "Innes Reid",
  logoSrc: innesReidLogo,
  // 50% larger than the shared partner-header default (h-8 sm:h-9) — their
  // logo reads small at the standard size.
  logoClassName: "h-12 sm:h-[54px] w-auto",

  theme: {
    primary: "#0C477D",
    secondary: "#CE0A70",
    // Accent stays their lighter blue rather than the magenta below — it's
    // used directly as text/chart-line colour on the dark "Your Projection"
    // panel, where the magenta is too dark to read clearly against navy.
    accent: "#60A3CD",
    positive: "#B7CD69",
    // Accent (mid-blue) is close enough in lightness to primary (navy) to
    // read poorly as the active input-tab label — same fix as Simpson FS.
    tabActiveText: "#FFFFFF",
    headingFont: "'DM Sans', sans-serif",
    // Labels and secondary text (chart legends, stats indicators, etc.) use
    // white instead of the green from Harbour & Vale, to match Innes Reid's
    // own minimalist aesthetic.
    secondaryText: "#FFFFFF",
    // The "Discuss with..." / lead-form submit buttons use their real CTA
    // treatment (magenta bg, white text — matches their own site's login
    // buttons) rather than the accent blue used elsewhere.
    ctaBackground: "#CE0A70",
    ctaText: "#FFFFFF",
  },

  adviserCtaLabel: "Discuss with a Financial Advisor",
  adviserContactLabel: "Innes Reid will be in touch",
  consentLabel:
    "I agree for my details to be shared with Innes Reid so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 49,
    retirementAge: 63,
    currentSavings: 245000,
    monthlySavingsCurrent: 700,
    desiredIncome: 27000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Innes Reid supplies one (set
  // INNES_REID_LEAD_ENDPOINT server-side — see api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live. See
  // harbourVale.js for the equivalent.
  exampleStats: buildExampleStats({
    visits: { allTime: 1780, thisMonth: 392 },
    calculatorInteractions: { allTime: 1050, thisMonth: 241 },
    pdfExports: { allTime: 588, thisMonth: 49 },
    enquiries: { allTime: 133, thisMonth: 34 },
  }),
};

function formatCount(n) {
  return n.toLocaleString("en-GB");
}

function formatConversion(enquiries, visits) {
  return `${((enquiries / visits) * 100).toFixed(1)}%`;
}

function buildExampleStats({ visits, calculatorInteractions, pdfExports, enquiries }) {
  return [
    { label: "Visits", allTime: formatCount(visits.allTime), thisMonth: formatCount(visits.thisMonth) },
    { label: "Calculator interactions", allTime: formatCount(calculatorInteractions.allTime), thisMonth: formatCount(calculatorInteractions.thisMonth) },
    { label: "PDF exports", allTime: formatCount(pdfExports.allTime), thisMonth: formatCount(pdfExports.thisMonth) },
    { label: "Enquiries", allTime: formatCount(enquiries.allTime), thisMonth: formatCount(enquiries.thisMonth) },
    {
      label: "Conversion rate",
      allTime: formatConversion(enquiries.allTime, visits.allTime),
      thisMonth: formatConversion(enquiries.thisMonth, visits.thisMonth),
    },
  ];
}
