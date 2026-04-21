"use client";

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import axiosInstance from '@/app/utils/axiosInstance';
import ProductCard from '../shop-components/ProductCard';

interface RelatedProductsProps {
  categorySlugs: string[]; 
  currentProductId: string;
  categoryName?: string;
}

const RelatedProducts = ({ categorySlugs, currentProductId, categoryName }: RelatedProductsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const TARGET_TOTAL = 8; 
  const MAX_RELATED = 5; // Force at least 3 spots for random products

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['related-products', categorySlugs, currentProductId],
    queryFn: async () => {
      let fetchedProducts: any[] = [];

      // 🟢 STEP 1: Fetch Related Products (Capped at MAX_RELATED)
      for (const slug of categorySlugs) {
        if (fetchedProducts.length >= MAX_RELATED) break;

        const res = await axiosInstance.get(`/api/products/shop?category=${slug}&limit=12`, { isPublic: true });
        const newProducts = res.data.products || [];

        for (const p of newProducts) {
          if (p.id !== currentProductId && !fetchedProducts.some(existing => existing.id === p.id)) {
            fetchedProducts.push(p);
          }
          if (fetchedProducts.length >= MAX_RELATED) break;
        }
      }

      // 🟢 STEP 2: Fetch Random Products to fill the remaining slots
      if (fetchedProducts.length < TARGET_TOTAL) {
        const res = await axiosInstance.get(`/api/products/shop?limit=24`, { isPublic: true });
        let randomProducts = res.data.products || [];

        // Shuffle the pool of random products
        randomProducts = randomProducts.sort(() => 0.5 - Math.random());

        for (const p of randomProducts) {
          if (p.id !== currentProductId && !fetchedProducts.some(existing => existing.id === p.id)) {
            fetchedProducts.push(p);
          }
          if (fetchedProducts.length >= TARGET_TOTAL) break;
        }
      }

      // 🟢 STEP 3: Shuffle the final combined list so random items are mixed in
      return fetchedProducts.sort(() => 0.5 - Math.random());
    },
    enabled: !!currentProductId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="bg-white border-t border-gray-50 font-outfit mt-16 py-12">
      <div className="max-w-7xl mx-auto px-5">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-10 pb-4 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-gray-900">
              You May Also Like
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              More from {categoryName || 'our collection'}
            </span>
          </div>

          {products.length > 0 && categorySlugs.length > 0 && (
            <Link
              href={`/shop?category=${categorySlugs[0]}`}
              className="text-[10px] font-black uppercase tracking-widest border border-black px-6 py-3 hover:bg-black hover:text-white transition-all"
            >
              View All
            </Link>
          )}
        </div>

        {/* Carousel Wrapper */}
        <div className="relative group/carousel">
          
          {products.length > 0 && (
            <>
              <button 
                onClick={() => scroll('left')}
                className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white border border-gray-200 shadow-sm hover:bg-black hover:text-white transition-all hidden md:flex items-center justify-center rounded-full opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
              >
                <ChevronLeft size={20} />
              </button>

              <button 
                onClick={() => scroll('right')}
                className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white border border-gray-200 shadow-sm hover:bg-black hover:text-white transition-all hidden md:flex items-center justify-center rounded-full opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Scroll Container */}
          <div 
            ref={scrollRef}
            className="flex items-stretch gap-x-4 md:gap-x-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-6 cursor-grab active:cursor-grabbing select-none"
          >
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="min-w-[75vw] md:min-w-[calc(25%-18px)] space-y-4 animate-pulse">
                  <div className="aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center">
                    <Loader2 className="animate-spin text-gray-300" size={32} />
                  </div>
                  <div className="h-4 bg-gray-100 w-2/3 rounded" />
                </div>
              ))
            ) : (
              products.map((product: any) => (
                <div
                  key={product.id}
                  className="min-w-[75vw] md:min-w-[calc(25%-18px)] snap-start snap-always flex flex-col group"
                >
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};

export default RelatedProducts;