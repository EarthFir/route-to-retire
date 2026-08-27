import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { CHURCHILL_WM } from "../../lib/partners/churchillWm.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Churchill Wealth Management private stats page ────────────────────────────
// Only meaningful with the right ?key= — see PartnerStatsPage.jsx.

export default function ChurchillWmStats() {
  usePageTitle(`${CHURCHILL_WM.firmName} - Stats`);
  return <PartnerStatsPage config={CHURCHILL_WM} />;
}
