import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { HOWARD_WRIGHT } from "../../lib/partners/howardWright.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function HowardWrightStats() {
  usePageTitle(`${HOWARD_WRIGHT.firmName} - Stats`);
  return <PartnerStatsPage config={HOWARD_WRIGHT} />;
}
