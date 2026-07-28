import ContentPage, { Section } from "./ContentPage.jsx";
import { Link } from "../lib/Link.jsx";

// ─── Disclaimer Page ──────────────────────────────────────────────────────────

export default function Disclaimer() {
  return (
    <ContentPage
      title="Disclaimer"
      intro="Please read this alongside the results the calculator produces."
    >
      <Section title="Educational tool only">
        <p>
          Route to Retire is an educational calculator. It does not provide regulated
          financial advice, tax advice or a personal recommendation, and no provider or
          product recommendation is being made.
        </p>
      </Section>

      <Section title="Results are not guaranteed">
        <p>
          All figures are illustrative estimates based on simplified assumptions and the
          information you enter. They are projections, not promises, and should not be
          relied on as a forecast of your actual retirement outcome.
        </p>
      </Section>

      <Section title="Returns and inflation can vary">
        <p>
          Investment returns are not guaranteed and can rise or fall, including falling
          below zero. Inflation can also vary and may be higher or lower than the rate
          assumed. Either can change your results considerably.
        </p>
      </Section>

      <Section title="Tax and pension rules">
        <p>
          Tax is not modelled — all figures are shown gross of income tax, dividend tax and
          pension tax relief. Pension, tax and State Pension rules can and do change over
          time, which may affect what you can save, access or receive.
        </p>
      </Section>

      <Section title="Consider regulated advice">
        <p>
          You should consider speaking to a regulated financial adviser before making any
          important pension, investment or retirement decisions. A qualified adviser can
          take account of your full personal circumstances, which this calculator cannot.
        </p>
      </Section>

      <p className="text-xs pt-2" style={{ color: '#A0A4AB' }}>
        See also the <Link to="/methodology" style={{ color: '#B8860B' }}>methodology</Link> for
        how the estimates are produced.
      </p>
    </ContentPage>
  );
}
