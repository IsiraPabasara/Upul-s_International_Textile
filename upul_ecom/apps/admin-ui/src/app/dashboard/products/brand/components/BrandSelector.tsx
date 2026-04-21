'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import { Check, ChevronDown, Tag, Loader2 } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface BrandSelectorProps {
  selectedBrand: string; // 🟢 We are using the Brand NAME string (e.g., "Deedat")
  onChange: (brandName: string) => void; // 🟢 Send the NAME back to the form
}

export default function BrandSelector({ selectedBrand, onChange }: BrandSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/brands', { isPublic: true });
      return res.data;
    },
  });

  // 🟢 Find the brand object by matching the exact brand NAME
  const selectedBrandObj = brands.find(b => b.name === selectedBrand);

  const baseInputStyles = "w-full h-[44px] sm:h-[46px] px-3 sm:px-4 bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition-all text-sm sm:text-base font-medium";

  return (
    <div className="w-full">
      <div ref={dropdownRef} className="relative w-full group">
        
        <button
          type="button"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          className={`${baseInputStyles} flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-800/50 ${isOpen ? 'ring-4 ring-blue-500/10 border-blue-500 bg-white dark:bg-slate-900' : ''} ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            ) : selectedBrandObj?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={selectedBrandObj.logoUrl} 
                alt={selectedBrandObj.name} 
                className="w-6 h-6 rounded-full object-contain bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shrink-0 shadow-sm p-0.5" 
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            ) : selectedBrandObj ? (
               <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm text-gray-400">
                 <Tag size={12} strokeWidth={2.5} />
               </div>
            ) : null}
            
            <span className={`block truncate ${selectedBrand ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400'}`}>
              {/* 🟢 Show the selected brand name */}
              {isLoading ? 'Loading brands...' : (selectedBrand || 'Select a Brand')}
            </span>
          </div>

          <ChevronDown 
            size={18} 
            strokeWidth={2.5} 
            className={`shrink-0 ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'text-gray-400 group-hover:text-blue-500'}`} 
          />
        </button>
        
        {isOpen && !isLoading && (
          <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl max-h-[280px] overflow-y-auto py-2 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 custom-scrollbar">
            {brands.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center font-medium flex flex-col items-center gap-2">
                <Tag size={24} className="opacity-20" />
                <p>No brands found.</p>
                <p className="text-xs">Add them in the Brand Manager.</p>
              </div>
            ) : (
              brands
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => {
                      onChange(brand.name); // 🟢 Send the string NAME back to React Hook Form
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 text-sm sm:text-base transition-colors ${
                      selectedBrand === brand.name // 🟢 Highlight if the names match
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {brand.logoUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img 
                           src={brand.logoUrl} 
                           alt={brand.name} 
                           className="w-7 h-7 rounded-full object-contain bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shrink-0 shadow-sm p-0.5" 
                           onError={(e) => (e.currentTarget.style.display = 'none')}
                         />
                      ) : (
                         <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm text-gray-400">
                           <Tag size={14} strokeWidth={2.5} />
                         </div>
                      )}
                      <span className="truncate">{brand.name}</span>
                    </div>

                    {selectedBrand === brand.name && (
                       <Check size={16} strokeWidth={3} className="shrink-0 ml-3 animate-in zoom-in duration-200" />
                    )}
                  </button>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}