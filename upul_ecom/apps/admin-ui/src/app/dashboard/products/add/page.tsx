"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/axiosInstance";
import ProductForm from "../components/ProductForm";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      return axiosInstance.post('/api/products', formData);
    },
    onSuccess: () => {
      toast.success("Product created successfully! ");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/dashboard/products");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || "Failed to create product";
      toast.error(msg);
    }
  });

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard/products" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-3">
            <ArrowLeft size={16} /> Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Add New Product
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Fill in the details to create a new item.</p>
        </div>

        <ProductForm 
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          isLoading={createMutation.isPending}
        />
      </div>
      </div>
    </>
  );
}