// ─── Lead capture adapter ──────────────────────────────────────────────────────
// Route to Retire never stores partner leads today. "mock" simulates a
// submission for the fictional demo; "externalFormEndpoint" posts straight
// from the browser to a partner-owned endpoint (their own Formspree, CRM,
// Zapier/Make webhook, etc.) so Route to Retire never sees the data either.
// A future "routeManaged" mode (received, tagged, forwarded, reported on)
// isn't built yet — not needed until there's a real partner backend.

export async function submitLead(config, payload) {
  if (config.lead.mode === "externalFormEndpoint") {
    const res = await fetch(config.lead.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error("Something went wrong sending your details. Please try again.");
    }
    return;
  }

  // Mock mode: no network call, just a short delay so the submit button's
  // loading state reads naturally.
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.info(`[demo] Lead captured for ${config.firmName} (mock — not sent anywhere):`, payload);
}
