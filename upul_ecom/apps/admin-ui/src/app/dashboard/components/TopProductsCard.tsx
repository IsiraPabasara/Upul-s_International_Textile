"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import { ChevronLeft, Loader2, Trophy, ArrowRight, Flame } from "lucide-react";
import Image from "next/image";
import CustomSelect from "./CustomSelect";

interface Product {
  id: string;
  name: string;
  price: number;
  brand: string;
  stock: number;
  image: string;
  totalSold: number;
}

const getDynamicStaleTime = (range: string) => {
  switch (range) {
    case "all_time":
      return 1000 * 60 * 10; 
    case "yearly":
      return 1000 * 60 * 5;  
    case "monthly":
      return 1000 * 60 * 2; 
    case "weekly":
    case "custom":
    default:
      return 1000 * 30;     
  }
};

export default function TopProductsCard() {
  const [range, setRange] = useState("weekly");
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: products, isLoading } = useQuery({
    queryKey: ["top-products", range],
    queryFn: async () =>
      (await axiosInstance.get(`/api/analytics/top-products?range=${range}`))
        .data as Product[],
    staleTime: getDynamicStaleTime(range),
  });

  const rangeOptions = [
    { label: "This Week", value: "weekly" },
     { label: "This Month", value: "monthly" },
    { label: "All Time", value: "all_time" },
  ];

  const currentProduct =
    products && products.length > 0 ? products[currentIndex] : null;

  const nextSlide = () => {
    if (!products) return;
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    if (!products) return;
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 border border-gray-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col relative h-[500px] lg:h-[700px] transition-all duration-300">
      <div className="flex justify-between items-center mb-4 lg:mb-6 z-20">
        <div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Top Selling
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Most popular picks
          </p>
        </div>
        <div className="scale-90 origin-right">
          <CustomSelect
            value={range}
            onChange={(val) => {
              setRange(val);
              setCurrentIndex(0);
            }}
            options={rangeOptions}
          />
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
          </div>
        ) : !currentProduct ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Trophy className="opacity-20 mb-4" size={64} />
            <p className="text-base font-medium">No sales found</p>
          </div>
        ) : (
          <div className="h-full flex flex-col animate-in fade-in zoom-in duration-500">
            <div className="relative w-full flex-1 aspect-square lg:aspect-[2/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-[2rem] mb-4 lg:mb-6 overflow-hidden group mx-auto border border-gray-100/50 dark:border-slate-700/50 shadow-inner">
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md dark:bg-slate-950/90 text-slate-900 dark:text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-sm z-10 border border-white/50 dark:border-slate-700 flex items-center gap-1.5">
                <span className="text-yellow-500">🏆</span> #{currentIndex + 1}{" "}
              </div>

              <Image
                src={currentProduct.image}
                alt={currentProduct.name}
                fill
                className="object-contain w-full mix-blend-multiply dark:mix-blend-normal"
              />
            </div>

            <div className="flex flex-col px-1 mt-auto">
              <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase mb-2">
                <span className="text-slate-400">{currentProduct.brand}</span>
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${currentProduct.stock > 0 ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 text-rose-700"}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${currentProduct.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                  />
                  {currentProduct.stock > 0
                    ? `${currentProduct.stock} Left`
                    : "Out of Stock"}
                </div>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl lg:text-2xl leading-tight truncate mb-1">
                {currentProduct.name}
              </h4>

              <p className="font-black text-xl sm:text-2xl lg:text-3xl text-slate-900 dark:text-white tracking-tight">
                Rs. {currentProduct.price.toLocaleString()}
              </p>

              <div className="mt-4 lg:mt-6 pt-4 lg:pt-5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 flex items-center justify-center">
                    <Flame
                      size={20}
                      fill="currentColor"
                      className="animate-pulse"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Total Sold
                    </span>
                    <span className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-800 dark:text-white leading-none">
                      {currentProduct.totalSold}{" "}
                      <span className="text-[10px] sm:text-xs font-medium text-slate-400">
                        Units
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={prevSlide}
                    className="w-11 h-11 rounded-full border-2 border-gray-100 dark:border-slate-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all active:scale-95"
                  >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="w-11 h-11 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95"
                  >
                    <ArrowRight size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
