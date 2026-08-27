import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { CHURCHILL_WM } from "../../lib/partners/churchillWm.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Churchill Wealth Management prototype page ────────────────────────────────
// A branded prototype built to pitch Churchill Wealth Management, not yet a
// commissioned build. Deliberately unlisted — reachable only by direct link.

export default function ChurchillWm() {
  usePageTitle(
    `${CHURCHILL_WM.firmName} - Retirement Readiness Check`,
    `A retirement calculator prototype built for ${CHURCHILL_WM.firmName}, powered by Route to Retire.`,
  );

  return <PartnerCalculatorPage config={CHURCHILL_WM} />;
}
