import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosInstance from '@/app/utils/axiosInstance';

//interface variables
export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

interface WishlistState {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  syncWithUser: () => Promise<void>;
  fetchWishlist: () => Promise<void>; // Added to pull fresh DB data
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      isInWishlist: (id) => !!get().items.find((i) => i.productId === id),

      toggleItem: async (item) => {
        // 1. Optimistic UI update (Instant feedback for the user)
        const exists = get().items.find((i) => i.productId === item.productId);
        
        set((state) => ({
          items: exists
            ? state.items.filter((i) => i.productId !== item.productId)
            : [...state.items, item],
        }));

        // 2. Sync with backend 
        try {
          await axiosInstance.post('/api/wishlist/toggle', item);
        } catch (error) {
          // If the user is a guest, your 'isAuthenticated' middleware returns a 401.
          // That is totally fine! It just means we silently fail and rely on local state.
          console.debug("Toggle API skipped or failed (Guest mode fallback)");
        }
      },

      clearWishlist: () => set({ items: [] }),

      // Call this ONLY right after the user successfully sign in
      syncWithUser: async () => {
        const localItems = get().items; 
        
        if (localItems.length > 0) {
            try {
                await axiosInstance.post('/api/wishlist/merge', { localItems });
            } catch (error) {
                console.error("Failed to merge wishlist:", error);
            }
        }
        
        // Fetch the newly merged list..
        await get().fetchWishlist();
      },

      // Call this whenever the app loads AND the user is already authenticated
      fetchWishlist: async () => {
        try {
            const { data } = await axiosInstance.get('/api/wishlist');
            set({ items: data }); // Overwrites stale local storage with fresh DB data
        } catch (error) {
            console.error("Failed to fetch wishlist from DB:", error);
        }
      },
    }),
    {
      name: 'eshop-wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);