"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
}

export default function CustomSelect({ value, onChange, options }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 
          bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 text-slate-700 
          dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-200
          text-xs font-bold py-2 px-3 rounded-xl transition-all duration-200 outline-none 
          focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 
          min-w-[110px] whitespace-nowrap`} // 👈 Changed: min-w-[110px] instead of w-full or fixed width
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <div
        className={`absolute right-0 top-full mt-2 min-w-full w-max max-w-[200px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl shadow-slate-200/20 dark:shadow-none z-50 overflow-hidden transition-all duration-200 origin-top-right ${
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="p-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between gap-4 transition-colors ${
                value === option.value
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-slate-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
              }`}
            >
              <span className="whitespace-nowrap">{option.label}</span>
              {value === option.value && <Check size={12} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}