// ─── Central Assumptions & Config ─────────────────────────────────────────────
// Single source of truth for every modelling assumption used by the calculator.
// Anything hardcoded that a user might reasonably want to understand or that we
// might want to tune lives here, so the on-screen "Assumptions" panel and the
// maths never drift apart.

/** The year the model treats as "today" (used for inflation and birth-year maths). */
export const CURRENT_YEAR = 2026;

/** Assumed annual inflation, applied to the target income between now and retirement. */
export const INFLATION_RATE = 0.025; // 2.5%

/** Default expected annual investment return while still saving (pre-retirement). */
export const DEFAULT_PRE_RETIREMENT_RETURN = 7; // %

/** Default expected annual investment return once in retirement (de-risked). */
export const DEFAULT_RETIREMENT_RETURN = 3.5; // %

/** Default full UK State Pension, gross per year (2026/27 rate). */
export const DEFAULT_STATE_PENSION_INCOME = 12547.6; // £/yr

/**
 * PLSA Retirement Living Standards: what a single person might need per year,
 * in today's money, to fund each standard of living. Published independently
 * of this calculator — offered as a rough external benchmark for the Desired
 * Annual Income input, not derived from our own modelling.
 */
export const RETIREMENT_LIVING_STANDARDS = [
  { key: "minimum", label: "Minimum", income: 13900 },
  { key: "moderate", label: "Moderate", income: 32700 },
  { key: "comfortable", label: "Comfortable", income: 45400 },
];

export const RETIREMENT_LIVING_STANDARDS_URL = "https://www.retirementlivingstandards.org.uk/";

/** Oldest age the drawdown / depletion model runs to. */
export const MODELLING_END_AGE = 100;

/** Default age the pot is modelled to last until (the planning horizon). */
export const DEFAULT_PLANNING_AGE = 95;

/** How many years the planning age must sit above the retirement age, at minimum. */
export const MIN_PLANNING_YEARS = 5;

/** Years before retirement over which the return glides down towards the retirement return. */
export const RETURN_GLIDE_YEARS = 10;

/**
 * The assumed investment return for a given age while still saving. Flat at
 * annualReturn until RETURN_GLIDE_YEARS before retirement, then eases in a
 * straight line down to retirementReturn by the retirement age itself —
 * reflecting the common pattern of shifting into lower-risk assets (e.g.
 * bonds) as retirement approaches, rather than staying fully invested right
 * up to the day you retire.
 */
export function getGlidedReturn(age, retirementAge, annualReturn, retirementReturn) {
  const yearsToRetirement = retirementAge - age;
  if (yearsToRetirement >= RETURN_GLIDE_YEARS) return annualReturn;
  if (yearsToRetirement <= 0) return retirementReturn;
  const progress = 1 - yearsToRetirement / RETURN_GLIDE_YEARS;
  return annualReturn + progress * (retirementReturn - annualReturn);
}

/** Age retirement income need starts easing off (the "spending taper"). */
export const SPENDING_TAPER_START_AGE = 72;

/** Age by which the taper is complete and income need levels off. */
export const SPENDING_TAPER_END_AGE = 82;

/** Income need as a fraction of the target income once the taper is complete. */
export const SPENDING_TAPER_END_FACTOR = 0.8; // 80%

/**
 * Fraction of the target income assumed to be needed at a given age in
 * retirement: 100% until SPENDING_TAPER_START_AGE, tapering in a straight
 * line down to SPENDING_TAPER_END_FACTOR by SPENDING_TAPER_END_AGE, then
 * flat. Reflects the common pattern of retirement spending easing in later
 * years, and lets a pot go a little further than a flat withdrawal would.
 */
export function getSpendingTaperFactor(age) {
  if (age <= SPENDING_TAPER_START_AGE) return 1;
  if (age >= SPENDING_TAPER_END_AGE) return SPENDING_TAPER_END_FACTOR;
  const progress = (age - SPENDING_TAPER_START_AGE) / (SPENDING_TAPER_END_AGE - SPENDING_TAPER_START_AGE);
  return 1 - progress * (1 - SPENDING_TAPER_END_FACTOR);
}

