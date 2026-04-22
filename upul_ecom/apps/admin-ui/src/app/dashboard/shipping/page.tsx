'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import toast from 'react-hot-toast';
import { 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Truck,
  PackageX
} from 'lucide-react';

export default function AdminShippingPage() {
  const queryClient = useQueryClient();
  const [newCity, setNewCity] = useState({ name: '', shippingCost: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', shippingCost: '' });

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['shipping-cities'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/shipping-cities/admin/all');
      return response.data.cities;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post('/api/shipping-cities', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('City added successfully');
      setNewCity({ name: '', shippingCost: '' });
      queryClient.invalidateQueries({ queryKey: ['shipping-cities'] });
    },
    onError: () => {
      toast.error('Failed to add city');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await axiosInstance.put(`/api/shipping-cities/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('City updated successfully');
      setEditingId(null);
      setEditFormData({ name: '', shippingCost: '' });
      queryClient.invalidateQueries({ queryKey: ['shipping-cities'] });
    },
    onError: () => {
      toast.error('Failed to update city');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/api/shipping-cities/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('City deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['shipping-cities'] });
    },
    onError: () => {
      toast.error('Failed to delete city');
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Truck className="text-blue-500" size={32} />
              Shipping Zones
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Manage delivery cities and base shipping rates
            </p>
          </div>
        </div>

        {/* ADD NEW CITY CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <MapPin className="text-blue-500" size={20} />
            Add New City
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input 
                placeholder="City Name (e.g. Colombo 1)" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={newCity.name}
                onChange={(e) => setNewCity({...newCity, name: e.target.value})}
              />
            </div>
            <div className="w-full sm:w-48 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rs.</span>
              <input 
                type="number" 
                placeholder="Cost" 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={newCity.shippingCost}
                onChange={(e) => setNewCity({...newCity, shippingCost: e.target.value})}
              />
            </div>
            <button 
              onClick={() => addMutation.mutate({ ...newCity, shippingCost: Number(newCity.shippingCost) })}
              disabled={addMutation.isPending || !newCity.name || !newCity.shippingCost}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Plus size={18} strokeWidth={3} />
              {addMutation.isPending ? 'Adding...' : 'Add City'}
            </button>
          </div>
        </div>

        {/* CITY LIST TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">City Name</th>
                  <th className="px-6 py-4 font-bold">Shipping Cost</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {cities && cities.length > 0 ? (
                  cities.map((city: any) => (
                    <tr key={city.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                      
                      {/* NAME COLUMN */}
                      <td className="px-6 py-4">
                        {editingId === city.id ? (
                          <input 
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                            className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 w-full outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <MapPin size={14} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {city.name}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* COST COLUMN */}
                      <td className="px-6 py-4">
                        {editingId === city.id ? (
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rs.</span>
                            <input 
                              type="number"
                              value={editFormData.shippingCost}
                              onChange={(e) => setEditFormData({...editFormData, shippingCost: e.target.value})}
                              className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 w-full outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        ) : (
                          <span className="font-extrabold text-slate-700 dark:text-slate-200">
                            Rs. {Number(city.shippingCost).toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                          city.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                        }`}>
                          {city.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* ACTIONS COLUMN */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingId === city.id ? (
                            <>
                              <button
                                onClick={() => updateMutation.mutate({ 
                                  id: city.id, 
                                  data: { name: editFormData.name, shippingCost: Number(editFormData.shippingCost), isActive: city.isActive } 
                                })}
                                disabled={updateMutation.isPending}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} strokeWidth={3} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditFormData({ name: '', shippingCost: '' });
                                }}
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 rounded-lg transition-colors border border-gray-200 dark:border-slate-700"
                                title="Cancel"
                              >
                                <X size={16} strokeWidth={3} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(city.id);
                                  setEditFormData({ name: city.name, shippingCost: city.shippingCost });
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors"
                                title="Edit City"
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  if(window.confirm('Are you sure you want to delete this city?')) {
                                    deleteMutation.mutate(city.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete City"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <PackageX size={48} className="mb-4 opacity-20" />
                        <p className="font-medium text-slate-500">No shipping zones configured.</p>
                        <p className="text-xs mt-1">Add your first city above to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}