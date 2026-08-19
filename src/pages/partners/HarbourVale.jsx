import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { HARBOUR_VALE } from "../../lib/partners/harbourVale.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Harbour & Vale demo page ──────────────────────────────────────────────────
// A fictional adviser brand demonstrating the Route to Retire partner
// calculator pilot. Deliberately unlisted — reachable only by direct link,
// not linked from the main site's nav/footer.

export default function HarbourVale() {
  usePageTitle(
    `${HARBOUR_VALE.firmName} - Retirement Readiness Check`,
    `A retirement calculator demo built for ${HARBOUR_VALE.firmName}, powered by Route to Retire.`,
  );

  return <PartnerCalculatorPage config={HARBOUR_VALE} />;
}
