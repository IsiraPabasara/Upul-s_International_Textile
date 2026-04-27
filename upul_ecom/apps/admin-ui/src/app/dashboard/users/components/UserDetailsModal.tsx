"use client";

import { X, Loader2, Mail, Phone, MapPin, ShoppingBag, DollarSign, TrendingUp, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // ⭐ 1. Import createPortal
import axiosInstance from "@/app/utils/axiosInstance";

interface UserDetailsModalProps {
  user: any;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

export default function UserDetailsModal({
  user,
  isOpen,
  isLoading,
  onClose,
}: UserDetailsModalProps) {
  const [mounted, setMounted] = useState(false); // ⭐ 2. Track mounting for Next.js SSR

  // ⭐ 3. Handle mounting and lock background scrolling
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch user's orders
  const { data: ordersData } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await axiosInstance.get(`/api/admin/users/${user.id}/orders`);
      return response.data.data;
    },
    enabled: !!user?.id && isOpen,
  });

  // ⭐ 4. Prevent rendering until mounted (fixes hydration errors)
  if (!isOpen || !mounted) return null;

  // ⭐ 5. Wrap the entire return inside createPortal
  return createPortal(
    <>
      {/* Sleek Overlay with Blur - Boosted z-index */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[999] transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal Container - Boosted z-index and pointer-events logic to allow overlay clicks */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
        <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20 dark:border-slate-700/50 pointer-events-auto">
          
          {/* Header */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 px-6 py-5 flex items-center justify-between shrink-0 z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              User Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
            >
              <X size={20} className="text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#F8F9FC]/50 dark:bg-slate-950/50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                <span className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">Loading profile...</span>
              </div>
            ) : user ? (
              <div className="space-y-8">
                
                {/* Personal Information */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                    Personal Information
                  </h3>
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[20px] p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-slate-800/50">
                      <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">Name</span>
                      <span className="text-gray-900 dark:text-white font-bold">
                        {user.firstname} {user.lastname}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-slate-800/50">
                      <span className="text-sm text-gray-500 dark:text-slate-400 font-medium flex items-center gap-2">
                        <Mail size={16} className="text-blue-500" /> Email
                      </span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {user.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-slate-800/50">
                      <span className="text-sm text-gray-500 dark:text-slate-400 font-medium flex items-center gap-2">
                        <Phone size={16} className="text-green-500" /> Phone
                      </span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {user.phonenumber || <span className="italic text-gray-400">Not provided</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-slate-800/50">
                      <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">Role</span>
                      <span
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          user.role === "admin"
                            ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800/50 dark:text-purple-400"
                            : user.role === "moderator"
                              ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-400"
                              : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">Joined</span>
                      <span className="text-gray-900 dark:text-white font-semibold text-sm">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Order Statistics */}
                {user.orderStats && (
                  <section>
                    <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                      Order Statistics
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 border border-blue-100 dark:border-blue-800/30 shadow-sm flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                          <ShoppingBag size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Total Orders
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {user.orderStats.total}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 border border-emerald-100 dark:border-emerald-800/30 shadow-sm flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                          <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Total Spent
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          <span className="text-sm text-gray-400 mr-1">LKR</span>
                          {user.orderStats.totalSpent.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4 text-center border border-blue-100 dark:border-blue-800/30 transition-all hover:shadow-sm">
                        <Calendar size={18} className="mx-auto mb-2 text-blue-500 dark:text-blue-400" strokeWidth={2} />
                        <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Pending</p>
                        <p className="text-xl font-black text-blue-700 dark:text-blue-300 mt-0.5">{user.orderStats.pending}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 text-center border border-amber-100 dark:border-amber-800/30 transition-all hover:shadow-sm">
                        <Calendar size={18} className="mx-auto mb-2 text-amber-500 dark:text-amber-400" strokeWidth={2} />
                        <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Confirmed</p>
                        <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">{user.orderStats.confirmed}</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-4 text-center border border-orange-100 dark:border-orange-800/30 transition-all hover:shadow-sm">
                        <TrendingUp size={18} className="mx-auto mb-2 text-orange-500 dark:text-orange-400" strokeWidth={2} />
                        <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Processing</p>
                        <p className="text-xl font-black text-orange-700 dark:text-orange-300 mt-0.5">{user.orderStats.processing}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-4 text-center border border-purple-100 dark:border-purple-800/30 transition-all hover:shadow-sm">
                        <ShoppingBag size={18} className="mx-auto mb-2 text-purple-500 dark:text-purple-400" strokeWidth={2} />
                        <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Shipped</p>
                        <p className="text-xl font-black text-purple-700 dark:text-purple-300 mt-0.5">{user.orderStats.shipped}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-4 text-center border border-emerald-100 dark:border-emerald-800/30 transition-all hover:shadow-sm">
                        <ShoppingBag size={18} className="mx-auto mb-2 text-emerald-500 dark:text-emerald-400" strokeWidth={2} />
                        <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Delivered</p>
                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{user.orderStats.delivered}</p>
                      </div>
                      <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl p-4 text-center border border-rose-100 dark:border-rose-800/30 transition-all hover:shadow-sm">
                        <X size={18} className="mx-auto mb-2 text-rose-500 dark:text-rose-400" strokeWidth={2} />
                        <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cancelled</p>
                        <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-0.5">{user.orderStats.cancelled}</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Addresses */}
                {user.addresses && user.addresses.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                      Saved Addresses
                    </h3>
                    <div className="space-y-3">
                      {user.addresses.map((addr: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-900 rounded-[20px] p-5 border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                        >
                          {addr.isDefault && (
                            <div className="absolute top-0 right-0 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-b border-l border-blue-100 dark:border-blue-800/30">
                              Default
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-700">
                              <MapPin size={20} className="text-gray-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div className="flex-1 pt-0.5">
                              <p className="font-bold text-gray-900 dark:text-white mb-1">
                                {addr.firstname} {addr.lastname}
                              </p>
                              <div className="space-y-1 text-sm text-gray-500 dark:text-slate-400 font-medium">
                                <p>
                                  {addr.addressLine}{addr.apartment && `, ${addr.apartment}`}
                                </p>
                                <p>{addr.city}, {addr.postalCode}</p>
                                <p className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50 dark:border-slate-800/50">
                                  <Phone size={14} /> {addr.phoneNumber}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Recent Orders Preview */}
                {ordersData && ordersData.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                        Recent Orders
                      </h3>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      {ordersData.slice(0, 5).map((order: any) => (
                        <div
                          key={order.id}
                          className="bg-white dark:bg-slate-900 rounded-[16px] p-4 border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center group hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors"
                        >
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white font-mono text-sm">
                              #{order.orderNumber}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
                              {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <p className="font-bold text-gray-900 dark:text-white mb-1.5">
                              LKR {order.totalAmount.toLocaleString()}
                            </p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${
                                order.status === "DELIVERED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400"
                                  : order.status === "CANCELLED"
                                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400"
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 px-6 py-4 flex justify-end shrink-0 z-10">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body // ⭐ 6. Attach directly to the <body> tag
  );
}