import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosInstance from '@/app/utils/axiosInstance';

export interface CartItem {
  sku: string;
  productId: string;
  name: string;
  price: number;           // The current selling price (discounted)
  originalPrice: number;   // The base price (before discount)
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  maxStock?: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  validationErrors: Record<string, string>;

  couponCode: string | null;
  discountAmount: number;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  toggleCart: () => void;
  addItem: (item: CartItem, openCart?: boolean) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, qty: number) => void;
  clearCart: () => void;
  syncWithUser: () => Promise<void>;
  setValidationErrors: (errors: Record<string, string>) => void;
  clearValidationErrors: () => void;
  updatePrices: (priceUpdates: Record<string, number>) => void;

  // Getters
  getSubtotal: () => number;
  getTotalSavings: () => number;

  getFinalTotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      validationErrors: {},

      couponCode: null,
      discountAmount: 0,

      applyCoupon: (code, discount) =>
        set({ couponCode: code, discountAmount: discount }),

      removeCoupon: () =>
        set({ couponCode: null, discountAmount: 0 }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (newItem, openCart = true) => {
        set((state) => {
          const existing = state.items.find((i) => i.sku === newItem.sku);
          const nextIsOpen = openCart ? true : state.isOpen;

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.sku === newItem.sku
                  ? {
                      ...i,
                      quantity: i.quantity + newItem.quantity,
                      price: newItem.price,
                      originalPrice: newItem.originalPrice,
                    }
                  : i
              ),
              isOpen: nextIsOpen,
            };
          }
          return { items: [...state.items, newItem], isOpen: nextIsOpen };
        });
        get().clearValidationErrors();
      },

      updatePrices: (priceUpdates) => {
        set((state) => ({
          items: state.items.map((item) =>
            priceUpdates[item.sku] !== undefined
              ? { ...item, price: priceUpdates[item.sku] }
              : item
          ),
        }));
      },

      removeItem: (sku) => {
        set((state) => ({ items: state.items.filter((i) => i.sku !== sku) }));
        get().clearValidationErrors();
      },

      updateQuantity: (sku, qty) => {
        set((state) => ({
          items: state.items.map((i) => (i.sku === sku ? { ...i, quantity: qty } : i)),
        }));
        get().clearValidationErrors();
      },

      clearCart: () =>
        set({ items: [], validationErrors: {}, couponCode: null, discountAmount: 0 }),

      syncWithUser: async () => {
        const localItems = get().items;
        try {
          const res = await axiosInstance.post('/api/cart/merge', { localItems });
          set({ items: res.data });
          get().clearValidationErrors();
        } catch (error) {
          console.error('Failed to sync cart', error);
        }
      },

      setValidationErrors: (errors) => set({ validationErrors: errors }),
      clearValidationErrors: () => set({ validationErrors: {} }),

      // --- Helper Getters ---
      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },

      getTotalSavings: () => {
        return get().items.reduce((acc, item) => {
          const savingsPerUnit = (item.originalPrice || item.price) - item.price;
          return acc + savingsPerUnit * item.quantity;
        }, 0);
      },

      getFinalTotal: () => {
        const subtotal = get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        return Math.max(0, subtotal - get().discountAmount);
      },
    }),
    {
      name: 'eshop-cart-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discountAmount: state.discountAmount,
      }),
    }
  )
);
