// ─── Partner config: Wealth of Advice (real prospect) ──────────────────────────
// A branded prototype built to pitch Wealth of Advice (wealthofadvice.co.uk)
// — not yet a paying customer, and not affiliated with or endorsed by them.
// No logo asset yet: the client's mark (an orange banner/ribbon with a white
// "WEALTH OF ADVICE" wordmark) only reached this session as an inline image
// preview, not a file this environment could read bytes from, so this falls
// back to plain logoText for now — swap in logoSrc once the real SVG/PNG is
// dropped into src/assets/partners/. #76C3B2 (green) and #C44F18 (orange)
// are the client's own supplied brand colours, confirmed via their live
// site's strapline/copy tone ("No Nonsense Financial Planning") even though
// the site itself only visibly uses the orange — green is kept as primary
// per the client's explicit instruction to follow the original brief over
// what's currently live. Green alone isn't dark enough to double as everyday
// text colour (the role --calc-primary otherwise plays), so like Howard
// Wright this needed an invented dark derivative for that job, with the real
// brand green reinstated via resultsPanelColor so the "Your Projection"
// panel still carries their actual colour rather than the invented navy.
// Heading font is left as Route to Retire's own serif default — their real
// site's fonts couldn't be confirmed from the fetched markup.

export const WEALTH_OF_ADVICE = {
  slug: "wealth-of-advice",
  fictional: false,
  whiteLabel: true,
  firmName: "Wealth of Advice",
  logoText: "Wealth of Advice",

  theme: {
    primary: "#1F3B35",
    secondary: "#3C8874",
    accent: "#C44F18",
    positive: "#9FD6C7",
    // The "Your Projection" panel's own gradient uses the real brand green
    // instead of the invented dark-navy primary above, same treatment as
    // Howard Wright's real mid-blue.
    resultsPanelColor: "#76C3B2",
  },

  // Matches the direct, simple CTA wording used across their own site
  // ("Get In Touch") rather than this app's more formal default phrasing.
  adviserCtaLabel: "Get In Touch",
  adviserContactLabel: "Wealth of Advice will be in touch",
  consentLabel:
    "I agree for my details to be shared with Wealth of Advice so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 44,
    retirementAge: 65,
    currentSavings: 175000,
    monthlySavingsCurrent: 550,
    desiredIncome: 25000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Wealth of Advice supplies one
  // (set WEALTH_OF_ADVICE_LEAD_ENDPOINT server-side — see
  // api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live. See
  // harbourVale.js for the equivalent.
  exampleStats: buildExampleStats({
    visits: { allTime: 1080, thisMonth: 232 },
    calculatorInteractions: { allTime: 615, thisMonth: 140 },
    pdfExports: { allTime: 318, thisMonth: 27 },
    enquiries: { allTime: 68, thisMonth: 15 },
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
