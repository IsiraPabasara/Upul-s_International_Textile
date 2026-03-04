'use client';

import { useState, useEffect } from 'react';

interface Brand {
  id: string;
  name: string;
}

interface BrandSelectorProps {
  selectedBrand: string;
  onChange: (brandName: string) => void;
}

export default function BrandSelector({ selectedBrand, onChange }: BrandSelectorProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch Brands on Load
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/brands');
      if (res.ok) setBrands(await res.json());
    } catch (err) {
      console.error("Failed to load brands");
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName }),
      });

      if (res.ok) {
        const newBrand = await res.json();
        setBrands([...brands, newBrand].sort((a, b) => a.name.localeCompare(b.name))); 
        onChange(newBrand.name); 
        setIsAddingNew(false);
        setNewBrandName('');
      } else {
        alert("Brand might already exist!");
      }
    } catch (err) {
      alert("Error creating brand");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Brand</label>
      
      {!isAddingNew ? (
        <div className="flex gap-2">
          <select
            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500"
            value={selectedBrand}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">-- Select Brand --</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm whitespace-nowrap"
          >
            + New
          </button>
        </div>
      ) : (
        <div className="flex gap-2 animate-fadeIn">
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
            placeholder="Enter brand name..."
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateBrand}
            disabled={loading}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setIsAddingNew(false)}
            className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}