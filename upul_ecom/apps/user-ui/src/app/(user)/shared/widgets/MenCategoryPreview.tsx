import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query'; // Assuming library
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Assuming icons
import Link from 'next/link';
import axiosInstance from '@/app/utils/axiosInstance';
import ProductCard from '../shop-components/ProductCard';

const MenCategoryPreview = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['men-preview'],
    queryFn: async () => {
      // Your fetch logic here
      const res = await axiosInstance.get('/api/products/shop?category=men&limit=8', { isPublic: true });
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const products = data?.products || [];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-white border-b border-gray-50 font-outfit">
      <div className="max-w-8xl mx-auto px-5">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-10 pb-4 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-gray-900">
              Men
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Latest from the studio
            </span>
          </div>

          <Link
            href="/shop?category=men"
            className="text-[10px] font-black uppercase tracking-widest border border-black px-6 py-3 hover:bg-black hover:text-white transition-all"
          >
            View All
          </Link>
        </div>

        {/* Carousel Wrapper */}
        {/* 1. CHANGED: Added unique name 'group/carousel' */}
        <div className="relative group/carousel">
          
          {/* Navigation Arrows */}
          <button 
            onClick={() => scroll('left')}
            /* 2. CHANGED: Updated to 'group-hover/carousel' so it only responds to the wrapper */
            className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white border border-gray-200 shadow-sm hover:bg-black hover:text-white transition-all hidden md:flex items-center justify-center rounded-full opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>

          <button 
            onClick={() => scroll('right')}
            /* 2. CHANGED: Updated to 'group-hover/carousel' */
            className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white border border-gray-200 shadow-sm hover:bg-black hover:text-white transition-all hidden md:flex items-center justify-center rounded-full opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>

          {/* Scroll Container */}
          <div 
            ref={scrollRef}
            className="flex items-stretch gap-x-4 md:gap-x-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-6 cursor-grab active:cursor-grabbing select-none"
          >
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="min-w-[75vw] md:min-w-[calc(25%-18px)] space-y-4 animate-pulse">
                  <div className="aspect-[3/4] bg-gray-100 rounded-sm" />
                  <div className="h-4 bg-gray-100 w-2/3" />
                </div>
              ))
            ) : (
              products.map((product: any) => (
                <div
                  key={product.id}
                  /* 3. CHANGED: Added standard 'group' here so the ProductCard knows when it specifically is hovered */
                  className="min-w-[75vw] md:min-w-[calc(25%-18px)] snap-start snap-always flex flex-col group"
                >
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};

export default MenCategoryPreview