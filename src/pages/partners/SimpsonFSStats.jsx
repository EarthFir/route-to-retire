import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { SIMPSON_FS } from "../../lib/partners/simpsonfs.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Simpson Financial Services private stats page ─────────────────────────────
// Only meaningful with the right ?key= — see PartnerStatsPage.jsx.

export default function SimpsonFSStats() {
  usePageTitle(`${SIMPSON_FS.firmName} - Stats`);
  return <PartnerStatsPage config={SIMPSON_FS} />;
}
