"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "@/app/hooks/usePageTitle";
import { MapPin, Plus, Trash2, CheckCircle, Pencil, X } from "lucide-react";
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
  usePageTitle('Test: Addresses', 'Testing address management');
  const { user, isLoading } = useUser();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: {} } = useForm<AddressFormData>();

  // Helper to refresh data
  const invalidateUser = () => queryClient.invalidateQueries({ queryKey: ["user"] });

  // --- Mutations ---
  const addMutation = useMutation({
    mutationFn: (data: AddressFormData) => axiosInstance.post("/api/auth/add-address", data),
    onSuccess: () => {
      invalidateUser();
      reset();
      setIsEditing(false);
      toast.success("Address added!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: AddressFormData) => axiosInstance.put(`/api/auth/update-address/${selectedAddressId}`, data),
    onSuccess: () => {
      invalidateUser();
      setIsEditing(false);
      setSelectedAddressId(null);
      toast.success("Address updated!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/auth/delete-address/${id}`),
    onSuccess: () => {
      invalidateUser();
      toast.success("Address removed");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/auth/set-default-address/${id}`),
    onSuccess: invalidateUser,
  });

  // --- Handlers ---
  const onSubmit = (data: AddressFormData) => {
    if (selectedAddressId) {
      updateMutation.mutate(data);
    } else {
      addMutation.mutate(data);
    }
  };

  const handleEditClick = (address: any) => {
    setSelectedAddressId(address.id);
    setIsEditing(true);
    // Pre-fill form
    Object.keys(address).forEach((key) => {
      setValue(key as keyof AddressFormData, address[key]);
    });
  };

  if (isLoading) return <div className="p-10 text-center text-gray-500">Loading your profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
          <p className="text-gray-500">Manage your shipping destinations</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => { setIsEditing(true); setSelectedAddressId(null); reset(); }}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            <Plus size={18} /> Add New
          </button>
        )}
      </div>

      {isEditing ? (
        /* --- Add/Edit Form --- */
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">{selectedAddressId ? "Edit Address" : "New Address"}</h3>
            <button type="button" onClick={() => setIsEditing(false)}><X /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <input {...register("firstname", { required: "Required" })} className="w-full p-2 border rounded mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <input {...register("lastname", { required: "Required" })} className="w-full p-2 border rounded mt-1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Address Line</label>
              <input {...register("addressLine", { required: "Required" })} className="w-full p-2 border rounded mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <input {...register("city", { required: "Required" })} className="w-full p-2 border rounded mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Postal Code</label>
              <input {...register("postalCode", { required: "Required" })} className="w-full p-2 border rounded mt-1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Phone Number (10 digits)</label>
              <input {...register("phoneNumber", { required: "Required", pattern: /^\d{10}$/ })} className="w-full p-2 border rounded mt-1" />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
              className="bg-black text-white px-6 py-2 rounded-lg"
            >
              {selectedAddressId ? "Update Address" : "Save Address"}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      ) : (
        /* --- Address List --- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {user?.addresses?.map((addr: any) => (
            <div key={addr.id} className={`relative p-5 rounded-xl border-2 transition ${addr.isDefault ? "border-black bg-gray-50" : "border-gray-100 bg-white"}`}>
              {addr.isDefault && (
                <div className="absolute top-4 right-4 text-black flex items-center gap-1 text-xs font-bold uppercase">
                  <CheckCircle size={14} /> Default
                </div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="font-bold text-gray-900">{addr.firstname} {addr.lastname}</p>
                  <p className="text-gray-600 text-sm">{addr.addressLine}</p>
                  <p className="text-gray-600 text-sm">{addr.city}, {addr.postalCode}</p>
                  <p className="text-gray-900 text-sm mt-2 font-medium">{addr.phoneNumber}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => handleEditClick(addr)} className="text-sm flex items-center gap-1 text-gray-600 hover:text-black">
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => deleteMutation.mutate(addr.id)} className="text-sm flex items-center gap-1 text-red-500 hover:text-red-700">
                  <Trash2 size={14} /> Delete
                </button>
                {!addr.isDefault && (
                  <button onClick={() => setDefaultMutation.mutate(addr.id)} className="text-sm ml-auto text-blue-600 font-medium">
                    Set Default
                  </button>
                )}
              </div>
            </div>
          ))}
          {user?.addresses?.length === 0 && (
            <div className="md:col-span-2 py-20 text-center border-2 border-dashed rounded-xl">
              <MapPin className="mx-auto text-gray-300 mb-2" size={48} />
              <p className="text-gray-500">You haven't added any addresses yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressManager;