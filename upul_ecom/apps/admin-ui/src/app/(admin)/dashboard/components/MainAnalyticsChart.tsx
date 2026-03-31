"use client";

import { memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "lucide-react";
import CustomSelect from "./CustomSelect";

// 🎨 UPDATED Custom Tooltip Component (Full Labels)
const CustomTooltip = ({ active, payload, label, activeMetric }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value.toLocaleString();

    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-gray-100 dark:border-slate-800 p-4 rounded-2xl shadow-xl shadow-blue-500/10 dark:shadow-none min-w-[140px]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          {/* Prefix for Revenue */}
          {activeMetric === "revenue" && (
            <span className="text-lg font-bold text-slate-800 dark:text-white">
              Rs.
            </span>
          )}

          {/* The Value Number */}
          <span className="text-2xl font-black text-slate-800 dark:text-white">
            {value}
          </span>

          {/* Suffixes - Now using Full Words */}
          {activeMetric === "orders" && (
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Orders
            </span>
          )}
          {activeMetric === "customers" && (
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Customers
            </span>
          )}
          {activeMetric === "products" && (
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Products
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface Props {
  data: any[];
  isLoading: boolean;
  isFetching: boolean;
  activeMetric: "revenue" | "orders" | "customers" | "products";
  range: string;
  setRange: (val: string) => void;
  startYear: number;
  setStartYear: (val: number) => void;
  endYear: number;
  availableYears: number[];
}

const MainAnalyticsChart = ({
  data,
  isLoading,
  isFetching,
  activeMetric,
  range,
  setRange,
  startYear,
  setStartYear,
  endYear,
  availableYears,
}: Props) => {
  const getMetricLabel = () => {
    switch (activeMetric) {
      case "revenue":
        return "Total Revenue";
      case "orders":
        return "Total Orders";
      case "customers":
        return "New Customers";
      case "products":
        return "New Products";
      default:
        return "Value";
    }
  };

  const rangeOptions = [
    { label: "This Week", value: "weekly" },
    { label: "This Month", value: "monthly" },
    { label: "This Year", value: "yearly" },
    { label: "Custom Range", value: "custom" },
  ];

  if (isLoading) {
    return (
      <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
        <div className="flex-1 flex items-end gap-2 px-4 opacity-10">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="w-full bg-slate-400 rounded-t-2xl"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none relative transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 z-20 relative">
        <div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            {getMetricLabel()}
            {isFetching && !isLoading && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Performance over time
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <CustomSelect
            value={range}
            onChange={setRange}
            options={rangeOptions}
          />

          {range === "custom" && (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center bg-blue-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-slate-800">
                <Calendar
                  size={14}
                  className="text-blue-600 dark:text-blue-400 mr-2"
                />
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <span className="mx-2 text-xs text-slate-400">to</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {endYear}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📊 Chart Area */}
      <div className="h-[300px] sm:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
              className="dark:stroke-slate-800"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
              dy={15}
              interval={
                range === "custom" || range === "monthly"
                  ? "preserveStartEnd"
                  : 0
              }
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
              dx={-10}
            />

            <Tooltip
              content={<CustomTooltip activeMetric={activeMetric} />}
              cursor={{
                stroke: "#3b82f6",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorMain)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default memo(MainAnalyticsChart);
