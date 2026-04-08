'use client';

import { useAppStore } from '@/store/useAppStore';

const SERVICES = [
  'Wedding Planning', 'Birthday Party Plan', 'Corporate Events',
  'Venue + Catering', 'Photography Package', 'Decoration Bundle',
  'DJ + Music', 'Bridal Makeup', 'Complete Event Plan', 'Free Budget Planner',
];

export default function HeroTicker() {
  const { selectedCity } = useAppStore();
  const locationLabel = selectedCity?.name || 'India';

  return (
    <div className="relative border-b border-white/10 bg-black/30 py-2 overflow-hidden mt-0">
      <div className="ticker-track whitespace-nowrap text-xs text-gray-400">
        {[...Array(2)].map((_, ri) => (
          <span key={ri} className="flex items-center gap-6">
            {SERVICES.map((s) => (
              <span key={s} className="flex items-center gap-2 px-6">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {s} in {locationLabel}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
