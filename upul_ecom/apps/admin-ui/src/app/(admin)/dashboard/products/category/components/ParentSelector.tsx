'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
}

interface ParentSelectorProps {
  onSelectionChange: (lastValidId: string | null) => void;
  refreshTrigger: number; // <--- NEW PROP: Listens for changes
}

export default function ParentSelector({ onSelectionChange, refreshTrigger }: ParentSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [levelOptions, setLevelOptions] = useState<Category[][]>([]);

  // 1. FETCH HELPER
  const fetchCategories = async (parentId: string | null) => {
    const url = parentId 
      ? `http://localhost:4000/api/categories?parentId=${parentId}`
      : `http://localhost:4000/api/categories`; 
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Fetch error", err);
      return [];
    }
  };

  // 2. RELOAD LOGIC (Runs when component loads OR refreshTrigger changes)
  useEffect(() => {
    // Reset everything on refresh to ensure data consistency
    setSelectedIds([]);
    onSelectionChange(null);
    
    // Fetch Root only
    fetchCategories(null).then(data => {
      setLevelOptions([data]); 
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]); // <--- MAGIC: Re-runs when this number changes

  // 3. HANDLER
  const handleSelect = async (levelIndex: number, selectedId: string) => {
    const newSelectedIds = selectedIds.slice(0, levelIndex);
    if (selectedId !== "") newSelectedIds.push(selectedId);
    
    setSelectedIds(newSelectedIds);
    
    // Notify parent
    const lastId = newSelectedIds.length > 0 ? newSelectedIds[newSelectedIds.length - 1] : null;
    onSelectionChange(lastId);

    // Fetch next level
    if (selectedId !== "") {
      const children = await fetchCategories(selectedId);
      // Even if children is empty, we update state to clear old dropdowns
      const newLevelOptions = levelOptions.slice(0, levelIndex + 1);
      if (children.length > 0) newLevelOptions.push(children);
      setLevelOptions(newLevelOptions);
    } else {
      setLevelOptions(levelOptions.slice(0, levelIndex + 1));
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-700">Category Hierarchy</label>
        <span className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={() => window.location.reload()}>
           {/* Fallback refresh if needed */}
        </span>
      </div>
      
      {levelOptions.map((options, index) => (
        <div key={index} className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1 ml-1">
            {index === 0 ? "Main Category (Root)" : `Sub Level ${index}`}
          </span>
          <select
            className="block w-full p-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            value={selectedIds[index] || ""}
            onChange={(e) => handleSelect(index, e.target.value)}
          >
            <option value="">-- Select --</option>
            {options.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}