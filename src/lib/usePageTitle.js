import { useEffect } from "react";

// Sets the document title and meta description per route. This is a
// client-only SPA sharing one index.html, so without this every page would
// show the same browser-tab title and link-preview text.
export function usePageTitle(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);
    }
  }, [title, description]);
}
