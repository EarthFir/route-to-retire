import PartnerContentPage, { Section } from "./PartnerContentPage.jsx";

// ─── Unbranded privacy page (shared across all white-label partners) ──────────
// Deliberately its own content rather than a re-skin of Privacy.jsx: a
// partner calculator collects different things (an enquiry form routed to
// the firm, plus anonymous visit/click counts for the firm's own reporting)
// and doesn't have the homepage form, feedback form or Pro waitlist that
// Privacy.jsx covers. See PartnerContentPage.jsx for why this shell exists.

export default function PartnerPrivacy() {
  return (
    <PartnerContentPage
      title="Privacy"
      intro="A short summary of what data this calculator does and doesn't collect."
    >
      <Section title="No sensitive pension account data">
        <p>
          This calculator does not ask for, collect or store any sensitive pension or
          bank account data. It does not connect to your pension providers, banks or any
          account.
        </p>
      </Section>

      <Section title="Your calculator inputs">
        <p>
          The numbers you enter into the calculator — your age, savings, income target and
          so on — are processed entirely in your browser to produce the on-screen results.
          They are not sent anywhere or stored on a server, and they're cleared when you
          refresh or close the page.
        </p>
      </Section>

      <Section title="If you submit an enquiry">
        <p>
          If you fill in and submit the enquiry form, your name, email and any other
          details you enter are sent directly to the firm you're enquiring with (or their
          chosen CRM or form provider), so they can get in touch with you. You only send
          this if you actively submit the form.
        </p>
      </Section>

      <Section title="Anonymous usage counts">
        <p>
          To help the firm understand how this page is used, we count things like page
          visits, button clicks and PDF summary downloads. These are simple totals, not
          tied to your name, email or any other personal detail — nothing you enter into
          the calculator or enquiry form is included in them.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Under UK data protection law, you can ask the firm you enquired with what they
          hold about you, ask them to correct or delete it, or complain to the{" "}
          <a href="https://ico.org.uk" style={{ color: "#1B6F81" }}>Information Commissioner's Office (ICO)</a>{" "}
          if you're unhappy with how your data has been handled.
        </p>
      </Section>
    </PartnerContentPage>
  );
}
