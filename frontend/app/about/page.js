import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';
import TeamSection from './TeamSection';

export const metadata = {
  title: 'About Us',
  description: 'Discover the story behind Kokan Ghar — a marketplace connecting you directly with farmers and artisans from the Konkan coast of Maharashtra, Goa, and Karnataka.',
  keywords: ['about Kokan Ghar', 'Konkan story', 'Goan marketplace', 'Konkan farmers', 'authentic products India'],
  openGraph: {
    title: 'About Us',
    description: 'Discover the story behind Kokan Ghar — connecting you with farmers and artisans from the Konkan coast.',
    url: 'https://www.kokanghar.in/about',
    siteName: 'Kokan Ghar',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: { canonical: 'https://www.kokanghar.in/about' },
};

const MILESTONES = [
  { year: '2019', title: 'The Beginning', description: 'Started as a small WhatsApp group connecting 25 families in Mapusa, Goa with farm-fresh Alphonso mangoes.' },
  { year: '2020', title: 'Going Digital', description: 'Launched our first website during the pandemic. Delivered 10,000+ orders to homes across India.' },
  { year: '2022', title: 'Farmer Network', description: 'Partnered with 200+ farmers and artisans across Maharashtra, Goa, and Karnataka. Expanded to 8 product categories.' },
  { year: '2024', title: 'National Reach', description: 'Serving 50,000+ customers across 200+ cities. Launched loyalty program and sustainable packaging initiative.' },
  { year: '2025', title: 'Kokan Ghar Today', description: 'India\'s largest online marketplace for authentic Konkan products. Direct impact on 500+ farming families.' },
];

export default function AboutPage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-konkan-green-dark via-konkan-green-primary to-konkan-green-secondary py-14 md:py-20">
        <div className="container-custom">
          <Breadcrumb items={[{ label: 'About Us' }]} light />
          <h1 className="font-display text-3xl md:text-5xl font-bold text-white mt-2 max-w-3xl">
            Bringing the Konkan Coast to Your Doorstep
          </h1>
          <p className="text-konkan-green-pale/80 mt-3 max-w-2xl text-base md:text-lg">
            We are on a mission to connect India with the authentic flavours, traditions, and craftsmanship
            of the Konkan region — from the Sahyadri hills to the Arabian Sea.
          </p>
        </div>
      </div>

      {/* Story Section */}
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-konkan-green-primary">Our Story</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary mt-2 mb-4">
              From the Fields of Ratnagiri to Your Kitchen
            </h2>
            <div className="space-y-3 text-konkan-text-secondary leading-relaxed">
              <p>
                Kokan Ghar was born on a monsoon afternoon in Mapusa, Goa, when our founder Arun Desai
                realized that the Alphonso mangoes, cashews, and spices his grandmother sent him from Ratnagiri
                were nowhere to be found in the cities. The farmers who grew them had no way to reach customers
                beyond their local markets.
              </p>
              <p>
                What started as a small experiment — helping a few farmers sell their produce online — quickly
                grew into a movement. Today, Kokan Ghar works directly with over 500 farmers, fisherfolk,
                and artisans across the Konkan coast, ensuring they get fair prices for their labour while
                you get the freshest, most authentic products delivered to your home.
              </p>
              <p>
                Every product on our platform is handpicked, quality-checked, and packed with care. We
                believe in transparency, sustainability, and building a community around the rich culinary
                and cultural heritage of the Konkan region.
              </p>
            </div>
          </div>
          <div className="bg-konkan-cream rounded-2xl p-6 aspect-[4/3] flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-konkan-green-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19V5m0 0a7 7 0 00-7 7m7-7a7 7 0 017 7" /></svg>
              <p className="font-display text-lg text-konkan-text-primary font-bold">Konkan Coast</p>
              <p className="text-sm text-konkan-text-secondary">720 km of pristine coastline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="bg-konkan-cream/50 border-y border-konkan-sand/50">
        <div className="container-custom py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: '500+', label: 'Farmers & Artisans' },
              { number: '50,000+', label: 'Happy Customers' },
              { number: '200+', label: 'Cities Served' },
              { number: '8', label: 'Product Categories' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl md:text-3xl font-bold text-konkan-green-primary">{stat.number}</p>
                <p className="text-xs text-konkan-text-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="container-custom py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary">Our Journey</h2>
          <p className="text-sm text-konkan-text-secondary mt-2">Key milestones that shaped Kokan Ghar</p>
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-konkan-sand hidden md:block" />
          <div className="space-y-8">
            {MILESTONES.map((m, idx) => (
              <div key={m.year} className="relative pl-0 md:pl-14">
                <div className="hidden md:flex absolute left-3 w-[18px] h-[18px] rounded-full bg-konkan-green-primary border-4 border-konkan-cream z-10 -translate-x-1/2" style={{ top: '6px' }} />
                <div className="bg-white rounded-xl card p-5">
                  <span className="text-xs font-bold text-konkan-saffron">{m.year}</span>
                  <h3 className="font-display text-lg font-bold text-konkan-text-primary mt-1">{m.title}</h3>
                  <p className="text-sm text-konkan-text-secondary mt-1">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="bg-white border-y border-konkan-sand/50">
        <div className="container-custom py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary">Meet the Team</h2>
            <p className="text-sm text-konkan-text-secondary mt-2">The people behind Kokan Ghar</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TeamSection />
          </div>
        </div>
      </div>

      {/* Konkan Region Map Section */}
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary">The Konkan Region</h2>
            <p className="text-sm text-konkan-text-secondary mt-2 mb-4 leading-relaxed">
              Stretching 720 kilometres along India&apos;s west coast, the Konkan region spans parts of
              Maharashtra, Goa, and Karnataka. Blessed with abundant rainfall, fertile soil, and a unique
              coastal climate, this region produces some of India&apos;s finest agricultural products —
              from the world-famous Alphonso mangoes of Ratnagiri to the premium cashews of Goa.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { region: 'Ratnagiri', known: 'Alphonso Mangoes, Cashews' },
                { region: 'Goa', known: 'Cashews, Seafood, Feni' },
                { region: 'Malvan', known: 'Seafood, Spices, Sol Kadhi' },
                { region: 'Karwar', known: 'Bananas, Jackfruit, Rice' },
                { region: 'Sindhudurg', known: 'Honey, Coconut, Kokum' },
                { region: 'Udupi', known: 'Spices, Areca Nut, Rice' },
              ].map((item) => (
                <div key={item.region} className="bg-konkan-cream/50 rounded-xl p-3">
                  <div>
                    <p className="text-xs font-bold text-konkan-text-primary">{item.region}</p>
                    <p className="text-[10px] text-konkan-text-secondary">{item.known}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-konkan-cream rounded-2xl p-6 aspect-square flex items-center justify-center">
            <div className="text-center">
              <svg className="w-20 h-20 mx-auto mb-4 text-konkan-green-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="font-display text-lg font-bold text-konkan-text-primary">Konkan Coast</p>
              <p className="text-sm text-konkan-text-secondary">Maharashtra · Goa · Karnataka</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-konkan-green-dark to-konkan-green-primary py-12">
        <div className="container-custom text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to Explore Kokan Ghar?
          </h2>
          <p className="text-konkan-green-pale/80 text-sm md:text-base mb-6 max-w-lg mx-auto">
            Join thousands of happy customers experiencing the authentic flavours of the Konkan coast.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/products" className="bg-white text-konkan-green-primary px-6 py-3 rounded-lg font-medium hover:bg-konkan-cream transition-colors">
              Shop Now
            </Link>
            <Link href="/contact" className="border-2 border-white/50 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
