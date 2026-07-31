import { ProductGridSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="container-custom py-8 animate-fade-in">
      {/* Hero Skeleton */}
      <div className="skeleton h-[250px] lg:h-[500px] w-full rounded-2xl mb-8" />

      {/* Trust Badges */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>

      {/* Section Title */}
      <div className="skeleton h-8 w-48 mb-6" />

      {/* Product Grid */}
      <ProductGridSkeleton count={8} />
    </div>
  );
}
