import Home from "./pages/Home.jsx";
import Check from "./pages/Check.jsx";
import Pro from "./pages/Pro.jsx";
import Resources from "./pages/Resources.jsx";
import Methodology from "./pages/Methodology.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import HarbourVale from "./pages/partners/HarbourVale.jsx";
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
    case "/partners/harbour-vale":
      return <HarbourVale />;
    default:
      return <Home />;
  }
}

export default App;
