// ─── Partner config: Harbour & Vale (fictional demo) ──────────────────────────
// A pilot for adviser-branded calculator pages: config-driven branding, a
// preloaded scenario, and a lead capture form, reusing the real calculator.
// Harbour & Vale is not a real firm — see PartnerCalculatorPage.jsx.

export const HARBOUR_VALE = {
  slug: "harbour-vale",
  fictional: true,
  firmName: "Harbour & Vale Financial Planning",
  logoText: "Harbour & Vale",
  tagline: "Independent financial planning, built around your goals.",

  theme: {
    primary: "#1F6F78",
    secondary: "#3E8E90",
    accent: "#D8A24A",
    positive: "#9FC6B8",
  },

  adviserCtaLabel: "Discuss this with Harbour & Vale",
  adviserContactLabel: "Harbour & Vale will be in touch",
  consentLabel:
    "I agree for my details to be shared with Harbour & Vale Financial Planning so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 52,
    retirementAge: 60,
    currentSavings: 325000,
    monthlySavingsCurrent: 900,
    desiredIncome: 30000,
  },

  // "mock" logs the submission locally and shows the success state — nothing
  // is sent anywhere, which is what this fictional demo should do. Setting
  // VITE_HARBOUR_VALE_LEAD_ENDPOINT switches to "externalFormEndpoint" mode,
  // where the browser posts the lead straight to that (partner-owned) URL;
  // Route to Retire never stores it.
  lead: {
    mode: import.meta.env.VITE_HARBOUR_VALE_LEAD_ENDPOINT ? "externalFormEndpoint" : "mock",
    endpoint: import.meta.env.VITE_HARBOUR_VALE_LEAD_ENDPOINT || "",
  },

  // Example numbers for the "what an adviser would see" section below the
  // calculator — static, illustrative placeholders, not wired to real
  // analytics. (RetirementCalculator still beacons real PDF downloads to
  // api/pdf-downloads.js/Upstash in the background; this dashboard just
  // isn't reading it back for now.)
  exampleStats: buildExampleStats({
    visits: { allTime: 2140, thisMonth: 482 },
    calculatorInteractions: { allTime: 1360, thisMonth: 305 },
    pdfExports: { allTime: 825, thisMonth: 62 },
    enquiries: { allTime: 168, thisMonth: 47 },
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
