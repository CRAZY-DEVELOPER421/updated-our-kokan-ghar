import Link from 'next/link';

export default function Breadcrumb({ items = [], light = false }) {
  const allItems = [{ label: 'Home', href: '/' }, ...items];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      item: item.href ? `https://www.kokanghar.in${item.href}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className={`flex items-center gap-1.5 text-sm mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide ${light ? 'text-white/70' : 'text-konkan-text-secondary'}`} aria-label="Breadcrumb">
        {allItems.map((item, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <svg className={`w-3 h-3 shrink-0 ${light ? 'text-white/40' : 'text-konkan-sand'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {idx === allItems.length - 1 ? (
              <span className={`font-medium truncate max-w-[200px] ${light ? 'text-white' : 'text-konkan-text-primary'}`}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={`transition-colors shrink-0 ${light ? 'text-white/70 hover:text-white' : 'hover:text-konkan-green-primary'}`}
              >
                {item.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
