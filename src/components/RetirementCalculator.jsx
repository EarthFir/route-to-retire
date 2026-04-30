import { useState, useMemo, useEffect } from "react";
import { useForm, ValidationError } from "@formspree/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";

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

function calculateAll({ currentAge, retirementAge, currentSavings, desiredIncome, annualReturn, inheritances, includeStatePension, statePensionIncome, monthlySavingsCurrent, statePensionAge, retirementReturn }) {
  const r = annualReturn / 100;
  const retirementR = retirementReturn / 100;
  const years = retirementAge - currentAge;
  const inflationRate = 0.025;
  const inflatedDesiredIncome = desiredIncome * Math.pow(1 + inflationRate, years);
  const incomeNeeded = includeStatePension ? Math.max(0, inflatedDesiredIncome - statePensionIncome) : inflatedDesiredIncome;

  let targetPot;
  const gapYears = Math.max(0, statePensionAge - retirementAge);
  if (includeStatePension && gapYears > 0) {
    const potNeededAtSpAge = Math.max(0, inflatedDesiredIncome - statePensionIncome) / retirementR;
    const pvOfSpPot = potNeededAtSpAge / Math.pow(1 + retirementR, gapYears);
    const pvOfGapWithdrawals = retirementR > 0
      ? inflatedDesiredIncome * (1 - Math.pow(1 + retirementR, -gapYears)) / retirementR
      : inflatedDesiredIncome * gapYears;
    targetPot = pvOfSpPot + pvOfGapWithdrawals;
  } else {
    targetPot = incomeNeeded / retirementR;
  }
  const futureValueCurrent = currentSavings * Math.pow(1 + r, years);
  const inheritanceResults = inheritances.map(({ amount, age }) =>
    calcInheritanceFV(amount, age > 0 ? age : null, retirementAge, r)
  );
  const totalInheritanceFV = inheritanceResults.reduce((sum, { futureValue }) => sum + futureValue, 0);
  const totalFutureValue = futureValueCurrent + totalInheritanceFV;
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

  let depletionAge = null;
  let runPot = targetPot;
  for (let i = 1; i <= 100 - retirementAge; i++) {
    const ageI = retirementAge + i;
    const wdrl = (includeStatePension && ageI >= statePensionAge)
      ? Math.max(0, inflatedDesiredIncome - statePensionIncome)
      : inflatedDesiredIncome;
    runPot = Math.max(0, runPot * (1 + retirementR) - wdrl);
    if (runPot <= 0) { depletionAge = ageI; break; }
  }

  return { incomeNeeded, targetPot, futureValueCurrent, inheritanceResults, totalInheritanceFV, totalFutureValue, monthlySavings, savingsGap, isCoast, status, coastAge, yearsUntilCoast, depletionAge };
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

const fmtAge     = (v) => `${v} yrs`;
const fmtMoneyMo = (v) => `${formatGBP(v)}/mo`;
const fmtMoneyYr = (v) => `${formatGBP(v)}/yr`;
const fmtPct     = (v) => `${v}%`;

function inflatedValue(amount, years, rate = 0.025) {
  return Math.round(amount * Math.pow(1 + rate, years));
}

function getStatePensionAge(currentAge) {
  const birthYear = 2026 - currentAge;
  return birthYear >= 1978 ? 68 : 67;
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
  const retirementYear = 2026 + yearsToRetirement;
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

function ResultRow({ icon, label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-2xl" style={{ backgroundColor: highlight ? '#FFFAEB' : '#F5F6F8' }}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium" style={{ color: highlight ? '#F4C84A' : '#A0A4AB' }}>{label}</span>
      </div>
      <span className="text-base font-semibold" style={{ color: highlight ? '#2B2B2B' : '#2B2B2B' }}>{value}</span>
    </div>
  );
}

function ResultMessage({ result, retirementAge }) {
  const { isCoast, coastAge, yearsUntilCoast, savingsGap } = result;

  if (isCoast) {
    return (
      <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#ECFDF5', borderColor: '#4CAF50', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#4CAF50' }} />
        <div>
          <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You've already hit your target.</p>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>Your savings are on track to fund your retirement without any further contributions. Any additional saving is purely a bonus.</p>
        </div>
      </div>
    );
  }

  if (coastAge !== null && yearsUntilCoast <= 5) {
    return (
      <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#FFFAEB', borderColor: '#F4C84A', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#F4C84A' }} />
        <div>
          <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You're almost there.</p>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>At your current saving rate, you'll be able to ease back on contributions in just {yearsUntilCoast} year{yearsUntilCoast !== 1 ? "s" : ""}, at age {coastAge}. Keep going.</p>
        </div>
      </div>
    );
  }

  if (coastAge !== null) {
    return (
      <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#F0F4FF', borderColor: '#F4C84A', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#F4C84A' }} />
        <div>
          <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You're on track.</p>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>Continue saving and at age {coastAge} — in {yearsUntilCoast} year{yearsUntilCoast !== 1 ? "s" : ""} — your investments will be large enough to carry you to retirement on their own.</p>
        </div>
      </div>
    );
  }

  if (savingsGap <= 250) {
    return (
      <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#FFFAEB', borderColor: '#F4C84A', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#F4C84A' }} />
        <div>
          <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You're close, but not quite there.</p>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>Increasing your monthly savings by just {formatGBP(savingsGap)} would put you firmly on track to retire comfortably at {retirementAge}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#FEF2F2', borderColor: '#E74C3C', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#E74C3C' }} />
      <div>
        <p className="font-bold text-base" style={{ color: '#2B2B2B' }}>You need to save more to hit your goal.</p>
        <p className="text-sm mt-1" style={{ color: '#666666' }}>You're currently {formatGBP(savingsGap)}/month short of what's needed. Consider increasing contributions, pushing back your retirement age, or adjusting your income target.</p>
      </div>
    </div>
  );
}

function MonthlySavingsBox({ result, retirementAge, monthlySavingsCurrent }) {
  const { isCoast, monthlySavings, savingsGap } = result;

  return (
    <div className="rounded-3xl p-5" style={{ backgroundColor: isCoast ? '#ECFDF5' : '#F4C84A', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: isCoast ? '#4CAF50' : '#F4C84A', borderWidth: '1px' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: isCoast ? '#4CAF50' : '#1F1F1F' }}>
        Monthly savings needed to retire at {retirementAge}
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

function buildChartData({ currentAge, retirementAge, currentSavings, monthlySavingsCurrent, annualReturn, inheritances, desiredIncome, includeStatePension, statePensionIncome, statePensionAge, retirementReturn }) {
  const r = annualReturn / 100;
  const retirementR = retirementReturn / 100;
  const inflationRate = 0.025;
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

  // Drawdown phase
  const drawdownYears = Math.min(20, 90 - retirementAge);
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

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_INPUTS = {
  currentAge: 40,
  retirementAge: 60,
  currentSavings: 100000,
  desiredIncome: 30000,
  annualReturn: 7,
  monthlySavingsCurrent: 500,
  retirementReturn: 3.5,
};

const DEFAULT_INHERITANCES = [
  { amount: 0, age: 0 },
  { amount: 0, age: 0 },
  { amount: 0, age: 0 },
];

export default function RetirementCalculator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [inheritances, setInheritances] = useState(DEFAULT_INHERITANCES);
  const [statePension, setStatePension] = useState({ include: false, income: 11500 });

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
                <MonthlySavingsBox result={result} retirementAge={inputs.retirementAge} monthlySavingsCurrent={inputs.monthlySavingsCurrent} />
                <GrowthChart inputs={inputs} inheritances={inheritances} result={result} statePension={statePension} statePensionAge={statePensionAge} />
                <div className="rounded-3xl p-6 space-y-4" style={{ backgroundColor: '#F5F6F8', borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A0A4AB' }}>Your Numbers</h2>
                  <div className="space-y-2">
                    <ResultRow
                      icon="●"
                      label={statePension.include ? `Target Pot (after ${formatGBP(statePension.income)}/yr state pension)` : "Target Retirement Pot"}
                      value={formatGBP(result.targetPot)}
                      highlight
                    />
                    <ResultRow icon="●" label="Projected Value (no more saving)" value={formatGBP(result.futureValueCurrent)} />
                    {statePension.include && result.incomeNeeded !== inputs.desiredIncome && (
                      <ResultRow icon="●" label="Income needed from your pot" value={`${formatGBP(result.incomeNeeded)}/yr`} />
                    )}
                    {result.depletionAge
                      ? <ResultRow icon="●" label="Pot depletes at age" value={String(result.depletionAge)} />
                      : <ResultRow icon="●" label="Pot lasts beyond" value="age 100" />
                    }
                  </div>
                  <InheritanceResultBox
                    inheritances={inheritances}
                    inheritanceResults={result.inheritanceResults}
                    totalInheritanceFV={result.totalInheritanceFV}
                    retirementAge={inputs.retirementAge}
                  />
                </div>
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

        <p className="text-center text-xs pb-4" style={{ color: '#A0A4AB' }}>
          Based on the 4% safe withdrawal rule. For illustrative purposes only — not financial advice.
        </p>
      </div>
    </div>
  );
}
