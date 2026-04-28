"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/app/utils/axiosInstance";
import { uploadImageToKit } from "@/app/dashboard/products/imagekit/utils/uploadService";
import {
  Loader2,
  Ruler,
  X,
  UploadCloud,
  Save,
  Trash2,
  Pencil,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

interface SizeChart {
  id: string;
  name: string;
  imageUrl: string;
  fileId: string; 
}

export default function SizeChartUploadPage() {

  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [charts, setCharts] = useState<SizeChart[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

  const [editingChart, setEditingChart] = useState<SizeChart | null>(null);

  const [nameError, setNameError] = useState("");
  const [imageError, setImageError] = useState("");

  const fetchCharts = async () => {
    try {
      setIsLoadingCharts(true);
      const res = await axiosInstance.get("/api/size-charts");
      setCharts(res.data);
    } catch (error) {
      console.error("Failed to fetch charts:", error);
      toast.error("Could not load existing size charts.");
    } finally {
      setIsLoadingCharts(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startEdit = (chart: SizeChart) => {
    setEditingChart(chart);
    setName(chart.name);
    setSelectedFile(null); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

  const cancelEdit = () => {
    setEditingChart(null);
    setName("");
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("Please enter a chart name");
      isValid = false;
    } else {
      const isDuplicate = charts.some(
        (chart) =>
          chart.name.toLowerCase() === trimmedName.toLowerCase() &&
          chart.id !== editingChart?.id, 
      );

      if (isDuplicate) {
        setNameError(`A size chart named "${trimmedName}" already exists`);
        isValid = false;
      }
    }

    if (!editingChart && !selectedFile && !previewImage) {
      setImageError("Please upload a size chart image");
      isValid = false;
    }

    if (!isValid) return;

    try {
      setIsUploading(true);

      let finalImageUrl = editingChart?.imageUrl || "";
      let finalFileId = editingChart?.fileId || "";

      if (selectedFile) {
        const uploadedImg = await uploadImageToKit(
          selectedFile,
          "/size-charts",
        );
        finalImageUrl = uploadedImg.url;
        finalFileId = uploadedImg.fileId;
      }

      if (editingChart) {
        await axiosInstance.put(`/api/size-charts/${editingChart.id}`, {
          name: trimmedName,
          imageUrl: finalImageUrl,
          fileId: finalFileId,
        });
        toast.success("Size chart updated successfully!");
        cancelEdit();
      } else {
        await axiosInstance.post("/api/size-charts", {
          name: trimmedName,
          imageUrl: finalImageUrl,
          fileId: finalFileId,
        });
        toast.success("Size chart uploaded successfully!");
        setName("");
        setSelectedFile(null);
      }

      fetchCharts();
    } catch (error: any) {
      console.error("Submit error:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong.";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this size chart? It will be removed from ImageKit as well.",
      )
    ) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/size-charts/${id}`);
      toast.success("Size chart deleted!");
      if (editingChart?.id === id) cancelEdit(); 
      fetchCharts();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete size chart.");
    }
  };

  const getPreviewImage = () => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile); 
    }
    if (editingChart) {
      return editingChart.imageUrl; 
    }
    return null; 
  };

  const previewImage = getPreviewImage();

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-12">
      <div>
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {editingChart ? "Edit Size Chart" : "Manage Size Charts"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 font-medium">
              {editingChart
                ? `Updating "${editingChart.name}"`
                : "Upload and manage reference images for customers to check their sizes."}
            </p>
          </div>
          {editingChart && (
            <button
              onClick={cancelEdit}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-slate-800 mb-8 transition-colors">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
          >
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div>
                <label
                  className={`label mb-2 ml-1 text-sm sm:text-base font-bold transition-colors ${nameError ? "text-red-500" : "text-gray-900 dark:text-white"}`}
                >
                  Chart Name <span className="text-red-500 ml-0.5">*</span>
                </label>

                <div className="relative group mt-2">
                  <Ruler
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${nameError ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500"}`}
                    size={20}
                    strokeWidth={2.5}
                  />
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(""); 
                    }}
                    className={`w-full h-[54px] pl-12 pr-4 bg-gray-50 dark:bg-slate-800/50 border rounded-xl outline-none transition-all text-base font-bold shadow-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 disabled:opacity-60
                      ${
                        nameError
                          ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-gray-900 dark:text-white"
                          : "border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-900 dark:text-white"
                      }
                    `}
                    placeholder="e.g. Standard Men's Top Sizes"
                    disabled={isUploading}
                  />
                </div>
                {nameError && (
                  <p className="text-red-500 text-xs  mt-1.5 ml-1 animate-in fade-in">
                    {nameError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUploading || (!name.trim() && !editingChart)}
                className="w-full flex items-center justify-center gap-2 h-[54px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 shrink-0"
              >
                {isUploading ? (
                  <>
                    <Loader2
                      size={20}
                      strokeWidth={2.5}
                      className="animate-spin"
                    />{" "}
                    Processing...
                  </>
                ) : editingChart ? (
                  <>
                    <Save size={20} strokeWidth={2.5} /> Update Size Chart
                  </>
                ) : (
                  <>
                    <Plus size={20} strokeWidth={2.5} /> Publish Size Chart
                  </>
                )}
              </button>
            </div>

            <div className="lg:col-span-7 flex flex-col">
              <div className="flex items-center justify-between mb-3 ml-1">
                <label
                  className={`label text-sm sm:text-base font-bold transition-colors ${imageError ? "text-red-500" : "text-gray-900 dark:text-white"}`}
                >
                  Chart Image <span className="text-red-500 ml-0.5">*</span>
                </label>
                {editingChart && !selectedFile && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Current image kept unless changed.
                  </span>
                )}
              </div>

              <div
                className={`relative w-full h-40 sm:h-48 border-2 border-dashed rounded-2xl flex items-center justify-center overflow-hidden transition-all group ${imageError ? "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800/50" : "bg-gray-50 dark:bg-slate-800/30 border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"}`}
              >
                {previewImage ? (
                  <>
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-contain p-4 animate-in zoom-in-95 duration-300"
                    />

                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white rounded-full text-[10px] font-bold uppercase tracking-wider z-10">
                      {selectedFile ? "New File" : "Current Image"}
                    </div>

                    {!isUploading && selectedFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                        }}
                        className="absolute top-3 right-3 bg-white dark:bg-slate-800 text-gray-500 hover:text-white hover:bg-red-500 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-20"
                        title="Remove Image"
                      >
                        <X size={18} strokeWidth={3} />
                      </button>
                    )}

                    {!isUploading && editingChart && !selectedFile && (
                      <label className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm z-20">
                        <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2">
                          <UploadCloud size={16} /> Replace Image
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            handleFileChange(e);
                            if (imageError) setImageError(""); 
                          }}
                        />
                      </label>
                    )}
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    <div
                      className={`w-14 h-14 mb-3 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm ${imageError ? "bg-red-100 dark:bg-red-900/30 text-red-500" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"}`}
                    >
                      <UploadCloud size={28} strokeWidth={2.5} />
                    </div>
                    <span
                      className={`text-base font-bold ${imageError ? "text-red-500" : "text-gray-700 dark:text-gray-200"}`}
                    >
                      Click to upload size chart
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      PNG, JPG, SVG up to 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleFileChange(e);
                        if (imageError) setImageError(""); 
                      }}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>

              {imageError && (
                <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 animate-in fade-in">
                  {imageError}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-slate-800 transition-colors"></div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 leading-tight">
            Uploaded Size Charts
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs py-1 px-2.5 rounded-full font-black">
              {charts.length}
            </span>
          </h2>
        </div>

        {isLoadingCharts ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : charts.length === 0 ? (
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700 p-12 text-center transition-colors">
            <p className="text-gray-500 dark:text-slate-400 font-medium">
              No size charts uploaded yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {charts.map((chart) => {
              const isBeingEdited = editingChart?.id === chart.id;
              return (
                <div
                  key={chart.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden group hover:shadow-lg relative
                    ${
                      isBeingEdited
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-600 shadow-lg"
                        : "border-gray-100 dark:border-slate-800 shadow-sm hover:border-gray-200 dark:hover:border-slate-700"
                    }`}
                >
                  <div className="aspect-square w-full bg-gray-50 dark:bg-slate-800 p-3 flex items-center justify-center relative transition-colors">
                    <img
                      src={chart.imageUrl}
                      alt={chart.name}
                      className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                    />

                    {isBeingEdited && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white rounded font-bold text-[9px] uppercase tracking-wider shadow z-10">
                        Editing
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                      <button
                        onClick={() => startEdit(chart)}
                        disabled={isUploading || isBeingEdited}
                        className="bg-white hover:bg-gray-100 text-gray-900 p-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit Chart"
                      >
                        <Pencil size={18} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(chart.id)}
                        disabled={isUploading}
                        className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75 disabled:opacity-50"
                        title="Delete Chart"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                  <div
                    className={`p-3 border-t transition-colors ${isBeingEdited ? "border-emerald-100 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-gray-50 dark:border-slate-800"}`}
                  >
                    <h3
                      className={`font-bold text-xs truncate ${isBeingEdited ? "text-emerald-800 dark:text-emerald-300" : "text-gray-900 dark:text-white"}`}
                      title={chart.name}
                    >
                      {chart.name}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
