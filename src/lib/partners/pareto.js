// ─── Partner config: Pareto (real prospect) ────────────────────────────────────
// A branded prototype built to pitch Pareto (paretofp.co.uk), a financial
// planning firm — not yet a paying customer, and not affiliated with or
// endorsed by them. Logo is the client's own supplied SVG lockup (black
// wordmark with the red diagonal cut through the "o"), used as-is with no
// recolouring needed. #1D1D1B (near-black) and #D93A2F (red) are both lifted
// directly from the logo file's own fill colours, so they're a pixel-exact
// match rather than an eyeballed guess. #4080A0 (blue) is the secondary
// brand colour as supplied directly by the client brief, since their site
// itself returned 403 to automated fetches and couldn't be scraped to
// cross-check. Because black is already about as dark as a colour can be,
// "primary" doubles as everyday text colour with no invented derivative
// needed (unlike Howard Wright/Wealth of Advice) — the dark "Your
// Projection" panel gradient falls through to its default mix-toward-black
// chain, which lands it essentially back at true black, matching the
// client's own black-background brand. Heading font is left as Route to
// Retire's own serif default — the client's real site couldn't be fetched to
// confirm what they actually use, so this doesn't guess at one.

import paretoLogo from "../../assets/partners/pareto-logo.svg";

export const PARETO = {
  slug: "pareto",
  fictional: false,
  whiteLabel: true,
  firmName: "Pareto",
  logoText: "Pareto",
  logoSrc: paretoLogo,

  theme: {
    primary: "#1D1D1B",
    secondary: "#4080A0",
    accent: "#D93A2F",
    positive: "#A9C9D6",
  },

  adviserCtaLabel: "Discuss with a Financial Adviser",
  adviserContactLabel: "Pareto will be in touch",
  consentLabel:
    "I agree for my details to be shared with Pareto so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 46,
    retirementAge: 65,
    currentSavings: 200000,
    monthlySavingsCurrent: 650,
    desiredIncome: 27000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Pareto supplies one (set
  // PARETO_LEAD_ENDPOINT server-side — see api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live. See
  // harbourVale.js for the equivalent.
  exampleStats: buildExampleStats({
    visits: { allTime: 1420, thisMonth: 305 },
    calculatorInteractions: { allTime: 840, thisMonth: 190 },
    pdfExports: { allTime: 470, thisMonth: 41 },
    enquiries: { allTime: 96, thisMonth: 22 },
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
