"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useUser from "@/app/hooks/useUser";
import axiosInstance from "@/app/utils/axiosInstance";

type ProfileFormData = {
  firstname: string;
  lastname: string;
  phonenumber: string;
};

const EditProfilePage = () => {
  const { user, isLoading } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>();

  useEffect(() => {
    if (user) {
      setValue("firstname", user.firstname);
      setValue("lastname", user.lastname);
      setValue("phonenumber", user.phonenumber);
    }
  }, [user, setValue]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await axiosInstance.put("/api/auth/update-profile", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile updated");
      router.push("/profile");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const onSubmit = (data: ProfileFormData) => updateProfileMutation.mutate(data);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xs uppercase tracking-[0.3em] font-bold">Loading...</div>;

  return (
    <div className="w-full min-h-screen bg-white font-outfit pb-32">
      <div className="max-w-3xl mx-auto px-6 pt-20">
        
        <Link href="/profile" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-gray-500 hover:text-black transition-colors mb-12">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Edit Details</h1>
        <p className="text-base text-gray-500 mb-16 max-w-lg">Ensure your personal information is accurate for a smooth checkout experience.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-[0.2em] font-bold text-gray-400">First Name</label>
              <input {...register("firstname", { required: "Required" })}
                className="w-full py-4 border-b border-gray-200 outline-none focus:border-black transition-colors text-xl font-medium placeholder:text-gray-300"
                placeholder="First Name" />
              {errors.firstname && <span className="text-xs text-red-600 font-bold">{errors.firstname.message}</span>}
            </div>

            <div className="space-y-4">
              <label className="text-xs uppercase tracking-[0.2em] font-bold text-gray-400">Last Name</label>
              <input {...register("lastname", { required: "Required" })}
                className="w-full py-4 border-b border-gray-200 outline-none focus:border-black transition-colors text-xl font-medium placeholder:text-gray-300"
                placeholder="Last Name" />
              {errors.lastname && <span className="text-xs text-red-600 font-bold">{errors.lastname.message}</span>}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs uppercase tracking-[0.2em] font-bold text-gray-400">Phone Number</label>
            <input {...register("phonenumber", { required: "Required", pattern: { value: /^\d{10}$/, message: "Valid 10-digit number required" } })}
              className="w-full py-4 border-b border-gray-200 outline-none focus:border-black transition-colors text-xl font-medium placeholder:text-gray-300 tabular-nums"
              placeholder="07xxxxxxxx" />
            {errors.phonenumber && <span className="text-xs text-red-600 font-bold">{errors.phonenumber.message}</span>}
          </div>

          <div className="pt-10 flex gap-6">
            <button type="submit" disabled={updateProfileMutation.isPending}
              className="flex-1 bg-black text-white py-5 text-xs uppercase tracking-[0.2em] font-bold hover:bg-gray-900 transition-colors disabled:opacity-50">
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => router.push('/profile')}
              className="px-10 py-5 text-xs uppercase tracking-[0.2em] font-bold border-2 border-gray-200 hover:border-black transition-colors">
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;