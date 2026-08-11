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


