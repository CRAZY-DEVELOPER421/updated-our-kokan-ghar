import Link from 'next/link';

const offers = [
  {
    title: 'Buy ₹999+, Get Free Cashews!',
    subtitle: 'Premium 250g roasted cashews free on orders above ₹999',
    cta: 'Shop Now',
    href: '/offers',
    gradient: 'from-konkan-green-dark to-konkan-green-primary',
    accent: 'gold',
    icon: 'Nuts',
  },
  {
    title: 'Monsoon Special: Dried Fish',
    subtitle: 'Authentic Konkan Bombil & Sungta at special monsoon prices',
    cta: 'Explore Seafood',
    href: '/categories/coastal-seafood',
    gradient: 'from-konkan-ocean to-blue-800',
    accent: 'white',
    icon: 'Seafood',
  },
];

export default function OfferBanners() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {offers.map((offer, idx) => (
        <Link
          key={idx}
          href={offer.href}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${offer.gradient} p-6 md:p-8 group hover:shadow-xl transition-shadow duration-300`}
        >
          <div className="absolute top-4 right-4 text-5xl md:text-6xl opacity-30 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="relative z-10 max-w-xs">
            <h3 className={`font-display text-xl md:text-2xl font-bold mb-2 ${offer.accent === 'gold' ? 'text-konkan-gold' : 'text-white'}`}>
              {offer.title}
            </h3>
            <p className={`text-sm mb-4 ${offer.accent === 'gold' ? 'text-white/80' : 'text-white/70'}`}>
              {offer.subtitle}
            </p>
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              offer.accent === 'gold'
                ? 'bg-konkan-gold text-konkan-earth hover:bg-amber-400'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}>
              {offer.cta}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
