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

const isDescendantActive = (category: any, currentSlug: string | null): boolean => {
  if (!currentSlug || !category.children) return false;
  return category.children.some((child: any) =>
    child.slug === currentSlug || isDescendantActive(child, currentSlug)
  );
};

// --- Component: Category Item ---
const CategoryItem = ({ 
  category, 
  currentSlug, 
  onNavigate 
}: { 
  category: any; 
  currentSlug: string | null;
  onNavigate: (slug: string) => void;
}) => {
  const hasActiveChild = useMemo(() => isDescendantActive(category, currentSlug), [category, currentSlug]);
  const isActive = currentSlug === category.slug;
  const [isOpen, setIsOpen] = useState(isActive || hasActiveChild);
  const hasChildren = category.children && category.children.length > 0;

  useEffect(() => {
    if (isActive || hasActiveChild) setIsOpen(true);
  }, [isActive, hasActiveChild]);

  return (
    <div className="pl-3 border-l border-gray-100 ml-1">
      <div className="flex items-center justify-between py-1 text-sm group">
        <span
          onClick={() => onNavigate(category.slug)}
          className={`cursor-pointer flex-1 transition-colors ${
            isActive ? 'font-bold text-black' : 'text-gray-500 hover:text-black'
          }`}
        >
          {category.name}
        </span>
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className="p-1 text-gray-300 hover:text-black hover:bg-gray-100 rounded transition-colors"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {category.children.map((child: any) => (
            <CategoryItem key={child.id} category={child} currentSlug={currentSlug} onNavigate={onNavigate} />
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
  const MAX_LIMIT = 10000; 

  const currentCategory = searchParams.get('category');
  const currentBrand = searchParams.get('brand');
  const currentAvailability = searchParams.get('availability');
  const isNewArrival = searchParams.get('isNewArrival') === 'true';
  const isSales = searchParams.get('hasDiscount') === 'true';

  const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || MIN_LIMIT);
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || MAX_LIMIT);

  useEffect(() => {
    setMinPrice(Number(searchParams.get('minPrice')) || MIN_LIMIT);
    setMaxPrice(Number(searchParams.get('maxPrice')) || MAX_LIMIT);
  }, [searchParams]);

  // Handle auto-close on mobile
  const prevParamsRef = useRef(searchParams.toString());
  useEffect(() => {
    if (searchParams.toString() !== prevParamsRef.current) {
      if (onClose) onClose();
      prevParamsRef.current = searchParams.toString();
    }
  }, [searchParams, onClose]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => (await axiosInstance.get('/api/categories?tree=true', { isPublic: true })).data,
    staleTime: 1000 * 60 * 30,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands-all'],
    queryFn: async () => (await axiosInstance.get('/api/brands', { isPublic: true })).data,
    staleTime: 1000 * 60 * 30,
  });

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  /**
   * Logic: Navigation targets (Category, New Arrival, Sales) clear each other.
   * Filters (Brand, Price, Availability) remain.
   */
  const handleCategoryNavigation = (type: 'category' | 'newArrival' | 'sales' | 'all', value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    params.delete('search');
    
    // Always clear the "Exclusive" group
    params.delete('category');
    params.delete('isNewArrival');
    params.delete('hasDiscount');

    if (type === 'category' && value) params.set('category', value);
    if (type === 'newArrival') params.set('isNewArrival', 'true');
    if (type === 'sales') params.set('hasDiscount', 'true');
    
    router.push(`/shop?${params.toString()}`);
  };

  // Standard filter update for Brands/Availability (non-exclusive)
  const handleFilterUpdate = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value === null) params.delete(key);
    else params.set(key, value);
    router.push(`/shop?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    params.set('minPrice', minPrice.toString());
    params.set('maxPrice', maxPrice.toString());
    router.push(`/shop?${params.toString()}`);
  };

  const sidebarContent = (
    <div className="space-y-10">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black font-outfit">Filters</h3>
        <button 
          onClick={() => router.push('/shop')}
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
            onClick={() => handleCategoryNavigation('all')}
            className={`pl-3 border-l ml-1 py-1 cursor-pointer text-sm hover:text-black transition-all ${
              !currentCategory && !isNewArrival && !isSales ? 'font-bold border-black text-black' : 'border-transparent text-gray-400'
            }`}
          >
            All Products
          </div>
          <div
            onClick={() => handleCategoryNavigation('newArrival')}
            className={`pl-3 border-l ml-1 py-1 cursor-pointer text-sm hover:text-black transition-all ${
              isNewArrival ? 'font-bold border-black text-black' : 'border-transparent text-gray-400'
            }`}
          >
            New Arrivals
          </div>
        </div>
      </div>

      {/* 2. Categories Section */}
      <div className='font-outfit'>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-900 mb-4">Categories</h3>
        <div className="space-y-1">
           {categoryTree.map((cat: any) => (
              <CategoryItem 
                key={cat.id} 
                category={cat} 
                currentSlug={currentCategory} 
                onNavigate={(slug) => handleCategoryNavigation('category', slug)}
              />
            ))}

            <div className="pl-3 border-l border-gray-100 ml-1">
              <div className="flex items-center justify-between py-1 text-sm group">
                <span
                  onClick={() => handleCategoryNavigation('sales')}
                  className={`cursor-pointer flex-1 transition-colors ${
                    isSales ? 'font-bold text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Sales
                </span>
              </div>
            </div>
        </div>
      </div>

      {/* 3. Price Range */}
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
              type="range" min={MIN_LIMIT} max={MAX_LIMIT} step={100} value={minPrice}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 100))}
              className="absolute w-full -top-0.5 h-2 appearance-none bg-transparent pointer-events-none z-20 slider-thumb"
            />
            <input
              type="range" min={MIN_LIMIT} max={MAX_LIMIT} step={100} value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 100))}
              className="absolute w-full -top-0.5 h-2 appearance-none bg-transparent pointer-events-none z-20 slider-thumb"
            />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">Rs.</span>
              <input 
                type="number" value={minPrice}
                onChange={(e) => setMinPrice(Math.min(Math.max(Number(e.target.value), MIN_LIMIT), maxPrice - 100))}
                className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded text-xs font-bold outline-none focus:border-black transition-colors"
              />
            </div>
            <Minus size={12} className="text-gray-300" />
            <div className="flex-1 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">Rs.</span>
              <input 
                type="number" value={maxPrice}
                onChange={(e) => setMaxPrice(Math.max(Math.min(Number(e.target.value), MAX_LIMIT), minPrice + 100))}
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

      {/* 4. Brands Section */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-900 mb-4 font-outfit">Brands</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar text-gray-500">
          {brands.map((brand: any) => {
            const isSelected = currentBrand === brand.name;
            return (
              <div
                key={brand.id}
                onClick={() => handleFilterUpdate('brand', isSelected ? null : brand.name)}
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

      {/* 5. Availability Section */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-900 mb-4 font-outfit">Availability</h3>
        <div className="space-y-2 text-gray-500 md:pb-10">
          {[{ label: 'In Stock', value: 'in-stock' }, { label: 'Out of Stock', value: 'out-of-stock' }].map((item) => {
            const isSelected = currentAvailability === item.value;
            return (
              <div
                key={item.value}
                onClick={() => handleFilterUpdate('availability', isSelected ? null : item.value)}
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
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .slider-thumb::-webkit-slider-thumb { appearance: none; pointer-events: auto; height: 14px; width: 14px; border-radius: 50%; background: #000; border: 2px solid #fff; cursor: pointer; box-shadow: 0 0 0 1px #e5e7eb; }
        .slider-thumb::-moz-range-thumb { pointer-events: auto; height: 14px; width: 14px; border-radius: 50%; background: #000; border: 2px solid #fff; cursor: pointer; }
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
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
        <aside className={`absolute top-0 left-0 w-[85%] max-w-xs h-full bg-white transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest">Filter By</h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pb-24">{sidebarContent}</div>
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