'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { eventsApi } from '@/lib/api';
import { Event } from '@/types';

const BADGE_COLORS: Record<string, string> = {
  trending: 'bg-red-500 text-white',
  featured: 'bg-blue-500 text-white',
};

const GRADIENTS = [
  'from-rose-500 to-pink-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-rose-500',
  'from-orange-500 to-amber-500',
  'from-teal-500 to-cyan-600',
  'from-yellow-400 to-orange-500',
];

export default function TrendingEvents() {
  const { selectedCity } = useAppStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    eventsApi.getTrending(selectedCity?.id)
      .then((data: unknown) => setEvents(data as Event[]))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [selectedCity?.id]);

  // Don't render the section at all if no events and not loading
  if (!loading && events.length === 0) return null;

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
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-none w-64 sm:w-72 snap-start">
                  <div className="bg-gray-100 rounded-2xl h-56 animate-pulse" />
                </div>
              ))
            : events.map((event, idx) => (
                <Link
                  key={event.id}
                  href={`/search?q=${encodeURIComponent(event.category?.name || event.title)}&nlp=1${selectedCity ? `&cityId=${selectedCity.id}` : ''}`}
                  className="group flex-none w-64 sm:w-72 snap-start"
                >
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden">
                    {/* Image / Gradient */}
                    <div className={`relative h-36 overflow-hidden ${event.image ? '' : `bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]}`}`}>
                      {event.image ? (
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                            backgroundSize: '20px 20px',
                          }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-7xl opacity-30 group-hover:opacity-50 transition-opacity">
                              {event.category?.icon || '🎪'}
                            </span>
                          </div>
                        </>
                      )}
                      {event.isTrending && (
                        <span className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full ${BADGE_COLORS.trending}`}>
                          Trending
                        </span>
                      )}
                      {event.isFeatured && !event.isTrending && (
                        <span className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full ${BADGE_COLORS.featured}`}>
                          Featured
                        </span>
                      )}
                      <span className={`absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow ${
                        event.isFree ? 'bg-emerald-400 text-emerald-900' : 'bg-white text-gray-800'
                      }`}>
                        {event.isFree ? 'Free' : event.price ? `₹${event.price.toLocaleString('en-IN')}` : 'Paid'}
                      </span>
                      {event.category && (
                        <span className="absolute bottom-3 left-3 text-[10px] font-bold text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                          {event.category.icon && event.category.icon.length <= 4 ? `${event.category.icon} ` : ''}{event.category.name}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-red-700 transition line-clamp-2 mb-2">
                        {event.title}
                      </h3>
                      <div className="space-y-1.5">
                        {(event.locality?.name || event.city?.name) && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">{event.locality?.name || event.city?.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {event.attendeeCount != null && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{event.attendeeCount.toLocaleString('en-IN')} interested</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

          {/* Post event CTA card */}
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
