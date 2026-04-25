"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { usePageTitle } from "@/app/hooks/usePageTitle";
import { LogOut, User, MapPin, Package, ArrowRight, Mail, MailOpen, Eye, EyeOff } from "lucide-react";
import useUser from "@/app/hooks/useUser";
import axiosInstance from "@/app/utils/axiosInstance";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useCart } from "@/app/hooks/useCart";
import toast from "react-hot-toast";
import { useWishlist } from "@/app/hooks/useWishlist";

const ProfilePage = () => {
  usePageTitle('My Profile', 'Manage your profile and orders');
  const { user, isLoading } = useUser({required: true});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isTogglingNewsletter, setIsTogglingNewsletter] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch newsletter status
  const { data: newsletterData, refetch: refetchNewsletter } = useQuery({
    queryKey: ['newsletterStatus'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/admin/email/newsletter/me');
      return res.data;
    },
    enabled: !!user && !isLoading,
  });

  // Disable background scrolling when modals are open
  useEffect(() => {
    document.documentElement.style.overflow = (showLogoutConfirm || showDeleteConfirm) ? 'hidden' : '';
    
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [showLogoutConfirm, showDeleteConfirm]);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axiosInstance.get('/api/auth/logout-user');
      queryClient.clear();
      useCart.getState().clearCart();
      useWishlist.getState().clearWishlist();
      useWishlist.persist.clearStorage();
      localStorage.removeItem('eshop-cart-storage');
      localStorage.removeItem('eshop-wishlist-storage');
      toast.success("Logged out successfully");
      router.push('/login');
    } catch (error) {
      toast.error("Logout failed");
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleToggleNewsletter = async () => {
    setIsTogglingNewsletter(true);
    try {
      const res = await axiosInstance.post('/api/admin/email/newsletter/toggle');
      toast.success(res.data.message);
      refetchNewsletter();
    } catch (error: any) {
      toast.error("Failed to update preferences.");
    } finally {
      setIsTogglingNewsletter(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm deletion.");
      return;
    }

    setDeleteError("");
    setIsDeleting(true);
    try {
      await axiosInstance.delete('/api/auth/delete-account', { 
        data: { password: deletePassword.trim() } 
      });
      
      queryClient.clear();
      useCart.getState().clearCart();
      useWishlist.getState().clearWishlist();
      
      toast.success("Account deleted successfully.");
      router.push('/login');
    } catch (error: any) {
      setIsDeleting(false);
      const errorCode = error.response?.data?.details?.code;
      const errorMessage = error.response?.data?.message;

      console.log("Delete error response:", error.response?.data);

      let displayError = "";
      if (errorCode === 'INVALID_PASSWORD') {
        displayError = "Incorrect password. Please try again.";
        toast.error(displayError);
      } else if (errorCode === 'ACTIVE_ORDERS') {
        displayError = "You have active orders. Please wait until they are delivered or cancelled before deleting your account.";
        toast.error(displayError);
      } else if (errorCode === 'MISSING_PASSWORD') {
        displayError = "Password is required to delete your account.";
        toast.error(displayError);
      } else if (errorCode === 'NO_PASSWORD_SET') {
        displayError = "Your account password is not set in the system. Please reset your password first.";
        toast.error(displayError);
      } else if (errorCode === 'DELETION_CONSTRAINT_ERROR') {
        displayError = "Unable to delete account due to data constraints. Please contact our support team for assistance.";
        toast.error(displayError);
      } else {
        displayError = errorMessage || "Failed to delete account. Please try again.";
        toast.error(displayError);
      }
      setDeleteError(displayError);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xs uppercase tracking-[0.3em] font-bold">Loading Profile...</div>;

  const defaultAddress = user?.addresses?.find((addr: any) => addr.isDefault) || user?.addresses?.[0];

  return (
    <div className="w-full min-h-screen bg-white font-outfit pb-32">
      
      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Blackish background */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isLoggingOut && setShowLogoutConfirm(false)} />
          
          {/* White Modal */}
          <div className="relative bg-white text-black p-12 max-w-md w-full shadow-2xl text-center border border-gray-100">
            <h3 className="text-sm tracking-[0.2em] uppercase font-bold mb-4">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-10 leading-relaxed">Are you sure you want to end your session?</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleLogout} disabled={isLoggingOut}
                className="w-full py-4 text-xs tracking-[0.3em] uppercase font-bold bg-black text-white hover:bg-gray-800 transition-colors">
                {isLoggingOut ? "Processing..." : "Logout"}
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} disabled={isLoggingOut}
                className="w-full py-4 text-xs tracking-[0.3em] uppercase font-bold text-gray-500 hover:text-black transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Blackish background */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
          
          {/* White Modal */}
          <div className="relative bg-white text-black p-12 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-sm tracking-[0.2em] uppercase font-bold mb-2">Delete Account</h3>
            <p className="text-xs text-red-600 mb-6 leading-relaxed">This action cannot be undone. Your account and personal data will be permanently removed.</p>
            
            {deleteError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {deleteError}
              </div>
            )}
            
            <div className="space-y-4 w-full mb-8">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-black">
                Confirm with Password
              </label>
              <div className="relative w-full">
                <input 
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
                  placeholder="Enter your password"
                  disabled={isDeleting}
                  className="w-full py-3 pr-10 border-b border-gray-300 outline-none focus:border-red-600 transition-colors text-base bg-transparent text-black placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  disabled={isDeleting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors disabled:opacity-50"
                  aria-label={showDeletePassword ? "Hide password" : "Show password"}
                >
                  {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button onClick={handleDeleteAccount} disabled={isDeleting}
                className="w-full py-4 text-xs tracking-[0.3em] uppercase font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                {isDeleting ? "Processing..." : "Delete Account"}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); setShowDeletePassword(false); }} disabled={isDeleting}
                className="w-full py-4 text-xs tracking-[0.3em] uppercase font-bold text-gray-500 hover:text-black transition-colors">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
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
                    Edit Addresses
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

          {/* Column 4: Preferences / Newsletter */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <Mail size={20} className="text-black" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Preferences</h2>
            </div>
            <div className="p-10 border border-gray-200 hover:border-black transition-all duration-500 min-h-[240px] flex flex-col justify-between group bg-gray-50/50 hover:bg-white">
              <div className="flex flex-col justify-center h-full">
                <p className="text-md md:text-xl font-bold text-black mb-2">Newsletter</p>
                <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed">
                  {newsletterData?.isSubscribed 
                    ? "You are currently receiving exclusive offers and updates." 
                    : "Subscribe to get early access to new arrivals and sales."}
                </p>
              </div>
              <button 
                onClick={handleToggleNewsletter}
                disabled={isTogglingNewsletter}
                className={`mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold border-b-2 w-fit transition-all ${
                  newsletterData?.isSubscribed 
                    ? "text-red-600 border-red-200 hover:border-red-600" 
                    : "text-black border-gray-200 hover:border-black"
                } disabled:opacity-50`}
              >
                {isTogglingNewsletter ? "Updating..." : (
                  <>
                    {newsletterData?.isSubscribed ? <MailOpen size={14} /> : <Mail size={14} />}
                    {newsletterData?.isSubscribed ? "Unsubscribe" : "Subscribe Now"}
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Logout */}
        <button onClick={() => setShowLogoutConfirm(true)}
            className="md:hidden mt-20 w-full py-4 text-xs uppercase tracking-[0.2em] font-bold bg-black text-white hover:bg-gray-800 transition-colors">
            Sign Out
        </button>

        {/* Danger Zone */}
        <div className="mt-20 pt-12 border-t border-gray-300">
          <h3 className="text-sm tracking-[0.2em] uppercase font-bold text-black mb-6">Account Termination</h3>
          <div className="p-8 border-2 border-gray-200 bg-gray-50/30">
            <p className="text-sm text-gray-700 mb-6">Permanently delete your account and all associated personal data. This action cannot be undone.</p>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-4 text-xs uppercase tracking-[0.2em] font-bold bg-black text-white hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
 
export default ProfilePage;