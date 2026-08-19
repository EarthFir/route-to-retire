import { BUSINESS_INFO } from "../../lib/businessInfo.js";

// ─── Book-a-demo CTA ───────────────────────────────────────────────────────────
// Falls back to `fallbackHref`/`fallbackLabel` until a real scheduling link
// (e.g. Calendly) is set as demoBookingUrl in businessInfo.js, so the button
// is never dead.
export default function BookDemoButton({ className, style, fallbackHref = "#enquiry-form", fallbackLabel = "Get in touch" }) {
  const { demoBookingUrl } = BUSINESS_INFO;
  if (demoBookingUrl) {
    return (
      <a href={demoBookingUrl} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        Book a 20-minute demo
      </a>
    );
  }
  return (
    <a href={fallbackHref} className={className} style={style}>
      {fallbackLabel}
    </a>
  );
}
