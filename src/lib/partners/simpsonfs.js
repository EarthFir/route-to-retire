// ─── Partner config: Simpson Financial Services (real prospect) ───────────────
// A branded prototype built to pitch Simpson FS (simpsonfs.co.uk), an
// independent financial adviser in Leamington Spa — not yet a paying
// customer, and not affiliated with or endorsed by them. Colours, fonts and
// logo are pulled from their real site so the mockup shows accurately what a
// commissioned build would look like. See PartnerCalculatorPage.jsx, which
// reads `fictional: false` to adjust the on-page disclaimers accordingly.

import simpsonFsLogo from "../../assets/partners/simpson-fs-logo.svg";

export const SIMPSON_FS = {
  slug: "simpsonfs",
  fictional: false,
  // Real outreach material, not an internal pitch — hides the "for advisers"
  // dashboard/pricing section and every on-page "Route to Retire" mention so
  // the page reads as Simpson's own calculator. The routetoretire.co.uk URL
  // is the one thing this can't hide; that needs the iframe embed instead.
  whiteLabel: true,
  firmName: "Simpson Financial Services",
  logoText: "Simpson Financial Services",
  logoSrc: simpsonFsLogo,

  theme: {
    primary: "#004289",
    secondary: "#7AB2E1",
    accent: "#7AB2E1",
    positive: "#E5E9EF",
    // Accent (light blue) is too close to primary (navy) to read clearly as
    // the active input-tab label, so that one spot uses white instead.
    tabActiveText: "#FFFFFF",
  },

  adviserCtaLabel: "Discuss with a Financial Advisor",
  adviserContactLabel: "Simpson Financial Services will be in touch",
  consentLabel:
    "I agree for my details to be shared with Simpson Financial Services so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 48,
    retirementAge: 65,
    currentSavings: 210000,
    monthlySavingsCurrent: 650,
    desiredIncome: 26000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Simpson FS supplies one (set
  // SIMPSONFS_LEAD_ENDPOINT server-side — see api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live. See
  // harbourVale.js for the equivalent.
  exampleStats: buildExampleStats({
    visits: { allTime: 1860, thisMonth: 410 },
    calculatorInteractions: { allTime: 1120, thisMonth: 260 },
    pdfExports: { allTime: 640, thisMonth: 55 },
    enquiries: { allTime: 142, thisMonth: 38 },
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
