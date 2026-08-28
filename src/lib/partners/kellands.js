// ─── Partner config: Kellands (real prospect) ──────────────────────────────────
// A branded prototype built to pitch Kellands (Hale) Limited (kelland-hale.com),
// Cheshire-based independent financial advisers and Chartered Financial
// Planners — not yet a paying customer, and not affiliated with or endorsed by
// them. Logo is their own site header asset (kellands_logo_chartered.png),
// recoloured from white to their brand navy — the source file is a solid
// white mark on a transparent background (reads fine on their own dark navy
// header, but is invisible on this page's white one), so swapping its one
// fill colour gives a crisp, exact reproduction rather than a raster guess.
// Navy (#0F3D66) and pale yellow (#FBFF82) are both lifted directly from a
// CSS custom-property block set inline on their own homepage
// (--header-bg-color / --accent-color / --nav-divider-color), i.e. genuinely
// deliberate brand colours, not a page-builder default. Because their real
// navy is already dark enough to double as everyday text/button colour, this
// didn't need an invented primary the way Howard Wright's near-monochrome
// blue brand did — the "Your Projection" panel's gradient derives from it
// automatically with no resultsPanelColor override. Secondary is a soft,
// mid-tone blue (not lifted from their site, which doesn't use one) chosen to
// read as "pale blue" while still clearing WCAG AA (~5.6:1) as body text/link
// colour on white. Their real headings run in Merriweather (Google Fonts),
// so headingFont swaps that in over Route to Retire's serif default.

import kellandsLogo from "../../assets/partners/kellands-logo.png";

export const KELLANDS = {
  slug: "kellands",
  fictional: false,
  whiteLabel: true,
  firmName: "Kellands",
  logoText: "Kellands",
  logoSrc: kellandsLogo,
  logoClassName: "h-14 sm:h-16 w-auto",

  theme: {
    primary: "#0F3D66",
    secondary: "#3F76A5",
    accent: "#FBFF82",
    positive: "#9FC4E0",
    headingFont: "'Merriweather', serif",
  },

  adviserCtaLabel: "Discuss with a Financial Planner",
  adviserContactLabel: "Kellands will be in touch",
  consentLabel:
    "I agree for my details to be shared with Kellands so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 47,
    retirementAge: 65,
    currentSavings: 240000,
    monthlySavingsCurrent: 700,
    desiredIncome: 28000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Kellands supplies one (set
  // KELLANDS_LEAD_ENDPOINT server-side — see api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live. See
  // harbourVale.js for the equivalent.
  exampleStats: buildExampleStats({
    visits: { allTime: 1140, thisMonth: 248 },
    calculatorInteractions: { allTime: 652, thisMonth: 148 },
    pdfExports: { allTime: 337, thisMonth: 29 },
    enquiries: { allTime: 74, thisMonth: 17 },
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
