"use client";

import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  icon: LucideIcon;
  trend: number;
  data: any[];
  isActive: boolean;
  onClick: () => void;
}

export default function StatCard({
  title,
  value,
  prefix = "",
  icon: Icon,
  trend,
  data,
  isActive,
  onClick,
}: StatCardProps) {
  const isPositive = trend >= 0;

  // 🎨 DYNAMIC GRAPH COLOR: Now stays Green/Red even when active!
  const graphColor = isPositive ? "#10b981" : "#f43f5e";

  return (
    <div
      onClick={onClick}
      className={cn(
        // FLEX LAYOUT: 'flex-col' stacks items top-to-bottom
        "relative w-full h-full min-h-[180px] flex flex-col justify-between overflow-hidden",
        "rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer transition-all duration-300 border group select-none",
        "p-5 sm:p-6",
        isActive
          ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-200/50 dark:shadow-none -translate-y-1"
          : "bg-white border-gray-100 hover:border-blue-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 hover:shadow-lg dark:hover:shadow-none",
      )}
    >
      {/* Background Decor */}
      <div
        className={cn(
          "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none",
          isActive ? "bg-white/10" : "bg-blue-500/5 dark:bg-blue-500/10",
        )}
      />

      {/* --- CONTENT SECTION (Top) --- */}
      <div className="relative z-20 flex flex-col gap-4">
        {/* 1. Header: Icon & Trend Badge */}
        <div className="flex justify-between items-start">
          <div
            className={cn(
              "p-2.5 sm:p-3 rounded-2xl transition-all duration-300 border shadow-sm shrink-0",
              isActive
                ? "bg-white/20 border-white/10 text-white"
                : "bg-gray-50 border-gray-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300",
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>

          <div
            className={cn(
              "flex items-center text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full border shadow-sm backdrop-blur-md whitespace-nowrap",
              isActive
                ? "bg-white text-emerald-600"
                : "bg-white border-gray-100 dark:bg-slate-800 dark:border-slate-700",
            )}
          >
            <span
              className={cn(
                "flex items-center gap-0.5",
                isPositive ? "text-emerald-500" : "text-rose-500",
              )}
            >
              {isPositive ? (
                <ArrowUpRight size={14} className="stroke-[3px]" />
              ) : (
                <ArrowDownRight size={14} className="stroke-[3px]" />
              )}
              {Math.abs(trend)}%
            </span>
          </div>
        </div>

        {/* 2. Main Value & Title */}
        <div className="flex flex-col items-start w-full">
          <span
            className={cn(
              "text-xs sm:text-sm font-bold uppercase tracking-wide mb-1 transition-colors truncate w-full",
              isActive ? "text-blue-100" : "text-slate-400",
            )}
          >
            {title}
          </span>
          <h4
            className={cn(
              // 📱 Toned down: Starts at text-xl on mobile, peaks at text-3xl on large screens
              "text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate w-full",
              isActive ? "text-white" : "text-slate-800 dark:text-white",
            )}
          >
            <CountUp value={value} prefix={prefix} />
          </h4>
        </div>
      </div>

      {/* --- GRAPH SECTION (Bottom) --- */}
      <div className="w-full h-20 mt-4 z-10 relative pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis
              domain={["dataMin", "dataMax"]}
              hide={true}
              padding={{ top: 5, bottom: 5 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={graphColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
