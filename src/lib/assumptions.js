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

/** Default full UK State Pension, gross per year. */
export const DEFAULT_STATE_PENSION_INCOME = 11500; // £/yr

/** Oldest age the drawdown / depletion model runs to. */
export const MODELLING_END_AGE = 100;

/** Default age the pot is modelled to last until (the planning horizon). */
export const DEFAULT_PLANNING_AGE = 95;

/** How many years the planning age must sit above the retirement age, at minimum. */
export const MIN_PLANNING_YEARS = 5;

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
  capitalPreservationTargetPot,
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
      label: "Conservative comparison",
      value:
        capitalPreservationTargetPot != null
          ? `${fmtGBP(capitalPreservationTargetPot)}`
          : "Not available",
      note:
        capitalPreservationTargetPot != null
          ? `The capital-preservation comparison estimates the pot required to draw your target income from investment return only, preserving the capital indefinitely. Shown for reference, not as the main target.`
          : "A capital-preservation figure needs a retirement return above 0%.",
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
      note: "Assumes the current full UK State Pension. Subject to change.",
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
      note: "All figures are gross. Income tax, dividend tax and pension tax relief are not modelled.",
    },
  ];

  return rows;
}
