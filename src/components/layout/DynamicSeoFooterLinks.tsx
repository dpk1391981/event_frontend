'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { seoPublicApi } from '@/lib/api';
import { ChevronRightIcon } from '@/components/ui/Icon';

interface FooterLink {
  id: number;
  anchorText: string;
  targetUrl: string;
  groupType: string;
  groupValue?: string;
  groupLabel?: string;
  priority: number;
}

interface GroupedLinks {
  [key: string]: {
    label: string;
    links: FooterLink[];
  };
}

export default function DynamicSeoFooterLinks() {
  const [grouped, setGrouped] = useState<GroupedLinks | null>(null);

  useEffect(() => {
    seoPublicApi.getFooterLinks()
      .then((data: any) => {
        if (data && Object.keys(data).length > 0) setGrouped(data);
      })
      .catch(() => { /* fail silently — hardcoded fallback remains */ });
  }, []);

  // While loading or empty, render nothing (parent footer has its own static links)
  if (!grouped || Object.keys(grouped).length === 0) return null;

  // Flatten all groups into a single list of links (max 24 for footer space)
  const allLinks: FooterLink[] = [];
  for (const group of Object.values(grouped)) {
    allLinks.push(...group.links);
    if (allLinks.length >= 24) break;
  }

  return (
    <div className="mb-10 border-t border-gray-800 pt-10">
      <p className="mb-5 text-xs font-bold uppercase tracking-wider text-gray-500">Popular Searches</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
        {allLinks.slice(0, 24).map((link) => (
          <Link
            key={link.id}
            href={link.targetUrl}
            className="flex items-center gap-1.5 truncate py-0.5 text-xs text-gray-500 transition hover:text-red-400"
          >
            <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-red-700" />
            <span className="truncate">{link.anchorText}</span>
          </Link>
        ))}
      </div>

      {/* Group headings for larger screens */}
      <div className="hidden xl:grid xl:grid-cols-4 gap-8 mt-8">
        {Object.entries(grouped).slice(0, 4).map(([key, group]) => (
          <div key={key}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-600 mb-2">{group.label}</p>
            <ul className="space-y-1.5">
              {group.links.slice(0, 6).map((link) => (
                <li key={link.id}>
                  <Link href={link.targetUrl} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition">
                    <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-red-700" />
                    <span className="truncate">{link.anchorText}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
