"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import { Loader2, Medal, User, Crown } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface Customer {
  id: string;
  name: string;
  email: string;
  image: string;
  totalSpent: number;
  ordersCount: number;
}

// 🧠 PHASE 3: Dynamic Cache Timer
const getDynamicStaleTime = (range: string) => {
  switch (range) {
    case "all_time":
      return 1000 * 60 * 10; // 10 minutes cache
    case "yearly":
      return 1000 * 60 * 5;  // 5 minutes cache
    case "monthly":
      return 1000 * 60 * 2;  // 2 minutes cache
    case "weekly":
    case "custom":
    default:
      return 1000 * 30;      // 30 seconds cache (fastest)
  }
};

export default function TopCustomersCard() {
  const [range, setRange] = useState("all_time");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["top-customers", range],
    queryFn: async () =>
      (await axiosInstance.get(`/api/analytics/top-customers?range=${range}`))
        .data as Customer[],
    staleTime: getDynamicStaleTime(range),
  });

  const rangeOptions = [
    { label: "All Time", value: "all_time" },
    { label: "This Week", value: "weekly" },
    { label: "This Month", value: "monthly" },
  ];

  // 🎨 Helper: Rank Icons with Dark Mode Glows
  const getRankIcon = (index: number) => {
    if (index === 0)
      return (
        <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl shadow-sm dark:shadow-yellow-900/20">
          <Crown size={20} fill="currentColor" className="animate-pulse" />
        </div>
      );
    if (index === 1)
      return (
        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
          <Medal size={20} />
        </div>
      );
    if (index === 2)
      return (
        <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
          <Medal size={20} />
        </div>
      );
    return (
      <div className="w-10 h-10 flex items-center justify-center font-bold text-slate-400 dark:text-slate-600 bg-gray-50 dark:bg-slate-900 rounded-xl text-sm">
        #{index + 1}
      </div>
    );
  };

  return (
    <>
      {/* 🛠 Custom Scrollbar Styles for this Component */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
        }
      `}</style>

      {/* CARD CONTAINER */}
      <div className="w-full bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col h-[500px] lg:h-[700px] transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Top Buyers
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Your most loyal customers
            </p>
          </div>
          <div className="scale-90 origin-right z-20">
            <CustomSelect
              value={range}
              onChange={setRange}
              options={rangeOptions}
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
            </div>
          ) : !customers || customers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <User className="opacity-20 mb-3" size={48} />
              <p className="text-sm font-medium">No customer data yet</p>
            </div>
          ) : (
            customers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 dark:bg-slate-900 border border-transparent hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 group cursor-default shadow-sm hover:shadow-md dark:shadow-none"
              >
                {/* 1. Rank Icon */}
                <div className="flex-shrink-0">{getRankIcon(index)}</div>

                {/* 2. Avatar */}
                <div className="flex-shrink-0 relative">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {customer.image ? (
                      <img
                        src={customer.image}
                        alt={customer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      customer.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {/* Online Dot (Decoration) */}
                  {index < 3 && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                  )}
                </div>

                {/* 3. Name & Email */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 dark:text-white truncate text-base lg:text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {customer.name}
                  </h4>
                  <p className="text-xs text-slate-400 truncate font-medium">
                    {customer.email}
                  </p>
                </div>

                {/* 4. Stats */}
                <div className="text-right flex flex-col items-end">
                  <p className="font-extrabold text-slate-900 dark:text-white text-base lg:text-lg">
                    Rs. {(customer.totalSpent / 1000).toFixed(1)}k
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                      {customer.ordersCount} Orders
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
