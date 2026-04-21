"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import { DollarSign, ShoppingBag, Users, Package, Loader2 } from "lucide-react";

// Components
import StatCard from "./components/StatCard";
import CustomSelect from "./components/CustomSelect";
import TopProductsCard from "./components/TopProductsCard";
import TopCustomersCard from "./components/TopCustomersCard";

import dynamic from "next/dynamic";

const MainAnalyticsChart = dynamic(
  () => import("./components/MainAnalyticsChart"),
  { 
    ssr: false, // Recharts relies on the browser window, so we skip server-rendering it
    loading: () => (
      <div className="w-full h-[300px] sm:h-[400px] bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] animate-pulse flex items-center justify-center border border-gray-100 dark:border-slate-800">
        <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
      </div>
    )
  }
);

const SalesCategoryChart = dynamic(
  () => import("./components/SalesCategoryChart"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 w-full min-h-[350px] animate-pulse flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
      </div>
    )
  }
);

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

export default function DashboardOverview() {
  // Reset zoom to 100% when page loads
  useEffect(() => {
    document.body.style.zoom = "100%";
    return () => {
      document.body.style.zoom = "100%";
    };
  }, []);

  // 1. STATE MANAGEMENT
  const [activeMetric, setActiveMetric] = useState<
    "revenue" | "orders" | "customers" | "products"
  >("revenue");

  // Date & Range State
  const [mainRange, setMainRange] = useState<string>("weekly");
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(currentYear - 1);
  const endYear = currentYear;
  const [categoryRange, setCategoryRange] = useState<string>("weekly");

  // Generate Year Options
  const availableYears = [];
  for (let y = currentYear; y >= 2021; y--) {
    availableYears.push(y);
  }

  // A. Stat Cards Data
  const { data: cardData, isLoading: cardsLoading } = useQuery({
    queryKey: ["dashboard-cards"],
    queryFn: async () =>
      (await axiosInstance.get("/api/analytics/overview?range=weekly")).data,
    staleTime: 30000,
  });

  // B. Main Chart Data
  const {
    data: mainChartData,
    isLoading: mainLoading,
    isFetching: isMainFetching,
  } = useQuery({
    queryKey: ["dashboard-area-chart", mainRange, startYear],
    queryFn: async () => {
      let url = `/api/analytics/overview?range=${mainRange}`;
      if (mainRange === "custom")
        url += `&startYear=${startYear}&endYear=${endYear}`;
      return (await axiosInstance.get(url)).data;
    },
    placeholderData: keepPreviousData,
    staleTime: getDynamicStaleTime(mainRange),
  });

  // C. Category Chart Data
  const {
    data: categoryData,
    isLoading: categoryLoading,
    isFetching: isCategoryFetching,
  } = useQuery({
    queryKey: ["dashboard-category-chart", categoryRange],
    queryFn: async () =>
      (
        await axiosInstance.get(
          `/api/analytics/overview?range=${categoryRange}`,
        )
      ).data,
    placeholderData: keepPreviousData,
    staleTime: getDynamicStaleTime(categoryRange),
  });

  // 3. LOADING STATE (Full Screen Spinner)
  if (cardsLoading || !cardData) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10 sm:h-12 sm:w-12" />
      </div>
    );
  }

  return (
    // 📱 RESPONSIVE UPDATE: space-y-4 on mobile, space-y-6 on tablet, space-y-8 on desktop
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* --- ROW 1: STAT CARDS --- */}
      {/* 📱 RESPONSIVE UPDATE: gap-3 on mobile to prevent squeezing, gap-6 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Total Revenue"
          value={cardData.revenue.value}
          prefix="Rs. "
          icon={DollarSign}
          trend={cardData.revenue.trend}
          data={cardData.revenue.history}
          isActive={activeMetric === "revenue"}
          onClick={() => setActiveMetric("revenue")}
        />
        <StatCard
          title="Total Orders"
          value={cardData.orders.value}
          icon={ShoppingBag}
          trend={cardData.orders.trend}
          data={cardData.orders.history}
          isActive={activeMetric === "orders"}
          onClick={() => setActiveMetric("orders")}
        />
        <StatCard
          title="Total Products"
          value={cardData.products.value}
          icon={Package}
          trend={cardData.products.trend}
          data={cardData.products.history}
          isActive={activeMetric === "products"}
          onClick={() => setActiveMetric("products")}
        />
        <StatCard
          title="Active Customers"
          value={cardData.customers.value}
          icon={Users}
          trend={cardData.customers.trend}
          data={cardData.customers.history}
          isActive={activeMetric === "customers"}
          onClick={() => setActiveMetric("customers")}
        />
      </div>

      {/* --- ROW 2: MAIN CHARTS --- */}
      {/* 📱 RESPONSIVE UPDATE: Fluid gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <MainAnalyticsChart
            data={mainChartData ? mainChartData[activeMetric].history : []}
            isLoading={mainLoading}
            isFetching={isMainFetching}
            activeMetric={activeMetric}
            range={mainRange}
            setRange={setMainRange}
            startYear={startYear}
            setStartYear={setStartYear}
            endYear={endYear}
            availableYears={availableYears}
          />
        </div>

        {/* RIGHT: Category Chart (Takes 1 Column) */}
        {/* 📱 RESPONSIVE UPDATE: Height scales based on screen size so it doesn't dominate mobile screens */}
        <div className="bg-white dark:bg-slate-950 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col h-[400px] sm:h-[450px] lg:h-[600px] transition-all duration-300">
          <div className="flex justify-between items-center mb-4 z-20">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                Sales by Category
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">
                Distribution
              </p>
            </div>

            <div className="w-28 sm:w-32 scale-90 origin-right">
              <CustomSelect
                value={categoryRange}
                onChange={setCategoryRange}
                options={[
                  { label: "This Week", value: "weekly" },
                  { label: "This Month", value: "monthly" },
                  { label: "This Year", value: "yearly" },
                ]}
              />
            </div>
          </div>

          <SalesCategoryChart
            data={categoryData?.salesByCategory || []}
            periodTotal={categoryData?.periodTotal || 0}
            periodTrend={categoryData?.periodTrend || 0}
            lifetimeTotal={categoryData?.lifetimeTotal || 0}
            isLoading={categoryLoading || isCategoryFetching}
            timeRange={categoryRange}
          />
        </div>
      </div>

      {/* --- ROW 3: LEADERBOARDS --- */}
      {/* 📱 RESPONSIVE UPDATE: Fluid gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="h-auto">
          <TopProductsCard />
        </div>

        <div className="lg:col-span-2 h-auto">
          <TopCustomersCard />
        </div>
      </div>
    </div>
  );
}