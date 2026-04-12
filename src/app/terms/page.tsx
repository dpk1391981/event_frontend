import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — PlanToday',
  description: 'Read the Terms and Conditions for using PlanToday — India\'s AI-powered event vendor marketplace. Covers user obligations, vendor policies, payments, and liability.',
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = '1 April 2025';
const COMPANY = 'PlanToday Technologies Private Limited';
const EMAIL = 'legal@plantoday.in';
const ADDRESS = 'India';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-20">
      <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="space-y-3 text-gray-700 leading-relaxed text-sm">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      {/* Header */}
      <div className="mb-10">
        <span className="inline-block bg-red-100 text-red-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Legal</span>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-500">
          Effective Date: <strong>{EFFECTIVE_DATE}</strong> &nbsp;|&nbsp; Company: <strong>{COMPANY}</strong>
        </p>
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          <strong>Please read these Terms carefully.</strong> By accessing or using PlanToday, you agree to be bound by these Terms. If you do not agree, do not use our platform.
        </div>
      </div>

      {/* TOC */}
      <nav className="bg-gray-50 rounded-2xl p-5 mb-10 text-sm">
        <p className="font-bold text-gray-700 mb-3">Table of Contents</p>
        <ol className="list-decimal list-inside space-y-1 text-red-600">
          {[
            ['acceptance', 'Acceptance of Terms'],
            ['definitions', 'Definitions'],
            ['eligibility', 'Eligibility'],
            ['account', 'Account Registration & Security'],
            ['services', 'Platform Services'],
            ['vendors', 'Vendor Obligations'],
            ['users', 'User Obligations'],
            ['payments', 'Payments & Tokens'],
            ['ip', 'Intellectual Property'],
            ['privacy', 'Privacy'],
            ['disclaimer', 'Disclaimer of Warranties'],
            ['liability', 'Limitation of Liability'],
            ['termination', 'Termination'],
            ['disputes', 'Governing Law & Disputes'],
            ['changes', 'Changes to Terms'],
            ['contact', 'Contact Us'],
          ].map(([id, title]) => (
            <li key={id}><a href={`#${id}`} className="hover:underline">{title}</a></li>
          ))}
        </ol>
      </nav>

      {/* Sections */}
      <Section id="acceptance" title="1. Acceptance of Terms">
        <p>
          These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the PlanToday platform, including our website at <strong>plantoday.in</strong>, mobile applications, and related services (collectively, the &quot;Platform&quot;).
        </p>
        <p>
          By registering an account, browsing the Platform, submitting a lead, or listing your business, you confirm that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. These Terms form a legally binding agreement between you and {COMPANY} (&quot;PlanToday&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
        </p>
      </Section>

      <Section id="definitions" title="2. Definitions">
        <ul className="list-disc list-inside space-y-2">
          <li><strong>&quot;User&quot;</strong> — any individual who accesses the Platform to find or plan events.</li>
          <li><strong>&quot;Vendor&quot;</strong> — any business or individual that registers to offer event-related services.</li>
          <li><strong>&quot;Lead&quot;</strong> — a service inquiry submitted by a User for event vendor services.</li>
          <li><strong>&quot;Package&quot;</strong> — a defined service offering listed by a Vendor.</li>
          <li><strong>&quot;Tokens&quot;</strong> — PlanToday&apos;s in-platform credits used by Vendors to access Leads.</li>
          <li><strong>&quot;Content&quot;</strong> — text, images, reviews, listings, and all other material on the Platform.</li>
        </ul>
      </Section>

      <Section id="eligibility" title="3. Eligibility">
        <p>You must be at least 18 years old to use PlanToday. By using the Platform, you represent that:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>You are legally capable of entering into a binding contract.</li>
          <li>You are not barred from using the Platform under any applicable law.</li>
          <li>All information you provide is accurate, current, and complete.</li>
        </ul>
      </Section>

      <Section id="account" title="4. Account Registration & Security">
        <p>
          To access certain features, you must register an account. You agree to provide accurate information and keep it updated. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.
        </p>
        <p>
          You must immediately notify us at <a href={`mailto:${EMAIL}`} className="text-red-600 hover:underline">{EMAIL}</a> if you suspect unauthorized access to your account. PlanToday is not liable for losses resulting from unauthorized use of your account.
        </p>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or compromise Platform integrity.
        </p>
      </Section>

      <Section id="services" title="5. Platform Services">
        <p>PlanToday provides a marketplace that facilitates connections between Users and Vendors. We are a <strong>technology platform</strong>, not a vendor, contractor, or party to any service agreement between Users and Vendors.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>We do not guarantee the quality, safety, or legal compliance of services provided by Vendors.</li>
          <li>All transactions and agreements for event services are directly between Users and Vendors.</li>
          <li>We may use AI and algorithmic tools to generate recommendations, which are advisory only.</li>
          <li>We reserve the right to modify, suspend, or discontinue any feature at any time.</li>
        </ul>
      </Section>

      <Section id="vendors" title="6. Vendor Obligations">
        <p>Vendors who list on PlanToday agree to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Provide accurate business information, service descriptions, and pricing.</li>
          <li>Maintain all required registrations, licenses, and legal compliance for their business.</li>
          <li>Respond to Leads promptly and professionally.</li>
          <li>Not engage in misleading, deceptive, or fraudulent practices.</li>
          <li>Not contact Users obtained through PlanToday for purposes outside the scope of their service inquiry.</li>
          <li>Comply with all applicable tax obligations, including GST.</li>
          <li>Not create fake reviews, manipulate ratings, or engage in anti-competitive behavior.</li>
        </ul>
        <p>
          Vendors accept that PlanToday may share their profile data, reviews, and performance metrics with potential Users. Vendors found to be fraudulent or repeatedly under-performing may be removed without notice.
        </p>
      </Section>

      <Section id="users" title="7. User Obligations">
        <p>Users agree to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Submit accurate event requirements and contact information when requesting leads.</li>
          <li>Engage with Vendors in good faith and not misuse the lead system for spam or non-genuine inquiries.</li>
          <li>Not post false, defamatory, or malicious reviews.</li>
          <li>Not attempt to circumvent the Platform by taking service relationships offline to avoid Platform policies.</li>
          <li>Not scrape, harvest, or otherwise collect vendor or user data from the Platform.</li>
        </ul>
      </Section>

      <Section id="payments" title="8. Payments & Tokens">
        <p>
          PlanToday offers a Token-based system for Vendors to access Leads. Tokens are purchased through the Platform and are non-refundable once consumed.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Token prices are subject to change with prior notice.</li>
          <li>Subscription plans may include bundled tokens or lead credits; see the pricing page for current offers.</li>
          <li>All payments are processed through secure third-party payment gateways.</li>
          <li>In case of payment failure or dispute, contact us within 7 days at <a href={`mailto:${EMAIL}`} className="text-red-600 hover:underline">{EMAIL}</a>.</li>
          <li>PlanToday does not process payments between Users and Vendors — those are conducted directly.</li>
          <li>All prices are inclusive of applicable GST unless stated otherwise.</li>
        </ul>
      </Section>

      <Section id="ip" title="9. Intellectual Property">
        <p>
          All Platform content — including the PlanToday brand, logo, software, algorithms, UI design, and original content — is the exclusive property of {COMPANY} and is protected under Indian and international intellectual property laws.
        </p>
        <p>
          By submitting reviews, photos, or other content to the Platform, you grant PlanToday a non-exclusive, royalty-free, worldwide license to display, reproduce, and use such content in connection with the operation of the Platform.
        </p>
        <p>
          You may not copy, reproduce, distribute, or create derivative works from Platform content without our express written permission.
        </p>
      </Section>

      <Section id="privacy" title="10. Privacy">
        <p>
          Your use of the Platform is subject to our <a href="/privacy" className="text-red-600 hover:underline">Privacy Policy</a>, which describes how we collect, use, and protect your personal data. By using PlanToday, you consent to our data practices as described therein.
        </p>
      </Section>

      <Section id="disclaimer" title="11. Disclaimer of Warranties">
        <p>
          THE PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT ANY WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>
        <p>
          We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses. We do not guarantee the accuracy, completeness, or reliability of any Vendor information, reviews, or pricing listed on the Platform.
        </p>
      </Section>

      <Section id="liability" title="12. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable Indian law, PlanToday and its directors, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
        </p>
        <p>
          Our total liability to you for any claim arising out of or related to these Terms or the Platform shall not exceed the amount you paid to PlanToday in the 12 months preceding the claim, or ₹5,000 — whichever is lower.
        </p>
        <p>
          PlanToday is not liable for any disputes, damages, or losses arising from transactions between Users and Vendors, including non-delivery of services, poor service quality, or financial fraud.
        </p>
      </Section>

      <Section id="termination" title="13. Termination">
        <p>
          Either party may terminate this agreement at any time. You may close your account by contacting support. We may suspend or permanently terminate your account if you violate these Terms, engage in fraudulent activity, or cause harm to other users or Vendors.
        </p>
        <p>
          Upon termination, your right to access the Platform ceases immediately. Sections covering intellectual property, disclaimer, liability, and disputes survive termination.
        </p>
      </Section>

      <Section id="disputes" title="14. Governing Law & Disputes">
        <p>
          These Terms are governed by the laws of India. Any disputes arising from or related to these Terms or your use of the Platform shall first be attempted to be resolved through good-faith negotiation.
        </p>
        <p>
          If unresolved within 30 days, disputes shall be subject to the exclusive jurisdiction of the courts located in India. You agree to waive any right to a class-action lawsuit or jury trial.
        </p>
      </Section>

      <Section id="changes" title="15. Changes to Terms">
        <p>
          We may update these Terms from time to time. When we do, we will update the &quot;Effective Date&quot; at the top of this page and notify registered users via email or an in-app notification.
        </p>
        <p>
          Your continued use of the Platform after such changes constitutes your acceptance of the updated Terms.
        </p>
      </Section>

      <Section id="contact" title="16. Contact Us">
        <p>For any questions, concerns, or legal notices regarding these Terms, please contact us:</p>
        <div className="bg-gray-50 rounded-xl p-4 mt-2 space-y-1">
          <p><strong>{COMPANY}</strong></p>
          <p>{ADDRESS}</p>
          <p>Email: <a href={`mailto:${EMAIL}`} className="text-red-600 hover:underline">{EMAIL}</a></p>
          <p>Website: <a href="https://plantoday.in" className="text-red-600 hover:underline">plantoday.in</a></p>
        </div>
      </Section>
    </div>
  );
}
