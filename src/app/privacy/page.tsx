import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — PlanToday',
  description: 'PlanToday\'s Privacy Policy explains what personal data we collect, how we use it, how we protect it, and your rights as a user under India\'s Digital Personal Data Protection Act.',
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = '1 April 2025';
const COMPANY = 'PlanToday Technologies Private Limited';
const EMAIL = 'privacy@plantoday.in';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-20">
      <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="space-y-3 text-gray-700 leading-relaxed text-sm">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      {/* Header */}
      <div className="mb-10">
        <span className="inline-block bg-red-100 text-red-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Privacy</span>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500">
          Effective Date: <strong>{EFFECTIVE_DATE}</strong> &nbsp;|&nbsp; Company: <strong>{COMPANY}</strong>
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          Your privacy matters to us. This policy explains clearly what we collect, why we collect it, and how you stay in control of your data.
        </div>
      </div>

      {/* TOC */}
      <nav className="bg-gray-50 rounded-2xl p-5 mb-10 text-sm">
        <p className="font-bold text-gray-700 mb-3">Table of Contents</p>
        <ol className="list-decimal list-inside space-y-1 text-red-600">
          {[
            ['scope', 'Scope of this Policy'],
            ['data-collected', 'Data We Collect'],
            ['how-we-collect', 'How We Collect Data'],
            ['use', 'How We Use Your Data'],
            ['sharing', 'Data Sharing & Disclosure'],
            ['retention', 'Data Retention'],
            ['security', 'Data Security'],
            ['cookies', 'Cookies & Tracking'],
            ['children', 'Children\'s Privacy'],
            ['rights', 'Your Rights'],
            ['international', 'International Users'],
            ['third-party', 'Third-Party Links'],
            ['dpdpa', 'India DPDPA Compliance'],
            ['changes', 'Changes to this Policy'],
            ['contact', 'Contact & Grievances'],
          ].map(([id, title]) => (
            <li key={id}><a href={`#${id}`} className="hover:underline">{title}</a></li>
          ))}
        </ol>
      </nav>

      {/* Content */}
      <Section id="scope" title="1. Scope of this Policy">
        <p>
          This Privacy Policy applies to all personal data collected by {COMPANY} (&quot;PlanToday&quot;, &quot;we&quot;, &quot;us&quot;) through our website <strong>plantoday.in</strong>, mobile applications, and any related services (collectively, the &quot;Platform&quot;).
        </p>
        <p>
          It applies to all registered users, vendors, and visitors. By using the Platform, you consent to the practices described in this Policy.
        </p>
      </Section>

      <Section id="data-collected" title="2. Data We Collect">
        <p>We collect the following categories of personal data:</p>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-bold text-gray-800 mb-2">A. Account & Identity Data</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Full name, email address, phone number</li>
              <li>Profile photo (optional)</li>
              <li>Role (User or Vendor)</li>
              <li>Login credentials (passwords are stored hashed)</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-bold text-gray-800 mb-2">B. Event Preferences & Planning Data</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Event type (wedding, birthday, corporate, etc.)</li>
              <li>Budget range, guest count, event date</li>
              <li>Preferred city and locality</li>
              <li>Service requirements (catering, photography, decoration, etc.)</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-bold text-gray-800 mb-2">C. Vendor Business Data</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Business name, description, category</li>
              <li>Service packages and pricing</li>
              <li>Contact details (business phone, email)</li>
              <li>City and locality of operation</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-bold text-gray-800 mb-2">D. Usage & Behavioral Data</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Pages visited, vendors viewed, packages saved</li>
              <li>Search queries, filters applied</li>
              <li>Clicks, lead submissions, and interaction events</li>
              <li>Device type, browser, IP address, and approximate location</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-bold text-gray-800 mb-2">E. Communications Data</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Support messages, feedback, and complaint submissions</li>
              <li>Reviews and ratings you submit</li>
              <li>Email and in-app message correspondence with our team</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-bold text-gray-800 mb-2">F. Payment Data</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Transaction history for token purchases and subscriptions</li>
              <li>Payment method type (card, UPI, netbanking) — we do <strong>not</strong> store full card numbers</li>
              <li>All payment processing is handled by PCI-DSS compliant third-party gateways</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id="how-we-collect" title="3. How We Collect Data">
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Directly from you</strong> — registration forms, onboarding steps, lead submissions, reviews, and support requests.</li>
          <li><strong>Automatically</strong> — through cookies, analytics tools, and server logs when you browse the Platform.</li>
          <li><strong>From third parties</strong> — if you sign in via Google OAuth, we receive your name and email from Google.</li>
          <li><strong>From your activity</strong> — we track behavioral signals (vendor views, saves, searches) to power personalized recommendations.</li>
        </ul>
      </Section>

      <Section id="use" title="4. How We Use Your Data">
        <p>We use your data for the following purposes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>To create and manage your account.</li>
          <li>To provide personalized vendor and package recommendations.</li>
          <li>To match your event requirements with the best Vendors.</li>
          <li>To enable Vendors to access your lead information when you submit a request.</li>
          <li>To communicate with you about your account, orders, and our services.</li>
          <li>To send you relevant notifications (can be disabled in settings).</li>
          <li>To improve Platform features through usage analytics.</li>
          <li>To detect, prevent, and investigate fraud and abuse.</li>
          <li>To comply with applicable legal obligations.</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your personal data to third parties for advertising or marketing purposes.
        </p>
      </Section>

      <Section id="sharing" title="5. Data Sharing & Disclosure">
        <p>We share your data only in the following circumstances:</p>

        <div className="space-y-3">
          <div className="border-l-4 border-red-400 pl-4">
            <p className="font-bold text-gray-800">With Vendors (Lead Data)</p>
            <p>When you submit a lead, your contact information and event requirements are shared with relevant Vendors who purchase access to that lead.</p>
          </div>
          <div className="border-l-4 border-blue-400 pl-4">
            <p className="font-bold text-gray-800">With Service Providers</p>
            <p>We share data with trusted third parties who help us operate the Platform (hosting, payment processing, SMS/email services, analytics). They are bound by confidentiality obligations.</p>
          </div>
          <div className="border-l-4 border-yellow-400 pl-4">
            <p className="font-bold text-gray-800">For Legal Compliance</p>
            <p>We may disclose data if required by law, court order, or government authority, or if necessary to protect the rights, property, or safety of PlanToday, users, or the public.</p>
          </div>
          <div className="border-l-4 border-gray-400 pl-4">
            <p className="font-bold text-gray-800">Business Transfers</p>
            <p>In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of that transaction, subject to equivalent privacy protections.</p>
          </div>
        </div>
      </Section>

      <Section id="retention" title="6. Data Retention">
        <p>
          We retain your personal data for as long as your account is active, or as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Account data: retained until you delete your account plus 90 days.</li>
          <li>Lead data: retained for up to 3 years for business and legal purposes.</li>
          <li>Activity/behavioral data: retained for up to 12 months.</li>
          <li>Financial records: retained for 7 years as required under Indian law.</li>
        </ul>
        <p>You may request deletion of your personal data subject to legal retention requirements.</p>
      </Section>

      <Section id="security" title="7. Data Security">
        <p>We implement appropriate technical and organizational measures to protect your data, including:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>HTTPS/TLS encryption for all data in transit.</li>
          <li>Bcrypt hashing for passwords — never stored in plain text.</li>
          <li>JWT-based authentication with expiring tokens.</li>
          <li>Access controls limiting data access to authorized personnel only.</li>
          <li>Regular security reviews and vulnerability assessments.</li>
        </ul>
        <p>
          No method of electronic storage or transmission is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. Please report security concerns to <a href={`mailto:${EMAIL}`} className="text-red-600 hover:underline">{EMAIL}</a>.
        </p>
      </Section>

      <Section id="cookies" title="8. Cookies & Tracking">
        <p>We use cookies and similar tracking technologies to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Keep you logged in across sessions.</li>
          <li>Remember your preferences (city, event type).</li>
          <li>Analyze Platform usage through analytics (e.g., Google Analytics).</li>
          <li>Enable personalized recommendations.</li>
        </ul>
        <p>
          You can manage cookie preferences through your browser settings. Disabling cookies may affect certain Platform features.
        </p>
      </Section>

      <Section id="children" title="9. Children's Privacy">
        <p>
          PlanToday is not intended for children under the age of 18. We do not knowingly collect personal data from minors. If we become aware that we have collected data from a user under 18, we will take steps to delete it promptly.
        </p>
        <p>
          If you believe a minor has registered on our Platform, please contact us at <a href={`mailto:${EMAIL}`} className="text-red-600 hover:underline">{EMAIL}</a>.
        </p>
      </Section>

      <Section id="rights" title="10. Your Rights">
        <p>As a user, you have the following rights regarding your personal data:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Correction:</strong> Update inaccurate or incomplete data through your account settings or by contacting us.</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated data (subject to legal obligations).</li>
          <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
          <li><strong>Opt-out of marketing:</strong> Unsubscribe from promotional emails using the link in any email, or update your notification settings.</li>
          <li><strong>Grievance redressal:</strong> Lodge a complaint with our Grievance Officer (see below).</li>
        </ul>
        <p>
          To exercise any of these rights, email <a href={`mailto:${EMAIL}`} className="text-red-600 hover:underline">{EMAIL}</a> with the subject line &quot;Data Rights Request — [Your Name]&quot;. We will respond within 30 days.
        </p>
      </Section>

      <Section id="international" title="11. International Users">
        <p>
          PlanToday is operated from India and primarily serves Indian users. If you are accessing the Platform from outside India, please note that your data will be processed in India, where data protection laws may differ from your jurisdiction.
        </p>
      </Section>

      <Section id="third-party" title="12. Third-Party Links">
        <p>
          Our Platform may contain links to third-party websites or services. This Privacy Policy does not apply to those third-party sites. We are not responsible for their privacy practices and encourage you to review their policies before providing any personal data.
        </p>
      </Section>

      <Section id="dpdpa" title="13. India DPDPA Compliance">
        <p>
          PlanToday is committed to complying with India&apos;s <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>. Under this framework:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>We process personal data only for lawful purposes with appropriate consent or legitimate interest.</li>
          <li>We maintain records of data processing activities.</li>
          <li>We have appointed a Grievance Officer to handle data-related complaints (see below).</li>
          <li>In the event of a data breach, we will notify affected users and relevant authorities as required.</li>
          <li>We honor requests for data correction and erasure within mandated timelines.</li>
        </ul>
      </Section>

      <Section id="changes" title="14. Changes to this Policy">
        <p>
          We may update this Privacy Policy periodically. The &quot;Effective Date&quot; at the top of this page will be updated, and we will notify registered users of material changes via email or in-app notification.
        </p>
        <p>
          Continued use of the Platform after changes are published constitutes your acceptance of the updated Policy.
        </p>
      </Section>

      <Section id="contact" title="15. Contact & Grievances">
        <p>
          For privacy-related questions, data requests, or to lodge a complaint, contact our Grievance Officer:
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-2 space-y-1">
          <p><strong>Grievance Officer — PlanToday Privacy</strong></p>
          <p><strong>{COMPANY}</strong></p>
          <p>Email: <a href={`mailto:${EMAIL}`} className="text-red-600 hover:underline">{EMAIL}</a></p>
          <p>Response Time: Within 30 days of receipt</p>
        </div>
        <p className="mt-3">
          If you are not satisfied with our response, you may escalate to the appropriate data protection authority under the DPDPA.
        </p>
      </Section>
    </div>
  );
}
