"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Phone,
  MapPin,
  CheckCircle,
  Truck,
  XCircle,
  ArrowLeft,
  PackageCheck,
  CreditCard,
  Banknote,
  Copy,
  Calendar,
  Check,
  AlertTriangle,
  PackageOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import OrderTimeline from "../components/OrderTimeline";

const CopyButton = ({
  text,
  label,
  className = "",
}: {
  text: string;
  label: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`transition-all duration-200 flex items-center justify-center p-1.5 rounded-md ${className} ${copied ? "text-emerald-500 scale-110 bg-emerald-50 dark:bg-emerald-500/10" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"}`}
      title={`Copy ${label}`}
    >
      {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
    </button>
  );
};

// Standardized colors
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

export default function AdminOrderDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [trackingInput, setTrackingInput] = useState("");
  const [isPhoneCopied, setIsPhoneCopied] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () =>
      (await axiosInstance.get(`/api/orders/admin/${id}`)).data,
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      status,
      tracking,
    }: {
      status: string;
      tracking?: string;
    }) => {
      await axiosInstance.patch(`/api/orders/admin/${id}/status`, {
        status,
        trackingNumber: tracking,
      });
    },
    onSuccess: () => {
      toast.success("Order status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      setTrackingInput("");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Update failed"),
  });

  const handleUpdateStatus = (newStatus: string) => {
    if (newStatus === "SHIPPED" && !trackingInput && !order.trackingNumber) {
      toast.error("Please enter a Domex tracking number first");
      return;
    }
    statusMutation.mutate({ status: newStatus, tracking: trackingInput });
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto animate-pulse space-y-8">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-8"></div>
          <div className="flex justify-between items-end">
            <div>
              <div className="h-10 w-64 sm:w-96 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3"></div>
              <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
            </div>
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
          <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="h-40 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800"></div>
                <div className="h-40 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800"></div>
              </div>
            </div>
            <div className="h-80 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800"></div>
          </div>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950">
        <AlertTriangle size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-600">Order not found</h2>
        <Link
          href="/dashboard/orders"
          className="mt-4 text-blue-600 font-bold hover:underline"
        >
          Return to Orders
        </Link>
      </div>
    );

  // 🟢 CLEANED UP: Only terminates on Delivered, Cancelled, or Returned
  const isOrderTerminated = ["CANCELLED", "RETURNED", "DELIVERED"].includes(
    order.status,
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* Header Navigation */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors w-fit"
          >
            <ArrowLeft size={16} /> Back to Orders
          </Link>
        </div>

        {/* Title & Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div className="w-full md:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight break-all sm:break-normal">
                Order #{order.orderNumber}
              </h1>
              <div className="bg-white border border-gray-100 dark:border-slate-800 dark:bg-slate-900 shadow-sm rounded-lg shrink-0">
                <CopyButton text={order.orderNumber} label="Order ID" />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Calendar size={14} className="shrink-0" /> Placed on{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end w-full md:w-auto justify-between md:justify-start mt-2 md:mt-0 pt-4 md:pt-0 border-t border-gray-200 md:border-none dark:border-slate-800">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-bold md:mb-1">
              Status
            </span>
            <span
              className={`text-xs sm:text-sm font-extrabold px-3 sm:px-4 py-1.5 rounded-full border ring-1 ring-inset ${getStatusColor(order.status)}`}
            >
              {order.status}
            </span>
          </div>
        </div>

        <OrderTimeline status={order.status} date={order.updatedAt} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-8">
          {/* LEFT COLUMN: Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Items Card */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mb-4 sm:mb-6">
                Items Ordered
              </h2>
              <div className="space-y-4 sm:space-y-6">
                {order.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-3 sm:gap-6 border-b border-gray-50 dark:border-slate-800 pb-4 sm:pb-6 last:border-0 last:pb-0"
                  >
                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base lg:text-lg truncate">
                        {item.name}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">
                        Qty: <span className="font-bold">{item.quantity}</span>{" "}
                        {item.size && `| Size: ${item.size}`}
                      </p>
                      <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mt-1.5 sm:mt-2">
                        LKR {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full sm:w-auto">
                  {order.paymentMethod === "PAYHERE" ? (
                    <span className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 sm:py-2 rounded-xl border border-blue-100 dark:border-blue-800 w-full sm:w-auto">
                      <CreditCard size={16} /> PAID ONLINE
                    </span>
                  ) : (
                    <span className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 sm:py-2 rounded-xl border border-emerald-100 dark:border-emerald-800 w-full sm:w-auto">
                      <Banknote size={16} /> CASH ON DELIVERY
                    </span>
                  )}
                </div>
                <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end bg-gray-50 sm:bg-transparent dark:bg-slate-800/50 sm:dark:bg-transparent p-3 sm:p-0 rounded-xl">
                  <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold block sm:mb-0.5">
                    Total Amount
                  </span>
                  <span className="font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                    LKR {order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <MapPin size={14} /> Shipping Address
                  </h3>
                  <CopyButton
                    text={order.shippingAddress.addressLine}
                    label="Address"
                  />
                </div>
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                    {order.shippingAddress.firstname}{" "}
                    {order.shippingAddress.lastname}
                  </p>
                  <p className="leading-relaxed">
                    {order.shippingAddress.addressLine}
                  </p>
                  {order.shippingAddress.apartment && (
                    <p className="leading-relaxed">{order.shippingAddress.apartment}</p>
                  )}
                  <p className="leading-relaxed">
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </p>
                  <p className="leading-relaxed">
                    {order.email}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Phone size={14} /> Contact Details
                  </h3>
                  <CopyButton
                    text={order.shippingAddress.phoneNumber}
                    label="Phone Number"
                  />
                </div>
                <div
                  className={`flex-1 p-4 sm:p-5 rounded-2xl flex flex-col justify-center items-center text-center group cursor-pointer transition-all select-none ${isPhoneCopied ? "bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-yellow-50 border border-yellow-100 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30 dark:hover:bg-yellow-900/20"}`}
                  onClick={() => {
                    navigator.clipboard.writeText(
                      order.shippingAddress.phoneNumber,
                    );
                    toast.success("Phone number copied!");
                    setIsPhoneCopied(true);
                    setTimeout(() => setIsPhoneCopied(false), 2000);
                  }}
                >
                  {isPhoneCopied ? (
                    <div className="animate-in fade-in zoom-in duration-200">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5 sm:mb-2" />
                      <p className="text-emerald-700 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                        Copied!
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] sm:text-xs text-yellow-700 dark:text-yellow-500 font-bold mb-1.5 sm:mb-2">
                        Tap to Copy
                      </p>
                      <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                        {order.shippingAddress.phoneNumber}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Management */}
          <div className="space-y-4 sm:space-y-6">
            {!isOrderTerminated ? (
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 sticky top-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">
                  Manage Status
                </h2>
                <div className="space-y-3">
                  {/* 1. PENDING -> Confirm */}
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => handleUpdateStatus("CONFIRMED")}
                      disabled={statusMutation.isPending}
                      className="w-full py-3.5 sm:py-4 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      {statusMutation.isPending ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}{" "}
                      Confirm Order
                    </button>
                  )}

                  {/* 2. CONFIRMED -> Process */}
                  {order.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleUpdateStatus("PROCESSING")}
                      disabled={statusMutation.isPending}
                      className="w-full py-3.5 sm:py-4 text-sm sm:text-base bg-purple-600 hover:bg-purple-700 transition-colors text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      {statusMutation.isPending ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <PackageOpen size={18} />
                      )}{" "}
                      Start Processing
                    </button>
                  )}

                  {/* 3. PROCESSING OR CONFIRMED -> Shipping UI */}
                  {(order.status === "PROCESSING" ||
                    order.status === "CONFIRMED") && (
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
                      <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                        Domex Tracking ID
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Enter ID..."
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          className="w-full p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                        <button
                          onClick={() => handleUpdateStatus("SHIPPED")}
                          disabled={statusMutation.isPending}
                          className="w-full sm:w-auto shrink-0 px-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                          {statusMutation.isPending ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Truck size={16} />
                          )}{" "}
                          Ship
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. SHIPPED -> Final Options */}
                  {order.status === "SHIPPED" && (
                    <div className="flex flex-col gap-3">
                      {/* Mark as Delivered (Main Action) */}
                      <button
                        onClick={() => handleUpdateStatus("DELIVERED")}
                        disabled={statusMutation.isPending}
                        className="w-full py-3.5 sm:py-4 text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 transition-colors text-white rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        {statusMutation.isPending ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <PackageCheck size={18} />
                        )}{" "}
                        Mark as Delivered
                      </button>

                      {/* Mark as Returned (Only available after Shipping) */}
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Mark this package as Returned? Stock will be restored.",
                            )
                          )
                            handleUpdateStatus("RETURNED");
                        }}
                        disabled={statusMutation.isPending}
                        className="w-full py-3 text-sm font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 rounded-xl border border-transparent flex items-center justify-center gap-2 transition-colors"
                      >
                        <AlertTriangle size={16} /> Mark as Returned
                      </button>
                    </div>
                  )}

                  {/* 5. DANGER ZONE: Cancel Button (Only for Early Stages) */}
                  {["PENDING", "CONFIRMED", "PROCESSING"].includes(
                    order.status,
                  ) && (
                    <div className="pt-5 sm:pt-6 mt-5 sm:mt-6 border-t border-gray-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Cancel this Order? Stock will be restored.",
                            )
                          )
                            handleUpdateStatus("CANCELLED");
                        }}
                        className="w-full py-3 text-xs sm:text-sm font-bold text-slate-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/20 dark:text-slate-400 dark:hover:text-red-400 rounded-xl border border-transparent flex items-center justify-center gap-2 transition-colors"
                      >
                        <XCircle size={16} /> Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-slate-900/50 p-5 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 dark:border-slate-800 text-center sticky top-6">
                {order.status === "DELIVERED" ? (
                  <PackageCheck
                    size={32}
                    className="mx-auto text-emerald-500 mb-3"
                  />
                ) : (
                  <AlertTriangle
                    size={32}
                    className="mx-auto text-slate-400 dark:text-slate-500 mb-3"
                  />
                )}
                <h3 className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300">
                  {order.status === "DELIVERED"
                    ? "Order Completed"
                    : "Order Closed"}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                  This order is {order.status.toLowerCase()}. Actions are
                  disabled.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
