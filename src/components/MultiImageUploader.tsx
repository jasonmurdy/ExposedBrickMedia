import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, GitMerge, Sparkles, Check, Sliders } from 'lucide-react';
import { processAndUploadGallery } from '../lib/uploadHelpers';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface MultiImageUploaderProps {
  listingId: string;
  onUploadComplete: (newUrls: string[]) => void;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ listingId, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'standard' | 'hdr_merge'>('standard');
  const [hdrPreset, setHdrPreset] = useState<'natural_bright' | 'window_pull_balanced' | 'high_contrast_interior' | 'luxury_twilight'>('natural_bright');
  const [bracketSize, setBracketSize] = useState<3 | 5>(3);
  const [currentStepText, setCurrentStepText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const filesArray = Array.from(e.target.files);
    setIsUploading(true);
    setProgress(0);
    
    try {
      if (mode === 'standard') {
        setCurrentStepText('Optimizing and uploading WebP images...');
        const urls = await processAndUploadGallery(filesArray, listingId, (p) => setProgress(p));
        onUploadComplete(urls);
        toast.success(`Uploaded ${urls.length} images!`);
      } else {
        // HDR Merge Mode
        setCurrentStepText('Grouping bracket exposures...');
        // Sort files naturally
        filesArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        const groups: File[][] = [];
        for (let i = 0; i < filesArray.length; i += bracketSize) {
          groups.push(filesArray.slice(i, i + bracketSize));
        }

        const mergedOutputUrls: string[] = [];

        for (let gIdx = 0; gIdx < groups.length; gIdx++) {
          const chunk = groups[gIdx];
          setCurrentStepText(`Fusing scene ${gIdx + 1} of ${groups.length} (${chunk.length} brackets)...`);
          setProgress(Math.round(((gIdx) / groups.length) * 100));

          if (chunk.length >= 2) {
            const base64Images = await Promise.all(chunk.map(f => fileToBase64(f)));
            const response = await axios.post('/api/process-brackets', {
              images: base64Images,
              profile: hdrPreset,
              portfolioId: listingId
            });

            if (response.data?.outputUrl) {
              mergedOutputUrls.push(response.data.outputUrl);
            }
          } else {
            // Single image fallback
            const singleUrls = await processAndUploadGallery(chunk, listingId);
            mergedOutputUrls.push(...singleUrls);
          }
        }

        setProgress(100);
        onUploadComplete(mergedOutputUrls);
        toast.success(`Successfully fused & saved ${mergedOutputUrls.length} HDR masters!`);
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error("Upload/Processing failed", error);
      toast.error("Upload/Processing failed: " + (error.response?.data?.error || error.message));
    } finally {
      setIsUploading(false);
      setCurrentStepText('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode Selection Pills */}
      <div className="flex items-center justify-between text-xs bg-white/5 border border-white/10 p-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('standard')}
            className={`px-3 py-1 text-[9px] uppercase tracking-wider font-bold transition-colors ${
              mode === 'standard'
                ? 'bg-white/20 text-white'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Direct WebP Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('hdr_merge')}
            className={`flex items-center gap-1 px-3 py-1 text-[9px] uppercase tracking-wider font-bold transition-colors ${
              mode === 'hdr_merge'
                ? 'bg-brick-copper text-charcoal shadow-sm'
                : 'text-brick-copper hover:bg-white/5'
            }`}
          >
            <GitMerge size={10} />
            <span>Auto HDR Merge ({bracketSize}-Bracket)</span>
          </button>
        </div>

        {mode === 'hdr_merge' && (
          <div className="flex items-center gap-3">
            <select
              value={bracketSize}
              onChange={e => setBracketSize(Number(e.target.value) as any)}
              className="bg-charcoal border border-white/10 text-[9px] text-white px-2 py-0.5"
            >
              <option value={3}>3-Bracket (-2, 0, +2)</option>
              <option value={5}>5-Bracket (-2..+2)</option>
            </select>

            <select
              value={hdrPreset}
              onChange={e => setHdrPreset(e.target.value as any)}
              className="bg-charcoal border border-white/10 text-[9px] text-white px-2 py-0.5"
            >
              <option value="natural_bright">Natural Bright</option>
              <option value="window_pull_balanced">Window Pull</option>
              <option value="high_contrast_interior">High Contrast</option>
              <option value="luxury_twilight">Twilight</option>
            </select>
          </div>
        )}
      </div>

      <div className="border-2 border-dashed border-white/20 p-8 text-center hover:border-brick-copper transition-colors relative bg-white/[0.01]">
        <input
          type="file"
          multiple
          accept="image/jpeg, image/png, image/webp"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brick-copper" size={32} />
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-white">
                {currentStepText || 'Processing...'}
              </p>
              <p className="text-[9px] text-white/50">{Math.round(progress)}% complete</p>
            </div>
            <div className="w-full max-w-xs bg-white/10 h-1 mt-1 overflow-hidden">
              <div className="bg-brick-copper h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-white/5 rounded-full text-brick-copper">
              {mode === 'hdr_merge' ? <GitMerge size={26} /> : <Upload size={26} />}
            </div>
            <div>
              <p className="font-bold text-sm text-white">
                {mode === 'hdr_merge'
                  ? `Drag & drop high-res ${bracketSize}-bracket exposure sets here`
                  : 'Drag & drop high-res JPEGs here'}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                {mode === 'hdr_merge'
                  ? `Mertens Exposure Fusion • Tone Preset: ${hdrPreset.replace(/_/g, ' ')}`
                  : 'Automatically optimized to high-performance WebP'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
