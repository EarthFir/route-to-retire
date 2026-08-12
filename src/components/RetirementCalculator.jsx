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
        {label ? <label className="text-sm font-medium text-[#4a5a5f]">{label}</label> : <span />}
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
            style={{ color: '#1B6F81', borderColor: '#1B6F81', borderWidth: '2px' }}
          />
        ) : isEditing ? (
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            autoFocus
            className="w-28 text-right text-sm font-semibold bg-white border-2 px-2.5 py-0.5 rounded-lg outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ borderColor: '#1B6F81', color: '#1B6F81' }}
          />
        ) : (
          <button
            onClick={startEdit}
            title="Click to type an exact value"
            className="group flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-lg tabular-nums transition-colors cursor-text"
            style={{ color: '#1B6F81', backgroundColor: '#E7F1EF' }}
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
        style={{ background: `linear-gradient(to right, #09324A ${pct}%, #DAD7C8 ${pct}%)` }}
      />
    </div>
  );
}

// ─── Number Input ─────────────────────────────────────────────────────────────

function NumberInput({ label, name, value, onChange, prefix, suffix, min, max, step = 1, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium" style={{ color: '#09324A' }}>{label}</label>}
      <div className="flex items-center border rounded-2xl bg-white transition focus-within:ring-2 focus-within:border-transparent" style={{ borderColor: '#DAD7C8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {prefix && <span className="pl-3 pr-1 font-medium select-none" style={{ color: '#8a9599' }}>{prefix}</span>}
        <input
          type="number"
          name={name}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 py-2.5 px-3 font-medium bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[#c9c6b8]"
          style={{ color: '#09324A' }}
        />
        {suffix && <span className="pr-3 pl-1 font-medium select-none" style={{ color: '#8a9599' }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="flex items-center gap-3 cursor-pointer group">
      <div className="relative w-10 h-6 rounded-full transition-colors duration-200" style={{ backgroundColor: checked ? '#09324A' : '#DAD7C8' }}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-sm font-medium group-hover:text-[#09324A]" style={{ color: '#09324A' }}>{label}</span>
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
        <p className="text-xs text-[#8a9599]">
          This equals {formatGBP(inflated)} in {retirementYear} at 2.5% inflation
        </p>
      )}
    </div>
  );
}

// ─── Input Field Groups (shared between the mobile stacked cards and the ───────
// desktop tabbed input card, so the fields themselves are defined once) ────────

function YourDetailsFields({ inputs, handleChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-6">
        <SliderField label="Current Age"    name="currentAge"    value={inputs.currentAge}    onChange={handleChange} min={18} max={75}  step={1}   formatDisplay={fmtAge} />
        <SliderField label="Retirement Age" name="retirementAge" value={inputs.retirementAge} onChange={handleChange} min={45} max={85}  step={1}   formatDisplay={fmtAge} />
      </div>
      <SliderField label="Current Savings"       name="currentSavings"        value={inputs.currentSavings}        onChange={handleChange} min={0} max={1000000} step={1000} formatDisplay={formatGBP} alwaysEditable />
      <SliderField label="Current Monthly Saving" name="monthlySavingsCurrent" value={inputs.monthlySavingsCurrent} onChange={handleChange} min={0} max={3000}    step={50}   formatDisplay={fmtMoneyMo} alwaysEditable />
    </div>
  );
}

function AssumptionsFields({ inputs, handleChange }) {
  return (
    <div className="space-y-5">
      <div>
        <SliderField label="Expected Annual Return" name="annualReturn" value={inputs.annualReturn} onChange={handleChange} min={1} max={15} step={0.5} formatDisplay={fmtPct} />
        <p className="text-xs text-[#8a9599] mt-2">Default 7% reflects long-run equity market average. Adjust based on your portfolio.</p>
      </div>
      <div>
        <SliderField label="Expected Return in Retirement" name="retirementReturn" value={inputs.retirementReturn} onChange={handleChange} min={1} max={10} step={0.5} formatDisplay={fmtPct} />
        <p className="text-xs text-[#8a9599] mt-2">Portfolio typically de-risks into bonds near retirement. 3–4% reflects a balanced/cautious allocation.</p>
      </div>
      <div>
        <SliderField label="Plan for pot to last until" name="planningAge" value={inputs.planningAge} onChange={handleChange} min={80} max={100} step={1} formatDisplay={fmtAge} />
        <p className="text-xs text-[#8a9599] mt-2">The age you want your retirement pot to be modelled to last until. Your target pot is sized to draw your income down to this age, not to last forever.</p>
        {inputs.planningAge < inputs.retirementAge + MIN_PLANNING_YEARS && inputs.retirementAge > inputs.currentAge && (
          <p className="text-xs mt-1" style={{ color: '#1B6F81' }}>Modelled to age {inputs.retirementAge + MIN_PLANNING_YEARS} — the plan needs at least {MIN_PLANNING_YEARS} years beyond your retirement age.</p>
        )}
      </div>
    </div>
  );
}

function StatePensionFields({ inputs, statePension, setStatePension, statePensionAge }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>State Pension</span>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#8a9599', backgroundColor: '#F3F2EA' }}>Optional</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#8a9599', backgroundColor: '#F3F2EA', borderColor: '#DAD7C8', borderWidth: '1px' }}>
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
          <p className="text-xs" style={{ color: '#8a9599' }}>Assumes current UK State Pension (~£11,500/yr). Subject to change.</p>
          {inputs.retirementAge < statePensionAge && (
            <div className="rounded-2xl p-3 flex items-start gap-2" style={{ backgroundColor: '#FFFCE0', borderColor: '#FFFB08', borderWidth: '1px' }}>
              <span className="text-sm">!</span>
              <p className="text-xs" style={{ color: '#09324A' }}>
                Your state pension won't start until age {statePensionAge},{" "}
                {statePensionAge - inputs.retirementAge} year{statePensionAge - inputs.retirementAge !== 1 ? "s" : ""} into retirement.
                Your target pot accounts for this gap.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RetirementIncomeFields({ inputs, setInputs, statePension, setStatePension, statePensionAge }) {
  return (
    <div className="space-y-5">
      <IncomeSection
        desiredIncome={inputs.desiredIncome}
        onChange={(val) => setInputs((prev) => ({ ...prev, desiredIncome: val }))}
        currentAge={inputs.currentAge}
        retirementAge={inputs.retirementAge}
      />

      <div className="pt-4" style={{ borderTop: '1px solid #F3F2EA' }}>
        <StatePensionFields inputs={inputs} statePension={statePension} setStatePension={setStatePension} statePensionAge={statePensionAge} />
      </div>
    </div>
  );
}

function InheritancesFields({ inheritances, handleInheritanceChange }) {
  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: '#8a9599' }}>Inheritances received before retirement will be invested and grow until you retire.</p>
      {inheritances.map((entry, i) => (
        <div key={i} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Inheritance {i + 1}</p>
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
          {i < inheritances.length - 1 && <div className="border-t border-[#F3F2EA] pt-1" />}
        </div>
      ))}
    </div>
  );
}

// ─── Feedback Form ────────────────────────────────────────────────────────────

function FeedbackForm() {
  const [state, handleSubmit] = useForm("xbdqvqby");

  if (state.succeeded) {
    return (
      <div className="bg-white rounded-3xl p-6 text-center" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#DAD7C8', borderWidth: '1px' }}>
        <p className="font-medium mb-2" style={{ color: '#09324A' }}>Thanks for your feedback!</p>
        <p className="text-sm mt-1" style={{ color: '#8a9599' }}>We really appreciate your thoughts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#DAD7C8', borderWidth: '1px' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider font-display mb-4" style={{ color: '#8a9599' }}>Feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="feedback-email" className="block text-sm font-medium mb-1" style={{ color: '#09324A' }}>
            Email (optional)
          </label>
          <input
            id="feedback-email"
            type="email"
            name="email"
            placeholder="your.email@example.com"
            className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none focus:ring-2 focus:border-transparent transition placeholder:text-[#c9c6b8]"
            style={{ color: '#09324A', borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', focusRingColor: '#1B6F81' }}
          />
          <ValidationError field="email" errors={state.errors} className="text-xs mt-1" style={{ color: '#E74C3C' }} />
        </div>

        <div>
          <label htmlFor="feedback-message" className="block text-sm font-medium mb-1" style={{ color: '#09324A' }}>
            What's on your mind?
          </label>
          <textarea
            id="feedback-message"
            name="message"
            placeholder="Share your thoughts, suggestions, or bugs..."
            rows={3}
            className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none focus:ring-2 focus:border-transparent transition placeholder:text-[#c9c6b8] resize-none"
            style={{ color: '#09324A', borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          />
          <ValidationError field="message" errors={state.errors} className="text-xs mt-1" style={{ color: '#E74C3C' }} />
        </div>

        <button
          type="submit"
          disabled={state.submitting}
          className="w-full py-2.5 px-4 font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          style={{ backgroundColor: '#FFFB08', color: '#09324A', fontFamily: "'Manrope', sans-serif" }}
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
    <div className="py-3 px-4 rounded-2xl" style={{ backgroundColor: highlight ? '#FFFCE0' : '#F3F2EA' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-lg leading-tight">{icon}</span>
          <span className="text-sm font-medium" style={{ color: highlight ? '#1B6F81' : '#8a9599' }}>{label}</span>
        </div>
        <span className="text-base font-semibold whitespace-nowrap" style={{ color: '#09324A' }}>{value}</span>
      </div>
      {help && <p className="text-xs mt-1.5 ml-8 leading-relaxed" style={{ color: '#8a9599' }}>{help}</p>}
    </div>
  );
}

// Narrative status message, guidance-only. Rendered inside the navy results
// panel, so tone maps to translucent accent colors rather than light-mode fills.
function getGuidance(result, retirementAge) {
  const { isCoast, coastAge, yearsUntilCoast, savingsGap, planningAge } = result;

  if (isCoast) {
    return {
      tone: "mint",
      title: "You may be on track on these assumptions.",
      body: `The model estimates your current savings could support your target income from age ${retirementAge} to age ${planningAge}, even without further contributions. Anything more is a buffer.`,
    };
  }
  if (coastAge !== null && yearsUntilCoast <= 5) {
    return {
      tone: "yellow",
      title: "You may be close to easing off.",
      body: `Based on these assumptions, at your current saving rate you could ease back on contributions in around ${yearsUntilCoast} year${yearsUntilCoast !== 1 ? "s" : ""}, at age ${coastAge}, and still have your pot last to age ${planningAge}.`,
    };
  }
  if (coastAge !== null) {
    return {
      tone: "mint",
      title: "You may be on track on these assumptions.",
      body: `The model estimates that if you keep saving, by age ${coastAge} — in around ${yearsUntilCoast} year${yearsUntilCoast !== 1 ? "s" : ""} — your pot could be large enough to carry you to retirement and last to age ${planningAge} on its own.`,
    };
  }
  if (savingsGap <= 250) {
    return {
      tone: "yellow",
      title: "You may be close on these assumptions.",
      body: `The model estimates around ${formatGBP(savingsGap)}/month more could bring your plan on track for the pot to last from age ${retirementAge} to age ${planningAge}.`,
    };
  }
  return {
    tone: "coral",
    title: "You may be short of your target on these assumptions.",
    body: `The model estimates you're currently ${formatGBP(savingsGap)}/month short of the amount needed for your pot to last to age ${planningAge}. You could explore saving more, retiring later, or adjusting your income target.`,
  };
}

const GUIDANCE_TONES = {
  mint: { accent: "#AED0C9", bg: "rgba(174,208,201,.10)", border: "rgba(174,208,201,.25)" },
  yellow: { accent: "#FFFB08", bg: "rgba(255,251,8,.10)", border: "rgba(255,251,8,.28)" },
  coral: { accent: "#FF9A85", bg: "rgba(255,154,133,.10)", border: "rgba(255,154,133,.28)" },
};

function GuidanceBanner({ tone, title, body }) {
  const { accent, bg, border } = GUIDANCE_TONES[tone];
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: accent }} />
      <div>
        <p className="font-bold text-sm sm:text-base" style={{ color: "#F3F2EA" }}>{title}</p>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: "rgba(243,242,234,.78)" }}>{body}</p>
      </div>
    </div>
  );
}

function NumberStat({ value, label }) {
  return (
    <div className="pt-3" style={{ borderTop: "1px solid rgba(174,208,201,.18)" }}>
      <div className="font-serif font-bold text-xl sm:text-2xl" style={{ color: "#F3F2EA" }}>{value}</div>
      <div className="text-xs mt-1.5 leading-snug" style={{ color: "rgba(243,242,234,.58)" }}>{label}</div>
    </div>
  );
}

// coastAge can land on the current age, which reads as "already there" rather
// than a future point to look forward to.
function coastStat({ coastAge, yearsUntilCoast }, currentAge) {
  if (coastAge === null) {
    return { value: "Not yet found", label: "When you could ease off contributions" };
  }
  if (coastAge <= currentAge) {
    return { value: "Now", label: "You may already be able to ease off contributions" };
  }
  return {
    value: `Age ${coastAge}`,
    label: `When you could ease off contributions${yearsUntilCoast > 0 ? ` (~${yearsUntilCoast} yr${yearsUntilCoast !== 1 ? "s" : ""})` : ""}`,
  };
}

function depletionStat({ depletionAge, planningAge }) {
  if (depletionAge == null || depletionAge >= planningAge) {
    return { value: `Beyond age ${planningAge}`, label: "Estimated pot lasts until" };
  }
  return { value: `Age ${depletionAge}`, label: "Estimated pot lasts until" };
}

function InheritanceResultBox({ inheritances, inheritanceResults, totalInheritanceFV, retirementAge, dark }) {
  const active = inheritances.filter(({ amount, age }) => amount > 0 && age > 0);
  if (active.length === 0) return null;

  if (dark) {
    return (
      <div
        className="rounded-2xl p-3 space-y-2"
        style={{ background: 'linear-gradient(155deg, rgba(255,255,255,.09), rgba(255,255,255,.015))', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#AED0C9' }} />
          <p className="text-xs font-semibold" style={{ color: '#F3F2EA' }}>Inheritances</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {inheritances.map((entry, i) => {
            if (!entry.amount || !entry.age) return null;
            const { futureValue, afterRetirement } = inheritanceResults[i];
            return (
              <div key={i} className="rounded-xl p-2" style={{ backgroundColor: 'rgba(255,255,255,.06)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider font-display" style={{ color: '#AED0C9' }}>Inheritance {i + 1}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(243,242,234,.7)' }}>
                  {formatGBP(entry.amount)} at age {entry.age}
                </p>
                <p className="text-sm font-bold mt-0.5 tabular-nums" style={{ color: '#F3F2EA' }}>
                  {formatGBP(futureValue)} {afterRetirement ? "(face value)" : `at ${retirementAge}`}
                </p>
              </div>
            );
          })}
        </div>
        {active.length > 1 && (
          <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,.06)' }}>
            <p className="text-xs font-semibold" style={{ color: 'rgba(243,242,234,.85)' }}>Total at retirement</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: '#F3F2EA' }}>{formatGBP(totalInheritanceFV)}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-4 space-y-3" style={{ backgroundColor: '#E7F1EF', borderColor: '#1B6F81', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1B6F81' }} />
        <p className="text-sm font-semibold" style={{ color: '#09324A' }}>Inheritances</p>
      </div>
      <div className="space-y-2">
        {inheritances.map((entry, i) => {
          if (!entry.amount || !entry.age) return null;
          const { futureValue, afterRetirement } = inheritanceResults[i];
          return (
            <div key={i} className="bg-white rounded-2xl p-3 space-y-2" style={{ borderColor: '#DAD7C8', borderWidth: '1px' }}>
              <p className="text-xs font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Inheritance {i + 1}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#8a9599' }}>Amount</p>
                  <p className="text-sm font-bold" style={{ color: '#09324A' }}>{formatGBP(entry.amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#8a9599' }}>Received at</p>
                  <p className="text-sm font-bold" style={{ color: '#09324A' }}>Age {entry.age}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#8a9599' }}>
                    {afterRetirement ? "At retirement" : `At age ${retirementAge}`}
                  </p>
                  <p className="text-sm font-bold" style={{ color: '#09324A' }}>{formatGBP(futureValue)}</p>
                </div>
              </div>
              {afterRetirement && (
                <p className="text-xs text-center" style={{ color: '#8a9599' }}>Received after retirement — counted at face value</p>
              )}
            </div>
          );
        })}
      </div>
      {active.length > 1 && (
        <div className="flex items-center justify-between rounded-2xl px-4 py-2.5" style={{ backgroundColor: '#E7F1EF' }}>
          <p className="text-xs font-semibold" style={{ color: '#09324A' }}>Total at retirement</p>
          <p className="text-sm font-bold" style={{ color: '#09324A' }}>{formatGBP(totalInheritanceFV)}</p>
        </div>
      )}
    </div>
  );
}

// Compact "blue card" stat tile used by the dark "Your Numbers" tab — same
// visual family as StatTile, but denser so a full breakdown fits without
// scrolling inside the fixed-height results card.
function MiniStatCard({ label, value, accent }) {
  return (
    <div
      className="rounded-2xl p-3 min-w-0"
      style={accent
        ? { background: 'linear-gradient(155deg, rgba(255,251,8,.14), rgba(255,255,255,.03))', border: '1px solid rgba(255,251,8,.28)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }
        : { background: 'linear-gradient(155deg, rgba(255,255,255,.09), rgba(255,255,255,.015))', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}
    >
      <div className="font-display text-[10px] leading-tight" style={{ color: '#AED0C9' }}>{label}</div>
      <div className="font-serif font-bold text-[21px] leading-tight mt-1 tabular-nums" style={{ color: accent ? '#FFFB08' : '#F3F2EA' }}>{value}</div>
    </div>
  );
}

// The detailed pot-by-pot breakdown, shared between the mobile "Your Numbers"
// card (light rows, full descriptions) and the "Your Numbers" tab of the
// desktop results card (dark=true: compact blue cards, no scrollbar).
function YourNumbersBody({ inputs, result, statePension, inheritances, dark }) {
  const items = [
    {
      icon: "●",
      label: "Target retirement pot",
      value: formatGBP(result.targetPot),
      highlight: true,
      help: statePension.include
        ? `Based on your inputs and assumptions, the estimated pot needed at age ${inputs.retirementAge} to draw your income down to age ${result.planningAge}, after allowing for ${formatGBP(statePension.income)}/yr of State Pension. Shown in future money.`
        : `Based on your inputs and assumptions, the estimated pot needed at age ${inputs.retirementAge} to draw your income down to age ${result.planningAge}. Shown in future money.`,
    },
    ...(result.capitalPreservationTargetPot != null ? [{
      icon: "○",
      label: "Conservative comparison (preserve capital)",
      value: formatGBP(result.capitalPreservationTargetPot),
      help: `Preserving the pot and drawing only the assumed ${inputs.retirementReturn}% return would require around this much — it never runs down. Shown for reference, not as your target.`,
    }] : []),
    {
      icon: "●",
      label: "Projected pot at retirement with current monthly saving",
      value: formatGBP(result.projectedPotWithSaving),
      help: `If you keep saving ${fmtMoneyMo(inputs.monthlySavingsCurrent)}, this is the estimated value of your pot at age ${inputs.retirementAge}.`,
    },
    {
      icon: "●",
      label: "Projected pot at retirement if you stopped saving today",
      value: formatGBP(result.projectedPotNoSaving),
      help: `Your current savings${result.totalInheritanceFV > 0 ? " and expected inheritances" : ""} left to grow, with no further monthly contributions.`,
    },
    ...(result.savingsGap > 0 ? [{
      icon: "●",
      label: "Estimated monthly shortfall",
      value: `${formatGBP(result.savingsGap)}/mo`,
      help: "Extra monthly saving the model estimates you need to reach your target pot.",
    }] : result.savingsGap < 0 ? [{
      icon: "●",
      label: "Estimated monthly surplus",
      value: `${formatGBP(Math.abs(result.savingsGap))}/mo`,
      help: "You're saving more than the model estimates you need for this target.",
    }] : []),
    ...(statePension.include && result.incomeNeeded !== inputs.desiredIncome ? [{
      icon: "●",
      label: "Annual income less state pension",
      value: `${formatGBP(result.incomeNeeded)}/yr`,
      help: "Your target income minus the State Pension, in future money.",
    }] : []),
    result.depletionAge == null ? {
      icon: "●",
      label: "Estimated pot lasts until",
      value: "Beyond planning age",
      help: `Based on your current saving, the model estimates your pot would still last beyond your planning age of ${result.planningAge} (it isn't projected to run out within the modelled horizon).`,
    } : result.depletionAge >= result.planningAge ? {
      icon: "●",
      label: "Estimated pot lasts until",
      value: "Beyond planning age",
      help: `Based on your current saving, the model estimates your pot would last to around age ${result.depletionAge} — beyond your planning age of ${result.planningAge}.`,
    } : {
      icon: "●",
      label: "Estimated to run out around age",
      value: String(result.depletionAge),
      help: `Based on your current saving of ${fmtMoneyMo(inputs.monthlySavingsCurrent)}, the model estimates the pot runs out before your planning age of ${result.planningAge}.`,
    },
    ...(inheritances.some(({ amount, age }) => amount > 0 && age > 0) ? [{
      icon: "●",
      label: "Inheritance value at retirement",
      value: formatGBP(result.totalInheritanceFV),
      help: "The combined future value of your expected inheritances at your retirement age.",
    }] : []),
  ];

  if (dark) {
    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <MiniStatCard key={item.label} label={item.label} value={item.value} accent={item.highlight} />
          ))}
        </div>
        <InheritanceResultBox
          dark
          inheritances={inheritances}
          inheritanceResults={result.inheritanceResults}
          totalInheritanceFV={result.totalInheritanceFV}
          retirementAge={inputs.retirementAge}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item) => <ResultRow key={item.label} {...item} />)}
      </div>
      <InheritanceResultBox
        inheritances={inheritances}
        inheritanceResults={result.inheritanceResults}
        totalInheritanceFV={result.totalInheritanceFV}
        retirementAge={inputs.retirementAge}
      />
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
    <div className="bg-white border rounded-2xl shadow-lg px-3 py-2 text-sm" style={{ borderColor: '#DAD7C8', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p className="font-semibold mb-1" style={{ color: '#09324A' }}>Age {label}</p>
      <p className="font-bold" style={{ color: '#09324A' }}>{formatGBP(payload[0].value)}</p>
      {payload[0].payload.inheritanceThisYear && <p className="text-xs mt-1" style={{ color: '#09324A' }}>Inheritance received</p>}
      {payload[0].payload.statePensionKickIn && <p className="text-xs mt-1" style={{ color: '#1B6F81' }}>State pension starts</p>}
    </div>
  );
};

const InheritanceDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload.inheritanceThisYear) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#FFFB08" stroke="#fff" strokeWidth={2} />;
};

const StatePensionDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload.statePensionKickIn) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#AED0C9" stroke="#09324A" strokeWidth={2} />;
};

const ChartDot = (props) => {
  if (props.payload?.inheritanceThisYear) return <InheritanceDot {...props} />;
  if (props.payload?.statePensionKickIn) return <StatePensionDot {...props} />;
  return null;
};

// ─── "In use" hero: the dark navy card from the design system, carrying the
// key stats and the growth chart — the app's single most recognisable surface.

function StatPill({ status }) {
  const copy = status === 'green' ? 'On track' : status === 'amber' ? 'Close to target' : 'Action needed';
  return (
    <div className="ml-auto font-display text-xs font-semibold px-3.5 py-1.5 rounded-full" style={{ color: '#F3F2EA', backgroundColor: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)' }}>
      {copy}
    </div>
  );
}

function StatTile({ label, value, sub, accent }) {
  return (
    <div
      className="rounded-2xl p-5 min-w-0"
      style={accent
        ? { background: 'linear-gradient(155deg, rgba(255,251,8,.14), rgba(255,255,255,.03))', border: '1px solid rgba(255,251,8,.28)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }
        : { background: 'linear-gradient(155deg, rgba(255,255,255,.10), rgba(255,255,255,.02))', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}
    >
      <div className="font-display text-xs" style={{ color: '#AED0C9' }}>{label}</div>
      <div className="font-serif font-bold text-lg sm:text-xl mt-2 whitespace-nowrap tabular-nums" style={{ color: accent ? '#FFFB08' : '#F3F2EA', lineHeight: 1.15 }}>{value}</div>
      {sub && <div className="text-xs mt-2 break-words" style={{ color: '#AED0C9' }}>{sub}</div>}
    </div>
  );
}

// The headline stat cards, guidance banner, stat numbers and growth chart —
// the "Overview" content, shared between the mobile pinned panel and the
// "Overview" tab of the desktop results card.
function ResultsOverviewBody({ inputs, inheritances, result, statePension, statePensionAge, monthlySavingsCurrent, currentAge }) {
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
  const { isCoast, monthlySavings, savingsGap } = result;

  const statNumbers = [
    coastStat(result, currentAge),
    depletionStat(result),
  ];

  return (
    <>
      <div className="relative grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3 mb-5">
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'linear-gradient(155deg, rgba(255,251,8,.14), rgba(255,255,255,.03))', border: '1px solid rgba(255,251,8,.28)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-display text-xs" style={{ color: '#AED0C9' }}>{`Target pot at ${inputs.retirementAge}`}</div>
            <div className="font-serif font-bold text-[19.8px] sm:text-[22px] text-right whitespace-nowrap tabular-nums" style={{ color: '#FFFB08', lineHeight: 1.15 }}>{formatGBP(result.targetPot)}</div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-display text-xs" style={{ color: '#AED0C9' }}>{`Projected pot at ${inputs.retirementAge}`}</div>
            <div className="font-serif font-bold text-[19.8px] sm:text-[22px] text-right whitespace-nowrap tabular-nums" style={{ color: '#F3F2EA', lineHeight: 1.15 }}>{formatGBP(result.projectedPotWithSaving)}</div>
          </div>
        </div>
        <StatTile
          label="Monthly saving needed"
          value={isCoast ? '£0/mo' : `${formatGBP(monthlySavings)}/mo`}
          sub={savingsGap > 0 ? `${fmtMoneyMo(savingsGap)} more than now` : `Saving ${fmtMoneyMo(monthlySavingsCurrent)} now`}
        />
      </div>

      <div className="relative space-y-3 mb-5">
        <GuidanceBanner {...getGuidance(result, inputs.retirementAge)} />
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          {statNumbers.map(({ value, label }) => (
            <NumberStat key={label} value={value} label={label} />
          ))}
        </div>
      </div>

      <div className="relative rounded-2xl p-4" style={{ background: 'linear-gradient(155deg, rgba(255,255,255,.09), rgba(255,255,255,.015))', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <span className="font-display font-semibold text-sm" style={{ color: '#F3F2EA' }}>Projected growth</span>
          <div className="flex items-center gap-3 text-[11px] flex-wrap" style={{ color: '#AED0C9' }}>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: '#FFFB08' }} /> Projected pot</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: '#FF9A85' }} /> Target</span>
            {result.coastAge && <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: '#F3F2EA' }} /> Coast age</span>}
            {hasInheritance && <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FFFB08' }} /> Inheritance</span>}
            {statePension.include && statePensionAge > inputs.retirementAge && <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#AED0C9' }} /> State pension</span>}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="potGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFFB08" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#AED0C9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 6" stroke="rgba(255,255,255,.10)" vertical={false} />
            <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#7fa0a0" }} tickLine={false} axisLine={false}
              label={{ value: "Age", position: "insideBottomRight", offset: -4, fontSize: 11, fill: "#7fa0a0" }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "#7fa0a0" }} tickLine={false} axisLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={result.targetPot} stroke="#FF9A85" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: "Target", position: "right", fontSize: 10, fill: "#FF9A85" }} />
            {result.coastAge && (
              <ReferenceLine x={result.coastAge} stroke="#F3F2EA" strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: "Coast", position: "top", fontSize: 10, fill: "#F3F2EA" }} />
            )}
            <ReferenceLine x={inputs.retirementAge} stroke="#FFFB08" strokeDasharray="4 3" strokeWidth={2}
              label={{ value: `${inputs.annualReturn}%→${inputs.retirementReturn}%`, position: "insideTopRight", fontSize: 9, fill: "#FFFB08" }} />
            <ReferenceLine x={result.planningAge} stroke="#AED0C9" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: `Plan to ${result.planningAge}`, position: "top", fontSize: 10, fill: "#AED0C9" }} />
            {statePension.include && statePensionAge > inputs.retirementAge && (
              <ReferenceLine x={statePensionAge} stroke="#AED0C9" strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: "State Pension", position: "top", fontSize: 10, fill: "#AED0C9" }} />
            )}
            <Area type="monotone" dataKey="total" stroke="#FFFB08" strokeWidth={2.5} fill="url(#potGradient)"
              dot={<ChartDot />} activeDot={{ r: 4, fill: "#FFFB08", stroke: "#09324A", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function ResultsPanel({ inputs, inheritances, result, statePension, statePensionAge, monthlySavingsCurrent, currentAge, mobilePinned }) {
  const panelClass = mobilePinned
    ? "fixed rounded-t-[28px] lg:rounded-[28px] p-6 sm:p-8 overflow-y-auto overflow-x-hidden lg:overflow-hidden bottom-0 inset-x-0 z-30 max-h-[48vh] lg:max-h-none lg:sticky lg:top-6"
    : "relative rounded-[28px] p-6 sm:p-9 overflow-hidden";

  return (
    <div
      className={panelClass}
      style={{
        background: 'linear-gradient(160deg,#0c4060 0%,#09324A 46%,#061f2e 100%)',
        border: '1px solid rgba(255,255,255,.10)',
        boxShadow: '0 42px 90px -46px rgba(6,31,46,.9), inset 0 1px 0 rgba(255,255,255,.16)',
      }}
    >
      <div className="absolute pointer-events-none" style={{ top: -130, right: -70, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(174,208,201,.22), rgba(174,208,201,0) 70%)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: -160, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,251,8,.10), rgba(255,251,8,0) 70%)' }} />

      <div className="relative flex items-center gap-3 mb-7">
        <div className="font-serif font-bold text-lg" style={{ color: '#F3F2EA' }}>Your Projection</div>
        <StatPill status={result.status} />
      </div>

      <ResultsOverviewBody
        inputs={inputs}
        inheritances={inheritances}
        result={result}
        statePension={statePension}
        statePensionAge={statePensionAge}
        monthlySavingsCurrent={monthlySavingsCurrent}
        currentAge={currentAge}
      />
    </div>
  );
}

// ─── Tabs (prominent segmented control, used by both the desktop input card ───
// and the desktop results card so everything fits within a fixed height) ──────

function TabBar({ tabs, active, onChange, dark }) {
  return (
    <div
      className="grid gap-1 p-1 rounded-2xl mb-5 shrink-0"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))`, backgroundColor: dark ? 'rgba(255,255,255,.07)' : '#F3F2EA' }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className="text-xs sm:text-[13px] font-bold px-2 py-2.5 rounded-xl transition-all duration-150 whitespace-nowrap cursor-pointer"
            style={isActive
              ? { backgroundColor: dark ? '#FFFB08' : '#09324A', color: dark ? '#09324A' : '#FFFB08', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }
              : { backgroundColor: 'transparent', color: dark ? 'rgba(243,242,234,.62)' : '#8a9599' }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

const INPUT_TABS = [
  { key: "details", label: "Your Details" },
  { key: "options", label: "Options" },
];

const RESULT_TABS = [
  { key: "overview", label: "Overview" },
  { key: "numbers", label: "Your Numbers" },
  { key: "scenarios", label: "Scenarios" },
];

// Desktop-only (lg+): all four input sections in one 850px-tall card, switched
// via tabs instead of stacking as separate cards, so nothing scrolls out of
// view behind the results panel.
function InputsTabbedCard({ inputs, handleChange, setInputs, statePension, setStatePension, statePensionAge, inheritances, handleInheritanceChange }) {
  const [tab, setTab] = useState("details");
  return (
    <div
      className="hidden lg:flex lg:flex-col bg-white rounded-3xl p-6 lg:h-[850px]"
      style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <div className="font-serif font-bold text-lg mb-5 shrink-0" style={{ color: '#09324A' }}>Your Route</div>
      <TabBar tabs={INPUT_TABS} active={tab} onChange={setTab} />
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
        {tab === "details" && (
          <div className="space-y-6">
            <YourDetailsFields inputs={inputs} handleChange={handleChange} />
            <IncomeSection
              desiredIncome={inputs.desiredIncome}
              onChange={(val) => setInputs((prev) => ({ ...prev, desiredIncome: val }))}
              currentAge={inputs.currentAge}
              retirementAge={inputs.retirementAge}
            />
            <AssumptionsFields inputs={inputs} handleChange={handleChange} />
          </div>
        )}
        {tab === "options" && (
          <div className="space-y-6">
            <StatePensionFields inputs={inputs} statePension={statePension} setStatePension={setStatePension} statePensionAge={statePensionAge} />
            <div className="pt-4" style={{ borderTop: '1px solid #F3F2EA' }}>
              <InheritancesFields inheritances={inheritances} handleInheritanceChange={handleInheritanceChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Assumptions Panel ────────────────────────────────────────────────────────

function AssumptionsPanel({ assumptions }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Assumptions</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8a9599' }}>What these figures are based on</p>
        </div>
        <span
          className="text-lg font-semibold transition-transform duration-200"
          style={{ color: '#1B6F81', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4">
          <p className="text-xs leading-relaxed rounded-2xl px-4 py-3" style={{ color: '#09324A', backgroundColor: '#FFFCE0' }}>
            These results are illustrative and depend heavily on the assumptions below. They are not financial advice.
          </p>
          <div className="space-y-2">
            {assumptions.map(({ label, value, note }) => (
              <div key={label} className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#F3F2EA' }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium" style={{ color: '#8a9599' }}>{label}</span>
                  <span className="text-sm font-semibold text-right" style={{ color: '#09324A' }}>{value}</span>
                </div>
                {note && <p className="text-xs mt-1 leading-relaxed" style={{ color: '#8a9599' }}>{note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Matches AssumptionsPanel's collapsed-row styling so the two read as a pair,
// but this one links straight through to the methodology page rather than
// expanding in place.
function MethodologyLinkCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Link to="/methodology" className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Methodology</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8a9599' }}>Read how this calculator works</p>
        </div>
        <span className="text-lg font-semibold" style={{ color: '#1B6F81' }}>→</span>
      </Link>
    </div>
  );
}

// ─── "What could close the gap?" scenario cards ───────────────────────────────

function ScenarioCard({ title, lead, rows, footnote, tone = "neutral", dark }) {
  if (dark) {
    const accent = tone === "positive" ? '#AED0C9' : '#FFFB08';
    return (
      <div
        className="rounded-2xl p-3.5 space-y-1.5"
        style={{ background: 'linear-gradient(155deg, rgba(255,255,255,.09), rgba(255,255,255,.015))', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
          <p className="font-bold text-sm" style={{ color: '#F3F2EA' }}>{title}</p>
        </div>
        {lead && <p className="text-xs leading-snug" style={{ color: 'rgba(243,242,234,.68)' }}>{lead}</p>}
        {rows && rows.length > 0 && (
          <div className="space-y-1">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-xl px-3 py-1.5" style={{ backgroundColor: 'rgba(255,255,255,.06)' }}>
                <span className="text-xs" style={{ color: 'rgba(243,242,234,.85)' }}>{row.label}</span>
                <span className="text-xs font-semibold text-right tabular-nums" style={{ color: '#F3F2EA' }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
        {footnote && <p className="text-[11px] leading-snug" style={{ color: 'rgba(243,242,234,.5)' }}>{footnote}</p>}
      </div>
    );
  }

  const accent = tone === "positive" ? '#1B6F81' : '#09324A';
  const badgeBg = tone === "positive" ? '#E7F1EF' : '#FFFCE0';
  return (
    <div className="bg-white rounded-3xl p-5 space-y-3" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
        <p className="font-bold text-base" style={{ color: '#09324A' }}>{title}</p>
      </div>
      {lead && <p className="text-sm" style={{ color: '#4a5a5f' }}>{lead}</p>}
      {rows && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5" style={{ backgroundColor: badgeBg }}>
              <span className="text-sm" style={{ color: '#09324A' }}>{row.label}</span>
              <span className="text-sm font-semibold text-right" style={{ color: '#09324A' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
      {footnote && <p className="text-xs" style={{ color: '#8a9599' }}>{footnote}</p>}
    </div>
  );
}

function ScenarioCards({ baseParams, result, retirementAge, currentAge, desiredIncome, monthlySavingsCurrent, dark }) {
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
      <h2 className={dark ? "text-base font-bold font-serif" : "text-lg font-bold font-serif"} style={{ color: dark ? '#F3F2EA' : '#09324A' }}>What could close the gap?</h2>
      <p className="text-xs" style={{ color: dark ? 'rgba(243,242,234,.6)' : '#8a9599' }}>
        {onTrack
          ? "You look on track — here are ways to pressure-test or flex your plan. Based on these assumptions, not advice."
          : "A few routes that the model estimates could get you to your target. These are illustrations, not advice."}
      </p>
    </div>
  );

  const gap = dark ? "space-y-2.5" : "space-y-4";

  if (onTrack) {
    return (
      <div className={gap}>
        {heading}

        <ScenarioCard
          dark={dark}
          tone="positive"
          title="You may be on track"
          lead={`Based on these assumptions, your current saving of ${fmtMoneyMo(monthlySavingsCurrent)} could support your target income from age ${retirementAge} to age ${planningAge}.`}
          footnote={result.coastAge ? `The model estimates you could ease off contributions from around age ${result.coastAge} and still get there.` : undefined}
        />

        {earlierAges.length > 0 && (
          <ScenarioCard
            dark={dark}
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
          dark={dark}
          tone="positive"
          title="You could stress-test your assumptions"
          lead="Plans are only as good as their inputs. Try nudging the expected return down or inflation expectations up in the inputs to see how resilient your target stays."
        />
      </div>
    );
  }

  return (
    <div className={gap}>
      {heading}

      <ScenarioCard
        dark={dark}
        title="Save more monthly"
        lead={`Based on these assumptions, saving around ${fmtMoneyMo(result.savingsGap)} more per month could keep your plan on track for the pot to last to age ${planningAge}.`}
        rows={[
          { label: "You're saving now", value: fmtMoneyMo(monthlySavingsCurrent) },
          { label: "Suggested to stay on track", value: fmtMoneyMo(result.monthlySavings) },
        ]}
      />

      {laterAges.length > 0 && (
        <ScenarioCard
          dark={dark}
          title="Retire later"
          lead={`Retiring later could reduce the estimated monthly saving needed for the pot to last to age ${planningAge}:`}
          rows={laterAges.map((age) => ({
            label: `Retire at ${age}`,
            value: `${fmtMoneyMo(Math.max(0, run({ retirementAge: age }).monthlySavings))} needed`,
          }))}
        />
      )}

      <ScenarioCard
        dark={dark}
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

// Desktop-only (lg+): the navy results panel, "Your Numbers" breakdown,
// scenario cards and assumptions all in one 850px-tall card, switched via
// tabs so nothing scrolls out of view or ends up hidden behind another card.
function ResultsTabbedCard({ inputs, inheritances, result, statePension, statePensionAge }) {
  const [tab, setTab] = useState("overview");
  const monthlySavingsCurrent = inputs.monthlySavingsCurrent;
  const currentAge = inputs.currentAge;

  return (
    <div
      className="hidden lg:flex lg:flex-col relative rounded-[28px] p-6 sm:p-8 lg:h-[850px] overflow-hidden"
      style={{
        background: 'linear-gradient(160deg,#0c4060 0%,#09324A 46%,#061f2e 100%)',
        border: '1px solid rgba(255,255,255,.10)',
        boxShadow: '0 42px 90px -46px rgba(6,31,46,.9), inset 0 1px 0 rgba(255,255,255,.16)',
      }}
    >
      <div className="absolute pointer-events-none" style={{ top: -130, right: -70, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(174,208,201,.22), rgba(174,208,201,0) 70%)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: -160, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,251,8,.10), rgba(255,251,8,0) 70%)' }} />

      <div className="relative flex items-center gap-3 mb-5 shrink-0">
        <div className="font-serif font-bold text-lg" style={{ color: '#F3F2EA' }}>Your Projection</div>
        <StatPill status={result.status} />
      </div>

      <div className="relative">
        <TabBar tabs={RESULT_TABS} active={tab} onChange={setTab} dark />
      </div>

      <div className="relative flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
        {tab === "overview" && (
          <ResultsOverviewBody
            inputs={inputs}
            inheritances={inheritances}
            result={result}
            statePension={statePension}
            statePensionAge={statePensionAge}
            monthlySavingsCurrent={monthlySavingsCurrent}
            currentAge={currentAge}
          />
        )}
        {tab === "numbers" && (
          <YourNumbersBody dark inputs={inputs} result={result} statePension={statePension} inheritances={inheritances} />
        )}
        {tab === "scenarios" && (
          <ScenarioCards
            dark
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
            monthlySavingsCurrent={monthlySavingsCurrent}
          />
        )}
      </div>
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

export default function RetirementCalculator({ embedded = false } = {}) {
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
    <div className={embedded ? "w-full" : "min-h-screen px-4 pt-10 pb-[50vh] lg:pb-10"} style={embedded ? undefined : { backgroundColor: '#F3F2EA' }}>
      <div className={embedded ? "w-full" : "w-full max-w-6xl mx-auto"}>

        {/* Header */}
        {!embedded && (
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-6xl sm:text-7xl font-extrabold" style={{ color: '#09324A', fontFamily: "'Source Serif 4', serif", letterSpacing: '-0.02em', lineHeight: 1.02 }}>Route to Retire</h1>
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest" style={{ backgroundColor: '#E7F1EF', color: '#1B6F81', fontFamily: "'Manrope', sans-serif" }}>
              RETIREMENT CALCULATOR
            </div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#09324A', fontFamily: "'Source Serif 4', serif" }}>How is your route to retirement looking?</h2>
            <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: '#8a9599' }}>
              See if you're on track to meet your retirement goals — and find out when you could afford to ease back on contributions and let your savings do the work.
            </p>
          </div>
        )}

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT: Inputs ── */}
          <div className="space-y-4">

            {/* Mobile / tablet: stacked cards (unchanged below lg) */}
            <div className="lg:hidden space-y-4">
              {/* Your Details */}
              <div className="bg-white rounded-3xl p-6 space-y-5" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Your Details</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#09324A', backgroundColor: '#FFFB08' }}>Required</span>
                </div>
                <YourDetailsFields inputs={inputs} handleChange={handleChange} />
              </div>

              {/* Assumptions */}
              <div className="bg-white rounded-3xl p-6 space-y-5" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Assumptions</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#1B6F81', backgroundColor: '#E7F1EF' }}>Defaults provided</span>
                </div>
                <AssumptionsFields inputs={inputs} handleChange={handleChange} />
              </div>

              {/* Retirement Income */}
              <div className="bg-white rounded-3xl p-6 space-y-5" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Retirement Income</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#09324A', backgroundColor: '#FFFB08' }}>Required</span>
                </div>
                <RetirementIncomeFields
                  inputs={inputs}
                  setInputs={setInputs}
                  statePension={statePension}
                  setStatePension={setStatePension}
                  statePensionAge={statePensionAge}
                />
              </div>

              {/* Inheritances */}
              <div className="bg-white rounded-3xl p-6 space-y-4" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Expected Inheritances</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#8a9599', backgroundColor: '#F3F2EA' }}>Optional</span>
                </div>
                <InheritancesFields inheritances={inheritances} handleInheritanceChange={handleInheritanceChange} />
              </div>
            </div>

            {/* Desktop (lg+): one 850px card, sections switched via tabs */}
            <InputsTabbedCard
              inputs={inputs}
              handleChange={handleChange}
              setInputs={setInputs}
              statePension={statePension}
              setStatePension={setStatePension}
              statePensionAge={statePensionAge}
              inheritances={inheritances}
              handleInheritanceChange={handleInheritanceChange}
            />
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="space-y-4">
            {result ? (
              <>
                {/* Mobile / tablet: pinned overview panel + stacked cards (unchanged below lg) */}
                <div className="lg:hidden space-y-4">
                  <ResultsPanel
                    inputs={inputs}
                    inheritances={inheritances}
                    result={result}
                    statePension={statePension}
                    statePensionAge={statePensionAge}
                    monthlySavingsCurrent={inputs.monthlySavingsCurrent}
                    currentAge={inputs.currentAge}
                    mobilePinned={!embedded}
                  />
                  <div className="rounded-3xl p-6 space-y-4" style={{ backgroundColor: '#F3F2EA', borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Your Numbers</h2>
                    <YourNumbersBody inputs={inputs} result={result} statePension={statePension} inheritances={inheritances} />
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

                  <MethodologyLinkCard />
                </div>

                {/* Desktop (lg+): one 850px card, sections switched via tabs */}
                <ResultsTabbedCard
                  inputs={inputs}
                  inheritances={inheritances}
                  result={result}
                  statePension={statePension}
                  statePensionAge={statePensionAge}
                />
              </>
            ) : (
              <div
                className={`bg-white rounded-t-[28px] lg:rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-3 min-h-64 lg:h-[850px] ${
                  embedded ? "" : "fixed bottom-0 inset-x-0 z-30 lg:static lg:z-auto"
                }`}
                style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <p className="text-sm font-medium" style={{ color: '#8a9599' }}>Your results will appear here</p>
                <p className="text-xs" style={{ color: '#8a9599' }}>Make sure your retirement age is greater than your current age</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop (lg+): assumptions live as a dropdown card spanning both
            main cards, rather than a tab, so they read as reference material. */}
        {result && (
          <div className="hidden lg:block mt-6 space-y-4">
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
            <MethodologyLinkCard />
          </div>
        )}

        {/* Feedback Form */}
        {!embedded && (
          <>
            <div className="mt-12 mb-8 max-w-2xl mx-auto">
              <FeedbackForm />
            </div>
            <SiteFooter />
          </>
        )}
      </div>
    </div>
  );
}
