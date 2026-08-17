'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

// Fallback region cards — used only while data loads / if the API fails.
const FALLBACK_REGIONS = [
  { name: 'Goa', product_count: 0, starting_price: 0, representative_image: null },
  { name: 'Ratnagiri', product_count: 0, starting_price: 0, representative_image: null },
  { name: 'Malvan', product_count: 0, starting_price: 0, representative_image: null },
  { name: 'Sindhudurg', product_count: 0, starting_price: 0, representative_image: null },
];

const regionGradients = {
  Goa: 'from-konkan-ocean/20 to-blue-900/20',
  Ratnagiri: 'from-konkan-saffron/20 to-amber-900/20',
  Malvan: 'from-konkan-green-primary/20 to-green-900/20',
  Sindhudurg: 'from-konkan-gold/20 to-yellow-900/20',
  Devgad: 'from-konkan-saffron/20 to-red-900/20',
  default: 'from-konkan-ocean/20 to-teal-900/20',
};

export default function ShopByRegion() {
  const [regions, setRegions] = useState(null);

  useEffect(() => {
    api
      .get('/products/regions')
      .then((res) => {
        const list = res.data?.data?.regions || [];
        setRegions(list);
      })
      .catch(() => setRegions(FALLBACK_REGIONS));
  }, []);

  // Show the top 4 regions as feature cards, the rest as small pills.
  const top = (regions || FALLBACK_REGIONS).slice(0, 4);
  const rest = (regions || []).slice(4);

  const cardHref = (name) => `/products?region=${encodeURIComponent(name.toLowerCase())}`;

  return (
    <section id="shop-by-region" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="section-title">Shop by Region</h2>
          <p className="section-subtitle">
            Explore the authentic taste of each Konkan region — Goa, Ratnagiri, Malvan & more
          </p>
        </div>
        <Link
          href="/products"
          className="hidden md:flex items-center gap-1.5 text-sm font-medium text-konkan-green-primary hover:text-konkan-green-secondary transition-colors"
        >
          All Products
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Region cards — grid of 4 on desktop, 2×2 / horizontal scroll on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {top.map((region, idx) => {
          const name = region.name;
          const count = region.product_count || 0;
          const img = getImageUrl(region.representative_image);
          const gradient = regionGradients[name] || regionGradients.default;
          return (
            <Link
              key={name}
              href={cardHref(name)}
              className="group relative rounded-2xl overflow-hidden card border border-konkan-sand/30 hover:shadow-card-hover transition-all duration-300"
            >
              <div className={`relative h-32 md:h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                {img ? (
                  <Image
                    src={img}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-konkan-green-primary" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <h3 className="absolute bottom-2 left-3 text-white font-display font-bold text-base md:text-lg drop-shadow">
                  {name}
                </h3>
              </div>
              <div className="p-3 md:p-4">
                <p className="text-[10px] md:text-xs text-konkan-text-secondary">
                  {count > 0 ? `${count} products` : 'Explore products'}
                  {region.starting_price > 0 && ` · from ₹${region.starting_price}`}
                </p>
                <span className="inline-flex items-center gap-1 mt-1 text-[11px] md:text-xs font-medium text-konkan-green-primary group-hover:gap-2 transition-all">
                  Shop {name}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Remaining regions as quick pills */}
      {rest.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {rest.map((region) => (
            <Link
              key={region.name}
              href={cardHref(region.name)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-konkan-cream hover:bg-konkan-green-primary/10 text-konkan-text-primary transition-colors"
            >
              <MapPin className="w-3 h-3 text-konkan-green-primary" />
              {region.name}
              {region.product_count > 0 && (
                <span className="text-[10px] text-konkan-text-secondary">({region.product_count})</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
