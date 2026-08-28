// ─── Partner config: Churchill Wealth Management (real prospect) ──────────────
// A branded prototype built to pitch Churchill Wealth Management
// (churchillwealthmanagement.co.uk), a Bristol-based chartered wealth
// management firm specialising in pension transfers and retirement income
// planning — not yet a paying customer, and not affiliated with or endorsed
// by them. Colours are pulled from their live site CSS
// (wp-content/themes/churchillwm-child/route.min.css): navy (#214565) is
// their real button colour, the two blues are the exact gradient used on
// their own page headers. Their own headings run in Merriweather, a serif —
// close enough to Route to Retire's own serif default that no headingFont
// override is needed here, unlike Innes Reid/Acumen.

import churchillWmLogo from "../../assets/partners/churchill-wm-logo.png";

export const CHURCHILL_WM = {
  slug: "churchill-wm",
  fictional: false,
  whiteLabel: true,
  firmName: "Churchill Wealth Management",
  logoText: "Churchill Wealth Management",
  logoSrc: churchillWmLogo,
  // Their logo is a wide wordmark (650x142) with fine serif detail — reads
  // small at the shared partner-header default (h-8 sm:h-9).
  logoClassName: "h-10 sm:h-11 w-auto",

  theme: {
    primary: "#214565",
    secondary: "#3B8BCC",
    accent: "#4D99DC",
    positive: "#8BC1A5",
    // Their real CTA buttons (.cs-btn) are solid navy with white text —
    // mirrors that instead of falling back to the lighter accent blue.
    ctaBackground: "#214565",
    ctaText: "#FFFFFF",
  },

  adviserCtaLabel: "Discuss with a Wealth Manager",
  adviserContactLabel: "Churchill will be in touch",
  consentLabel:
    "I agree for my details to be shared with Churchill Wealth Management so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 51,
    retirementAge: 65,
    currentSavings: 310000,
    monthlySavingsCurrent: 850,
    desiredIncome: 32000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Churchill supplies one (set
  // CHURCHILL_WM_LEAD_ENDPOINT server-side — see api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live. See
  // harbourVale.js for the equivalent.
  exampleStats: buildExampleStats({
    visits: { allTime: 1520, thisMonth: 331 },
    calculatorInteractions: { allTime: 894, thisMonth: 202 },
    pdfExports: { allTime: 471, thisMonth: 41 },
    enquiries: { allTime: 109, thisMonth: 27 },
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
