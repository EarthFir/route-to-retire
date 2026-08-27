import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  SPENDING_TAPER_START_AGE,
  getStatePensionAge,
  getAssumptions,
  getSpendingTaperFactor,
  getGlidedReturn,
  RETURN_GLIDE_YEARS,
  RETIREMENT_LIVING_STANDARDS,
  RETIREMENT_LIVING_STANDARDS_URL,
} from "../lib/assumptions.js";
import { Link } from "../lib/Link.jsx";
import SiteFooter from "../pages/SiteFooter.jsx";
import SummaryDocument from "./pdf/SummaryPages.jsx";
import { downloadSummaryPdf } from "../lib/pdfDownload.js";

// ─── Pure Calculation Utilities ───────────────────────────────────────────────

function formatGBP(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

// Grows a sum year by year from startAge to endAge, adding an optional
// monthly contribution at the end of each year. Applies the pre-retirement
// return glide (see getGlidedReturn in assumptions.js) rather than a single
// flat rate, so it replaces the old closed-form compound-interest formulas —
// those only work when the rate is constant every year.
function growPot({ startAge, endAge, startValue, monthlyContribution = 0, retirementAge, annualReturn, retirementReturn }) {
  let pot = startValue;
  for (let age = startAge + 1; age <= endAge; age++) {
    const rate = getGlidedReturn(age, retirementAge, annualReturn, retirementReturn) / 100;
    pot = pot * (1 + rate) + monthlyContribution * 12;
  }
  return pot;
}

function calcInheritanceFV(amount, receivedAge, retirementAge, annualReturn, retirementReturn) {
  if (!amount || !receivedAge) return { futureValue: 0, afterRetirement: false };
  if (receivedAge < retirementAge) {
    return {
      futureValue: growPot({ startAge: receivedAge, endAge: retirementAge, startValue: amount, retirementAge, annualReturn, retirementReturn }),
      afterRetirement: false,
    };
  }
  return { futureValue: amount, afterRetirement: true };
}

function findCoastAge({ currentAge, retirementAge, currentSavings, monthlySavingsCurrent, targetPot, annualReturn, retirementReturn, totalInheritanceFV }) {
  for (let age = currentAge; age <= retirementAge; age++) {
    const potAtStop = growPot({ startAge: currentAge, endAge: age, startValue: currentSavings, monthlyContribution: monthlySavingsCurrent, retirementAge, annualReturn, retirementReturn });
    const fvFinal = growPot({ startAge: age, endAge: retirementAge, startValue: potAtStop, retirementAge, annualReturn, retirementReturn }) + totalInheritanceFV;
    if (fvFinal >= targetPot) return { coastAge: age, yearsUntilCoast: age - currentAge };
  }
  return { coastAge: null, yearsUntilCoast: null };
}

// Binary search for the level monthly saving that grows totalFutureValueNoSaving
// up to targetPot by retirement. Needed because the return glide means there's
// no closed-form annuity formula to invert directly.
function solveRequiredMonthlySaving({ targetPot, totalFutureValueNoSaving, currentAge, retirementAge, annualReturn, retirementReturn }) {
  if (totalFutureValueNoSaving >= targetPot) return 0;
  let lo = 0;
  let hi = 1_000_000;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const fvContributions = growPot({ startAge: currentAge, endAge: retirementAge, startValue: 0, monthlyContribution: mid, retirementAge, annualReturn, retirementReturn });
    if (totalFutureValueNoSaving + fvContributions >= targetPot) hi = mid; else lo = mid;
  }
  return hi;
}

// The withdrawal the pot must fund at a given age in retirement: the target
// income (eased by the spending taper — see assumptions.js), less the State
// Pension once it has started.
function withdrawalForAge({ age, inflatedDesiredIncome, includeStatePension, statePensionIncome, statePensionAge }) {
  const taperedIncome = inflatedDesiredIncome * getSpendingTaperFactor(age);
  return includeStatePension && age >= statePensionAge
    ? Math.max(0, taperedIncome - statePensionIncome)
    : taperedIncome;
}

function getStatus({ isOnTrack, savingsGap, yearsToRetirement }) {
  if (isOnTrack) return "green";
  if (savingsGap > 250 || yearsToRetirement < 10) return "red";
  return "amber";
}

