'use client';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import { toast } from 'react-hot-toast';
import {
  Package,
  CheckCircle,
  Truck,
  Clock,
  MapPin,
  ChevronLeft,
  XCircle,
  ArrowLeft,
  CreditCard,
  Banknote,
} from 'lucide-react';
import Link from 'next/link';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const queryClient = useQueryClient();

  // Custom Cancel Modal State
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Disable background scrolling when cancel modal is open
  useEffect(() => {
    document.documentElement.style.overflow = showCancelConfirm ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [showCancelConfirm]);

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

  // ✅ Cancel order mutation (guest tracking)
  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await axiosInstance.patch(`/api/orders/track/${token}/cancel`);
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      setShowCancelConfirm(false); // Close modal on success
      queryClient.invalidateQueries({ queryKey: ['guest-order', token] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-outfit">
        <p className="text-red-500 font-bold uppercase tracking-widest text-xs">
          Invalid Tracking URL
        </p>
        <Link href="/" className="mt-4 underline text-xs font-bold uppercase tracking-widest">
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
        <div className="min-h-screen w-full bg-white font-outfit flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center border border-gray-200 p-12 rounded-sm">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                isDelivered
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {isDelivered ? <CheckCircle size={40} /> : <XCircle size={40} />}
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">
              Order {isDelivered ? 'Delivered' : 'Cancelled'}
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed mb-8">
              This tracking link has expired because Order <b>#{errData.orderNumber}</b> has been completed.
            </p>
            <Link
              href="/shop"
              className="block w-full bg-black text-white py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-outfit">
        <p className="text-red-500 mb-4 uppercase tracking-widest font-bold">Order not found</p>
        <Link href="/" className="underline text-xs font-bold uppercase tracking-widest">
          Return Home
        </Link>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center text-xs uppercase tracking-[0.3em] font-bold font-outfit">
        Loading Details...
      </div>
    );

  // --- 2. ACTIVE TRACKING STATE ---
  const isCancelled = order.status === 'CANCELLED';
  const isReturned = order.status === 'RETURNED';
  const isPayHere = order.paymentMethod === 'PAYHERE';

  const subtotal = order ? order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) : 0;
  const shippingFee = order ? (order.shippingFee || 450) : 0;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'SHIPPED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-black text-white border-black';
    }
  };

  let steps = [
    { id: 'PENDING', label: 'Placed', icon: Clock },
    { id: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
    { id: 'PROCESSING', label: 'Processing', icon: Package },
    { id: 'SHIPPED', label: 'Shipped', icon: Truck },
    { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  ];

  if (isCancelled)
    steps = [
      { id: 'PENDING', label: 'Placed', icon: Clock },
      { id: 'CANCELLED', label: 'Cancelled', icon: XCircle },
    ];

  if (isReturned) steps = [...steps.slice(0, 4), { id: 'RETURNED', label: 'Returned', icon: ArrowLeft }];

  let currentStepIndex = steps.findIndex((s) => s.id === order.status);
  if (currentStepIndex === -1 && order.status === 'DELIVERED')
    currentStepIndex = steps.findIndex((s) => s.id === 'DELIVERED');

  const getThemeColor = () => {
    if (isCancelled) return 'bg-red-600';
    if (isReturned) return 'bg-orange-600';
    return 'bg-black';
  };

  const getThemeText = () => {
    if (isCancelled) return 'text-red-600';
    if (isReturned) return 'text-orange-600';
    return 'text-black';
  };

  return (
    <div className="w-full min-h-screen bg-white font-outfit pb-32">
      
      {/* Cancel Order Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 font-outfit">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !cancelMutation.isPending && setShowCancelConfirm(false)} />
          
          <div className="relative bg-white text-black p-12 max-w-md w-full shadow-2xl text-center border border-gray-100">
            <h3 className="text-sm tracking-[0.2em] uppercase font-bold mb-4">Cancel Order</h3>
            <p className="text-sm text-gray-600 mb-10 leading-relaxed">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => cancelMutation.mutate()} 
                disabled={cancelMutation.isPending}
                className="w-full py-4 text-xs tracking-[0.3em] uppercase font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancel"}
              </button>
              <button 
                onClick={() => setShowCancelConfirm(false)} 
                disabled={cancelMutation.isPending}
                className="w-full py-4 text-xs tracking-[0.3em] uppercase font-bold text-gray-500 hover:text-black transition-colors">
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 pt-20">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-gray-500 hover:text-black transition-colors mb-12"
        >
          <ChevronLeft size={16} /> Back to Shop
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-black pb-8 gap-6">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 block">
              Live Guest Tracking
            </span>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mt-2">
              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
            {order.trackingNumber && (
              <div className="text-left md:text-right w-full md:w-auto bg-gray-50 p-3 md:p-0 md:bg-transparent rounded md:rounded-none border md:border-0 border-gray-100 mb-2 md:mb-0">
                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.1em] mb-1">
                  Domex Tracking
                </p>
                <p className="font-mono font-bold text-lg md:border-b border-gray-100 pb-1">
                  {order.trackingNumber}
                </p>
              </div>
            )}

            <span
              className={`text-[10px] font-bold uppercase tracking-[0.1em] px-4 py-1.5 border rounded-sm ${getStatusStyle(
                order.status
              )}`}
            >
              {order.status}
            </span>

            {/* Cancel button triggers modal instead of native confirm */}
            {order.status === 'PENDING' && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelMutation.isPending}
                className="mt-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 px-4 py-2 rounded transition-colors uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* Desktop Progress Bar (Horizontal) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8 relative overflow-hidden hidden md:block">
          <div className="relative z-10 flex justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center relative z-10 w-24">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors duration-500
                      ${isCompleted ? `${getThemeColor()} text-white` : 'bg-gray-100 text-gray-400'}`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide transition-colors duration-500
                      ${isCompleted ? getThemeText() : 'text-gray-300'}`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute top-12 left-0 w-full h-1 bg-gray-100 z-0 px-20">
            <div
              className={`h-full transition-all duration-1000 ease-out ${getThemeColor()}`}
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Mobile Progress Bar (Vertical) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-8 block md:hidden">
          <div className="relative space-y-8">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100 z-0">
              <div
                className={`w-full transition-all duration-1000 ease-out ${getThemeColor()}`}
                style={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center gap-4 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500
                      ${isCompleted ? `${getThemeColor()} text-white` : 'bg-gray-100 text-gray-400'}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold uppercase tracking-widest
                        ${isCompleted ? getThemeText() : 'text-gray-300'}`}
                    >
                      {step.label}
                    </span>
                    {isCompleted && idx === currentStepIndex && (
                      <span className="text-[10px] text-gray-400 uppercase font-medium mt-0.5">
                        Current Status
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-8">
            <div className="border border-gray-200 p-8 rounded-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 mb-8 flex items-center gap-3">
                <Package size={16} /> Order Items
              </h3>
              <div className="space-y-6">
                {order.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-6 border-b border-gray-50 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="w-20 h-24 bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                      <img
                        src={item.image}
                        className="w-full h-full object-cover"
                        alt={item.name}
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="font-bold text-sm uppercase tracking-tight text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                        Qty: {item.quantity} {item.size && `| Size: ${item.size}`}
                      </p>
                      <p className="text-sm font-black mt-3">
                        LKR {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="border border-gray-200 p-8 bg-gray-50/30 rounded-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 mb-6 flex items-center gap-3">
                <MapPin size={16} /> Delivery
              </h3>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-600 leading-relaxed overflow-hidden">
                <p className="text-black mb-2 text-sm break-words">
                  {order.shippingAddress.firstname} {order.shippingAddress.lastname}
                </p>
                <p className="break-words">{order.shippingAddress.addressLine}</p>
                {order.shippingAddress.apartment && (
                  <p className="break-words">{order.shippingAddress.apartment}</p>
                )}
                <p className="break-words">
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                </p>
                <p className="mt-4 text-[10px] text-gray-400 break-all">
                  {order.shippingAddress.phoneNumber}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 p-8 rounded-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 mb-6 flex items-center gap-3">
                {isPayHere ? <CreditCard size={16} /> : <Banknote size={16} />}
                Payment Summary
              </h3>

              <div className="space-y-3 mb-6 border-b border-gray-100 pb-6 text-xs uppercase tracking-wider">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Method</span>
                  {isPayHere ? (
                    <span className="font-bold text-blue-600">Online (Paid)</span>
                  ) : (
                    <span className="font-bold text-gray-900">Cash on Delivery</span>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-bold text-gray-900">LKR {subtotal.toLocaleString()}</span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Discount</span>
                    <span className="font-bold">- LKR {order.discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Shipping</span>
                  <span className="font-bold text-gray-900">LKR {shippingFee.toLocaleString()}</span>
                </div>
              </div>

              {!isPayHere && (
                <div className="bg-yellow-50 text-yellow-800 text-[10px] font-bold uppercase tracking-wide p-3 rounded mb-6 border border-yellow-100">
                  Please have the exact amount ready.
                </div>
              )}

              <div className="flex justify-between items-end">
                <span className="font-bold text-sm uppercase tracking-widest">Total</span>
                <span className="font-black text-xl tracking-tight">
                  LKR {order.totalAmount.toLocaleString()}
                </span>
              </div>
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
        <div className="min-h-screen flex items-center justify-center font-outfit text-xs font-bold uppercase tracking-[0.3em]">
          Loading Tracker...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}