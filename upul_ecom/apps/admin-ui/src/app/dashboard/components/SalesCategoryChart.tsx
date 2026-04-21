"use client";

import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Loader2,
  PieChart as PieIcon,
} from "lucide-react";

const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

// 🎨 Custom Label: Fixed Radii Math for clean spacing
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, value, name } = props;
  const RADIAN = Math.PI / 180;
  
  // 1. Line Start (Pushed out by 8px to clear the thick 4px donut stroke)
  const lineStartRadius = outerRadius + 8;
  const sx = cx + lineStartRadius * Math.cos(-midAngle * RADIAN);
  const sy = cy + lineStartRadius * Math.sin(-midAngle * RADIAN);
  
  // 2. Line End (Pushed out further so it creates a nice connector)
  const lineEndRadius = outerRadius + 25;
  const mx = cx + lineEndRadius * Math.cos(-midAngle * RADIAN);
  const my = cy + lineEndRadius * Math.sin(-midAngle * RADIAN);

  // 3. Text Position (Pushed out past the line end so they never overlap)
  const textRadius = outerRadius + 45; 
  const x = cx + textRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + textRadius * Math.sin(-midAngle * RADIAN);
  
  const textAnchor = x > cx ? "start" : "end";

  return (
    <g>
      {/* Connector Line */}
      <path d={`M${sx},${sy} L${mx},${my} L${x},${y}`} className="stroke-slate-300 dark:stroke-slate-600" fill="none" strokeWidth={1} />
      <circle cx={sx} cy={sy} r={2} fill="#3b82f6" stroke="none" />
      
      {/* Category Name */}
      <text x={x} y={y} textAnchor={textAnchor} className="fill-slate-500 dark:fill-slate-400 text-[10px] font-semibold uppercase tracking-wide" dy={-10}>
        {name}
      </text>
      
      {/* Value */}
      <text x={x} y={y} textAnchor={textAnchor} className="fill-slate-800 dark:fill-white text-xs font-bold" dy={10}>
        Rs. {value.toLocaleString()}
      </text>
    </g>
  );
};

interface Props {
  data: any[];
  periodTotal: number;
  periodTrend: number;
  lifetimeTotal: number;
  isLoading: boolean;
  timeRange: string;
}

const SalesCategoryChart = ({
  data,
  periodTotal,
  periodTrend,
  lifetimeTotal,
  isLoading,
  timeRange,
}: Props) => {
  // 1️⃣ LOADING STATE: Matches new design system
  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">
          Updating Categories...
        </p>
      </div>
    );
  }

  // 2️⃣ NO DATA STATE
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
        <PieIcon size={48} className="opacity-20 mb-4" />
        <p className="text-sm font-medium">No sales in this period.</p>
      </div>
    );
  }

  const isPositive = periodTrend >= 0;

  return (
    // 💎 CONTAINER: Matches TopCustomers/TopProducts exactly
    <div className="flex flex-col h-full relative animate-in fade-in zoom-in duration-500">
      {/* 🟢 CENTER DONUT CONTENT */}
      {/* Positioned absolutely in the center of the chart */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pb-12">
        <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm">
          {(periodTotal / 1000).toFixed(1)}k
        </span>

        {/* Trend Badge */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-2 shadow-sm border ${
            isPositive
              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
              : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight size={14} strokeWidth={3} />
          ) : (
            <ArrowDownRight size={14} strokeWidth={3} />
          )}
          {Math.abs(periodTrend)}%
        </div>

        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
          {timeRange} Sales
        </span>
      </div>

      {/* 📊 THE CHART */}
      {/* Added negative margin to pull it up slightly for visual balance */}
      <div className="flex-1 w-full min-h-[350px] -mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80} // Thinner, more modern donut
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label={renderCustomizedLabel}
              labelLine={false}
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className="stroke-white dark:stroke-slate-950 stroke-[4px] hover:opacity-80 transition-all duration-300 cursor-pointer outline-none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 🦶 FOOTER */}
      {/* Matches the "Total Sold" section of other cards */}
      <div className="mt-auto pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Lifetime Revenue
            </p>
            <h4 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-800 dark:text-white">
              Rs. {lifetimeTotal.toLocaleString()}
            </h4>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Active Categories
          </p>
          <p className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-700 dark:text-slate-300">
            {data.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(SalesCategoryChart);
