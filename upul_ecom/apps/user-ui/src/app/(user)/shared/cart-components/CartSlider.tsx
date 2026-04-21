'use client';

import { useCart } from '@/app/hooks/useCart';
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
  Tag
} from 'lucide-react';
import { useEffect, useState } from 'react';
import useUser from '@/app/hooks/useUser';
import axiosInstance from '@/app/utils/axiosInstance';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CartSlider() {
  const {
    items,
    isOpen,
    toggleCart,
    updateQuantity,
    removeItem, // This only updates Zustand (Local)
    validationErrors,
    setValidationErrors,
    updatePrices,
    getSubtotal,
    getTotalSavings,
  } = useCart();

  const [mounted, setMounted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const header = document.querySelector('header');
    let timeout: NodeJS.Timeout;

    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      if (header) header.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      timeout = setTimeout(() => {
        document.body.style.overflow = 'unset';
        document.body.style.paddingRight = '0px';
        if (header) header.style.paddingRight = '0px';
      }, 300);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOpen]);

  if (!mounted) return null;

  const subtotal = getSubtotal();
  const totalSavings = getTotalSavings();

  // --- 1. FIXED: Handle Remove Item (Local + DB) ---
  const handleRemoveItem = async (sku: string) => {
    // 1. Update Local State Immediately (Optimistic UI)
    removeItem(sku);
    setValidationErrors({});

    // 2. Update Database if User is Logged In
    if (user) {
      try {
        // Assuming your route is DELETE /api/cart/:sku based on your controller
        await axiosInstance.delete(`/api/cart/${sku}`); 
      } catch (error) {
        console.error('Failed to remove item from DB', error);
        // Optional: toast.error("Could not sync deletion");
      }
    }
  };

  const handleUpdateQuantity = async (sku: string, newQty: number, maxStock: number) => {
    if (newQty < 1) return;
    const limit = maxStock || 99;
    if (newQty > limit) {
      toast.error(`Sorry, only ${limit} available.`);
      return;
    }
    updateQuantity(sku, newQty);
    setValidationErrors({});
    if (user) {
      try {
        await axiosInstance.put('/api/cart', { sku, quantity: newQty });
      } catch (error) {
        console.error('Failed to update quantity', error);
      }
    }
  };

  const handleCheckoutClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsVerifying(true);
    setValidationErrors({});
    try {
      const { data } = await axiosInstance.post('/api/cart/verify', { items });
      if (data.isValid) {
        toggleCart();
        router.push('/checkout');
      } else {
        const errors = data.errors || {};
        
        // Show individual error toasts for each item
        Object.entries(errors).forEach(([sku, message]) => {
          const item = items.find(i => i.sku === sku);
          if (item) {
            toast.error(`${item.name}: ${message}`, { duration: 4000 });
          }
        });

        // Update prices if they changed
        if (data.updatedPrices && Object.keys(data.updatedPrices).length > 0) {
          updatePrices(data.updatedPrices);
        }
        
        setValidationErrors(errors);
      }
    } catch (error) {
      toast.error('Unable to verify cart. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`} 
        onClick={toggleCart} 
      />

      <aside
        className={`absolute top-0 right-0 w-full md:w-[450px] h-full bg-white shadow-2xl transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full font-outfit">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-bold">Shopping Cart ({items.length})</h2>
            <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingBag size={48} className="mb-4 text-gray-300" />
                <p>Your cart is empty</p>
                <button onClick={() => { toggleCart(); router.push('/shop'); }} className="mt-4 text-black underline hover:text-gray-600">
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const stockLimit = item.maxStock ?? 99;
                const isMaxReached = item.quantity >= stockLimit;
                const errorMsg = validationErrors?.[item.sku];
                const hasDiscount = item.originalPrice != null && item.originalPrice > item.price;

                return (
                  <div
                    key={item.sku}
                    className={`flex gap-4 border rounded-lg p-4 pb-6 transition-colors ${
                      errorMsg 
                        ? 'border-red-300 bg-red-50/50' 
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                        {/* 2. FIXED: Use the new handleRemoveItem function */}
                        <button onClick={() => handleRemoveItem(item.sku)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {item.size && (
                        <p className="text-xs text-gray-500 mt-0.5">Size: {item.size}</p>
                      )}

                      {errorMsg && (
                        <p className="text-xs text-red-600 font-medium mt-1 bg-red-100 px-2 py-1 rounded">
                          {errorMsg}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-gray-900">LKR {item.price.toLocaleString()}</span>
                        {hasDiscount && <span className="text-[10px] text-gray-400 line-through">LKR {item.originalPrice.toLocaleString()}</span>}
                      </div>

                      <div className="flex items-end justify-between mt-2">
                        <div className="flex items-center border border-gray-200 rounded-md h-8">
                          <button onClick={() => handleUpdateQuantity(item.sku, item.quantity - 1, stockLimit)} disabled={item.quantity <= 1} className="px-2 h-full hover:bg-gray-50 disabled:opacity-30">
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-medium w-8 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.sku, item.quantity + 1, stockLimit)} disabled={isMaxReached} className="px-2 h-full hover:bg-gray-50 disabled:opacity-30">
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-sm">LKR {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
  <div className="border-t p-6 bg-gray-50/80 space-y-4">
    <div className="space-y-2">
      {/* Subtotal Line */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Subtotal</span>
        <span>LKR {(subtotal + totalSavings).toLocaleString()}</span>
      </div>

      {/* Savings Line - "The Sub-line" */}
      {totalSavings > 0 && (
        <div className="flex justify-between items-center text-sm font-medium text-green-600">
          <div className="flex items-center gap-1.5">
            <Tag size={14} />
            <span>Discounts</span>
          </div>
          <span>- LKR {totalSavings.toLocaleString()}</span>
        </div>
      )}

      {/* Divider */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Total</span>
          <span className="text-xl font-bold text-black">
            LKR {subtotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>

    {/* Checkout Button */}
    <button
      onClick={handleCheckoutClick}
      disabled={isVerifying}
      className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-zinc-800 flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-70"
    >
      {isVerifying ? (
        <><Loader2 className="animate-spin mr-2" size={18} /> VERIFYING...</>
      ) : (
        'CHECKOUT'
      )}
    </button>
  </div>
)}
        </div>
      </aside>
    </div>
  );
}