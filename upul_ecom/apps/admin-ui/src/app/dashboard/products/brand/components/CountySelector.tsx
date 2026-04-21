'use client';

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import { ChevronDown, Loader2 } from 'lucide-react';

interface Country {
  id: string;
  name: string;
}

interface CountrySelectorProps {
  selectedCountry?: string; // 🟢 Renamed for clarity (it holds the string now)
  onChange: (name: string) => void;
}

export default function CountrySelector({ selectedCountry, onChange }: CountrySelectorProps) {
  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/products/meta/countries');
      return res.data;
    },
  });

  const baseInputStyles = "w-full h-[44px] sm:h-[48px] px-3 sm:px-4 bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition-all text-sm sm:text-base font-medium appearance-none cursor-pointer";

  return (
    <div className="w-full relative group">
      <div className="relative">
        <select
          value={selectedCountry || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className={`${baseInputStyles} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            // 🟢 CRITICAL FIX: Set value to country.name so it saves "Sri Lanka" to the DB
            <option key={country.id} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>

        {/* Icons Overlay */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : (
            <ChevronDown size={18} strokeWidth={2.5} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}