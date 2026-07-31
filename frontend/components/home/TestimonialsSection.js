'use client';

import { useEffect, useState } from 'react';
import StarRating from '@/components/ui/StarRating';

const testimonials = [
  {
    name: 'Rohan Joshi',
    location: 'Pune, Maharashtra',
    rating: 5,
    text: 'The Devgad Alphonso mangoes are incredible! So sweet and flavorful. The packaging was perfect and they arrived in 2 days. Tastes just like the mangoes I had growing up in Ratnagiri.',
    product: 'Alphonso Mangoes',
    avatar: 'RJ',
    bg: 'from-konkan-green-primary/10 to-konkan-cream',
  },
  {
    name: 'Smita Desai',
    location: 'Margao, Goa',
    rating: 5,
    text: 'Finally found authentic Konkan dried fish online! The Bombil and Sungta are exactly like what my grandmother used to make. The quality is exceptional. Will be a regular customer!',
    product: 'Coastal Seafood',
    avatar: 'SD',
    bg: 'from-konkan-ocean/10 to-blue-50',
  },
  {
    name: 'Arun Naik',
    location: 'Mumbai, Maharashtra',
    rating: 5,
    text: 'The cashews from Kokan Ghar are the best I have ever tasted. Fresh, crunchy, and perfectly roasted. The Masala Cashews are my new favorite snack. Highly recommended!',
    product: 'Cashew Nuts',
    avatar: 'AN',
    bg: 'from-konkan-gold/10 to-amber-50',
  },
  {
    name: 'Priya Tendulkar',
    location: 'Bangalore, Karnataka',
    rating: 4,
    text: 'Ordered Sol Kadhi concentrate and it was incredible. Tastes just like homemade. Also got Kokum juice which is refreshing. Fast delivery and great packaging. Will order again!',
    product: 'Kokum & Beverages',
    avatar: 'PT',
    bg: 'from-konkan-saffron/10 to-orange-50',
  },
  {
    name: 'Vijay Phadke',
    location: 'Nashik, Maharashtra',
    rating: 5,
    text: 'The Indrayani rice is phenomenal. The aroma while cooking fills the whole house. Reminds me of the rice from my village in Konkan. Absolutely authentic!',
    product: 'Konkan Rice',
    avatar: 'VP',
    bg: 'from-amber-100/50 to-konkan-cream',
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const t = testimonials[active];

  return (
    <section className="bg-gradient-to-br from-konkan-cream to-white rounded-2xl p-6 md:p-10">
      <div className="text-center mb-8">
        <h2 className="section-title">What Our Customers Say</h2>
        <p className="section-subtitle">Real stories from people who love Kokan Ghar</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-card">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.bg} flex items-center justify-center font-display font-bold text-konkan-green-primary text-lg`}>
              {t.avatar}
            </div>
            <div>
              <h4 className="font-display font-bold text-konkan-text-primary">{t.name}</h4>
              <p className="text-xs text-konkan-text-secondary">{t.location}</p>
            </div>
            <div className="ml-auto">
              <StarRating rating={t.rating} size="sm" />
            </div>
          </div>

          <p className="text-konkan-text-primary leading-relaxed mb-4">
            "{t.text}"
          </p>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-konkan-text-secondary">Verified Purchase:</span>
            <span className="font-medium text-konkan-green-primary">{t.product}</span>
          </div>
        </div>

        {/* Dot Navigation */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === active
                  ? 'bg-konkan-green-primary w-6'
                  : 'bg-konkan-sand hover:bg-konkan-green-primary/50'
              }`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
