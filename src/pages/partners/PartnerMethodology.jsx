import PartnerContentPage, { Section } from "./PartnerContentPage.jsx";

// ─── Unbranded methodology page (shared across all white-label partners) ──────
// Same underlying model as the branded /methodology page, minus every Route
// to Retire mention — the calculator's math doesn't vary by partner, so one
// page covers all of them. See PartnerContentPage.jsx for why this is a
// separate shell rather than reusing ContentPage.jsx.

export default function PartnerMethodology() {
  return (
    <PartnerContentPage
      title="How this calculator works"
      intro="A plain-English summary of the model behind this calculator. The exact figures currently in use are shown in the Assumptions panel on the calculator itself."
    >
      <Section title="What the calculator estimates">
        <p>
          It estimates how much you might need to have saved by your chosen retirement
          age, and roughly how much you'd need to save each month to get there, so your
          pot can fund a target income through retirement.
        </p>
      </Section>

      <Section title="How the target retirement pot is calculated">
        <p>
          The default target is a <strong>drawdown</strong> figure. It's the size of pot
          that could pay your target income each year from your retirement age until a
          planning age you choose (95 by default), with the remaining pot still assumed
          to grow at a cautious rate along the way. In other words, the pot is spent down
          gradually and is designed to be largely used up by your planning age — not
          preserved forever.
        </p>
        <p>
          For reference, the calculator also shows a <strong>conservative comparison</strong>:
          the larger pot you'd need to live off investment growth alone while never
          touching the capital. This is shown for context, not as the main target.
        </p>
      </Section>

      <Section title="How your income need is assumed to change over retirement">
        <p>
          Spending in retirement often eases as people get older and less active. The
          calculator models this with a simple taper: your target income is assumed to
          stay level until age 72, then reduce in a straight line to 80% of its value by
          age 82, and stay flat from there for the rest of your plan. This is applied
          before the State Pension is deducted, and lets your pot fund a slightly smaller
          withdrawal in later years rather than a flat amount for life.
        </p>
        <p>
          The conservative comparison figure (see below) doesn't apply this taper — it
          keeps assuming a flat, full income forever, so it stays a genuinely cautious
          upper estimate.
        </p>
      </Section>

      <Section title="How investment growth is estimated">
        <p>
          Before retirement, your savings are assumed to grow at an average annual return
          that you can adjust. Rather than staying at that rate right up to retirement day,
          it's eased down in a straight line over the final 10 years before you retire
          towards your (lower) retirement return — reflecting how most managed pension
          funds automatically shift into lower-risk, lower-return assets like bonds as
          retirement approaches. Once you retire, that lower return is applied for the
          rest of your plan, to reflect a more cautious, de-risked portfolio. All figures
          are steady averages — real returns vary year to year and are not guaranteed.
        </p>
      </Section>

      <Section title="How monthly savings are treated">
        <p>
          Your current monthly saving is added throughout the years until retirement and
          grown at your pre-retirement return. The calculator also works out the monthly
          saving that would be needed to reach the target pot, and compares the two.
        </p>
      </Section>

      <Section title="How inflation is handled">
        <p>
          Your target income is entered in today's money and increased for inflation up to
          your retirement year, so it keeps its spending power. Pot values are shown in
          future money — the actual pounds projected at retirement.
        </p>
      </Section>

      <Section title="How the State Pension is treated">
        <p>
          The State Pension is optional. When switched on, it's assumed to start at your
          estimated State Pension age and reduce the income your own pot needs to provide
          from that point on. The amount used is the current full UK State Pension, which
          can change.
        </p>
      </Section>

      <Section title="How inheritances are treated">
        <p>
          Inheritances you expect before retirement are invested and grown at your
          pre-retirement return until you retire. Any received after retirement are counted
          at face value.
        </p>
      </Section>

      <Section title="What is excluded">
        <p>
          Tax is not modelled — all figures are gross. Income tax, dividend tax and pension
          tax relief are not included. The model also doesn't account for changing
          contributions over time, career breaks, specific product charges, or guaranteed
          annuity rates.
        </p>
      </Section>

      <Section title="Why results should be treated as illustrative only">
        <p>
          This is an educational calculator. It does not provide regulated financial
          advice, tax advice or a personal recommendation. The results are based on
          simplified assumptions and user-entered data, and small changes to those inputs
          can move the figures significantly.
        </p>
      </Section>
    </PartnerContentPage>
  );
}
