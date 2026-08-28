// ─── Partner config: Informed Financial Planning (real prospect) ──────────────
// A branded prototype built to pitch Informed Financial Planning
// (informedfinancialplanning.co.uk), an employee-owned firm of Chartered
// Financial Planners based in Hessle/Leeds/Barnsley — not yet a paying
// customer, and not affiliated with or endorsed by them. Logo is the client's
// own supplied lockup (teal/gold circular mark + "INFORMED financial
// planning" wordmark) — it reads cleanly on a light background as-is, no
// recolouring needed, unlike Howard Wright's white-on-transparent asset.
// Teal (#336771) and gold (#DACC77) are the client-supplied brand colours —
// confirmed as genuinely deliberate by grepping their live site's CSS for
// recurring custom hex values (not the WordPress/Gutenberg default palette
// also present there): #236972 and #E1C773 are near-identical shades used
// repeatedly for icon fills and the footer, i.e. the same two colours in
// practice. Blue (#37869A) is the client's third supplied colour, used as
// "secondary" for headings/logo-adjacent accents even though it wasn't found
// directly on the scraped homepage (their Color Scheme Switcher plugin
// suggests more than one palette variant is in play across the site).
// "Primary" is their real button colour — .wp-block-button__link's default
// background-color (#32373C, a dark charcoal) — genuinely dark enough to
// double as everyday text colour on the light "Your Route" side, so unlike
// Howard Wright this didn't need an invented navy. Per the client's explicit
// instruction, the "Your Projection" panel uses resultsPanelColor to give it
// teal's own gradient instead of the (more neutral-grey) primary. Their real
// heading/body font is Open Sans (Google Fonts), so headingFont swaps that in
// over Route to Retire's serif default.

import informedFinancialPlanningLogo from "../../assets/partners/informed-financial-planning-logo.svg";

export const INFORMED_FINANCIAL_PLANNING = {
  slug: "informed-fp",
  fictional: false,
  whiteLabel: true,
  firmName: "Informed Financial Planning",
  logoText: "Informed Financial Planning",
  logoSrc: informedFinancialPlanningLogo,
  logoClassName: "h-14 sm:h-16 w-auto",
  tagline: "Independent, chartered financial planning for your future.",
  taglineLines: ["Independent, chartered financial planning,", "for your future."],

  theme: {
    primary: "#32373C",
    secondary: "#37869A",
    accent: "#DACC77",
    positive: "#336771",
    // The client wants a gradient between the two brand colors for the
    // "Your Projection" panel, rather than the (more neutral charcoal)
    // primary. Teal sits at the top (0%) rather than the lighter blue,
    // because the accent-gold target-pot figure lives near the top of the
    // panel and needs the darker of the two colors behind it for contrast —
    // blue alone there tests at ~2.6:1, well under WCAG AA, while teal gets
    // it to ~3.9:1 (passes for the figure's large bold text). Blue lands at
    // the bottom (100%), where it mostly sits behind the chart rather than
    // text.
    resultsPanelStart: "#336771",
    resultsPanelEnd: "#37869A",
    // White reads better than the default muted teal-grey against this
    // panel's teal-to-blue gradient.
    chartAxisText: "#FFFFFF",
    headingFont: "'Open Sans', sans-serif",
    // Client asked for the gold accent with black text on the "Discuss with
    // a Financial Planner" CTA, overriding their real site's charcoal
    // button treatment.
    ctaBackground: "#DACC77",
    ctaText: "#000000",
  },

  adviserCtaLabel: "Discuss with a Financial Planner",
  adviserContactLabel: "Informed will be in touch",
  consentLabel:
    "I agree for my details to be shared with Informed Financial Planning so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 44,
    retirementAge: 65,
    currentSavings: 195000,
    monthlySavingsCurrent: 600,
    desiredIncome: 24000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Informed Financial Planning
  // supplies one (set INFORMED_FP_LEAD_ENDPOINT server-side —
  // see api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live. See
  // harbourVale.js for the equivalent.
  exampleStats: buildExampleStats({
    visits: { allTime: 980, thisMonth: 214 },
    calculatorInteractions: { allTime: 561, thisMonth: 127 },
    pdfExports: { allTime: 289, thisMonth: 24 },
    enquiries: { allTime: 61, thisMonth: 14 },
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
