"use client";

import { Bell, Search, Menu } from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import { useEffect, useRef } from "react";

// ⭐ NEW: Add Props Interface
interface HeaderProps {
  onMenuClick: () => void;
}

export default function DashboardHeader({ onMenuClick }: HeaderProps) {
  const {} = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300
      bg-white/80 backdrop-blur-md border-b border-gray-200 
      dark:bg-slate-950 dark:border-slate-800"
    >
      
      {/* 1. LEFT: Menu & Title */}
      <div className="flex items-center gap-4 min-w-fit">
        {/* ⭐ FIX: This button now triggers the Sidebar */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <Menu size={24} />
        </button>
        
        <h2 className="hidden md:block text-xl font-bold text-slate-800 dark:text-white tracking-tight whitespace-nowrap">
          Dashboard
        </h2>
      </div>

      {/* 2. CENTER: Search */}
      <div className="hidden md:flex flex-1 max-w-lg mx-6">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search..." 
            className="block w-full pl-10 pr-12 py-2.5 text-base md:text-sm font-medium rounded-xl transition-all outline-none
              bg-slate-50 border border-transparent text-slate-900 placeholder-slate-400
              focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50
              dark:bg-slate-900 dark:text-white dark:focus:bg-slate-800 dark:focus:border-blue-900/50 dark:focus:ring-blue-900/20"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
             <kbd className="text-xs text-slate-400 font-medium px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-sans">Ctrl K</kbd>
          </div>
        </div>
      </div>

      {/* 3. RIGHT: Actions & Profile */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-fit justify-end">
        <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-all hover:scale-105 active:scale-95">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></span>
        </button>
        
        {/* ⭐ FIX: Clean Circle Profile (Initials Only) */}
        <div className="pl-1">
          <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20  transition-transform">
             <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                  AD
                </span>
             </div>
          </button>
        </div>
      </div>
    </header>
  );
}