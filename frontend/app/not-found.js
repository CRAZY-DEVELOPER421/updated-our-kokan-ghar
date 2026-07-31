import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-display font-bold text-konkan-sand mb-4">404</div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary mb-3">
          Oops! This page drifted away like monsoon clouds...
        </h1>
        <p className="text-konkan-text-secondary mb-8">
          The page you are looking for might have been washed away by the tides. 
          Let us help you find your way back to authentic Konkan products.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/products" className="btn-secondary">
            Browse Products
          </Link>
        </div>
        <div className="mt-8 text-konkan-sand text-sm">
          <p>Or try searching for what you need</p>
          <Link href="/search" className="text-konkan-green-primary hover:underline font-medium">
            Search Konkan Bazaar
          </Link>
        </div>
      </div>
    </div>
  );
}
