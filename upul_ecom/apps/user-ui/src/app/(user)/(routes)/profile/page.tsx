"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { LogOut, User, MapPin, Package, ArrowRight } from "lucide-react";
import useUser from "@/app/hooks/useUser";
import axiosInstance from "@/app/utils/axiosInstance";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user, isLoading } = useUser({required: true});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axiosInstance.get('/api/auth/logout-user');
      queryClient.clear();
      toast.success("Logged out successfully");
      router.push('/login');
    } catch (error) {
      toast.error("Logout failed");
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xs uppercase tracking-[0.3em] font-bold">Loading Profile...</div>;

  const defaultAddress = user?.addresses?.find((addr: any) => addr.isDefault) || user?.addresses?.[0];

  return (
    <div className="w-full min-h-screen bg-white font-outfit pb-32">
      
      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md" onClick={() => !isLoggingOut && setShowLogoutConfirm(false)} />
          <div className="relative bg-black text-white p-12 max-w-md w-full shadow-2xl text-center">
            <h3 className="text-sm tracking-[0.2em] uppercase font-bold mb-4">Confirm Logout</h3>
            <p className="text-sm text-gray-400 mb-10 leading-relaxed">Are you sure you want to end your session?</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleLogout} disabled={isLoggingOut}
                className="w-full py-4 text-xs tracking-[0.3em] uppercase font-bold bg-white text-black hover:bg-gray-200 transition-colors">
                {isLoggingOut ? "Processing..." : "Logout"}
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} disabled={isLoggingOut}
                className="w-full py-4 text-xs tracking-[0.3em] uppercase font-bold text-gray-500 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-black pb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-3">My Account</h1>
            <p className="text-xs md:text-sm text-gray-500 uppercase tracking-[0.15em]">Welcome back, <span className="text-black font-bold">{user?.firstname}</span></p>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)}
            className="hidden md:flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-red-600 hover:text-red-800 transition-colors mt-6 md:mt-0">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Column 1: Profile */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
                <User size={20} className="text-black" />
                <h2 className="text-sm md:text-sm font-bold uppercase tracking-[0.2em]">Personal Info</h2>
            </div>
            <div className="p-10 border border-gray-200 hover:border-black transition-all duration-500 min-h-[240px] flex flex-col justify-between group bg-gray-50/50 hover:bg-white">
                <div className="space-y-2 overflow-hidden">
                    <p className="text-md md:text-xl font-bold text-black truncate">{user?.firstname} {user?.lastname}</p>
                    <p className="text-sm md:text-base text-gray-600 truncate">{user?.email}</p>
                    <p className="text-sm md:text-base text-gray-600">{user?.phonenumber}</p>
                </div>
                <Link href="/profile/user" className="mt-8 text-xs uppercase tracking-[0.2em] font-bold border-b-2 border-transparent group-hover:border-black w-fit transition-all text-gray-400 group-hover:text-black">
                    Edit Details
                </Link>
            </div>
          </div>

          {/* Column 2: Address (Fixed Overflow) */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
                <MapPin size={20} className="text-black" />
                <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Primary Address</h2>
            </div>
            <div className="p-10 border border-gray-200 hover:border-black transition-all duration-500 min-h-[240px] flex flex-col justify-between group bg-gray-50/50 hover:bg-white w-full">
                {defaultAddress ? (
                    <div className="space-y-2 w-full overflow-hidden">
                        <p className="text-md md:text-xl font-bold text-black break-words">{defaultAddress.firstname} {defaultAddress.lastname}</p>
                        <p className="text-sm md:text-base text-gray-600 leading-relaxed break-words">
                            {defaultAddress.addressLine}
                        </p>
                        <p className="text-sm md:text-base text-gray-600 leading-relaxed break-words">
                            {defaultAddress.city}, {defaultAddress.postalCode}
                        </p>
                        <p className="text-sm text-gray-400 mt-2 font-mono">{defaultAddress.phoneNumber}</p>
                    </div>
                ) : (
                    <p className="text-base text-gray-400 italic">No default address set.</p>
                )}
                <Link href="/profile/address" className="mt-8 text-xs uppercase tracking-[0.2em] font-bold border-b-2 border-transparent group-hover:border-black w-fit transition-all text-gray-400 group-hover:text-black">
                    Manage Addresses
                </Link>
            </div>
          </div>

          {/* Column 3: Orders */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
                <Package size={20} className="text-black" />
                <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Recent Activity</h2>
            </div>
            <div className="p-10 border border-gray-200 hover:border-black transition-all duration-500 min-h-[240px] flex flex-col justify-between group bg-gray-50/50 hover:bg-white">
                <div className="flex flex-col justify-center h-full">
                    <p className="text-sm md:text-base text-gray-600 mb-4">View and track your current and past orders.</p>
                    <Link href="/shop" className="text-sm font-bold underline decoration-gray-300 hover:decoration-black w-fit">Continue Shopping</Link>
                </div>
                <Link href="/profile/orders" className="mt-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold border-b-2 border-transparent group-hover:border-black w-fit transition-all text-gray-400 group-hover:text-black">
                    Order History <ArrowRight size={14} />
                </Link>
            </div>
          </div>

        </div>

        {/* Mobile Logout */}
        <button onClick={() => setShowLogoutConfirm(true)}
            className="md:hidden mt-20 w-full py-5 border-red-100 text-white text-xs uppercase tracking-[0.2em] font-bold bg-black">
            Sign Out
        </button>

      </div>
    </div>
  );
};
 
export default ProfilePage;