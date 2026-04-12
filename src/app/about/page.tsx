import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About PlanToday — India\'s Trusted Event Planning Marketplace',
  description: 'PlanToday connects people planning weddings, birthdays, corporate events, and more with verified local vendors across India. Discover our story, mission, and the team building the future of event planning.',
  keywords: 'about plantoday, event planning india, wedding vendors, event marketplace india, plantoday team',
  openGraph: {
    title: 'About PlanToday — India\'s Trusted Event Planning Marketplace',
    description: 'From weddings to corporate events, PlanToday helps millions of Indians discover verified local vendors and plan perfect events effortlessly.',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-600 to-rose-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Our Story
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mb-5 leading-tight">
            India&apos;s Smartest Way to<br />
            <span className="text-yellow-300">Plan Any Event</span>
          </h1>
          <p className="text-lg text-red-100 max-w-2xl mx-auto leading-relaxed">
            PlanToday is an AI-powered hyperlocal marketplace that connects people planning
            life&apos;s most meaningful moments with the best vendors in their city — faster,
            smarter, and with zero stress.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">
                Why We Built PlanToday
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Every year, hundreds of millions of events happen across India — weddings,
                birthdays, corporate gatherings, anniversaries, and festivals. Yet finding the
                right photographer, caterer, decorator, or venue remains a chaotic, word-of-mouth
                driven process.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                We saw a massive gap: event planners spending weeks calling vendors, comparing
                prices on WhatsApp, and second-guessing every decision. And talented local vendors
                struggling to get discovered beyond their immediate circle.
              </p>
              <p className="text-gray-600 leading-relaxed">
                PlanToday was built to fix this — bringing structure, transparency, and
                AI-powered intelligence to India&apos;s fragmented event services market.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { number: '10,000+', label: 'Verified Vendors' },
                { number: '50+',     label: 'Cities Covered' },
                { number: '1L+',     label: 'Events Planned' },
                { number: '4.8★',    label: 'Avg. User Rating' },
              ].map(s => (
                <div key={s.label} className="bg-red-50 rounded-2xl p-5 text-center border border-red-100">
                  <p className="text-3xl font-black text-red-600">{s.number}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">What PlanToday Does</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              We are not just a directory. We are an intelligent platform that matches you with the right vendor at the right price.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🔍',
                title: 'Smart Discovery',
                desc: 'AI-powered search that understands your event type, budget, location, and preferences to surface the most relevant vendors instantly.',
              },
              {
                icon: '✅',
                title: 'Verified Vendors',
                desc: 'Every vendor on PlanToday goes through a verification process. Real photos, real reviews, real businesses — no fake listings.',
              },
              {
                icon: '💰',
                title: 'Transparent Pricing',
                desc: 'Compare packages, read reviews, and see pricing upfront. No hidden fees, no awkward negotiation surprises.',
              },
              {
                icon: '⚡',
                title: 'Instant Lead Matching',
                desc: 'Submit your event requirements once and receive quotes from multiple vendors in your area — all within minutes.',
              },
              {
                icon: '📍',
                title: 'Truly Hyperlocal',
                desc: 'We focus on your city, your locality, your neighborhood. Our platform prioritizes vendors closest to you.',
              },
              {
                icon: '🤝',
                title: 'Vendor Growth',
                desc: 'We help local event professionals grow their business with a dedicated dashboard, lead management, and subscription tools.',
              },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Categories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Events We Help You Plan</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Wedding', 'Birthday', 'Corporate Event', 'Engagement', 'Baby Shower',
              'Anniversary', 'Naming Ceremony', 'Farewell Party', 'Product Launch',
              'Conference', 'Pooja / Religious Events', 'School Event', 'College Fest',
            ].map(e => (
              <span key={e} className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-semibold border border-red-100">
                {e}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Trust First',
                desc: 'We only list vendors we can verify. Every business on PlanToday is accountable, and every complaint is taken seriously.',
              },
              {
                title: 'Simplicity Over Complexity',
                desc: 'Planning an event should be joyful, not stressful. Every feature we build is designed to save time and reduce friction.',
              },
              {
                title: 'Local at Heart',
                desc: 'We champion local entrepreneurs — the photographers, caterers, and decorators who are the backbone of India\'s event economy.',
              },
              {
                title: 'Data-Driven Decisions',
                desc: 'Our recommendations are powered by real data — reviews, booking rates, ratings, and user preferences — not paid placements.',
              },
            ].map(v => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                  {v.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Vendors */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl p-8 text-white text-center">
            <h2 className="text-3xl font-black mb-3">Are You a Vendor?</h2>
            <p className="text-red-100 mb-6 max-w-xl mx-auto">
              Join thousands of event professionals already growing their business on PlanToday.
              Get verified, list your packages, and start receiving leads today.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/auth/register"
                className="px-6 py-3 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition"
              >
                List Your Business — Free
              </Link>
              <Link
                href="/vendors"
                className="px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition border border-white/30"
              >
                Browse Vendors
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-4">Get in Touch</h2>
          <p className="text-gray-600 mb-8">
            Questions, partnerships, press enquiries, or just want to say hello?
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <a href="mailto:support@plantoday.in" className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
              <span className="text-2xl mb-2 block">📧</span>
              <p className="font-bold text-gray-900 text-sm">Support</p>
              <p className="text-xs text-red-600 group-hover:underline">support@plantoday.in</p>
            </a>
            <a href="mailto:vendors@plantoday.in" className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
              <span className="text-2xl mb-2 block">🤝</span>
              <p className="font-bold text-gray-900 text-sm">Vendors</p>
              <p className="text-xs text-red-600 group-hover:underline">vendors@plantoday.in</p>
            </a>
            <a href="mailto:press@plantoday.in" className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
              <span className="text-2xl mb-2 block">📰</span>
              <p className="font-bold text-gray-900 text-sm">Press</p>
              <p className="text-xs text-red-600 group-hover:underline">press@plantoday.in</p>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
