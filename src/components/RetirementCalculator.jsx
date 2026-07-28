import { useState, useMemo, useEffect } from "react";
import { useForm, ValidationError } from "@formspree/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  CURRENT_YEAR,
  INFLATION_RATE,
  DEFAULT_PRE_RETIREMENT_RETURN,
  DEFAULT_RETIREMENT_RETURN,
  DEFAULT_STATE_PENSION_INCOME,
  DEFAULT_PLANNING_AGE,
  MIN_PLANNING_YEARS,
  MODELLING_END_AGE,
  getStatePensionAge,
  getAssumptions,
} from "../lib/assumptions.js";
import { Link } from "../lib/Link.jsx";
import SiteFooter from "../pages/SiteFooter.jsx";

// ─── Pure Calculation Utilities ───────────────────────────────────────────────

function formatGBP(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function calcInheritanceFV(amount, receivedAge, retirementAge, r) {
  if (!amount || !receivedAge) return { futureValue: 0, afterRetirement: false };
  if (receivedAge < retirementAge) {
    return {
      futureValue: amount * Math.pow(1 + r, retirementAge - receivedAge),
      afterRetirement: false,
    };
  }
  return { futureValue: amount, afterRetirement: true };
}

function findCoastAge({ currentAge, retirementAge, currentSavings, monthlySavingsCurrent, targetPot, r, totalInheritanceFV }) {
  for (let age = currentAge; age <= retirementAge; age++) {
    const yearsSaving = age - currentAge;
    const yearsAfterStop = retirementAge - age;
    const fvCurrentToStop = currentSavings * Math.pow(1 + r, yearsSaving);
    const fvContributionsToStop =
      yearsSaving > 0 && r > 0
        ? monthlySavingsCurrent * 12 * (Math.pow(1 + r, yearsSaving) - 1) / r
        : monthlySavingsCurrent * 12 * yearsSaving;
    const potAtStop = fvCurrentToStop + fvContributionsToStop;
    const fvFinal = potAtStop * Math.pow(1 + r, yearsAfterStop) + totalInheritanceFV;
    if (fvFinal >= targetPot) return { coastAge: age, yearsUntilCoast: age - currentAge };
  }
  return { coastAge: null, yearsUntilCoast: null };
}

function getStatus(isCoast, monthlySavings, savingsGap, yearsToRetirement) {
  if (isCoast) return "green";
  if (monthlySavings > 1000 || savingsGap > 250 || (yearsToRetirement < 10 && !isCoast)) return "red";
  return "amber";
}

function calculateAll({ currentAge, retirementAge, currentSavings, desiredIncome, annualReturn, inheritances, includeStatePension, statePensionIncome, monthlySavingsCurrent, statePensionAge, retirementReturn, planningAge }) {
  const r = annualReturn / 100;
  const retirementR = retirementReturn / 100;
  const years = retirementAge - currentAge;
  const inflationRate = INFLATION_RATE;
  const inflatedDesiredIncome = desiredIncome * Math.pow(1 + inflationRate, years);
  const incomeNeeded = includeStatePension ? Math.max(0, inflatedDesiredIncome - statePensionIncome) : inflatedDesiredIncome;

  // Planning age is what the pot is modelled to last until. Enforce a sensible
  // floor so it always sits at least a few years beyond retirement.
  const effectivePlanningAge = Math.max(
    Number.isFinite(planningAge) ? planningAge : DEFAULT_PLANNING_AGE,
    retirementAge + MIN_PLANNING_YEARS,
  );
  const yearsInRetirement = Math.max(0, effectivePlanningAge - retirementAge);

  // The withdrawal the pot must fund at a given retirement age: the full target
  // income, less the State Pension once it has started.
  const withdrawalAtAge = (age) =>
    includeStatePension && age >= statePensionAge
      ? Math.max(0, inflatedDesiredIncome - statePensionIncome)
      : inflatedDesiredIncome;

  // Target pot = present value at retirement of every yearly withdrawal from
  // retirement until the planning age, discounted at the retirement return.
  // This is the drawdown-to-age basis (the pot is spent down, not preserved),
  // and it is consistent with the depletion loop below.
  let targetPot = 0;
  for (let i = 1; i <= yearsInRetirement; i++) {
    const ageI = retirementAge + i;
    const wdrl = withdrawalAtAge(ageI);
    targetPot += retirementR > 0 ? wdrl / Math.pow(1 + retirementR, i) : wdrl;
  }
  if (!Number.isFinite(targetPot) || targetPot < 0) targetPot = 0;

  // Conservative comparison only: the pot needed to live off investment return
  // alone, preserving the capital indefinitely. Shown for reference, never the
  // default target. Undefined when the retirement return is 0%.
  const capitalPreservationTargetPot =
    retirementR > 0 && Number.isFinite(incomeNeeded / retirementR)
      ? incomeNeeded / retirementR
      : null;

  const futureValueCurrent = currentSavings * Math.pow(1 + r, years);
  const inheritanceResults = inheritances.map(({ amount, age }) =>
    calcInheritanceFV(amount, age > 0 ? age : null, retirementAge, r)
  );
  const totalInheritanceFV = inheritanceResults.reduce((sum, { futureValue }) => sum + futureValue, 0);
  const totalFutureValue = futureValueCurrent + totalInheritanceFV;

  // Contributions from current monthly saving, grown to retirement.
  const fvContributions =
    years > 0 && r > 0
      ? monthlySavingsCurrent * 12 * (Math.pow(1 + r, years) - 1) / r
      : monthlySavingsCurrent * 12 * years;

  // Two clearly-defined projected pots at retirement (both in future money):
  //  • no more saving  = today's savings + inheritances, grown, no new contributions
  //  • with saving      = the above plus continued monthly contributions
  const projectedPotNoSaving = totalFutureValue;
  const projectedPotWithSaving = totalFutureValue + fvContributions;

  let monthlySavings = 0;
  if (totalFutureValue < targetPot) {
    const numerator = (targetPot - totalFutureValue) * r;
    const denominator = Math.pow(1 + r, years) - 1;
    monthlySavings = denominator > 0 ? numerator / denominator / 12 : 0;
  }
  const savingsGap = monthlySavings - monthlySavingsCurrent;
  const isCoast = totalFutureValue >= targetPot;
  const status = getStatus(isCoast, monthlySavings, savingsGap, years);
  const { coastAge, yearsUntilCoast } = findCoastAge({ currentAge, retirementAge, currentSavings, monthlySavingsCurrent, targetPot, r, totalInheritanceFV });

  // Drawdown of the pot the user is actually on track to have (with current
  // saving), so "runs out at age X" reflects their real trajectory rather than
  // the target. Runs to the modelling horizon; null means it never depletes.
  let depletionAge = null;
  let runPot = projectedPotWithSaving;
  for (let i = 1; i <= MODELLING_END_AGE - retirementAge; i++) {
    const ageI = retirementAge + i;
    const wdrl = withdrawalAtAge(ageI);
    runPot = Math.max(0, runPot * (1 + retirementR) - wdrl);
    if (runPot <= 0) { depletionAge = ageI; break; }
  }

  return { incomeNeeded, targetPot, capitalPreservationTargetPot, planningAge: effectivePlanningAge, futureValueCurrent, projectedPotNoSaving, projectedPotWithSaving, inheritanceResults, totalInheritanceFV, totalFutureValue, monthlySavings, savingsGap, isCoast, status, coastAge, yearsUntilCoast, depletionAge };
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

const fmtAge     = (v) => `${v} yrs`;
const fmtMoneyMo = (v) => `${formatGBP(v)}/mo`;
const fmtMoneyYr = (v) => `${formatGBP(v)}/yr`;
const fmtPct     = (v) => `${v}%`;

function inflatedValue(amount, years, rate = INFLATION_RATE) {
  return Math.round(amount * Math.pow(1 + rate, years));
}

// ─── Slider Field (with click-to-type override) ───────────────────────────────

function SliderField({ label, name, value, onChange, min, max, step = 1, formatDisplay, alwaysEditable }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  // Sync draft when value changes externally (from slider)
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const pct = Math.min(100, Math.max(0, Math.round(((value - min) / (max - min)) * 100)));

  const startEdit = () => { setDraft(String(value)); setIsEditing(true); };
  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n)) onChange({ target: { name, value: String(Math.min(max, Math.max(min, n))) } });
    setIsEditing(false);
  };
  const handleKey = (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setIsEditing(false);
  };

  const handleAlwaysEditableBlur = () => {
    const n = parseFloat(draft);
    if (!isNaN(n)) {
      const clamped = Math.min(max, Math.max(min, n));
      onChange({ target: { name, value: String(clamped) } });
    } else {
      setDraft(String(value));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {label ? <label className="text-sm font-medium text-gray-600">{label}</label> : <span />}
        {alwaysEditable ? (
          <input
            type="text"
            inputMode="numeric"
            value={formatDisplay ? formatDisplay(parseFloat(draft) || 0) : draft}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9.]/g, '');
              setDraft(cleaned || '0');
            }}
            onBlur={handleAlwaysEditableBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAlwaysEditableBlur();
            }}
            className="w-36 text-right text-sm font-semibold bg-white px-2.5 py-0.5 rounded-lg outline-none tabular-nums"
            style={{ color: '#B8860B', borderColor: '#F4C84A', borderWidth: '2px' }}
          />
        ) : isEditing ? (
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            autoFocus
            className="w-28 text-right text-sm font-semibold text-yellow-700 bg-white border-2 border-yellow-400 px-2.5 py-0.5 rounded-lg outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ borderColor: '#F4C84A', color: '#B8860B' }}
          />
        ) : (
          <button
            onClick={startEdit}
            title="Click to type an exact value"
            className="group flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-lg tabular-nums transition-colors cursor-text"
            style={{ color: '#B8860B', backgroundColor: '#FEF3C7' }}
          >
            {formatDisplay ? formatDisplay(value) : value}
          </button>
        )}
      </div>
      <input
        type="range"
        name={name}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, #F4C84A ${pct}%, #e5e7eb ${pct}%)` }}
      />
    </div>
  );
}

