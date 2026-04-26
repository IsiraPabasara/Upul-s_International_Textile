'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/app/utils/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const LogoutPage = () => {

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
                // 2. Clear cache to ensure header updates
                queryClient.invalidateQueries({ queryKey: ["admin"] });
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