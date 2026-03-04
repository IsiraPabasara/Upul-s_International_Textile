'use client';

import { useState, useEffect } from 'react';

interface SizeType {
  id: string;
  name: string;
  values: string[];
}

export default function SizeTypeManager() {
  const [types, setTypes] = useState<SizeType[]>([]);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState('');
  const [newValueString, setNewValueString] = useState(''); 

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/size-types');
      if (res.ok) setTypes(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const valuesArray = newValueString.split(',').map(v => v.trim()).filter(v => v !== '');

    try {
      const res = await fetch('http://localhost:4000/api/size-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, values: valuesArray }),
      });

      if (res.ok) {
        setNewName('');
        setNewValueString('');
        fetchTypes(); 
      } else {
        alert('Failed to create');
      }
    } catch (err) {
      alert('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this size type?")) return;
    await fetch(`http://localhost:4000/api/size-types/${id}`, { method: 'DELETE' });
    fetchTypes();
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">📏 Size Type Settings</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="font-semibold mb-4 text-gray-700">Add New Size Standard</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name (e.g. Shoes UK)</label>
              <input 
                value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full p-2 border rounded" placeholder="Type Name..." required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Values (Comma separated)</label>
              <input 
                value={newValueString} onChange={e => setNewValueString(e.target.value)}
                className="w-full p-2 border rounded" placeholder="38, 39, 40, 41..." required
              />
            </div>
          </div>
          <button disabled={loading} className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
            {loading ? 'Saving...' : 'Create Size Type'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map(type => (
          <div key={type.id} className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{type.name}</h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {type.values.map(val => (
                  <span key={val} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border">{val}</span>
                ))}
              </div>
            </div>
            <button onClick={() => handleDelete(type.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}