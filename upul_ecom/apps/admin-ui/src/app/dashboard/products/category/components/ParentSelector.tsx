"use client";

import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/app/utils/axiosInstance";
import { ChevronRight, ChevronDown, Network, Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ParentSelectorProps {
  onSelectionChange: (lastValidId: string | null) => void;
  refreshTrigger: number;
  initialCategoryId?: string;
}

// --- SUB-COMPONENT: Custom Category Dropdown ---
function CustomCategoryDropdown({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: Category[];
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Find the selected category name to display
  const selectedName = options.find((opt) => opt.id === value)?.name;

  return (
    <div className="relative w-full group" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] sm:h-[42px] px-3 sm:px-4 flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-blue-300 dark:hover:border-blue-700 ${isOpen ? "border-blue-500 dark:border-blue-500 ring-4 ring-blue-500/10" : ""}`}
      >
        <span
          className={
            !selectedName
              ? "text-gray-400 font-medium"
              : "text-gray-900 dark:text-white"
          }
        >
          {selectedName || placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-500" : "group-hover:text-blue-500"}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 max-h-[250px] overflow-y-auto custom-scrollbar">
          {/* 🟢 "Select..." Reset Option completely removed from here! */}

          {/* Category Options Only */}
          {options.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onChange(cat.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors ${
                value === cat.id
                  ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-white"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span>{cat.name}</span>
              {value === cat.id && (
                <Check
                  size={16}
                  strokeWidth={3}
                  className="shrink-0 animate-in zoom-in duration-200"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function ParentSelector({
  onSelectionChange,
  refreshTrigger,
  initialCategoryId,
}: ParentSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [levelOptions, setLevelOptions] = useState<Category[][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to fetch data
  const fetchCategories = async (parentId: string | null) => {
    const url = parentId
      ? `/api/categories?parentId=${parentId}`
      : `/api/categories?roots=true`;
    try {
      const res = await axiosInstance.get(url);
      return res.data || [];
    } catch (err) {
      console.error("Fetch error", err);
      return [];
    }
  };

  // Hydration Logic
  useEffect(() => {
    const hydrate = async () => {
      setIsLoading(true);
      if (!initialCategoryId) {
        const roots = await fetchCategories(null);
        setLevelOptions([roots]);
        setIsLoading(false);
        return;
      }

      try {
        const pathRes = await axiosInstance.get(
          `/api/categories/path/${initialCategoryId}`,
        );
        const path = pathRes.data;
        const pathIds = path.map((p: any) => p.id);
        setSelectedIds(pathIds);

        const optionPromises = [
          fetchCategories(null),
          ...path.map((p: any) => fetchCategories(p.id)),
        ];

        const allOptions = await Promise.all(optionPromises);
        const validOptions = allOptions.filter((opts) => opts.length > 0);
        setLevelOptions(validOptions);

        onSelectionChange(initialCategoryId);
      } catch (error) {
        console.error("Hydration failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategoryId, refreshTrigger]);

  const handleSelect = async (levelIndex: number, selectedId: string) => {
    const newSelectedIds = selectedIds.slice(0, levelIndex);
    if (selectedId !== "") newSelectedIds.push(selectedId);

    setSelectedIds(newSelectedIds);
    const currentOptionsSlice = levelOptions.slice(0, levelIndex + 1);
    setLevelOptions(currentOptionsSlice);

    const lastId =
      newSelectedIds.length > 0
        ? newSelectedIds[newSelectedIds.length - 1]
        : null;
    onSelectionChange(lastId);

    if (selectedId !== "") {
      const children = await fetchCategories(selectedId);
      if (children.length > 0) {
        setLevelOptions([...currentOptionsSlice, children]);
      }
    }
  };

  const getCategoryName = (levelIdx: number, id: string) => {
    return levelOptions[levelIdx]?.find((c) => c.id === id)?.name || "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="h-[42px] bg-gray-200 dark:bg-slate-700 rounded-xl w-full"></div>
        <div className="h-[42px] bg-gray-200 dark:bg-slate-700 rounded-xl w-3/4 ml-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Label with icon for context */}
      <div className="flex items-center gap-2 mb-2">
        <Network size={14} className="text-blue-500" />
        <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-widest">
          Category Path
        </span>
      </div>

      {/* 1. COMPACT VERTICAL STEPPER WITH CUSTOM DROPDOWNS */}
      <div className="flex flex-col gap-3">
        {levelOptions.map((options, index) => (
          // Added dynamic z-index so top dropdowns open OVER bottom dropdowns
          <div
            key={index}
            style={{ zIndex: 50 - index }}
            className="relative flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300"
          >
            {/* Inline Label */}
            <div className="w-16 sm:w-20 shrink-0 text-right">
              <span className="text-[9px] sm:text-[10px] font-extrabold text-blue-500 uppercase tracking-widest">
                {index === 0 ? "Main Dept" : `Level ${index}`}
              </span>
            </div>

            {/* Premium Custom Dropdown */}
            <div className="flex-1">
              <CustomCategoryDropdown
                value={selectedIds[index] || ""}
                options={options}
                onChange={(newId) => handleSelect(index, newId)}
                placeholder="Select..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* 2. INLINE BREADCRUMB SUMMARY */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 mt-1 animate-in fade-in">
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">
            Final Path:
          </span>
          {selectedIds.map((id, idx) => (
            <div key={id} className="flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight
                  size={12}
                  strokeWidth={3}
                  className="text-gray-300 dark:text-slate-600"
                />
              )}
              <span
                className={`text-[11px] sm:text-xs font-bold ${idx === selectedIds.length - 1 ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-slate-300"}`}
              >
                {getCategoryName(idx, id)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
