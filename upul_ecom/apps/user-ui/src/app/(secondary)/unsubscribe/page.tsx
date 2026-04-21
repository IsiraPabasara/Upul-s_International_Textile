"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import axiosInstance from "@/app/utils/axiosInstance";
import toast from "react-hot-toast";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleUnsubscribe = async () => {
    if (!email) return;
    
    setStatus("loading");
    try {
      // Matches the route structure where email routes are mounted at /admin/email
      await axiosInstance.post('/api/admin/email/unsubscribe', { email });
      setStatus("success");
    } catch (error: any) {
      setStatus("idle");
      toast.error(error.response?.data?.message || "Failed to unsubscribe. Please try again.");
    }
  };

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <h1 className="text-2xl font-bold uppercase tracking-tighter mb-4">Invalid Link</h1>
        <p className="text-gray-500 mb-8">This unsubscribe link is invalid or has expired.</p>
        <Link href="/" className="text-xs font-bold uppercase tracking-[0.2em] border-b border-black pb-1">
          Return to Store
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <CheckCircle2 size={48} className="text-green-600 mb-6" />
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4">Unsubscribed</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          <strong>{email}</strong> has been successfully removed from our mailing list. You will no longer receive promotional emails from UPUL'S International.
        </p>
        <Link href="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] hover:text-red-600 transition-colors">
          <ArrowLeft size={16} /> Return to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-20 px-4 text-center">
      <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4">Unsubscribe</h1>
      <p className="text-gray-600 mb-10 leading-relaxed">
        Are you sure you want to unsubscribe <strong>{email}</strong> from our newsletter? You'll miss out on exclusive discounts, new arrival alerts, and styling tips.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleUnsubscribe}
          disabled={status === "loading"}
          className="w-full sm:w-auto px-8 py-4 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          {status === "loading" ? "Processing..." : "Yes, Unsubscribe"}
        </button>
        
        <Link 
          href="/"
          className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams triggers client-side de-optimization in Next.js
export default function UnsubscribePage() {
  return (
    <div className="min-h-[60vh] bg-white font-outfit flex items-center justify-center">
      <Suspense fallback={<div className="text-xs uppercase tracking-[0.3em] font-bold">Loading...</div>}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
