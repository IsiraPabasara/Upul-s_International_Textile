"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import ParentSelector from "./../category/components/ParentSelector";
import BrandSelector from "./../brand/components/BrandSelector";
import ImageUploader from "./../../products/imagekit/components/ImageUploader";
import StockManager from "./../stockmanager/components/StockManager";
import ColorSelector from "./../colorselector/ColorSelector";
import CountrySelector from "../brand/components/CountrySelector";
import { uploadImageToKit } from "../imagekit/utils/uploadService";
import {
  Loader2,
  Tag,
  Image as ImageIcon,
  Box,
  Layers,
  DollarSign,
  X,
  Minus,
  Plus,
  Eye,
  Zap,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProductImage {
  fileId: string;
  url: string;
}
interface Variant {
  size: string;
  stock: number;
}

export interface ProductFormValues {
  name: string;
  sku?: string;
  description: string;
  price: number;
  stock: number;
  brand: string;
  country?: string;
  categoryId: string;
  sizeType: string;
  variants: Variant[];
  colors: string[];
  images: ProductImage[];
  isNewArrival: boolean;
  discountType: "NONE" | "PERCENTAGE" | "FIXED";
  discountValue: number;
  visible?: boolean;
}

interface Props {
  initialData?: ProductFormValues;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isLoading: boolean;
}

const INITIAL_DATA: ProductFormValues = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  brand: "",
  country: "",
  categoryId: "",
  sizeType: "Standard",
  variants: [],
  colors: [],
  images: [],
  isNewArrival: true,
  discountType: "NONE",
  discountValue: 0,
  visible: true,
};

