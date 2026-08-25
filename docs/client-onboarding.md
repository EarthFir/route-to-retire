# Client onboarding

What we need from a firm to build them a branded calculator, and how that gets turned into a live page. Two things live in this one document on purpose: the manual process we actually follow today, and the field list a future self-serve intake form should collect — they're the same information, just gathered by a developer today instead of a form.

## Information required per partner

| Field | Format | Required? | Notes |
|---|---|---|---|
| Firm name | Text | Yes | Used as the display name (`firmName`) and page `<title>`. |
| Logo text fallback | Text | Yes | Shown if no logo file is supplied (`logoText`). |
| Logo file | SVG preferred, PNG fallback, transparent background | Optional | Falls back to logo text if omitted. Recommend a minimum usable width around 160px. |
| Tagline | One sentence | Yes | Used as the page headline (`tagline`), e.g. "Personal advice, built around your circumstances." |
| Brand colours | Hex codes: primary, secondary, accent | Yes | See "Brand colours" below — needs a contrast check, not just the raw hex values. |
| Contact email | Email address | Yes | Where lead notifications and account correspondence go. |
| Default/example scenario | Age, retirement age, current savings, monthly saving, desired income | Optional | Preloads the calculator so the page isn't blank on arrival. Sensible defaults exist if skipped. |
| Consent statement | Text, or use our default template | Optional | The sentence shown next to the lead form's consent checkbox. |
| Lead routing | One of: demo/mock, external endpoint URL, (future) hosted by us | Yes | See "Lead routing" below. |
| Desired subdomain/domain | e.g. `retire.theirfirm.co.uk` | Only if they want a custom domain | See `docs/roadmap.md` — requires hostname routing to be built first. |
| White-label or co-branded | Yes/no | Yes | White-label hides every "Route to Retire" mention and the calculator methodology/disclaimer/privacy pages become the unbranded partner versions. Co-branded keeps a "Calculator by Route to Retire" credit. |
| Real or demo/fictional | Yes/no | Yes | Fictional firms (used for our own sales demos) get placeholder illustrative stats and different footer copy than a real, named prospect or customer. |

### Brand colours

Three hex values minimum: `primary`, `secondary`, `accent`. In practice one more field is sometimes needed: a text-colour override for whichever element sits directly on the accent colour, if the accent is too light to read against the primary (this came up for real with Simpson FS, whose light blue accent needed a manual `tabActiveText: "#FFFFFF"` override to stay legible). An automated intake form should run a contrast check on submission and either flag this itself or ask for the override up front rather than us discovering it by eye after building the page.

### Lead routing

Three modes exist in the code today (`src/lib/partners/leadCapture.js`):

- **Mock** — nothing is sent anywhere; the form just simulates success. Used for fictional demo firms only.
- **External endpoint** — the browser POSTs the lead straight to a URL the partner supplies (their own Formspree, CRM webhook, Zapier/Make). Route to Retire never sees or stores the lead.
- **Hosted by us** — not built yet. Would mean we receive, store, and forward leads, and can report on them. Needed before a firm can be told "we'll show you your enquiries" rather than "point us at your own inbox."

## Current process (manual, today)

1. Collect the fields above from the client directly (call, email, or a shared doc).
2. Add a new config file under `src/lib/partners/` (copy `simpsonfs.js` as a template — real prospect — or `harbourVale.js` for a fictional demo).
3. Add the logo file to `src/assets/partners/` and import it in the config.
4. Register the new routes in `src/App.jsx` (calculator page + stats page).
5. Set a `STATS_KEY_<PARTNER>` environment variable in Vercel for the private stats dashboard.
6. If they're supplying a lead endpoint, set `VITE_<PARTNER>_LEAD_ENDPOINT` in Vercel.
7. Deploy, review on the live URL, share the preview link with the client for sign-off.
8. If they want their own domain: client adds a CNAME record, we add + verify the domain in the Vercel project (see `docs/roadmap.md` — hostname routing needs to exist first for this step to actually work).

## Future process (once automated)

Replaces steps 2–6 above with a form submission:

1. Client fills out the intake form (the fields table above) and uploads their logo.
2. Submission is validated (contrast check on colours, file type/size on the logo) and queued for review.
3. We approve it (spam/sanity check) — or, later, this could be auto-approved for verified/paying accounts.
4. A config record is generated automatically (no code change, no redeploy) and a preview link is issued.
5. Client confirms, adds their DNS CNAME if using a custom domain, and the page goes live once verified — all without a developer in the loop.

This is the target state `docs/roadmap.md`'s "Self-serve onboarding & automation" section is building toward; this document is the spec for what that form needs to ask.
