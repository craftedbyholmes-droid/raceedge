export const metadata = { title: 'Terms and Conditions | RaceEdge' };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div style={{ paddingTop: 16 }}>
      <h1 className="section-title">Terms and Conditions</h1>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>Last updated: January 2025</div>
      <div className="card">
        <Section title="1. Acceptance of Terms">
          By creating an account on RaceEdge, you agree to these Terms and Conditions in full. If you disagree with any part, do not use this service.
        </Section>
        <Section title="2. Age Restriction">
          RaceEdge is strictly for users aged 18 or over. By registering, you confirm you are at least 18 years of age. We reserve the right to verify age and close accounts where this requirement is not met.
        </Section>
        <Section title="3. Nature of Tips">
          All tips and selections on RaceEdge are provided for entertainment and informational purposes only. They do not constitute financial or betting advice. Past performance does not guarantee future results. You are solely responsible for any betting decisions you make.
        </Section>
        <Section title="4. Responsible Gambling">
          RaceEdge strongly supports responsible gambling. We encourage all users to set deposit limits with their bookmakers, use the GamStop self-exclusion service if needed, and contact BeGambleAware.org (0808 802 0133) if gambling is causing harm. RaceEdge is not liable for any losses incurred through gambling.
        </Section>
        <Section title="5. Subscriptions and Payments">
          Subscription fees are charged monthly via Stripe. You may cancel at any time through your account. No refunds are provided for partial months. Prices are in GBP and include VAT where applicable.
        </Section>
        <Section title="6. User Accounts">
          You are responsible for maintaining the security of your account credentials. Do not share your login details. We reserve the right to suspend accounts found to be in breach of these terms.
        </Section>
        <Section title="7. Intellectual Property">
          All content, scoring algorithms, tip text, and data on RaceEdge are proprietary. You may not reproduce, distribute, or commercially exploit any content without written permission from RaceEdge.
        </Section>
        <Section title="8. Limitation of Liability">
          RaceEdge is not liable for any financial losses arising from following tips or using our service. Our total liability to you is limited to subscription fees paid in the preceding 30 days.
        </Section>
        <Section title="9. Governing Law">
          These terms are governed by the laws of England and Wales. Any disputes are subject to the exclusive jurisdiction of the courts of England and Wales.
        </Section>
        <Section title="10. Changes to Terms">
          We may update these terms at any time. Continued use of the service after changes are posted constitutes acceptance of the revised terms. Registered users will be notified of material changes by email.
        </Section>
      </div>
    </div>
  );
}