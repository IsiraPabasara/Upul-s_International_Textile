"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useQueryClient } from "@tanstack/react-query";
import useAdmin from "@/app/hooks/useAdmin";
import axiosInstance from "@/app/utils/axiosInstance";
import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isError } = useAdmin();
  const queryClient = useQueryClient();
  const router = useRouter();

  // ⭐ NEW: State to control Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Reset zoom to 100% on dashboard load
  // useEffect(() => {
  //   document.body.style.zoom = "100%";
  // }, []);

  useEffect(() => {
    if (isError) {
      const logout = async () => {
        try {
          await axiosInstance.get('/api/auth/logout-user');
        } catch (error) {
          console.error('Logout error:', error);
        }
        queryClient.clear();
        router.push('/login');
      };
      logout();
    }
  }, [isError, queryClient, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-300 relative">
      
      {/* 1. SIDEBAR (Now accepts props) */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* 2. OVERLAY (Only visible on mobile when menu is open) */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
        
        {/* Header (Passes the toggle function) */}
        <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}