function calculateAll({ currentAge, retirementAge, currentSavings, desiredIncome, annualReturn, inheritances, includeStatePension, statePensionIncome, monthlySavingsCurrent, statePensionAge, retirementReturn, planningAge }) {
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

  const withdrawalAtAge = (age) =>
    withdrawalForAge({ age, inflatedDesiredIncome, includeStatePension, statePensionIncome, statePensionAge });

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

  // Pre-retirement growth uses the return glide (see growPot / getGlidedReturn)
  // rather than a single flat rate, so it's computed year by year.
  const futureValueCurrent = growPot({ startAge: currentAge, endAge: retirementAge, startValue: currentSavings, retirementAge, annualReturn, retirementReturn });
  const inheritanceResults = inheritances.map(({ amount, age }) =>
    calcInheritanceFV(amount, age > 0 ? age : null, retirementAge, annualReturn, retirementReturn)
  );
  const totalInheritanceFV = inheritanceResults.reduce((sum, { futureValue }) => sum + futureValue, 0);
  const totalFutureValue = futureValueCurrent + totalInheritanceFV;

  // Contributions from current monthly saving, grown to retirement.
  const fvContributions = growPot({ startAge: currentAge, endAge: retirementAge, startValue: 0, monthlyContribution: monthlySavingsCurrent, retirementAge, annualReturn, retirementReturn });

  // Two clearly-defined projected pots at retirement (both in future money):
  //  • no more saving  = today's savings + inheritances, grown, no new contributions
  //  • with saving      = the above plus continued monthly contributions
  const projectedPotNoSaving = totalFutureValue;
  const projectedPotWithSaving = totalFutureValue + fvContributions;

  const monthlySavings = solveRequiredMonthlySaving({ targetPot, totalFutureValueNoSaving: totalFutureValue, currentAge, retirementAge, annualReturn, retirementReturn });
  const savingsGap = monthlySavings - monthlySavingsCurrent;
  const isCoast = totalFutureValue >= targetPot;
  const { coastAge, yearsUntilCoast } = findCoastAge({ currentAge, retirementAge, currentSavings, monthlySavingsCurrent, targetPot, annualReturn, retirementReturn, totalInheritanceFV });

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

  // "On track" means the pot the user is actually projected to have — with
  // their current saving — is estimated to last to (or beyond) the planning
  // age, i.e. the same test as the "pot lasts until" figure and the chart.
  // Basing status on this (rather than only the stricter "could stop saving
  // today" coast test) avoids telling someone "action needed" when their
  // own projection already funds their plan, just with money left over.
  const isOnTrack = depletionAge == null || depletionAge >= effectivePlanningAge;
  const status = getStatus({ isOnTrack, savingsGap, yearsToRetirement: years });

  return { incomeNeeded, targetPot, planningAge: effectivePlanningAge, futureValueCurrent, projectedPotNoSaving, projectedPotWithSaving, inheritanceResults, totalInheritanceFV, totalFutureValue, monthlySavings, savingsGap, isCoast, isOnTrack, status, coastAge, yearsUntilCoast, depletionAge };
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
            className="w-36 text-right text-sm font-semibold px-2.5 py-0.5 rounded-lg outline-none tabular-nums"
            style={{ color: 'var(--calc-secondary, #1B6F81)', backgroundColor: 'var(--calc-secondary-tint, #E7F1EF)' }}
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
            style={{ borderColor: 'var(--calc-secondary, #1B6F81)', color: 'var(--calc-secondary, #1B6F81)' }}
          />
        ) : (
          <button
            onClick={startEdit}
            title="Click to type an exact value"
            className="group flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-lg tabular-nums transition-colors cursor-text"
            style={{ color: 'var(--calc-secondary, #1B6F81)', backgroundColor: 'var(--calc-secondary-tint, #E7F1EF)' }}
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
        style={{ background: `linear-gradient(to right, var(--calc-primary, #09324A) ${pct}%, #DAD7C8 ${pct}%)` }}
      />
    </div>
  );
}

// ─── Number Input ─────────────────────────────────────────────────────────────

