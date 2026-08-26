import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { INNES_REID } from "../../lib/partners/innesReid.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Innes Reid prototype page ─────────────────────────────────────────────────
// A branded prototype built to pitch Innes Reid, not yet a commissioned build.
// Deliberately unlisted — reachable only by direct link.

export default function InnesReid() {
  usePageTitle(
    `${INNES_REID.firmName} - Retirement Readiness Check`,
    `A retirement calculator prototype built for ${INNES_REID.firmName}, powered by Route to Retire.`,
  );

  return <PartnerCalculatorPage config={INNES_REID} />;
}
