"use client";

import { useState, useEffect } from "react";
import axiosInstance from "../../../../axiosInstance";
import { uploadImageToKit } from "../imagekit/utils/uploadService"; 
import { Loader2, Ruler, Image as ImageIcon, X, UploadCloud, Save, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

// 🟢 Updated interface to include fileId
interface SizeChart {
  id: string;
  name: string;
  imageUrl: string;
  fileId: string; // 🟢 Required for handling deletions
}

export default function SizeChartUploadPage() {
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [charts, setCharts] = useState<SizeChart[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

  // 🟢 Editing State
  const [editingChart, setEditingChart] = useState<SizeChart | null>(null);

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

  // 🟢 Function to populate form for editing
  const startEdit = (chart: SizeChart) => {
    setEditingChart(chart);
    setName(chart.name);
    setSelectedFile(null); // Reset any new file selection
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
  };

  // 🟢 Function to clear edit state
  const cancelEdit = () => {
    setEditingChart(null);
    setName("");
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a name for the size chart.");
      return;
    }
    
    // In create mode, image is required. In edit mode, it's optional (keeps old one).
    if (!editingChart && !selectedFile) {
      toast.error("Please select an image to upload.");
      return;
    }

    try {
      setIsUploading(true);

      // 🟢 Variables to hold final data for DB
      let finalImageUrl = editingChart?.imageUrl || "";
      let finalFileId = editingChart?.fileId || "";

      // 1. Handle Image Upload if a NEW file is selected 🟢
      if (selectedFile) {
        // Upload new image to ImageKit folder '/size-charts'
        const uploadedImg = await uploadImageToKit(selectedFile, "/size-charts");
        finalImageUrl = uploadedImg.url;
        finalFileId = uploadedImg.fileId;
        // NOTE: Cleanup of old image happens on BACKEND via PUT request logic
      }

      if (editingChart) {
        // 2a. Update Mode (PUT) 🟢
        await axiosInstance.put(`/api/size-charts/${editingChart.id}`, {
          name: name.trim(),
          imageUrl: finalImageUrl,
          fileId: finalFileId, // Send new fileId (or old one if image wasn't changed)
        });
        toast.success("Size chart updated successfully!");
        cancelEdit(); // Exit edit mode
      } else {
        // 2b. Create Mode (POST)
        await axiosInstance.post("/api/size-charts", {
          name: name.trim(),
          imageUrl: finalImageUrl,
          fileId: finalFileId,
        });
        toast.success("Size chart uploaded successfully!");
        // Reset form
        setName("");
        setSelectedFile(null);
      }

      fetchCharts(); // Refresh list

    } catch (error: any) {
      console.error("Submit error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Something went wrong.";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this size chart? It will be removed from ImageKit as well.")) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/size-charts/${id}`);
      toast.success("Size chart deleted!");
      if (editingChart?.id === id) cancelEdit(); // Cancel edit if deleted chart was being edited
      fetchCharts();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete size chart.");
    }
  };

  // Determine what image to show in preview slot
  const getPreviewImage = () => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile); // Newly selected file
    }
    if (editingChart) {
      return editingChart.imageUrl; // Existing image in edit mode
    }
    return null; // Create mode, no file selected
  };

  const previewImage = getPreviewImage();

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-12">
      
      {/* --- TOP SECTION: FORM --- */}
      <div>
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {editingChart ? "Edit Size Chart" : "Manage Size Charts"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 font-medium">
              {editingChart ? `Updating "${editingChart.name}"` : "Upload and manage reference images for customers to check their sizes."}
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

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card: Details */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-center transition-colors">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                  <Ruler size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Chart Details</h2>
                  {editingChart && <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">ID: {editingChart.id}</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">
                  Chart Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Standard Men's Top Sizes"
                  disabled={isUploading}
                  className="w-full h-[52px] px-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-base font-medium text-gray-900 dark:text-white placeholder:text-gray-400 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Card: Media Upload */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500">
                  <ImageIcon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {editingChart ? "Change Image" : "Upload Image"}
                  </h2>
                  {editingChart && !selectedFile && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Current image kept unless new file chosen.</span>}
                </div>
              </div>

              <div className="w-full">
                {previewImage ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm bg-gray-50 dark:bg-slate-800 group transition-colors">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    {/* Badge indicating source */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {selectedFile ? "New File" : "Current Image"}
                    </div>

                    {!isUploading && selectedFile && (
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="absolute top-4 right-4 p-2 bg-white/90 text-red-500 hover:bg-red-500 hover:text-white rounded-full shadow-lg transition-all backdrop-blur-sm"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    )}
                    {/* If in edit mode and showing current image, allow replacing it */}
                    {!isUploading && editingChart && !selectedFile && (
                        <label className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                            <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2">
                                <UploadCloud size={16}/> Replace Image
                            </span>
                             <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl cursor-pointer bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud size={24} className="text-blue-500" strokeWidth={2} />
                      </div>
                      <p className="mb-1 text-sm font-bold text-gray-700 dark:text-slate-300">
                        Click to upload
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                        MAX. 5MB
                      </p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className={`w-full h-[60px] rounded-2xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none 
              ${editingChart 
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 text-white" 
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 text-white"
              }`}
          >
            {isUploading ? (
              <><Loader2 className="animate-spin" size={24} /> Processing...</>
            ) : editingChart ? (
              <><Save size={24} strokeWidth={2.5} /> Update Size Chart</>
            ) : (
              <><Save size={24} strokeWidth={2.5} /> Publish Size Chart</>
            )}
          </button>
        </form>
      </div>

      <div className="border-t border-gray-200 dark:border-slate-800 transition-colors"></div>

      {/* --- BOTTOM SECTION: GALLERY --- */}
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
            <p className="text-gray-500 dark:text-slate-400 font-medium">No size charts uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {charts.map((chart) => {
              const isBeingEdited = editingChart?.id === chart.id;
              return (
                <div 
                  key={chart.id} 
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden group hover:shadow-lg relative
                    ${isBeingEdited 
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-600 shadow-lg" 
                      : "border-gray-100 dark:border-slate-800 shadow-sm hover:border-gray-200 dark:hover:border-slate-700"
                    }`}
                >
                  {/* Image Container */}
                  <div className="aspect-square w-full bg-gray-50 dark:bg-slate-800 p-3 flex items-center justify-center relative transition-colors">
                    <img 
                      src={chart.imageUrl} 
                      alt={chart.name} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                    />
                    
                    {/* Status Badge */}
                    {isBeingEdited && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white rounded font-bold text-[9px] uppercase tracking-wider shadow z-10">
                            Editing
                        </div>
                    )}

                    {/* Hover Actions Overlay 🟢 */}
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
                  {/* Info Container */}
                  <div className={`p-3 border-t transition-colors ${isBeingEdited ? 'border-emerald-100 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-gray-50 dark:border-slate-800'}`}>
                    <h3 className={`font-bold text-xs truncate ${isBeingEdited ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`} title={chart.name}>
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