/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitMerge, Upload, Sparkles, Check, AlertCircle, RefreshCw, 
  Download, Eye, Trash2, ArrowRight, Layers, Sliders, Zap, 
  Sun, Moon, Home, ChevronRight, Image as ImageIcon,
  CheckCircle2, Clock, Play, Plus, X, ArrowLeftRight,
  Maximize2, Share2, FolderPlus, HelpCircle, Camera
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { 
  createRawPreviewUrl, 
  isRawPhotoFile, 
  getRawFormatLabel, 
  RAW_EXTENSIONS,
  prepareBracketImageForUpload
} from '../lib/rawPhotoDecoder';

export interface BracketGroup {
  id: string;
  name: string;
  files: File[];
  previews: string[];
  exposureLabels: string[];
  rawFormats?: string[];
  isRawGroup?: boolean;
  selectedProfile: 'natural_bright' | 'high_contrast_interior' | 'window_pull_balanced' | 'luxury_twilight' | 'crisp_architectural';
  customSettings?: {
    gamma?: number;
    shadowLift?: number;
    highlightRecovery?: number;
    saturation?: number;
    contrast?: number;
    windowPullIntensity?: number;
  };
  status: 'idle' | 'processing' | 'completed' | 'error';
  result?: {
    outputUrl: string;
    thumbnailUrl: string;
    metrics: any;
    processingTimeMs: number;
  };
  error?: string;
}

export interface StoredProcessingJob {
  id: string;
  clientName?: string;
  propertyAddress?: string;
  portfolioId?: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  toneMappingProfile: 'natural_bright' | 'high_contrast_interior' | 'window_pull_balanced' | 'luxury_twilight' | 'crisp_architectural';
  bracketCount?: number;
  rawUrls?: string[];
  isRawSource?: boolean;
  rawFormatLabel?: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  metrics?: {
    dynamicRangePreserved?: string;
    windowHighlightPullRatio?: string;
    shadowNoiseReductionRatio?: string;
    outputSizeKB?: number;
  };
  dimensions?: { width: number; height: number };
  processingTimeMs?: number;
  createdAt?: any;
  updatedAt?: any;
}

interface HDRBracketPipelineProps {
  portfolioListings?: Array<{ id: string; title: string; gallery?: string[] }>;
  onPushToListing?: (listingId: string, imageUrl: string) => void;
}

const PRESET_OPTIONS = [
  {
    id: 'natural_bright',
    name: 'Natural Bright',
    tag: 'Standard',
    icon: Sun,
    desc: 'Clean daylight balance, airy interiors, neutral white point with balanced shadow lifting.',
    ideal: 'Living rooms, kitchens, standard residential'
  },
  {
    id: 'window_pull_balanced',
    name: 'Window Pull Balanced',
    tag: 'View Retention',
    icon: Maximize2,
    desc: 'Aggressive highlight compression on window openings with vivid exterior views and bright indoor ambient lift.',
    ideal: 'Waterfront, penthouses, high contrast rooms'
  },
  {
    id: 'high_contrast_interior',
    name: 'High Contrast Interior',
    tag: 'Editorial',
    icon: Layers,
    desc: 'Deep blacks, rich wood tones, dynamic micro-contrast and punchy ambient light accents.',
    ideal: 'Modern dark cabinetry, luxury estates'
  },
  {
    id: 'luxury_twilight',
    name: 'Luxury Twilight',
    tag: 'Golden Hour',
    icon: Moon,
    desc: 'Deep velvet evening skies, warm indoor halogen/LED bulb luminance, golden sunset highlights.',
    ideal: 'Dusk exteriors, fire pit patios, poolside twilight'
  },
  {
    id: 'crisp_architectural',
    name: 'Crisp Architectural',
    tag: 'Commercial',
    icon: Home,
    desc: 'Linear geometric clarity, neutral chromatic balance, ultra-sharp edge definition.',
    ideal: 'Commercial facades, modern developments'
  }
];

