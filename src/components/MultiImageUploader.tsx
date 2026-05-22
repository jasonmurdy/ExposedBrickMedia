import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { processAndUploadGallery } from '../lib/uploadHelpers';

interface MultiImageUploaderProps {
  listingId: string;
  onUploadComplete: (newUrls: string[]) => void;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ listingId, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const filesArray = Array.from(e.target.files);
    setIsUploading(true);
    setProgress(0);
    
    try {
      const urls = await processAndUploadGallery(filesArray, listingId, (p) => setProgress(p));
      onUploadComplete(urls);
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Upload failed", error);
      // You could add a toast notification here
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-white/20 p-8 text-center hover:border-brick-copper transition-colors relative">
      <input
        type="file"
        multiple
        accept="image/jpeg, image/png"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleFileChange}
        disabled={isUploading}
        ref={fileInputRef}
      />
      {isUploading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brick-copper" size={32} />
          <p className="text-[10px] uppercase tracking-widest">Optimizing & Uploading... {Math.round(progress)}%</p>
          <div className="w-full bg-white/10 h-1 mt-2">
            <div className="bg-brick-copper h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Upload size={32} className="text-white/40" />
          <div>
            <p className="font-bold text-sm">Drag & drop high-res JPEGs here</p>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2">Automatically optimized to WebP</p>
          </div>
        </div>
      )}
    </div>
  );
};
