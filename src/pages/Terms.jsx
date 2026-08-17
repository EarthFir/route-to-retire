import ContentPage, { Section } from "./ContentPage.jsx";
import { Link } from "../lib/Link.jsx";
import { BUSINESS_INFO } from "../lib/businessInfo.js";

// ─── Terms of Use ─────────────────────────────────────────────────────────────
// Website usage terms, distinct from the Disclaimer (which covers the
// calculator's results specifically). Standard boilerplate for a pre-revenue
// educational tool — not a substitute for a solicitor-reviewed document.

function identityText() {
  const { tradingName, legalStatus, address, contactEmail } = BUSINESS_INFO;
  if (!tradingName && !legalStatus && !address && !contactEmail) return null;

  const operator = [];
  if (tradingName) operator.push(tradingName);
  if (legalStatus) operator.push(legalStatus);

  return { operator: operator.join(", "), address, contactEmail };
}

export default function Terms() {
  const identity = identityText();

  return (
    <ContentPage
      title="Terms of Use"
      intro="The terms that apply to using this website. See also the Disclaimer for what applies specifically to the calculator's results."
    >
      <Section title="Agreement to these terms">
        <p>
          By using Route to Retire, you agree to these Terms of Use. If you don't agree with them, please
          don't use the site.
        </p>
      </Section>

      <Section title="What Route to Retire is">
        <p>
          Route to Retire is an educational calculator that produces illustrative retirement projections
          based on the information you enter. It does not provide regulated financial advice, tax advice
          or a personal recommendation — see the{" "}
          <Link to="/disclaimer" style={{ color: "#1B6F81" }}>Disclaimer</Link> for full detail on how the
          results should (and shouldn't) be used.
        </p>
      </Section>

      <Section title="Using the site">
        <p>
          The calculator is provided free of charge and doesn't currently require an account. You're
          responsible for the accuracy of the information you enter, and for keeping any device you use to
          access the site secure. The site is intended for general use by adults planning their own
          retirement; it isn't intended for anyone under 18.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Please don't misuse the site — this includes attempting to disrupt it, scraping or reverse
          engineering it beyond normal browser use, or using it in a way that breaches any applicable law.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          The Route to Retire name, branding, design and written content are owned by us and may not be
          copied or reused without permission. You're welcome to link to the site.
        </p>
      </Section>

      <Section title="Third-party links and affiliate disclosure">
        <p>
          The site may link to third-party pension and SIPP providers or other external resources. We
          don't control these third parties and aren't responsible for their content, products or services.
          Some links may earn Route to Retire a commission — this doesn't affect your calculator results
          and these links are never presented as personal recommendations.
        </p>
      </Section>

      <Section title="No warranty and limitation of liability">
        <p>
          The site is provided "as is". While we aim to keep it accurate and available, we don't guarantee
          it will be error-free, uninterrupted, or suitable for any particular purpose. To the fullest
          extent permitted by law, we aren't liable for any loss arising from your use of the site or
          reliance on its projections — see the{" "}
          <Link to="/disclaimer" style={{ color: "#1B6F81" }}>Disclaimer</Link> for more on the limits of
          what the calculator's figures represent.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update the site or these terms from time to time, for example as features change or legal
          requirements evolve. The current version always applies to your use of the site.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These terms are governed by the laws of England and Wales, and any disputes will be subject to
          the exclusive jurisdiction of the courts of England and Wales.
        </p>
      </Section>

      {identity && (
        <Section title="Contact">
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
    </ContentPage>
  );
}
