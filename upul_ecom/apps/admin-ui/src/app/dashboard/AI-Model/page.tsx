"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadImageToKit } from "../siteimages/page"; 
import axiosInstance from "@/app/utils/axiosInstance"; 
import { User, Sparkles, Image as ImageIcon, Loader2, UploadCloud, X } from "lucide-react";

export default function VirtualTryOnPage() {

  const [activeTab, setActiveTab] = useState<"customer" | "admin">("customer");

  const [userFile, setUserFile] = useState<File | null>(null);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [category, setCategory] = useState<"upper_body" | "lower_body" | "dresses">("upper_body");
  const [garmentDescription, setGarmentDescription] = useState<string>("");

  const vtonMutation = useMutation({
    mutationFn: async () => {
      if (!userFile || !garmentFile) throw new Error("Missing files");
      const userUpload = await uploadImageToKit(userFile, "/vton-temp");
      const garmentUpload = await uploadImageToKit(garmentFile, "/vton-temp");
      const response = await axiosInstance.post("/api/vton/generate", {
        userImageUrl: userUpload.url,
        garmentImageUrl: garmentUpload.url,
        category,
        garmentDescription: garmentDescription || "A professional photo of a garment",
      });
      if (!response.data.success && !response.data.url) throw new Error(response.data.message);
      return response.data.resultImage || response.data.url; 
    },
    onError: (error: any) => alert(error.response?.data?.message || error.message),
  });

  const studioMutation = useMutation({
    mutationFn: async () => {
      if (!garmentFile) throw new Error("Missing garment file");
      const garmentUpload = await uploadImageToKit(garmentFile, "/vton-temp");
      const response = await axiosInstance.post("/api/vton/studio", {
        garmentImageUrl: garmentUpload.url,
        category,
        garmentDescription: garmentDescription || "A professional photo of a garment",
      });
      if (!response.data.url) throw new Error(response.data.error);
      return response.data.url; 
    },
    onError: (error: any) => alert(error.response?.data?.error || error.message),
  });

  const displayedImage = activeTab === "admin" ? studioMutation.data : vtonMutation.data;
  const isPending = vtonMutation.isPending || studioMutation.isPending;

  const inputStyles = `w-full h-[52px] px-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 ${activeTab === "customer" ? "focus:border-blue-500 focus:ring-blue-500/10" : "focus:border-purple-500 focus:ring-purple-500/10"} focus:ring-4 outline-none transition-all text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500`;

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Sparkles className="text-purple-500 hidden sm:block" size={28} strokeWidth={2.5} />
            AI Fashion Studio
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Generate professional catalog models or let customers try on clothes virtually.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          <div className="w-full lg:w-1/2 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col">
            
            <div className="flex border-b border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setActiveTab("customer")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                  activeTab === "customer" 
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10" 
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <User size={18} strokeWidth={2.5} />
                Customer Try-On
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                  activeTab === "admin" 
                    ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10" 
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Sparkles size={18} strokeWidth={2.5} />
                Admin Catalog Maker
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">

              {activeTab === "customer" && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">1. Upload Customer Photo</label>
                  
                  {userFile ? (
                    <div className="relative border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50 p-2 flex items-center justify-center h-48 group">
                      <img src={URL.createObjectURL(userFile!)} alt="Preview" className="max-h-full max-w-full rounded-lg shadow-sm object-contain" />
                      <button 
                        onClick={() => setUserFile(null)} 
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-transform transform hover:scale-105"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-400 dark:hover:border-blue-500/50 transition-colors cursor-pointer relative h-48">
                      <UploadCloud className="text-gray-400 dark:text-slate-500 mb-2" size={32} />
                      <span className="text-sm font-bold text-gray-600 dark:text-slate-400">Click or drag to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => { if (e.target.files) setUserFile(e.target.files[0]) }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                  {activeTab === "customer" ? "2. Upload Garment" : "1. Upload Garment (Flat-lay or Ghost Mannequin)"}
                </label>

                {garmentFile ? (
                  <div className="relative border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50 p-2 flex items-center justify-center h-48 group">
                    <img src={URL.createObjectURL(garmentFile!)} alt="Preview" className="max-h-full max-w-full rounded-lg shadow-sm object-contain" />
                    <button 
                      onClick={() => setGarmentFile(null)} 
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-transform transform hover:scale-105"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/50 transition-colors cursor-pointer relative h-48 ${activeTab === 'customer' ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-400 dark:hover:border-blue-500/50' : 'hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:border-purple-400 dark:hover:border-purple-500/50'}`}>
                    <UploadCloud className="text-gray-400 dark:text-slate-500 mb-2" size={32} />
                    <span className="text-sm font-bold text-gray-600 dark:text-slate-400">Click or drag to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => { if (e.target.files) setGarmentFile(e.target.files[0]) }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">Select Garment Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)}
                  className={inputStyles}
                >
                  <option value="upper_body">Upper Body (T-Shirts, Shirts, Tops)</option>
                  <option value="lower_body">Lower Body (Pants, Shorts, Skirts)</option>
                  <option value="dresses">Dresses (Frocks, Gowns, Full Outfits)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">Garment Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. A red cotton t-shirt with a floral design"
                  value={garmentDescription}
                  onChange={(e) => setGarmentDescription(e.target.value)}
                  className={inputStyles}
                />
              </div>

              <button
                onClick={() => activeTab === "customer" ? vtonMutation.mutate() : studioMutation.mutate()}
                disabled={isPending || !garmentFile || (activeTab === "customer" && !userFile)}
                className={`w-full flex items-center justify-center gap-2 h-[52px] rounded-xl text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 mt-auto ${
                  isPending 
                    ? "bg-gray-400 dark:bg-slate-700 text-gray-100 cursor-not-allowed shadow-none" 
                    : activeTab === "customer" 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} strokeWidth={2.5} />
                    Generating AI Image (~20s)...
                  </>
                ) : activeTab === "customer" ? (
                  <>
                    <User size={18} strokeWidth={2.5} />
                    Generate Customer Try-On
                  </>
                ) : (
                  <>
                    <Sparkles size={18} strokeWidth={2.5} />
                    Generate Admin Catalog Image
                  </>
                )}
              </button>

            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 flex items-center gap-2">
                <ImageIcon className="text-gray-400 dark:text-slate-500" size={18} strokeWidth={2.5} />
                <h3 className="font-bold text-gray-900 dark:text-white">Live Preview</h3>
              </div>
              
              <div className="p-6 flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950/50 min-h-[400px]">
                {isPending ? (
                  <div className="text-center">
                    <Loader2 className={`w-12 h-12 sm:w-16 sm:h-16 animate-spin mx-auto mb-4 ${activeTab === 'customer' ? 'text-blue-500' : 'text-purple-500'}`} />
                    <p className="text-gray-900 dark:text-white font-bold text-sm sm:text-base">Processing AI Image...</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">This usually takes 15-20 seconds</p>
                  </div>
                ) : displayedImage ? (
                  <img
                    src={displayedImage}
                    alt="Generated AI Result"
                    className="max-h-[500px] lg:max-h-[600px] w-auto rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 object-contain"
                  />
                ) : (
                  <div className="text-center flex flex-col items-center">
                    <ImageIcon size={56} strokeWidth={1.5} className="mb-4 text-gray-300 dark:text-slate-700" />
                    <p className="text-sm sm:text-base font-bold text-gray-500 dark:text-slate-400 px-4">Your generated image will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          input, select {
            font-size: 16px !important;
          }
        }
      `}</style>
    </>
  );
}