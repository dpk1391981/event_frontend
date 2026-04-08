'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { locationsApi } from '@/lib/api';
import { City, Locality } from '@/types';
import { LocationIcon } from '@/components/ui/Icon';

interface Props {
  citySlug: string;
}

export default function CitySync({ citySlug }: Props) {
  const { setSelectedCity } = useAppStore();
  const [city,       setCity]       = useState<City | null>(null);
  const [localities, setLocalities] = useState<Locality[]>([]);

  useEffect(() => {
    locationsApi.getCities()
      .then((data: any) => {
        const cities = (data as unknown) as City[];
        const found  = cities.find((c) => c.slug === citySlug) ?? null;
        if (found) {
          setCity(found);
          setSelectedCity(found);
          locationsApi.getLocalities(found.id)
            .then((locs: any) => setLocalities((locs as unknown) as Locality[]))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [citySlug, setSelectedCity]);

  if (!localities.length) return null;

  const cityName = city?.name ?? '';

  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-[11px] font-extrabold text-red-500 uppercase tracking-widest mb-3 text-center">
          Localities We Serve in {cityName}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {localities.map((loc) => (
            <Link
              key={loc.id}
              href={`/search?cityId=${city?.id}&localityId=${loc.id}`}
              className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 text-gray-700 hover:text-red-700 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
            >
              <LocationIcon className="w-3 h-3 text-gray-400" />
              {loc.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
