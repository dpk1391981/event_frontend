import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LaunchGate from '@/components/launch/LaunchGate';
import GlobalLeadCTA from '@/components/lead/GlobalLeadCTA';
import CookieConsent from '@/components/common/CookieConsent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'PlanToday — Find Event Vendors & Services | Delhi NCR',
    template: '%s | PlanToday',
  },
  description:
    'India\'s smartest platform to find wedding photographers, caterers, venues, DJs & decorators. AI-powered vendor search across Noida, Delhi, Gurgaon, Faridabad. Free quotes instantly.',
  keywords: [
    'event vendors Delhi NCR', 'wedding photographer Noida', 'event catering',
    'wedding venue Delhi', 'event planners Gurgaon', 'DJ for wedding',
    'bridal makeup Noida', 'event decoration', 'corporate events Delhi',
    'birthday party venue', 'anniversary event planner', 'mehendi artist Noida',
  ],
  authors: [{ name: 'PlanToday' }],
  creator: 'PlanToday',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    siteName: 'PlanToday',
    title: 'PlanToday — Find Event Vendors & Services Near You',
    description: '2000+ verified vendors across Delhi NCR. Free instant quotes, AI-powered matching.',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlanToday — Find Event Vendors Near You',
    description: '2000+ verified vendors across Delhi NCR. Free instant quotes.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PlanToday',
  url: 'https://plantoday.in',
  description: 'India\'s smartest platform to find event vendors and local services.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: '/search?q={search_term_string}&nlp=1' },
    'query-input': 'required name=search_term_string',
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PlanToday',
  url: 'https://plantoday.in',
  logo: 'https://plantoday.in/logo.png',
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: ['English', 'Hindi'] },
  sameAs: [],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50 antialiased`}>
        <LaunchGate>
          <Header />
          <div className="flex-1 min-w-0">{children}</div>
          <Footer />
          <GlobalLeadCTA />
          <CookieConsent />
        </LaunchGate>
      </body>
    </html>
  );
}
