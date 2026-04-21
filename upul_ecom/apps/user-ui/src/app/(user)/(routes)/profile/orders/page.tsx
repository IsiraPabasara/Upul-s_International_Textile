'use client';
import { usePageTitle } from '@/app/hooks/usePageTitle';

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import { ChevronLeft, ArrowRight, ChevronRight } from "lucide-react";

export default function UserOrdersPage() {
  usePageTitle('My Orders', 'Track and manage your orders');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['my-orders', currentPage], // Include page in key to refetch on change
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/orders/my-orders?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      return res.data;
    },
    placeholderData: (previousData) => previousData, // Keeps old data visible while loading next page
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
        case 'DELIVERED': return 'bg-green-50 text-green-700 border-green-200';
        case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
        case 'SHIPPED': return 'bg-blue-50 text-blue-700 border-blue-200';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xs uppercase tracking-[0.3em] font-bold">Loading Orders...</div>;

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="w-full min-h-screen bg-white font-outfit pb-32">
      <div className="max-w-5xl mx-auto px-6 pt-20">
        
        <Link href="/profile" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-gray-500 hover:text-black transition-colors mb-12">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <div className="flex items-end justify-between mb-12 border-b border-black pb-8">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Order History</h1>
            <p className="text-sm font-bold text-gray-400">{data?.totalOrders || 0} Orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-lg">
             <p className="text-base text-gray-400 mb-8 uppercase tracking-widest">You haven't placed any orders yet</p>
             <Link href="/shop" className="inline-block border-b-2 border-black text-xs font-bold uppercase tracking-[0.2em] pb-2">Start Shopping</Link>
          </div>
        ) : (
          <>
            <div className="space-y-8 min-h-[60vh]"> {/* min-h prevents layout jump */}
               {orders.map((order: any) => (
                  <Link href={`/profile/orders/${order.id}`} key={order.id} className="group block">
                    <div className="border border-gray-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-black transition-all bg-white hover:shadow-xl">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-4">
                            <span className="text-xl font-bold font-mono text-black">#{order.orderNumber}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1 border rounded-sm ${getStatusStyle(order.status)}`}>
                                {order.status}
                            </span>
                         </div>
                         <p className="text-sm text-gray-400 uppercase tracking-wide">
                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                         </p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 md:gap-16 w-full md:w-auto">
                         <div className="flex -space-x-4">
                            {order.items.slice(0, 3).map((item: any, i: number) => (
                               <div key={i} className="w-12 h-12 md:w-14 md:h-14 rounded-full border-4 border-white bg-gray-50 overflow-hidden relative shadow-sm">
                                  <img src={item.image} alt="item" className="w-full h-full object-cover" />
                               </div>
                            ))}
                         </div>

                         <div className="text-right shrink-0">
                            <p className="text-lg font-bold mb-2 text-black">LKR {order.totalAmount.toLocaleString()}</p>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-end gap-2 text-gray-400 group-hover:text-black transition-colors">
                                Details <ArrowRight size={12} />
                            </span>
                         </div>
                      </div>
                    </div>
                  </Link>
               ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-16 flex items-center justify-center gap-4">
              <button 
                onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo(0,0);
                }}
                disabled={currentPage === 1}
                className="p-3 border border-gray-200 rounded-full disabled:opacity-30 hover:border-black transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-xs font-bold uppercase tracking-widest">
                Page {currentPage} <span className="text-gray-300 mx-2">/</span> {totalPages}
              </div>

              <button 
                onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo(0,0);
                }}
                disabled={currentPage >= totalPages || isPlaceholderData}
                className="p-3 border border-gray-200 rounded-full disabled:opacity-30 hover:border-black transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}