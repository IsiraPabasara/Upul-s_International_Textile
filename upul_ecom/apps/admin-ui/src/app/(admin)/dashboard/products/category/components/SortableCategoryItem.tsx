import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, ChevronRight, Folder } from "lucide-react";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  _count?: { subCategories: number };
}

interface Props {
  category: Category;
  onDrillDown: (cat: Category) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}

export function SortableCategoryItem({ category, onDrillDown, onEdit, onDelete }: Props) {
  // 1. Hook into DND Kit
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  // 2. Dynamic Styles for Dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.8 : 1, // 🟢 Slightly less transparent so it looks solid
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all shadow-sm group ${
        isDragging
          ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-md scale-[1.02]"
          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
      }`}
    >
      {/* LEFT: Drag Handle & Name */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        
        {/* Drag Handle */}
        {/* 🟢 Added touch-none to prevent mobile scrolling bugs while dragging */}
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <GripVertical size={18} strokeWidth={2.5} />
        </button>
        
        {/* Drill Down Button (The Name) */}
        <button
          onClick={() => onDrillDown(category)}
          className="flex items-center gap-2.5 sm:gap-3 flex-1 text-left min-w-0 group/btn outline-none"
        >
          <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg group-hover/btn:scale-110 transition-transform shrink-0">
            <Folder size={16} strokeWidth={2.5} className="fill-current opacity-20" />
          </div>
          
          <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors">
            {category.name}
          </span>
          
          {/* Optional: Count Badge */}
          {category._count && category._count.subCategories > 0 && (
            <span className="hidden sm:flex items-center justify-center px-2 py-0.5 text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">
              {category._count.subCategories}
            </span>
          )}
        </button>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
        
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(category); }}
          className="p-2 sm:p-2.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all active:scale-95"
          title="Rename Category"
        >
          <Pencil size={16} strokeWidth={2.5} />
        </button>
        
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
          className="p-2 sm:p-2.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-95"
          title="Delete Category"
        >
          <Trash2 size={16} strokeWidth={2.5} />
        </button>
        
        {/* Visual Divider (Hidden on very small mobile screens) */}
        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
        
        {/* Arrow indicating you can go inside */}
        <button
          onClick={() => onDrillDown(category)}
          className="p-2 sm:p-2.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95 sm:group-hover:translate-x-1"
          title="View Subcategories"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
}