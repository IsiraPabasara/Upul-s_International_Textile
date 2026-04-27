"use client";

import { useState, useEffect, useRef } from "react";
// 🟢 1. Import your axios instance
import axiosInstance from "@/app/utils/axiosInstance";
import { ChevronDown, Ruler, ImageIcon, X } from "lucide-react";

interface SizeChart {
  id: string;
  name: string;
  imageUrl: string;
}

interface Props {
  selectedChartUrl?: string; 
  onChange: (url: string) => void;
}

export default function SizeChartSelector({
  selectedChartUrl,
  onChange,
}: Props) {

  const [isOpen, setIsOpen] = useState(false);
  const [charts, setCharts] = useState<SizeChart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCharts = async () => {
      try {

        setIsLoading(true);
        const res = await axiosInstance.get("/api/size-charts");
        setCharts(res.data);

      } catch (error) {
        console.error("Failed to fetch size charts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharts();
  }, []);

  const selectedData = charts.find((c) => c.imageUrl === selectedChartUrl);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[52px] sm:h-[56px] px-4 flex items-center justify-between bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:border-blue-300 dark:hover:border-blue-800/50 ${
          isOpen ? "border-blue-500 dark:border-blue-500 ring-4 ring-blue-500/10" : ""
        }`}
      >
        <div className="flex items-center gap-3 truncate">
          <Ruler
            size={18}
            className={selectedData ? "text-blue-500" : "text-gray-400"}
          />
          <span className="truncate">
            {isLoading ? (
              "Loading charts..."
            ) : selectedData ? (
              selectedData.name
            ) : (
              <span className="text-gray-400 font-normal">
                Select a size chart (Optional)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedData && (
            <div
              onClick={(e) => {
                e.stopPropagation(); 
                onChange("");
              }}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </div>
          )}
          <ChevronDown
            size={18}
            strokeWidth={2.5}
            className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-500" : ""}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">

          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors flex items-center gap-3 ${
              !selectedChartUrl 
                ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-white"
                : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <X size={14} />
            </div>
            No Size Chart
          </button>

          {charts.length > 0 ? (
            charts.map((chart) => (
              <button
                key={chart.id}
                type="button"
                onClick={() => {
                  onChange(chart.imageUrl); 
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors flex items-center gap-3 ${
                  selectedChartUrl === chart.imageUrl 
                    ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-white"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700">
                  {chart.imageUrl ? (
                    <img
                      src={chart.imageUrl}
                      alt={chart.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={14} className="m-auto mt-2 opacity-50" />
                  )}
                </div>
                {chart.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400 text-center font-medium">
              No size charts found. Add one first!
            </div>
          )}
        </div>
      )}
    </div>
  );
}