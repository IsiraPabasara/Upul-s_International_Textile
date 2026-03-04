'use client';

import { useState, useEffect } from 'react';

interface SizeType {
  id: string;
  name: string;
  values: string[];
}

interface Variant {
  size: string;
  stock: number;
}

interface StockManagerProps {
  onUpdate: (data: { sizeType: string; variants: Variant[] }) => void;
}

export default function StockManager({ onUpdate }: StockManagerProps) {
  
  const [sizeTypes, setSizeTypes] = useState<SizeType[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedType, setSelectedType] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  
  const [currentSize, setCurrentSize] = useState('');
  const [currentStock, setCurrentStock] = useState('');

  useEffect(() => {
    const fetchSizeTypes = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/size-types');
        if (res.ok) {
          const data = await res.json();
          setSizeTypes(data);
          if (data.length > 0) {
            setSelectedType(data[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch size types", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSizeTypes();
  }, []);

  useEffect(() => {
    onUpdate({ sizeType: selectedType, variants });
  }, [variants, selectedType, onUpdate]);

  const handleAdd = () => {
    if (!currentSize || !currentStock) return;
    
    const newVariant = { size: currentSize, stock: parseInt(currentStock) };
    setVariants([...variants, newVariant]);

    setCurrentSize('');
    setCurrentStock('');
  };

  const handleRemove = (indexToRemove: number) => {
    setVariants(variants.filter((_, idx) => idx !== indexToRemove));
  };

  const getAvailableSizes = () => {
    const type = sizeTypes.find(t => t.name === selectedType);
    if (!type) return [];
    
    return type.values.filter(
      (size) => !variants.some((v) => v.size === size)
    );
  };

  const availableSizes = getAvailableSizes();

  if (loading) return <div className="text-sm text-gray-500">Loading sizes...</div>;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
          Size Type
        </label>
        {sizeTypes.length > 0 ? (
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setVariants([]); 
            }}
            className="w-full p-2 border rounded bg-white"
          >
            {sizeTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-red-500">No size types found. Please add some in settings.</p>
        )}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Select Size</label>
          <select
            value={currentSize}
            onChange={(e) => setCurrentSize(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            disabled={!selectedType}
          >
            <option value="">-- Choose --</option>
            {availableSizes.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        
        <div className="w-24">
          <label className="block text-xs text-gray-500 mb-1">Stock Qty</label>
          <input
            type="number"
            value={currentStock}
            onChange={(e) => setCurrentStock(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="0"
          />
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!currentSize || !currentStock}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {variants.length > 0 && (
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 font-medium border-b">
              <tr>
                <th className="p-3">Size</th>
                <th className="p-3">Stock</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="p-3 font-medium">{v.size}</td>
                  <td className="p-3">{v.stock}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="text-red-500 hover:text-red-700 text-xs underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-blue-50 text-blue-800 font-bold">
              <tr>
                <td className="p-3">Total Stock</td>
                <td className="p-3">
                  {variants.reduce((acc, curr) => acc + curr.stock, 0)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}