export default function ProductForm({
  initialData,
  onSubmit,
  isLoading,
}: Props) {
  const isEditMode = !!initialData;
  const resetKey = 0; // Used as key for re-mounting components
  const [selectedRawFiles, setSelectedRawFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [categoryRefreshTrigger, setCategoryRefreshTrigger] = useState(0);
  const MAX_IMAGES = 5;

  const { register, handleSubmit, control, setValue, watch, reset } =
    useForm<ProductFormValues>({
      defaultValues: INITIAL_DATA,
    });

  // Watchers
  const watchedName = watch("name");
  const watchedColors = watch("colors");
  const watchedPrice = watch("price");
  const watchedDiscountType = watch("discountType");
  const currentImages = watch("images") || [];

  // Logic: Auto-Preview Name
  const primaryColor = watchedColors?.[0] || "";
  const namePreview =
    primaryColor &&
    !watchedName?.toLowerCase().includes(primaryColor.toLowerCase())
      ? `${watchedName} ${primaryColor}`
      : watchedName;

  // Logic: Discount Calc
  const getDiscountedPrice = () => {
    const price = Number(watchedPrice) || 0;
    const val = Number(watch("discountValue")) || 0;
    if (watchedDiscountType === "PERCENTAGE")
      return price - price * (val / 100);
    if (watchedDiscountType === "FIXED") return price - val;
    return price;
  };

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      if (initialData.variants?.length > 0) setHasVariants(true);
    }
  }, [initialData, reset]);

  const onFormSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    if (!data.categoryId) {
      toast.error("Please select a category");
      return;
    }
    const totalImages = currentImages.length + selectedRawFiles.length;
    if (totalImages > MAX_IMAGES) {
      toast.error(`Max ${MAX_IMAGES} images allowed.`);
      return;
    }
    if (hasVariants && data.variants.length === 0) {
      toast.error("Please add at least one size variant.");
      return;
    }
    if (!hasVariants && Number(data.stock) < 0) {
      toast.error("Stock cannot be negative.");
      return;
    }

    try {
      setIsUploading(true);

      // Upload Logic
      let newUploadedImages: ProductImage[] = [];
      if (selectedRawFiles.length > 0) {
        const uploadPromises = selectedRawFiles.map((file) =>
          uploadImageToKit(file),
        );
        newUploadedImages = await Promise.all(uploadPromises);
      }
      const finalImages = [...currentImages, ...newUploadedImages];
      const cleanData = { ...data, images: finalImages };

      // Name Append Logic
      if (cleanData.colors?.length > 0) {
        const colorToAppend = cleanData.colors[0];
        if (
          !cleanData.name.toLowerCase().includes(colorToAppend.toLowerCase())
        ) {
          cleanData.name = `${cleanData.name} ${colorToAppend}`.trim();
        }
      }

      // Stock Logic
      if (hasVariants) {
        cleanData.stock = cleanData.variants.reduce(
          (acc, curr) => acc + Number(curr.stock),
          0,
        );
      } else {
        cleanData.variants = [];
        cleanData.sizeType = "One Size";
        cleanData.stock = Number(data.stock) || 0;
      }
      await onSubmit(cleanData);
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Failed to save product. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeExistingImage = (index: number) => {
    const updated = [...currentImages];
    updated.splice(index, 1);
    setValue("images", updated);
  };

  const [isDiscountDropdownOpen, setIsDiscountDropdownOpen] = useState(false);
  const discountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        discountDropdownRef.current &&
        !discountDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDiscountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit, (errors) =>
        console.log("🚨 BLOCKED BY VALIDATION ERRORS:", errors),
      )}
      className="pb-20"
    >
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        {/* === LEFT COLUMN === */}
        <div className="xl:col-span-3 space-y-8">
          {/* 1. GENERAL INFORMATION */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="p-2 sm:p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                <Tag
                  size={20}
                  strokeWidth={2.5}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  General Information
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5 sm:mt-1">
                  Basic identification details.
                </p>
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6">
              {/* Product Name */}
              <div>
                <label className="label mb-1.5 sm:mb-2 ml-1 text-sm sm:text-base font-semibold">
                  Product Name <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  className="input-field h-[44px] sm:h-[48px] text-sm sm:text-base font-medium w-full"
                  placeholder="e.g. Cotton Night Dress"
                  {...register("name", { required: true })}
                />
                {primaryColor && watchedName && (
                  <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-blue-100 dark:border-blue-800/30 flex items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-1">
                    <span className="bg-blue-600 text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded shadow-sm font-bold tracking-wide uppercase shrink-0">
                      Preview
                    </span>
                    <span className="truncate opacity-90">
                      Will save as: <strong>{namePreview}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="label mb-1.5 sm:mb-2 ml-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Description <span className="text-red-500 ml-0.5">*</span>
                </label>
                <textarea
                  {...register("description", { required: true })}
                  rows={4}
                  className="input-field resize-none text-sm sm:text-base leading-relaxed py-2.5 sm:py-3 min-h-[100px] sm:min-h-[120px] w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 transition-colors"
                  placeholder="Product description..."
                />
              </div>

              <div className="pt-2">
                <label className="label mb-1.5 sm:mb-2 ml-1 text-sm sm:text-base font-semibold">
                  Country of Origin{" "}
                  <span className="text-gray-400 font-normal ml-1">
                    (Optional)
                  </span>
                </label>

                <Controller
                  name="country" // 🟢 Tells React Hook Form to manage the 'country' string
                  control={control}
                  render={({ field }) => (
                    <CountrySelector
                      selectedCountry={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* SKU & Brand Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-1 sm:pt-2">
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1.5 sm:mb-2 ml-1 h-5">
                    <label className="label mb-0 text-sm sm:text-base font-semibold">
                      SKU
                    </label>
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 select-none">
                      Auto-Generated
                    </span>
                  </div>
                  <input
                    type="text"
                    {...register("sku")}
                    disabled={true}
                    className="input-field h-[44px] sm:h-[46px] text-sm sm:text-base bg-slate-50 dark:bg-slate-800/40 text-slate-500 cursor-not-allowed border-dashed w-full"
                    placeholder="Generated after save..."
                  />
                </div>
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1.5 sm:mb-2 ml-1 h-5">
                    <label className="label mb-0 text-sm sm:text-base font-semibold">
                      Brand <span className="text-red-500 ml-0.5">*</span>
                    </label>
                  </div>
                  <Controller
                    name="brand"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <BrandSelector
                        selectedBrand={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. VARIANTS */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="p-2 sm:p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                <Layers
                  size={20}
                  strokeWidth={2.5}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  Variants & Stock
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5 sm:mt-1">
                  Manage colors, sizes, and inventory limits.
                </p>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {/* Primary Color Selector */}
              <div>
                <label className="label mb-1.5 sm:mb-2 ml-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  Primary Color <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="colors"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <ColorSelector
                      key={`color-${resetKey}`}
                      selectedColor={field.value?.[0] || ""}
                      onChange={(colorName) =>
                        field.onChange(colorName ? [colorName] : [])
                      }
                    />
                  )}
                />
              </div>

              <div className="border-t border-gray-100 dark:border-slate-800/50" />

              {/* Multiple Sizes Toggle Card */}
              <div className="flex items-center justify-between p-4 sm:p-5 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors rounded-2xl border border-gray-100 dark:border-slate-700">
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    Multiple Sizes?
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium">
                    Enable to add stock for S, M, L, XL variants.
                  </span>
                </div>

                {/* Premium Toggle Switch - FIXED OVERFLOW */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="sr-only peer"
                  />
                  {/* 🟢 FIXED: Changed sm:w-12 to sm:w-[52px] so the thumb fits perfectly inside the track */}
                  <div className="w-11 sm:w-[52px] h-6 sm:h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 shadow-inner"></div>
                </label>
              </div>

              {/* Dynamic Content Area (Stock vs Variants) */}
              <div className="animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300">
                {hasVariants ? (
                  <StockManager
                    key={`stock-${resetKey}`}
                    initialVariants={initialData?.variants}
                    initialSizeType={initialData?.sizeType}
                    onUpdate={(data) => {
                      setValue("sizeType", data.sizeType);
                      setValue("variants", data.variants);
                    }}
                  />
                ) : (
                  /* Single Stock Counter Card */
                  <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
                    <div className="flex flex-col gap-1.5 sm:gap-2 w-full sm:w-auto">
                      <label className="label mb-0 text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                        Total Available Quantity
                      </label>

                      {/* 🟢 3-TIER DYNAMIC BADGE LOGIC */}
                      {(() => {
                        const currentStock = Number(watch("stock")) || 0;
                        return (
                          <div
                            className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border w-fit transition-colors uppercase tracking-wider ${
                              currentStock === 0
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50"
                                : currentStock < 10
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50"
                            }`}
                          >
                            {currentStock === 0
                              ? "Out of Stock"
                              : currentStock < 10
                                ? "Low Stock"
                                : "In Stock"}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Stepper Input */}
                    <div className="flex items-center bg-gray-50 dark:bg-slate-800/50 rounded-xl p-1.5 border border-gray-200 dark:border-slate-700 w-full sm:w-auto justify-between sm:justify-center shadow-inner">
                      <button
                        type="button"
                        onClick={() =>
                          setValue(
                            "stock",
                            Math.max(0, (Number(watch("stock")) || 0) - 1),
                          )
                        }
                        className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg shadow-sm border border-gray-100 dark:border-slate-600 transition-all active:scale-95 shrink-0"
                      >
                        <Minus size={18} strokeWidth={2.5} />
                      </button>

                      <input
                        type="number"
                        min="0"
                        onKeyDown={(e) =>
                          (e.key === "-" || e.key === "e") && e.preventDefault()
                        }
                        className="w-20 sm:w-24 h-10 sm:h-11 text-center bg-transparent border-none text-lg sm:text-xl font-black text-gray-900 dark:text-white focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-300 dark:placeholder:text-slate-600"
                        placeholder="0"
                        {...register("stock", {
                          required: !hasVariants,
                          min: 0,
                          valueAsNumber: true,
                        })}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setValue("stock", (Number(watch("stock")) || 0) + 1)
                        }
                        className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg shadow-sm border border-gray-100 dark:border-slate-600 transition-all active:scale-95 shrink-0"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. PRICING */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                <DollarSign
                  size={20}
                  strokeWidth={2.5}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  Pricing Strategy
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5 sm:mt-1">
                  Set your base price and promotional discounts.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:gap-8">
              {/* Base Price Input - FIXED ALIGNMENT */}
              <div>
                <label className="label mb-1.5 sm:mb-2 ml-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Base Selling Price{" "}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                {/* 🟢 Flexbox Wrapper: Padding moved to parent (px-5) */}
                <div className="flex items-center w-full h-[56px] sm:h-[64px] px-5 bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-2xl transition-all shadow-inner overflow-hidden group">
                  {/* 🟢 Matched text size (text-xl sm:text-2xl) */}
                  <span className="pr-2 text-gray-400 font-black text-xl sm:text-2xl select-none group-focus-within:text-emerald-500 transition-colors mt-[1px]">
                    Rs.
                  </span>

                  <input
                    type="number"
                    min="0"
                    onKeyDown={(e) =>
                      (e.key === "-" || e.key === "e") && e.preventDefault()
                    }
                    {...register("price", { required: true })}
                    // 🟢 Removed h-full, added p-0 to strip native browser padding
                    className="flex-1 w-full bg-transparent text-xl sm:text-2xl font-black text-gray-900 dark:text-white outline-none p-0 border-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Discount Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
                {/* 🟢 CUSTOM PREMIUM DROPDOWN */}
                <div className="sm:col-span-2">
                  <label className="label mb-1.5 sm:mb-2 ml-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    Discount Type
                  </label>

                  <div className="relative w-full" ref={discountDropdownRef}>
                    {/* Hidden select for RHF */}
                    <select {...register("discountType")} className="hidden">
                      <option value="NONE">No Discount</option>
                      <option value="PERCENTAGE">Percentage %</option>
                      <option value="FIXED">Fixed Amount</option>
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        setIsDiscountDropdownOpen(!isDiscountDropdownOpen)
                      }
                      className={`w-full h-[52px] sm:h-[56px] px-4 flex items-center justify-between bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:border-emerald-300 dark:hover:border-emerald-800/50 ${isDiscountDropdownOpen ? "border-emerald-500 dark:border-emerald-500 ring-4 ring-emerald-500/10" : ""}`}
                    >
                      <span>
                        {watchedDiscountType === "NONE"
                          ? "No Discount"
                          : watchedDiscountType === "PERCENTAGE"
                            ? "Percentage %"
                            : watchedDiscountType === "FIXED"
                              ? "Fixed Amount"
                              : "Select Discount"}
                      </span>
                      <ChevronDown
                        size={18}
                        strokeWidth={2.5}
                        className={`text-gray-400 transition-transform duration-300 ${isDiscountDropdownOpen ? "rotate-180 text-emerald-500" : ""}`}
                      />
                    </button>

                    {isDiscountDropdownOpen && (
                      <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200">
                        {[
                          { val: "NONE", label: "No Discount" },
                          { val: "PERCENTAGE", label: "Percentage %" },
                          { val: "FIXED", label: "Fixed Amount" },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setValue(
                                "discountType",
                                opt.val as "NONE" | "PERCENTAGE" | "FIXED",
                              );
                              setIsDiscountDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${
                              watchedDiscountType === opt.val
                                ? "bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-white"
                                : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Discount Value Input - FIXED ALIGNMENT */}
                <div
                  className={`sm:col-span-1 transition-all duration-300 ${watchedDiscountType === "NONE" ? "opacity-40 pointer-events-none grayscale blur-[1px]" : "opacity-100"}`}
                >
                  <label className="label mb-1.5 sm:mb-2 ml-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    Value
                  </label>

                  {/* 🟢 Flexbox Wrapper for perfect baseline alignment */}
                  <div className="flex items-center w-full h-[52px] sm:h-[56px] bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all shadow-sm overflow-hidden group">
                    {watchedDiscountType === "FIXED" && (
                      <span className="pl-4 pr-1 text-gray-400 font-bold text-sm sm:text-base select-none group-focus-within:text-emerald-500 transition-colors">
                        Rs.
                      </span>
                    )}

                    <input
                      type="number"
                      min="0"
                      onKeyDown={(e) =>
                        (e.key === "-" || e.key === "e") && e.preventDefault()
                      }
                      {...register("discountValue")}
                      disabled={watchedDiscountType === "NONE"}
                      className={`flex-1 h-full w-full bg-transparent text-lg sm:text-xl font-black text-gray-900 dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${watchedDiscountType === "NONE" ? "px-4" : watchedDiscountType === "FIXED" ? "pr-4" : "pl-4"}`}
                      placeholder="0"
                    />

                    {watchedDiscountType === "PERCENTAGE" && (
                      <span className="pr-4 pl-1 text-gray-400 font-black text-sm sm:text-base select-none group-focus-within:text-emerald-500 transition-colors">
                        %
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Final Calculation Card - OPTIMIZED FOR MOBILE */}
              <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800/80 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 relative overflow-hidden shadow-inner mt-2">
                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

                {/* Calculation Breakdown */}
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4 sm:gap-8 text-sm relative z-10">
                  <div className="flex flex-col gap-0.5 sm:gap-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                      Original
                    </span>
                    {/* 🟢 Removed line-through, made it fully visible */}
                    <span className="font-mono text-base text-gray-600 dark:text-slate-300 font-bold">
                      Rs. {Number(watchedPrice || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="h-8 sm:h-10 w-px bg-gray-200 dark:bg-slate-700"></div>

                  <div className="flex flex-col gap-0.5 sm:gap-1 text-right sm:text-left">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                      Discount
                    </span>
                    <span className="font-mono text-base text-rose-500 font-bold">
                      - Rs.{" "}
                      {(
                        Number(watchedPrice || 0) - getDiscountedPrice()
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Final Price Highlight - Stacked clearly on mobile */}
                <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto gap-4 bg-white dark:bg-slate-950 px-5 sm:px-6 py-4 rounded-[1rem] border border-gray-100 dark:border-slate-800 shadow-md relative z-10 group hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-colors">
                  <div className="flex flex-col items-center sm:items-end w-full text-center sm:text-right">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                      Final Customer Price
                    </span>
                    <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none group-hover:scale-[1.02] transition-transform origin-center sm:origin-right">
                      Rs. {getDiscountedPrice().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === RIGHT COLUMN === */}
        <div className="xl:col-span-2 space-y-8 sticky top-6">
          {/* 4. MEDIA GALLERY */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon size={20} className="text-orange-500" />
                Product Media
              </h2>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  currentImages.length + selectedRawFiles.length >= MAX_IMAGES
                    ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800"
                    : "bg-gray-100 text-gray-500 border-transparent dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {currentImages.length + selectedRawFiles.length} / {MAX_IMAGES}
              </span>
            </div>

            <div className="mb-4">
              {currentImages.length + selectedRawFiles.length > 0 ? (
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm bg-gray-50 dark:bg-slate-800 group">
                  <img
                    src={
                      currentImages[0]?.url ||
                      URL.createObjectURL(selectedRawFiles[0])
                    }
                    alt="Cover"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (currentImages.length > 0) removeExistingImage(0);
                      else {
                        const updated = [...selectedRawFiles];
                        updated.splice(0, 1);
                        setSelectedRawFiles(updated);
                      }
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 hover:bg-red-500 hover:text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100 backdrop-blur-sm z-20"
                    title="Remove Cover"
                  >
                    <X size={18} />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm z-10">
                    Cover Image
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/5] w-full rounded-2xl bg-gray-50 dark:bg-slate-800/50 border-2 border-dashed border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                    <ImageIcon
                      size={32}
                      strokeWidth={1.5}
                      className="opacity-50"
                    />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide">
                    No cover image
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {[...currentImages, ...selectedRawFiles].map((fileOrUrl, idx) => {
                if (idx === 0) return null;
                const src =
                  fileOrUrl instanceof File
                    ? URL.createObjectURL(fileOrUrl)
                    : (fileOrUrl as ProductImage).url;
                return (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all bg-gray-50 dark:bg-slate-800 group"
                  >
                    <img
                      src={src}
                      className="w-full h-full object-contain"
                      alt=""
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (idx < currentImages.length)
                          removeExistingImage(idx);
                        else {
                          const newIdx = idx - currentImages.length;
                          const upd = [...selectedRawFiles];
                          upd.splice(newIdx, 1);
                          setSelectedRawFiles(upd);
                        }
                      }}
                      className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white"
                    >
                      <div className="bg-white text-red-500 p-1.5 rounded-full shadow-sm">
                        <X size={14} />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {currentImages.length + selectedRawFiles.length < MAX_IMAGES ? (
              <ImageUploader
                onFilesSelected={(incoming) => {
                  const left =
                    MAX_IMAGES -
                    (currentImages.length + selectedRawFiles.length);
                  if (left <= 0) return;
                  setSelectedRawFiles((p) => [
                    ...p,
                    ...incoming.slice(0, left),
                  ]);
                }}
              />
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 text-center">
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                  Maximum limit reached
                </p>
              </div>
            )}
          </div>

          {/* 5. ORGANIZATION & STATUS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-pink-50 dark:bg-pink-900/20 rounded-xl text-pink-500">
                <Box size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  Organization
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                  Category and status settings.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <ParentSelector
                      refreshTrigger={categoryRefreshTrigger}
                      initialCategoryId={initialData?.categoryId}
                      onSelectionChange={(id) => field.onChange(id || "")}
                    />
                  )}
                />
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Visibility Toggle Card */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all group shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Eye
                      size={18}
                      strokeWidth={2.5}
                      className="text-blue-500 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      Visible
                    </span>
                  </div>

                  <Controller
                    name="visible"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className="relative inline-flex items-center cursor-pointer shrink-0 outline-none"
                      >
                        <div
                          className={`w-10 h-5 rounded-full transition-colors duration-300 shadow-inner ${field.value ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-700"}`}
                        >
                          <div
                            className={`absolute top-[2px] left-[2px] h-4 w-4 bg-white border border-gray-200 dark:border-gray-500 rounded-full shadow-sm transition-transform duration-300 ${field.value ? "translate-x-5 border-transparent" : "translate-x-0"}`}
                          />
                        </div>
                      </button>
                    )}
                  />
                </div>

                {/* New Arrival Toggle Card */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800/50 transition-all group shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Zap
                      size={18}
                      strokeWidth={2.5}
                      className="text-orange-500 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      New
                    </span>
                  </div>

                  <Controller
                    name="isNewArrival"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className="relative inline-flex items-center cursor-pointer shrink-0 outline-none"
                      >
                        <div
                          className={`w-10 h-5 rounded-full transition-colors duration-300 shadow-inner ${field.value ? "bg-orange-500" : "bg-gray-200 dark:bg-slate-700"}`}
                        >
                          <div
                            className={`absolute top-[2px] left-[2px] h-4 w-4 bg-white border border-gray-200 dark:border-gray-500 rounded-full shadow-sm transition-transform duration-300 ${field.value ? "translate-x-5 border-transparent" : "translate-x-0"}`}
                          />
                        </div>
                      </button>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="space-y-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              {(isUploading || isLoading) && (
                <Loader2 className="animate-spin" size={18} />
              )}
              {isUploading
                ? "Uploading..."
                : isLoading
                  ? "Saving..."
                  : isEditMode
                    ? "Update Product"
                    : "Publish Product"}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setSelectedRawFiles([]);
                setHasVariants(false);
                setCategoryRefreshTrigger((prev) => prev + 1);
              }}
              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #4b5563;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .dark .label {
          color: #94a3b8;
        }
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          color: #111827;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        .dark .input-field {
          background-color: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }
        .input-field:focus {
          background-color: #fff;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          outline: none;
        }
        .dark .input-field:focus {
          background-color: #0f172a;
        }
      `}</style>
    </form>
  );
}
