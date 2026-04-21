'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SortSectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'newest';

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    params.set('page', '1');
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-500 uppercase font-outfit hidden sm:block">Sort By:</label>
      <select 
        value={currentSort} 
        onChange={handleSortChange}
        className="text-sm border-none bg-transparent font-semibold focus:ring-0 cursor-pointer outline-none font-outfit hover:text-gray-600"
      >
        <option value="newest">Newest Arrivals</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="oldest">Oldest Items</option>
      </select>
    </div>
  );
}

export default function SortSection() {
  return (
    <Suspense fallback={null}>
      <SortSectionContent />
    </Suspense>
  );
}