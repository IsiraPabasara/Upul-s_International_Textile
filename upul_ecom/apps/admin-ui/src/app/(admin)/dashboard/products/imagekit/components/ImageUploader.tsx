'use client';

import { useState, useRef } from 'react';

interface UploadedImage {
  fileId: string;
  url: string;
}

interface ImageUploaderProps {
  onUploadSuccess: (images: UploadedImage[]) => void;
}

export default function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authenticator = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/imagekit/auth');
      
      if (!response.ok) throw new Error('Auth failed');
      
      const data = await response.json();
      return data; 
    } catch (error) {
      throw new Error(`Authentication request failed`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const authParams = await authenticator();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size
        if (file.size > 5000000) {
          alert('File size must be less than 5MB');
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('useUniqueFileName', 'true');
        formData.append('publicKey', authParams.publicKey);
        formData.append('signature', authParams.signature);
        formData.append('expire', authParams.expire.toString());
        formData.append('token', authParams.token);

        const response = await fetch('https://upload.imagekit.io/api/v2/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        const newImage = {
          fileId: data.fileId,
          url: data.url,
        };

        console.log("🔥 ImageKit Response:", newImage);

        const updatedList = [...uploadedFiles, newImage];
        setUploadedFiles(updatedList);
        onUploadSuccess(updatedList);
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Upload failed. Check console.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Product Images</label>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {uploading ? (
          <div className="text-blue-600 font-semibold animate-pulse">
            Uploading... Please wait...
          </div>
        ) : (
          <div className="text-gray-500">
            <span className="text-blue-600 font-semibold">Click to upload</span> or drag and drop
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mt-4">
          {uploadedFiles.map((img) => (
            <div key={img.fileId} className="relative group border rounded-lg overflow-hidden">
              <img src={img.url} alt="Uploaded" className="w-full h-24 object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}