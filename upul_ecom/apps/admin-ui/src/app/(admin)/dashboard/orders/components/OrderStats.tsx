"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import {
  Phone,
  CheckCircle2,
  PackageOpen,
  Truck,
  AlertCircle,
  PackageCheck,
  CheckCircle,
  MousePointerClick,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsProps {
  orders?: any[]; // Made optional! The parent can still pass it without throwing an error, but we ignore it now.
  currentFilter: string;
  onFilterChange: (status: string) => void;
}

export default function OrderStats({
  currentFilter,
  onFilterChange,
}: StatsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 🟢 1. FETCH FULL STORE STATS FROM THE BACKEND
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["admin-order-stats"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/orders/admin/stats");
      return res.data;
    },
    staleTime: 1000 * 30, // Refresh these global stats every 30 seconds
  });

  const statsConfig = useMemo(() => {
    return [
      {
        id: "PENDING",
        label: "New Requests",
        statuses: ["PENDING"],
        icon: Phone,
        description: "Needs Verification",
        mobileBg: "bg-blue-50 dark:bg-blue-900/20",
        mobileBorder: "border-blue-200 dark:border-blue-800",
        desktopActive:
          "md:bg-blue-50 md:border-blue-200 md:dark:bg-blue-900/20 md:dark:border-blue-800",
        textColor: "text-blue-700 dark:text-blue-400",
        iconBg: "bg-blue-100 dark:bg-blue-900/40",
        glow: "bg-blue-400",
        dotColor: "bg-blue-600 dark:bg-blue-500",
      },
      {
        id: "CONFIRMED",
        label: "Confirmed",
        statuses: ["CONFIRMED"],
        icon: CheckCircle2,
        description: "Approved Orders",
        mobileBg: "bg-emerald-50 dark:bg-emerald-900/20",
        mobileBorder: "border-emerald-200 dark:border-emerald-800",
        desktopActive:
          "md:bg-emerald-50 md:border-emerald-200 md:dark:bg-emerald-900/20 md:dark:border-emerald-800",
        textColor: "text-emerald-700 dark:text-emerald-400",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
        glow: "bg-emerald-400",
        dotColor: "bg-emerald-600 dark:bg-emerald-500",
      },
      {
        id: "PROCESSING",
        label: "Processing",
        statuses: ["PROCESSING"],
        icon: PackageOpen,
        description: "Packing",
        mobileBg: "bg-amber-50 dark:bg-amber-900/20",
        mobileBorder: "border-amber-200 dark:border-amber-800",
        desktopActive:
          "md:bg-amber-50 md:border-amber-200 md:dark:bg-amber-900/20 md:dark:border-amber-800",
        textColor: "text-amber-700 dark:text-amber-400",
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
        glow: "bg-amber-400",
        dotColor: "bg-amber-600 dark:bg-amber-500",
      },
      {
        id: "SHIPPED",
        label: "In Transit",
        statuses: ["SHIPPED"],
        icon: Truck,
        description: "Courier",
        mobileBg: "bg-purple-50 dark:bg-purple-900/20",
        mobileBorder: "border-purple-200 dark:border-purple-800",
        desktopActive:
          "md:bg-purple-50 md:border-purple-200 md:dark:bg-purple-900/20 md:dark:border-purple-800",
        textColor: "text-purple-700 dark:text-purple-400",
        iconBg: "bg-purple-100 dark:bg-purple-900/40",
        glow: "bg-purple-400",
        dotColor: "bg-purple-600 dark:bg-purple-500",
      },
      {
        id: "DELIVERED",
        label: "Delivered",
        statuses: ["DELIVERED"],
        icon: PackageCheck,
        description: "Completed",
        mobileBg: "bg-teal-50 dark:bg-teal-900/20",
        mobileBorder: "border-teal-200 dark:border-teal-800",
        desktopActive:
          "md:bg-teal-50 md:border-teal-200 md:dark:bg-teal-900/20 md:dark:border-teal-800",
        textColor: "text-teal-700 dark:text-teal-400",
        iconBg: "bg-teal-100 dark:bg-teal-900/40",
        glow: "bg-teal-400",
        dotColor: "bg-teal-600 dark:bg-teal-500",
      },
      {
        id: "CANCELLED",
        label: "Cancelled",
        statuses: ["CANCELLED"],
        icon: XCircle, // Use XCircle from lucide-react
        description: "Early Rejections",
        mobileBg: "bg-rose-50 dark:bg-rose-900/20",
        mobileBorder: "border-rose-200 dark:border-rose-800",
        desktopActive:
          "md:bg-rose-50 md:border-rose-200 md:dark:bg-rose-900/20 md:dark:border-rose-800",
        textColor: "text-rose-700 dark:text-rose-400",
        iconBg: "bg-rose-100 dark:bg-rose-900/40",
        glow: "bg-rose-400",
        dotColor: "bg-rose-600 dark:bg-rose-500",
      },
      {
        id: "RETURNED",
        label: "Returned",
        statuses: ["RETURNED"],
        icon: AlertCircle,
        description: "Courier Returns",
        mobileBg: "bg-rose-50 dark:bg-rose-900/20",
        mobileBorder: "border-rose-200 dark:border-rose-800",
        desktopActive:
          "md:bg-rose-50 md:border-rose-200 md:dark:bg-rose-900/20 md:dark:border-rose-800",
        textColor: "text-rose-700 dark:text-rose-400",
        iconBg: "bg-rose-100 dark:bg-rose-900/40",
        glow: "bg-rose-400",
        dotColor: "bg-rose-600 dark:bg-rose-500",
      },
    ];
  }, []);

  // Sync activeIndex with currentFilter INITIALY or when CLICKED
  useEffect(() => {
    const index = statsConfig.findIndex((s) => s.id === currentFilter);
    if (index !== -1 && index !== activeIndex) {
      setActiveIndex(index);
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollTo({
          left: width * index,
          behavior: "smooth",
        });
      }
    }
  }, [currentFilter, statsConfig]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

  const viewedStat = statsConfig[activeIndex] || statsConfig[0];

  return (
    <div className="w-full mb-8">
      {/* 📦 OUTER BOX */}
      <div
        className={cn(
          "relative w-full max-w-sm mx-auto border rounded-[2.5rem] shadow-sm overflow-hidden transition-colors duration-300 ease-in-out",
          `${viewedStat.mobileBg} ${viewedStat.mobileBorder}`,
          "md:bg-transparent md:border-none md:shadow-none md:overflow-visible md:max-w-none md:mx-0 md:rounded-none dark:bg-transparent dark:md:bg-transparent dark:md:border-none dark:md:shadow-none",
        )}
      >
        {/* SCROLLABLE AREA */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="
            flex w-full h-[200px] overflow-x-auto snap-x snap-mandatory scrollbar-none pb-10
            md:grid md:grid-cols-3 xl:grid-cols-6 md:gap-4 md:h-auto md:overflow-visible md:pb-0
          "
        >
          {statsConfig.map((card) => {
            const isActive = currentFilter === card.id;
            const Icon = card.icon;

            // 🟢 2. READ COUNT DIRECTLY FROM BACKEND STATS!
            const currentCount = isLoading ? "..." : stats[card.id] || 0;

            return (
              <div
                key={card.id}
                onClick={() => onFilterChange(isActive ? "ALL" : card.id)}
                className={cn(
                  "relative flex flex-col justify-between p-6 transition-all duration-300 group select-none cursor-pointer",
                  "min-w-full snap-center border-0 bg-transparent",
                  "md:min-w-0 md:border md:rounded-[2rem] md:snap-align-none md:min-h-[140px]",
                  isActive
                    ? `${card.desktopActive} md:shadow-md md:scale-[1.02]`
                    : "md:bg-white md:border-gray-100 hover:md:border-blue-100 dark:bg-slate-900 md:dark:border-slate-800 md:dark:hover:border-slate-700 hover:md:shadow-lg hover:md:-translate-y-1",
                )}
              >
                {/* Glow (Desktop Only) */}
                <div
                  className={cn(
                    "hidden md:block absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none",
                    card.glow,
                  )}
                />

                <div className="flex justify-between items-start mb-2">
                  <div
                    className={cn(
                      "p-2.5 rounded-2xl transition-colors",
                      "bg-white/80 backdrop-blur-sm shadow-sm text-slate-700",
                      isActive
                        ? `md:${card.iconBg} md:${card.textColor}`
                        : "md:bg-gray-50 md:text-slate-500 md:group-hover:bg-white md:group-hover:shadow-sm md:dark:bg-slate-800 md:dark:text-slate-400 md:dark:group-hover:bg-slate-700",
                    )}
                  >
                    <Icon className="w-6 h-6 md:w-5 md:h-5" strokeWidth={2.5} />
                  </div>

                  {/* CHECKMARK: Shows what is SELECTED */}
                  {isActive ? (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-full animate-in fade-in zoom-in",
                        "bg-white/60 text-slate-700",
                        `md:${card.iconBg} md:${card.textColor}`,
                      )}
                    >
                      <CheckCircle size={12} />
                      <span className="hidden md:inline">ACTIVE</span>
                    </div>
                  ) : (
                    <div className="md:hidden flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-white/30 text-slate-600/70">
                      <MousePointerClick size={12} /> Select
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-end h-full">
                  <h4
                    className={cn(
                      "text-3xl font-extrabold transition-colors",
                      "text-slate-800 dark:text-white",
                      isActive
                        ? "md:text-slate-800 md:dark:text-white"
                        : "md:text-slate-700 md:dark:text-slate-200",
                    )}
                  >
                    {currentCount}
                  </h4>
                  <p
                    className={cn(
                      "text-sm font-bold mt-1 uppercase tracking-wide truncate",
                      card.textColor,
                      isActive
                        ? `md:${card.textColor}`
                        : "md:text-slate-500 md:dark:text-slate-500",
                    )}
                  >
                    {card.label}
                  </p>
                  <p className="text-xs text-slate-500/80 mt-0.5 font-medium truncate">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- PAGINATION BAR (Mobile Only) --- */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 md:hidden pointer-events-none">
          {statsConfig.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                activeIndex === index
                  ? `w-6 ${viewedStat.dotColor}`
                  : "w-1.5 bg-slate-900/10 dark:bg-white/10",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
