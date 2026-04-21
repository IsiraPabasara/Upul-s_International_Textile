"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Layers,
  AlertTriangle,
  ChevronDown,
  Check,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";

// --- TYPES ---
interface SizeType {
  id: string;
  name: string;
  values: string[];
}

interface VariantRow {
  id: number;
  size: string;
  stock: number;
}

interface StockManagerProps {
  onUpdate: (data: {
    sizeType: string;
    variants: { size: string; stock: number }[];
  }) => void;
  initialVariants?: { size: string; stock: number }[];
  initialSizeType?: string;
}

// --- SHARED SCROLLBAR STYLES ---
const customScrollbar =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full";

// --- SUB-COMPONENT: Custom Table Row Dropdown ---
function CustomTableRowDropdown({
  value,
  options,
  onChange,
  rows,
  rowId,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  rows: VariantRow[];
  rowId: number;
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

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] sm:h-[44px] px-4 flex items-center justify-between bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-slate-600 ${isOpen ? "border-blue-400 dark:border-slate-500 ring-4 ring-blue-500/10" : ""}`}
      >
        <span>{value || "Select Size"}</span>
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-500" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[50] w-full mt-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[200px] overflow-y-auto ${customScrollbar}`}
        >
          {" "}
          {options.map((opt: string) => {
            const isSelectedElsewhere = rows.some(
              (r) => r.size === opt && r.id !== rowId,
            );
            return (
              <button
                key={opt}
                type="button"
                disabled={isSelectedElsewhere}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors ${
                  value === opt
                    ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-white"
                    : isSelectedElsewhere
                      ? "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                      : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>
                  {opt} {isSelectedElsewhere ? "(Added)" : ""}
                </span>
                {value === opt && (
                  <Check
                    size={16}
                    strokeWidth={3}
                    className="shrink-0 animate-in zoom-in duration-200"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function StockManager({
  onUpdate,
  initialVariants,
  initialSizeType,
}: StockManagerProps) {
  // 1. FETCH SIZE STANDARDS
  const { data: sizeTypes = [], isLoading } = useQuery<SizeType[]>({
    queryKey: ["size-types"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/size-types");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const hasHydrated = useRef(false);
  const [sizeType, setSizeType] = useState<string>("");
  const [rows, setRows] = useState<VariantRow[]>([
    { id: Date.now(), size: "", stock: 0 },
  ]);

  // Main Dropdown State
  const [isMainDropdownOpen, setIsMainDropdownOpen] = useState(false);
  const mainDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mainDropdownRef.current &&
        !mainDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMainDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper: Get options
  const selectedTypeObj = sizeTypes.find((t) => t.name === sizeType);
  const currentOptions = selectedTypeObj ? selectedTypeObj.values : [];
  const isDropdown = currentOptions.length > 0;

  // 2. HYDRATION
  useEffect(() => {
    if (hasHydrated.current) return;

    if (initialVariants && initialVariants.length > 0) {
      setRows(
        initialVariants.map((v, i) => ({
          id: Date.now() + i,
          size: v.size,
          stock: v.stock,
        })),
      );
      hasHydrated.current = true;
    } else if (!isLoading && sizeTypes.length > 0) {
      const defaultType = initialSizeType || sizeTypes[0].name;
      setSizeType(defaultType);

      const defaultOptions =
        sizeTypes.find((t) => t.name === defaultType)?.values || [];
      const startSize = defaultOptions.length > 0 ? defaultOptions[0] : "";
      setRows([{ id: Date.now(), size: startSize, stock: 0 }]);

      hasHydrated.current = true;
    }
  }, [initialVariants, initialSizeType, sizeTypes, sizeType, isLoading]);

  // 3. SYNC
  useEffect(() => {
    const cleanVariants = rows.map(({ size, stock }) => ({ size, stock }));
    onUpdate({ sizeType, variants: cleanVariants });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sizeType]);

  // --- ACTIONS ---
  const getNextAvailableSize = (currentRows: VariantRow[]) => {
    const usedSizes = currentRows.map((r) => r.size);
    return currentOptions.find((opt) => !usedSizes.includes(opt));
  };

  const handleTypeChange = (newType: string) => {
    setSizeType(newType);
    const newOptions = sizeTypes.find((t) => t.name === newType)?.values || [];
    setRows([{ id: Date.now(), size: newOptions[0] || "", stock: 0 }]);
  };

  const handleAddRow = () => {
    let nextSize = "";
    if (isDropdown) {
      const available = getNextAvailableSize(rows);
      if (!available) return;
      nextSize = available;
    }
    setRows((prev) => [...prev, { id: Date.now(), size: nextSize, stock: 0 }]);
  };

  const handleRemoveRow = (id: number) => {
    if (rows.length === 1) {
      const resetSize =
        isDropdown && currentOptions.length > 0
          ? getNextAvailableSize([]) || currentOptions[0]
          : "";
      setRows([{ id: Date.now(), size: resetSize, stock: 0 }]);
      return;
    }
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateRow = (
    id: number,
    field: "size" | "stock",
    value: string | number,
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === "stock")
          return { ...row, stock: Math.max(0, Number(value)) };
        return { ...row, size: String(value) };
      }),
    );
  };

  // --- SHOW/HIDE LOGIC ---
  const hasOptionsLeft = !isDropdown || rows.length < currentOptions.length;
  const allRowsValid = rows.every((row) => row.size && row.stock > 0);
  const canAddMore = hasOptionsLeft && allRowsValid;

  return (
    <div className="bg-white dark:bg-slate-900/50 p-4 sm:p-6 rounded-[2rem] border border-gray-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-2">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-purple-500" strokeWidth={2.5} />
            Variant Manager
            {isLoading && (
              <RefreshCw className="animate-spin text-gray-400" size={14} />
            )}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Define sizes and stock levels.
          </p>
        </div>

        {/* --- CUSTOM MAIN DROPDOWN --- */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <label className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap ml-1 sm:ml-0">
            Size Type
          </label>

          <div className="relative w-full sm:w-[200px]" ref={mainDropdownRef}>
            <button
              type="button"
              onClick={() =>
                !isLoading && setIsMainDropdownOpen(!isMainDropdownOpen)
              }
              disabled={isLoading}
              className={`w-full h-[40px] sm:h-[44px] px-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm sm:text-base font-bold text-gray-900 dark:text-white disabled:opacity-50 hover:border-blue-300 dark:hover:border-blue-800/50 ${isMainDropdownOpen ? "border-blue-500 dark:border-blue-500 ring-4 ring-blue-500/10" : ""}`}
            >
              <span>
                {isLoading ? "Loading..." : sizeType || "Select Type"}
              </span>
              <ChevronDown
                size={16}
                strokeWidth={2.5}
                className={`text-gray-400 transition-transform duration-300 ${isMainDropdownOpen ? "rotate-180 text-purple-500" : ""}`}
              />
            </button>

            {isMainDropdownOpen && !isLoading && (
              <div
                className={`absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 max-h-[250px] overflow-y-auto ${customScrollbar}`}
              >
                {sizeTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      handleTypeChange(type.name);
                      setIsMainDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${
                      sizeType === type.name
                        ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-white"
                        : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- RESPONSIVE "TABLE" (Cards on Mobile, Row on Desktop) --- */}
      {/* 🟢 overflow-hidden here guarantees corners never get clipped by row backgrounds */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-visible">
        {" "}
        {/* Table Header (Hidden on Mobile) */}
        <div className="hidden sm:flex items-center bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-sm text-gray-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest border-b border-gray-200 dark:border-slate-700 px-4 py-3 rounded-t-2xl">
          <div className="w-1/2 pl-2">Size ({sizeType})</div>
          <div className="w-1/3">Stock Qty</div>
          <div className="flex-1 text-right pr-2">Action</div>
        </div>
        {/* Rows Container */}
        <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
          {rows.map((row) => {
            const isZeroStock = row.stock === 0;
            return (
              <div
                key={row.id}
                className={`group flex flex-col sm:flex-row sm:items-center p-4 gap-4 sm:gap-0 transition-colors duration-300 ${
                  isZeroStock
                    ? "bg-red-50/30 dark:bg-red-900/10"
                    : "hover:bg-blue-50/30 dark:hover:bg-slate-800/30"
                }`}
              >
                {/* 📱 Mobile Label: Size */}
                <div className="sm:hidden text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-[-8px] ml-1">
                  Size ({sizeType})
                </div>

                {/* Size Input */}
                <div className="w-full sm:w-1/2 sm:pr-6">
                  {isDropdown ? (
                    <CustomTableRowDropdown
                      value={row.size}
                      options={currentOptions}
                      rows={rows}
                      rowId={row.id}
                      onChange={(newSize) => updateRow(row.id, "size", newSize)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={row.size}
                      onChange={(e) =>
                        updateRow(row.id, "size", e.target.value)
                      }
                      placeholder="Size name"
                      className="w-full h-[44px] px-4 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm sm:text-base font-bold text-gray-900 dark:text-white"
                    />
                  )}
                </div>

                {/* 📱 Mobile Label: Stock */}
                <div className="sm:hidden text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-1 mb-[-8px] ml-1 flex justify-between">
                  <span>Stock Quantity</span>
                  {isZeroStock && (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertTriangle size={12} /> Required
                    </span>
                  )}
                </div>

                {/* Stock Input */}
                <div className="w-full sm:w-1/3 sm:pr-6 relative">
                  <input
                    type="number"
                    value={row.stock}
                    onChange={(e) => updateRow(row.id, "stock", e.target.value)}
                    min="0"
                    className="w-full h-[44px] px-4 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm sm:text-base font-black text-gray-900 dark:text-white font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {/* Desktop Required Warning */}
                  {isZeroStock && (
                    <div
                      className="hidden sm:block absolute right-10 top-1/2 -translate-y-1/2 text-red-500 animate-pulse pointer-events-none"
                      title="Stock Required"
                    >
                      <AlertTriangle size={16} strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                {/* Action / Delete Button */}
                <div className="w-full sm:flex-1 flex sm:justify-end mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-gray-100 dark:border-slate-800 sm:border-none">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    className="w-full sm:w-[44px] h-[44px] flex items-center justify-center gap-2 text-gray-500 hover:text-red-500 bg-gray-50 sm:bg-transparent hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95 border border-gray-200 sm:border-none dark:border-slate-700"
                  >
                    <Trash2 size={18} strokeWidth={2.5} />
                    <span className="sm:hidden text-sm font-bold">
                      Remove Variant
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Dynamic Stock Badge */}
        {(() => {
          const totalStock = rows.reduce(
            (acc, r) => acc + (Number(r.stock) || 0),
            0,
          );
          return (
            <div
              className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-3 py-2 rounded-xl border uppercase tracking-wider transition-colors ${
                totalStock === 0
                  ? "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-900/20 dark:border-rose-800/50"
                  : totalStock < 10
                    ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800/50"
                    : "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800/50"
              }`}
            >
              <AlertCircle size={14} strokeWidth={2.5} />
              <span>
                Total Stock:{" "}
                <span className="font-black ml-1 text-xs sm:text-sm">
                  {totalStock}
                </span>
              </span>
            </div>
          );
        })()}

        {/* Add Variant Button */}
        {canAddMore ? (
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 animate-in fade-in zoom-in-95"
          >
            <Plus size={18} strokeWidth={2.5} /> Add Variant
          </button>
        ) : (
          <div className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest animate-in fade-in bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 w-full sm:w-auto text-center">
            {rows.some((r) => r.stock === 0)
              ? "Enter stock to add more"
              : "All sizes added"}
          </div>
        )}
      </div>
    </div>
  );
}
