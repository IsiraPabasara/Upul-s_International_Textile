"use client";

import { useState } from "react";
import ParentSelector from "./components/ParentSelector";

export default function TestCategoryPage() {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // NEW: A counter to force the component to refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. ADD CATEGORY
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("http://localhost:4000/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId }),
      });
      if (!res.ok) throw new Error("Failed");

      setStatus("success");
      setName("");
      setRefreshKey((prev) => prev + 1); // <--- TRIGGER REFRESH
    } catch (err) {
      setStatus("error");
    }
  };

  // 2. DELETE CATEGORY
  const handleDelete = async () => {
    if (!parentId) return;
    if (
      !confirm(
        "Are you sure you want to delete this category? Sub-categories might be lost.",
      )
    )
      return;

    setStatus("loading");
    try {
      const res = await fetch(
        `http://localhost:4000/api/categories/${parentId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed");

      setStatus("success");
      setParentId(null); // Clear selection
      setRefreshKey((prev) => prev + 1); // <--- TRIGGER REFRESH
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🛠️ Category Manager (Live)</h1>

      <div className="bg-white p-6 shadow rounded-xl space-y-6">
        {/* --- SECTION 1: ADD NEW --- */}
        <form onSubmit={handleSubmit} className="space-y-4 border-b pb-6">
          <h2 className="font-semibold text-gray-800">Add New Category</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g. Shoes"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {status === "loading" ? "Saving..." : "Create New Category"}
          </button>
        </form>

        {/* --- SECTION 2: BROWSE & DELETE --- */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="font-semibold text-gray-800">Browse Hierarchy</h2>

            {/* DELETE BUTTON (Only shows if something is selected) */}
            {parentId && (
              <button
                onClick={handleDelete}
                className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition"
              >
                Delete Selection
              </button>
            )}
          </div>

          {/* Pass the refreshKey here */}
          <ParentSelector
            onSelectionChange={(id) => setParentId(id)}
            refreshTrigger={refreshKey}
          />
        </div>

        {/* --- DEBUG & STATUS --- */}
        <div className="text-xs text-gray-400 text-center">
          Current Selection ID: {parentId || "None"}
        </div>

        {status === "success" && (
          <p className="text-green-600 text-center text-sm">
            Operation Successful! ✅
          </p>
        )}
      </div>
    </div>
  );
}