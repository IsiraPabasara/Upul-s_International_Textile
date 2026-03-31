"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/axiosInstance";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Banknote,
  FilterX,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";


import OrderStats from "./components/OrderStats";

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. GET FILTER FROM URL
  const filterStatus = searchParams.get("filter") || "ALL";

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 2. FETCH FROM BACKEND WITH PARAMS
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", currentPage, filterStatus, searchQuery],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/orders/admin", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          filter: filterStatus,
          search: searchQuery,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  // 3. EXTRACT DATA FROM BACKEND RESPONSE
  const orders = data?.orders || [];
  const totalPages = data?.metadata?.totalPages || 1;
  const totalRecords = data?.metadata?.total || 0;

  // 4. HANDLE FILTER CHANGE
  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === "ALL") {
      params.delete("filter");
    } else {
      params.set("filter", status);
    }
    router.push(`?${params.toString()}`);
    setCurrentPage(1);
    setSearchQuery("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      case "CONFIRMED":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "PROCESSING":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
      case "SHIPPED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800";
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      case "CANCELLED":
      case "RETURNED":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Order Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Manage and verify customer orders
            </p>
          </div>
        </div>

        {/* STATS CARDS */}
        <OrderStats
          currentFilter={filterStatus}
          onFilterChange={handleFilterChange}
        />

        {/* MAIN TABLE CONTAINER */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
          {/* TOOLBAR */}
          <div className="px-4 py-4 sm:px-6 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 gap-4">
            {/* Left: Filter Label & Clear Button */}
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm sm:text-base whitespace-nowrap">
                {filterStatus === "ALL"
                  ? "All Recent Orders"
                  : `${filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()} Orders`}
              </h3>

              <span className="text-xs font-semibold text-slate-400 bg-gray-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-gray-100 dark:border-slate-700 whitespace-nowrap">
                {totalRecords}
              </span>

              {filterStatus !== "ALL" && (
                <button
                  onClick={() => handleFilterChange("ALL")}
                  className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors border border-rose-100 dark:border-rose-800 shrink-0"
                >
                  <X size={12} strokeWidth={3} /> Clear
                </button>
              )}
            </div>

            {/* Right: Search Input */}
            <div className="relative w-full sm:max-w-xs shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search Order ID or Name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>
          </div>

          {/* TABLE CONTENT */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 whitespace-nowrap">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold tracking-wider hidden sm:table-cell">
                    Customer
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold tracking-wider">
                    Total
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold tracking-wider text-center sm:text-left">
                    Payment
                  </th>

                  {/* 🟢 STATUS: Shows on mobile only when 'ALL' is selected */}
                  {filterStatus === "ALL" && (
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold tracking-wider text-right sm:text-left">
                      Status
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-16"></div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                          <div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-32"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 flex justify-center sm:justify-start">
                        <div className="h-6 sm:h-6 w-6 sm:w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                      </td>
                      {filterStatus === "ALL" && (
                        <td className="px-4 sm:px-6 py-4">
                          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16 sm:w-20 ml-auto sm:ml-0"></div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={filterStatus === "ALL" ? 5 : 4}
                      className="px-4 sm:px-6 py-20 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
                        <FilterX size={48} className="mb-4 opacity-20" />
                        <p className="font-medium text-slate-500">
                          No orders found.
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          Try adjusting your search or filters.
                        </p>
                        {(searchQuery || filterStatus !== "ALL") && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              handleFilterChange("ALL");
                            }}
                            className="mt-6 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition border border-blue-100 dark:border-blue-800"
                          >
                            Reset All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr
                      key={order.id}
                      onClick={() =>
                        router.push(`/dashboard/orders/${order.id}`)
                      }
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xs sm:text-sm">
                          #{order.orderNumber}
                        </span>
                        <div className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-slate-700 shrink-0">
                            {order.shippingAddress.firstname.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm truncate">
                              {order.shippingAddress.firstname}{" "}
                              {order.shippingAddress.lastname}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {order.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-extrabold text-slate-700 dark:text-slate-200 text-xs sm:text-sm whitespace-nowrap">
                        Rs. {order.totalAmount.toLocaleString()}
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex justify-center sm:justify-start">
                          {order.paymentMethod === "PAYHERE" ? (
                            <span className="flex items-center w-fit gap-1.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-2 sm:px-2.5 sm:py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                              <CreditCard size={14} className="shrink-0" />{" "}
                              <span className="hidden sm:inline">ONLINE</span>
                            </span>
                          ) : (
                            <span className="flex items-center w-fit gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-2 sm:px-2.5 sm:py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                              <Banknote size={14} className="shrink-0" />{" "}
                              <span className="hidden sm:inline">COD</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {filterStatus === "ALL" && (
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right sm:text-left">
                          <span
                            className={`px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold border ring-1 ring-inset whitespace-nowrap ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}