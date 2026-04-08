'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';

/* Mock events — replace with API call once backend events endpoint is live */
const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Grand Wedding Expo 2026',
    location: 'Noida Sector 62',
    date: 'Apr 20, 2026',
    price: 'Free',
    isFree: true,
    category: 'Wedding',
    emoji: '💍',
    gradient: 'from-rose-500 to-pink-600',
    badge: 'Trending',
    attendees: '2.4K interested',
  },
  {
    id: 2,
    title: 'Corporate Event Summit',
    location: 'DLF Cyber City, Gurgaon',
    date: 'May 3, 2026',
    price: '₹999',
    isFree: false,
    category: 'Corporate',
    emoji: '💼',
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'Featured',
    attendees: '850 registered',
  },
  {
    id: 3,
    title: 'Bridal Fashion & Makeup Show',
    location: 'Select Citywalk, Delhi',
    date: 'Apr 28, 2026',
    price: '₹499',
    isFree: false,
    category: 'Wedding',
    emoji: '👰',
    gradient: 'from-purple-500 to-rose-500',
    badge: 'Hot',
    attendees: '1.2K interested',
  },
  {
    id: 4,
    title: 'Delhi Food & Catering Fest',
    location: 'Jawaharlal Nehru Stadium',
    date: 'May 10, 2026',
    price: 'Free',
    isFree: true,
    category: 'Catering',
    emoji: '🍽️',
    gradient: 'from-orange-500 to-amber-500',
    badge: 'New',
    attendees: '3K attending',
  },
  {
    id: 5,
    title: 'Photography Masterclass',
    location: 'India Habitat Centre, Delhi',
    date: 'May 15, 2026',
    price: '₹1,500',
    isFree: false,
    category: 'Photography',
    emoji: '📸',
    gradient: 'from-teal-500 to-cyan-600',
    badge: 'Trending',
    attendees: '400 seats left',
  },
  {
    id: 6,
    title: 'Birthday Decor Bazaar',
    location: 'Noida Haat',
    date: 'Apr 25, 2026',
    price: 'Free',
    isFree: true,
    category: 'Decoration',
    emoji: '🎈',
    gradient: 'from-yellow-400 to-orange-500',
    badge: 'Popular',
    attendees: '600 interested',
  },
];

const BADGE_COLORS: Record<string, string> = {
  Trending: 'bg-red-500 text-white',
  Featured: 'bg-blue-500 text-white',
  Hot: 'bg-orange-500 text-white',
  New: 'bg-emerald-500 text-white',
  Popular: 'bg-purple-500 text-white',
};

export default function TrendingEvents() {
  const { selectedCity } = useAppStore();

  return (
    <section className="py-12 bg-white border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold text-red-500 uppercase tracking-widest">What&apos;s Happening</span>
              <span className="text-red-500 animate-bounce-gentle">🔥</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Trending Events
              {selectedCity && <span className="text-red-500"> in {selectedCity.name}</span>}
            </h2>
            <p className="text-gray-500 text-sm mt-1">Discover popular events happening near you</p>
          </div>
          <Link
            href="/search?tab=events"
            className="hidden sm:flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-bold shrink-0"
          >
            All events <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {/* Horizontal scroll carousel */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory -mx-4 px-4">
          {MOCK_EVENTS.map((event) => (
            <Link
              key={event.id}
              href={`/search?q=${encodeURIComponent(event.category)}&nlp=1`}
              className="group flex-none w-64 sm:w-72 snap-start"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden">
                {/* Image / Gradient */}
                <div className={`relative h-36 bg-gradient-to-br ${event.gradient} overflow-hidden`}>
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                  }} />
                  {/* Emoji */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl opacity-30 group-hover:opacity-50 transition-opacity">{event.emoji}</span>
                  </div>
                  {/* Badge */}
                  <span className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full ${BADGE_COLORS[event.badge] || 'bg-gray-800 text-white'}`}>
                    {event.badge}
                  </span>
                  {/* Price */}
                  <span className={`absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow ${
                    event.isFree ? 'bg-emerald-400 text-emerald-900' : 'bg-white text-gray-800'
                  }`}>
                    {event.price}
                  </span>
                  {/* Category */}
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                    {event.emoji} {event.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-red-700 transition line-clamp-2 mb-2">
                    {event.title}
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{event.attendees}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Coming soon card */}
          <div className="flex-none w-64 sm:w-72 snap-start">
            <div className="h-full min-h-[200px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-4xl mb-3">🎪</span>
              <p className="font-bold text-gray-600 text-sm mb-1">More Events Coming</p>
              <p className="text-xs text-gray-400">Be the first to post an event</p>
              <Link href="/partner/onboard" className="mt-4 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-red-700 transition">
                Post Event
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