/**
 * Estimated State Pension age based on the user's current age.
 * Anyone born 1978 or later is assumed to reach it at 68, otherwise 67.
 */
export function getStatePensionAge(currentAge) {
  const birthYear = CURRENT_YEAR - currentAge;
  return birthYear >= 1978 ? 68 : 67;
}

const fmtPct = (v) => `${v}%`;
const fmtGBP = (v) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(v);

/**
 * Builds the plain-English list of assumptions currently in force, given the
 * live inputs. Returned as an ordered array of { label, value, note } so the
 * panel can render them without knowing any of the maths.
 */
export function getAssumptions({
  annualReturn,
  retirementReturn,
  includeStatePension,
  statePensionIncome,
  statePensionAge,
  planningAge,
}) {
  const rows = [
    {
      label: "Inflation",
      value: fmtPct(INFLATION_RATE * 100),
      note: "Used to grow your target income between now and retirement.",
    },
    {
      label: "Return while saving",
      value: fmtPct(annualReturn),
      note: "Assumed average annual growth on your pot before you retire.",
    },
    {
      label: "Return glide",
      value: `${fmtPct(annualReturn)} → ${fmtPct(retirementReturn)} over the last ${RETURN_GLIDE_YEARS} years`,
      note: `Rather than staying at ${fmtPct(
        annualReturn,
      )} right up to retirement day, your return is assumed to ease down towards ${fmtPct(
        retirementReturn,
      )} over the final ${RETURN_GLIDE_YEARS} years before you retire — reflecting how most managed pension funds automatically shift into lower-risk, lower-return assets like bonds as retirement approaches.`,
    },
    {
      label: "Return in retirement",
      value: fmtPct(retirementReturn),
      note: "Lower, more cautious growth once you start drawing an income, while the remaining pot keeps growing.",
    },
    {
      label: "Planning age",
      value: `Age ${planningAge}`,
      note: "The age your retirement pot is modelled to last until. You can adjust this.",
    },
    {
      label: "Target basis",
      value: `Draw down to age ${planningAge}`,
      note: `Your target pot is calculated so your savings could fund your target income from your selected retirement age until age ${planningAge}, using the assumed ${fmtPct(
        retirementReturn,
      )} return in retirement.`,
    },
    {
      label: "Spending taper",
      value: `100% to age ${SPENDING_TAPER_START_AGE}, easing to ${fmtPct(SPENDING_TAPER_END_FACTOR * 100)} by ${SPENDING_TAPER_END_AGE}`,
      note: `Retirement spending often eases with age. Your target income is assumed to stay level until age ${SPENDING_TAPER_START_AGE}, taper down to ${fmtPct(
        SPENDING_TAPER_END_FACTOR * 100,
      )} of its value by age ${SPENDING_TAPER_END_AGE}, then stay level from there — reducing the pot your plan needs to fund it.`,
    },
    {
      label: "State Pension age",
      value: includeStatePension ? `Age ${statePensionAge}` : "Not included",
      note: includeStatePension
        ? "Estimated from your current age. It reduces the income your pot must provide from this age on."
        : "Turn on the State Pension toggle to factor it in.",
    },
    {
      label: "State Pension amount",
      value: includeStatePension ? `${fmtGBP(statePensionIncome)}/yr` : "Not included",
      note: "Assumes the full UK State Pension for 2026/27. Subject to change.",
    },
    {
      label: "Money shown as",
      value: "Today's + future money",
      note: "Your target income is entered in today's money and inflated to your retirement year. Pot values (target and projected) are shown in future money — the actual pounds at retirement.",
    },
    {
      label: "Inheritances",
      value: "Invested until retirement",
      note: "Inheritances received before retirement are grown at your pre-retirement return. Any received after retirement are counted at face value.",
    },
    {
      label: "Tax",
      value: "Not included",
      note: "All figures are gross. Income tax, dividend tax and pension tax relief are not modelled — how much tax you actually pay depends on how you take your pension (lump sum, drawdown, annuity), which is worth discussing with a financial adviser.",
    },
  ];

  return rows;
}
