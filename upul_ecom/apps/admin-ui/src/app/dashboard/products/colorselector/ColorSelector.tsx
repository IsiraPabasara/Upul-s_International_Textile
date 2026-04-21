"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import toast from "react-hot-toast";
import { Plus, X, Check, Loader2 } from "lucide-react";
import { HexColorPicker } from "react-colorful";

interface Color {
  id: string;
  name: string;
  hexCode: string;
}

interface ColorSelectorProps {
  selectedColor: string;
  onChange: (colorName: string) => void;
  disabled?: boolean;
}

export default function ColorSelector({
  selectedColor,
  onChange,
  disabled,
}: ColorSelectorProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#000000");
  const [error, setError] = useState<string | null>(null);

  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  // Fetch Colors
  const { data: colors = [], isLoading } = useQuery<Color[]>({
    queryKey: ["colors"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/colors", { isPublic: true });
      return res.data;
    },
  });

  // Add Color Mutation
  const addColorMutation = useMutation({
    mutationFn: (newColor: { name: string; hexCode: string }) =>
      axiosInstance.post("/api/colors", newColor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      setIsAdding(false);
      setNewName("");
      setNewHex("#000000");
      setError(null);
      toast.success("Color added!");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to add color");
    },
  });

  // 🟢 NEW: Delete Color Mutation
  const deleteColorMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/colors/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });

      // If the user deleted the color they currently had selected, deselect it
      const deletedColor = colors.find((c) => c.id === deletedId);
      if (deletedColor && deletedColor.name === selectedColor) {
        onChange("");
      }

      toast.success("Color removed!");
    },
    onError: () => {
      toast.error("Failed to delete color. It might be in use by a product.");
    },
  });

  const handleAddColor = () => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      setError("Please enter a color name");
      return;
    }

    const isDuplicateName = colors.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    const isDuplicateHex = colors.some(
      (c) => c.hexCode.toLowerCase() === newHex.toLowerCase(),
    );

    if (isDuplicateName) {
      setError(`The color name "${trimmedName}" already exists`);
      return;
    }
    if (isDuplicateHex) {
      setError("This exact color (hex code) is already in your palette");
      return;
    }

    setError(null);
    addColorMutation.mutate({ name: trimmedName, hexCode: newHex });
  };

  const inputClass = `h-[40px] px-3 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 outline-none transition-all text-base md:text-sm w-full ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/10"}`;

  return (
    <div
      className={`space-y-4 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          Palette ({colors.length})
        </label>
        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setError(null);
          }}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${
            isAdding
              ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          }`}
        >
          {isAdding ? (
            <>
              <X size={14} /> Cancel
            </>
          ) : (
            <>
              <Plus size={14} /> Add Color
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <div
          className={`flex flex-col gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border animate-in fade-in slide-in-from-top-2 ${error ? "border-red-200 dark:border-red-800/50" : "border-gray-100 dark:border-slate-800"}`}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3 w-full">
              <div className="relative shrink-0" ref={pickerRef}>
                {/* Visual Swatch Button */}
                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  className="w-[42px] h-[40px] rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-transform active:scale-95 flex items-center justify-center"
                  style={{ backgroundColor: newHex }}
                >
                  <span className="sr-only">Choose color</span>
                </button>

                {/* Floating Popover */}
                {showPicker && (
                  <div className="absolute top-full left-0 mt-2 z-50 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                    <HexColorPicker color={newHex} onChange={setNewHex} />

                    {/* Handy Hex Input Area */}
                    <div className="mt-3 flex items-center gap-2 px-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        HEX
                      </span>
                      <input
                        type="text"
                        value={newHex}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewHex(val.startsWith("#") ? val : `#${val}`);
                        }}
                        className="w-full text-xs font-mono font-bold text-gray-700 dark:text-slate-300 p-1.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                        maxLength={7}
                      />
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Color Name (e.g. Navy)"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (error) setError(null);
                }}
                className={inputClass}
                autoFocus
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddColor())
                }
              />
            </div>
            <button
              type="button"
              onClick={handleAddColor}
              disabled={addColorMutation.isPending}
              className="h-[40px] px-6 bg-black dark:bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0 flex items-center justify-center gap-2"
            >
              {addColorMutation.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "Save Color"
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs ml-1 animate-in fade-in">
              {error}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 w-14 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"
              />
            ))
          : colors.map((color) => {
              const isSelected = selectedColor === color.name;
              const hex = color.hexCode.replace("#", "");
              const isDark = parseInt(hex, 16) < 0xffffff / 2;
              const isWhite =
                hex.toLowerCase() === "ffffff" || hex.toLowerCase() === "fff";

              return (
                <div
                  key={color.id}
                  onClick={() => onChange(isSelected ? "" : color.name)}
                  className={`
                  group cursor-pointer relative flex flex-col items-center justify-center gap-2 p-2 rounded-xl border transition-all duration-200 w-20
                  ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900"
                      : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-sm"
                  }
                `}
                >
                  {/* 🟢 NEW: Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents the swatch from being selected
                      if (
                        window.confirm(
                          `Are you sure you want to delete ${color.name}?`,
                        )
                      ) {
                        deleteColorMutation.mutate(color.id);
                      }
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md z-10 scale-90 hover:scale-100"
                    title="Delete Color"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>

                  <div
                    className={`
                    w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-all
                    ${
                      isWhite
                        ? "border-2 border-gray-300 dark:border-slate-600"
                        : "border border-gray-200 dark:border-slate-700/50"
                    }
                  `}
                    style={{ backgroundColor: color.hexCode }}
                  >
                    {isSelected && (
                      <Check
                        size={14}
                        className={isDark ? "text-white" : "text-black"}
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium truncate w-full text-center ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-500 dark:text-slate-400"}`}
                  >
                    {color.name}
                  </span>
                </div>
              );
            })}
      </div>
      <style jsx global>{`
        .react-colorful {
          width: 200px !important;
          height: 200px !important;
        }
        .react-colorful__pointer {
          width: 20px !important;
          height: 20px !important;
        }
      `}</style>
    </div>
  );
}
