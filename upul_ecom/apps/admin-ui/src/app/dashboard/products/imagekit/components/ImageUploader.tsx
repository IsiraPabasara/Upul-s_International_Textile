"use client";
import { UploadCloud } from "lucide-react";

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

export default function ImageUploader({ onFilesSelected }: ImageUploaderProps) {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onFilesSelected(newFiles);
      
      e.target.value = ""; 
    }
  };

  return (
    <div className="w-full">
      <div className="relative group">
        <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl h-32 text-center bg-gray-50 dark:bg-slate-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3">
          
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm ring-1 ring-gray-100 dark:ring-slate-700 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud size={24} className="text-blue-500" />
          </div>

          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Click to upload
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wide">
              Drag and drop images here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}