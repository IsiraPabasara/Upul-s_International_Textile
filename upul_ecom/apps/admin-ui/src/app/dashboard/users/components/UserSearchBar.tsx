"use client";

import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";

interface UserSearchBarProps {
  onSearch: (query: string) => void;
}

export default function UserSearchBar({ onSearch }: UserSearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative w-full group">
      {/* Search Icon - turns blue when input is focused */}
      <Search 
        size={20} 
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" 
      />
      
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name, email, or phone..."
        value={query}
        onChange={handleChange}
        className="block w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-slate-800 focus:border-gray-300 dark:focus:border-slate-700 transition-all shadow-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
      />
      
      {/* Clear Button */}
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title="Clear search"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}