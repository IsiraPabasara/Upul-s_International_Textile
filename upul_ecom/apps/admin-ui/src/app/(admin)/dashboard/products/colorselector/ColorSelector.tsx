'use client';

import { useState, useEffect } from 'react';

interface Color {
  id: string;
  name: string;
  hexCode: string;
}

interface ColorSelectorProps {
  selectedColor: string; 
  onChange: (colorName: string) => void;
}

export default function ColorSelector({ selectedColor, onChange }: ColorSelectorProps) {
  const [colors, setColors] = useState<Color[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('#000000');

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    const res = await fetch('http://localhost:4000/api/colors');
    if (res.ok) setColors(await res.json());
  };

  const handleAddColor = async () => {
    if (!newName) return;
    const res = await fetch('http://localhost:4000/api/colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, hexCode: newHex }),
    });
    if (res.ok) {
      fetchColors();
      setIsAdding(false);
      setNewName('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">Primary Color</label>
        <button 
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs text-blue-600 hover:underline"
        >
          {isAdding ? 'Cancel' : '+ Add Color'}
        </button>
      </div>
      {isAdding && (
        <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border mb-2">
          <input 
            type="color" 
            value={newHex} 
            onChange={(e) => setNewHex(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-none"
          />
          <input 
            type="text" 
            placeholder="Name (e.g. Red)" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="text-xs p-1 border rounded w-full"
          />
          <button type="button" onClick={handleAddColor} className="bg-black text-white text-xs px-2 py-1 rounded">Save</button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = selectedColor === color.name;
          return (
            <div 
              key={color.id}
              onClick={() => onChange(isSelected ? '' : color.name)}
              className={`
                group cursor-pointer flex flex-col items-center gap-1 p-1 rounded-lg transition
                ${isSelected ? 'bg-gray-100 ring-2 ring-blue-500' : 'hover:bg-gray-50'}
              `}
            >
              <div 
                className="w-8 h-8 rounded-full border shadow-sm" 
                style={{ backgroundColor: color.hexCode }}
              />
              <span className={`text-[10px] ${isSelected ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                {color.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}