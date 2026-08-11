'use client';

import { useParams } from 'next/navigation';
import HeroSlideBuilder from '@/components/HeroSlideBuilder';

export default function EditHeroSlidePage() {
  const { id } = useParams();
  return <HeroSlideBuilder slideId={id} />;
}
