'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl card hover:shadow-card-hover transition-all">
      <Link href={`/products/${item.slug}`} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-konkan-cream">
        {item.image ? <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-6 h-6 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.slug}`} className="font-display font-bold text-konkan-text-primary hover:text-konkan-green-primary transition-colors line-clamp-1">{item.name}</Link>
        {item.variant_name && <p className="text-xs text-konkan-text-secondary mt-0.5">{item.variant_name}: {item.variant_value}</p>}
        <div className="flex items-center gap-2 mt-1"><span className="font-bold text-konkan-saffron">₹{item.price}</span>{item.mrp > item.price && <span className="text-xs text-konkan-text-secondary line-through">₹{item.mrp}</span>}</div>
        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => onRemove(item.id)} className="px-2.5 py-1 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Remove
          </button>
          <div className="flex items-center border border-konkan-sand rounded-lg">
            <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors text-sm">−</button>
            <span className="px-3 py-1 text-sm font-medium border-x border-konkan-sand min-w-[32px] text-center">{item.quantity}</span>
            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors text-sm">+</button>
          </div>
        </div>
      </div>
      <div className="text-right shrink-0"><p className="font-bold text-konkan-text-primary">₹{item.price * item.quantity}</p></div>
    </div>
  );
}
