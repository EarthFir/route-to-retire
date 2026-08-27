import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { ACUMEN } from "../../lib/partners/acumen.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Acumen prototype page ──────────────────────────────────────────────────────
// A branded prototype built to pitch Acumen, not yet a commissioned build.
// Deliberately unlisted — reachable only by direct link.

export default function Acumen() {
  usePageTitle(
    `${ACUMEN.firmName} - Retirement Readiness Check`,
    `A retirement calculator prototype built for ${ACUMEN.firmName}, powered by Route to Retire.`,
  );

  return <PartnerCalculatorPage config={ACUMEN} />;
}
