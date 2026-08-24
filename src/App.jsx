import Home from "./pages/Home.jsx";
import Check from "./pages/Check.jsx";
import Pro from "./pages/Pro.jsx";
import Resources from "./pages/Resources.jsx";
import Methodology from "./pages/Methodology.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import Partners from "./pages/Partners.jsx";
import HarbourVale from "./pages/partners/HarbourVale.jsx";
import HarbourValeStats from "./pages/partners/HarbourValeStats.jsx";
import SimpsonFS from "./pages/partners/SimpsonFS.jsx";
import SimpsonFSStats from "./pages/partners/SimpsonFSStats.jsx";
import PartnerMethodology from "./pages/partners/PartnerMethodology.jsx";
import PartnerDisclaimer from "./pages/partners/PartnerDisclaimer.jsx";
import PartnerPrivacy from "./pages/partners/PartnerPrivacy.jsx";
import { useRoute } from "./lib/router.js";

function App() {
  const path = useRoute();

  switch (path) {
    case "/check":
      return <Check />;
    case "/pro":
      return <Pro />;
    case "/resources":
      return <Resources />;
    case "/methodology":
      return <Methodology />;
    case "/disclaimer":
      return <Disclaimer />;
    case "/privacy":
      return <Privacy />;
    case "/terms":
      return <Terms />;
    case "/partners":
      return <Partners />;
    case "/partners/methodology":
      return <PartnerMethodology />;
    case "/partners/disclaimer":
      return <PartnerDisclaimer />;
    case "/partners/privacy":
      return <PartnerPrivacy />;
    case "/partners/harbour-vale":
      return <HarbourVale />;
    case "/partners/harbour-vale/stats":
      return <HarbourValeStats />;
    case "/partners/simpsonfs":
      return <SimpsonFS />;
    case "/partners/simpsonfs/stats":
      return <SimpsonFSStats />;
    default:
      return <Home />;
  }
}

export default App;
