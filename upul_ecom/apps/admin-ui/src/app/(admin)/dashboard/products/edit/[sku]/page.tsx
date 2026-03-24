"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../axiosInstance";
import ProductForm, { ProductFormValues } from "../../components/ProductForm";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const { sku } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", sku],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/products/${sku}`);
      return res.data;
    },
    enabled: !!sku,
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: ProductFormValues) => {
      return axiosInstance.put(`/api/products/${sku}`, formData);
    },
    onSuccess: () => {
      toast.success("Product updated - Redirecting..", {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#10b981",
          color: "#fff",
          fontSize: "16px",
          fontWeight: "bold",
          padding: "16px 24px",
          borderRadius: "12px",
        },
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", sku] });
      
      setTimeout(() => {
        router.push("/dashboard/productlist");
      }, 2000);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update product", {
        duration: 4000,
        position: "top-center",
      });
    },
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (isError || !product) return <div className="text-center p-20 text-red-500">Product Not Found</div>;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 p-6 md:p-10 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard/productlist" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-3">
            <ArrowLeft size={16} /> Back to Inventory Page
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Edit Product
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{product.name}</p>
        </div>

        <ProductForm
          initialData={product}
          onSubmit={async (data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
        />
      </div>
      </div>
    </>
  );
}