// ─── Number Input ─────────────────────────────────────────────────────────────

function NumberInput({ label, name, value, onChange, prefix, suffix, min, max, step = 1, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium" style={{ color: '#2B2B2B' }}>{label}</label>}
      <div className="flex items-center border rounded-2xl bg-white transition focus-within:ring-2 focus-within:border-transparent" style={{ borderColor: '#E6E8EC', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {prefix && <span className="pl-3 pr-1 font-medium select-none" style={{ color: '#A0A4AB' }}>{prefix}</span>}
        <input
          type="number"
          name={name}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 py-2.5 px-3 font-medium bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-300"
          style={{ color: '#2B2B2B' }}
        />
        {suffix && <span className="pr-3 pl-1 font-medium select-none" style={{ color: '#A0A4AB' }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="flex items-center gap-3 cursor-pointer group">
      <div className="relative w-10 h-6 rounded-full transition-colors duration-200" style={{ backgroundColor: checked ? '#F4C84A' : '#D0D5DD' }}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-sm font-medium group-hover:text-gray-900" style={{ color: '#2B2B2B' }}>{label}</span>
    </button>
  );
}

// ─── Income Section ───────────────────────────────────────────────────────────

function IncomeSection({ desiredIncome, onChange, currentAge, retirementAge }) {
  const yearsToRetirement = retirementAge - currentAge;
  const retirementYear = CURRENT_YEAR + yearsToRetirement;
  const inflated = inflatedValue(desiredIncome, yearsToRetirement);

  return (
    <div className="space-y-2">
      <SliderField
        label="Desired Annual Income"
        name="desiredIncome"
        value={desiredIncome}
        onChange={(e) => onChange(Number(e.target.value))}
        min={10000}
        max={120000}
        step={1000}
        formatDisplay={fmtMoneyYr}
      />
      {yearsToRetirement > 0 && (
        <p className="text-xs text-gray-400">
          This equals {formatGBP(inflated)} in {retirementYear} at 2.5% inflation
        </p>
      )}
    </div>
  );
}

// ─── Feedback Form ────────────────────────────────────────────────────────────

function FeedbackForm() {
  const [state, handleSubmit] = useForm("xbdqvqby");

  if (state.succeeded) {
    return (
      <div className="bg-white rounded-3xl p-6 text-center" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#E6E8EC', borderWidth: '1px' }}>
        <p className="font-medium mb-2" style={{ color: '#2B2B2B' }}>Thanks for your feedback!</p>
        <p className="text-sm mt-1" style={{ color: '#A0A4AB' }}>We really appreciate your thoughts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#E6E8EC', borderWidth: '1px' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#A0A4AB' }}>Feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="feedback-email" className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>
            Email (optional)
          </label>
          <input
            id="feedback-email"
            type="email"
            name="email"
            placeholder="your.email@example.com"
            className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none focus:ring-2 focus:border-transparent transition placeholder:text-gray-300"
            style={{ color: '#2B2B2B', borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', focusRingColor: '#F4C84A' }}
          />
          <ValidationError field="email" errors={state.errors} className="text-xs mt-1" style={{ color: '#E74C3C' }} />
        </div>

        <div>
          <label htmlFor="feedback-message" className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>
            What's on your mind?
          </label>
          <textarea
            id="feedback-message"
            name="message"
            placeholder="Share your thoughts, suggestions, or bugs..."
            rows={3}
            className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none focus:ring-2 focus:border-transparent transition placeholder:text-gray-300 resize-none"
            style={{ color: '#2B2B2B', borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          />
          <ValidationError field="message" errors={state.errors} className="text-xs mt-1" style={{ color: '#E74C3C' }} />
        </div>

        <button
          type="submit"
          disabled={state.submitting}
          className="w-full py-2.5 px-4 font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          style={{ backgroundColor: '#F4C84A', color: '#1F1F1F' }}
        >
          {state.submitting ? "Sending..." : "Send Feedback"}
        </button>
      </form>
    </div>
  );
}

// ─── Result Components ────────────────────────────────────────────────────────

function ResultRow({ icon, label, value, highlight, help }) {
  return (
    <div className="py-3 px-4 rounded-2xl" style={{ backgroundColor: highlight ? '#FFFAEB' : '#F5F6F8' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-lg leading-tight">{icon}</span>
          <span className="text-sm font-medium" style={{ color: highlight ? '#F4C84A' : '#A0A4AB' }}>{label}</span>
        </div>
        <span className="text-base font-semibold whitespace-nowrap" style={{ color: '#2B2B2B' }}>{value}</span>
      </div>
      {help && <p className="text-xs mt-1.5 ml-8 leading-relaxed" style={{ color: '#A0A4AB' }}>{help}</p>}
    </div>
  );
}

function ResultMessage({ result, retirementAge }) {
  const { isCoast, coastAge, yearsUntilCoast, savingsGap, planningAge } = result;

  if (isCoast) {
    return (
      <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#ECFDF5', borderColor: '#4CAF50', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#4CAF50' }} />
        <div>
          <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You may be on track on these assumptions.</p>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>The model estimates your current savings could support your target income from age {retirementAge} to age {planningAge}, even without further contributions. Anything more is a buffer.</p>
        </div>
      </div>
    );
  }

  if (coastAge !== null && yearsUntilCoast <= 5) {
    return (
      <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#FFFAEB', borderColor: '#F4C84A', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#F4C84A' }} />
        <div>
          <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You may be close to easing off.</p>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>Based on these assumptions, at your current saving rate you could ease back on contributions in around {yearsUntilCoast} year{yearsUntilCoast !== 1 ? "s" : ""}, at age {coastAge}, and still have your pot last to age {planningAge}.</p>
        </div>
      </div>
    );
  }

  if (coastAge !== null) {
    return (
      <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#F0F4FF', borderColor: '#F4C84A', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#F4C84A' }} />
        <div>
          <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You may be on track on these assumptions.</p>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>The model estimates that if you keep saving, by age {coastAge} — in around {yearsUntilCoast} year{yearsUntilCoast !== 1 ? "s" : ""} — your pot could be large enough to carry you to retirement and last to age {planningAge} on its own.</p>
        </div>
      </div>
    );
  }

  if (savingsGap <= 250) {
    return (
      <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#FFFAEB', borderColor: '#F4C84A', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#F4C84A' }} />
        <div>
          <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You may be close on these assumptions.</p>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>The model estimates around {formatGBP(savingsGap)}/month more could bring your plan on track for the pot to last from age {retirementAge} to age {planningAge}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#FEF2F2', borderColor: '#E74C3C', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#E74C3C' }} />
      <div>
        <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You may be short of your target on these assumptions.</p>
        <p className="text-sm mt-1" style={{ color: '#666666' }}>The model estimates you're currently {formatGBP(savingsGap)}/month short of the amount needed for your pot to last to age {planningAge}. You could explore saving more, retiring later, or adjusting your income target.</p>
      </div>
    </div>
  );
}

function CoastCard({ result, currentAge, retirementAge }) {
  const { coastAge, yearsUntilCoast } = result;
  const found = coastAge !== null;
  // coastAge can land on the current age, which reads as "already there" rather
  // than a future point to look forward to.
  const alreadyThere = found && coastAge <= currentAge;

  let body;
  if (!found) {
    body = "Based on these assumptions, the model does not yet identify an age where your existing savings could do the rest before retirement.";
  } else if (alreadyThere) {
    body = `Based on these assumptions, you may already be able to ease off contributions and still remain broadly on track for retirement at ${retirementAge}.`;
  } else {
    body = `Based on these assumptions, you may be able to ease off contributions from around age ${coastAge} and still remain broadly on track for retirement at ${retirementAge}.`;
  }

  const accent = found ? '#4CAF50' : '#A0A4AB';
  const bg = found ? '#ECFDF5' : '#F5F6F8';

  return (
    <div className="rounded-3xl p-5 space-y-2" style={{ backgroundColor: bg, borderColor: accent, borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>When could I ease off?</p>
        </div>
        {found && !alreadyThere && (
          <span className="text-lg font-bold whitespace-nowrap" style={{ color: '#2B2B2B' }}>
            Age {coastAge}
            {yearsUntilCoast > 0 && (
              <span className="text-xs font-normal ml-1" style={{ color: '#A0A4AB' }}>
                (~{yearsUntilCoast} yr{yearsUntilCoast !== 1 ? "s" : ""})
              </span>
            )}
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: '#666666' }}>{body}</p>
    </div>
  );
}

function MonthlySavingsBox({ result, retirementAge, monthlySavingsCurrent, desiredIncome }) {
  const { isCoast, monthlySavings, savingsGap, planningAge } = result;

  return (
    <div className="rounded-3xl p-5" style={{ backgroundColor: isCoast ? '#ECFDF5' : '#F4C84A', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: isCoast ? '#4CAF50' : '#F4C84A', borderWidth: '1px' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: isCoast ? '#4CAF50' : '#1F1F1F' }}>
        Monthly saving needed for pot to last to age {planningAge}
      </p>
      <p className="text-xs mb-4" style={{ color: isCoast ? '#4CAF50' : '#1F1F1F', opacity: 0.85 }}>
        Retire at {retirementAge} · Target income {formatGBP(desiredIncome)}/yr today · Pot modelled to age {planningAge}
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: isCoast ? '#2B2B2B' : '#1F1F1F' }}>Required</span>
          <span className="text-2xl font-bold" style={{ color: isCoast ? '#2B2B2B' : '#1F1F1F' }}>
            {isCoast ? "£0" : formatGBP(monthlySavings)}
            <span className="text-sm font-normal ml-0.5" style={{ color: isCoast ? '#4CAF50' : '#1F1F1F' }}>/mo</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: isCoast ? '#2B2B2B' : '#1F1F1F' }}>Currently saving</span>
          <span className="text-2xl font-bold" style={{ color: isCoast ? '#2B2B2B' : '#1F1F1F' }}>
            {formatGBP(monthlySavingsCurrent)}
            <span className="text-sm font-normal ml-0.5" style={{ color: isCoast ? '#4CAF50' : '#1F1F1F' }}>/mo</span>
          </span>
        </div>
        <div className="border-t pt-3 mt-1" style={{ borderColor: isCoast ? '#4CAF50' : '#D4AF3A' }}>
          {savingsGap > 0 ? (
            <p className="text-sm font-semibold text-center" style={{ color: '#E74C3C' }}>
              You're {formatGBP(savingsGap)}/mo short
            </p>
          ) : savingsGap < 0 ? (
            <p className="text-sm font-semibold text-center" style={{ color: '#4CAF50' }}>
              Exceeding target by {formatGBP(Math.abs(savingsGap))}/mo
            </p>
          ) : (
            <p className="text-sm font-semibold text-center" style={{ color: isCoast ? '#4CAF50' : '#1F1F1F' }}>Exactly on target</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InheritanceResultBox({ inheritances, inheritanceResults, totalInheritanceFV, retirementAge }) {
  const active = inheritances.filter(({ amount, age }) => amount > 0 && age > 0);
  if (active.length === 0) return null;

  return (
    <div className="rounded-3xl p-4 space-y-3" style={{ backgroundColor: '#F0F4FF', borderColor: '#F4C84A', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F4C84A' }} />
        <p className="text-sm font-semibold" style={{ color: '#2B2B2B' }}>Inheritances</p>
      </div>
      <div className="space-y-2">
        {inheritances.map((entry, i) => {
          if (!entry.amount || !entry.age) return null;
          const { futureValue, afterRetirement } = inheritanceResults[i];
          return (
            <div key={i} className="bg-white rounded-2xl p-3 space-y-2" style={{ borderColor: '#E6E8EC', borderWidth: '1px' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>Inheritance {i + 1}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#A0A4AB' }}>Amount</p>
                  <p className="text-sm font-bold" style={{ color: '#2B2B2B' }}>{formatGBP(entry.amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#A0A4AB' }}>Received at</p>
                  <p className="text-sm font-bold" style={{ color: '#2B2B2B' }}>Age {entry.age}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#A0A4AB' }}>
                    {afterRetirement ? "At retirement" : `At age ${retirementAge}`}
                  </p>
                  <p className="text-sm font-bold" style={{ color: '#2B2B2B' }}>{formatGBP(futureValue)}</p>
                </div>
              </div>
              {afterRetirement && (
                <p className="text-xs text-center" style={{ color: '#A0A4AB' }}>Received after retirement — counted at face value</p>
              )}
            </div>
          );
        })}
      </div>
      {active.length > 1 && (
        <div className="flex items-center justify-between rounded-2xl px-4 py-2.5" style={{ backgroundColor: '#FEF3C7' }}>
          <p className="text-xs font-semibold" style={{ color: '#2B2B2B' }}>Total at retirement</p>
          <p className="text-sm font-bold" style={{ color: '#2B2B2B' }}>{formatGBP(totalInheritanceFV)}</p>
        </div>
      )}
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function buildChartData({ currentAge, retirementAge, currentSavings, monthlySavingsCurrent, annualReturn, inheritances, desiredIncome, includeStatePension, statePensionIncome, statePensionAge, retirementReturn, planningAge }) {
  const r = annualReturn / 100;
  const retirementR = retirementReturn / 100;
  const inflationRate = INFLATION_RATE;
  const yearsToRetirement = retirementAge - currentAge;
  const inflatedDesiredIncome = desiredIncome * Math.pow(1 + inflationRate, yearsToRetirement);
  const data = [];

  // Accumulation phase
  for (let age = currentAge; age <= retirementAge; age++) {
    const y = age - currentAge;
    const fvSavings = currentSavings * Math.pow(1 + r, y);
    const fvContributions =
      y > 0 && r > 0
        ? monthlySavingsCurrent * 12 * (Math.pow(1 + r, y) - 1) / r
        : monthlySavingsCurrent * 12 * y;
    const fvInheritances = inheritances.reduce((sum, { amount, age: recAge }) => {
      if (!amount || !recAge || recAge > age) return sum;
      return sum + amount * Math.pow(1 + r, age - recAge);
    }, 0);
    const total = fvSavings + fvContributions + fvInheritances;
    const inheritanceThisYear = inheritances.some(({ amount, age: recAge }) => amount > 0 && recAge === age);
    data.push({ age, total, inheritanceThisYear, statePensionKickIn: false, phase: "accumulation" });
  }

  // Drawdown phase — run to the planning age (capped at the modelling horizon).
  const planningEnd = Math.min(
    MODELLING_END_AGE,
    Math.max(retirementAge + MIN_PLANNING_YEARS, planningAge || DEFAULT_PLANNING_AGE),
  );
  const drawdownYears = Math.max(0, planningEnd - retirementAge);
  let pot = data[data.length - 1].total;
  for (let i = 1; i <= drawdownYears; i++) {
    const age = retirementAge + i;
    const withdrawal = (includeStatePension && age >= statePensionAge)
      ? Math.max(0, inflatedDesiredIncome - statePensionIncome)
      : inflatedDesiredIncome;
    pot = Math.max(0, pot * (1 + retirementR) - withdrawal);
    const statePensionKickIn = includeStatePension && age === statePensionAge;
    data.push({ age, total: pot, inheritanceThisYear: false, statePensionKickIn, phase: "drawdown" });
  }

  return data;
}

function formatYAxis(value) {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `£${(value / 1_000).toFixed(0)}k`;
  return `£${value}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-2xl shadow-lg px-3 py-2 text-sm" style={{ borderColor: '#E6E8EC', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p className="font-semibold mb-1" style={{ color: '#2B2B2B' }}>Age {label}</p>
      <p className="font-bold" style={{ color: '#F4C84A' }}>{formatGBP(payload[0].value)}</p>
      {payload[0].payload.inheritanceThisYear && <p className="text-xs mt-1" style={{ color: '#F4C84A' }}>Inheritance received</p>}
      {payload[0].payload.statePensionKickIn && <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>State pension starts</p>}
    </div>
  );
};

const InheritanceDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload.inheritanceThisYear) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#F4C84A" stroke="#fff" strokeWidth={2} />;
};

const StatePensionDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload.statePensionKickIn) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#4CAF50" stroke="#fff" strokeWidth={2} />;
};

const ChartDot = (props) => {
  if (props.payload?.inheritanceThisYear) return <InheritanceDot {...props} />;
  if (props.payload?.statePensionKickIn) return <StatePensionDot {...props} />;
  return null;
};

function GrowthChart({ inputs, inheritances, result, statePension, statePensionAge }) {
  const data = buildChartData({
    currentAge: inputs.currentAge,
    retirementAge: inputs.retirementAge,
    currentSavings: inputs.currentSavings,
    monthlySavingsCurrent: inputs.monthlySavingsCurrent,
    annualReturn: inputs.annualReturn,
    inheritances,
    desiredIncome: inputs.desiredIncome,
    includeStatePension: statePension.include,
    statePensionIncome: statePension.income,
    statePensionAge,
    retirementReturn: inputs.retirementReturn,
    planningAge: result.planningAge,
  });
  const hasInheritance = inheritances.some(({ amount, age }) => amount > 0 && age > 0);

  return (
    <div className="rounded-3xl p-5 space-y-3" style={{ backgroundColor: '#F5F6F8', borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>Savings Trajectory</h2>
        <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: '#A0A4AB' }}>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: '#F4C84A' }} /> Projected pot</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: '#E74C3C' }} /> Target</span>
          {result.coastAge && <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: '#4CAF50' }} /> Coast age</span>}
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: '#A0A4AB' }} /> Plan to {result.planningAge}</span>
          {hasInheritance && <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F4C84A' }} /> Inheritance</span>}
          {statePension.include && statePensionAge > inputs.retirementAge && <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4CAF50' }} /> State pension</span>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="potGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F4C84A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#F4C84A" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#A0A4AB" }} tickLine={false} axisLine={false}
            label={{ value: "Age", position: "insideBottomRight", offset: -4, fontSize: 11, fill: "#A0A4AB" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "#A0A4AB" }} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={result.targetPot} stroke="#E74C3C" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: "Target", position: "right", fontSize: 10, fill: "#E74C3C" }} />
          {result.coastAge && (
            <ReferenceLine x={result.coastAge} stroke="#4CAF50" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "Coast", position: "top", fontSize: 10, fill: "#4CAF50" }} />
          )}
          <ReferenceLine x={inputs.retirementAge} stroke="#F4C84A" strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: `${inputs.annualReturn}%→${inputs.retirementReturn}%`, position: "insideTopRight", fontSize: 9, fill: "#F4C84A" }} />
          <ReferenceLine x={result.planningAge} stroke="#A0A4AB" strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: `Plan to ${result.planningAge}`, position: "top", fontSize: 10, fill: "#A0A4AB" }} />
          {statePension.include && statePensionAge > inputs.retirementAge && (
            <ReferenceLine x={statePensionAge} stroke="#4CAF50" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "State Pension", position: "top", fontSize: 10, fill: "#4CAF50" }} />
          )}
          <Area type="monotone" dataKey="total" stroke="#F4C84A" strokeWidth={2.5} fill="url(#potGradient)"
            dot={<ChartDot />} activeDot={{ r: 4, fill: "#F4C84A", stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Assumptions Panel ────────────────────────────────────────────────────────

function AssumptionsPanel({ assumptions }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={{ borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>Assumptions</h2>
          <p className="text-xs mt-0.5" style={{ color: '#A0A4AB' }}>What these figures are based on</p>
        </div>
        <span
          className="text-lg font-semibold transition-transform duration-200"
          style={{ color: '#B8860B', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4">
          <p className="text-xs leading-relaxed rounded-2xl px-4 py-3" style={{ color: '#2B2B2B', backgroundColor: '#FFFAEB' }}>
            These results are illustrative and depend heavily on the assumptions below. They are not financial advice.
          </p>
          <div className="space-y-2">
            {assumptions.map(({ label, value, note }) => (
              <div key={label} className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#F5F6F8' }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium" style={{ color: '#A0A4AB' }}>{label}</span>
                  <span className="text-sm font-semibold text-right" style={{ color: '#2B2B2B' }}>{value}</span>
                </div>
                {note && <p className="text-xs mt-1 leading-relaxed" style={{ color: '#A0A4AB' }}>{note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── "What could close the gap?" scenario cards ───────────────────────────────

function ScenarioCard({ title, lead, rows, footnote, tone = "neutral" }) {
  const accent = tone === "positive" ? '#4CAF50' : '#B8860B';
  const badgeBg = tone === "positive" ? '#ECFDF5' : '#FFFAEB';
  return (
    <div className="bg-white rounded-3xl p-5 space-y-3" style={{ borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
        <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>{title}</p>
      </div>
      {lead && <p className="text-sm" style={{ color: '#666666' }}>{lead}</p>}
      {rows && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5" style={{ backgroundColor: badgeBg }}>
              <span className="text-sm" style={{ color: '#2B2B2B' }}>{row.label}</span>
              <span className="text-sm font-semibold text-right" style={{ color: '#2B2B2B' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
      {footnote && <p className="text-xs" style={{ color: '#A0A4AB' }}>{footnote}</p>}
    </div>
  );
}

function ScenarioCards({ baseParams, result, retirementAge, currentAge, desiredIncome, monthlySavingsCurrent }) {
  // Re-run the full model with a single overridden input.
  const run = (overrides) => calculateAll({ ...baseParams, ...overrides });

  const onTrack = result.savingsGap <= 0;
  const planningAge = result.planningAge;

  // Later-retirement ages, capped at the slider maximum (85) and kept a sensible
  // margin below the planning age so each scenario still models a real drawdown.
  const laterAges = [1, 3, 5]
    .map((delta) => retirementAge + delta)
    .filter((age) => age <= 85 && age + MIN_PLANNING_YEARS <= planningAge);

  // Earlier-retirement ages, not below the slider minimum (45) or current age.
  const earlierAges = [1, 3, 5]
    .map((delta) => retirementAge - delta)
    .filter((age) => age >= 45 && age > currentAge);

  const incomeCuts = [10, 20];

  const heading = (
    <div className="space-y-1">
      <h2 className="text-lg font-bold" style={{ color: '#2B2B2B' }}>What could close the gap?</h2>
      <p className="text-xs" style={{ color: '#A0A4AB' }}>
        {onTrack
          ? "You look on track — here are ways to pressure-test or flex your plan. Based on these assumptions, not advice."
          : "A few routes that the model estimates could get you to your target. These are illustrations, not advice."}
      </p>
    </div>
  );

  if (onTrack) {
    return (
      <div className="space-y-4">
        {heading}

        <ScenarioCard
          tone="positive"
          title="You may be on track"
          lead={`Based on these assumptions, your current saving of ${fmtMoneyMo(monthlySavingsCurrent)} could support your target income from age ${retirementAge} to age ${planningAge}.`}
          footnote={result.coastAge ? `The model estimates you could ease off contributions from around age ${result.coastAge} and still get there.` : undefined}
        />

        {earlierAges.length > 0 && (
          <ScenarioCard
            tone="positive"
            title="You could explore retiring earlier"
            lead="One possible route could be bringing your retirement forward. The model estimates the monthly saving each earlier age would need:"
            rows={earlierAges.map((age) => {
              const req = run({ retirementAge: age }).monthlySavings;
              const covered = req <= monthlySavingsCurrent;
              return {
                label: `Retire at ${age}`,
                value: `${fmtMoneyMo(Math.max(0, req))}${covered ? " ✓" : ""}`,
              };
            })}
            footnote="✓ means your current saving would already cover it, based on these assumptions."
          />
        )}

        <ScenarioCard
          tone="positive"
          title="You could stress-test your assumptions"
          lead="Plans are only as good as their inputs. Try nudging the expected return down or inflation expectations up in the inputs to see how resilient your target stays."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {heading}

      <ScenarioCard
        title="Save more monthly"
        lead={`Based on these assumptions, saving around ${fmtMoneyMo(result.savingsGap)} more per month could keep your plan on track for the pot to last to age ${planningAge}.`}
        rows={[
          { label: "You're saving now", value: fmtMoneyMo(monthlySavingsCurrent) },
          { label: "Suggested to stay on track", value: fmtMoneyMo(result.monthlySavings) },
        ]}
      />

      {laterAges.length > 0 && (
        <ScenarioCard
          title="Retire later"
          lead={`Retiring later could reduce the estimated monthly saving needed for the pot to last to age ${planningAge}:`}
          rows={laterAges.map((age) => ({
            label: `Retire at ${age}`,
            value: `${fmtMoneyMo(Math.max(0, run({ retirementAge: age }).monthlySavings))} needed`,
          }))}
        />
      )}

      <ScenarioCard
        title="Reduce target income"
        lead="A lower target income means a smaller pot to build. One possible route could be:"
        rows={incomeCuts.map((cut) => {
          const newIncome = Math.round(desiredIncome * (1 - cut / 100));
          const scenario = run({ desiredIncome: newIncome });
          return {
            label: `${fmtMoneyYr(newIncome)} target`,
            value: `${fmtMoneyMo(Math.max(0, scenario.monthlySavings))} needed`,
          };
        })}
        footnote={`Currently targeting ${fmtMoneyYr(desiredIncome)} in today's money.`}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_INPUTS = {
  currentAge: 40,
  retirementAge: 60,
  currentSavings: 100000,
  desiredIncome: 30000,
  annualReturn: DEFAULT_PRE_RETIREMENT_RETURN,
  monthlySavingsCurrent: 500,
  retirementReturn: DEFAULT_RETIREMENT_RETURN,
  planningAge: DEFAULT_PLANNING_AGE,
};

const DEFAULT_INHERITANCES = [
  { amount: 0, age: 0 },
  { amount: 0, age: 0 },
  { amount: 0, age: 0 },
];

export default function RetirementCalculator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [inheritances, setInheritances] = useState(DEFAULT_INHERITANCES);
  const [statePension, setStatePension] = useState({ include: false, income: DEFAULT_STATE_PENSION_INCOME });

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) }));
  };

  const handleInheritanceChange = (index, field, rawValue) => {
    const value = rawValue === "" ? 0 : Number(rawValue);
    setInheritances((prev) => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  };

  const statePensionAge = getStatePensionAge(inputs.currentAge);

  const result = useMemo(() => {
    if (inputs.retirementAge <= inputs.currentAge) return null;
    return calculateAll({
      ...inputs,
      inheritances,
      includeStatePension: statePension.include,
      statePensionIncome: statePension.income,
      statePensionAge,
      retirementReturn: inputs.retirementReturn,
    });
  }, [inputs, inheritances, statePension, statePensionAge]);

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: '#F5F6F8' }}>
      <div className="w-full max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl font-bold tracking-tight" style={{ color: '#F4C84A' }}>Route to Retire</h1>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-2" style={{ backgroundColor: '#FFFAEB', color: '#F4C84A' }}>
            RETIREMENT CALCULATOR
          </div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#2B2B2B' }}>Are You Saving Enough to Retire?</h2>
          <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: '#A0A4AB' }}>
            See if you're on track to meet your retirement goals — and find out when you could afford to ease back on contributions and let your savings do the work.
          </p>
        </div>

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT: Inputs ── */}
          <div className="space-y-4">

            {/* Your Details */}
            <div className="bg-white rounded-3xl p-6 space-y-5" style={{ borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>Your Details</h2>

              <div className="grid grid-cols-2 gap-6">
                <SliderField label="Current Age"    name="currentAge"    value={inputs.currentAge}    onChange={handleChange} min={18} max={75}  step={1}   formatDisplay={fmtAge} />
                <SliderField label="Retirement Age" name="retirementAge" value={inputs.retirementAge} onChange={handleChange} min={45} max={85}  step={1}   formatDisplay={fmtAge} />
              </div>

              <SliderField label="Current Savings"       name="currentSavings"        value={inputs.currentSavings}        onChange={handleChange} min={0} max={1000000} step={1000} formatDisplay={formatGBP} alwaysEditable />
              <SliderField label="Current Monthly Saving" name="monthlySavingsCurrent" value={inputs.monthlySavingsCurrent} onChange={handleChange} min={0} max={3000}    step={50}   formatDisplay={fmtMoneyMo} alwaysEditable />
              <SliderField label="Expected Annual Return" name="annualReturn"          value={inputs.annualReturn}          onChange={handleChange} min={1} max={15}      step={0.5}  formatDisplay={fmtPct} />
              <p className="text-xs text-gray-400 -mt-1">Default 7% reflects long-run equity market average. Adjust based on your portfolio.</p>

              <SliderField label="Expected Return in Retirement" name="retirementReturn" value={inputs.retirementReturn} onChange={handleChange} min={1} max={10} step={0.5} formatDisplay={fmtPct} />
              <p className="text-xs text-gray-400 -mt-2">Portfolio typically de-risks into bonds near retirement. 3–4% reflects a balanced/cautious allocation.</p>

              <SliderField label="Plan for pot to last until" name="planningAge" value={inputs.planningAge} onChange={handleChange} min={80} max={100} step={1} formatDisplay={fmtAge} />
              <p className="text-xs text-gray-400 -mt-2">The age you want your retirement pot to be modelled to last until. Your target pot is sized to draw your income down to this age, not to last forever.</p>
              {inputs.planningAge < inputs.retirementAge + MIN_PLANNING_YEARS && inputs.retirementAge > inputs.currentAge && (
                <p className="text-xs -mt-1" style={{ color: '#B8860B' }}>Modelled to age {inputs.retirementAge + MIN_PLANNING_YEARS} — the plan needs at least {MIN_PLANNING_YEARS} years beyond your retirement age.</p>
              )}

              <IncomeSection
                desiredIncome={inputs.desiredIncome}
                onChange={(val) => setInputs((prev) => ({ ...prev, desiredIncome: val }))}
                currentAge={inputs.currentAge}
                retirementAge={inputs.retirementAge}
              />
            </div>

            {/* State Pension */}
            <div className="bg-white rounded-3xl p-6 space-y-4" style={{ borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>State Pension</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#A0A4AB', backgroundColor: '#F5F6F8' }}>Optional</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#A0A4AB', backgroundColor: '#F5F6F8', borderColor: '#E6E8EC', borderWidth: '1px' }}>
                    Eligible from {statePensionAge}
                  </span>
                </div>
              </div>
              <Toggle
                checked={statePension.include}
                onChange={() => setStatePension((p) => ({ ...p, include: !p.include }))}
                label="Include State Pension"
              />
              {statePension.include && (
                <>
                  <NumberInput
                    label="Annual State Pension"
                    name="statePensionIncome"
                    value={statePension.income}
                    onChange={(e) => setStatePension((p) => ({ ...p, income: Number(e.target.value) }))}
                    prefix="£"
                    suffix="/yr"
                    min={0}
                    step={100}
                  />
                  <p className="text-xs" style={{ color: '#A0A4AB' }}>Assumes current UK State Pension (~£11,500/yr). Subject to change.</p>
                  {inputs.retirementAge < statePensionAge && (
                    <div className="rounded-2xl p-3 flex items-start gap-2" style={{ backgroundColor: '#FFFAEB', borderColor: '#F4C84A', borderWidth: '1px' }}>
                      <span className="text-sm">!</span>
                      <p className="text-xs" style={{ color: '#2B2B2B' }}>
                        Your state pension won't start until age {statePensionAge},{" "}
                        {statePensionAge - inputs.retirementAge} year{statePensionAge - inputs.retirementAge !== 1 ? "s" : ""} into retirement.
                        Your target pot accounts for this gap.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Inheritances */}
            <div className="bg-white rounded-3xl p-6 space-y-4" style={{ borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>Expected Inheritances</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#A0A4AB', backgroundColor: '#F5F6F8' }}>Optional</span>
              </div>
              <p className="text-xs -mt-1" style={{ color: '#A0A4AB' }}>Inheritances received before retirement will be invested and grow until you retire.</p>
              {inheritances.map((entry, i) => (
                <div key={i} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>Inheritance {i + 1}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <SliderField
                        label="Amount"
                        name={`inheritanceAmount_${i}`}
                        value={entry.amount}
                        onChange={(e) => handleInheritanceChange(i, "amount", e.target.value)}
                        min={0}
                        max={500000}
                        step={1000}
                        formatDisplay={formatGBP}
                      />
                    </div>
                    <NumberInput
                      label="Age"
                      name={`inheritanceAge_${i}`}
                      value={entry.age === 0 ? "" : entry.age}
                      onChange={(e) => handleInheritanceChange(i, "age", e.target.value)}
                      placeholder="e.g. 55"
                      suffix="yrs"
                      min={1}
                      max={120}
                    />
                  </div>
                  {i < inheritances.length - 1 && <div className="border-t border-gray-100 pt-1" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider px-0.5" style={{ color: '#A0A4AB' }}>Results</h2>
            {result ? (
              <>
                <ResultMessage result={result} retirementAge={inputs.retirementAge} />
                <MonthlySavingsBox result={result} retirementAge={inputs.retirementAge} monthlySavingsCurrent={inputs.monthlySavingsCurrent} desiredIncome={inputs.desiredIncome} />
                <GrowthChart inputs={inputs} inheritances={inheritances} result={result} statePension={statePension} statePensionAge={statePensionAge} />
                <CoastCard result={result} currentAge={inputs.currentAge} retirementAge={inputs.retirementAge} />
                <div className="rounded-3xl p-6 space-y-4" style={{ backgroundColor: '#F5F6F8', borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>Your Numbers</h2>
                  <div className="space-y-2">
                    <ResultRow
                      icon="●"
                      label="Target retirement pot"
                      value={formatGBP(result.targetPot)}
                      highlight
                      help={statePension.include
                        ? `Based on your inputs and assumptions, the estimated pot needed at age ${inputs.retirementAge} to draw your income down to age ${result.planningAge}, after allowing for ${formatGBP(statePension.income)}/yr of State Pension. Shown in future money.`
                        : `Based on your inputs and assumptions, the estimated pot needed at age ${inputs.retirementAge} to draw your income down to age ${result.planningAge}. Shown in future money.`}
                    />
                    {result.capitalPreservationTargetPot != null && (
                      <ResultRow
                        icon="○"
                        label="Conservative comparison (preserve capital)"
                        value={formatGBP(result.capitalPreservationTargetPot)}
                        help={`Preserving the pot and drawing only the assumed ${inputs.retirementReturn}% return would require around this much — it never runs down. Shown for reference, not as your target.`}
                      />
                    )}
                    <ResultRow
                      icon="●"
                      label="Projected pot at retirement with current monthly saving"
                      value={formatGBP(result.projectedPotWithSaving)}
                      help={`If you keep saving ${fmtMoneyMo(inputs.monthlySavingsCurrent)}, this is the estimated value of your pot at age ${inputs.retirementAge}.`}
                    />
                    <ResultRow
                      icon="●"
                      label="Projected pot at retirement if you stopped saving today"
                      value={formatGBP(result.projectedPotNoSaving)}
                      help={`Your current savings${result.totalInheritanceFV > 0 ? " and expected inheritances" : ""} left to grow, with no further monthly contributions.`}
                    />
                    {result.savingsGap > 0 ? (
                      <ResultRow
                        icon="●"
                        label="Estimated monthly shortfall"
                        value={`${formatGBP(result.savingsGap)}/mo`}
                        help="Extra monthly saving the model estimates you need to reach your target pot."
                      />
                    ) : result.savingsGap < 0 ? (
                      <ResultRow
                        icon="●"
                        label="Estimated monthly surplus"
                        value={`${formatGBP(Math.abs(result.savingsGap))}/mo`}
                        help="You're saving more than the model estimates you need for this target."
                      />
                    ) : null}
                    {statePension.include && result.incomeNeeded !== inputs.desiredIncome && (
                      <ResultRow
                        icon="●"
                        label="Income needed from your pot"
                        value={`${formatGBP(result.incomeNeeded)}/yr`}
                        help="Your target income minus the State Pension, in future money."
                      />
                    )}
                    {result.depletionAge == null
                      ? <ResultRow icon="●" label="Estimated pot lasts until" value="Beyond planning age"
                          help={`Based on your current saving, the model estimates your pot would still last beyond your planning age of ${result.planningAge} (it isn't projected to run out within the modelled horizon).`} />
                      : result.depletionAge >= result.planningAge
                      ? <ResultRow icon="●" label="Estimated pot lasts until" value="Beyond planning age"
                          help={`Based on your current saving, the model estimates your pot would last to around age ${result.depletionAge} — beyond your planning age of ${result.planningAge}.`} />
                      : <ResultRow icon="●" label="Estimated to run out around age" value={String(result.depletionAge)}
                          help={`Based on your current saving of ${fmtMoneyMo(inputs.monthlySavingsCurrent)}, the model estimates the pot runs out before your planning age of ${result.planningAge}.`} />
                    }
                  </div>
                  <InheritanceResultBox
                    inheritances={inheritances}
                    inheritanceResults={result.inheritanceResults}
                    totalInheritanceFV={result.totalInheritanceFV}
                    retirementAge={inputs.retirementAge}
                  />
                </div>

                <ScenarioCards
                  baseParams={{
                    ...inputs,
                    inheritances,
                    includeStatePension: statePension.include,
                    statePensionIncome: statePension.income,
                    statePensionAge,
                  }}
                  result={result}
                  retirementAge={inputs.retirementAge}
                  currentAge={inputs.currentAge}
                  desiredIncome={inputs.desiredIncome}
                  monthlySavingsCurrent={inputs.monthlySavingsCurrent}
                />

                <AssumptionsPanel
                  assumptions={getAssumptions({
                    annualReturn: inputs.annualReturn,
                    retirementReturn: inputs.retirementReturn,
                    includeStatePension: statePension.include,
                    statePensionIncome: statePension.income,
                    statePensionAge,
                    planningAge: result.planningAge,
                    capitalPreservationTargetPot: result.capitalPreservationTargetPot,
                  })}
                />

                <p className="text-xs text-center px-0.5" style={{ color: '#A0A4AB' }}>
                  Want the detail?{" "}
                  <Link to="/methodology" style={{ color: '#B8860B' }}>Read how this calculator works</Link>.
                </p>
              </>
            ) : (
              <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-3 min-h-64" style={{ borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <p className="text-sm font-medium" style={{ color: '#A0A4AB' }}>Your results will appear here</p>
                <p className="text-xs" style={{ color: '#A0A4AB' }}>Make sure your retirement age is greater than your current age</p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Form */}
        <div className="mt-12 mb-8 max-w-2xl mx-auto">
          <FeedbackForm />
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
