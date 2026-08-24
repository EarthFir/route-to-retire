import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { HARBOUR_VALE } from "../../lib/partners/harbourVale.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Harbour & Vale private stats page ─────────────────────────────────────────
// Only meaningful with the right ?key= — see PartnerStatsPage.jsx.

export default function HarbourValeStats() {
  usePageTitle(`${HARBOUR_VALE.firmName} - Stats`);
  return <PartnerStatsPage config={HARBOUR_VALE} />;
}
