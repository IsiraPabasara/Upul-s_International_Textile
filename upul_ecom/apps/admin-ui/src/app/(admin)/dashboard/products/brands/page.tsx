"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../../axiosInstance";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Tag,
  Plus,
  Trash2,
  Loader2,
  Link as LinkIcon,
  PackageX,
  UploadCloud,
  X,
  Pencil,
  Save,
} from "lucide-react";

interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  logoFileId?: string | null;
}

// --- IMAGEKIT UPLOAD UTILITY ---
export const uploadImageToKit = async (file: File) => {
  try {
    const { data: auth } = await axiosInstance.get("/api/imagekit/auth");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append(
      "publicKey",
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
    );
    formData.append("signature", auth.signature);
    formData.append("expire", auth.expire);
    formData.append("token", auth.token);
    formData.append("useUniqueFileName", "true");
    formData.append("folder", "/brands");

    const response = await axios.post(
      "https://upload.imagekit.io/api/v1/files/upload",
      formData,
    );

    return {
      fileId: response.data.fileId,
      url: response.data.url,
    };
  } catch (error) {
    console.error("Upload failed for file:", file.name, error);
    throw error;
  }
};

export default function BrandManager() {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("upload");
  const [logoUrl, setLogoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [nameError, setNameError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  useEffect(() => {
    if (uploadMode === "upload" && selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (uploadMode === "url") {
      setPreview(logoUrl);
      return;
    } else {
      setPreview("");
      return;
    }
  }, [selectedFile, logoUrl, uploadMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setLogoUrl("");
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const {
    data: brands = [],
    isLoading: isFetching,
    isError,
  } = useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/brands");
      return res.data;
    },
  });

  const handleEditClick = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    if (brand.logoUrl) {
      setLogoUrl(brand.logoUrl);
      setPreview(brand.logoUrl);
      setUploadMode("url"); // Default to URL mode to show existing image string
    } else {
      clearImage();
      setUploadMode("upload");
    }
    setNameError("");
    window.scrollTo({ top: 0, behavior: "smooth" }); // Smoothly scroll up to the form!
  };

  const handleCancelEdit = () => {
    setEditingBrand(null);
    setName("");
    clearImage();
    setNameError("");
    setUploadMode("upload");
  };

  const createMutation = useMutation({
    mutationFn: (newBrand: {
      name: string;
      logoUrl: string;
      logoFileId: string;
    }) => axiosInstance.post("/api/brands", newBrand),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setName("");
      clearImage();
      toast.success("Brand saved to database!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save brand");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand removed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete brand");
    },
  });

  // 🟢 NEW: Handles the update API call and gives visible Toast feedback
  const updateMutation = useMutation({
    mutationFn: (updatedBrand: {
      id: string;
      name: string;
      logoUrl: string;
      logoFileId: string;
    }) => axiosInstance.put(`/api/brands/${updatedBrand.id}`, updatedBrand),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      handleCancelEdit(); // Clears form
      toast.success("Brand updated successfully!"); // 🟢 Success Feedback
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update brand"); // 🔴 Error Feedback
    },
  });

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setNameError("Brand name is required");
      return toast.error("Brand name is required");
    }

    // 🟢 Prevent duplicates, but ignore the current brand if we are editing it
    const isDuplicate = brands.some(
      (brand) =>
        brand.name.toLowerCase() === cleanName.toLowerCase() &&
        brand.id !== editingBrand?.id,
    );

    if (isDuplicate) {
      setNameError(`The brand "${cleanName}" already exists!`);
      return toast.error(`The brand "${cleanName}" already exists!`);
    }

    let finalLogoUrl = logoUrl.trim();
    let finalLogoFileId = editingBrand?.logoFileId || ""; // Keep existing file ID if not replaced

    try {
      if (uploadMode === "upload" && selectedFile) {
        setIsUploading(true);
        const uploadRes = await uploadImageToKit(selectedFile);
        finalLogoUrl = uploadRes.url;
        finalLogoFileId = uploadRes.fileId;
      }

      const payload = {
        name: cleanName,
        logoUrl: finalLogoUrl,
        logoFileId: finalLogoFileId,
      };

      if (editingBrand) {
        updateMutation.mutate({ id: editingBrand.id, ...payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (error) {
      toast.error("Failed to upload image to ImageKit. Please try again.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }

    return;
  };

  const handleDelete = (id: string, brandName: string) => {
    if (confirm(`Are you sure you want to delete ${brandName}?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Tag
              className="text-blue-500 hidden sm:block"
              size={28}
              strokeWidth={2.5}
            />
            Brand Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Create and organize brands for your product catalog.
          </p>
        </div>
      </div>

      {/* --- CREATE FORM CARD --- */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-slate-800 mb-8 transition-colors">
        {editingBrand && (
          <div className="mb-6 flex items-center justify-between bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl text-sm font-bold">
            <div className="flex items-center gap-2">
              <Pencil size={18} strokeWidth={2.5} />
              <span>Editing Brand: {editingBrand.name}</span>
            </div>
            <button
              onClick={handleCancelEdit}
              className="hover:bg-amber-200 dark:hover:bg-amber-800 p-1 rounded-lg transition-colors"
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
        >
          {/* LEFT COLUMN: Brand Name & Submit */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div>
              <label
                className={`label mb-2 ml-1 text-sm sm:text-base font-bold transition-colors ${nameError ? "text-rose-500" : "text-gray-900 dark:text-white"}`}
              >
                Brand Name <span className="text-rose-500 ml-0.5">*</span>
              </label>

              <div className="relative group mt-2">
                <Tag
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${nameError ? "text-rose-400" : "text-gray-400 group-focus-within:text-blue-500"}`}
                  size={20}
                  strokeWidth={2.5}
                />
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(""); // 🟢 Instantly clear error when they type
                  }}
                  className={`w-full h-[54px] pl-12 pr-4 bg-gray-50 dark:bg-slate-800/50 border rounded-xl outline-none transition-all text-base font-bold shadow-sm placeholder:text-gray-400 dark:placeholder:text-slate-500
                    ${
                      nameError
                        ? "border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-rose-600 dark:text-rose-400"
                        : "border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-900 dark:text-white"
                    }
                  `}
                  placeholder="e.g. Nike, Apple, Sony"
                />
              </div>

              {/* 🟢 INLINE ERROR MESSAGE */}
              {nameError && (
                <p className="text-xs font-bold text-rose-500 mt-2 ml-1 animate-in slide-in-from-top-1 duration-200">
                  {nameError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending || isUploading || !name.trim()}
              className="w-full flex items-center justify-center gap-2 h-[54px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 shrink-0"
            >
              {createMutation.isPending ||
              updateMutation.isPending ||
              isUploading ? (
                <>
                  <Loader2
                    size={20}
                    strokeWidth={2.5}
                    className="animate-spin"
                  />
                  {/* Loading states */}
                  {isUploading
                    ? "Uploading Logo..."
                    : editingBrand
                      ? "Updating..."
                      : "Saving..."}
                </>
              ) : editingBrand ? (
                <>
                  <Save size={20} strokeWidth={2.5} />
                  Update Brand
                </>
              ) : (
                <>
                  {/* Add Mode Button */}
                  <Plus size={20} strokeWidth={2.5} />
                  Add New Brand
                </>
              )}
            </button>
          </div>

          {/* RIGHT COLUMN: Dual-Mode Image Input */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-3 ml-1">
              <label className="label text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                Brand Logo{" "}
                <span className="text-[11px] text-gray-400 font-normal ml-1">
                  (Optional)
                </span>
              </label>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUploadMode("upload")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${uploadMode === "upload" ? "bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"}`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${uploadMode === "url" ? "bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"}`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {uploadMode === "upload" ? (
              // 🟢 REFINED: Massive, beautiful Dropzone
              <div className="relative w-full h-40 sm:h-48 bg-gray-50 dark:bg-slate-800/30 border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl flex items-center justify-center overflow-hidden transition-all group">
                {preview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain p-4 animate-in zoom-in-95 duration-300"
                    />

                    {/* Sleek Little Cross Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        clearImage();
                      }}
                      className="absolute top-3 right-3 bg-white dark:bg-slate-800 text-gray-500 hover:text-white hover:bg-rose-500 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10"
                      title="Remove Image"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    <div className="w-14 h-14 mb-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <UploadCloud size={28} strokeWidth={2.5} />
                    </div>
                    <span className="text-base font-bold text-gray-700 dark:text-gray-200">
                      Click to upload brand logo
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      PNG, JPG, SVG up to 5MB
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            ) : (
              // 🟢 REFINED: URL Mode Layout
              <div className="flex flex-col gap-4">
                <div className="relative group">
                  <LinkIcon
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    size={20}
                    strokeWidth={2.5}
                  />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full h-[54px] pl-12 pr-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-base font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm"
                    placeholder="https://example.com/brand-logo.png"
                  />
                </div>
                {preview && (
                  <div className="relative w-32 h-32 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner group/preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain p-2 animate-in zoom-in-95"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity backdrop-blur-sm"
                    >
                      <X
                        size={28}
                        strokeWidth={3}
                        className="hover:scale-110 transition-transform"
                      />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* --- GRID VIEW --- */}
      {isFetching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="aspect-square bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-[1.5rem] shadow-sm"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-10 text-center bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50 rounded-2xl text-rose-500 font-bold">
          Failed to load brands. Please refresh the page.
        </div>
      ) : brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 border-dashed shadow-sm">
          <PackageX size={56} strokeWidth={1.5} className="mb-5 opacity-20" />
          <p className="font-bold text-gray-600 dark:text-slate-400 text-base">
            No brands found in database.
          </p>
          <p className="text-sm mt-1">
            Add your first brand using the form above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="group relative bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50 transition-all flex flex-col items-center justify-center text-center overflow-hidden"
            >
              <div className="absolute top-2 right-2 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => handleEditClick(brand)}
                  className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all active:scale-95"
                  title="Edit Brand"
                >
                  <Pencil size={15} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => handleDelete(brand.id, brand.name)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                  title="Delete Brand"
                >
                  <Trash2 size={15} strokeWidth={2.5} />
                </button>
              </div>
              <button
                onClick={() => handleDelete(brand.id, brand.name)}
                disabled={deleteMutation.isPending}
                className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-95 disabled:opacity-50 z-10"
                title="Delete Brand"
              >
                <Trash2 size={16} strokeWidth={2.5} />
              </button>

              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 shadow-inner">
                {brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement?.classList.add(
                        "flex",
                        "items-center",
                        "justify-center",
                      );
                    }}
                  />
                ) : (
                  <Tag
                    className="text-gray-300 dark:text-slate-600"
                    size={28}
                    strokeWidth={2}
                  />
                )}
              </div>

              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white w-full truncate px-2">
                {brand.name}
              </h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
