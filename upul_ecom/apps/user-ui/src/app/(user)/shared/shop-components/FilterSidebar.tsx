'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import { ChevronDown, ChevronRight, Minus, Check, X, RotateCcw } from 'lucide-react';

// --- Helper: Build Tree ---
const buildCategoryTree = (categories: any[]) => {
  const map: any = {};
  const roots: any[] = [];
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  categories.forEach((cat) => {
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(map[cat.id]);
    } else {
      roots.push(map[cat.id]);
    }
  });
  return roots;
};

// --- Helper: Check Descendants ---
const isDescendantActive = (category: any, currentSlug: string | null): boolean => {
  if (!currentSlug || !category.children) return false;
  return category.children.some((child: any) =>
    child.slug === currentSlug || isDescendantActive(child, currentSlug)
  );
};

// --- Component: Category Item ---
const CategoryItem = ({ category, currentSlug }: { category: any; currentSlug: string | null }) => {
  const router = useRouter();
  const isActive = currentSlug === category.slug;
  const hasActiveChild = useMemo(() => isDescendantActive(category, currentSlug), [category, currentSlug]);

  const [isOpen, setIsOpen] = useState(isActive || hasActiveChild);
  const hasChildren = category.children && category.children.length > 0;

  useEffect(() => {
    if (isActive || hasActiveChild) {
      setIsOpen(true);
    }
  }, [isActive, hasActiveChild]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) setIsOpen(true);
    if (!isActive) router.push(`/shop?category=${category.slug}`);
  };

  return (
    <div className="pl-3 border-l border-gray-100 ml-1">
      <div className="flex items-center justify-between py-1 text-sm group">
        <span
          onClick={handleNavigate}
          className={`cursor-pointer flex-1 transition-colors ${
            isActive ? 'font-bold text-black' : 'text-gray-500 hover:text-black'
          }`}
        >
          {category.name}
        </span>

        {hasChildren && (
          <button
            onClick={handleToggle}
            className="p-1 text-gray-300 hover:text-black hover:bg-gray-100 rounded transition-colors"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {category.children.map((child: any) => (
            <CategoryItem key={child.id} category={child} currentSlug={currentSlug} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Sidebar Component ---
interface FilterSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function FilterSidebarContent({ isOpen = false, onClose }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const MIN_LIMIT = 0;
  const MAX_LIMIT = 50000; 

  const currentCategory = searchParams.get('category');
  const currentBrand = searchParams.get('brand');
  const currentAvailability = searchParams.get('availability');
  const isNewArrival = searchParams.get('isNewArrival') === 'true';

  const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || MIN_LIMIT);
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || MAX_LIMIT);

  useEffect(() => {
    setMinPrice(Number(searchParams.get('minPrice')) || MIN_LIMIT);
    setMaxPrice(Number(searchParams.get('maxPrice')) || MAX_LIMIT);
  }, [searchParams]);

  const prevParamsRef = useRef(searchParams.toString());

  useEffect(() => {
    const currentParams = searchParams.toString();
    if (currentParams !== prevParamsRef.current) {
      if (onClose) onClose();
      prevParamsRef.current = currentParams;
    }
  }, [searchParams, onClose]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/categories?tree=true', { isPublic: true });
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands-all'],
    queryFn: async () => (await axiosInstance.get('/api/brands', { isPublic: true })).data,
    staleTime: 1000 * 60 * 30,
  });

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('minPrice', minPrice.toString());
    params.set('maxPrice', maxPrice.toString());
    router.push(`/shop?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push('/shop');
  };

  const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val <= maxPrice) setMinPrice(val);
  };

  const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val >= minPrice) setMaxPrice(val);
  };

  const toggleAvailability = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentAvailability === value) {
      params.delete('availability');
    } else {
      params.set('availability', value);
    }
    router.push(`/shop?${params.toString()}`);
  };

  const toggleNewArrival = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isNewArrival) {
      params.delete('isNewArrival');
    } else {
      params.set('isNewArrival', 'true');
      params.delete('category'); 
    }
    router.push(`/shop?${params.toString()}`);
  };

  const sidebarContent = (
    <div className="space-y-10">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black font-outfit">Filters</h3>
        <button 
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs font-bold font-outfit uppercase text-gray-900 hover:text-red-600 transition-colors"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* 1. Collection Section */}
      <div className='font-outfit'>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-900 mb-4">Collection</h3>
        <div className="space-y-1">
          <div
            onClick={() => router.push('/shop')}
            className={`pl-3 border-l ml-1 py-1 cursor-pointer text-sm hover:text-black transition-all ${
              !currentCategory && !isNewArrival ? 'font-bold border-black text-black' : 'border-transparent text-gray-400'
            }`}
          >
            All Products
          </div>
          <div
            onClick={toggleNewArrival}
            className={`pl-3 border-l ml-1 py-1 cursor-pointer text-sm hover:text-black transition-all ${
              isNewArrival ? 'font-bold border-black text-black' : 'border-transparent text-gray-400'
            }`}
          >
            New Arrivals
          </div>
        </div>
      </div>

      {/* 2. Separate Categories Section */}
      <div className='font-outfit'>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-900 mb-4">Categories</h3>
        <div className="space-y-1">
           {categoryTree.map((cat: any) => (
              <CategoryItem key={cat.id} category={cat} currentSlug={currentCategory} />
            ))}

            <div className="pl-3 border-l border-gray-100 ml-1">
              <div className="flex items-center justify-between py-1 text-sm group">
                <span
                  onClick={() => router.push('/shop?hasDiscount=true')}
                  className={`cursor-pointer flex-1 transition-colors ${
                    searchParams.get('hasDiscount') === 'true'
                      ? 'font-bold text-black' 
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Sales
                </span>
              </div>
            </div>
        </div>
      </div>

      {/* PRICE RANGE SLIDER + INPUTS */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-900 mb-8 font-outfit">Price Range</h3>
        <div className="px-2">
          <div className="relative h-1 w-full bg-gray-100 rounded-full mb-8">
            <div 
              className="absolute h-full bg-black rounded-full"
              style={{ 
                left: `${(minPrice / MAX_LIMIT) * 100}%`, 
                right: `${100 - (maxPrice / MAX_LIMIT) * 100}%` 
              }}
            />
            <input
              type="range"
              min={MIN_LIMIT}
              max={MAX_LIMIT}
              step={100}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 100))}
              className="absolute w-full -top-0.5 h-2 appearance-none bg-transparent pointer-events-none z-20 slider-thumb"
            />
            <input
              type="range"
              min={MIN_LIMIT}
              max={MAX_LIMIT}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 100))}
              className="absolute w-full -top-0.5 h-2 appearance-none bg-transparent pointer-events-none z-20 slider-thumb"
            />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">Rs.</span>
              <input 
                type="number"
                value={minPrice}
                onChange={handleMinInput}
                className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded text-xs font-bold outline-none focus:border-black transition-colors"
              />
            </div>
            <Minus size={12} className="text-gray-300" />
            <div className="flex-1 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">Rs.</span>
              <input 
                type="number"
                value={maxPrice}
                onChange={handleMaxInput}
                className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded text-xs font-bold outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <button
            onClick={applyPriceFilter}
            className="w-full py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-zinc-800 transition-colors"
          >
            Apply Filter
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-900 mb-4 font-outfit">Brands</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar text-gray-500">
          {brands.map((brand: any) => {
            const isSelected = currentBrand === brand.name;
            return (
              <div
                key={brand.id}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  isSelected ? params.delete('brand') : params.set('brand', brand.name);
                  router.push(`/shop?${params.toString()}`);
                }}
                className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-black border-black' : 'border-gray-200 group-hover:border-gray-400'
                }`}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
                <span className={`text-sm font-outfit transition-colors ${isSelected ? 'font-bold text-black' : ''}`}>
                  {brand.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-900 mb-4 font-outfit">Availability</h3>
        <div className="space-y-2 text-gray-500 md:pb-10">
          {[
            { label: 'In Stock', value: 'in-stock' },
            { label: 'Out of Stock', value: 'out-of-stock' }
          ].map((item) => {
            const isSelected = currentAvailability === item.value;
            return (
              <div
                key={item.value}
                onClick={() => toggleAvailability(item.value)}
                className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-black border-black' : 'border-gray-200 group-hover:border-gray-400'
                }`}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
                <span className={`text-sm font-outfit transition-colors ${isSelected ? 'font-bold text-black' : ''}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          pointer-events: auto;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #000;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 0 1px #e5e7eb;
        }
        .slider-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #000;
          border: 2px solid #fff;
          cursor: pointer;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-64 flex-shrink-0 pr-6 border-r border-gray-100 pt-2">
        {sidebarContent}
      </aside>

      <div className={`md:hidden fixed inset-0 z-[100] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={onClose} 
        />
        <aside
          className={`absolute top-0 left-0 w-[85%] max-w-xs h-full bg-white transition-transform duration-300 ease-out transform ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest">Filter By</h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pb-24">
              {sidebarContent}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function FilterSidebar(props: FilterSidebarProps) {
  return (
    <Suspense fallback={<div className="hidden md:block w-64 flex-shrink-0 pr-6 border-r border-gray-100 pt-2"><p>Loading filters...</p></div>}>
      <FilterSidebarContent {...props} />
    </Suspense>
  );
}