import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { SIMPSON_FS } from "../../lib/partners/simpsonfs.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Simpson Financial Services prospect page ──────────────────────────────────
// A branded prototype built to pitch Simpson FS, a real independent financial
// adviser — not a paying customer yet. Deliberately unlisted — reachable only
// by direct link, not linked from the main site's nav/footer.

export default function SimpsonFS() {
  usePageTitle(
    `${SIMPSON_FS.firmName} - Retirement Readiness Check`,
    `A retirement calculator for ${SIMPSON_FS.firmName}.`,
  );

  return <PartnerCalculatorPage config={SIMPSON_FS} />;
}
