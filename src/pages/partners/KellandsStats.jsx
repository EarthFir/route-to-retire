import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { KELLANDS } from "../../lib/partners/kellands.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function KellandsStats() {
  usePageTitle(`${KELLANDS.firmName} - Stats`);
  return <PartnerStatsPage config={KELLANDS} />;
}
