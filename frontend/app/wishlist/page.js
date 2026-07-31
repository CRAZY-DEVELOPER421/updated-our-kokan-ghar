'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WishlistRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/account/wishlist'); }, [router]);
  return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-6 h-6 border-2 border-konkan-green-primary border-t-transparent rounded-full animate-spin" /></div>;
}
