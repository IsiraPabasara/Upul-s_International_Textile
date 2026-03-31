"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../axiosInstance";
import {
  Search,
  Loader2,
  Save,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Filter,
  PackageX,
  AlertTriangle,
  ArrowUpRight,
  Box,
  DollarSign,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// --- TYPES ---
interface Variant {
  size: string;
  stock: number | string;
}
interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number | string;
  variants: Variant[];
  images: { url: string }[];
}
interface InventoryRow {
  uniqueKey: string;
  productId: string;
  name: string;
  sku: string;
  image: string;
  variantSize: string | null;
  currentStock: number;
}
interface ApiResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    totalStock: number;
    outOfStock: number;
    totalValue: number;
  };
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isOutOfStockFilter, setIsOutOfStockFilter] = useState(false);

  const [targetVariant, setTargetVariant] = useState<{
    sku: string;
    size: string | null;
  } | null>(null);

  const [pendingUpdates, setPendingUpdates] = useState<
    Record<
      string,
      { sku: string; variantSize: string | null; newStock: number }
    >
  >({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 1️⃣ MAIN TABLE QUERY
  const { data: tableData, isLoading: isTableLoading } = useQuery<ApiResponse>({
    queryKey: ["inventory", page, debouncedSearch, isOutOfStockFilter],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/products/inventory/list", {
        params: {
          search: debouncedSearch,
          page,
          limit: 10,
          stock_status: isOutOfStockFilter ? "out_of_stock" : undefined,
        },
      });
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

  // 2️⃣ ALERTS QUERY
  const { data: alertsData, isLoading: isAlertsLoading } =
    useQuery<ApiResponse>({
      queryKey: ["inventory-alerts"],
      queryFn: async () => {
        const res = await axiosInstance.get("/api/products/inventory/list", {
          params: { limit: 50, filter_type: "low_stock" },
        });
        return res.data;
      },
    });

  // --- DATA FLATTENER ---
  const flattenData = (products: Product[]): InventoryRow[] => {
    return products.flatMap((product): InventoryRow[] => {
      const hasVariants = product.variants && product.variants.length > 0;
      const imgUrl = product.images?.[0]?.url || "";

      if (hasVariants) {
        return product.variants.map((v) => ({
          uniqueKey: `${product.sku}-${v.size}`,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          image: imgUrl,
          variantSize: v.size,
          currentStock: Number(v.stock),
        }));
      } else {
        return [
          {
            uniqueKey: product.sku,
            productId: product.id,
            name: product.name,
            sku: product.sku,
            image: imgUrl,
            variantSize: null,
            currentStock: Number(product.stock),
          },
        ];
      }
    });
  };

  // 🧠 SMART FILTERING
  const tableRows = useMemo(() => {
    let rows = flattenData(tableData?.data || []);
    if (isOutOfStockFilter) {
      rows = rows.filter((row) => row.currentStock === 0);
    }
    if (targetVariant) {
      rows = rows.filter(
        (row) =>
          row.sku === targetVariant.sku &&
          row.variantSize === targetVariant.size,
      );
    }
    return rows;
  }, [tableData, isOutOfStockFilter, targetVariant]);

  const lowStockItems = useMemo(() => {
    const allRows = flattenData(alertsData?.data || []);
    return allRows.filter((row) => row.currentStock < 10);
  }, [alertsData]);

  // --- ACTIONS ---
  const handleAlertClick = (sku: string, size: string | null) => {
    setSearchTerm(sku);
    setTargetVariant({ sku, size });
    setIsAlertModalOpen(false);
    window.scrollTo({ top: 500, behavior: "smooth" });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setTargetVariant(null);
    setIsOutOfStockFilter(false);
  };

  const executeBulkSave = useMutation({
    mutationFn: async () => {
      const updatesArray = Object.values(pendingUpdates);
      if (updatesArray.length === 0) return;
      await axiosInstance.patch("/api/products/inventory/bulk-update", {
        updates: updatesArray,
      });
    },
    onSuccess: () => {
      toast.success("Stock updated successfully!", {
        style: {
          border: "1px solid #4ade80",
          padding: "16px",
          color: "#166534",
          background: "#f0fdf4",
        },
        iconTheme: { primary: "#22c55e", secondary: "#FFFFFF" },
      });
      setPendingUpdates({});
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] });
    },
    onError: () => {
      toast.error("Save failed. Changes discarded.");
      setPendingUpdates({});
    },
  });

  const handleEdit = (row: InventoryRow, val: string) => {
    const newVal = parseInt(val);
    if (isNaN(newVal) || newVal < 0) return;
    if (newVal === row.currentStock) {
      const copy = { ...pendingUpdates };
      delete copy[row.uniqueKey];
      setPendingUpdates(copy);
      return;
    }
    setPendingUpdates((prev) => ({
      ...prev,
      [row.uniqueKey]: {
        sku: row.sku,
        variantSize: row.variantSize,
        newStock: newVal,
      },
    }));
  };

  const toggleOutOfStockFilter = () => {
    setIsOutOfStockFilter(!isOutOfStockFilter);
    setTargetVariant(null);
  };

  const totalUnsaved = Object.keys(pendingUpdates).length;

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 pb-32 font-sans transition-colors duration-300">
      <Toaster position="top-center" reverseOrder={false} />

      {/* --- ALERT MODAL (Responsive) --- */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={24} />{" "}
                  Inventory Alerts
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Items requiring immediate attention.
                </p>
              </div>
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-slate-950/50">
              {lowStockItems.map((item) => (
                <button
                  key={item.uniqueKey}
                  onClick={() => handleAlertClick(item.sku, item.variantSize)}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={16} className="text-blue-500" />
                  </div>

                  <div className="w-20 h-25 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 shrink-0 shadow-sm">
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-25 py-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Low Stock
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-500 dark:text-slate-500">
                        {item.sku}
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {item.currentStock} left
                      </span>
                    </div>
                    {item.variantSize && (
                      <p className="text-xs text-slate-400 font-medium">
                        Size: {item.variantSize}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING SAVE BAR --- */}
      {totalUnsaved > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-gray-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-gray-900 px-6 py-4 rounded-full shadow-2xl flex items-center justify-between border border-white/10 dark:border-gray-200/20">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <span className="font-semibold text-sm">
                {totalUnsaved} Updates
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPendingUpdates({})}
                className="px-4 py-2 hover:bg-white/10 dark:hover:bg-black/5 rounded-full text-xs font-medium text-gray-300 dark:text-gray-600 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => executeBulkSave.mutate()}
                disabled={executeBulkSave.isPending}
                className="bg-white dark:bg-black text-black dark:text-white px-5 py-2 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg"
              >
                {executeBulkSave.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Inventory Overview
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Real-time stock management.
            </p>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by SKU or Name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-slate-800 focus:border-gray-300 dark:focus:border-slate-700 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* --- STATS & ALERTS GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Stats Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 h-full content-start">
            {/* Total Stock */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-30 relative overflow-hidden group">
              <div className="absolute top-4 right-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                <Box size={20} />
              </div>
              <span className="text-gray-500 dark:text-slate-400 text-sm font-medium">
                Total Stock
              </span>
              <div className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                {tableData?.stats?.totalStock?.toLocaleString() || 0}
              </div>
            </div>

            {/* Out of Stock */}
            <button
              onClick={toggleOutOfStockFilter}
              className={`p-5 rounded-[24px] border flex flex-col justify-between h-32 text-left transition-all relative overflow-hidden
                 ${
                   isOutOfStockFilter
                     ? "bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800 ring-2 ring-rose-500/20"
                     : "bg-white border-gray-100 dark:bg-slate-900 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm"
                 }
              `}
            >
              <div
                className={`absolute top-4 right-4 p-2 rounded-full ${isOutOfStockFilter ? "bg-rose-200 text-rose-700" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"}`}
              >
                <PackageX size={20} />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${isOutOfStockFilter ? "text-rose-700 dark:text-rose-400" : "text-gray-500 dark:text-slate-400"}`}
                >
                  Out of Stock
                </span>
                {isOutOfStockFilter && (
                  <X size={14} className="text-rose-600" />
                )}
              </div>
              <div
                className={`text-4xl font-bold tracking-tight ${isOutOfStockFilter ? "text-rose-700 dark:text-rose-400" : "text-gray-900 dark:text-white"}`}
              >
                {tableData?.stats?.outOfStock?.toLocaleString() || 0}
              </div>
            </button>

            {/* Value Card */}
            <div className="col-span-2 bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 p-7 rounded-[24px] shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between h-40 relative overflow-hidden group transition-all hover:shadow-lg">
              {/* Decorative Glow (Dark Mode) */}
              <div className="hidden dark:block absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500"></div>

              {/* Header: Label & Icon */}
              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-slate-400 text-sm font-semibold tracking-wide uppercase">
                    Est. Inventory Value
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-medium">
                    Total asset value
                  </span>
                </div>

                {/* Icon with fixed size for better proportion */}
                <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                  <DollarSign size={24} strokeWidth={2.5} />
                </div>
              </div>

              {/* Footer: Big Value */}
              <div className="text-4xl font-bold text-gray-900 dark:text-white z-10 tracking-tight flex items-baseline">
                <span className="text-xl text-gray-400 dark:text-slate-500 font-semibold mr-2 -ml-1">
                  Rs.
                </span>
                {(tableData?.stats?.totalValue || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* RIGHT: Alerts Panel (Matching Height) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm flex flex-col h-full min-h-[300px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Inventory Alerts
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Stock levels below 10 units.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-100 dark:border-slate-700">
                <Sparkles size={14} className="text-amber-500" />{" "}
                <span>Restock Needed</span>
              </div>
            </div>

            {isAlertsLoading ? (
              <div className="flex-1 flex justify-center items-center">
                <Loader2 className="animate-spin text-gray-300" size={30} />
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <PackageX size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium">No alerts right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lowStockItems.slice(0, 4).map((item) => (
                  <button
                    key={item.uniqueKey}
                    onClick={() => handleAlertClick(item.sku, item.variantSize)}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all text-left w-full group"
                  >
                    {/* 👇 Updated: w-20 h-25 (80px x 100px) */}
                    <div className="w-20 h-25 bg-gray-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 shrink-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* 👇 Updated: Flex column justify-between with h-25 to match image */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-25 py-0.5">
                      <div>
                        <span className="bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-fit mb-1 block">
                          Low Stock
                        </span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </p>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 uppercase font-medium">
                            SKU
                          </span>
                          <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
                            {item.sku}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 uppercase font-medium block">
                            Qty
                          </span>
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            {item.currentStock}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {lowStockItems.length > 4 && (
                  <div className="col-span-full text-center mt-2">
                    <button
                      onClick={() => setIsAlertModalOpen(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center justify-center gap-1 w-full py-2"
                    >
                      View {lowStockItems.length - 4} more alerts{" "}
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* --- MAIN TABLE --- */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
          {/* Table Content - Same as before, logic preserved */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Inventory List
              </h2>
              {isOutOfStockFilter && (
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full animate-in fade-in zoom-in">
                  Out of Stock Only
                </span>
              )}
              {targetVariant && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in zoom-in">
                  Filter: {targetVariant.sku}
                  <button
                    onClick={() => {
                      setTargetVariant(null);
                      setSearchTerm("");
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
            {(searchTerm || isOutOfStockFilter || targetVariant) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setIsOutOfStockFilter(false);
                  setTargetVariant(null);
                }}
                className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 px-4 py-2 rounded-full transition border border-gray-200 dark:border-slate-700"
              >
                <Filter size={14} /> Clear Filters
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800">
            {isTableLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="animate-spin text-gray-300" size={32} />
              </div>
            ) : tableRows.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center text-gray-400">
                <PackageX
                  size={40}
                  className="mb-4 text-gray-200 dark:text-slate-700"
                />
                <p className="text-lg font-medium text-gray-500 dark:text-slate-400">
                  {isOutOfStockFilter
                    ? "No 'Out of Stock' items found."
                    : "No products match your search."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 dark:bg-slate-950/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-100 dark:border-slate-800 backdrop-blur-sm">
                  <tr>
                    <th className="p-5 pl-6 min-w-[250px]">Product</th>
                    <th className="p-5 min-w-[120px]">SKU</th>
                    <th className="p-5">Variant</th>
                    <th className="p-5 text-center">Status</th>
                    <th className="p-5 text-right pr-6 min-w-[150px]">
                      Stock Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {tableRows.map((row) => {
                    const isEdited =
                      pendingUpdates[row.uniqueKey] !== undefined;
                    const displayStock = isEdited
                      ? pendingUpdates[row.uniqueKey].newStock
                      : row.currentStock;

                    let stockClass =
                      "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
                    if (isEdited)
                      stockClass =
                        "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-100 dark:ring-blue-900/30";
                    else if (displayStock === 0)
                      stockClass =
                        "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800";
                    else if (displayStock < 10)
                      stockClass =
                        "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";

                    return (
                      <tr
                        key={row.uniqueKey}
                        className={`group transition-colors ${isEdited ? "bg-blue-50/30 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-25 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-all">
                              {row.image ? (
                                <img
                                  src={row.image}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                                  <Loader2 size={16} className="animate-spin" />
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1 text-base">
                              {row.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            {row.sku}
                          </span>
                        </td>
                        <td className="p-4">
                          {row.variantSize ? (
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-3 text-xs font-bold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
                              {row.variantSize}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic pl-2">
                              Single
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {isEdited ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                              Editing
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-400 dark:text-slate-500">
                              Synced
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right pr-6">
                          <input
                            type="number"
                            value={displayStock}
                            min={0}
                            onChange={(e) => handleEdit(row, e.target.value)}
                            className={`w-28 py-2 px-3 text-right font-bold text-sm rounded-xl border-2 outline-none transition-all shadow-sm focus:shadow-md ${stockClass} bg-transparent`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* PAGINATION */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-slate-800">
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
              Page{" "}
              <span className="text-gray-900 dark:text-white font-bold">
                {tableData?.pagination?.page || 1}
              </span>{" "}
              of{" "}
              <span className="text-gray-900 dark:text-white font-bold">
                {tableData?.pagination?.totalPages || 1}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-slate-300"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={
                  !tableData || page >= (tableData.pagination?.totalPages || 1)
                }
                className="p-2.5 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-slate-300"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
