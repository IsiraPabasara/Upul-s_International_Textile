"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../../axiosInstance";
import toast from "react-hot-toast";
import { Plus, X, Check, Loader2 } from "lucide-react";

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

export default function ColorSelector({ selectedColor, onChange, disabled }: ColorSelectorProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#000000");

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
      toast.success("Color added!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add color");
    },
  });

  const handleAddColor = () => {
    if (!newName.trim()) return toast.error("Enter a color name");
    addColorMutation.mutate({ name: newName, hexCode: newHex });
  };

  // Base input styles for consistency
  const inputClass = "h-[40px] px-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-sm w-full";

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          Palette ({colors.length})
        </label>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${
            isAdding
              ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          }`}
        >
          {isAdding ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Color</>}
        </button>
      </div>

      {/* --- Add Form --- */}
      {isAdding && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-3 w-full">
            <div className="relative shrink-0">
                <input
                    type="color"
                    value={newHex}
                    onChange={(e) => setNewHex(e.target.value)}
                    className="w-[42px] h-[40px] rounded-lg cursor-pointer border border-gray-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800"
                />
            </div>
            <input
                type="text"
                placeholder="Color Name (e.g. Navy)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={inputClass}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
            />
          </div>
          <button
            type="button"
            onClick={handleAddColor}
            disabled={addColorMutation.isPending}
            className="h-[40px] px-6 bg-black dark:bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0 flex items-center justify-center gap-2"
          >
            {addColorMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : "Save Color"}
          </button>
        </div>
      )}

      {/* --- Swatches Grid --- */}
      <div className="flex flex-wrap gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="h-14 w-14 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))
        ) : (
          colors.map((color) => {
            const isSelected = selectedColor === color.name;
            // Calculate contrast for checkmark
            const hex = color.hexCode.replace("#", "");
            const isDark = parseInt(hex, 16) < 0xffffff / 2;
            // 🧠 LOGIC: Check if color is white for border styling
            const isWhite = hex.toLowerCase() === "ffffff" || hex.toLowerCase() === "fff";

            return (
              <div
                key={color.id}
                onClick={() => onChange(isSelected ? "" : color.name)}
                // Updated outer container styles for better Dark Mode contrast
                className={`
                  group cursor-pointer relative flex flex-col items-center justify-center gap-2 p-2 rounded-xl border transition-all duration-200 w-20
                  ${isSelected 
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900" 
                    : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-sm"
                  }
                `}
              >
                {/* Inner Circle */}
                <div
                  // 🧠 LOGIC: Conditional Border based on isWhite
                  className={`
                    w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-all
                    ${isWhite 
                        ? "border-2 border-gray-300 dark:border-slate-600" // Strong border for white
                        : "border border-gray-200 dark:border-slate-700/50" // Subtle border for others
                    }
                  `}
                  style={{ backgroundColor: color.hexCode }}
                >
                  {isSelected && <Check size={14} className={isDark ? "text-white" : "text-black"} strokeWidth={3} />}
                </div>
                <span className={`text-[10px] font-medium truncate w-full text-center ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-500 dark:text-slate-400"}`}>
                  {color.name}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}