// ─── Partner config: Acumen Financial Planning (real prospect) ────────────────
// A branded prototype built to pitch Acumen (acumenfp.com), a Chartered and
// Accredited financial planning firm with offices across Scotland — not yet
// a paying customer, and not affiliated with or endorsed by them.
//
// Their logo (src/assets/partners/acumen-logo.svg) renders the wordmark in
// plain black and reserves their green (#47BD94) for the mountain/"A" mark
// alone — so that split (dark neutral for structure/text, green as the one
// accent) is what this theme follows: primary is a near-black charcoal
// (matching the wordmark), accent is their exact logo green, and secondary is
// a medium grey for borders/supporting UI. No live site CSS was available to
// pull an exact palette from, so the charcoal/grey values are a reasonable
// professional-neutral pairing rather than scraped hex codes — flag to
// Acumen if they'd like these adjusted to an exact brand grey.

import acumenLogo from "../../assets/partners/acumen-logo.svg";

export const ACUMEN = {
  slug: "acumen",
  fictional: false,
  whiteLabel: true,
  firmName: "Acumen Financial Planning",
  logoText: "Acumen Financial Planning",
  logoSrc: acumenLogo,

  theme: {
    primary: "#2B3134",
    secondary: "#8A9296",
    accent: "#47BD94",
    positive: "#A9DBC6",
    // Acumen's own headings use a plain sans-serif, not a serif display face
    // — same override as Innes Reid.
    headingFont: "'DM Sans', sans-serif",
  },

  adviserCtaLabel: "Discuss with a Financial Planner",
  adviserContactLabel: "Acumen will be in touch",
  consentLabel:
    "I agree for my details to be shared with Acumen so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 50,
    retirementAge: 65,
    currentSavings: 260000,
    monthlySavingsCurrent: 750,
    desiredIncome: 28000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Acumen supplies one (set
  // ACUMEN_LEAD_ENDPOINT server-side — see api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live. See
  // harbourVale.js for the equivalent.
  exampleStats: buildExampleStats({
    visits: { allTime: 1640, thisMonth: 355 },
    calculatorInteractions: { allTime: 970, thisMonth: 218 },
    pdfExports: { allTime: 512, thisMonth: 44 },
    enquiries: { allTime: 121, thisMonth: 29 },
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