export const HDRBracketPipeline: React.FC<HDRBracketPipelineProps> = ({
  portfolioListings = [],
  onPushToListing
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'queue' | 'inspector' | 'presets'>('upload');
  const [bracketMode, setBracketMode] = useState<3 | 5 | 2>(3);
  const [bracketGroups, setBracketGroups] = useState<BracketGroup[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Assignment metadata
  const [targetListingId, setTargetListingId] = useState<string>('');
  const [propertyAddress, setPropertyAddress] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');

  // Global tone preset
  const [defaultProfile, setDefaultProfile] = useState<'natural_bright' | 'high_contrast_interior' | 'window_pull_balanced' | 'luxury_twilight' | 'crisp_architectural'>('natural_bright');

  // Custom tone adjustments
  const [customGamma, setCustomGamma] = useState(1.05);
  const [customShadowLift, setCustomShadowLift] = useState(0.22);
  const [customHighlightRecovery, setCustomHighlightRecovery] = useState(0.30);
  const [customWindowPull, setCustomWindowPull] = useState(0.35);
  const [customSaturation, setCustomSaturation] = useState(1.08);

  // Firestore Live Jobs Queue
  const [storedJobs, setStoredJobs] = useState<StoredProcessingJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [queueFilter, setQueueFilter] = useState<'all' | 'completed' | 'processing' | 'error'>('all');

  // Comparison Split Slider State
  const [inspectingJob, setInspectingJob] = useState<StoredProcessingJob | null>(null);
  const [inspectingGroup, setInspectingGroup] = useState<BracketGroup | null>(null);
  const [comparisonSliderPos, setComparisonSliderPos] = useState(50);
  const [activeInputBracketIdx, setActiveInputBracketIdx] = useState(1); // 0: -2EV, 1: 0EV, 2: +2EV
  const [isComparingDirect, setIsComparingDirect] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Real-time Firestore Jobs Listener
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'processing_jobs'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const jobsList: StoredProcessingJob[] = [];
        snapshot.forEach((docSnap) => {
          jobsList.push({
            id: docSnap.id,
            ...docSnap.data()
          } as StoredProcessingJob);
        });
        setStoredJobs(jobsList);
        setJobsLoading(false);
      }, (err) => {
        console.warn("[HDR Pipeline Firestore Listener]:", err);
        setJobsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore listener setup error:", e);
      setJobsLoading(false);
    }
  }, []);

  // Handle Drag & Drop / File Selection with smart auto-grouping and RAW support
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/') || isRawPhotoFile(f));
    if (fileArray.length === 0) {
      toast.error("Please upload JPEG, PNG, or RAW camera photos (.ARW, .CR2, .CR3, .NEF, .DNG, .RAF, .RW2, .ORF).");
      return;
    }

    // Sort files naturally by filename
    fileArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const groupSize = bracketMode;
    const newGroups: BracketGroup[] = [];

    // Helper to generate EV labels based on group size
    const getExposureLabels = (size: number) => {
      if (size === 3) return ['-2 EV (Highlights/Windows)', '0 EV (Ambient Midtones)', '+2 EV (Shadows/Ceilings)'];
      if (size === 5) return ['-2 EV', '-1 EV', '0 EV', '+1 EV', '+2 EV'];
      return ['-1.5 EV (Underexposed)', '+1.5 EV (Overexposed)'];
    };

    toast.loading(`Extracting previews from ${fileArray.length} photos...`, { id: 'raw-extract-toast' });

    try {
      for (let i = 0; i < fileArray.length; i += groupSize) {
        const chunk = fileArray.slice(i, i + groupSize);
        const sceneIndex = Math.floor(i / groupSize) + 1;
        
        // Extract embedded previews for RAWs or standard object URLs for JPEGs
        const previewResults = await Promise.all(chunk.map(file => createRawPreviewUrl(file)));
        const groupPreviews = previewResults.map(r => r.url);
        const groupFormats = previewResults.map(r => r.format);
        const isRawGroup = previewResults.some(r => r.isRaw);

        newGroups.push({
          id: `bracket_group_${Date.now()}_${sceneIndex}`,
          name: `Scene #${sceneIndex} (${chunk.length} ${isRawGroup ? 'RAW' : 'JPEG'} Brackets)`,
          files: chunk,
          previews: groupPreviews,
          rawFormats: groupFormats,
          isRawGroup,
          exposureLabels: getExposureLabels(chunk.length),
          selectedProfile: defaultProfile,
          customSettings: {
            gamma: customGamma,
            shadowLift: customShadowLift,
            highlightRecovery: customHighlightRecovery,
            saturation: customSaturation,
            windowPullIntensity: customWindowPull
          },
          status: 'idle'
        });
      }

      setBracketGroups(prev => [...prev, ...newGroups]);
      toast.success(`Grouped ${fileArray.length} photos into ${newGroups.length} bracket sets!`, { id: 'raw-extract-toast' });
    } catch (err) {
      console.error("Error organizing brackets:", err);
      toast.error("Failed to load some bracket files.", { id: 'raw-extract-toast' });
    }
  };

  // Universal download helper (handles base64 data URLs, Blobs, and cross-origin object URLs)
  const handleDownload = async (imageUrl: string | undefined, filename: string = 'HDR_Enhanced_Master.jpg') => {
    if (!imageUrl) {
      toast.error("No image available to download.");
      return;
    }

    try {
      if (imageUrl.startsWith('data:')) {
        const parts = imageUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const byteString = atob(parts[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([uint8Array], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        toast.success(`Downloaded ${filename}!`);
        return;
      }

      // If remote URL or blob URL
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      toast.success(`Downloaded ${filename}!`);
    } catch (err) {
      console.warn("Direct blob download fallback:", err);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Opening ${filename} download...`);
    }
  };

  // Convert File to Base64 data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Process a single bracket group
  const processSingleGroup = async (group: BracketGroup) => {
    const groupId = group.id;

    // Set group status to processing
    setBracketGroups(prev => prev.map(g => g.id === groupId ? { ...g, status: 'processing', error: undefined } : g));

    try {
      // 1. Prepare and optimize bracket images (extracting RAW stream or normalizing high-res images to prevent 413 errors)
      const base64Images = await Promise.all(group.files.map(f => prepareBracketImageForUpload(f)));

      // 2. Prepare jobId and Firestore doc
      const jobId = `hdr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const jobDocRef = doc(db, 'processing_jobs', jobId);

      const rawFormatLabel = group.rawFormats && group.rawFormats.length > 0 ? group.rawFormats[0] : (group.isRawGroup ? 'Camera RAW' : 'Standard JPEG/PNG');

      try {
        await setDoc(jobDocRef, {
          clientName: clientName || 'Owner Shoot',
          propertyAddress: propertyAddress || (targetListingId ? portfolioListings.find(p => p.id === targetListingId)?.title : 'HDR Shoot'),
          portfolioId: targetListingId || '',
          status: 'processing',
          toneMappingProfile: group.selectedProfile,
          bracketCount: group.files.length,
          isRawSource: !!group.isRawGroup,
          rawFormatLabel,
          rawUrls: group.previews.slice(0, 5),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (firestoreErr) {
        console.warn("Firestore initial job write note:", firestoreErr);
      }

      // 3. Call backend exposure fusion engine
      const response = await axios.post('/api/process-brackets', {
        jobId,
        images: base64Images,
        profile: group.selectedProfile,
        customSettings: group.customSettings || {
          gamma: customGamma,
          shadowLift: customShadowLift,
          highlightRecovery: customHighlightRecovery,
          saturation: customSaturation,
          windowPullIntensity: customWindowPull
        },
        clientName,
        propertyAddress,
        portfolioId: targetListingId
      });

      const { outputUrl, thumbnailUrl, metrics, processingTimeMs } = response.data;

      // Update Firestore job document asynchronously
      try {
        await updateDoc(jobDocRef, {
          status: 'completed',
          thumbnailUrl: thumbnailUrl || '',
          processingTimeMs: processingTimeMs || 0,
          bracketCount: group.files.length,
          metrics: metrics || {},
          updatedAt: serverTimestamp()
        });
      } catch (firestoreUpdateErr) {
        console.warn("Client Firestore update note:", firestoreUpdateErr);
      }

      // Update group in local state
      setBracketGroups(prev => prev.map(g => g.id === groupId ? {
        ...g,
        status: 'completed',
        result: {
          outputUrl,
          thumbnailUrl,
          metrics,
          processingTimeMs
        }
      } : g));

      toast.success(`${group.name} fused & tone-mapped in ${processingTimeMs}ms!`);

      // If user specified target listing, offer 1-click push
      if (targetListingId && onPushToListing && outputUrl) {
        onPushToListing(targetListingId, outputUrl);
      }
    } catch (err: any) {
      console.error("Processing failed for group:", err);
      const errMsg = err.response?.data?.error || err.message || "Failed to fuse brackets";
      setBracketGroups(prev => prev.map(g => g.id === groupId ? { ...g, status: 'error', error: errMsg } : g));
      toast.error(`Error processing ${group.name}: ${errMsg}`);
    }
  };

  // Batch process all idle / pending bracket groups
  const processAllGroups = async () => {
    const pending = bracketGroups.filter(g => g.status === 'idle' || g.status === 'error');
    if (pending.length === 0) {
      toast("No pending bracket sets to process.");
      return;
    }

    setIsBatchProcessing(true);
    setBatchProgress(0);

    let completed = 0;
    for (const group of pending) {
      await processSingleGroup(group);
      completed++;
      setBatchProgress(Math.round((completed / pending.length) * 100));
    }

    setIsBatchProcessing(false);
    toast.success(`Completed processing all ${completed} bracket sets!`);
  };

  // Delete stored job from Firestore
  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteDoc(doc(db, 'processing_jobs', jobId));
      toast.success("Job record deleted.");
      if (inspectingJob?.id === jobId) {
        setInspectingJob(null);
      }
    } catch (e: any) {
      toast.error("Failed to delete job: " + e.message);
    }
  };

  // 1-Click push completed HDR master to listing gallery
  const handlePushJobToListing = async (job: StoredProcessingJob, listingId: string) => {
    if (!job.outputUrl) return;
    if (onPushToListing) {
      onPushToListing(listingId, job.outputUrl);
      toast.success("Added HDR Master image to Listing Gallery!");
    } else {
      toast.success("Image URL ready for Listing assignment!");
    }
  };

  // Split Comparison Slider Drag Handle
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    setComparisonSliderPos((clamped / rect.width) * 100);
  };

  // Filtered jobs in queue tab
  const filteredJobs = useMemo(() => {
    if (queueFilter === 'all') return storedJobs;
    return storedJobs.filter(j => j.status === queueFilter);
  }, [storedJobs, queueFilter]);

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brick-copper/20 via-white/5 to-transparent border border-brick-copper/30 p-8 rounded-none relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-brick-copper/5 pointer-events-none blur-3xl" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brick-copper text-charcoal rounded-none">
                <GitMerge size={22} className="stroke-[2.5]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-brick-copper">
                Real Estate Photography Operations
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-normal text-white">
              Automated HDR Bracket Processing Pipeline
            </h1>
            <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
              High-speed exposure fusion & multi-scale Mertens tone-mapping. Merges -2 EV, 0 EV, and +2 EV bracket bursts into crisp, vibrant architectural masters with natural window pulls and noise-free shadow lift.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">
                Engine Online (Sharp / Cloud Run)
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border ${
              activeSubTab === 'upload'
                ? 'bg-brick-copper text-charcoal border-brick-copper shadow-lg'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-white/10'
            }`}
          >
            <Upload size={13} />
            <span>1. Batch Bracket Uploader ({bracketGroups.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('queue')}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border ${
              activeSubTab === 'queue'
                ? 'bg-brick-copper text-charcoal border-brick-copper shadow-lg'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-white/10'
            }`}
          >
            <Clock size={13} />
            <span>2. Live Jobs Queue & Masters ({storedJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('inspector')}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border ${
              activeSubTab === 'inspector'
                ? 'bg-brick-copper text-charcoal border-brick-copper shadow-lg'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-white/10'
            }`}
          >
            <ArrowLeftRight size={13} />
            <span>3. Split Before & After Inspector</span>
          </button>

          <button
            onClick={() => setActiveSubTab('presets')}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border ${
              activeSubTab === 'presets'
                ? 'bg-brick-copper text-charcoal border-brick-copper shadow-lg'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-white/10'
            }`}
          >
            <Sliders size={13} />
            <span>4. Tone Mapping Presets</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: BATCH UPLOAD & BRACKET AUTO-GROUPER */}
      {activeSubTab === 'upload' && (
        <div className="space-y-8">
          {/* Controls Bar: Grouping Mode & Target Listing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/[0.02] border border-white/10 p-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block">
                Bracket Grouping Mode
              </label>
              <div className="flex items-center gap-2">
                {[
                  { value: 3, label: '3-Bracket Set (-2, 0, +2 EV)' },
                  { value: 5, label: '5-Bracket Set (-2..+2 EV)' },
                  { value: 2, label: '2-Bracket Set' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setBracketMode(opt.value as any)}
                    className={`px-3 py-2 text-[10px] uppercase tracking-wider font-bold border transition-all ${
                      bracketMode === opt.value
                        ? 'bg-brick-copper/20 border-brick-copper text-brick-copper'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block">
                Default Tone Preset
              </label>
              <select
                value={defaultProfile}
                onChange={e => setDefaultProfile(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-brick-copper transition-colors"
              >
                {PRESET_OPTIONS.map(p => (
                  <option key={p.id} value={p.id} className="bg-charcoal text-white">
                    {p.name} ({p.tag})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block">
                Auto-Assign to Listing
              </label>
              <select
                value={targetListingId}
                onChange={e => setTargetListingId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-brick-copper transition-colors"
              >
                <option value="" className="bg-charcoal text-white/50">-- Do not auto-assign (Standalone HDR) --</option>
                {portfolioListings.map(listing => (
                  <option key={listing.id} value={listing.id} className="bg-charcoal text-white">
                    {listing.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag & Drop Multi-Bracket Uploader */}
          <div className="border-2 border-dashed border-white/20 hover:border-brick-copper transition-colors p-10 text-center relative group bg-white/[0.01]">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,.arw,.srf,.sr2,.cr2,.cr3,.crw,.nef,.nrw,.dng,.raf,.rw2,.orf,.pef,.3fr,.fff,.iiq,image/*"
              onChange={e => handleFilesSelected(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-brick-copper group-hover:scale-110 transition-transform">
                <Camera size={26} />
              </div>
              <h3 className="text-base font-serif font-normal text-white">
                Drag & Drop RAW Camera Brackets or JPEGs Here
              </h3>
              <p className="text-xs text-white/50 max-w-lg">
                Directly upload native camera RAW files or JPEGs. The pipeline automatically decodes sensor data, organizes consecutive {bracketMode}-bracket sets, and performs high-dynamic-range Mertens exposure fusion.
              </p>
              
              {/* RAW Format Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2 max-w-xl">
                <span className="text-[9px] uppercase tracking-wider bg-brick-copper/20 text-brick-copper px-2.5 py-1 font-bold border border-brick-copper/30">
                  Sony (.ARW)
                </span>
                <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/80 px-2.5 py-1 font-medium border border-white/10">
                  Canon (.CR2 / .CR3)
                </span>
                <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/80 px-2.5 py-1 font-medium border border-white/10">
                  Nikon (.NEF)
                </span>
                <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/80 px-2.5 py-1 font-medium border border-white/10">
                  Adobe (.DNG)
                </span>
                <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/80 px-2.5 py-1 font-medium border border-white/10">
                  Fuji (.RAF)
                </span>
                <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/80 px-2.5 py-1 font-medium border border-white/10">
                  Lumix (.RW2)
                </span>
                <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/80 px-2.5 py-1 font-medium border border-white/10">
                  Olympus (.ORF)
                </span>
                <span className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-1 font-bold border border-emerald-500/30">
                  JPEG / PNG / WebP
                </span>
              </div>
            </div>
          </div>

          {/* Grouped Bracket Sets Grid */}
          {bracketGroups.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif text-white">
                    Loaded Bracket Sets ({bracketGroups.length} Scenes)
                  </h3>
                  <p className="text-xs text-white/50">
                    Review bracket exposures, extracted RAW previews, and presets before launching the fusion pipeline.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBracketGroups([])}
                    className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-white/50 hover:text-red-400 hover:bg-white/5 border border-white/10 transition-all"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={processAllGroups}
                    disabled={isBatchProcessing}
                    className={`flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-extrabold transition-all border ${
                      isBatchProcessing
                        ? 'bg-white/20 border-white/20 text-white cursor-not-allowed'
                        : 'bg-brick-copper border-brick-copper text-charcoal hover:bg-white hover:border-white shadow-xl'
                    }`}
                  >
                    {isBatchProcessing ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Processing All Sets ({batchProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} className="fill-current" />
                        <span>Batch Process All ({bracketGroups.length} Scenes)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Grid of Bracket Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bracketGroups.map((group, gIdx) => (
                  <div 
                    key={group.id}
                    className={`border p-5 space-y-4 transition-all ${
                      group.status === 'completed'
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : group.status === 'processing'
                        ? 'bg-brick-copper/10 border-brick-copper/40 animate-pulse'
                        : group.status === 'error'
                        ? 'bg-red-950/20 border-red-500/30'
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {group.name}
                        </span>
                        {group.isRawGroup && (
                          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-brick-copper/20 text-brick-copper border border-brick-copper/30 px-2 py-0.5 flex items-center gap-1">
                            <Camera size={10} />
                            <span>RAW Burst</span>
                          </span>
                        )}
                        {group.status === 'completed' && (
                          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5">
                            Fused ({group.result?.processingTimeMs}ms)
                          </span>
                        )}
                        {group.status === 'processing' && (
                          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-brick-copper/20 text-brick-copper border border-brick-copper/30 px-2 py-0.5">
                            Fusing Brackets...
                          </span>
                        )}
                        {group.status === 'error' && (
                          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5">
                            Failed
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setBracketGroups(prev => prev.filter(g => g.id !== group.id))}
                        className="text-white/30 hover:text-red-400 p-1 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Bracket Exposures Thumbnails Row */}
                    <div className="grid grid-cols-3 gap-2">
                      {group.previews.map((previewUrl, pIdx) => (
                        <div key={pIdx} className="relative aspect-[4/3] bg-black/40 border border-white/10 overflow-hidden group/img">
                          <img
                            src={previewUrl}
                            alt={`Bracket ${pIdx}`}
                            className="w-full h-full object-cover"
                          />
                          {group.rawFormats && group.rawFormats[pIdx] && (
                            <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 text-[7px] uppercase tracking-wider font-bold text-brick-copper border border-white/10 truncate max-w-[90%]">
                              {group.rawFormats[pIdx].split('(')[1]?.replace(')', '') || 'RAW'}
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm px-1.5 py-1 text-[8px] font-mono text-center text-white/80 truncate">
                            {group.exposureLabels[pIdx] || `EV ${pIdx}`}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fused Master Preview & Download Banner when Completed */}
                    {group.status === 'completed' && group.result?.outputUrl && (
                      <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-11 bg-black border border-emerald-500/50 overflow-hidden shrink-0 relative">
                            <img
                              src={group.result.thumbnailUrl || group.result.outputUrl}
                              alt="Fused Master"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-[6px] text-charcoal font-black text-center py-0.2 uppercase">
                              HDR
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                                4K Master Ready
                              </span>
                              <span className="text-[9px] text-white/60">
                                {group.result.processingTimeMs}ms
                              </span>
                            </div>
                            <p className="text-[9px] text-white/50">
                              {group.result.metrics?.dynamicRangePreserved || '6.0 EV Stops'} • {group.result.metrics?.windowHighlightPullRatio || '45%'} Window Pull
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(group.result?.outputUrl, `${group.name.replace(/\s+/g, '_')}_HDR_4K.jpg`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-black bg-emerald-400 hover:bg-emerald-300 text-charcoal shadow-md transition-all shrink-0"
                          >
                            <Download size={11} className="stroke-[3]" />
                            <span>Download 4K JPEG</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Preset Selector & Action Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-widest text-white/40">Preset:</span>
                        <select
                          value={group.selectedProfile}
                          onChange={e => {
                            const val = e.target.value as any;
                            setBracketGroups(prev => prev.map(g => g.id === group.id ? { ...g, selectedProfile: val } : g));
                          }}
                          className="bg-white/5 border border-white/10 text-[10px] text-white px-2 py-1 outline-none focus:border-brick-copper"
                        >
                          {PRESET_OPTIONS.map(p => (
                            <option key={p.id} value={p.id} className="bg-charcoal text-white">
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {group.result?.outputUrl && (
                          <>
                            <button
                              onClick={() => {
                                setInspectingGroup(group);
                                setActiveSubTab('inspector');
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
                            >
                              <Eye size={11} />
                              <span>Inspect</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => processSingleGroup(group)}
                          disabled={group.status === 'processing'}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold bg-brick-copper hover:bg-white text-charcoal transition-colors"
                        >
                          <Zap size={11} />
                          <span>{group.status === 'completed' ? 'Re-Fuse' : 'Fuse Scene'}</span>
                        </button>
                      </div>
                    </div>

                    {group.error && (
                      <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-[10px] text-red-300">
                        {group.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: LIVE JOBS QUEUE & HISTORIC MASTERS */}
      {activeSubTab === 'queue' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-serif text-white">
                HDR Processing Jobs & Cloud Archive ({storedJobs.length})
              </h3>
              <p className="text-xs text-white/50">
                Live stream of automated bracket merges from Firestore.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2">
              {(['all', 'completed', 'processing', 'error'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setQueueFilter(f)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold border transition-all ${
                    queueFilter === f
                      ? 'bg-brick-copper text-charcoal border-brick-copper'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {jobsLoading ? (
            <div className="p-16 text-center text-white/40 space-y-3">
              <RefreshCw size={24} className="animate-spin mx-auto text-brick-copper" />
              <p className="text-xs uppercase tracking-widest">Connecting to Firestore Queue...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-16 text-center border border-white/10 bg-white/[0.01] space-y-3">
              <ImageIcon size={32} className="mx-auto text-white/20" />
              <h4 className="text-sm font-bold text-white">No HDR Jobs In Queue</h4>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Upload bracket exposures in the Uploader tab to start automated batch processing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white/[0.02] border border-white/10 p-5 space-y-4 hover:border-brick-copper/40 transition-colors"
                >
                  {/* Master preview */}
                  <div className="relative aspect-[16/10] bg-black/60 border border-white/10 overflow-hidden group">
                    {job.outputUrl || job.thumbnailUrl ? (
                      <img
                        src={job.thumbnailUrl || job.outputUrl}
                        alt="HDR Master"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <ImageIcon size={28} />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`text-[8px] uppercase tracking-widest font-extrabold px-2 py-1 ${
                        job.status === 'completed'
                          ? 'bg-emerald-500 text-charcoal'
                          : job.status === 'processing'
                          ? 'bg-amber-400 text-charcoal animate-pulse'
                          : 'bg-red-500 text-white'
                      }`}>
                        {job.status}
                      </span>
                    </div>

                    {/* Metrics Overlay on hover */}
                    {job.metrics && (
                      <div className="absolute inset-0 bg-charcoal/90 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between text-xs">
                        <div className="space-y-1.5">
                          <p className="text-[9px] uppercase tracking-widest text-brick-copper font-bold">
                            Tone Fusion Metrics
                          </p>
                          <p className="text-white/80">Dynamic Range: <strong className="text-white">{job.metrics.dynamicRangePreserved}</strong></p>
                          <p className="text-white/80">Window Pull: <strong className="text-white">{job.metrics.windowHighlightPullRatio}</strong></p>
                          <p className="text-white/80">Shadow Lift: <strong className="text-white">{job.metrics.shadowNoiseReductionRatio}</strong></p>
                          {job.processingTimeMs && (
                            <p className="text-white/80">Speed: <strong className="text-white">{job.processingTimeMs}ms</strong></p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setInspectingJob(job);
                            setActiveSubTab('inspector');
                          }}
                          className="w-full py-1.5 bg-brick-copper text-charcoal text-[9px] uppercase tracking-widest font-bold text-center hover:bg-white transition-colors"
                        >
                          Open in Split Inspector
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-white truncate">
                        {job.propertyAddress || job.clientName || 'HDR Real Estate Shoot'}
                      </h4>
                      {job.isRawSource && (
                        <span className="text-[8px] uppercase tracking-wider font-extrabold bg-brick-copper/20 text-brick-copper px-1.5 py-0.5 border border-brick-copper/30 flex items-center gap-1 shrink-0">
                          <Camera size={9} />
                          <span>RAW</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/50">
                      Profile: <span className="text-brick-copper font-medium capitalize">{job.toneMappingProfile.replace(/_/g, ' ')}</span> • {job.bracketCount || 3} Brackets {job.rawFormatLabel ? `(${job.rawFormatLabel})` : ''}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      {(job.outputUrl || job.thumbnailUrl) && (
                        <button
                          onClick={() => handleDownload(job.outputUrl || job.thumbnailUrl, `HDR_${(job.propertyAddress || job.id).replace(/[^a-zA-Z0-9]/g, '_')}.jpg`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-brick-copper hover:bg-white text-charcoal text-[9px] uppercase tracking-wider font-extrabold transition-colors shadow-sm"
                          title="Download HDR JPG"
                        >
                          <Download size={11} className="stroke-[2.5]" />
                          <span>Download</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setInspectingJob(job);
                          setActiveSubTab('inspector');
                        }}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        title="Open in Inspector"
                      >
                        <Eye size={12} />
                      </button>

                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {portfolioListings.length > 0 && (job.outputUrl || job.thumbnailUrl) && (
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            handlePushJobToListing(job, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="bg-white/5 border border-white/10 text-[9px] uppercase tracking-wider text-brick-copper px-2 py-1.5 outline-none hover:bg-white/10"
                      >
                        <option value="" disabled className="bg-charcoal text-white/40">+ Send to Listing...</option>
                        {portfolioListings.map(l => (
                          <option key={l.id} value={l.id} className="bg-charcoal text-white">
                            {l.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: INTERACTIVE BEFORE & AFTER COMPARISON SLIDER */}
      {activeSubTab === 'inspector' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-serif text-white">
                HDR Before & After Exposure Inspector
              </h3>
              <p className="text-xs text-white/50">
                Drag the center divider to compare individual bracket exposures against the tone-mapped master.
              </p>
            </div>

            {/* Input bracket switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Compare Against:</span>
              {[
                { idx: 0, label: '-2 EV (Underexposed/Window)' },
                { idx: 1, label: '0 EV (Base Ambient)' },
                { idx: 2, label: '+2 EV (Overexposed/Shadow)' }
              ].map(item => (
                <button
                  key={item.idx}
                  onClick={() => setActiveInputBracketIdx(item.idx)}
                  className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold border transition-all ${
                    activeInputBracketIdx === item.idx
                      ? 'bg-brick-copper text-charcoal border-brick-copper'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* The Split Screen Slider Canvas */}
          {(() => {
            // Determine the left image (input bracket) and right image (fused output)
            const outputImage = inspectingJob?.outputUrl || inspectingJob?.thumbnailUrl || inspectingGroup?.result?.outputUrl || inspectingGroup?.result?.thumbnailUrl || storedJobs.find(j => j.outputUrl || j.thumbnailUrl)?.outputUrl || storedJobs.find(j => j.outputUrl || j.thumbnailUrl)?.thumbnailUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';
            
            const inputImage = inspectingGroup?.previews[activeInputBracketIdx] || inspectingJob?.rawUrls?.[activeInputBracketIdx] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80';

            const activeTitle = inspectingJob?.propertyAddress || inspectingGroup?.name || 'HDR Scene';

            return (
              <div className="space-y-4">
                {/* Inspector Top Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.03] border border-white/10 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Inspecting: <span className="text-brick-copper">{activeTitle}</span>
                    </span>
                    {(inspectingJob?.isRawSource || inspectingGroup?.isRawGroup) && (
                      <span className="text-[8px] uppercase tracking-wider font-extrabold bg-brick-copper/20 text-brick-copper px-1.5 py-0.5 border border-brick-copper/30 flex items-center gap-1">
                        <Camera size={9} />
                        <span>RAW</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleDownload(outputImage, `${activeTitle.replace(/\s+/g, '_')}_HDR_Master.jpg`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-charcoal text-[9px] uppercase tracking-wider font-black shadow-md transition-colors"
                    >
                      <Download size={12} className="stroke-[3]" />
                      <span>Download Fused HDR (4K)</span>
                    </button>

                    <button
                      onClick={() => handleDownload(inputImage, `${activeTitle.replace(/\s+/g, '_')}_Bracket_EV${activeInputBracketIdx}.jpg`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[9px] uppercase tracking-wider font-bold border border-white/10 transition-colors"
                    >
                      <Download size={11} />
                      <span>Download Input Bracket</span>
                    </button>

                    <button
                      onClick={() => setActiveSubTab('upload')}
                      className="px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold text-white/60 hover:text-white transition-colors"
                    >
                      Back to Uploader
                    </button>
                  </div>
                </div>

                <div
                  ref={sliderRef}
                  onMouseMove={e => e.buttons === 1 && handleSliderMove(e.clientX)}
                  onTouchMove={e => handleSliderMove(e.touches[0].clientX)}
                  className="relative aspect-[16/10] w-full bg-black border border-white/10 overflow-hidden select-none cursor-ew-resize group"
                >
                  {/* Right side: Finished HDR Master */}
                  <img
                    src={outputImage}
                    alt="Finished Tone-Mapped HDR"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />

                  {/* Left side: Input Bracket (clipped by slider) */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ width: `${comparisonSliderPos}%` }}
                  >
                    <img
                      src={inputImage}
                      alt="Input Raw Bracket"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{ width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : '100%' }}
                    />
                  </div>

                  {/* Divider Line & Handle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-brick-copper shadow-[0_0_10px_rgba(203,109,81,0.8)] pointer-events-none"
                    style={{ left: `${comparisonSliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brick-copper text-charcoal flex items-center justify-center shadow-2xl">
                      <ArrowLeftRight size={14} className="stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Labels on top corners */}
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 text-[9px] uppercase tracking-widest font-extrabold text-white/80 border border-white/10 pointer-events-none flex items-center gap-1.5">
                    {(inspectingGroup?.isRawGroup || inspectingJob?.isRawSource) && <Camera size={11} className="text-brick-copper" />}
                    <span>
                      {inspectingGroup?.isRawGroup || inspectingJob?.isRawSource ? 'RAW Bracket' : 'Bracket'} ({activeInputBracketIdx === 0 ? '-2 EV' : activeInputBracketIdx === 1 ? '0 EV' : '+2 EV'})
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-brick-copper text-charcoal px-3 py-1.5 text-[9px] uppercase tracking-widest font-black shadow-lg pointer-events-none flex items-center gap-1.5">
                    <Sparkles size={11} />
                    <span>Fused & Tone-Mapped HDR</span>
                  </div>
                </div>

                {/* Slider bar control under canvas */}
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/10 p-4">
                  <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
                    Split Position: {Math.round(comparisonSliderPos)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={comparisonSliderPos}
                    onChange={e => setComparisonSliderPos(Number(e.target.value))}
                    className="flex-1 accent-brick-copper cursor-pointer"
                  />
                  <button
                    onClick={() => setComparisonSliderPos(50)}
                    className="px-3 py-1 text-[9px] uppercase tracking-wider font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  >
                    Center (50%)
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 4: TONE MAPPING PRESETS & CALIBRATION */}
      {activeSubTab === 'presets' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-serif text-white">
              Tone Mapping Profiles & Calibration
            </h3>
            <p className="text-xs text-white/50">
              Customize Mertens exposure weightings, window pull compression, shadow lift, and saturation curves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRESET_OPTIONS.map(preset => {
              const Icon = preset.icon;
              const isSelected = defaultProfile === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => setDefaultProfile(preset.id as any)}
                  className={`border p-6 space-y-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brick-copper/10 border-brick-copper shadow-lg'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-white/5 text-brick-copper">
                      <Icon size={20} />
                    </div>
                    <span className="text-[8px] uppercase tracking-widest font-extrabold bg-white/10 px-2 py-0.5 text-white/70">
                      {preset.tag}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {preset.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 text-[10px] text-white/40">
                    <strong>Ideal for:</strong> {preset.ideal}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fine Tuning Sliders Card */}
          <div className="bg-white/[0.02] border border-white/10 p-6 space-y-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Fine-Tuning Engine Calibration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Window Pull Highlight Compression</span>
                  <span className="text-brick-copper font-mono font-bold">{Math.round(customWindowPull * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={customWindowPull}
                  onChange={e => setCustomWindowPull(Number(e.target.value))}
                  className="w-full accent-brick-copper cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Shadow Lift (Ceilings / Dark Wood)</span>
                  <span className="text-brick-copper font-mono font-bold">{Math.round(customShadowLift * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.02"
                  value={customShadowLift}
                  onChange={e => setCustomShadowLift(Number(e.target.value))}
                  className="w-full accent-brick-copper cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Gamma Curve</span>
                  <span className="text-brick-copper font-mono font-bold">{customGamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.02"
                  value={customGamma}
                  onChange={e => setCustomGamma(Number(e.target.value))}
                  className="w-full accent-brick-copper cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Architectural Saturation</span>
                  <span className="text-brick-copper font-mono font-bold">{customSaturation.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.9"
                  max="1.4"
                  step="0.02"
                  value={customSaturation}
                  onChange={e => setCustomSaturation(Number(e.target.value))}
                  className="w-full accent-brick-copper cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
