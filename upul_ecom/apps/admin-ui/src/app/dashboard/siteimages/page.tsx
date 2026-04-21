"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MonitorPlay,
  Plus,
  Trash2,
  Loader2,
  Link as LinkIcon,
  PackageX,
  UploadCloud,
  X,
  Pencil,
  Save,
  Layers,
  Hash,
  Eye,
  EyeOff,
  ChevronDown,
  Megaphone,
} from "lucide-react";

type SectionType =
  | "HERO_BANNER_DESKTOP"
  | "HERO_BANNER_MOBILE"
  | "CATEGORY_GRID"
  | "LOOKBOOK";

interface SiteImage {
  id: string;
  title: string;
  section: SectionType;
  imageUrl: string;
  fileId: string;
  position: number;
  isActive: boolean;
}

interface Announcement {
  id: string;
  text: string;
  isActive: boolean;
  position: number;
}

// --- DYNAMIC UPLOAD UTILITY ---
export const uploadImageToKit = async (
  file: File,
  folder: string = "/siteimages",
) => {
  try {
    const { data: auth } = await axiosInstance.get("/api/imagekit/auth");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append("publicKey", "public_IeRRcxkTOy5kNKEIAJaj4/XW4Qg=");
    formData.append("signature", auth.signature);
    formData.append("expire", auth.expire);
    formData.append("token", auth.token);
    formData.append("useUniqueFileName", "true");
    formData.append("folder", folder);

    const response = await axios.post(
      "https://upload.imagekit.io/api/v1/files/upload",
      formData,
    );
    return { fileId: response.data.fileId, url: response.data.url };
  } catch (error) {
    console.error("Upload failed", error);
    throw error;
  }
};

