'use client';
import { usePageTitle } from '@/app/hooks/usePageTitle';
import Link from 'next/link';
import { CheckCircle, Phone, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useCart } from '@/app/hooks/useCart';
import axiosInstance from '@/app/utils/axiosInstance';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const { clearCart } = useCart();
  
  // States to handle verification
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const verifyOrder = async () => {
      if (!orderNumber) {
        setIsVerifying(false);
        return;
      }

      try {
        // 1. Call your backend to confirm the order exists and is valid
        const res = await axiosInstance.get(`/api/orders/verify/${orderNumber}`);
        
        if (res.data.success) {
          setIsValid(true);
          clearCart(); // 2. ONLY clear cart if backend confirms success
        }
      } catch (error) {
        console.error("Order verification failed", error);
        setIsValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyOrder();
  }, [orderNumber, clearCart]);

  // 3. Loading State
  if (isVerifying) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Verifying Order...</p>
      </div>
    );
  }

  // 4. Error/Invalid State
  if (!isValid) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="text-amber-500 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-black mb-2">Order Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">We couldn't verify this order reference. If you just paid, please wait a moment and refresh.</p>
          <Link href="/shop" className="block w-full bg-black text-white py-3 rounded-lg font-bold text-xs uppercase">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  // 5. Success State (Your original UI)
  return (
    <div className="min-h-[70vh] bg-white flex items-center justify-center px-3 py-6 sm:px-6 sm:py-8">
      <div className="bg-white w-full max-w-md sm:max-w-sm text-center p-5 sm:p-6">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <CheckCircle className="text-green-600 w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <h1 className="text-2xl sm:text-2xl font-black text-gray-900 mb-1 sm:mb-2">
          Order Placed!
        </h1>
        <p className="text-sm sm:text-sm text-gray-500 mb-4 sm:mb-5">
          Thank you for shopping with us.
        </p>

        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 border border-gray-200">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Order Reference
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            #{orderNumber}
          </p>
        </div>

        <div className="text-left space-y-2 sm:space-y-3 mb-5 sm:mb-6">
          <div className="flex gap-2 sm:gap-3 items-start">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="font-bold text-xs">1</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xs sm:text-sm">Wait for Confirmation</p>
              <p className="text-xs text-gray-500 leading-tight">Our team will call you shortly to confirm your details.</p>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 items-start">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xs sm:text-sm">Keep your phone nearby</p>
              <p className="text-xs text-gray-500 leading-tight">We verify all orders over the phone before shipping.</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Link href="/shop" className="block w-full bg-black text-white py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm hover:bg-gray-800 transition">
            Continue Shopping
          </Link>
          <Link href="/profile/orders" className="flex items-center justify-center gap-2 w-full bg-white text-gray-600 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-gray-200 hover:bg-gray-50 transition">
            View My Orders <ArrowRight size={14} className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  usePageTitle('Order Successful', 'Thank you for your purchase');
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><p>Loading...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}