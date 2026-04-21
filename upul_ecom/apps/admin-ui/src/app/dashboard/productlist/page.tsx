"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageX,
  Trash2,
  Tag,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";

// Types matching your API response
interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  visible: boolean;
  images: { url: string }[];
  category: { name: string };
  variants: { size: string; stock: number }[];
}

interface ApiResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- SHARED SCROLLBAR ---
const customScrollbar =
  "[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full";

export default function ProductListPage() {
  const queryClient = useQueryClient();

  // --- STATE ---
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce Logic: Wait 500ms after typing stops before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- 1. FETCH PRODUCTS ---
  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ["products", page, debouncedSearch],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/products", {
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  // --- 2. TOGGLE VISIBILITY MUTATION ---
  const toggleMutation = useMutation({
    mutationFn: async ({
      sku,
      currentStatus,
    }: {
      sku: string;
      currentStatus: boolean;
    }) => {
      const res = await axiosInstance.patch(`/api/products/${sku}/visibility`, {
        visible: !currentStatus,
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["products", page, debouncedSearch],
        (old: ApiResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((p) =>
              p.sku === variables.sku
                ? { ...p, visible: !variables.currentStatus }
                : p,
            ),
          };
        },
      );
      toast.success(
        variables.currentStatus ? "Product Hidden" : "Product Visible",
      );
    },
    onError: () => toast.error("Failed to update visibility"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (sku: string) => {
      await axiosInstance.delete(`/api/products/${sku}`);
    },
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const handleDelete = (sku: string) => {
    if (
      confirm(
        "Are you sure you want to delete this product? This cannot be undone.",
      )
    ) {
      deleteMutation.mutate(sku);
    }
  };

  // --- RENDER ---
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <PackageX
              className="text-blue-500 hidden sm:block"
              size={28}
              strokeWidth={2.5}
            />
            Inventory
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Manage your store products and visibility.
          </p>
        </div>
        <Link
          href="/dashboard/products/add"
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Add Product
        </Link>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="bg-white dark:bg-slate-900/50 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm mb-6 transition-colors">
        <div className="relative w-full group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
            size={20}
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Search by Name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[48px] sm:h-[52px] pl-12 pr-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm sm:text-base font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
        {/* Table Wrapper for horizontal scroll (only triggers if absolute needed) */}
        <div className={`w-full overflow-x-auto ${customScrollbar}`}>
          {isLoading && !data ? (
            <div className="p-20 flex flex-col items-center justify-center text-blue-500">
              <Loader2
                className="animate-spin mb-4"
                size={32}
                strokeWidth={2.5}
              />
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400">
                Loading inventory...
              </p>
            </div>
          ) : isError ? (
            <div className="p-20 text-center text-red-500 font-bold bg-red-50 dark:bg-red-900/10 m-4 rounded-2xl">
              Failed to load products. Please try again.
            </div>
          ) : data?.data.length === 0 ? (
            <div className="p-24 flex flex-col items-center text-gray-400 dark:text-slate-500">
              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-full mb-4">
                <Tag size={32} strokeWidth={2} />
              </div>
              <p className="font-bold text-lg text-gray-900 dark:text-white">
                No products found
              </p>
              <p className="text-sm mt-1">
                Try adjusting your search or add a new product.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-full md:min-w-[900px]">
              <thead className="bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-sm text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="p-3 sm:p-5 pl-4 sm:pl-6 w-[40%] md:w-[30%]">Product</th>
                  <th className="p-3 sm:p-5 w-[20%] md:w-[15%]">SKU</th>
                  {/* 🟢 Hidden on mobile */}
                  <th className="hidden md:table-cell p-3 sm:p-5 w-[15%]">Price</th>
                  <th className="p-3 sm:p-5 w-[25%] md:w-[20%]">Stock</th>
                  {/* 🟢 Hidden on mobile */}
                  <th className="hidden md:table-cell p-3 sm:p-5 text-center w-[10%]">Visible</th>
                  <th className="p-3 sm:p-5 text-right pr-4 sm:pr-6 w-[15%] md:w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                {data?.data.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* 1. Product Info */}
                    <td className="p-3 sm:p-5 pl-4 sm:pl-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-22 sm:w-12 sm:h-22 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shrink-0">
                          {product.images[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                              <PackageX size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-[12px] sm:text-sm text-gray-900 dark:text-white line-clamp-2 sm:line-clamp-1">
                            {product.name}
                          </p>
                          {/* 🟢 Category hidden on mobile to save space */}
                          <p className="hidden sm:block text-[10px] sm:text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">
                            {product.category?.name || "Uncategorized"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 2. SKU */}
                    <td className="p-3 sm:p-5 text-gray-500 dark:text-slate-400 font-mono text-[10px] sm:text-xs font-semibold truncate max-w-[80px] sm:max-w-none">
                      {product.sku}
                    </td>

                    {/* 3. Price - Hidden on mobile */}
                    <td className="hidden md:table-cell p-3 sm:p-5 font-black text-gray-900 dark:text-white text-sm sm:text-base">
                      Rs. {product.price.toLocaleString()}
                    </td>

                    {/* 4. Stock */}
                    <td className="p-3 sm:p-5">
                      {(() => {
                        const hasVariants =
                          product.variants && product.variants.length > 0;
                        const totalStock = hasVariants
                          ? product.variants.reduce(
                              (sum, v) => sum + (Number(v.stock) || 0),
                              0,
                            )
                          : Number(product.stock) || 0;

                        return (
                          <div className="flex flex-col gap-1.5 items-start">
                            {/* Primary Stock Badge */}
                            <span
                              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                                totalStock === 0
                                  ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400"
                                  : totalStock < 10
                                    ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400"
                              }`}
                            >
                              <span className="font-black text-xs sm:text-sm">
                                {totalStock}
                              </span>
                              {totalStock === 0
                                ? "Out"
                                : totalStock < 10
                                  ? "Low"
                                  : "In"}
                            </span>

                            {/* Minimalist Variants Indicator */}
                            {hasVariants && (
                              <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 dark:text-slate-400 flex items-center gap-1 bg-gray-50 dark:bg-slate-800/50 px-1.5 sm:px-2 py-0.5 rounded-md border border-gray-100 dark:border-slate-700 w-fit">
                                <Layers
                                  size={10}
                                  strokeWidth={2.5}
                                  className="text-blue-500 hidden sm:block"
                                />
                                {product.variants.length} Sizes
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 5. Visibility Toggle - Hidden on mobile */}
                    <td className="hidden md:table-cell p-3 sm:p-5 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          toggleMutation.mutate({
                            sku: product.sku,
                            currentStatus: product.visible,
                          })
                        }
                        disabled={toggleMutation.isPending}
                        className="relative inline-flex items-center justify-center cursor-pointer outline-none active:scale-95 transition-transform"
                        title={product.visible ? "Publicly Visible" : "Hidden"}
                      >
                        <div
                          className={`flex items-center gap-2 ${product.visible ? "opacity-100" : "opacity-60"}`}
                        >
                          <div
                            className={`w-10 h-5 rounded-full transition-colors duration-300 shadow-inner ${product.visible ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-700"}`}
                          >
                            <div
                              className={`absolute top-[2px] h-4 w-4 bg-white border border-gray-200 dark:border-gray-500 rounded-full shadow-sm transition-transform duration-300 ${product.visible ? "translate-x-5 border-transparent left-0" : "translate-x-0 left-[2px]"}`}
                            />
                          </div>
                        </div>
                      </button>
                    </td>

                    {/* 6. Actions */}
                    <td className="p-3 sm:p-5 text-right pr-4 sm:pr-6">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <Link
                          href={`/dashboard/products/edit/${product.sku}`}
                          className="p-2 sm:px-3 sm:py-2 flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95"
                          title="Edit Product"
                        >
                          <Edit size={16} strokeWidth={2.5} />
                          <span className="hidden sm:block">Edit</span>
                        </Link>

                        <button
                          onClick={() => handleDelete(product.sku)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-95"
                          title="Delete Product"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        <div className="bg-gray-50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 p-4 sm:p-5 flex items-center justify-between transition-colors">
          <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400">
            Page{" "}
            <span className="font-black text-gray-900 dark:text-white">
              {page}
            </span>{" "}
            of{" "}
            <span className="font-black text-gray-900 dark:text-white">
              {data?.pagination.totalPages || 1}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:border-gray-200 dark:disabled:hover:border-slate-700 disabled:hover:text-gray-700 dark:disabled:hover:text-slate-300 transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || page >= data.pagination.totalPages}
              className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:border-gray-200 dark:disabled:hover:border-slate-700 disabled:hover:text-gray-700 dark:disabled:hover:text-slate-300 transition-all active:scale-95 shadow-sm"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}