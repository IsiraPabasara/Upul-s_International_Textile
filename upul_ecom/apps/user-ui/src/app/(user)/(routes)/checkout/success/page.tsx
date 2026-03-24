'use client';

import Link from 'next/link';
import { CheckCircle, Phone, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Suspense } from 'react';
import { useCart } from '@/app/hooks/useCart';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] bg-white flex items-center justify-center px-3 py-6 sm:px-6 sm:py-8">
      <div className="bg-white w-full max-w-md sm:max-w-sm text-center p-5 sm:p-6">
        {/* Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <CheckCircle className="text-green-600 w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-2xl font-black text-gray-900 mb-1 sm:mb-2">
          Order Placed!
        </h1>
        <p className="text-sm sm:text-sm text-gray-500 mb-4 sm:mb-5">
          Thank you for shopping with us.
        </p>

        {/* Order ref */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 border border-gray-200">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Order Reference
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            #{orderNumber || '----'}
          </p>
        </div>

        {/* Steps */}
        <div className="text-left space-y-2 sm:space-y-3 mb-5 sm:mb-6">
          <div className="flex gap-2 sm:gap-3 items-start">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="font-bold text-xs">1</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xs sm:text-sm">
                Wait for Confirmation
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                Our team will call you shortly to confirm your address and order details.
              </p>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 items-start">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xs sm:text-sm">
                Keep your phone nearby
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                We cannot ship your order until we verify it over the phone.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 sm:space-y-2">
          <Link
            href="/shop"
            className="block w-full bg-black text-white py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm hover:bg-gray-800 transition"
          >
            Continue Shopping
          </Link>

          <Link
            href="/profile/orders"
            className="flex items-center justify-center gap-2 w-full bg-white text-gray-600 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            View My Orders <ArrowRight size={14} className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><p>Loading...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
