'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SORT_OPTIONS = [
  { label: 'Name: A to Z', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Discount: High to Low', value: 'discount_desc' },
  { label: 'Avg. Rating', value: 'rating' },
  { label: 'Newest First', value: 'newest' },
];

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get('sort') || 'relevance';

  const handleChange = (value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'relevance') {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-konkan-text-secondary whitespace-nowrap">Sort by:</label>
      <Select value={activeSort} onValueChange={handleChange}>
        <SelectTrigger id="sort" className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
