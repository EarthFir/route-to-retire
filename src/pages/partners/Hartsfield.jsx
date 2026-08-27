import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { HARTSFIELD } from "../../lib/partners/hartsfield.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function Hartsfield() {
  usePageTitle(
    `${HARTSFIELD.firmName} - Retirement Readiness Check`,
    `A retirement calculator prototype built for ${HARTSFIELD.firmName}, powered by Route to Retire.`,
  );
  return <PartnerCalculatorPage config={HARTSFIELD} />;
}
