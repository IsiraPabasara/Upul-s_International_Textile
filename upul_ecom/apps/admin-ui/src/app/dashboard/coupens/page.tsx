'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import toast from 'react-hot-toast';
import { 
  Trash2, Loader2, Ticket, Calendar, User, 
  Globe, Lock, Plus, X, Percent, Banknote,
  Hash, ShoppingCart, Infinity
} from 'lucide-react';

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 🟢 Validation State
  const [codeError, setCodeError] = useState("");
  const [valueError, setValueError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderAmount: '0',
    limitPerUser: '1', // Default 1 for "One time use"
    maxUses: '',
    expiresAt: '',
    isPublic: true
  });

  // Helper to reset form
  const resetForm = () => {
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      value: '',
      minOrderAmount: '0',
      limitPerUser: '1',
      maxUses: '',
      expiresAt: '',
      isPublic: true
    });
    setCodeError("");
    setValueError("");
    setEditingId(null);
  };

  // Fetch Coupons
  const { data: coupons, isLoading, isError } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => (await axiosInstance.get('/api/coupons')).data
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => await axiosInstance.post('/api/coupons', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setIsCreating(false);
      resetForm();
      toast.success("Coupon created successfully!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create coupon")
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => 
      await axiosInstance.put(`/api/coupons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setIsCreating(false);
      resetForm();
      toast.success("Coupon updated successfully!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update coupon")
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axiosInstance.delete(`/api/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success("Coupon removed");
    }
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    let isValid = true;

    // 🟢 Front-end Validation
    if (!formData.code.trim()) {
      setCodeError("Please enter a coupon code");
      isValid = false;
    }

    const val = Number(formData.value);
    if (!formData.value) {
      setValueError("Please enter a discount value");
      isValid = false;
    } else if (val <= 0) {
      setValueError("Value must be greater than 0");
      isValid = false;
    } else if (formData.type === 'PERCENTAGE' && val > 100) {
      setValueError("Percentage cannot exceed 100%");
      isValid = false;
    }

    if (!isValid) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Logic to Trigger Edit Mode
  const handleEdit = (coupon: any) => {
    setEditingId(coupon.id);
    setIsCreating(true); // Open the form section
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      minOrderAmount: coupon.minOrderAmount?.toString() || '0',
      limitPerUser: coupon.limitPerUser?.toString() || '1',
      maxUses: coupon.maxUses?.toString() || '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      isPublic: coupon.isPublic
    });
  };

  // 🟢 Dynamic Input Style Generator for Consistency
  const getInputClass = (hasError: boolean, extraClasses: string = "pl-11") => 
    `w-full h-[52px] pr-4 bg-gray-50 dark:bg-slate-800/50 border rounded-xl outline-none transition-all text-base md:text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm ${extraClasses} ${
      hasError 
        ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
        : 'border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
    }`;

  return (
    <>
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Ticket className="text-blue-500 hidden sm:block" size={28} strokeWidth={2.5} />
            Coupon Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Create and distribute discount codes for your customers.
          </p>
        </div>
        <button 
          onClick={() => {
            if (isCreating) {
              setIsCreating(false);
              resetForm();
            } else {
              setIsCreating(true);
            }
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm ${
            isCreating 
              ? "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700" 
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
          }`}
        >
          {isCreating ? <X size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
          {isCreating ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {/* --- CREATE / EDIT FORM --- */}
      {isCreating && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-slate-800 mb-8 transition-colors animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {editingId ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Code */}
              <div className="lg:col-span-1">
                <label className={`label mb-2 ml-1 text-sm font-bold transition-colors ${codeError ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Ticket className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${codeError ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500"}`} size={18} strokeWidth={2.5} />
                  <input 
                    type="text" 
                    placeholder="e.g. SUMMER2026"
                    className={getInputClass(!!codeError, "uppercase font-mono tracking-widest font-bold pl-12")}
                    value={formData.code}
                    onChange={e => {
                      setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')});
                      if (codeError) setCodeError(""); // 🟢 Instant clear
                    }}
                  />
                </div>
                {codeError && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 animate-in fade-in">{codeError}</p>}
              </div>

              {/* Type */}
              <div className="lg:col-span-1">
                <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white">Discount Type</label>
                <div className="relative group">
                  {formData.type === 'PERCENTAGE' ? (
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" size={18} strokeWidth={2.5} />
                  ) : (
                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" size={18} strokeWidth={2.5} />
                  )}
                  <select 
                    className={getInputClass(false, "pl-12 appearance-none cursor-pointer")}
                    value={formData.type}
                    onChange={e => {
                      setFormData({...formData, type: e.target.value});
                      if (valueError) setValueError(""); // Clear value errors on type change to prevent stuck errors
                    }}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    {/* 🟢 Updated Currency */}
                    <option value="FIXED">Fixed Amount (Rs.)</option> 
                  </select>
                </div>
              </div>

              {/* Value */}
              <div className="lg:col-span-1">
                <label className={`label mb-2 ml-1 text-sm font-bold transition-colors ${valueError ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Hash className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${valueError ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500"}`} size={18} strokeWidth={2.5} />
                  <input 
                    type="number" min="0" step="any"
                    className={getInputClass(!!valueError)}
                    placeholder={formData.type === 'PERCENTAGE' ? "e.g. 20" : "e.g. 500"}
                    value={formData.value}
                    onChange={e => {
                      setFormData({...formData, value: e.target.value});
                      if (valueError) setValueError(""); // 🟢 Instant clear
                    }}
                  />
                </div>
                {valueError && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 animate-in fade-in">{valueError}</p>}
              </div>

              {/* Min Order */}
              <div>
                <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white">Min. Order Amount (Rs.)</label>
                <div className="relative group">
                  <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} strokeWidth={2.5} />
                  <input 
                    type="number" min="0"
                    className={getInputClass(false)}
                    placeholder="e.g. 1500"
                    value={formData.minOrderAmount}
                    onChange={e => setFormData({...formData, minOrderAmount: e.target.value})}
                  />
                </div>
              </div>

              {/* Uses Per User */}
              <div>
                <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white">Uses Per User</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} strokeWidth={2.5} />
                  <input 
                    type="number" min="1"
                    className={getInputClass(false)}
                    placeholder="Leave empty for unlimited"
                    value={formData.limitPerUser}
                    onChange={e => setFormData({...formData, limitPerUser: e.target.value})}
                  />
                </div>
              </div>

              {/* Total Global Uses */}
              <div>
                <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white">Total Global Uses</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} strokeWidth={2.5} />
                  <input 
                    type="number" min="1"
                    className={getInputClass(false)}
                    placeholder="e.g. First 100 users"
                    value={formData.maxUses}
                    onChange={e => setFormData({...formData, maxUses: e.target.value})}
                  />
                </div>
              </div>

              {/* Expiration Date */}
              <div className="lg:col-span-2">
                <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white">Expiration Date</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} strokeWidth={2.5} />
                  <input 
                    type="date" 
                    className={getInputClass(false, "dark:[color-scheme:dark] pl-11")}
                    value={formData.expiresAt}
                    onChange={e => setFormData({...formData, expiresAt: e.target.value})}
                  />
                </div>
              </div>

              {/* Public/Private Checkbox */}
              <div className="lg:col-span-1 flex items-center h-full pt-6">
                <label className="relative flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors w-full border border-transparent hover:border-gray-200 dark:hover:border-slate-700">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={formData.isPublic}
                      onChange={e => setFormData({...formData, isPublic: e.target.checked})}
                    />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-slate-700 rounded-full peer-checked:bg-blue-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-sm"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Public Coupon</span>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400">Guests can use without logging in</span>
                  </div>
                </label>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
              <button 
                disabled={createMutation.isPending || updateMutation.isPending || !formData.code.trim() || !formData.value}
                type="submit" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 h-[52px] px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 shrink-0"
              >
                {createMutation.isPending || updateMutation.isPending ? <Loader2 size={18} strokeWidth={2.5} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
                {editingId ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-[1.5rem]" />)}
        </div>
      ) : isError ? (
        <div className="p-10 text-center bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50 rounded-2xl text-rose-500 font-bold">
          Failed to load coupons. Please refresh the page.
        </div>
      ) : coupons?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 border-dashed shadow-sm">
          <Ticket size={56} strokeWidth={1.5} className="mb-4 opacity-20" />
          <p className="font-bold text-gray-600 dark:text-slate-400 text-base">No active coupons.</p>
          <p className="text-sm mt-1">Create your first discount code above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {coupons?.map((coupon: any) => (
            <div key={coupon.id} className="group relative bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              
              {/* Card Header (Code & Discount) */}
              <div className="p-5 pb-4 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent border-b border-dashed border-gray-200 dark:border-slate-700 flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <Ticket size={16} className="text-blue-500" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-blue-500">Discount Code</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-wide">{coupon.code}</h3>
                </div>
                
                <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-black text-sm shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                  {/* 🟢 Updated Currency */}
                  {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `-Rs. ${coupon.value}`}
                </div>
              </div>

              {/* Cutout Circles for "Ticket" Effect */}
              <div className="absolute top-[82px] -left-3 w-6 h-6 bg-gray-50 dark:bg-slate-950 rounded-full border-r border-gray-100 dark:border-slate-800"></div>
              <div className="absolute top-[82px] -right-3 w-6 h-6 bg-gray-50 dark:bg-slate-950 rounded-full border-l border-gray-100 dark:border-slate-800"></div>

              {/* Card Body (Stats & Details) */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-medium text-gray-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart size={14} className="text-gray-400" />
                    {/* 🟢 Updated Currency */}
                    <span>Min: Rs. {coupon.minOrderAmount || '0'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" />
                    <span>{coupon.limitPerUser ? `Limit: ${coupon.limitPerUser}` : 'Unlim. per user'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {coupon.isPublic ? <Globe size={14} className="text-blue-400"/> : <Lock size={14} className="text-amber-400"/>} 
                    <span>{coupon.isPublic ? 'Public Code' : 'Logged-in Only'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className={coupon.expiresAt && new Date(coupon.expiresAt) < new Date() ? 'text-red-500' : 'text-gray-400'} />
                    <span className={coupon.expiresAt && new Date(coupon.expiresAt) < new Date() ? 'text-red-500 font-bold' : ''}>
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never Expires'}
                    </span>
                  </div>
                </div>

                {/* Footer section with usage, edit, and delete */}
                <div className="flex items-end justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-0.5">Total Usage</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-gray-900 dark:text-white leading-none">{coupon.usedCount || 0}</span>
                      <span className="text-sm font-bold text-gray-400">/ {coupon.maxUses || <Infinity size={16} className="inline mb-0.5" />}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(coupon)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95"
                      title="Edit Coupon"
                    >
                      <Ticket size={18} strokeWidth={2.5} />
                    </button>
                    
                    <button 
                      onClick={() => { if(confirm(`Delete coupon ${coupon.code}?`)) deleteMutation.mutate(coupon.id) }}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                      title="Delete Coupon"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <style jsx>{`
      @media (max-width: 768px) {
        input, textarea, select {
          font-size: 16px !important;
        }
      }
    `}</style>
    </>
  );
}