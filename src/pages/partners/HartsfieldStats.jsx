import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { HARTSFIELD } from "../../lib/partners/hartsfield.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function HartsfieldStats() {
  usePageTitle(`${HARTSFIELD.firmName} - Stats`);
  return <PartnerStatsPage config={HARTSFIELD} />;
}
