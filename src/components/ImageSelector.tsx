import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { Globe, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  path: string;
  accept?: string;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({ 
  value, 
  onChange, 
  label = "Asset", 
  path,
  accept = "image/*"
}) => {
  const [mode, setMode] = useState<'url' | 'upload'>(value?.startsWith('http') && !value.includes('firebasestorage') ? 'url' : 'upload');

  return (
    <div className="space-y-3">
      {label && <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">{label}</label>}
      
      <div className="flex gap-2">
        <button 
          onClick={() => setMode('upload')}
          className={`flex-1 py-2 px-3 rounded border text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mode === 'upload' ? 'bg-brick-copper text-charcoal border-brick-copper' : 'border-white/10 text-white/40 hover:border-white/30'}`}
        >
          <Upload size={14} /> Upload
        </button>
        <button 
          onClick={() => setMode('url')}
          className={`flex-1 py-2 px-3 rounded border text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mode === 'url' ? 'bg-brick-copper text-charcoal border-brick-copper' : 'border-white/10 text-white/40 hover:border-white/30'}`}
        >
          <Globe size={14} /> URL
        </button>
      </div>

      {mode === 'upload' ? (
        <FileUpload 
          label=""
          path={path}
          accept={accept}
          onUploadComplete={onChange}
        />
      ) : (
        <div className="space-y-1">
          <input 
            className="w-full bg-transparent border border-border-subtle p-3 text-xs outline-none focus:border-brick-copper transition-colors placeholder:text-white/10 text-white"
            placeholder="https://images.unsplash.com/..."
            value={value || ""}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )}

      {value && (
        <div className="relative group aspect-video bg-charcoal border border-white/5 overflow-hidden flex items-center justify-center">
          {accept.includes('video') ? (
            <video src={value} className="max-w-full max-h-full" controls={false} />
          ) : (
            <img src={value} className="max-w-full max-h-full object-contain" alt="Preview" />
          )}
          <button 
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-charcoal/80 p-1.5 rounded-full text-white/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all border border-white/10"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
