'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { locationsApi } from '@/lib/api';
import { City, Locality } from '@/types';

interface Props {
  citySlug: string;
}

export default function CitySync({ citySlug }: Props) {
  const { setSelectedCity } = useAppStore();
  const [city,       setCity]       = useState<City | null>(null);
  const [localities, setLocalities] = useState<Locality[]>([]);

  useEffect(() => {
    locationsApi.getCities()
      .then((data: unknown) => {
        const cities = data as City[];
        const found  = cities.find((c) => c.slug === citySlug) ?? null;
        if (found) {
          setCity(found);
          setSelectedCity(found);
          locationsApi.getLocalities(found.id)
            .then((locs: unknown) => setLocalities(locs as Locality[]))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [citySlug, setSelectedCity]);

  if (!localities.length) return null;

  // Duplicate for seamless infinite scroll
  const items = [...localities, ...localities];
  // ~4s per locality so it feels like the HeroTicker pace
  const duration = Math.max(30, localities.length * 4);

  return (
    <div className="relative bg-white border-b border-gray-100 py-2 overflow-hidden">
      {/* Scrolling track — same pattern as HeroTicker */}
      <div
        className="ticker-track whitespace-nowrap"
        style={{ animationDuration: `${duration}s` }}
      >
        {items.map((loc, i) => (
          <Link
            key={`${loc.id}-${i}`}
            href={`/search?cityId=${city?.id}&localityId=${loc.id}`}
            className="inline-flex items-center gap-1 mx-2 px-3 py-0.5 rounded-full bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-700 text-[11px] font-semibold transition-colors"
          >
            <svg className="w-2.5 h-2.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {loc.name}
          </Link>
        ))}
      </div>

      {/* Pinned city label — fades in from left edge */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
        <div className="pl-3 pr-6 h-full flex items-center bg-gradient-to-r from-white via-white to-transparent">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1.5 shrink-0" />
          <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest whitespace-nowrap">
            {city?.name}
          </span>
        </div>
      </div>
    </div>
  );
}
