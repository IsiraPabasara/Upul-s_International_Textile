'use client';

import { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import FilterSidebar from '@/app/(user)/shared/shop-components/FilterSidebar';
import SortSection from '@/app/(user)/shared/shop-components/SortSection';
import ProductCard from '@/app/(user)/shared/shop-components/ProductCard';
import Pagination from '@/app/(user)/shared/shop-components/Pagination';
import { Filter } from 'lucide-react';

interface ShopResponse {
  products: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- Internal Components ---
const GridIcon = ({ columns, active }: { columns: number, active: boolean }) => (
  <div className={`flex gap-[2px] h-3.5 ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'} transition-opacity`}>
    {Array.from({ length: columns }).map((_, i) => (
      <div key={i} className={`w-1 rounded-[1px] h-full ${active ? 'bg-black' : 'bg-gray-900'}`} />
    ))}
  </div>
);

const Breadcrumbs = ({ 
  category, 
  search, 
  isNewArrival 
}: { 
  category?: string | null; 
  search?: string | null; 
  isNewArrival: boolean 
}) => (
  <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4 md:mb-4 font-outfit mt-5 md:mt-1">
    <a href="/" className="hover:text-black transition-colors">Home</a>
    <span>/</span>
    <a href="/shop" className={`${!category && !search && !isNewArrival ? 'text-black font-bold' : 'hover:text-black'}`}>Shop</a>
    
    {/* Breadcrumb for New Arrivals */}
    {isNewArrival && (
      <>
        <span>/</span>
        <span className="text-black font-bold">New Arrivals</span>
      </>
    )}
    
    {category && (
      <>
        <span>/</span>
        <span className="text-black font-bold">{category.replace(/-/g, ' ')}</span>
      </>
    )}
    {search && (
      <>
        <span>/</span>
        <span className="text-black font-bold">Search</span>
      </>
    )}
  </nav>
);

// ✅ Renamed from 'export default function ShopPage' to 'function ShopContent'
function ShopContent() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search');
  const categorySlug = searchParams.get('category');
  
  // Check for isNewArrival parameter
  const isNewArrival = searchParams.get('isNewArrival') === 'true';

  // State
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [desktopGrid, setDesktopGrid] = useState<3 | 4 | 6>(4);
  const [mobileGrid, setMobileGrid] = useState<1 | 2>(2);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', 
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileFiltersOpen]);

  const dynamicLimit = useMemo(() => {
    if (!mounted) return 12; 
    
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return mobileGrid === 1 ? 8 : 12;
    }
    if (desktopGrid === 3) return 12;
    if (desktopGrid === 4) return 16;
    return 24; 
  }, [desktopGrid, mobileGrid, mounted]);

  const closeMobileFilters = useCallback(() => {
    setIsMobileFiltersOpen(false);
  }, []);

  const { data, isLoading } = useQuery<ShopResponse>({
    queryKey: ['shop-products', searchParams.toString(), dynamicLimit],
    queryFn: async () => {
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has('page')) {
        params.set('page', '1');
      }
      params.set('limit', dynamicLimit.toString());
      const res = await axiosInstance.get(`/api/products/shop?${params.toString()}`, { isPublic: true });
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
    enabled: mounted, 
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: dynamicLimit, totalPages: 1 };

  const getGridClasses = () => {
    if (!mounted) return "grid-cols-2 lg:grid-cols-4"; 
    
    const mobileClass = mobileGrid === 1 ? "grid-cols-1" : "grid-cols-2";
    let desktopClass = "lg:grid-cols-3 xl:grid-cols-4";
    if (desktopGrid === 3) desktopClass = "lg:grid-cols-3";
    if (desktopGrid === 6) desktopClass = "lg:grid-cols-4 xl:grid-cols-6";
    return `${mobileClass} ${desktopClass}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (params.get('page') && params.get('page') !== '1') {
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [dynamicLimit, pathname, router, searchParams]); // Added missing dependencies to avoid linter warnings

  return (
    <div className="min-h-screen bg-white mb-10">
      <div className="mx-auto px-5 mt-12 md:mt-2 md:pt-5 font-outfit max-w-8xl">
        <Breadcrumbs category={categorySlug} search={searchTerm} isNewArrival={isNewArrival} />

        <div className="flex flex-col md:flex-row gap-10">
          <FilterSidebar isOpen={isMobileFiltersOpen} onClose={closeMobileFilters} />

          <main className="flex-1">
            {/* Header Section */}
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-gray-100">
              <div className="flex flex-col gap-1">
                 <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-gray-900">
                    {/* Conditional Title Logic */}
                    {searchTerm 
                      ? `Search: "${searchTerm}"` 
                      : isNewArrival 
                        ? 'New Arrivals' 
                        : categorySlug 
                          ? categorySlug.replace(/-/g, ' ') 
                          : 'All Collection'}
                 </h1>
                 {!isLoading && mounted && (
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {pagination.total} Products Found
                    </span>
                 )}
              </div>
              
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2 border-r border-gray-200 pr-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2">View</span>
                    {[3, 4, 6].map((col) => (
                        <button
                            key={col}
                            onClick={() => setDesktopGrid(col as 3 | 4 | 6)}
                            className={`p-2 rounded group transition-all ${desktopGrid === col ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        >
                            <GridIcon columns={col} active={desktopGrid === col} />
                        </button>
                    ))}
                </div>
                <SortSection />
              </div>
            </div>

            {/* Mobile View Controls */}
            <div className="md:hidden flex justify-between items-center mb-6 gap-4">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="px-4 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest border border-black py-3 bg-white flex-1"
              >
                <Filter size={14} /> Filter
              </button>

              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
                    {[1, 2].map((col) => (
                        <button
                            key={col}
                            onClick={() => setMobileGrid(col as 1 | 2)}
                            className={`p-2 rounded group transition-all ${mobileGrid === col ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        >
                            <GridIcon columns={col} active={mobileGrid === col} />
                        </button>
                    ))}
                 </div>
                 <SortSection />
              </div>
            </div>

            {/* Product Grid / Loading State */}
            {(!mounted || isLoading) ? (
              <div className={`grid gap-6 animate-pulse ${getGridClasses()}`}>
                {[...Array(mounted ? dynamicLimit : 12)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[3/4] bg-gray-100 rounded-xl" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid gap-x-4 md:gap-x-6 gap-y-10 transition-all duration-300 ${getGridClasses()}`}>
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Pagination 
                  currentPage={pagination.page} 
                  totalPages={pagination.totalPages} 
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                <p className="text-lg font-medium text-gray-900">No products found</p>
                <button 
                  onClick={() => (window.location.href = '/shop')} 
                  className="mt-4 text-xs font-bold uppercase tracking-widest underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ShopContent />
    </Suspense>
  );
}