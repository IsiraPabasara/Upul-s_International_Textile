"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/axiosInstance";
import ProductForm, { ProductFormValues } from "../../components/ProductForm";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, Loader2, PackageX } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const { sku } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 1. FETCH
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", sku],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/products/sku/${sku}`);
      return res.data;
    },
    enabled: !!sku,
  });

  // 2. UPDATE
  const updateMutation = useMutation({
    mutationFn: async (formData: ProductFormValues) => {
      return axiosInstance.put(`/api/products/${sku}`, formData);
    },
    onSuccess: () => {
      // Crisp, default professional toast
      toast.success("Product updated successfully!");
      
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", sku] });
      
      setIsRedirecting(true);
      
      // Snappier redirect so the user isn't left waiting
      setTimeout(() => {
        router.push("/dashboard/productlist");
      }, 800);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update product");
    },
  });

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 p-6 md:p-10 font-sans transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          
          {/* 🟢 ALWAYS RENDER THE HEADER - Prevents layout flashes! */}
          <div className="mb-8">
            <Link 
              href="/dashboard/productlist" 
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-3 font-medium"
            >
              <ArrowLeft size={16} /> Back to Inventory
            </Link>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Edit Product
                </h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
                  {isLoading ? "Loading details..." : product?.name || "Product details"}
                </p>
              </div>
            </div>
          </div>

          {/* 🟢 DYNAMIC CONTENT AREA */}
          {isLoading ? (
            // Premium Loading Skeleton
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" strokeWidth={2} />
              <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">
                Fetching product data...
              </p>
            </div>
          ) : isError || !product ? (
            // Premium Error / Not Found State
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-5">
                <PackageX className="w-10 h-10 text-red-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Product Not Found
              </h2>
              <p className="text-gray-500 dark:text-slate-400 text-center max-w-sm mb-6">
                The product you are trying to edit doesn't exist or may have been deleted.
              </p>
              <Link 
                href="/dashboard/productlist"
                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Return to Inventory
              </Link>
            </div>
          ) : (
            // The Form
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ProductForm
                initialData={product}
                onSubmit={async (data) => updateMutation.mutate(data)}
                isLoading={updateMutation.isPending || isRedirecting} // Keeps button spinning during redirect
              />
            </div>
          )}

        </div>
      </div>
    </>
  );
}