'use client';

import { useState, useEffect } from 'react';
import StarRating from '@/components/ui/StarRating';

// ===== Product Variants =====
export function ProductVariants({ variants = [] }) {
  const [selected, setSelected] = useState(variants[0]?.variant_value || '');
  return (
    <div>
      <span className="text-sm font-medium text-konkan-text-primary">{variants[0]?.variant_name || 'Variant'}:</span>
      <div className="flex flex-wrap gap-2 mt-1">
        {variants.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelected(v.variant_value)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
              selected === v.variant_value
                ? 'border-konkan-green-primary bg-konkan-green-primary/5 text-konkan-green-primary font-medium'
                : 'border-konkan-sand text-konkan-text-secondary hover:border-konkan-green-primary'
            }`}
          >
            {v.variant_value}
            {v.price_modifier !== 0 && (
              <span className="ml-1 text-xs">{v.price_modifier > 0 ? '+' : ''}₹{v.price_modifier}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== Quantity Stepper =====
export function QuantityStepper({ stock = 0 }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="flex items-center border border-konkan-sand rounded-lg">
      <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1.5 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors">−</button>
      <span className="px-4 py-1.5 text-sm font-medium border-x border-konkan-sand min-w-[40px] text-center">{qty}</span>
      <button onClick={() => setQty(Math.min(stock || 99, qty + 1))} className="px-3 py-1.5 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors">+</button>
    </div>
  );
}

// ===== Pincode Checker =====
export function PincodeChecker() {
  const [pincode, setPincode] = useState('');
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <svg className="w-4 h-4 text-konkan-green-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <input
        type="text"
        value={pincode}
        onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setChecked(false); }}
        placeholder="Check delivery pincode"
        maxLength={6}
        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-konkan-sand bg-white focus:ring-2 focus:ring-konkan-green-primary/30 focus:border-konkan-green-primary outline-none"
      />
      <button
        onClick={() => pincode.length === 6 && setChecked(true)}
        className="px-3 py-1.5 text-sm font-medium text-white bg-konkan-green-primary rounded-lg hover:bg-konkan-green-dark transition-colors disabled:opacity-50"
        disabled={pincode.length !== 6}
      >
        Check
      </button>
      {checked && <span className="text-xs text-konkan-success">✓ Delivery available</span>}
    </div>
  );
}

// ===== Product Tabs =====
export function ProductTabs({ product }) {
  const [activeTab, setActiveTab] = useState('description');

  const tabs = [
    { key: 'description', label: 'Description' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'storage', label: 'Storage' },
    { key: 'faq', label: 'FAQ' },
  ];

  const renderNutrition = (info) => {
    if (!info) return <p className="text-konkan-text-secondary">Nutritional information not available.</p>;
    const parsed = typeof info === 'string' ? JSON.parse(info) : info;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-konkan-sand/50">
              <th className="text-left py-2 font-medium text-konkan-text-primary">Nutrient</th>
              <th className="text-right py-2 font-medium text-konkan-text-primary">Per Serving</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(parsed).map(([key, value]) => (
              <tr key={key} className="border-b border-konkan-sand/20">
                <td className="py-2 text-konkan-text-secondary capitalize">{key.replace(/_/g, ' ')}</td>
                <td className="py-2 text-right text-konkan-text-primary">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="flex border-b border-konkan-sand/50 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 md:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-konkan-green-primary text-konkan-green-primary'
                : 'border-transparent text-konkan-text-secondary hover:text-konkan-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6 bg-white rounded-b-xl">
        {activeTab === 'description' && (
          <div className="text-sm text-konkan-text-secondary leading-relaxed">
            {product.description ? (
              <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
            ) : (
              <p>No description available for this product.</p>
            )}
            {product.ingredients && (
              <>
                <h4 className="font-display font-bold text-konkan-text-primary mt-4 mb-2">Ingredients</h4>
                <p>{product.ingredients}</p>
              </>
            )}
            {product.region_origin && (
              <>
                <h4 className="font-display font-bold text-konkan-text-primary mt-4 mb-2">Region of Origin</h4>
                <p>{product.region_origin}</p>
              </>
            )}
          </div>
        )}

        {activeTab === 'nutrition' && renderNutrition(product.nutritional_info)}

        {activeTab === 'storage' && (
          <div className="text-sm text-konkan-text-secondary leading-relaxed">
            {product.storage_instructions ? (
              <div>
                <h4 className="font-display font-bold text-konkan-text-primary mb-2">Storage Instructions</h4>
                <p>{product.storage_instructions}</p>
                {product.shelf_life_days && <p className="mt-2">Shelf life: {product.shelf_life_days} days</p>}
              </div>
            ) : (
              <p>Store in a cool, dry place away from direct sunlight.</p>
            )}
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-4 text-sm">
            {[
              { q: 'How fresh is this product?', a: 'We source products directly from Konkan farmers and artisans. Most products are packed within 24-48 hours.' },
              { q: 'How is the product packed?', a: 'We use eco-friendly, food-grade packaging to ensure freshness during transit.' },
              { q: 'What is the return policy?', a: 'We accept returns within 7 days for damaged items. Perishable items cannot be returned once opened.' },
              { q: 'How long does delivery take?', a: 'Standard delivery takes 3-5 business days across India.' },
            ].map((faq, idx) => (
              <details key={idx} className="group">
                <summary className="cursor-pointer font-medium text-konkan-text-primary py-2 flex items-center justify-between">
                  {faq.q}
                  <svg className="w-4 h-4 text-konkan-text-secondary group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-konkan-text-secondary pb-2 pl-4">{faq.a}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Recently Viewed =====
export function RecentlyViewed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('konkan-recently-viewed');
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore corrupt or unavailable localStorage data
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-xl font-bold text-konkan-text-primary mb-4">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {items.map((item) => (
          <a key={item.id} href={`/products/${item.slug}`} className="min-w-[160px] bg-white rounded-xl card p-3 hover:shadow-card-hover transition-all shrink-0">
            <div className="aspect-square rounded-lg bg-konkan-cream mb-2 flex items-center justify-center">
              <svg className="w-8 h-8 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-konkan-text-primary truncate">{item.name}</p>
            <p className="text-xs text-konkan-saffron font-bold">₹{item.price}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
