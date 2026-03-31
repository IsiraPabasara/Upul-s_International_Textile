"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { 
  LayoutDashboard, ShoppingBag, Package, Layers, Ruler, LogOut, 
  ChevronDown, ChevronRight, PlusCircle, List, Moon, Sun, X, 
  Mail, Tag, Ticket, // 🟢 Imported Ticket icon for Coupons
  ChartArea
} from "lucide-react";

const mainNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Inventory", href: "/dashboard/inventory", icon: Layers },
  { label: "Email Management", href: "/dashboard/email-management", icon: Mail },
];

const productSubItems = [
  { label: "Add Product", href: "/dashboard/products/add", icon: PlusCircle },
  { label: "Product List", href: "/dashboard/productlist", icon: List },
  { label: "Categories", href: "/dashboard/products/category", icon: Layers },
  { label: "Brands", href: "/dashboard/products/brands", icon: Tag }, 
  { label: "Size Standards", href: "/dashboard/products/sizetypes", icon: Ruler },
  { label: "Coupons", href: "/dashboard/coupens", icon: Ticket },
  { label: "Size Charts", href: "/dashboard/products/size-charts", icon: ChartArea }, // 🟢 Added Coupons here!
]

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  // Helper to determine if a route is active (Exact or Sub-path)
  const isRouteActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href; // Strict match for Dashboard home
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    // Keep Products menu open if we are in any product sub-route
    if (pathname.includes("/product") || pathname.includes("/dashboard/products")) {
      setIsProductsOpen(true);
    }
    // Close sidebar on mobile when route changes
    onClose(); 
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        dark:bg-slate-950 dark:border-slate-800
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        
        {/* BRAND HEADER */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="flex flex-col leading-none">
            <div className="inline-flex items-end">
              <span className="text-4xl md:text-5xl font-serif font-bold text-[#1a1a3a] dark:text-white tracking-tight leading-none mr-0.5">
                U
              </span>
              <div className="flex flex-col ml-1 mb-1 md:mb-2">
                <div className="mb-0.5">
                  <div className="h-[2px] w-8 bg-black dark:bg-white mb-1"></div>
                  <div className="h-[2px] w-5 bg-black dark:bg-white"></div>
                </div>
                <span className="text-red-600 dark:text-red-500 text-sm font-serif font-bold tracking-tighter leading-none">
                  PUL&apos;S
                </span>
              </div>
            </div>
            <span className="text-[7px] md:text-[8px] tracking-[0.3em] font-bold text-[#1a1a3a] dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-0.5 md:pt-1 uppercase">
              International
            </span>
          </div>
          
          <button onClick={onClose} className="md:hidden p-1 text-slate-400 hover:text-red-500 transition">
            <X size={24} />
          </button>
        </div>

        {/* SCROLLABLE NAV */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {mainNavItems.map((item) => {
            const isActive = isRouteActive(item.href);
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-bold shadow-sm" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                  }
                `}
              >
                <item.icon size={20} className={isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"} />
                {item.label}
              </Link>
            );
          })}

          {/* PRODUCTS SECTION */}
          <div className="pt-2">
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group cursor-pointer
               ${pathname.includes("/product") ? "bg-blue-50 dark:bg-blue-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-900"}
            `}
            onClick={() => setIsProductsOpen(!isProductsOpen)}
            >
              <div className="flex-1 flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
                  <Package size={20} className={pathname.includes("/product") ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"} />
                  <span>Products</span>
              </div>
              <div className="p-1 text-slate-400">
                {isProductsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ${isProductsOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-0.5 ml-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
                {productSubItems.map((subItem) => {
                  const isSubActive = isRouteActive(subItem.href);

                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                        ${isSubActive 
                          ? "text-blue-700 bg-blue-50/50 font-bold dark:text-blue-400 dark:bg-blue-900/10" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900"
                        }
                      `}
                    >
                      <subItem.icon size={16} className={isSubActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
                      {subItem.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-2 shrink-0">
          <button onClick={toggleTheme} className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <span className="flex items-center gap-2">{isDark ? <Moon size={18} /> : <Sun size={18} />} {isDark ? "Dark" : "Light"}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isDark ? 'bg-blue-600' : 'bg-slate-300'}`}>
               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isDark ? 'left-4.5 translate-x-4' : 'left-0.5'}`} />
            </div>
          </button>
          <button className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}