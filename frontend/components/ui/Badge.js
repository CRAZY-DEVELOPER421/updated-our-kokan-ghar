'use client';

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-konkan-sand text-konkan-text-primary',
    primary: 'bg-konkan-green-primary text-white',
    accent: 'bg-konkan-saffron text-white',
    success: 'bg-konkan-success text-white',
    error: 'bg-konkan-error text-white',
    gold: 'bg-konkan-gold text-white',
    ocean: 'bg-konkan-ocean text-white',
    sale: 'bg-red-500 text-white animate-pulse-glow',
    organic: 'bg-green-600 text-white',
    new: 'bg-blue-500 text-white',
    seasonal: 'bg-purple-500 text-white',
    outOfStock: 'bg-gray-400 text-white',
  };

  return (
    <span className={`badge ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
