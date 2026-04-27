'use client';
import { usePageTitle } from '@/app/hooks/usePageTitle';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  ArrowLeft,
  CreditCard,
  Banknote,
} from 'lucide-react';
import Link from 'next/link';

// ✅ Renamed from 'export default function TrackOrderPage' to 'function TrackOrderContent'
function TrackOrderContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['guest-order', token],
    queryFn: async () => {
      if (!token) return null;
      try {
        const res = await axiosInstance.get(`/api/orders/track/${token}`);
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 410) {
          throw err.response.data;
        }
        throw err;
      }
    },
    enabled: !!token,
    retry: false,
  });

  // Cancel order mutation (guest tracking)
  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await axiosInstance.patch(`/api/orders/track/${token}/cancel`);
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['guest-order', token] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    },
  });

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      cancelMutation.mutate();
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-500 font-bold">Invalid Tracking URL</p>
        <Link href="/" className="mt-4 underline text-sm">
          Return Home
        </Link>
      </div>
    );
  }

  // --- 1. HANDLE EXPIRED / COMPLETED STATE ---
  if (error) {
    const errData = error as any;
    if (errData?.message === 'Link Expired') {
      const isDelivered = errData.reason === 'DELIVERED';
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center border border-gray-100">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                isDelivered
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {isDelivered ? <CheckCircle size={40} /> : <XCircle size={40} />}
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">
              Order {isDelivered ? 'Delivered' : 'Cancelled'}
            </h1>
            <p className="text-gray-500 mb-6 leading-relaxed">
              This tracking link has expired because Order <b>#{errData.orderNumber}</b> has
              been completed.
            </p>
            <Link
              href="/shop"
              className="block w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      );
    }
    return <div className="min-h-screen flex items-center justify-center">Order not found.</div>;
  }

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );

  // --- 2. ACTIVE TRACKING STATE ---
  const isReturned = order.status === 'RETURNED';
  const isPayHere = order.paymentMethod === 'PAYHERE';

  // 🟢 Calculate subtotal and shipping fee
  const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const shippingFee = order.shippingFee || 450; // Use from order, fallback to default

  let steps = [
    { id: 'PENDING', label: 'Placed', icon: Clock },
    { id: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
    { id: 'PROCESSING', label: 'Processing', icon: Package },
    { id: 'SHIPPED', label: 'Shipped', icon: Truck },
    { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  ];

  if (isReturned) {
    steps = [
      { id: 'PENDING', label: 'Placed', icon: Clock },
      { id: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
      { id: 'SHIPPED', label: 'Shipped', icon: Truck },
      { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
      { id: 'RETURNED', label: 'Returned', icon: ArrowLeft },
    ];
  }

  const currentStepIndex = steps.findIndex((s) => s.id === order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 block">
              Live Tracking
            </span>
            <h1 className="text-3xl font-black text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Estimated Delivery: <span className="text-black font-medium">3-5 Business Days</span>
            </p>
          </div>

          {/* Tracking + Cancel button area */}
          <div className="flex flex-col md:text-right md:items-end gap-2 md:flex-col w-full md:w-auto">
            {order.trackingNumber && (
              <div className="bg-white px-5 py-3 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Domex Tracking ID</p>
                <p className="text-lg font-black font-mono tracking-wide">{order.trackingNumber}</p>
              </div>
            )}

            {isReturned && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded border border-orange-200">
                RETURNED
              </span>
            )}

            {/* Cancel button (only when PENDING) */}
            {order.status === 'PENDING' && (
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="text-[10px] font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 px-4 py-2 rounded transition-colors uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8 relative overflow-hidden hidden md:block">
          <div className="relative z-10 flex justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const Icon = step.icon;

              let activeColor = 'bg-black text-white';
              if (isReturned && step.id === 'RETURNED') activeColor = 'bg-orange-600 text-white';

              return (
                <div key={step.id} className="flex flex-col items-center relative z-10 w-24">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors duration-500
                    ${isCompleted ? activeColor : 'bg-gray-100 text-gray-400'}`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide transition-colors duration-500
                    ${isCompleted ? 'text-black' : 'text-gray-300'}`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute top-12 left-0 w-full h-1 bg-gray-100 z-0 px-12 md:px-20">
            <div
              className={`h-full transition-all duration-1000 ease-out ${isReturned ? 'bg-orange-600' : 'bg-black'}`}
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Mobile Status Card */}
        <div className="md:hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Current Status</p>
            <p className="text-xl font-black">{order.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package size={18} /> Order Items
              </h3>
              <div className="space-y-4">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Qty: {item.quantity} {item.size && `• Size: ${item.size}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Delivery Address</h3>
              <div className="text-sm text-gray-600 leading-relaxed">
                <p className="font-bold text-black mb-1">
                  {order.shippingAddress.firstname} {order.shippingAddress.lastname}
                </p>
                <p>{order.shippingAddress.addressLine}</p>
                {order.shippingAddress.apartment && (
                  <p>{order.shippingAddress.apartment}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {order.shippingAddress.phoneNumber}
                </p>
              </div>
            </div>

            {/* Payment card */}
            <div className={`p-6 rounded-2xl shadow-lg text-white ${isPayHere ? 'bg-blue-900' : 'bg-black'}`}>
              <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-4">
                <span className="text-sm flex items-center gap-2 font-bold">
                  {isPayHere ? <CreditCard size={16} /> : <Banknote size={16} />}
                  Payment Summary
                </span>
                <span className="text-xs px-2 py-1 rounded bg-white/20">
                  {isPayHere ? 'PAID' : 'COD'}
                </span>
              </div>

              <div className="space-y-2 text-xs mb-4 text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">LKR {subtotal.toLocaleString()}</span>
                </div>
                
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>- LKR {order.discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">LKR {shippingFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/20">
                <span className="text-sm font-bold uppercase tracking-wider">Grand Total</span>
                <span className="text-xl font-black">LKR {order.totalAmount.toLocaleString()}</span>
              </div>

              {isPayHere ? (
                <p className="text-[10px] text-blue-200 mt-4 font-bold uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle size={12} /> Payment Completed
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 mt-4">
                  Please have the <span className="text-white font-bold">exact amount</span> ready for the courier.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  usePageTitle('Track Order', 'Check your order status');
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}