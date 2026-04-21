"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import { 
  Plus, 
  List, 
  Layers, 
  Ruler, 
  ChevronRight, 
  PackageSearch,
  AlertTriangle
} from "lucide-react";

// --- 1. CONFIGURATION (Easy to Change) ---
// Add new buttons here instead of copying HTML
const actionCards = [
  { 
    title: "Add Product", 
    desc: "Create a new item", 
    href: "/dashboard/products/add", 
    icon: Plus,
    // Special styling for the primary action
    bgClass: "bg-blue-600 dark:bg-blue-600",
    textClass: "text-white",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    borderClass: "border-transparent"
  },
  { 
    title: "Product List", 
    desc: "View & edit all items", 
    href: "/dashboard/productlist", 
    icon: List,
    bgClass: "bg-white dark:bg-slate-800",
    textClass: "text-slate-900 dark:text-white",
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderClass: "border-slate-200 dark:border-slate-700"
  },
  { 
    title: "Categories", 
    desc: "Manage collections", 
    href: "/dashboard/products/category", 
    icon: Layers,
    bgClass: "bg-white dark:bg-slate-800",
    textClass: "text-slate-900 dark:text-white",
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderClass: "border-slate-200 dark:border-slate-700"
  },
  { 
    title: "Size Standards", 
    desc: "Edit size charts", 
    href: "/dashboard/products/sizetypes", 
    icon: Ruler,
    bgClass: "bg-white dark:bg-slate-800",
    textClass: "text-slate-900 dark:text-white",
    iconBg: "bg-orange-50 dark:bg-orange-900/20",
    iconColor: "text-orange-600 dark:text-orange-400",
    borderClass: "border-slate-200 dark:border-slate-700"
  },
];

export default function ProductsOverviewPage() {
  
  // --- 2. DYNAMIC DATA FETCHING ---
  // We fetch a simple count to show real stats.
  const { data: stats, isLoading } = useQuery({
    queryKey: ["product-stats"],
    queryFn: async () => {
      // We can use your existing list endpoint and just check the 'total'
      // Or ideally, create a specific /stats endpoint later.
      const res = await axiosInstance.get("/api/products/inventory/list?limit=1");
      return {
        totalProducts: res.data.pagination.total || 0,
        // You can calculate 'lowStock' on the backend later for efficiency
        lowStock: 0 // Placeholder until backend supports it
      };
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Product Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
          Central command for your catalog, inventory, and metadata.
        </p>
      </div>

      {/* ACTION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actionCards.map((card, idx) => (
          <Link 
            key={idx}
            href={card.href} 
            className={`
              group relative p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300
              flex flex-col justify-between h-48 border
              ${card.bgClass} ${card.borderClass}
              hover:-translate-y-1
            `}
          >
            {/* Icon Box */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${card.iconBg}`}>
               <card.icon size={28} className={card.iconColor} />
            </div>
            
            {/* Text Content */}
            <div>
              <h3 className={`font-bold text-xl ${card.textClass}`}>
                {card.title}
              </h3>
              <div className={`flex items-center gap-2 mt-1 text-sm font-medium opacity-80 ${card.textClass}`}>
                <span>{card.desc}</span>
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* QUICK STATS ROW (Dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stat 1: Total Products */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-5 shadow-sm">
           <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
             <PackageSearch size={28} />
           </div>
           <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Products
              </p>
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalProducts.toLocaleString()}
                </p>
              )}
           </div>
        </div>

        {/* Stat 2: Low Stock (Example of future expansion) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-5 shadow-sm opacity-60">
           <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full text-amber-600 dark:text-amber-400">
             <AlertTriangle size={28} />
           </div>
           <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Low Stock Alerts
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">--</p>
              <p className="text-xs text-slate-400">Coming soon</p>
           </div>
        </div>

      </div>

    </div>
  );
}