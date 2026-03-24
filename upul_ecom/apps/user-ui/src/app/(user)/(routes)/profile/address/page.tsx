'use client';

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, Edit2, Check } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import useUser from "@/app/hooks/useUser";
import axiosInstance from "@/app/utils/axiosInstance";

type AddressFormData = {
  firstname: string;
  lastname: string;
  addressLine: string;
  apartment?: string;
  city: string;
  postalCode: string;
  phoneNumber: string;
  isDefault: boolean;
};

const AddressManager = () => {
  const { user, isLoading } = useUser();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddressFormData>();
  const isDefaultChecked = watch("isDefault");

  const invalidateUser = () => queryClient.invalidateQueries({ queryKey: ["user"] });

  const addMutation = useMutation({
    mutationFn: (data: AddressFormData) => axiosInstance.post("/api/auth/add-address", data),
    onSuccess: () => { invalidateUser(); reset(); setIsEditing(false); toast.success("Address added"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: AddressFormData) => axiosInstance.put(`/api/auth/update-address/${selectedAddressId}`, data),
    onSuccess: () => { invalidateUser(); setIsEditing(false); setSelectedAddressId(null); toast.success("Address updated"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/auth/delete-address/${id}`),
    onSuccess: () => { invalidateUser(); toast.success("Address removed"); },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/auth/set-default-address/${id}`),
    onSuccess: invalidateUser,
  });

  const onSubmit = (data: AddressFormData) => {
    if (selectedAddressId) updateMutation.mutate(data);
    else addMutation.mutate(data);
  };

  const handleEditClick = (address: any) => {
    setSelectedAddressId(address.id);
    setIsEditing(true);
    Object.keys(address).forEach((key) => setValue(key as keyof AddressFormData, address[key]));
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xs uppercase tracking-[0.3em] font-bold">Loading...</div>;

  return (
    <div className="w-full min-h-screen bg-white font-outfit pb-32">
      <div className="max-w-6xl mx-auto px-6 pt-20">
        
        <Link href="/profile" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-gray-500 hover:text-black transition-colors mb-12">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <div className="flex justify-between items-end mb-16 border-b border-black pb-8">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Addresses</h1>
          {!isEditing && (
            <button onClick={() => { setIsEditing(true); setSelectedAddressId(null); reset(); }}
              className="flex items-center gap-2 text-[0.6rem] md:text-xs uppercase tracking-[0.2em] font-bold bg-black text-white px-3 py-3 hover:bg-gray-800 transition-all">
              <Plus size={14} /> Add New
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-widest">First Name</label>
                    <input {...register("firstname", { required: "Required" })} className="w-full py-3 border-b border-gray-200 outline-none focus:border-black transition-colors text-base font-medium" />
                    {errors.firstname && <p className="text-red-500 text-xs font-bold">{errors.firstname.message}</p>}
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-widest">Last Name</label>
                    <input {...register("lastname", { required: "Required" })} className="w-full py-3 border-b border-gray-200 outline-none focus:border-black transition-colors text-base font-medium" />
                    {errors.lastname && <p className="text-red-500 text-xs font-bold">{errors.lastname.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-gray-400 tracking-widest">Address</label>
                  <input {...register("addressLine", { required: "Required" })} className="w-full py-3 border-b border-gray-200 outline-none focus:border-black transition-colors text-base font-medium" />
                  {errors.addressLine && <p className="text-red-500 text-xs font-bold">{errors.addressLine.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-widest">City</label>
                    <input {...register("city", { required: "Required" })} className="w-full py-3 border-b border-gray-200 outline-none focus:border-black transition-colors text-base font-medium" />
                    {errors.city && <p className="text-red-500 text-xs font-bold">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-widest">Postal Code</label>
                    <input {...register("postalCode", { required: "Required" })} className="w-full py-3 border-b border-gray-200 outline-none focus:border-black transition-colors text-base font-medium" />
                    {errors.postalCode && <p className="text-red-500 text-xs font-bold">{errors.postalCode.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-gray-400 tracking-widest">Phone</label>
                  <input {...register("phoneNumber", { required: "Required" })} className="w-full py-3 border-b border-gray-200 outline-none focus:border-black transition-colors text-base font-medium" />
                  {errors.phoneNumber && <p className="text-red-500 text-xs font-bold">{errors.phoneNumber.message}</p>}
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-4 group w-fit">
                <div className={`w-5 h-5 border-2 border-black flex items-center justify-center transition-colors ${isDefaultChecked ? 'bg-black' : 'bg-white'}`}>
                    {isDefaultChecked && <Check size={12} className="text-white" />}
                </div>
                <input type='checkbox' className='hidden' {...register("isDefault")} />
                <span className='text-xs uppercase font-bold tracking-widest group-hover:text-gray-600 transition-colors'>Set as default</span>
              </label>

              <div className="flex gap-6 pt-10">
                <button type="submit" disabled={addMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-black text-white py-5 text-xs uppercase tracking-[0.2em] font-bold hover:bg-gray-900 transition-colors">
                  {selectedAddressId ? "Update Address" : "Save Address"}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} 
                  className="px-12 py-5 border-2 border-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {user?.addresses?.map((addr: any) => (
              <div key={addr.id} className={`relative p-10 border-2 transition-all duration-300 min-w-0 flex flex-col justify-between
                 ${addr.isDefault ? "border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,0.03)]" : "border-gray-100 hover:border-black"}`}>
                
                {addr.isDefault && (
                    <span className="absolute top-0 left-0 bg-black text-white text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-1.5">
                        Default
                    </span>
                )}

                <div className="mt-6 mb-10 min-w-0">
                    <p className="font-bold text-xl mb-2 truncate">{addr.firstname} {addr.lastname}</p>
                    <p className="text-base text-gray-600 leading-relaxed break-words">{addr.addressLine}</p>
                    <p className="text-base text-gray-600">{addr.city}, {addr.postalCode}</p>
                    <p className="text-sm font-mono text-gray-400 mt-4 tracking-wide">{addr.phoneNumber}</p>
                </div>

                {/* 👇 MODIFIED: Removed 'opacity-0' and 'group-hover' classes */}
                <div className="flex gap-6 border-t border-gray-100 pt-6">
                    <button onClick={() => handleEditClick(addr)} className="text-[10px] uppercase font-bold tracking-[0.1em] flex items-center gap-1 hover:text-gray-500">
                        <Edit2 size={12} /> Edit
                    </button>
                    {!addr.isDefault && (
                        <button onClick={() => { if(confirm("Delete?")) deleteMutation.mutate(addr.id)}} className="text-[10px] uppercase font-bold tracking-[0.1em] flex items-center gap-1 text-red-600 hover:text-red-800">
                            <Trash2 size={12} /> Delete
                        </button>
                    )}
                    {!addr.isDefault && (
                        <button onClick={() => setDefaultMutation.mutate(addr.id)} className="ml-auto text-[10px] uppercase font-bold tracking-[0.1em] underline decoration-gray-300 hover:decoration-black">
                            Make Default
                        </button>
                    )}
                </div>
              </div>
            ))}
            
            {user?.addresses?.length === 0 && (
                <div onClick={() => { setIsEditing(true); reset(); }} 
                   className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-gray-200 text-gray-400 cursor-pointer hover:border-black hover:text-black transition-colors min-h-[300px]">
                    <Plus size={32} className="mb-6" />
                    <p className="text-xs uppercase tracking-[0.2em] font-bold">Add Your First Address</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressManager;