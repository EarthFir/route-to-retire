// ─── Partner config: Hartsfield (real prospect) ────────────────────────────────
// A branded prototype built to pitch Hartsfield (hartsfield.co.uk), a
// Bristol/Bath-based financial planning and wealth management firm — not yet
// a paying customer, and not affiliated with or endorsed by them. Colours
// are pulled from their live site CSS: navy (#073059) is their real heading
// and form-panel colour, blue (#4A96D2) their link/h3 colour, and the red
// (#E9425C) is their actual "Get in touch" button colour — matches the red
// accent the client described. Their own headings use a bold rounded
// sans-serif (mazzardh_semibold, a paid font not available to us), so
// headingFont swaps in DM Sans rather than leaving Route to Retire's serif
// default, same treatment as Innes Reid/Simpson FS.

import hartsfieldLogo from "../../assets/partners/hartsfield-logo.png";

export const HARTSFIELD = {
  slug: "hartsfield",
  fictional: false,
  whiteLabel: true,
  firmName: "Hartsfield",
  logoText: "Hartsfield",
  logoSrc: hartsfieldLogo,
  // 75% larger than our default header size — their logo reads small
  // otherwise.
  logoClassName: "h-16 sm:h-[70px] w-auto",
  tagline: "Financial planning for a confident retirement.",
  taglineLines: ["Financial planning,", "for a confident retirement."],

  theme: {
    primary: "#073059",
    secondary: "#4A96D2",
    accent: "#E9425C",
    positive: "#3FB498",
    headingFont: "'DM Sans', sans-serif",
    // Real CTA treatment from their own site (btnGetInTouch's hover state).
    ctaBackground: "#E9425C",
    ctaText: "#FFFFFF",
    // The active "Overview" tab sits on this red accent — white reads far
    // better there than the default navy primary text.
    resultsTabActiveText: "#FFFFFF",
    // Mirrors the above for the "Your Details"/"Options" tab on the light
    // side — its active background is the dark navy primary, so it uses
    // white instead of falling back to the red accent.
    tabActiveText: "#FFFFFF",
  },

  adviserCtaLabel: "Discuss with a Financial Planner",
  adviserContactLabel: "Hartsfield will be in touch",
  consentLabel:
    "I agree for my details to be shared with Hartsfield so they can contact me about my retirement planning enquiry.",

  defaultScenario: {
    currentAge: 47,
    retirementAge: 65,
    currentSavings: 265000,
    monthlySavingsCurrent: 750,
    desiredIncome: 30000,
  },

  // No real lead endpoint yet — this is a prototype, not a commissioned
  // build. Falls back to mock delivery until Hartsfield supplies one (set
  // HARTSFIELD_LEAD_ENDPOINT server-side — see api/_lib/partners.js).

  // Static, illustrative placeholders for the "what an adviser would see"
  // section — there's no real traffic yet, so nothing here is live.
  exampleStats: buildExampleStats({
    visits: { allTime: 1340, thisMonth: 287 },
    calculatorInteractions: { allTime: 781, thisMonth: 172 },
    pdfExports: { allTime: 402, thisMonth: 36 },
    enquiries: { allTime: 94, thisMonth: 22 },
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
