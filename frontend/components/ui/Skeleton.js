export default function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    heading: 'h-8 w-1/2',
    avatar: 'h-12 w-12 rounded-full',
    image: 'aspect-square w-full rounded-xl',
    card: 'h-64 w-full rounded-xl',
    button: 'h-10 w-24 rounded-lg',
    chip: 'h-8 w-20 rounded-full',
    badge: 'h-5 w-16 rounded-full',
    price: 'h-5 w-24',
  };

  return (
    <div
      className={`skeleton ${variants[variant] || variants.text} ${className}`}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton variant="image" />
      <Skeleton variant="chip" />
      <Skeleton variant="title" />
      <Skeleton variant="text" />
      <div className="flex items-center gap-2">
        <Skeleton variant="price" />
        <Skeleton variant="badge" />
      </div>
      <Skeleton variant="button" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container-custom py-8 space-y-8">
      <Skeleton variant="text" className="w-1/4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton variant="image" className="aspect-square" />
        <div className="space-y-4">
          <Skeleton variant="heading" />
          <Skeleton variant="text" />
          <Skeleton variant="text" className="w-2/3" />
          <div className="flex gap-2">
            <Skeleton variant="price" />
            <Skeleton variant="badge" />
          </div>
          <Skeleton variant="button" className="w-full" />
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-4 flex gap-4">
          <Skeleton variant="image" className="w-20 h-20 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="title" />
            <Skeleton variant="text" className="w-1/4" />
            <Skeleton variant="button" className="w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
