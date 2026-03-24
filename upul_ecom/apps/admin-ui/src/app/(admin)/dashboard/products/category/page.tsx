"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCategoryItem } from "./components/SortableCategoryItem";
import { 
  ArrowLeft, 
  Home, 
  Loader2, 
  Plus, 
  Save, 
  X,
  ChevronRight,
  FolderTree,
  Network
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../../axiosInstance";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  _count?: { subCategories: number }; 
}

export default function CategoryManager() {
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Navigation
  const [path, setPath] = useState<{id: string, name: string}[]>([]); 
  const currentParentId = path.length > 0 ? path[path.length - 1].id : null;

  // Input State
  const [inputValue, setInputValue] = useState("");
  const [editingItem, setEditingItem] = useState<Category | null>(null);

  // --- 1. FETCH ---
  const { data: serverData, isLoading } = useQuery({
    queryKey: ['categories', currentParentId || 'root'],
    queryFn: async () => {
      const params = currentParentId ? { parentId: currentParentId } : { roots: 'true' };
      const config = { params: { ...params, _t: new Date().getTime() } };
      const { data } = await axiosInstance.get('/api/categories', config);
      return (data || []).sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);
    },
  });

  useEffect(() => {
    if (serverData) setCategories(serverData);
  }, [serverData]);

  // --- 2. CREATE MUTATION ---
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return axiosInstance.post('/api/categories', {
        name,
        parentId: currentParentId,
        sortOrder: categories.length
      });
    },
    onSuccess: (res) => {
      toast.success("Category added successfully");
      setInputValue("");
      if (res.data) setCategories(prev => [...prev, res.data]);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-selector'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to add category")
  });

  // --- 3. UPDATE MUTATION ✏️ ---
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string, name: string }) => {
      return axiosInstance.put(`/api/categories/${payload.id}`, { name: payload.name });
    },
    onSuccess: () => {
      toast.success("Category renamed");
      setInputValue("");
      setEditingItem(null); 
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-selector'] });
    },
    onError: () => toast.error("Failed to rename category")
  });

  // --- 4. DELETE MUTATION ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axiosInstance.delete(`/api/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-selector'] });
    },
    onError: () => toast.error("Failed to delete category")
  });

  // --- 5. REORDER MUTATION ---
  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      return axiosInstance.put('/api/categories/reorder', { items });
    },
    onError: () => {
      toast.error("Reorder failed");
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  // --- HANDLERS ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        const updates = newItems.map((item, index) => ({ id: item.id, sortOrder: index }));
        reorderMutation.mutate(updates);
        return newItems;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, name: inputValue });
    } else {
      createMutation.mutate(inputValue);
    }
  };

  const handleEditClick = (cat: Category) => {
    setEditingItem(cat);
    setInputValue(cat.name);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setInputValue("");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before dragging starts, allowing clicks on mobile!
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- RENDER ---
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Network className="text-blue-500 hidden sm:block" size={28} strokeWidth={2.5} />
            Category Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Organize your store taxonomy with drag and drop.
          </p>
        </div>
      </div>

      {/* BREADCRUMBS */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-white dark:bg-slate-900/50 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
        <button 
          onClick={() => setPath([])} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${path.length === 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
        >
          <Home size={14} strokeWidth={2.5} /> Root
        </button>
        
        {path.map((crumb, idx) => (
          <div key={crumb.id} className="flex items-center gap-2">
            <ChevronRight size={14} strokeWidth={3} className="text-gray-300 dark:text-slate-600" />
            <button 
              onClick={() => setPath(prev => prev.slice(0, idx + 1))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${idx === path.length - 1 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* MAIN CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
        
        {/* Card Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/80 dark:bg-slate-800/50 backdrop-blur-sm">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <FolderTree size={20} className={currentParentId ? "text-blue-500" : "text-gray-400"} strokeWidth={2.5} />
            {currentParentId ? path[path.length-1].name : "Root Categories"}
          </h2>
          {currentParentId && (
            <button 
              onClick={() => setPath(prev => prev.slice(0, -1))}
              className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft size={14} strokeWidth={2.5} /> Back
            </button>
          )}
        </div>

        {/* Drag & Drop List */}
        <div className="p-4 sm:p-6 min-h-[300px] bg-white dark:bg-slate-900">
          {isLoading ? (
            <div className="flex justify-center items-center h-full py-20 text-blue-500">
              <Loader2 className="animate-spin" size={32} strokeWidth={2.5} />
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-gray-50/50 dark:bg-slate-800/20">
                    <FolderTree size={48} strokeWidth={1.5} className="mb-4 opacity-20" />
                    <p className="font-bold text-gray-600 dark:text-slate-400 text-sm">No sub-categories found.</p>
                    <p className="text-xs mt-1">Use the form below to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <SortableCategoryItem 
                        key={cat.id} 
                        category={cat}
                        onDrillDown={(c) => setPath(prev => [...prev, { id: c.id, name: c.name }])}
                        onEdit={handleEditClick} 
                        onDelete={(id) => { if(confirm("Are you sure you want to delete this category?")) deleteMutation.mutate(id); }}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer: Create / Edit Form */}
        <form 
          onSubmit={handleSubmit} 
          className={`p-4 sm:p-6 border-t transition-colors duration-300 ${
            editingItem 
              ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30" 
              : "bg-gray-50/80 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={editingItem ? `Rename "${editingItem.name}"...` : `Add new category to "${currentParentId ? path[path.length-1].name : 'Root'}"...`}
              
              className={`w-full sm:flex-1 shrink-0 min-h-[48px] sm:min-h-[52px] h-[48px] sm:h-[52px] px-4 rounded-xl text-sm sm:text-base font-semibold text-gray-900 dark:text-white outline-none transition-all shadow-sm
                ${editingItem 
                  ? "bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700/50 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-amber-300 dark:placeholder:text-amber-700" 
                  : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                }`}
            />
            
            {editingItem ? (
              <div className="flex gap-2 shrink-0">
                <button 
                  type="submit"
                  disabled={updateMutation.isPending || !inputValue.trim()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] h-[48px] sm:h-[52px] px-6 sm:px-8 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
                >
                  {updateMutation.isPending ? <Loader2 size={18} strokeWidth={2.5} className="animate-spin" /> : <Save size={18} strokeWidth={2.5} />}
                  <span className="hidden sm:block">Update</span>
                </button>
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="min-h-[48px] sm:min-h-[52px] h-[48px] sm:h-[52px] w-[48px] sm:w-[52px] flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                  title="Cancel Edit"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button 
                type="submit"
                disabled={createMutation.isPending || !inputValue.trim()}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] h-[48px] sm:h-[52px] px-6 sm:px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
              >
                {createMutation.isPending ? <Loader2 size={18} strokeWidth={2.5} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
                Add Category
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}