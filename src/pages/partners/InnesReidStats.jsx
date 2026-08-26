import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { INNES_REID } from "../../lib/partners/innesReid.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Innes Reid private stats page ──────────────────────────────────────────────
// Only meaningful with the right ?key= — see PartnerStatsPage.jsx.

export default function InnesReidStats() {
  usePageTitle(`${INNES_REID.firmName} - Stats`);
  return <PartnerStatsPage config={INNES_REID} />;
}
