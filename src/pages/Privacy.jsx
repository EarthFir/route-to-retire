import ContentPage, { Section } from "./ContentPage.jsx";

// ─── Privacy Page ─────────────────────────────────────────────────────────────
// Accurate to what the app actually does today: calculator inputs stay in the
// browser and are not stored; the optional feedback form is the only thing that
// sends any data anywhere (via Formspree).

export default function Privacy() {
  return (
    <ContentPage
      title="Privacy"
      intro="A short summary of what data this calculator does and doesn't collect."
    >
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

      <Section title="The feedback form">
        <p>
          If you choose to use the optional feedback form, the message you write and the
          email address you enter (if any) are sent to us through our form provider,
          Formspree, so we can read and respond to your feedback. You don't have to provide
          an email address, and you only send anything if you submit the form.
        </p>
      </Section>

      <Section title="No other tracking of your figures">
        <p>
          Beyond the feedback form, the calculator does not store your submissions. If this
          changes in future — for example if we add accounts or saved scenarios — this page
          will be updated to explain exactly what is collected and why.
        </p>
      </Section>
    </ContentPage>
  );
}
