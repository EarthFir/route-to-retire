import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { ACUMEN } from "../../lib/partners/acumen.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Acumen private stats page ───────────────────────────────────────────────────
// Only meaningful with the right ?key= — see PartnerStatsPage.jsx.

export default function AcumenStats() {
  usePageTitle(`${ACUMEN.firmName} - Stats`);
  return <PartnerStatsPage config={ACUMEN} />;
}
