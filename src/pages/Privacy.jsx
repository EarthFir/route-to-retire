import ContentPage, { Section } from "./ContentPage.jsx";
import { BUSINESS_INFO } from "../lib/businessInfo.js";

// ─── Privacy Page ─────────────────────────────────────────────────────────────
// Accurate to what the app actually does today: calculator inputs stay in the
// browser and are not stored. Three forms send data elsewhere — the in-app
// feedback form and the homepage "Get in touch" form (both via Formspree),
// and the Pro waitlist form (via Mailchimp) — all covered explicitly below.

function identityText() {
  const { tradingName, legalStatus, address, contactEmail } = BUSINESS_INFO;
  if (!tradingName && !legalStatus && !address && !contactEmail) return null;

  const operator = [];
  if (tradingName) operator.push(tradingName);
  if (legalStatus) operator.push(legalStatus);

  return { operator: operator.join(", "), address, contactEmail };
}

export default function Privacy() {
  const identity = identityText();

  return (
    <ContentPage
      title="Privacy"
      intro="A short summary of what data this calculator does and doesn't collect."
    >
      {identity && (
        <Section title="Who we are">
          <p>
            {identity.operator && <>Route to Retire is operated by {identity.operator}. </>}
            {identity.address && <>Correspondence address: {identity.address}. </>}
            {identity.contactEmail && (
              <>
                Contact:{" "}
                <a href={`mailto:${identity.contactEmail}`} style={{ color: "#1B6F81" }}>
                  {identity.contactEmail}
                </a>
                .
              </>
            )}
          </p>
        </Section>
      )}

      <Section title="No sensitive pension account data">
        <p>
          Route to Retire does not ask for, collect or store any sensitive pension or bank
          account data. It does not connect to your pension providers, banks or any account.
        </p>
      </Section>

      <Section title="Your calculator inputs">
        <p>
          The numbers you enter into the calculator — your age, savings, income target and
          so on — are processed entirely in your browser to produce the on-screen results.
          They are not sent to us or stored on a server, and they're cleared when you
          refresh or close the page.
        </p>
      </Section>

      <Section title="Forms you can choose to fill in">
        <p>
          A few places on the site let you send us something voluntarily. In every case, you
          only send data if you actively submit the form, and an email address is optional
          unless stated otherwise:
        </p>
        <p>
          <strong>In-app feedback form</strong> (on the calculator page) and the{" "}
          <strong>"Get in touch" form</strong> (on the homepage) send your message and, if
          provided, your email address to us through our form provider,{" "}
          <a href="https://formspree.io" style={{ color: "#1B6F81" }}>Formspree</a>, so we can
          read and respond.
        </p>
        <p>
          <strong>The Pro waitlist form</strong> sends your email address (and any optional
          note) to our mailing list provider, Mailchimp, so we can email you when Route to
          Retire Pro is ready. You can unsubscribe at any time using the link in any email we
          send.
        </p>
      </Section>

      <Section title="Site analytics">
        <p>
          We use Vercel Web Analytics to see how many people visit the site and which pages
          they land on. It's cookieless and doesn't collect any personal data — it can't
          identify you or track you across other websites. It only gives us aggregate counts,
          like how many visits a page received.
        </p>
      </Section>

      <Section title="How long we keep it, and your rights">
        <p>
          We keep form submissions only as long as needed to respond to you or, for the Pro
          waitlist, until Pro launches or you unsubscribe — whichever comes first. Under UK
          data protection law, you can ask us what we hold about you, ask us to correct or
          delete it, or complain to the{" "}
          <a href="https://ico.org.uk" style={{ color: "#1B6F81" }}>Information Commissioner's Office (ICO)</a>{" "}
          if you're unhappy with how we've handled your data.
        </p>
      </Section>

      <Section title="No other tracking of your figures">
        <p>
          Beyond the forms above, the calculator does not store your submissions. If this
          changes in future — for example if we add accounts or saved scenarios — this page
          will be updated to explain exactly what is collected and why.
        </p>
      </Section>
    </ContentPage>
  );
}
