// ─── Minimal client-side router ───────────────────────────────────────────────
// A tiny path-based router so we can add content pages (methodology, disclaimer,
// privacy) without pulling in a routing dependency or rebuilding the app. It uses
// the History API and a popstate listener; navigate() pushes a new path and lets
// every mounted useRoute() re-render. The <Link> component lives in Link.jsx.

import { useState, useEffect } from "react";

/** Programmatically move to a new path (same-origin, client-side). */
export function navigate(to) {
  if (to === window.location.pathname) {
    window.scrollTo(0, 0);
    return;
  }
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

/** Current pathname, kept in sync with back/forward and navigate(). */
export function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}
