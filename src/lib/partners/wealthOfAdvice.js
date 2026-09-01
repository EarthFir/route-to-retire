// ─── Partner config: Wealth of Advice (real prospect) ──────────────────────────
// A branded prototype built to pitch Wealth of Advice (wealthofadvice.co.uk)
// — not yet a paying customer, and not affiliated with or endorsed by them.
// Logo is the client's own supplied asset (WoA_Logo_RGB_Orange_72dpi.png,
// the orange ribbon/banner mark with a white "WEALTH OF ADVICE" wordmark) —
// used as-is, no recolouring needed since it's already their real on-brand
// orange. #76C3B2 (green) and #C44F18 (orange)
// are the client's own supplied brand colours, confirmed via their live
// site's strapline/copy tone ("No Nonsense Financial Planning") even though
// the site itself only visibly uses the orange — green is kept as primary
// per the client's explicit instruction to follow the original brief over
// what's currently live. Green alone isn't dark enough to double as everyday
// text colour (the role --calc-primary otherwise plays), so like Howard
// Wright this needed an invented dark derivative for that job, with the real
// brand green reinstated via resultsPanelStart/End (below) so the "Your
// Projection" panel still carries their actual colour rather than the
// invented navy.
// Client asked for an all-sans-serif treatment, so headingFont swaps in
// Montserrat (already self-hosted for Howard Wright) over Route to Retire's
// serif default.

import wealthOfAdviceLogo from "../../assets/partners/WoA_Logo_RGB_Orange_72dpi.png";

export const WEALTH_OF_ADVICE = {
  slug: "wealth-of-advice",
  fictional: false,
  whiteLabel: true,
  firmName: "Wealth of Advice",
  logoText: "Wealth of Advice",
  logoSrc: wealthOfAdviceLogo,
  // The banner shape is quite wide and flat relative to its own text, so
  // this app's default header height (h-8/h-9) renders the wordmark too
  // small to read — sized up like Kellands/Howard Wright's own logos.
  logoClassName: "h-12 sm:h-14 w-auto",

  theme: {
    primary: "#1F3B35",
    secondary: "#3C8874",
    accent: "#C44F18",
    positive: "#9FD6C7",
    headingFont: "'Montserrat', sans-serif",
    // Client asked for the "Your Route" input tabs' active state to use the
    // orange accent with white text, rather than the default dark-primary
    // background this app otherwise gives every partner there.
    tabActiveBg: "#C44F18",
    tabActiveText: "#FFFFFF",
    // Client asked for white text on the "Your Projection" panel's active
    // tab too (that side already defaults to an accent-orange background —
    // see TabBar in RetirementCalculator.jsx — just not white text).
    resultsTabActiveText: "#FFFFFF",
    // Client asked for the "Your Projection" panel itself to run the real
    // brand green fading to a darker tone, rather than the derived-from-
    // primary gradient every partner gets by default. resultsPanelStart is
    // the literal brand green (76C3B2) at the top of the panel — where the
    // accent-orange target-pot figure sits, and orange reads clearly enough
    // against this lighter green — fading to a deep near-black green at the
    // bottom (client asked for the bottom tone pushed 20% darker still than
    // the "primary" teal-green it started as).
    resultsPanelStart: "#76C3B2",
    resultsPanelEnd: "#192F2A",
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
