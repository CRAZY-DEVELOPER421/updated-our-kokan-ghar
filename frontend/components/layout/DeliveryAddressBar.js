'use client';

import { usePathname } from 'next/navigation';

// Thin strip shown under the mobile header. Campaign landing pages are
// immersive (only the top bar stays), so this strip is hidden there.
export default function DeliveryAddressBar() {
  const pathname = usePathname();
  if (pathname?.startsWith('/campaign')) return null;

  return (
    <div className="lg:hidden flex items-center h-8 px-4 gap-1 bg-[#E8F0EC] dark:bg-[#1a1e2e]">
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} className="w-3.5 h-3.5 shrink-0 dark:text-konkan-green-light">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="text-[12px] font-medium dark:text-gray-300" style={{ color: '#1B3B2F' }}>
        Delivering to Mumbai 400064
      </span>
      <svg className="w-3 h-3 shrink-0 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
