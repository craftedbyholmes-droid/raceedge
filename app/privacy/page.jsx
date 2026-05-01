export const metadata = { title: 'Privacy Policy | RaceEdge' };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ paddingTop: 16 }}>
      <h1 className="section-title">Privacy Policy</h1>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>Last updated: January 2025 - UK GDPR Compliant</div>
      <div className="card">
        <Section title="1. Data Controller">
          RaceEdge is the data controller for personal data collected through this service. Contact us at: support@raceedge.win
        </Section>
        <Section title="2. Data We Collect">
          We collect: your email address (for account creation and communication), encrypted password (never readable by us), subscription status, and optional email marketing preference. We do not collect or store payment card details - these are handled entirely by Stripe.
        </Section>
        <Section title="3. Legal Basis - UK GDPR">
          We process your data on the following bases: (a) Contract - to provide the RaceEdge service you have signed up for; (b) Legitimate Interests - to maintain site security and improve our service; (c) Consent - for email marketing only where you have explicitly opted in.
        </Section>
        <Section title="4. How We Use Your Data">
          Your data is used to: provide access to the RaceEdge service, send tips and service updates (if you opted in), process subscription payments via Stripe, and communicate important service changes.
        </Section>
        <Section title="5. Data Retention">
          Account data is retained for the duration of your account plus 12 months for legal compliance purposes. Anonymised historical data (results, performance records) may be retained indefinitely.
        </Section>
        <Section title="6. Your Rights">
          Under UK GDPR you have the right to: access your personal data, correct inaccurate data, request erasure of your data, restrict processing, data portability, and object to processing. To exercise any right, email support@raceedge.win.
        </Section>
        <Section title="7. Third-Party Services">
          We use: Supabase (EU-hosted database and authentication), Stripe (payment processing), Vercel (hosting), Anthropic (AI tip generation). Each maintains their own privacy practices. We do not sell your personal data to any third party.
        </Section>
        <Section title="8. Cookies">
          We use essential cookies only for authentication (Supabase session management). We do not use tracking, advertising, or analytics cookies. You can manage cookies through your browser settings.
        </Section>
        <Section title="9. Marketing Communications">
          If you opted in at registration, we may contact you with tips and service updates. You can unsubscribe at any time using the link in any email we send, or by emailing support@raceedge.win.
        </Section>
        <Section title="10. Complaints">
          If you have concerns about how we handle your data, please contact support@raceedge.win. You also have the right to complain to the UK Information Commissioner's Office at ico.org.uk.
        </Section>
      </div>
    </div>
  );
}