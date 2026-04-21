'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/app/utils/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useCart } from '@/app/hooks/useCart';
import { useWishlist } from '@/app/hooks/useWishlist';

const LogoutPage = () => {
    usePageTitle('Logging Out', 'Please wait...');
    const router = useRouter();
    const queryClient = useQueryClient();
    
    // Ref to prevent double-execution in React 18 Strict Mode
    const hasLoggedOut = useRef(false);

    useEffect(() => {
        const performLogout = async () => {
            if (hasLoggedOut.current) return;
            hasLoggedOut.current = true;

            try {
                // 1. Attempt Server Logout
                await axiosInstance.get('/api/auth/logout-user');
                toast.success("Logged out successfully");
            } catch (error) {
                // Even if server fails (e.g. token expired), we proceed to clear client data
                console.error("Server logout error (ignoring to force client clear):", error);
            } finally {
                // 2. THE NUCLEAR OPTION: Clear Everything 
                
                // Clear React Query Cache (User Profile, Orders, etc)
                queryClient.clear();

                // Clear Zustand Cart State (in-memory + localStorage)
                useCart.getState().clearCart(); 
                
                // Force remove from localStorage as backup
                localStorage.removeItem('eshop-cart-storage');

                useWishlist.getState().clearWishlist(); // <-- 2. Clear in-memory state
                localStorage.removeItem('eshop-wishlist-storage');
                

                // 3. Redirect
                router.replace('/login');
            }
        };

        performLogout();
    }, [router, queryClient]);

    return (
        <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-4">
             {/* Simple Loading Spinner */}
             <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
             <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400">
                Logging you out...
            </p>
        </div>
    );
};

export default LogoutPage;