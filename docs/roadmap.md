# Build to-do list

Living list of what needs building, grouped by why it's needed. Not sequenced by default — see "Suggested order" at the bottom for one opinion on that.

## Custom domains (partner-owned subdomains, e.g. `retire.simpsonfs.co.uk`)

- [ ] **Hostname-based routing.** `App.jsx` only routes on path today (`/partners/simpsonfs`). A custom subdomain needs its `/` to resolve to that partner's branded page directly — either a Vercel rewrite mapping the hostname to the internal path, or a hostname check added to the router.
- [ ] **Per-partner domain setup in Vercel.** Manual today (Vercel dashboard → add domain → client adds CNAME → wait for verification/SSL). Fine at 1–2 partners; needs the Vercel API if onboarding becomes self-serve (see below).
- [ ] **Confirm Vercel plan covers commercial/paid use.** Hobby tier ToS restricts commercial use; once a firm is paying, the project should be on a Pro plan (also raises custom-domain limits).

## Self-serve onboarding & automation

The eventual target: a client lands on a page, fills out a form (firm details, brand colours, logo upload), and that alone is enough for us to generate their calculator — no developer touching code per partner. See `docs/client-onboarding.md` for the full field spec this would collect.

- [ ] **Intake form** — public page collecting: firm name, tagline, contact email, brand colours (hex), logo file, optional default scenario numbers, lead-routing preference, desired subdomain.
- [ ] **Logo/file upload + storage.** Logos are currently checked into the repo as static assets (`src/assets/partners/*.svg`) and wired in by hand. Needs real object storage (Vercel Blob or S3-compatible) plus file-type/size validation.
- [ ] **Config generation from submitted data.** Partner configs are hand-written JS files today (`src/lib/partners/harbourVale.js`, `simpsonfs.js`). Needs to move to data-driven config (DB/KV row per partner, read at request time) so a new signup doesn't require a code change + redeploy.
- [ ] **Colour/contrast validation on submission.** Warn or block if a submitted accent-on-background combination fails basic contrast (the Simpson FS config already needed a manual override — `tabActiveText` — because their light-blue accent didn't read against navy; this should be caught automatically, not by eyeballing it).
- [ ] **Review/approval step before going live.** Basic spam/abuse gate and a sanity check on submitted branding before a page is provisioned.
- [ ] **Provisioning pipeline.** Approved intake → config created → preview link generated → DNS instructions sent to client → domain verified → page goes live, ideally without a manual deploy at any step.
- [ ] **Partner self-serve dashboard.** Today `/partners/:slug/stats` is read-only and key-in-URL. Eventually partners should be able to log in and update their own logo/colours/domain/lead-routing without asking us.

## Platform gaps (apply regardless of onboarding automation)

Carried over from the status review — these block real revenue either way:

- [ ] **Payments.** No Stripe (or equivalent) anywhere in the codebase. Matters more once onboarding is self-serve — "your calculator is live" needs to be gated behind a successful subscription, not just a submitted form.
- [ ] **Internal lead storage / light CRM.** Partner leads currently bypass Route to Retire entirely (mock, or straight to the partner's own endpoint) — no record exists to show demand or debug a partner's complaint that "leads aren't coming through."
- [ ] **Site-wide analytics.** Nothing tracks the consumer funnel (`/`, `/check`, `/pro`) at all — see the status brief for detail.
- [ ] **Accounts system.** Blocks every Pro feature (saved scenarios, revisit later, couples planning).
- [ ] **`businessInfo.js` fields.** Trading name, legal status, address, contact email, demo booking link are all blank pending entity registration — low effort once that's sorted, but currently makes Terms/Privacy identity sections and the "Book a demo" CTA silently incomplete.

## Suggested order

1. Hostname routing + confirm Vercel plan — needed before *any* partner can use their own domain, cheap to build.
2. Internal lead storage — needed before scaling past 1–2 manually-onboarded partners, otherwise there's no way to prove or debug the funnel.
3. Payments — needed before onboarding can be self-serve at all (can't let people provision a live branded page for free).
4. Intake form + config generation + provisioning pipeline — the actual automation, once the above exist to gate and support it.
5. Partner self-serve dashboard — polish once there's more than a couple of partners to justify it.
