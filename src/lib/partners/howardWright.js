// ─── Partner config: Howard Wright (real prospect) ─────────────────────────────
// A branded prototype built to pitch Howard Wright (howardwright.co.uk), a
// financial planning firm — not yet a paying customer, and not affiliated
// with or endorsed by them. Logo is their own site header SVG
// (hw-whitelogo.svg, the full "Howard Wright / Financial Planning" lockup)
// recoloured from white to their brand blue — the source file is a solid
// white mark on a transparent background, so swapping its one fill colour
// gives an exact, crisp vector reproduction rather than a raster guess.
// #00A0E3 is their real, deliberate brand blue (headings, CTA buttons, hero
// gradient start, and the logo recolour above). Light (#5D92D4) and medium
// (#4884CF) blue are the client-supplied brand blues used for the
// calculator's accent/positive colours. Their site itself has no dark navy
// tone to reuse as-is (it's a near-monochrome blue brand), so "primary" here
// is a deepened derivative of their own blue rather than a literal lift —
// needed so the dark "Your Projection" panel and its text stay readable,
// matching the role --calc-primary plays for every other partner. Their own
// headings use Montserrat, a Google Font we could match exactly (unlike
// Hartsfield/Innes Reid's paid faces), so headingFont swaps that in over
// Route to Retire's serif default.

import howardWrightLogo from "../../assets/partners/howard-wright-logo.svg";

export const HOWARD_WRIGHT = {
  slug: "howard-wright",
  fictional: false,
  whiteLabel: true,
  firmName: "Howard Wright",
  logoText: "Howard Wright",
  logoSrc: howardWrightLogo,
  // 50% larger than our default header size — their logo reads small
  // otherwise.
  logoClassName: "h-[72px] sm:h-[84px] w-auto",

  theme: {
    primary: "#052C3E",
    secondary: "#00A0E3",
    accent: "#4884CF",
    positive: "#5D92D4",
    // The active "Overview" tab sits on this medium-blue accent — it's close
    // enough in lightness to navy primary that dark text reads poorly there,
    // so it uses light text instead (same treatment as Churchill's CTAs).
    resultsTabActiveText: "#FFFFFF",
    // Mirrors the above for the "Your Details"/"Options" tab on the light
    // side — its active background is the dark navy primary, so it needs the
    // same light text rather than falling back to the mid-blue accent.
    tabActiveText: "#FFFFFF",
    // The "Your Projection" panel's own gradient uses this instead of
    // --calc-primary — their real medium brand blue, shading down to a much
    // darker tone, rather than the invented dark navy above (which still has
    // to double as everyday text color on the light "Your Route" side).
    resultsPanelColor: "#4884CF",
    headingFont: "'Montserrat', sans-serif",
    // Real CTA treatment from their own site (.et_pb_button_one's base state).
    ctaBackground: "#00A0E3",
    ctaText: "#FFFFFF",
  },

  adviserCtaLabel: "Discuss with a Financial Planner",
  adviserContactLabel: "Howard Wright will be in touch",
  consentLabel:
    "I agree for my details to be shared with Howard Wright so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 45,
    retirementAge: 65,
    currentSavings: 220000,
    monthlySavingsCurrent: 650,
    desiredIncome: 26000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Howard Wright supplies one (set
  // HOWARD_WRIGHT_LEAD_ENDPOINT server-side — see api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live. See
  // harbourVale.js for the equivalent.
  exampleStats: buildExampleStats({
    visits: { allTime: 1150, thisMonth: 245 },
    calculatorInteractions: { allTime: 690, thisMonth: 158 },
    pdfExports: { allTime: 365, thisMonth: 33 },
    enquiries: { allTime: 82, thisMonth: 19 },
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
