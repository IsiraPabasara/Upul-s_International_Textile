"use client";

import { X, Loader2, AlertCircle, ShieldAlert, User as UserIcon, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // ⭐ 1. Import createPortal

interface RoleChangeModalProps {
  user: any;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (role: string) => void;
}

const AVAILABLE_ROLES = [
  { value: "user", label: "User", description: "Regular customer", icon: UserIcon },
  { value: "admin", label: "Admin", description: "Full administrative access", icon: ShieldCheck },
];

export default function RoleChangeModal({
  user,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: RoleChangeModalProps) {
  const [selectedRole, setSelectedRole] = useState("user");
  const [mounted, setMounted] = useState(false); // ⭐ 2. Track mounting

  // ⭐ 3. Handle mounting and scroll locking
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role);
    }
  }, [user?.role, isOpen]);

  // ⭐ 4. Wait until mounted (client-side) to avoid Next.js hydration errors
  if (!isOpen || !mounted) return null;

  const handleConfirm = () => {
    if (selectedRole !== user?.role) {
      onConfirm(selectedRole);
    }
  };

  const isChanging = selectedRole !== user?.role;

  // ⭐ 5. Wrap the return in createPortal
  return createPortal(
    <>
      {/* Sleek Overlay with Blur - Boosted z-index */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[999] transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
        <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl max-w-md w-full flex flex-col overflow-hidden border border-white/20 dark:border-slate-700/50 pointer-events-auto">
          
          {/* Header */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 px-6 py-5 flex items-center justify-between shrink-0 z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Change User Role
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
            >
              <X size={20} className="text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 bg-[#F8F9FC]/50 dark:bg-slate-950/50 space-y-6">
            
            {/* User Info & Current Role Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Target User
                </p>
                <p className="font-bold text-gray-900 dark:text-white text-base">
                  {user?.firstname} {user?.lastname}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">
                  {user?.email}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  Current Role
                </p>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    user?.role === "admin"
                      ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800/50 dark:text-purple-400"
                      : user?.role === "moderator"
                        ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-400"
                        : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400"
                  }`}
                >
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <p className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                Select New Role
              </p>
              <div className="space-y-3">
                {AVAILABLE_ROLES.map((role) => {
                  const isSelected = selectedRole === role.value;
                  const Icon = role.icon;
                  
                  // Dynamic styles based on selection and role type
                  let cardStyle = "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700";
                  let iconBg = "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500";
                  
                  if (isSelected) {
                    if (role.value === "admin") {
                      cardStyle = "bg-purple-50/50 dark:bg-purple-900/10 border-purple-400 dark:border-purple-500 shadow-sm ring-1 ring-purple-400 dark:ring-purple-500";
                      iconBg = "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
                    } else {
                      cardStyle = "bg-blue-50/50 dark:bg-blue-900/10 border-blue-400 dark:border-blue-500 shadow-sm ring-1 ring-blue-400 dark:ring-blue-500";
                      iconBg = "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
                    }
                  }

                  return (
                    <label
                      key={role.value}
                      className={`flex items-center gap-4 p-4 border rounded-[16px] cursor-pointer transition-all group ${cardStyle} hover:shadow-md`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${iconBg} group-hover:scale-105`}>
                        <Icon size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-base ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                          {role.label}
                        </p>
                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">
                          {role.description}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? role.value === 'admin' 
                              ? 'border-purple-500 dark:border-purple-400' 
                              : 'border-blue-500 dark:border-blue-400'
                            : 'border-gray-300 dark:border-slate-600'
                        }`}>
                          {isSelected && (
                            <div className={`w-2.5 h-2.5 rounded-full ${role.value === 'admin' ? 'bg-purple-500 dark:bg-purple-400' : 'bg-blue-500 dark:bg-blue-400'}`} />
                          )}
                        </div>
                        {/* Hidden native radio button */}
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={isSelected}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="sr-only"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Warning for Role Change */}
            {isChanging && (
              <div className={`rounded-[16px] p-4 flex gap-3 items-start border animate-in slide-in-from-top-2 duration-200 ${
                selectedRole === "admin" 
                  ? "bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/30" 
                  : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30"
              }`}>
                {selectedRole === "admin" ? (
                  <ShieldAlert size={20} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-bold ${selectedRole === 'admin' ? 'text-purple-900 dark:text-purple-200' : 'text-blue-900 dark:text-blue-200'}`}>
                    Privilege Update
                  </p>
                  <p className={`text-xs font-medium mt-1 ${selectedRole === 'admin' ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'}`}>
                    {selectedRole === "admin"
                      ? "This user will gain full administrative access to the dashboard and system settings."
                      : "This user will lose their current privileges and return to standard access."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isChanging || isLoading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 shadow-sm"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body // ⭐ 6. Attach directly to the <body> tag
  );
}