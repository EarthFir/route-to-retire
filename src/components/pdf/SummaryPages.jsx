import { NAVY, TEAL, FENNEC, BODY, MUTED, Logo } from "../landing/Chrome.jsx";

// ─── PDF summary pages ──────────────────────────────────────────────────────────
// The three A4 "pages" (as .pdf-page divs) that make up a downloaded retirement
// summary: results, assumptions, methodology. Pure presentational pieces, kept
// separate from RetirementCalculator.jsx's "PDF summary" download button (which
// renders this off-screen for html2pdf to capture) purely to stay out of that
// already-large file.

function formatGBP(value) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

const STATUS_COPY = {
  green: { label: "On track", color: TEAL },
  amber: { label: "Close to target", color: "#B8860B" },
  red: { label: "Action needed", color: "#C24C36" },
};

function PageHeader({ eyebrow }) {
  return (
    <div className="flex items-center justify-between pb-4 mb-6" style={{ borderBottom: `1px solid ${FENNEC}` }}>
      <div className="flex items-center gap-2">
        <Logo size={22} />
        <span className="font-serif font-bold text-base" style={{ color: NAVY }}>Route to Retire</span>
      </div>
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>{eyebrow}</span>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${FENNEC}` }}>
      <span className="text-[11px]" style={{ color: MUTED }}>{label}</span>
      <span className="text-[12.5px] font-semibold text-right" style={{ color: NAVY }}>{value}</span>
    </div>
  );
}

function FieldGroup({ title, children }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: TEAL }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="pdf-avoid-break rounded-xl px-3.5 py-2.5" style={{ backgroundColor: "#F3F2EA" }}>
      <div className="text-[10px]" style={{ color: MUTED }}>{label}</div>
      <div className="font-serif font-bold text-base mt-0.5" style={{ color: accent || NAVY }}>{value}</div>
    </div>
  );
}

function ResultsSummaryPage({ data }) {
  const { inputs, inheritances, statePension, statePensionAge, result, generatedAt } = data;
  const status = STATUS_COPY[result.status] || STATUS_COPY.red;
  const activeInheritances = (inheritances || []).filter((i) => i.amount > 0 && i.age > 0);

  return (
    <div className="pdf-page">
      <PageHeader eyebrow="Retirement Summary" />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif font-bold text-2xl" style={{ color: NAVY }}>Your Retirement Summary</h1>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Generated {new Date(generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <span
          className="inline-block text-xs font-semibold rounded-full whitespace-nowrap"
          style={{ color: status.color, border: `1.5px solid ${status.color}`, padding: "2px 14px 12px" }}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-x-6 gap-y-5 mb-6">
        <FieldGroup title="Your details">
          <Field label="Current age" value={`${inputs.currentAge}`} />
          <Field label="Retirement age" value={`${inputs.retirementAge}`} />
          <Field label="Current savings" value={formatGBP(inputs.currentSavings)} />
          <Field label="Saving now" value={`${formatGBP(inputs.monthlySavingsCurrent)}/mo`} />
        </FieldGroup>

        <FieldGroup title="Retirement income">
          <Field label="Target income" value={`${formatGBP(inputs.desiredIncome)}/yr`} />
          <Field label="Return while saving" value={`${inputs.annualReturn}%`} />
          <Field label="Return in retirement" value={`${inputs.retirementReturn}%`} />
          <Field label="State Pension" value={statePension.include ? `${formatGBP(statePension.income)}/yr from ${statePensionAge}` : "Not included"} />
        </FieldGroup>

        <FieldGroup title="Expected inheritances">
          {activeInheritances.length === 0 ? (
            <p className="text-[11px] mt-1" style={{ color: MUTED }}>None entered</p>
          ) : (
            activeInheritances.map((i, idx) => (
              <Field key={idx} label={`Inheritance ${idx + 1}`} value={`${formatGBP(i.amount)} at age ${i.age}`} />
            ))
          )}
        </FieldGroup>
      </div>

      <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: TEAL }}>Your projection</h3>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label={`Target pot at ${inputs.retirementAge}`} value={formatGBP(result.targetPot)} />
        <Stat label={`Projected pot at ${inputs.retirementAge}`} value={formatGBP(result.projectedPotWithSaving)} accent={TEAL} />
        <Stat
          label="Monthly saving needed"
          value={result.isCoast ? "£0/mo" : `${formatGBP(result.monthlySavings)}/mo`}
        />
        <Stat
          label="Pot lasts until"
          value={result.depletionAge == null || result.depletionAge >= result.planningAge ? `Age ${result.planningAge}+` : `Age ${result.depletionAge}`}
        />
      </div>

      <p className="text-[10.5px] leading-relaxed rounded-xl px-4 py-3" style={{ color: NAVY, backgroundColor: "#FFFCE0" }}>
        This is an educational estimate based on the assumptions and inputs above, not financial advice. See the
        Assumptions and Methodology pages that follow for how these figures were calculated.
      </p>
    </div>
  );
}

function AssumptionsPage({ data }) {
  return (
    <div className="pdf-page">
      <PageHeader eyebrow="Assumptions" />
      <h1 className="font-serif font-bold text-2xl mb-1" style={{ color: NAVY }}>Assumptions</h1>
      <p className="text-xs mb-6" style={{ color: MUTED }}>What the figures on your summary are based on.</p>

      <div className="space-y-3">
        {data.assumptions.map(({ label, value, note }) => (
          <div key={label} className="pdf-avoid-break rounded-xl px-4 py-3" style={{ backgroundColor: "#F3F2EA" }}>
            <div className="flex items-start justify-between gap-4">
              <span className="text-[12px] font-semibold" style={{ color: MUTED }}>{label}</span>
              <span className="text-[12px] font-bold text-right" style={{ color: NAVY }}>{value}</span>
            </div>
            {note && <p className="text-[10.5px] mt-1 leading-relaxed" style={{ color: MUTED }}>{note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

const METHODOLOGY_SECTIONS = [
  {
    title: "What the calculator estimates",
    body: "It estimates how much you might need to have saved by your chosen retirement age, and roughly how much you'd need to save each month to get there, so your pot can fund a target income through retirement.",
  },
  {
    title: "How the target retirement pot is calculated",
    body: "The default target is a drawdown figure: the size of pot that could pay your target income each year from your retirement age until a planning age you choose, with the remaining pot still assumed to grow at a cautious rate along the way. A conservative comparison is also shown — the larger pot needed to live off investment growth alone, never touching the capital — for context, not as the main target.",
  },
  {
    title: "How your income need is assumed to change over retirement",
    body: "Spending in retirement often eases as people get older. The calculator models this with a simple taper: your target income stays level until age 72, reduces in a straight line to 80% of its value by age 82, then stays flat. The conservative comparison figure does not apply this taper, so it stays a genuinely cautious upper estimate.",
  },
  {
    title: "How investment growth is estimated",
    body: "Before retirement, your savings are assumed to grow at an average annual return you can adjust, eased down in a straight line over the final 10 years before retirement towards your (lower) retirement return — reflecting how managed pension funds typically shift into lower-risk assets as retirement approaches. Once you retire, the lower return applies for the rest of your plan.",
  },
  {
    title: "How monthly savings are treated",
    body: "Your current monthly saving is added throughout the years until retirement and grown at your pre-retirement return. The calculator also works out the monthly saving that would be needed to reach the target pot, and compares the two.",
  },
  {
    title: "How inflation is handled",
    body: "Your target income is entered in today's money and increased for inflation up to your retirement year, so it keeps its spending power. Pot values are shown in future money — the actual pounds projected at retirement.",
  },
  {
    title: "How the State Pension is treated",
    body: "The State Pension is optional. When switched on, it's assumed to start at your estimated State Pension age and reduce the income your own pot needs to provide from that point on. The amount used is the current full UK State Pension, which can change.",
  },
  {
    title: "How inheritances are treated",
    body: "Inheritances expected before retirement are invested and grown at your pre-retirement return until you retire. Any received after retirement are counted at face value.",
  },
  {
    title: "What is excluded",
    body: "Tax is not modelled — all figures are gross. Income tax, dividend tax and pension tax relief are not included. The model also doesn't account for changing contributions over time, career breaks, specific product charges, or guaranteed annuity rates.",
  },
  {
    title: "Why results should be treated as illustrative only",
    body: "Route to Retire is an educational calculator. It does not provide regulated financial advice, tax advice or a personal recommendation. The results are based on simplified assumptions and user-entered data, and small changes to those inputs can move the figures significantly.",
  },
];

function MethodologyPage() {
  return (
    <div className="pdf-page">
      <PageHeader eyebrow="Methodology" />
      <h1 className="font-serif font-bold text-2xl mb-1" style={{ color: NAVY }}>How this calculator works</h1>
      <p className="text-xs mb-6" style={{ color: MUTED }}>A plain-English summary of the model behind Route to Retire.</p>

      <div className="space-y-4">
        {METHODOLOGY_SECTIONS.map(({ title, body }) => (
          <div key={title} className="pdf-avoid-break">
            <h3 className="text-[12px] font-bold mb-1" style={{ color: NAVY }}>{title}</h3>
            <p className="text-[11px] leading-relaxed" style={{ color: BODY }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SummaryDocument({ data }) {
  return (
    <div className="pdf-page-wrap">
      <ResultsSummaryPage data={data} />
      <AssumptionsPage data={data} />
      <MethodologyPage />
    </div>
  );
}
