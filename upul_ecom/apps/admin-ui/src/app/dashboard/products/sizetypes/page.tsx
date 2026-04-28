'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import toast from 'react-hot-toast';
import { Ruler, Plus, Trash2, Tag, Pencil, X, Save, Loader2 } from 'lucide-react';

interface SizeType {
  id: string;
  name: string;
  values: string[];
}

export default function SizeTypeManager() {

  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newValueString, setNewValueString] = useState('');
  const [nameError, setNameError] = useState('');
  const [valuesError, setValuesError] = useState('');
  const [editingSizeType, setEditingSizeType] = useState<SizeType | null>(null);

  const { data: types = [], isLoading } = useQuery<SizeType[]>({
    queryKey: ['size-types'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/size-types', { isPublic: true });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newType: { name: string; values: string[] }) =>
      axiosInstance.post('/api/size-types', newType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-types'] });
      handleCancelEdit();
      toast.success('New size standard created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedType: { id: string; name: string; values: string[] }) =>
      axiosInstance.put(`/api/size-types/${updatedType.id}`, { name: updatedType.name, values: updatedType.values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-types'] });
      handleCancelEdit();
      toast.success('Size standard updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/size-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-types'] });
      toast.success('Size type removed');
    },
  });

  const handleEditClick = (type: SizeType) => {
    setEditingSizeType(type);
    setNewName(type.name);
    setNewValueString(type.values.join(', '));
    setNameError('');
    setValuesError('');
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingSizeType(null);
    setNewName('');
    setNewValueString('');
    setNameError('');
    setValuesError('');
  };

  const handleSubmit = (e: React.FormEvent): void => {

    e.preventDefault();
    const cleanName = newName.trim();
    
    setNameError('');
    setValuesError('');

    if (!cleanName) {
      setNameError('Standard Name is required');
      toast.error('Standard Name is required');
      return;
    }

    if (cleanName.length < 2) {
      setNameError('Standard Name must be at least 2 characters');
      toast.error('Standard Name must be at least 2 characters');
      return;
    }

    if (cleanName.length > 50) {
      setNameError('Standard Name must not exceed 50 characters');
      toast.error('Standard Name must not exceed 50 characters');
      return;
    }

    const valuesArray = newValueString
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean); 

    if (valuesArray.length === 0) {
      setValuesError('Please add at least one valid measurement');
      toast.error('Please add at least one valid measurement');
      return;
    }

    const uniqueValues = new Set(valuesArray.map((v) => v.toLowerCase()));
    if (uniqueValues.size !== valuesArray.length) {
      setValuesError('Values must be unique (no duplicates allowed)');
      toast.error('Values must be unique (no duplicates allowed)');
      return;
    }

    const isDuplicate = types.some(
      (type) => type.name.toLowerCase() === cleanName.toLowerCase() && type.id !== editingSizeType?.id
    );

    if (isDuplicate) {
      setNameError(`The standard "${cleanName}" already exists!`);
      toast.error(`The standard "${cleanName}" already exists!`);
      return;
    }

    if (editingSizeType) {
      updateMutation.mutate({ id: editingSizeType.id, name: cleanName, values: valuesArray });
    } else {
      createMutation.mutate({ name: cleanName, values: valuesArray });
    }
  };

  const handleDelete = (id: string, typeName: string) => {
    if (confirm(`Are you sure you want to delete the ${typeName} standard?`)) {
      if (editingSizeType?.id === id) {
        handleCancelEdit(); 
      }
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-sm">
          <Ruler size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Size Standards</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Define measurement scales for your products</p>
        </div>
      </div>

      <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border mb-10 transition-colors duration-300 ${editingSizeType ? 'border-amber-300 dark:border-amber-700/50 bg-amber-50/10 dark:bg-amber-900/10' : 'border-gray-100 dark:border-slate-800'}`}>
        {editingSizeType && (
          <div className="mb-6 flex items-center justify-between bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl text-sm font-bold">
            <div className="flex items-center gap-2">
              <Pencil size={18} strokeWidth={2.5} />
              <span>Editing Standard: {editingSizeType.name}</span>
            </div>
            <button onClick={handleCancelEdit} className="hover:bg-amber-200 dark:hover:bg-amber-800 p-1 rounded-lg transition-colors">
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 transition-colors ${nameError ? 'text-rose-500' : 'text-gray-400 dark:text-slate-500'}`}>
                Standard Name <span className="text-rose-500">*</span>
              </label>
              <input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (nameError) setNameError(''); 
                }}
                className={`w-full p-3 bg-transparent dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium shadow-sm ${
                  nameError
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700'
                }`}
                placeholder="e.g. UK Men's Shoes"
              />
              {nameError && (
                <p className="text-rose-500 text-xs mt-1.5 ml-1 animate-in fade-in">
                  {nameError}
                </p>
              )}
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 transition-colors ${valuesError ? 'text-rose-500' : 'text-gray-400 dark:text-slate-500'}`}>
                Values (Separated by Commas) <span className="text-rose-500">*</span>
              </label>
              <input
                value={newValueString}
                onChange={(e) => {
                  setNewValueString(e.target.value);
                  if (valuesError) setValuesError(''); 
                }}
                className={`w-full p-3 bg-transparent dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium shadow-sm ${
                  valuesError
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700'
                }`}
                placeholder="7, 8, 9, 10, 11..."
              />
              {valuesError && (
                <p className="text-rose-500 text-xs mt-1.5 ml-1 animate-in fade-in">
                  {valuesError}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || !newName.trim() || !newValueString.trim()}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 text-white px-8 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto font-bold shadow-md hover:shadow-lg active:scale-95 ${
                editingSizeType ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              }`}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                  {editingSizeType ? 'Updating...' : 'Saving...'}
                </>
              ) : editingSizeType ? (
                <>
                  <Save size={18} strokeWidth={2.5} /> Update Standard
                </>
              ) : (
                <>
                  <Plus size={18} strokeWidth={2.5} /> Create Size Type
                </>
              )}
            </button>

            {editingSizeType && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
           {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-slate-800/50 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {types.map((type) => (
            <div 
              key={type.id} 
              className={`group bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all ${
                editingSizeType?.id === type.id 
                  ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20' 
                  : 'border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-gray-400 dark:text-slate-500" />
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">{type.name}</h3>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditClick(type)}
                    className="text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all p-1.5 rounded-lg active:scale-95"
                    title="Edit"
                  >
                    <Pencil size={18} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => handleDelete(type.id, type.name)}
                    disabled={deleteMutation.isPending}
                    className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all p-1.5 rounded-lg active:scale-95 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {type.values.map((val) => (
                  <span
                    key={val}
                    className="text-[11px] font-mono font-medium bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-md text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-700 shadow-sm"
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}