export default function SiteImageManager() {
  const queryClient = useQueryClient();

  // --- NEW: Tab State ---
  const [activeTab, setActiveTab] = useState<"images" | "announcements">("images");

  // Form State
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<SectionType>("HERO_BANNER_DESKTOP");
  const [position, setPosition] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  // --- NEW: Announcement State ---
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementIsActive, setAnnouncementIsActive] = useState(true);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Image State
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [titleError, setTitleError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingImage, setEditingImage] = useState<SiteImage | null>(null);

  // Preview Logic
  useEffect(() => {
    if (uploadMode === "upload" && selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (uploadMode === "url") {
      setPreview(imageUrl);
      return;
    } else {
      setPreview("");
      return;
    }
  }, [selectedFile, imageUrl, uploadMode]);

  const clearImage = () => {
    setSelectedFile(null);
    setImageUrl("");
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- API FETCH ---
  const { data: siteImages = [], isLoading: isFetching } = useQuery<
    SiteImage[]
  >({
    queryKey: ["siteImages"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/site-images");
      return res.data;
    },
  });

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (newImg: Partial<SiteImage>) =>
      axiosInstance.post("/api/site-images", newImg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteImages"] });
      handleCancelEdit();
      toast.success("Image saved to website!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save image");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedImg: Partial<SiteImage> & { id: string }) =>
      axiosInstance.put(`/api/site-images/${updatedImg.id}`, updatedImg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteImages"] });
      handleCancelEdit();
      toast.success("Image updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update image");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/site-images/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteImages"] });
      toast.success("Image removed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete image");
    },
  });

  // --- NEW: Announcement Queries & Mutations ---
  const { data: announcements = [], isLoading: isFetchingAnnouncements } = useQuery<Announcement[]>({
    queryKey: ["adminAnnouncements"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/announcements?all=true");
      return res.data;
    },
    enabled: activeTab === "announcements",
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (newAnn: Partial<Announcement>) => axiosInstance.post("/api/announcements", newAnn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
      resetAnnouncementForm();
      toast.success("Announcement added!");
    },
    onError: () => toast.error("Failed to save announcement"),
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: (updatedAnn: Partial<Announcement> & { id: string }) => 
      axiosInstance.put(`/api/announcements/${updatedAnn.id}`, updatedAnn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
      resetAnnouncementForm();
      toast.success("Announcement updated!");
    },
    onError: () => toast.error("Failed to update announcement"),
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
      toast.success("Announcement removed");
    },
    onError: () => toast.error("Failed to delete announcement"),
  });

  const resetAnnouncementForm = () => {
    setAnnouncementText("");
    setAnnouncementIsActive(true);
    setEditingAnnouncement(null);
  };

  const handleAnnouncementSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!announcementText.trim()) {
      toast.error("Text is required");
      return;
    }

    const payload = {
      text: announcementText,
      isActive: announcementIsActive,
      position: announcements.length + 1
    };

    if (editingAnnouncement) {
      updateAnnouncementMutation.mutate({ id: editingAnnouncement.id, ...payload });
    } else {
      createAnnouncementMutation.mutate(payload);
    }
  };

  // --- HANDLERS ---
  const handleEditClick = (img: SiteImage) => {
    setEditingImage(img);
    setTitle(img.title);
    setSection(img.section);
    setPosition(img.position);
    setIsActive(img.isActive);

    if (img.imageUrl) {
      setImageUrl(img.imageUrl);
      setPreview(img.imageUrl);
      setUploadMode("url");
    }
    setTitleError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
    setTitle("");
    setSection("HERO_BANNER_DESKTOP"); // Updated this line!
    setPosition(1);
    setIsActive(true);
    clearImage();
    setTitleError("");
    setUploadMode("upload");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) return setTitleError("Title is required");
    if (!preview && !editingImage)
      return toast.error("Please provide an image");

    let finalImageUrl = imageUrl.trim();
    let finalFileId = editingImage?.fileId || "";

    try {
      if (uploadMode === "upload" && selectedFile) {
        setIsUploading(true);
        const uploadRes = await uploadImageToKit(selectedFile, "/siteimages");
        finalImageUrl = uploadRes.url;
        finalFileId = uploadRes.fileId;
      }

      const payload = {
        title: cleanTitle,
        section,
        position: Number(position),
        isActive,
        imageUrl: finalImageUrl,
        fileId: finalFileId,
      };

      if (editingImage) {
        updateMutation.mutate({ id: editingImage.id, ...payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- HELPERS ---
  const getSectionColor = (sec: string) => {
    switch (sec) {
      case "HERO_BANNER_DESKTOP":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "HERO_BANNER_MOBILE":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400";
      case "CATEGORY_GRID":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "LOOKBOOK":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // --- AUTO-CALCULATE NEXT POSITION ---
  useEffect(() => {
    // Only auto-calculate if we are creating a NEW image, not editing an old one
    if (!editingImage && siteImages) {
      // Find all images in the currently selected section
      const imagesInSection = siteImages.filter(
        (img) => img.section === section,
      );

      if (imagesInSection.length === 0) {
        setPosition(1); // First image in this section!
      } else {
        // Find the highest position number and add 1
        const maxPos = Math.max(...imagesInSection.map((img) => img.position));
        setPosition(maxPos + 1);
      }
    }
  }, [section, siteImages, editingImage]);

  // --- VALIDATION LOGIC ---
  const categoryImagesCount = siteImages.filter(
    (img) => img.section === "CATEGORY_GRID",
  ).length;
  const isCategoryLimitReached =
    !editingImage && section === "CATEGORY_GRID" && categoryImagesCount >= 3;

  // --- CARD RENDER HELPER ---
  // This keeps our code DRY while letting us change the width/height for different sections!
  const renderImageCard = (img: SiteImage, aspectClass: string) => (
    <div
      key={img.id}
      className={`group relative bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${!img.isActive && "opacity-60 grayscale-[50%]"}`}
    >
      {/* Dynamic Aspect Ratio Container */}
      <div
        className={`relative bg-gray-100 dark:bg-slate-800 overflow-hidden w-full ${aspectClass}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.imageUrl}
          alt={img.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
          <span
            className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase backdrop-blur-md shadow-sm ${getSectionColor(img.section)}`}
          >
            {img.section.replace("_", " ")}
          </span>
          {!img.isActive && (
            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-900/80 text-white flex items-center gap-1 backdrop-blur-md shadow-sm">
              <EyeOff size={10} /> HIDDEN
            </span>
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 dark:bg-slate-900/90 p-1 rounded-xl backdrop-blur-sm shadow-sm">
          <button
            onClick={() => handleEditClick(img)}
            className="p-1.5 text-gray-600 hover:text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <Pencil size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() =>
              confirm(`Delete ${img.title}?`) && deleteMutation.mutate(img.id)
            }
            disabled={deleteMutation.isPending}
            className="p-1.5 text-gray-600 hover:text-rose-600 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between border-t border-gray-50 dark:border-slate-800/50">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate pr-2">
          {img.title}
        </h3>
        <div className="flex-shrink-0 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
          <Hash size={12} /> {img.position}
        </div>
      </div>
    </div>
  );

  return (
    <>
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* --- HEADER WITH TABS --- */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <MonitorPlay className="text-blue-500" size={32} strokeWidth={2.5} />
          Storefront Content
        </h1>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 mt-6 border-b border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("images")}
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === "images" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-900 dark:text-slate-400"}`}
          >
            Site Images
            {activeTab === "images" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`pb-3 text-sm font-bold transition-colors relative flex items-center gap-2 ${activeTab === "announcements" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-900 dark:text-slate-400"}`}
          >
            <Megaphone size={16} /> Announcement Bar
            {activeTab === "announcements" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
          </button>
        </div>
      </div>

      {/* --- TAB CONTENT: SITE IMAGES --- */}
      {activeTab === "images" && (
        <>
      {/* --- FORM CARD --- */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-slate-800 mb-8 transition-colors">
        {editingImage && (
          <div className="mb-6 flex items-center justify-between bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl text-sm font-bold">
            <div className="flex items-center gap-2">
              <Pencil size={18} strokeWidth={2.5} />
              <span>Editing: {editingImage.title}</span>
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
          {/* LEFT COLUMN: Data Fields */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Title */}
            <div>
              <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white">
                Internal Title <span className="text-rose-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError("");
                }}
                className={`w-full h-[54px] px-4 bg-gray-50 dark:bg-slate-800/50 border rounded-xl outline-none transition-all font-medium shadow-sm ${titleError ? "border-rose-500 focus:ring-rose-500/20" : "border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/10"}`}
                placeholder="e.g. Summer Sale Hero Banner"
              />
              {titleError && (
                <p className="text-xs font-bold text-rose-500 mt-2 ml-1">
                  {titleError}
                </p>
              )}
            </div>

            {/* --- NEW LAYOUT: Full Width Section with Custom Arrow --- */}
            <div>
              <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <Layers size={14} /> Section
              </label>
              {/* Added relative wrapper for the custom arrow */}
              <div className="relative">
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as SectionType)}
                  className="w-full h-[54px] pl-4 pr-12 appearance-none bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium cursor-pointer"
                >
                  <option value="HERO_BANNER_DESKTOP">
                    Hero Banner (Desktop)
                  </option>
                  <option value="HERO_BANNER_MOBILE">
                    Hero Banner (Mobile)
                  </option>
                  <option value="CATEGORY_GRID">Category Grid (3 Items)</option>
                  <option value="LOOKBOOK">Lookbook</option>
                </select>
                {/* Custom perfectly placed arrow */}
                <ChevronDown
                  size={18}
                  strokeWidth={2.5}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* --- NEW LAYOUT: Position & Status on same row --- */}
            <div className="grid grid-cols-2 gap-4">
              {/* Position */}
              <div>
                <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  <Hash size={14} /> Position (Auto)
                </label>
                <input
                  type="number"
                  value={position}
                  readOnly
                  className="w-full h-[54px] px-4 bg-gray-100 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl outline-none font-medium text-gray-500 dark:text-slate-400 cursor-not-allowed"
                  title="Position is calculated automatically"
                />
              </div>

              {/* Visibility Toggle */}
              <div>
                <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-full h-[54px] px-3 sm:px-4 rounded-xl flex items-center justify-between font-bold border transition-all ${isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700"}`}
                >
                  <span className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                    {isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    {isActive ? "Visible" : "Hidden"}
                  </span>
                  <div
                    className={`w-10 h-6 rounded-full p-1 transition-colors shrink-0 ${isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-auto flex flex-col gap-3">
              {isCategoryLimitReached && (
                <div className="text-sm font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400 p-3 rounded-xl flex items-start gap-2 border border-rose-100 dark:border-rose-800/50">
                  <PackageX size={18} className="shrink-0 mt-0.5" />
                  <p>
                    Category Grid is limited to 3 images. Please delete or edit
                    an existing one.
                  </p>
                </div>
              )}

              <button
                type="submit"
                // 🟢 Disable if limit reached!
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  isUploading ||
                  isCategoryLimitReached
                }
                className="w-full flex items-center justify-center gap-2 h-[54px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {createMutation.isPending ||
                updateMutation.isPending ||
                isUploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />{" "}
                    {isUploading ? "Uploading..." : "Saving..."}
                  </>
                ) : editingImage ? (
                  <>
                    <Save size={20} /> Update Image
                  </>
                ) : (
                  <>
                    <Plus size={20} /> Save Image
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Image Uploader */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-3 ml-1">
              <label className="label text-sm font-bold text-gray-900 dark:text-white">
                Image Upload
              </label>
              <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUploadMode("upload")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${uploadMode === "upload" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-400" : "text-gray-500 hover:text-gray-900 dark:text-slate-400"}`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${uploadMode === "url" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-400" : "text-gray-500 hover:text-gray-900 dark:text-slate-400"}`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {uploadMode === "upload" ? (
              <div className="relative w-full h-48 sm:h-[300px] bg-gray-50 dark:bg-slate-800/30 border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-400 rounded-2xl flex items-center justify-center overflow-hidden group transition-all">
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain p-2 animate-in zoom-in-95 duration-300"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-3 right-3 bg-white dark:bg-slate-800 text-gray-500 hover:text-white hover:bg-rose-500 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    <div className="w-14 h-14 mb-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <UploadCloud size={28} strokeWidth={2.5} />
                    </div>
                    <span className="text-base font-bold text-gray-700 dark:text-gray-200">
                      Upload high-res banner
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG, WEBP up to 5MB
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="relative group">
                  <LinkIcon
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    size={20}
                  />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full h-[54px] pl-12 pr-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                    placeholder="https://..."
                  />
                </div>
                {preview && (
                  <div className="relative w-full h-40 sm:h-52 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner group/preview">
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
      {/* --- SECTIONED GRID VIEW --- */}
      {isFetching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-white dark:bg-slate-800/50 rounded-[1.5rem]"
            />
          ))}
        </div>
      ) : siteImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 border-dashed">
          <PackageX size={56} className="mb-5 opacity-20" />
          <p className="font-bold text-gray-600 dark:text-slate-400">
            No site images found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* 1. HERO BANNERS - STACKED FULL WIDTH VIEW */}
          {(siteImages.some((img) => img.section === "HERO_BANNER_DESKTOP") ||
            siteImages.some((img) => img.section === "HERO_BANNER_MOBILE")) && (
            <div className="flex flex-col gap-10">
              {/* Desktop Banners Row (Full Width) */}
              <div className="w-full space-y-4">
                <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 ml-1">
                  <MonitorPlay size={20} className="text-blue-500" /> Desktop
                  Banners
                </h2>
                {/* 1 column grid so the desktop image stretches all the way across */}
                <div className="grid grid-cols-1 gap-6">
                  {siteImages
                    .filter((img) => img.section === "HERO_BANNER_DESKTOP")
                    .map((img) =>
                      renderImageCard(
                        img,
                        "w-full h-[250px] md:h-[350px] lg:h-[450px]"
                      ),
                    )}

                  {siteImages.filter(
                    (img) => img.section === "HERO_BANNER_DESKTOP",
                  ).length === 0 && (
                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-gray-400 text-sm font-bold">
                      No Desktop Banners added yet
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Banners Row (Moved Down & Responsive) */}
              <div className="w-full space-y-4">
                <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 ml-1">
                  <div className="w-4 h-6 border-2 border-cyan-500 rounded-sm" />{" "}
                  Mobile Banners
                </h2>
                {/* Responsive Grid: 1 col on phones, 3 or 4 cols on big screens so mobile banners don't stretch too wide */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {siteImages
                    .filter((img) => img.section === "HERO_BANNER_MOBILE")
                    .map((img) => renderImageCard(img, "aspect-[9/16] w-full"))}

                  {siteImages.filter(
                    (img) => img.section === "HERO_BANNER_MOBILE",
                  ).length === 0 && (
                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-gray-400 text-sm font-bold">
                      No Mobile Banners added yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. CATEGORY GRID (Always 3 items across, Portrait styling) */}
          {siteImages.some((img) => img.section === "CATEGORY_GRID") && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 ml-1">
                Category Grid
              </h2>
              {/* Locks to 3 columns on sm screens and up */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {siteImages
                  .filter((img) => img.section === "CATEGORY_GRID")
                  .map((img) =>
                    renderImageCard(img, "aspect-[4/5] sm:aspect-[3/4]"),
                  )}
              </div>
            </div>
          )}

          {/* 3. LOOKBOOK (Standard Grid) */}
          {siteImages.some((img) => img.section === "LOOKBOOK") && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 ml-1">
                Lookbook
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {siteImages
                  .filter((img) => img.section === "LOOKBOOK")
                  .map((img) => renderImageCard(img, "aspect-[3/4]"))}
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* --- TAB CONTENT: ANNOUNCEMENTS --- */}
      {activeTab === "announcements" && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
          {/* Announcement Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-slate-800">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              {editingAnnouncement ? <Pencil size={18} className="text-amber-500"/> : <Plus size={18} className="text-blue-500"/>}
              {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
            </h2>
            
            <form onSubmit={handleAnnouncementSubmit} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white">Announcement Text</label>
                <input
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. ISLAND WIDE CASH-ON DELIVERY"
                  className="w-full h-[54px] px-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 uppercase text-sm font-bold"
                />
              </div>

              <div className="w-full md:w-48">
                <label className="label mb-2 ml-1 text-sm font-bold text-gray-900 dark:text-white">Status</label>
                <button
                  type="button"
                  onClick={() => setAnnouncementIsActive(!announcementIsActive)}
                  className={`w-full h-[54px] px-4 rounded-xl flex items-center justify-between font-bold border transition-all ${announcementIsActive ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700"}`}
                >
                  <span className="text-sm">{announcementIsActive ? "Visible" : "Hidden"}</span>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${announcementIsActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${announcementIsActive ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </button>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                {editingAnnouncement && (
                  <button type="button" onClick={resetAnnouncementForm} className="h-[54px] px-6 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors text-gray-900 dark:text-white">
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                  className="h-[54px] flex-1 md:w-32 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" /> Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Announcements List */}
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            {isFetchingAnnouncements ? (
               <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-gray-400 w-8 h-8"/></div>
            ) : announcements.length === 0 ? (
               <div className="p-10 text-center text-gray-500 font-bold">No announcements found. Add one above.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {announcements.map((ann) => (
                  <div key={ann.id} className={`p-4 sm:p-6 flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 ${!ann.isActive && 'opacity-60'}`}>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm md:text-base tracking-widest uppercase text-gray-900 dark:text-white">
                        {ann.text}
                      </span>
                      {!ann.isActive && <span className="text-xs font-bold text-rose-500 flex items-center gap-1"><EyeOff size={12}/> Hidden from site</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setEditingAnnouncement(ann); setAnnouncementText(ann.text); setAnnouncementIsActive(ann.isActive); }} className="p-2 text-gray-500 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400 rounded-lg transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => confirm("Delete this announcement?") && deleteAnnouncementMutation.mutate(ann.id)} disabled={deleteAnnouncementMutation.isPending} className="p-2 text-gray-500 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 rounded-lg transition-colors disabled:opacity-50">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