function NumberInput({ label, name, value, onChange, prefix, suffix, min, max, step = 1, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium" style={{ color: 'var(--calc-primary, #09324A)' }}>{label}</label>}
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
          style={{ color: 'var(--calc-primary, #09324A)' }}
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
      <div className="relative w-10 h-6 rounded-full transition-colors duration-200" style={{ backgroundColor: checked ? 'var(--calc-primary, #09324A)' : '#DAD7C8' }}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-sm font-medium group-hover:text-[var(--calc-primary, #09324A)]" style={{ color: 'var(--calc-primary, #09324A)' }}>{label}</span>
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
        max={75000}
        step={1000}
        formatDisplay={fmtMoneyYr}
      />
      {yearsToRetirement > 0 && (
        <p className="text-xs text-[#8a9599]">
          This equals {formatGBP(inflated)} in {retirementYear} at 2.5% inflation
        </p>
      )}
      <p className="text-xs pt-1" style={{ color: '#8a9599' }}>
        Not sure? Try a benchmark from{" "}
        <a
          href={RETIREMENT_LIVING_STANDARDS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          PLSA Retirement Living Standards
        </a>
      </p>
      <div className="flex items-center gap-1.5">
        {RETIREMENT_LIVING_STANDARDS.map((std) => {
          const active = desiredIncome === std.income;
          return (
            <button
              key={std.key}
              type="button"
              onClick={() => onChange(std.income)}
              className="flex-1 min-w-0 text-xs px-2 py-1 rounded-full font-medium text-center transition-colors cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis"
              style={{
                color: active ? 'var(--calc-primary, #09324A)' : 'var(--calc-secondary, #1B6F81)',
                backgroundColor: active ? 'var(--calc-accent, #FFFB08)' : 'var(--calc-secondary-tint, #E7F1EF)',
              }}
            >
              {std.label} {fmtMoneyYr(std.income)}
            </button>
          );
        })}
      </div>
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
        <p className="text-xs text-[#8a9599] mt-2">Defaults to 7% (long-run equity average), easing to your retirement return over the last {RETURN_GLIDE_YEARS} years as you de-risk.</p>
      </div>
      <div>
        <SliderField label="Expected Return in Retirement" name="retirementReturn" value={inputs.retirementReturn} onChange={handleChange} min={1} max={10} step={0.5} formatDisplay={fmtPct} />
        <p className="text-xs text-[#8a9599] mt-2">Typically de-risks near retirement. 3–4% reflects a balanced allocation.</p>
      </div>
      <div>
        <SliderField label="Plan for pot to last until" name="planningAge" value={inputs.planningAge} onChange={handleChange} min={80} max={100} step={1} formatDisplay={fmtAge} />
        <p className="text-xs text-[#8a9599] mt-2">Your target pot draws down to this age, not forever.</p>
        {inputs.planningAge < inputs.retirementAge + MIN_PLANNING_YEARS && inputs.retirementAge > inputs.currentAge && (
          <p className="text-xs mt-1" style={{ color: 'var(--calc-secondary, #1B6F81)' }}>Modelled to age {inputs.retirementAge + MIN_PLANNING_YEARS} — the plan needs at least {MIN_PLANNING_YEARS} years beyond your retirement age.</p>
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
            <div className="rounded-2xl p-3 flex items-start gap-2" style={{ backgroundColor: 'var(--calc-accent-tint, #FFFCE0)', borderColor: 'var(--calc-accent, #FFFB08)', borderWidth: '1px' }}>
              <span className="text-sm">!</span>
              <p className="text-xs" style={{ color: 'var(--calc-primary, #09324A)' }}>
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

// ─── Result Components ────────────────────────────────────────────────────────

function ResultRow({ icon, label, value, highlight, help }) {
  return (
    <div className="py-3 px-4 rounded-2xl" style={{ backgroundColor: highlight ? 'var(--calc-accent-tint, #FFFCE0)' : '#F3F2EA' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-lg leading-tight">{icon}</span>
          <span className="text-sm font-medium" style={{ color: highlight ? 'var(--calc-secondary, #1B6F81)' : '#8a9599' }}>{label}</span>
        </div>
        <span className="text-base font-semibold whitespace-nowrap" style={{ color: 'var(--calc-primary, #09324A)' }}>{value}</span>
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
    body: `The model estimates you're currently ${formatGBP(savingsGap)}/month short of the amount needed for your pot to last to age ${planningAge}. Three inputs change this figure: how much you save each month, the age you retire, and the income you target.`,
  };
}

const GUIDANCE_TONES = {
  mint: { accent: "var(--calc-positive, #AED0C9)", bg: "color-mix(in srgb, var(--calc-positive, #AED0C9) 10%, transparent)", border: "color-mix(in srgb, var(--calc-positive, #AED0C9) 25%, transparent)" },
  yellow: { accent: "var(--calc-accent, #FFFB08)", bg: "color-mix(in srgb, var(--calc-accent, #FFFB08) 10%, transparent)", border: "color-mix(in srgb, var(--calc-accent, #FFFB08) 28%, transparent)" },
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
    <div className="pt-3" style={{ borderTop: "1px solid color-mix(in srgb, var(--calc-positive, #AED0C9) 18%, transparent)" }}>
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
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--calc-positive, #AED0C9)' }} />
          <p className="text-xs font-semibold" style={{ color: '#F3F2EA' }}>Inheritances</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {inheritances.map((entry, i) => {
            if (!entry.amount || !entry.age) return null;
            const { futureValue, afterRetirement } = inheritanceResults[i];
            return (
              <div key={i} className="rounded-xl p-2" style={{ backgroundColor: 'rgba(255,255,255,.06)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider font-display" style={{ color: 'var(--calc-secondary-text, var(--calc-positive, #AED0C9))' }}>Inheritance {i + 1}</p>
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
    <div className="rounded-3xl p-4 space-y-3" style={{ backgroundColor: 'var(--calc-secondary-tint, #E7F1EF)', borderColor: 'var(--calc-secondary, #1B6F81)', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--calc-secondary, #1B6F81)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--calc-primary, #09324A)' }}>Inheritances</p>
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
                  <p className="text-sm font-bold" style={{ color: 'var(--calc-primary, #09324A)' }}>{formatGBP(entry.amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#8a9599' }}>Received at</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--calc-primary, #09324A)' }}>Age {entry.age}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#8a9599' }}>
                    {afterRetirement ? "At retirement" : `At age ${retirementAge}`}
                  </p>
                  <p className="text-sm font-bold" style={{ color: 'var(--calc-primary, #09324A)' }}>{formatGBP(futureValue)}</p>
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
        <div className="flex items-center justify-between rounded-2xl px-4 py-2.5" style={{ backgroundColor: 'var(--calc-secondary-tint, #E7F1EF)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--calc-primary, #09324A)' }}>Total at retirement</p>
          <p className="text-sm font-bold" style={{ color: 'var(--calc-primary, #09324A)' }}>{formatGBP(totalInheritanceFV)}</p>
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
        ? { background: 'linear-gradient(155deg, color-mix(in srgb, var(--calc-accent, #FFFB08) 14%, transparent), rgba(255,255,255,.03))', border: '1px solid color-mix(in srgb, var(--calc-accent, #FFFB08) 28%, transparent)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }
        : { background: 'linear-gradient(155deg, rgba(255,255,255,.09), rgba(255,255,255,.015))', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}
    >
      <div className="font-display text-[10px] leading-tight" style={{ color: 'var(--calc-secondary-text, var(--calc-positive, #AED0C9))' }}>{label}</div>
      <div className="font-serif font-bold text-[21px] leading-tight mt-1 tabular-nums" style={{ color: accent ? 'var(--calc-accent, #FFFB08)' : '#F3F2EA' }}>{value}</div>
    </div>
  );
}

// The detailed pot-by-pot breakdown, shared between the mobile "Your Numbers"
// card (light rows, full descriptions) and the "Your Numbers" tab of the
// desktop results card (dark=true: compact blue cards, no scrollbar).
function YourNumbersBody({ inputs, result, statePension, inheritances, dark, partnerBrand }) {
  const items = [
    {
      icon: "●",
      label: "Target retirement pot",
      value: formatGBP(result.targetPot),
      highlight: true,
      help: statePension.include
        ? `Based on your inputs and assumptions, the estimated pot needed at age ${inputs.retirementAge} to draw your income down to age ${result.planningAge}, tapering after age ${SPENDING_TAPER_START_AGE} and after allowing for ${formatGBP(statePension.income)}/yr of State Pension. Shown in future money.`
        : `Based on your inputs and assumptions, the estimated pot needed at age ${inputs.retirementAge} to draw your income down to age ${result.planningAge}, tapering after age ${SPENDING_TAPER_START_AGE}. Shown in future money.`,
    },
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
        <NumbersDisclaimer dark partnerBrand={partnerBrand} />
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
      <NumbersDisclaimer partnerBrand={partnerBrand} />
    </div>
  );
}

// Short-form reminder of the headline points from the Disclaimer page, shown
// at the foot of "Your Numbers" so it travels with the figures themselves.
function NumbersDisclaimer({ dark, partnerBrand }) {
  const disclaimerHref = partnerBrand?.whiteLabel ? "/partners/disclaimer" : "/disclaimer";
  const points = [
    "Educational tool only — not financial or tax advice.",
    "Results are estimates, not guarantees.",
    "Returns and inflation can vary from what's assumed here.",
  ];
  return (
    <div
      className="text-xs pt-2 mt-1"
      style={{
        borderTop: `1px solid ${dark ? "rgba(255,255,255,.14)" : "#E4E1D4"}`,
        color: dark ? "rgba(243,242,234,.55)" : "#8a9599",
      }}
    >
      <p className="font-semibold mb-1" style={{ color: dark ? "rgba(243,242,234,.75)" : "#5b6669" }}>
        Disclaimer
      </p>
      <ul className="space-y-1 list-disc pl-4">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="mt-1">
        See the{" "}
        <Link to={disclaimerHref} style={{ color: dark ? "var(--calc-positive, #AED0C9)" : "var(--calc-secondary, #1B6F81)" }}>
          full disclaimer
        </Link>.
      </p>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function buildChartData({ currentAge, retirementAge, currentSavings, monthlySavingsCurrent, annualReturn, inheritances, desiredIncome, includeStatePension, statePensionIncome, statePensionAge, retirementReturn, planningAge }) {
  const retirementR = retirementReturn / 100;
  const inflationRate = INFLATION_RATE;
  const yearsToRetirement = retirementAge - currentAge;
  const inflatedDesiredIncome = desiredIncome * Math.pow(1 + inflationRate, yearsToRetirement);
  const data = [];

  // Accumulation phase — year by year, since the pre-retirement return glides
  // down towards the retirement return rather than staying flat (see growPot).
  const inheritanceReceivedByAge = (age) =>
    inheritances.reduce((sum, { amount, age: recAge }) => (amount > 0 && recAge === age ? sum + amount : sum), 0);
  let pot = currentSavings + inheritanceReceivedByAge(currentAge);
  data.push({
    age: currentAge,
    total: pot,
    inheritanceThisYear: inheritances.some(({ amount, age: recAge }) => amount > 0 && recAge === currentAge),
    statePensionKickIn: false,
    phase: "accumulation",
  });
  for (let age = currentAge + 1; age <= retirementAge; age++) {
    const rate = getGlidedReturn(age, retirementAge, annualReturn, retirementReturn) / 100;
    pot = pot * (1 + rate) + monthlySavingsCurrent * 12 + inheritanceReceivedByAge(age);
    const inheritanceThisYear = inheritances.some(({ amount, age: recAge }) => amount > 0 && recAge === age);
    data.push({ age, total: pot, inheritanceThisYear, statePensionKickIn: false, phase: "accumulation" });
  }

  // Drawdown phase — run to the planning age (capped at the modelling horizon).
  const planningEnd = Math.min(
    MODELLING_END_AGE,
    Math.max(retirementAge + MIN_PLANNING_YEARS, planningAge || DEFAULT_PLANNING_AGE),
  );
  const drawdownYears = Math.max(0, planningEnd - retirementAge);
  for (let i = 1; i <= drawdownYears; i++) {
    const age = retirementAge + i;
    const withdrawal = withdrawalForAge({ age, inflatedDesiredIncome, includeStatePension, statePensionIncome, statePensionAge });
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
      <p className="font-semibold mb-1" style={{ color: 'var(--calc-primary, #09324A)' }}>Age {label}</p>
      <p className="font-bold" style={{ color: 'var(--calc-primary, #09324A)' }}>{formatGBP(payload[0].value)}</p>
      {payload[0].payload.inheritanceThisYear && <p className="text-xs mt-1" style={{ color: 'var(--calc-primary, #09324A)' }}>Inheritance received</p>}
      {payload[0].payload.statePensionKickIn && <p className="text-xs mt-1" style={{ color: 'var(--calc-secondary, #1B6F81)' }}>State pension starts</p>}
    </div>
  );
};

const InheritanceDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload.inheritanceThisYear) return null;
  return <circle cx={cx} cy={cy} r={5} fill="var(--calc-accent, #FFFB08)" stroke="#fff" strokeWidth={2} />;
};

const StatePensionDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload.statePensionKickIn) return null;
  return <circle cx={cx} cy={cy} r={5} fill="var(--calc-positive, #AED0C9)" stroke="var(--calc-primary, #09324A)" strokeWidth={2} />;
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
        ? { background: 'linear-gradient(155deg, color-mix(in srgb, var(--calc-accent, #FFFB08) 14%, transparent), rgba(255,255,255,.03))', border: '1px solid color-mix(in srgb, var(--calc-accent, #FFFB08) 28%, transparent)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }
        : { background: 'linear-gradient(155deg, rgba(255,255,255,.10), rgba(255,255,255,.02))', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}
    >
      <div className="font-display text-xs" style={{ color: 'var(--calc-secondary-text, var(--calc-positive, #AED0C9))' }}>{label}</div>
      <div className="font-serif font-bold text-lg sm:text-xl mt-2 whitespace-nowrap tabular-nums" style={{ color: accent ? 'var(--calc-accent, #FFFB08)' : '#F3F2EA', lineHeight: 1.15 }}>{value}</div>
      {sub && <div className="text-xs mt-2 break-words" style={{ color: 'var(--calc-secondary-text, var(--calc-positive, #AED0C9))' }}>{sub}</div>}
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
          style={{ background: 'linear-gradient(155deg, color-mix(in srgb, var(--calc-accent, #FFFB08) 14%, transparent), rgba(255,255,255,.03))', border: '1px solid color-mix(in srgb, var(--calc-accent, #FFFB08) 28%, transparent)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-display text-xs" style={{ color: 'var(--calc-secondary-text, var(--calc-positive, #AED0C9))' }}>{`Target pot at ${inputs.retirementAge}`}</div>
            <div className="font-serif font-bold text-[19.8px] sm:text-[22px] text-right whitespace-nowrap tabular-nums" style={{ color: 'var(--calc-accent, #FFFB08)', lineHeight: 1.15 }}>{formatGBP(result.targetPot)}</div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-display text-xs" style={{ color: 'var(--calc-secondary-text, var(--calc-positive, #AED0C9))' }}>{`Projected pot at ${inputs.retirementAge}`}</div>
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

      <GrowthChartCard inputs={inputs} result={result} statePension={statePension} statePensionAge={statePensionAge} data={data} hasInheritance={hasInheritance} />
    </>
  );
}

// The annotated "Projected growth" chart — axes, legend, reference lines for
// target/coast/state pension — shared between the desktop/mobile Overview tab
// and the mobile sticky ticker's expanded state, so both show the same chart.
function GrowthChartCard({ inputs, result, statePension, statePensionAge, data, hasInheritance, gradientId = "potGradient" }) {
  return (
    <div className="relative rounded-2xl p-4" style={{ background: 'linear-gradient(155deg, rgba(255,255,255,.09), rgba(255,255,255,.015))', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <span className="font-display font-semibold text-sm" style={{ color: '#F3F2EA' }}>Projected growth</span>
        <div className="flex items-center gap-3 text-[11px] flex-wrap" style={{ color: 'var(--calc-secondary-text, var(--calc-positive, #AED0C9))' }}>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: 'var(--calc-accent, #FFFB08)' }} /> Projected pot</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: '#FF9A85' }} /> Target</span>
          {result.coastAge && <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: '#F3F2EA' }} /> Coast age</span>}
          {hasInheritance && <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--calc-accent, #FFFB08)' }} /> Inheritance</span>}
          {statePension.include && statePensionAge > inputs.retirementAge && <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--calc-positive, #AED0C9)' }} /> State pension</span>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--calc-accent, #FFFB08)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--calc-positive, #AED0C9)" stopOpacity={0.02} />
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
          <ReferenceLine x={inputs.retirementAge} stroke="var(--calc-accent, #FFFB08)" strokeDasharray="4 3" strokeWidth={2}
            label={{ value: `${inputs.annualReturn}%→${inputs.retirementReturn}%`, position: "insideTopRight", fontSize: 9, fill: "var(--calc-accent, #FFFB08)" }} />
          <ReferenceLine x={result.planningAge} stroke="var(--calc-positive, #AED0C9)" strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: `Plan to ${result.planningAge}`, position: "top", fontSize: 10, fill: "var(--calc-positive, #AED0C9)" }} />
          {statePension.include && statePensionAge > inputs.retirementAge && (
            <ReferenceLine x={statePensionAge} stroke="var(--calc-positive, #AED0C9)" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "State Pension", position: "top", fontSize: 10, fill: "var(--calc-positive, #AED0C9)" }} />
          )}
          <Area type="monotone" dataKey="total" stroke="var(--calc-accent, #FFFB08)" strokeWidth={2.5} fill={`url(#${gradientId})`}
            dot={<ChartDot />} activeDot={{ r: 4, fill: "var(--calc-accent, #FFFB08)", stroke: "var(--calc-primary, #09324A)", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mobile / tablet only (lg:hidden): a slim bar pinned just below the site nav
// so the headline numbers + a mini chart stay visible the whole time the user
// is scrolling through inputs or results — the mobile stand-in for desktop's
// permanently-visible right-hand results column. Tap to expand into the same
// annotated chart used in the full "Your Projection" card below.
function MobileLiveTicker({ inputs, inheritances, result, statePension, statePensionAge, topOffset }) {
  const [expanded, setExpanded] = useState(false);
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
    <div
      className="lg:hidden sticky z-20 pt-3 pb-3"
      style={{ top: topOffset, backgroundColor: '#F3F2EA' }}
    >
      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: 'linear-gradient(160deg,var(--calc-primary-mid, #0c4060) 0%,var(--calc-primary, #09324A) 46%,var(--calc-primary-deep, #061f2e) 100%)',
          border: '1px solid rgba(255,255,255,.10)',
          boxShadow: '0 12px 28px -14px color-mix(in srgb, var(--calc-primary-deep, #061f2e) 60%, transparent)',
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-serif font-bold text-sm" style={{ color: '#F3F2EA' }}>Your Projection</span>
          <StatPill status={result.status} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-display text-[10px] uppercase tracking-wide truncate" style={{ color: 'var(--calc-secondary-text, var(--calc-positive, #AED0C9))' }}>{`Target at ${inputs.retirementAge}`}</div>
            <div className="font-serif font-bold text-base tabular-nums whitespace-nowrap" style={{ color: 'var(--calc-accent, #FFFB08)' }}>{formatGBP(result.targetPot)}</div>
          </div>
          <div className="min-w-0 text-right">
            <div className="font-display text-[10px] uppercase tracking-wide truncate" style={{ color: 'var(--calc-secondary-text, var(--calc-positive, #AED0C9))' }}>Projected</div>
            <div className="font-serif font-bold text-base tabular-nums whitespace-nowrap" style={{ color: '#F3F2EA' }}>{formatGBP(result.projectedPotWithSaving)}</div>
          </div>
        </div>

        {!expanded && (
          <div style={{ height: 56, marginTop: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
                <defs>
                  <linearGradient id="potGradientMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--calc-accent, #FFFB08)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--calc-positive, #AED0C9)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <ReferenceLine y={result.targetPot} stroke="#FF9A85" strokeDasharray="4 3" strokeWidth={1} />
                <ReferenceLine x={inputs.retirementAge} stroke="var(--calc-accent, #FFFB08)" strokeDasharray="3 3" strokeWidth={1.5} />
                <Area type="monotone" dataKey="total" stroke="var(--calc-accent, #FFFB08)" strokeWidth={2} fill="url(#potGradientMobile)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div
              className="mt-3 transition-opacity duration-300"
              style={{ opacity: expanded ? 1 : 0 }}
            >
              <GrowthChartCard inputs={inputs} result={result} statePension={statePension} statePensionAge={statePensionAge} data={data} hasInheritance={hasInheritance} gradientId="potGradientMobileFull" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold font-display cursor-pointer"
          style={{ color: 'var(--calc-positive, #AED0C9)' }}
        >
          {expanded ? "Hide full chart" : "Show full chart"}
          <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>▾</span>
        </button>
      </div>
    </div>
  );
}

// ─── Tabs (prominent segmented control, used by both the desktop input card ───
// and the desktop results card so everything fits within a fixed height) ──────

function TabBar({ tabs, active, onChange, dark }) {
  return (
    <div
      className="grid gap-1 p-1 rounded-2xl mb-5 shrink-0"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))`, backgroundColor: dark ? 'rgba(255,255,255,.1)' : '#EAE8DC' }}
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
              ? { backgroundColor: dark ? 'var(--calc-accent, #FFFB08)' : 'var(--calc-primary, #09324A)', color: dark ? 'var(--calc-primary, #09324A)' : 'var(--calc-tab-active-text, var(--calc-accent, #FFFB08))', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }
              : { backgroundColor: 'transparent', color: dark ? 'rgba(243,242,234,.85)' : '#5B6770' }}
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

// Desktop-only (lg+): all four input sections in one 865px-tall card, switched
// via tabs instead of stacking as separate cards, so nothing scrolls out of
// view behind the results panel.
function InputsTabbedCard({ inputs, handleChange, setInputs, statePension, setStatePension, statePensionAge, inheritances, handleInheritanceChange }) {
  const [tab, setTab] = useState("details");
  return (
    <div
      className="hidden lg:flex lg:flex-col bg-white rounded-3xl p-6 lg:h-[865px]"
      style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <div className="font-serif font-bold text-lg mb-5 shrink-0" style={{ color: 'var(--calc-primary, #09324A)' }}>Your Route</div>
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
          style={{ color: 'var(--calc-secondary, #1B6F81)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4">
          <p className="text-xs leading-relaxed rounded-2xl px-4 py-3" style={{ color: 'var(--calc-primary, #09324A)', backgroundColor: 'var(--calc-accent-tint, #FFFCE0)' }}>
            These results are illustrative and depend heavily on the assumptions below. They are not financial advice.
          </p>
          <div className="space-y-2">
            {assumptions.map(({ label, value, note }) => (
              <div key={label} className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#F3F2EA' }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium" style={{ color: '#8a9599' }}>{label}</span>
                  <span className="text-sm font-semibold text-right" style={{ color: 'var(--calc-primary, #09324A)' }}>{value}</span>
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
function MethodologyLinkCard({ partnerBrand }) {
  const to = partnerBrand?.whiteLabel ? "/partners/methodology" : "/methodology";
  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Link to={to} className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Methodology</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8a9599' }}>Read how this calculator works</p>
        </div>
        <span className="text-lg font-semibold" style={{ color: 'var(--calc-secondary, #1B6F81)' }}>→</span>
      </Link>
    </div>
  );
}

// Renders the summary document off-screen (via a portal into <body>, so it
// escapes this card's own layout/overflow entirely) and hands it to html2pdf
// on click — the file downloads directly, with no separate page to view.
// Position off-screen rather than display:none/visibility:hidden/opacity:0:
// html2canvas redraws from computed styles rather than screenshotting real
// pixels, so those would capture as blank; a real (just off-canvas) box works.
function PdfSummaryCard({ inputs, inheritances, statePension, statePensionAge, result, assumptions, partnerSlug, partnerBrand }) {
  const docRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const data = { generatedAt: new Date().toISOString(), inputs, inheritances, statePension, statePensionAge, result, assumptions };

  const handleDownload = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const filename = partnerBrand ? `${partnerBrand.slug}-retirement-summary.pdf` : undefined;
      await downloadSummaryPdf(docRef.current, filename);
      if (partnerSlug) {
        // Fire-and-forget: the file has already downloaded regardless of
        // whether this beacon succeeds, so a failure here must never surface.
        fetch("/api/pdf-downloads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partner: partnerSlug }),
        }).catch(() => {});
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left cursor-pointer disabled:cursor-wait"
      >
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>PDF summary</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8a9599' }}>
            {isGenerating ? 'Preparing your PDF…' : 'Download a copy of your results, assumptions and methodology'}
          </p>
        </div>
        <span className="text-lg font-semibold" style={{ color: 'var(--calc-secondary, #1B6F81)' }}>{isGenerating ? '…' : '↓'}</span>
      </button>
      {createPortal(
        <div style={{ position: 'fixed', top: 0, left: '-10000px', zIndex: -1 }}>
          <div ref={docRef}><SummaryDocument data={data} brand={partnerBrand} /></div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── "What could close the gap?" scenario cards ───────────────────────────────

function ScenarioCard({ title, lead, rows, footnote, tone = "neutral", dark }) {
  if (dark) {
    const accent = tone === "positive" ? 'var(--calc-positive, #AED0C9)' : 'var(--calc-accent, #FFFB08)';
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

  const accent = tone === "positive" ? 'var(--calc-secondary, #1B6F81)' : 'var(--calc-primary, #09324A)';
  const badgeBg = tone === "positive" ? 'var(--calc-secondary-tint, #E7F1EF)' : 'var(--calc-accent-tint, #FFFCE0)';
  return (
    <div className="bg-white rounded-3xl p-5 space-y-3" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
        <p className="font-bold text-base" style={{ color: 'var(--calc-primary, #09324A)' }}>{title}</p>
      </div>
      {lead && <p className="text-sm" style={{ color: '#4a5a5f' }}>{lead}</p>}
      {rows && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5" style={{ backgroundColor: badgeBg }}>
              <span className="text-sm" style={{ color: 'var(--calc-primary, #09324A)' }}>{row.label}</span>
              <span className="text-sm font-semibold text-right" style={{ color: 'var(--calc-primary, #09324A)' }}>{row.value}</span>
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
      <h2 className={dark ? "text-base font-bold font-serif" : "text-lg font-bold font-serif"} style={{ color: dark ? '#F3F2EA' : 'var(--calc-primary, #09324A)' }}>What could close the gap?</h2>
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
// scenario cards and assumptions all in one 865px-tall card, switched via
// tabs so nothing scrolls out of view or ends up hidden behind another card.
function ResultsTabbedCard({ inputs, inheritances, result, statePension, statePensionAge, partnerBrand }) {
  const [tab, setTab] = useState("overview");
  const monthlySavingsCurrent = inputs.monthlySavingsCurrent;
  const currentAge = inputs.currentAge;

  return (
    <div
      id="your-projection"
      className="flex flex-col relative rounded-[28px] p-6 sm:p-8 lg:h-[865px] overflow-hidden"
      style={{
        background: 'linear-gradient(160deg,var(--calc-primary-mid, #0c4060) 0%,var(--calc-primary, #09324A) 46%,var(--calc-primary-deep, #061f2e) 100%)',
        border: '1px solid rgba(255,255,255,.10)',
        boxShadow: '0 42px 90px -46px color-mix(in srgb, var(--calc-primary-deep, #061f2e) 90%, transparent), inset 0 1px 0 rgba(255,255,255,.16)',
        scrollMarginTop: 292,
      }}
    >
      <div className="absolute pointer-events-none" style={{ top: -130, right: -70, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--calc-positive, #AED0C9) 22%, transparent), color-mix(in srgb, var(--calc-positive, #AED0C9) 0%, transparent) 70%)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: -160, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--calc-accent, #FFFB08) 10%, transparent), color-mix(in srgb, var(--calc-accent, #FFFB08) 0%, transparent) 70%)' }} />

      <div className="relative flex items-center gap-3 mb-5 shrink-0">
        <div className="font-serif font-bold text-lg" style={{ color: '#F3F2EA' }}>Your Projection</div>
        <StatPill status={result.status} />
      </div>

      <div className="relative">
        <TabBar tabs={RESULT_TABS} active={tab} onChange={setTab} dark />
      </div>

      <div className="relative flex-1 min-h-0 lg:overflow-y-auto lg:pr-1 lg:-mr-1">
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
          <YourNumbersBody dark inputs={inputs} result={result} statePension={statePension} inheritances={inheritances} partnerBrand={partnerBrand} />
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

// enablePdfDownload: off by default (the free /your-route calculator) — PDF export
// is a Pro/partner perk, currently on for partner pages (see
// PartnerCalculatorPage.jsx) and intended for the Pro calculator once that
// has its own gated experience. partnerSlug: only meaningful alongside
// enablePdfDownload — identifies which partner's download counter to
// increment (see api/pdf-downloads.js); omit it (as /your-route does implicitly,
// by never setting enablePdfDownload) and no tracking call is made.
// partnerBrand: the partner config object (see src/lib/partners/*.js), used
// to re-brand the downloaded PDF summary (logo, colors, filename) — omit it
// and the PDF renders with Route to Retire's own branding, as /your-route does.
// onSummaryChange: optional callback fired with { inputs, statePension, result }
// whenever the calculation changes (or null while there's no valid result) —
// lets a parent page (e.g. PartnerCalculatorPage's lead form) offer to include
// the same numbers shown on screen without duplicating the calculation itself.
export default function RetirementCalculator({ embedded = false, initialInputs, enablePdfDownload = false, partnerSlug, partnerBrand, onSummaryChange } = {}) {
  const [inputs, setInputs] = useState(() => ({ ...DEFAULT_INPUTS, ...initialInputs }));
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
  const [resultsInView, setResultsInView] = useState(false);

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

  const hasResult = !!result;

  useEffect(() => {
    onSummaryChange?.(result ? { inputs, statePension, result } : null);
  }, [result, inputs, statePension, onSummaryChange]);

  const assumptions = useMemo(() => {
    if (!result) return [];
    return getAssumptions({
      annualReturn: inputs.annualReturn,
      retirementReturn: inputs.retirementReturn,
      includeStatePension: statePension.include,
      statePensionIncome: statePension.income,
      statePensionAge,
      planningAge: result.planningAge,
    });
  }, [result, inputs.annualReturn, inputs.retirementReturn, statePension, statePensionAge]);

  // Once the "Your Projection" card has scrolled into view, the mobile live
  // ticker and the "View Full Projection" jump bar are showing the same
  // information a second time — hide both so the card fully takes over.
  useEffect(() => {
    if (!hasResult) return;
    const target = document.getElementById('your-projection');
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setResultsInView(entry.isIntersecting),
      { rootMargin: '-100px 0px -55% 0px', threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasResult]);

  return (
    <div className={embedded ? "w-full" : "min-h-screen px-4 pt-10 pb-32 lg:pb-10"} style={embedded ? undefined : { backgroundColor: '#F3F2EA' }}>
      <div className={embedded ? "w-full" : "w-full max-w-6xl mx-auto"}>

        {/* Header */}
        {!embedded && (
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--calc-primary, #09324A)', fontFamily: "'Source Serif 4', serif" }}>How is your route to retirement looking?</h2>
            <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: '#8a9599' }}>
              See if you're on track to meet your retirement goals — and find out when you could afford to ease back on contributions and let your savings do the work.
            </p>
          </div>
        )}

        {/* Mobile / tablet: sticky jump-link to the full results card, since
            the tabbed "Your Projection" card now sits below all the inputs.
            Slides away once that card has scrolled into view. */}
        {result && (
          <div
            className="lg:hidden fixed bottom-0 inset-x-0 z-30 px-4 pt-3"
            style={{
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
              background: 'linear-gradient(to top, rgba(243,242,234,1) 65%, rgba(243,242,234,0))',
              transform: resultsInView ? 'translateY(100%)' : 'translateY(0)',
              opacity: resultsInView ? 0 : 1,
              transition: 'transform 300ms ease, opacity 250ms ease',
              pointerEvents: resultsInView ? 'none' : 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => document.getElementById('your-projection')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="w-full font-display font-bold text-sm rounded-full py-3.5 cursor-pointer"
              style={{ backgroundColor: 'var(--calc-accent, #FFFB08)', color: 'var(--calc-primary, #09324A)', boxShadow: '0 8px 20px -6px color-mix(in srgb, var(--calc-primary, #09324A) 35%, transparent)' }}
            >
              View Full Projection ↓
            </button>
          </div>
        )}

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT: Inputs ── */}
          <div className="space-y-4">

            {/* Mobile / tablet: live summary pinned below the site nav — the
                stand-in for desktop's always-visible results column, so the
                chart is visible no matter which input card is being edited.
                Nested inside this column (rather than above the whole grid)
                so its sticky containing block ends exactly where the "Your
                Projection" card begins — it gets pushed off naturally as
                that card scrolls up, instead of just vanishing. */}
            {result && (
              <MobileLiveTicker
                inputs={inputs}
                inheritances={inheritances}
                result={result}
                statePension={statePension}
                statePensionAge={statePensionAge}
                topOffset={embedded ? 0 : 69}
              />
            )}

            {/* Mobile / tablet: stacked cards (unchanged below lg) */}
            <div className="lg:hidden space-y-4">
              {/* Your Details */}
              <div className="bg-white rounded-3xl p-6 space-y-5" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Your Details</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--calc-primary, #09324A)', backgroundColor: 'var(--calc-accent, #FFFB08)' }}>Required</span>
                </div>
                <YourDetailsFields inputs={inputs} handleChange={handleChange} />
              </div>

              {/* Assumptions */}
              <div className="bg-white rounded-3xl p-6 space-y-5" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Assumptions</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--calc-secondary, #1B6F81)', backgroundColor: 'var(--calc-secondary-tint, #E7F1EF)' }}>Defaults provided</span>
                </div>
                <AssumptionsFields inputs={inputs} handleChange={handleChange} />
              </div>

              {/* Retirement Income */}
              <div className="bg-white rounded-3xl p-6 space-y-5" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider font-display" style={{ color: '#8a9599' }}>Retirement Income</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--calc-primary, #09324A)', backgroundColor: 'var(--calc-accent, #FFFB08)' }}>Required</span>
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

            {/* Desktop (lg+): one 865px card, sections switched via tabs */}
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
              <ResultsTabbedCard
                inputs={inputs}
                inheritances={inheritances}
                result={result}
                statePension={statePension}
                statePensionAge={statePensionAge}
                partnerBrand={partnerBrand}
              />
            ) : (
              <div
                className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-3 min-h-64 lg:h-[865px]"
                style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <p className="text-sm font-medium" style={{ color: '#8a9599' }}>Your results will appear here</p>
                <p className="text-xs" style={{ color: '#8a9599' }}>Make sure your retirement age is greater than your current age</p>
              </div>
            )}
          </div>
        </div>

        {/* Assumptions live as a dropdown card spanning both main cards,
            rather than a tab, so they read as reference material. */}
        {result && (
          <div className="mt-6 space-y-4">
            <AssumptionsPanel assumptions={assumptions} />
            <MethodologyLinkCard partnerBrand={partnerBrand} />
            {enablePdfDownload && (
              <PdfSummaryCard
                inputs={inputs}
                inheritances={inheritances}
                statePension={statePension}
                statePensionAge={statePensionAge}
                result={result}
                assumptions={assumptions}
                partnerSlug={partnerSlug}
                partnerBrand={partnerBrand}
              />
            )}
          </div>
        )}

        {!embedded && <SiteFooter />}
      </div>
    </div>
  );
}
