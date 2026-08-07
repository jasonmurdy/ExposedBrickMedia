/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Puck, usePuck, createUsePuck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { createConfig, BASELINE_LAYOUT } from "../lib/puck.config";
import { useSiteContent } from "../lib/SiteContentContext";
import { db } from "../lib/firebase";
import { doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { useState, useMemo, useEffect, useRef } from "react";
import { Save, X, Loader2, RotateCcw, LayoutGrid, FileText, Check, Folder, Info, Plus, Undo2, Redo2, Upload, Terminal, AlertTriangle, Trash2, Sparkles, Image as ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { handleFirestoreError, OperationType } from "../lib/firestoreError";
import { sanitizeLayout } from "../lib/sanitizeLayout";
import html2canvas from "html2canvas";

export interface PuckTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  previewImage?: string;
  puckData: any;
  createdAt: any;
}
// Create the optimized hook outside of your component
const usePuckSelector = createUsePuck();

interface CustomHeaderProps {
  actions: React.ReactNode;
  currentPageId: string | undefined;
  setCurrentPageId: (id: string | undefined) => void;
  pages: any[];
  setIsPickerOpen: (open: boolean) => void;
  setTemplateName: (name: string) => void;
  page: any;
  setIsSaverOpen: (open: boolean) => void;
  onClose: () => void;
}

const HistoryControls = () => {
  const history = usePuckSelector((state) => state.history);
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => history.back()}
        disabled={!history.hasPast}
        type="button"
        className={`h-8 px-3.5 border transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold font-mono ${
          history.hasPast 
            ? "border-white/10 text-brick-copper hover:bg-white/5 hover:border-brick-copper/50 cursor-pointer active:scale-95" 
            : "border-white/5 opacity-30 cursor-not-allowed text-white/45"
        }`}
        title="Undo changes"
      >
        <Undo2 size={12} />
        Undo
      </button>
      <button
        onClick={() => history.forward()}
        disabled={!history.hasFuture}
        type="button"
        className={`h-8 px-3.5 border transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold font-mono ${
          history.hasFuture 
            ? "border-white/10 text-brick-copper hover:bg-white/5 hover:border-brick-copper/50 cursor-pointer active:scale-95" 
            : "border-white/5 opacity-30 cursor-not-allowed text-white/45"
        }`}
        title="Redo changes"
      >
        <Redo2 size={12} />
        Redo
      </button>
    </div>
  );
};

const CustomHeader = ({
  actions,
  currentPageId,
  setCurrentPageId,
  pages,
  setIsPickerOpen,
  setTemplateName,
  page,
  setIsSaverOpen,
  onClose
}: CustomHeaderProps) => {

  return (
    <div className="bg-[#121212] py-3.5 px-6 flex justify-between items-center z-[100] w-full text-white selection:bg-brick-copper/20">
      <div className="flex items-center gap-6">
        <h2 className="text-brick-copper font-display text-xl italic font-medium tracking-tight">Visual Layout Engine</h2>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-[#cfa073]/70 font-mono font-bold">Editing:</span>
          <div className="relative">
            <select 
              value={currentPageId || ""} 
              onChange={(e) => setCurrentPageId(e.target.value || undefined)}
              className="bg-white/5 border border-white/10 hover:border-brick-copper/55 text-[10px] uppercase tracking-widest text-white py-1 px-8 pr-12 outline-none focus:border-brick-copper transition-all font-mono appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cfa073%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat cursor-pointer focus:ring-1 focus:ring-brick-copper/30"
            >
              <option value="" className="bg-[#121212] text-white">Home Page</option>
              {pages.map(p => (
                <option key={p.id} value={p.id} className="bg-[#121212] text-white">{p.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Undo / Redo controls in center */}
      <HistoryControls />

      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsPickerOpen(true)}
          type="button"
          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] tracking-widest font-bold uppercase text-white transition-all flex items-center gap-2 cursor-pointer font-mono"
        >
          <LayoutGrid size={11} className="text-brick-copper" />
          Load Template
        </button>
        <button
          onClick={() => {
            setTemplateName(page ? `Template: ${page.title}` : "Template: Home Layout");
            setIsSaverOpen(true);
          }}
          type="button"
          className="px-4 py-1.5 bg-brick-copper text-charcoal font-black hover:bg-white border border-brick-copper hover:border-white transition-all text-[10px] tracking-widest uppercase flex items-center gap-2 cursor-pointer font-mono shadow-md"
        >
          <Save size={11} />
          Save Template
        </button>
        
        <div className="h-4 w-px bg-white/15 mx-1" />

        {/* This is Puck's Publish/Action button slot */}
        <div className="flex items-center">
          {actions}
        </div>

        <button 
          onClick={onClose}
          type="button"
          className="px-4 py-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white transition-all uppercase text-[10px] tracking-widest font-bold cursor-pointer font-mono"
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export const PuckEditor = ({ pageId, onClose }: { pageId?: string; onClose: () => void }) => {
  const { settings, pages, isLight, portfolioItems, partners, teams, brandResources, popups, isAdmin } = useSiteContent();
  const [isSaving, setIsSaving] = useState(false);
  const [puckVersion, setPuckVersion] = useState(0);

  const formatTemplateDate = (createdAt: any) => {
    if (!createdAt) return "---";
    if (typeof createdAt === 'string') {
      return new Date(createdAt).toLocaleDateString();
    }
    if (createdAt?.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString();
    }
    if (createdAt instanceof Date) {
      return createdAt.toLocaleDateString();
    }
    if (typeof createdAt?.toDate === 'function') {
      return createdAt.toDate().toLocaleDateString();
    }
    return "---";
  };
  const [currentPageId, setCurrentPageId] = useState(pageId);
  const [templates, setTemplates] = useState<PuckTemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Modals visibility states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaverOpen, setIsSaverOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Save template form state
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Core Business");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedImgPlaceholder, setSelectedImgPlaceholder] = useState("slate");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Upgrade template feature: Admin Upload / Paste JSON state
  const [pickerTab, setPickerTab] = useState<"browse" | "import" | "ai">("browse");
  const [pastedJson, setPastedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [parsedPuckData, setParsedPuckData] = useState<any>(null);
  const [importSaveName, setImportSaveName] = useState("");
  const [importSaveCategory, setImportSaveCategory] = useState("Custom Layouts");
  const [importSaveDesc, setImportSaveDesc] = useState("");
  const [isSavingImportTemplate, setIsSavingImportTemplate] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState<boolean>(false);

  // AI Design Converter states
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiImageName, setAiImageName] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [convertedData, setConvertedData] = useState<any>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const config = useMemo(() => createConfig(pages, portfolioItems, partners, teams, brandResources, popups), [pages, portfolioItems, partners, teams, brandResources, popups]);

  // Optimized, robust cycle-resilient object graph purger
  const cleanObject = (obj: any): any => {
    const cache = new WeakSet();
    const prune = (val: any): any => {
      if (val === null || typeof val !== 'object') return val;
      if (val.$$typeof) return undefined; // Instantly strip raw React template descriptors
      if (cache.has(val)) return undefined; // Stop recursive circular dependencies safely
      cache.add(val);
      if (Array.isArray(val)) {
        return val.map(prune).filter(v => v !== undefined);
      }
      const cleaned: any = {};
      for (const [k, v] of Object.entries(val)) {
        const prunedVal = prune(v);
        if (prunedVal !== undefined && typeof prunedVal !== 'function') {
          cleaned[k] = prunedVal;
        }
      }
      return cleaned;
    };
    return prune(obj);
  };

  const page = currentPageId ? pages.find(p => p.id === currentPageId) : null;

  // Initialize with current layout or the baseline structure
  const initialData = useMemo(() => {
    const rawData = page?.layout && (page.layout.content?.length > 0 || page.layout.zones)
      ? page.layout
      : (!currentPageId && settings.layout && (settings.layout.content?.length > 0 || settings.layout.zones))
        ? settings.layout 
        : BASELINE_LAYOUT;
    return sanitizeLayout(cleanObject(rawData), page?.title || settings.brandName || "Page");
  }, [page, currentPageId, settings.layout, settings.brandName]);

  const [editorData, setEditorData] = useState<any>(initialData);
  
  // ✅ FIXED: Safely sync changes using a standard layout effect phase block hook instead of an inline useMemo mutation
  useEffect(() => {
    setEditorData(initialData);
    setPuckVersion(v => v + 1);
  }, [initialData]);  // Pre-seeded local templates for seeding
  const seedPresets: Omit<PuckTemplateItem, "id" | "createdAt">[] = [];

  // Fetch templates from Firestore
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const colRef = collection(db, "puck_templates");
      let snap;
      try {
        snap = await getDocs(colRef);
      } catch (readErr: any) {
        console.warn("Firestore read permission/network error on 'puck_templates', falling back to local presets:", readErr);
        // Fallback directly to local presets
        setTemplates(seedPresets.map((p, idx) => ({
          id: `seed-preset-${idx}`,
          createdAt: new Date().toISOString(),
          ...p
        })) as PuckTemplateItem[]);
        setLoadingTemplates(false);
        return;
      }

      const items = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as PuckTemplateItem[];

      if (isAdmin) {
        // Automatically seed any completely new presets (like 'Aerial New') that don't exist in the database
        const seededItems = [...items];
        for (const preset of seedPresets) {
          const docId = preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const exists = items.some(item => item.id === docId);
          if (!exists) {
            const docRef = doc(db, "puck_templates", docId);
            const newDoc = { 
              ...preset, 
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp() 
            };
            try {
              await setDoc(docRef, newDoc);
              seededItems.push({ id: docId, ...newDoc } as any);
            } catch (wErr) {
              console.warn(`Could not seed preset ${docId} into firestore:`, wErr);
            }
          }
        }
        setTemplates(seededItems);
      } else {
        // Non-admin fallback / display combination
        const combined = [...items];
        for (const preset of seedPresets) {
          const docId = preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const exists = items.some(item => item.id === docId);
          if (!exists) {
            combined.push({
              id: `seed-${docId}`,
              createdAt: new Date().toISOString(),
              ...preset
            } as any);
          }
        }
        setTemplates(combined);
      }
    } catch (err) {
      console.error("Failed to load puck templates general error:", err);
      // General safety fallback
      setTemplates(seedPresets.map((p, idx) => ({
        id: `fallback-preset-${idx}`,
        createdAt: new Date().toISOString(),
        ...p
      })) as PuckTemplateItem[]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      const sanitizedData = cleanObject(data);
      
      if (currentPageId) {
        await setDoc(doc(db, 'pages', currentPageId), {
          layout: sanitizedData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(doc(db, 'settings', 'site'), {
          layout: sanitizedData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, pageId ? `pages/${pageId}` : `settings/site`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler to create a template from current editorData
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || isSavingTemplate) return;

    setIsSavingTemplate(true);
    try {
      const docId = `template-${Date.now()}`;
      const docRef = doc(db, "puck_templates", docId);
      
      let screenshotBase64 = selectedImgPlaceholder;
      // ✅ FIXED: Isolated UI thread race conditions with an automated execution deadline wrapper
      try {
        const canvasContainer = (document.querySelector(".puck-container iframe") as HTMLIFrameElement)?.contentDocument?.body
          || document.querySelector(".puck-container");
        if (canvasContainer) {
          screenshotBase64 = await Promise.race([
            html2canvas(canvasContainer as HTMLElement, {
              useCORS: true,
              scale: 0.25,
              logging: false,
              backgroundColor: "#161616"
            }).then(canvas => canvas.toDataURL("image/jpeg", 0.6)),
            new Promise<string>((res) => setTimeout(() => res(selectedImgPlaceholder), 1200))
          ]);
        }
      } catch (screenshotErr) {
        console.warn("Screenshot engine optimization skipped:", screenshotErr);
      }

      const newTemplate = {
        name: templateName,
        category: templateCategory,
        description: templateDescription || "Custom user-generated page layout template.",
        previewImage: screenshotBase64,
        puckData: cleanObject(editorData),
        createdAt: serverTimestamp()
      };

      await setDoc(docRef, newTemplate);
      
      // Reset form & reload
      setTemplateName("");
      setTemplateDescription("");
      setIsSaverOpen(false);
      await fetchTemplates();
    } catch (err) {
      console.error("Error saving puck template:", err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // JSON layout parsing and full-tree structural sanitizing
  const validateAndParseJson = (text: string) => {
    setJsonError(null);
    setParsedPuckData(null);
    if (!text.trim()) return;

    try {
      const parsed = JSON.parse(text);
      let puckCompatible: any = {};
      
      if (Array.isArray(parsed)) {
        puckCompatible = { content: parsed };
      } else if (parsed && typeof parsed === 'object') {
        if (parsed.content || parsed.zones || parsed.root) {
          puckCompatible = parsed;
        } else {
          // Wrap loose single-component layouts
          puckCompatible = { content: [parsed] };
        }
      } else {
        throw new Error("JSON should be a valid configuration object or section blocks array.");
      }

      // Convert using our advanced cyclic-resilient sanitizers
      const sanitized = sanitizeLayout(cleanObject(puckCompatible), page?.title || settings.brandName || "Imported Code");
      setParsedPuckData(sanitized);
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON syntax");
    }
  };

  const handleImportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPastedJson(text);
      validateAndParseJson(text);
    };
    reader.readAsText(file);
  };

  const handleImportTemplateSave = async () => {
    if (!parsedPuckData || !importSaveName.trim()) return;
    setIsSavingImportTemplate(true);
    try {
      const docId = `imported-${importSaveName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
      const docRef = doc(db, "puck_templates", docId);

      const newTemplate = {
        name: importSaveName,
        category: importSaveCategory || "Custom Layouts",
        description: importSaveDesc || "Imported layout converted from custom JSON file.",
        previewImage: "indigo", // default beautiful gradient placeholder
        puckData: cleanObject(parsedPuckData),
        createdAt: serverTimestamp()
      };

      await setDoc(docRef, newTemplate);

      // Reset states
      setImportSaveName("");
      setImportSaveDesc("");
      setPastedJson("");
      setParsedPuckData(null);
      setPickerTab("browse");
      setIsPickerOpen(false);

      await fetchTemplates();
    } catch (err) {
      console.error("Error saving imported JSON preset:", err);
    } finally {
      setIsSavingImportTemplate(false);
    }
  };

  const handleDeployDraft = () => {
    if (!parsedPuckData) return;
    handleLoadTemplate(parsedPuckData);
    setPastedJson("");
    setParsedPuckData(null);
  };

  // AI Design Conversion helper methods
  const handleAiImageUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPEG, WebP).");
      return;
    }
    
    setAiImageName(file.name);
    setConversionError(null);
    setConvertedData(null);
    
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to downscale and compress image for rapid network payload and avoiding Vercel timeouts
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as compressed JPEG for extremely fast upload/parsing & keeping below Vercel payload limit (4.5MB)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAiImage(compressedDataUrl);
        } else {
          setAiImage(reader.result as string);
        }
      };
      img.onerror = () => {
        setAiImage(reader.result as string);
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      toast.error("Failed to read the image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleAiDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAiDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAiImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConvertDesign = async () => {
    if (!aiImage) {
      toast.error("Please upload or drag a design image first.");
      return;
    }

    setIsConverting(true);
    setConversionError(null);
    setConvertedData(null);
    
    const statuses = [
      "Uploading design mockup to vision pipeline...",
      "Gemini Multimodal analyzing layout wireframes...",
      "Extracting column spans and nested section bounds...",
      "Mapping visual segments to available Puck blocks...",
      "Generating structured JSON tree representation...",
      "Validating and clean-formatting output schemas..."
    ];

    let statusIdx = 0;
    setConversionStatus(statuses[0]);
    
    const statusInterval = setInterval(() => {
      if (statusIdx < statuses.length - 1) {
        statusIdx++;
        setConversionStatus(statuses[statusIdx]);
      }
    }, 2500);

    try {
      const response = await fetch("/api/ai/convert-image-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: aiImage,
          mimeType: aiImage.startsWith("data:image/png") ? "image/png" : "image/jpeg",
          prompt: aiPrompt,
        }),
      });

      clearInterval(statusInterval);

      if (!response.ok) {
        let errMsg = `Server returned status ${response.status}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
          } else {
            const textText = await response.text();
            if (textText) errMsg = `${errMsg}: ${textText.substring(0, 100)}`;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const rawData = await response.json();
      
      // Ensure the returned data matches Puck's structural expectation
      if (!rawData || typeof rawData !== "object" || !rawData.content || !Array.isArray(rawData.content)) {
        console.error("Invalid Puck layout structure:", rawData);
        throw new Error("Invalid design layout structure returned from API.");
      }
      
      const sanitized = sanitizeLayout(cleanObject(rawData), page?.title || settings.brandName || "Converted Page");
      
      setConvertedData(sanitized);
      toast.success("Design converted to page layout successfully!");
    } catch (err: any) {
      clearInterval(statusInterval);
      console.error("Design conversion failed:", err);
      setConversionError(err.message || String(err));
      toast.error(`Conversion failed: ${err.message || String(err)}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeployConverted = () => {
    if (!convertedData) return;
    setEditorData(convertedData);
    setPuckVersion(v => v + 1);
    setIsPickerOpen(false);
    setAiImage(null);
    setAiImageName("");
    setAiPrompt("");
    setConvertedData(null);
    toast.success("Design layout successfully deployed to editor workspace!");
  };

  // Handler to load template to Puck Editor
  const handleLoadTemplate = (templateData: any) => {
    if (!templateData) {
      toast.error("The selected template has empty or corrupted layout data.");
      return;
    }
    try {
      const cleaned = cleanObject(templateData);
      const sanitized = sanitizeLayout(cleaned, page?.title || settings.brandName || "Page");
      if (!sanitized) {
        throw new Error("Sanitization produced empty layout");
      }
      setEditorData(sanitized);
      setPuckVersion(v => v + 1);
      setIsPickerOpen(false);
      toast.success("Template layout applied successfully!");
    } catch (err: any) {
      console.error("Error applying template:", err);
      toast.error(`Could not apply template: ${err?.message || 'Invalid layout structure'}`);
    }
  };

  // Handler to delete template from Firestore
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    setIsDeletingTemplate(true);
    try {
      await deleteDoc(doc(db, "puck_templates", templateId));
      toast.success(`Template "${templateName}" deleted successfully!`);
      setConfirmingDeleteId(null);
      await fetchTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      toast.error(`Failed to delete template: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  // Filter templates list by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "All") return templates;
    return templates.filter(t => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  // Unique categories list
  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    templates.forEach(t => {
      if (t.category) list.add(t.category);
    });
    return ["All", ...Array.from(list)];
  }, [templates]);

  // Map category or placeholder to a beautiful preview color background
  const getPlaceholderBg = (colorName?: string) => {
    switch (colorName) {
      case "indigo": return "from-indigo-900 to-slate-900";
      case "slate": return "from-slate-800 to-charcoal";
      case "copper": return "from-brick-copper/50 to-slate-900";
      case "emerald": return "from-emerald-950 to-charcoal";
      default: return "from-charcoal to-black";
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-bg-primary flex flex-col">
      <div className={`flex-grow overflow-hidden relative puck-container bg-bg-primary text-text-primary ${isLight ? "light" : ""}`}>
        <Puck
          key={`${currentPageId || 'home'}-v${puckVersion}`}
          config={config}
          data={editorData}
          onChange={(newData) => setEditorData(newData)}
          onPublish={handleSave}
          iframe={{ enabled: false }}
          overrides={{
            header: ({ actions }) => (
              <CustomHeader
                actions={actions}
                currentPageId={currentPageId}
                setCurrentPageId={setCurrentPageId}
                pages={pages}
                setIsPickerOpen={setIsPickerOpen}
                setTemplateName={setTemplateName}
                page={page}
                setIsSaverOpen={setIsSaverOpen}
                onClose={onClose}
              />
            )
          }}
        />
      </div>
      
      {/* Save Status Overlay */}
      {isSaving && (
        <div className="absolute bottom-8 right-8 bg-brick-copper text-charcoal px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[300]">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Persisting Layout...</span>
        </div>
      )}

      {/* --- TEMPLATE PICKER MODAL --- */}
      {isPickerOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[500] p-4 animate-fade-in">
          <div className="bg-charcoal border border-white/10 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-white">
            {/* Header */}
            <div className="p-6 border-b border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-xl text-brick-copper italic">Page Template Manager</h3>
                <p className="text-xs text-white/50 mt-1">Select a visual template layout preset or convert and import custom JSON layout code.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="border border-white/10 bg-black/30 p-1 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTab("browse");
                    }}
                    className={`px-3 py-1.5 text-[9px] uppercase font-mono font-bold tracking-widest transition-all cursor-pointer ${
                      pickerTab === "browse" 
                        ? "bg-brick-copper text-charcoal font-black" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Browse Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTab("import");
                    }}
                    className={`px-3 py-1.5 text-[9px] uppercase font-mono font-bold tracking-widest transition-all cursor-pointer ${
                      pickerTab === "import" 
                        ? "bg-brick-copper text-charcoal font-black" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Converter & Importer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTab("ai");
                    }}
                    className={`px-3 py-1.5 text-[9px] uppercase font-mono font-bold tracking-widest transition-all cursor-pointer flex items-center gap-1 ${
                      pickerTab === "ai" 
                        ? "bg-brick-copper text-charcoal font-black" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Sparkles size={10} className={pickerTab === "ai" ? "text-charcoal" : "text-[#cfa073]"} />
                    AI Design Converter
                  </button>
                </div>
                <button 
                  onClick={() => setIsPickerOpen(false)}
                  className="text-white/40 hover:text-white transition-colors p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {pickerTab === "browse" && (
              <>
                {/* Filter Categories */}
                <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex gap-2 overflow-x-auto">
              {categoriesList.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-[10px] tracking-widest uppercase transition-all border ${
                    selectedCategory === category 
                      ? "bg-brick-copper border-brick-copper text-charcoal font-bold" 
                      : "border-white/10 hover:border-white/30 text-white/70"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Grid Template Cards */}
            <div className="p-6 flex-grow overflow-y-auto min-h-[300px]">
              {loadingTemplates ? (
                <div className="w-full h-full flex flex-col gap-3 justify-center items-center py-20 text-white/50">
                  <Loader2 className="animate-spin text-brick-copper" size={32} />
                  <span className="text-xs uppercase tracking-widest">Fetching design schemas...</span>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-20 text-white/40 flex flex-col justify-center items-center gap-4">
                  <Folder size={48} className="stroke-[1.5px] text-brick-copper/30" />
                  <div>
                    <p className="font-medium text-sm">No Templates Found</p>
                    <p className="text-xs text-white/30 mt-1">Feel free to save your current setup as a new custom template!</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {filteredTemplates.map(template => (
                    <div 
                      key={template.id}
                      className="border border-white/10 bg-[#161616] group hover:border-brick-copper transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Graphics Header */}
                      <div className="h-36 relative overflow-hidden bg-black p-4 flex flex-col justify-between">
                        {template.previewImage && (template.previewImage.startsWith("data:") || template.previewImage.startsWith("http")) ? (
                          <img 
                            src={template.previewImage} 
                            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${getPlaceholderBg(template.previewImage)}`} />
                        )}
                        {/* Overlay Accent Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                        
                        <div className="flex justify-between items-start z-10 relative">
                          <span className="bg-charcoal/90 border border-white/10 text-[9px] uppercase tracking-widest text-brick-copper px-2 py-0.5 font-mono">
                            {template.category}
                          </span>
                          <span className="text-[9px] text-white/35 font-mono">
                            {formatTemplateDate(template.createdAt)}
                          </span>
                        </div>
                        <div className="z-10 relative">
                          <h4 className="font-display text-lg text-white group-hover:text-brick-copper transition-colors font-semibold truncate bg-black/40 px-1.5 py-0.5 rounded-sm backdrop-blur-sm">
                            {template.name}
                          </h4>
                        </div>
                      </div>

                      {/* Info & Select Button */}
                      <div className="p-4 flex-grow flex flex-col justify-between gap-4">
                        <p className="text-xs text-white/60 leading-relaxed font-sans line-clamp-3">
                          {template.description}
                        </p>
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            {confirmingDeleteId === template.id ? (
                              <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/20 px-2 py-1">
                                <span className="text-[8px] text-red-100 uppercase tracking-widest font-mono">Confirm?</span>
                                <button
                                  type="button"
                                  disabled={isDeletingTemplate}
                                  onClick={() => handleDeleteTemplate(template.id, template.name)}
                                  className="px-1.5 py-0.5 bg-red-650 hover:bg-red-500 text-white rounded-[2px] text-[8px] uppercase tracking-widest font-bold font-mono transition-colors cursor-pointer"
                                >
                                  {isDeletingTemplate ? "..." : "Yes"}
                                </button>
                                <button
                                  type="button"
                                  disabled={isDeletingTemplate}
                                  onClick={() => setConfirmingDeleteId(null)}
                                  className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-[2px] text-[8px] uppercase tracking-widest font-bold font-mono transition-colors cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  title="Delete Template"
                                  onClick={() => setConfirmingDeleteId(template.id)}
                                  className="p-1.5 border border-white/5 hover:border-red-500/30 bg-white/[0.01] hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all rounded cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                                <span className="text-[9px] text-white/45 uppercase tracking-widest flex items-center gap-1">
                                  <Info size={10} className="text-brick-copper" />
                                  Puck Layout
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleLoadTemplate(template.puckData)}
                            className="bg-brick-copper/90 hover:bg-white text-charcoal font-bold text-[9px] tracking-widest uppercase px-4 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check size={10} />
                            Deploy Layout
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </>
            )}

            {pickerTab === "import" && (
              <div className="flex-grow flex flex-col overflow-hidden max-h-[60vh]">
                {/* Importer Panel Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-grow overflow-y-auto">
                  {/* Left Side: Drag & Drop/Copy paste JSON */}
                  <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#cfa073] flex items-center gap-2">
                        <Terminal size={14} />
                        Pasted Layout Code JSON
                      </span>
                      <label className="bg-white/5 border border-white/10 hover:border-[#cfa073] hover:text-white text-[9px] uppercase tracking-wider font-bold font-mono px-3 py-1 cursor-pointer transition-colors flex items-center gap-1 hover:bg-white/10 text-white/70">
                        <Upload size={10} className="text-[#cfa073]" />
                        Upload File (.json)
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex-grow flex flex-col gap-1 min-h-[180px]">
                      <textarea
                        value={pastedJson}
                        onChange={(e) => {
                          setPastedJson(e.target.value);
                          validateAndParseJson(e.target.value);
                        }}
                        placeholder='Paste standard Puck Layout JSON here...
Example:
{
  "content": [
    {
      "type": "Section",
      "props": {
        "padding": "py-20",
        "background": "bg-bg-primary"
      }
    }
  ]
}'
                        className="w-full flex-grow bg-black/60 border border-white/10 p-4 text-xs font-mono text-emerald-400 outline-none focus:border-brick-copper focus:ring-1 focus:ring-brick-copper/20 resize-none h-64 border-b border-t leading-relaxed tracking-wide placeholder-white/20 select-text"
                      />
                    </div>

                    {/* Syntax Status Display */}
                    {jsonError ? (
                      <div className="bg-[#1f1212] border border-red-950/40 text-red-400 p-4 rounded-sm text-xs flex gap-3 items-start font-mono">
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-grow overflow-hidden break-words">
                          <strong className="uppercase block text-[9px] tracking-wider mb-1 text-red-300">Layout Parse Error:</strong>
                          {jsonError}
                        </div>
                      </div>
                    ) : parsedPuckData ? (
                      <div className="bg-[#121f14] border border-emerald-900/40 text-emerald-400 p-4 rounded-sm text-xs flex gap-3 items-center font-mono">
                        <Check size={16} className="text-emerald-500 shrink-0" />
                        <div>
                          <strong className="uppercase block text-[9px] tracking-wider mb-1 text-emerald-300">Converter Succeeded:</strong>
                          Recognized layout schema with {parsedPuckData.content?.length || 0} top-level element(s).
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Right Side: Convert & Save Panel */}
                  <div className="lg:col-span-5 p-6 bg-black/25 flex flex-col justify-between gap-6 overflow-y-auto">
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-white/10">
                        <h4 className="font-display font-medium text-white text-sm">Save Layout to Shared Presets</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed mt-1">
                          After typing or uploading layout code on the left, you can immediately deploy it to this session or name and persist it as an official reusable template.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-white/65 hover:text-white/80 font-mono mb-1.5 font-bold">
                            Preset Template Name <span className="text-brick-copper">*</span>
                          </label>
                          <input
                            type="text"
                            value={importSaveName}
                            onChange={(e) => setImportSaveName(e.target.value)}
                            placeholder="e.g. Asymmetric Grid Layout"
                            className="w-full bg-[#161616] border border-white/10 focus:border-[#cfa073] px-3.5 py-2 text-xs outline-none transition-all font-mono placeholder-white/20"
                            disabled={!parsedPuckData}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-white/65 font-mono mb-1.5 font-bold">
                            Category Selection
                          </label>
                          <select
                            value={importSaveCategory}
                            onChange={(e) => setImportSaveCategory(e.target.value)}
                            className="w-full bg-[#161616] border border-white/10 focus:border-[#cfa073] px-3 py-2 text-xs text-white outline-none font-mono appearance-none"
                            disabled={!parsedPuckData}
                          >
                            <option value="Custom Layouts">Custom Layouts</option>
                            <option value="Media Showcase">Media Showcase</option>
                            <option value="Core Business">Core Business</option>
                            <option value="Page Structures">Page Structures</option>
                            <option value="Header & Footer">Header & Footer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-white/65 font-mono mb-1.5 font-bold">
                            Preset Description
                          </label>
                          <textarea
                            value={importSaveDesc}
                            onChange={(e) => setImportSaveDesc(e.target.value)}
                            placeholder="Briefly summarize what components are featured in this imported preset."
                            className="w-full min-h-[80px] bg-[#161616] border border-white/10 focus:border-[#cfa073] px-3.5 py-2 text-xs outline-none transition-all font-mono resize-none placeholder-white/20"
                            disabled={!parsedPuckData}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={handleDeployDraft}
                        disabled={!parsedPuckData}
                        className={`w-full py-2.5 text-[10px] tracking-widest font-bold font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          parsedPuckData 
                            ? "bg-white text-charcoal hover:bg-[#cfa073] hover:text-charcoal" 
                            : "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed pointer-events-none"
                        }`}
                      >
                        <Check size={12} />
                        Deploy to Workspace Only
                      </button>

                      <button
                        type="button"
                        onClick={handleImportTemplateSave}
                        disabled={!parsedPuckData || !importSaveName.trim() || isSavingImportTemplate}
                        className={`w-full py-2.5 text-[10px] tracking-widest font-bold font-mono uppercase transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                          parsedPuckData && importSaveName.trim()
                            ? "border-[#cfa073] bg-[#cfa073]/10 text-[#cfa073] hover:bg-[#cfa073] hover:text-charcoal font-extrabold" 
                            : "border-white/5 bg-transparent text-white/20 cursor-not-allowed pointer-events-none"
                        }`}
                      >
                        {isSavingImportTemplate ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Saving Template...
                          </>
                        ) : (
                          <>
                            <Save size={12} />
                            Save as Shared Template
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {pickerTab === "ai" && (
              <div className="flex-grow flex flex-col overflow-hidden max-h-[60vh]">
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-grow overflow-y-auto">
                  {/* Left Side: Drag & Drop Mockup Image & Instructions */}
                  <div className="lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col gap-5 overflow-y-auto">
                    <div>
                      <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-brick-copper flex items-center gap-2">
                        <ImageIcon size={14} />
                        Upload Design Mockup / Screenshot
                      </h4>
                      <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                        Select or drag and drop a PNG/JPEG screenshot of your Google Stitch mockup or website design.
                      </p>
                    </div>

                    {/* Drag & Drop Box */}
                    <div
                      onDragOver={handleAiDragOver}
                      onDrop={handleAiDrop}
                      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all min-h-[180px] relative overflow-hidden bg-black/20 ${
                        aiImage 
                          ? "border-emerald-500/40 bg-emerald-950/10" 
                          : "border-white/10 hover:border-brick-copper/30 hover:bg-white/[0.02]"
                      }`}
                    >
                      {aiImage ? (
                        <div className="absolute inset-0 group">
                          <img
                            src={aiImage}
                            alt="Design Preview"
                            className="w-full h-full object-contain opacity-75 group-hover:opacity-40 transition-opacity"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                            <span className="text-[10px] uppercase tracking-widest bg-charcoal/90 text-white font-mono px-3 py-1 border border-white/10 rounded-sm">
                              Change Mockup
                            </span>
                            <span className="text-[8px] text-white/60 truncate max-w-[80%] font-mono">
                              {aiImageName}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 rounded-full bg-white/5 text-[#cfa073]">
                            <Upload size={20} />
                          </div>
                          <div>
                            <span className="text-xs font-mono font-bold hover:text-[#cfa073] cursor-pointer block">
                              Click to select file
                            </span>
                            <span className="text-[10px] text-white/40 block mt-1">
                              or drag & drop design file here (PNG/JPEG)
                            </span>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleAiImageUpload(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isConverting}
                      />
                    </div>

                    {/* Prompt Guidance Input */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] uppercase tracking-wider text-white/65 font-mono font-bold">
                        AI Directive / Custom Instructions (Optional)
                      </label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., Use dark charcoal backgrounds and boxed content layouts. Ensure services and portfolio sections are placed side-by-side inside columns."
                        className="w-full h-20 bg-black/40 border border-white/10 hover:border-white/20 focus:border-brick-copper text-xs outline-none p-3 resize-none font-mono placeholder-white/25 transition-all text-white leading-relaxed"
                        disabled={isConverting}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleConvertDesign}
                      disabled={!aiImage || isConverting}
                      className={`w-full py-3 text-[10px] tracking-widest font-bold font-mono uppercase transition-all flex items-center justify-center gap-2 border rounded-sm ${
                        aiImage && !isConverting
                          ? "border-brick-copper bg-brick-copper/10 text-brick-copper hover:bg-brick-copper hover:text-charcoal font-black"
                          : "border-white/5 bg-transparent text-white/20 cursor-not-allowed pointer-events-none"
                      }`}
                    >
                      {isConverting ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Analyzing Mockup Layout...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Convert Design Mockup to Page
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Side: Conversion Dashboard / Status Feedback */}
                  <div className="lg:col-span-6 p-6 bg-black/20 flex flex-col justify-between overflow-y-auto min-h-[300px]">
                    <div className="flex-grow flex flex-col justify-center">
                      {!aiImage && !isConverting && !convertedData && !conversionError && (
                        <div className="text-center space-y-3 py-12 text-white/40 max-w-sm mx-auto">
                          <div className="flex justify-center text-[#cfa073]/45">
                            <Sparkles size={36} className="animate-pulse" />
                          </div>
                          <div>
                            <p className="font-medium text-xs font-mono uppercase tracking-widest text-[#cfa073]">AI Vision Engine</p>
                            <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                              Upload a Google Stitch design screenshot on the left to start. The AI vision model will instantly recognize design patterns and output a fully-structured Puck visual editor page layout.
                            </p>
                          </div>
                        </div>
                      )}

                      {isConverting && (
                        <div className="text-center space-y-4 py-12">
                          <div className="flex justify-center">
                            <div className="relative flex items-center justify-center">
                              <div className="absolute w-12 h-12 rounded-full border border-[#cfa073]/20 animate-ping" />
                              <Loader2 className="animate-spin text-brick-copper shrink-0 relative z-10" size={36} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-mono font-bold text-white uppercase tracking-widest animate-pulse">
                              Processing Design Mockup
                            </p>
                            <p className="text-[10px] text-white/50 font-mono tracking-wide">
                              {conversionStatus}
                            </p>
                          </div>
                        </div>
                      )}

                      {conversionError && (
                        <div className="bg-red-950/25 border border-red-500/20 text-red-400 p-5 rounded-sm text-xs flex gap-3 items-start font-mono max-w-md mx-auto">
                          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <strong className="uppercase block text-[9px] tracking-wider text-red-300">Conversion Failure:</strong>
                            <p className="text-[10px] text-red-400/80 leading-relaxed break-words">{conversionError}</p>
                            <button
                              onClick={handleConvertDesign}
                              className="text-[9px] uppercase tracking-widest text-white underline hover:text-brick-copper font-bold"
                            >
                              Retry Conversion
                            </button>
                          </div>
                        </div>
                      )}

                      {convertedData && !isConverting && (
                        <div className="space-y-5 py-2">
                          <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-5 rounded-sm text-xs flex gap-3 items-start font-mono">
                            <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                            <div className="space-y-1.5 flex-grow">
                              <strong className="uppercase block text-[9px] tracking-widest text-emerald-300">Conversion Succeeded!</strong>
                              <p className="text-[10px] text-emerald-400/80 leading-relaxed">
                                Gemini successfully generated a valid, nested Puck layout.
                              </p>
                              <div className="bg-black/40 border border-white/5 rounded-sm p-3 mt-3 text-[9px] space-y-1 max-h-48 overflow-y-auto">
                                <span className="text-white/40 block border-b border-white/5 pb-1 uppercase tracking-widest font-bold">Layout Blueprint Summary:</span>
                                <div className="space-y-1 font-mono text-emerald-400/95 mt-1">
                                  <div>• Page Title: <span className="text-white">{convertedData.root?.props?.title || "Converted Design"}</span></div>
                                  <div>• Layout Mode: <span className="text-white">{convertedData.root?.props?.layoutMode || "one-panel"}</span></div>
                                  <div>• Top-level Components: <span className="text-white">{(convertedData.content?.length || 0)}</span></div>
                                  {convertedData.content?.map((item: any, idx: number) => (
                                    <div key={item.id || idx} className="pl-3 text-white/60">
                                      - {item.type} <span className="text-[8px] text-white/35">({item.id})</span>
                                    </div>
                                  ))}
                                  {convertedData.zones && Object.keys(convertedData.zones).length > 0 && (
                                    <>
                                      <div className="pt-1 text-white/40">• Nested Component Slots:</div>
                                      {Object.entries(convertedData.zones).map(([zoneName, items]: [string, any]) => (
                                        <div key={zoneName} className="pl-3 text-emerald-300/85">
                                          {zoneName}: <span className="text-white/60">{items.map((it: any) => it.type).join(", ") || "empty"}</span>
                                        </div>
                                      ))}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-white/5">
                            <button
                              type="button"
                              onClick={handleDeployConverted}
                              className="w-full py-3 bg-white text-charcoal hover:bg-brick-copper hover:text-charcoal font-bold text-[10px] tracking-widest font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer rounded-sm"
                            >
                              <Check size={12} />
                              Deploy Layout to Workspace
                            </button>
                            
                            <p className="text-[9px] text-white/40 text-center italic font-mono">
                              * Deploying will load this design structure into your active Puck canvas, allowing you to edit any text, replace images, and save templates directly.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex justify-end">
              <button
                onClick={() => {
                  setIsPickerOpen(false);
                  setPastedJson("");
                  setParsedPuckData(null);
                  setJsonError(null);
                  setPickerTab("browse");
                }}
                className="px-4 py-2 border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-xs uppercase tracking-widest transition-colors font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SAVE AS TEMPLATE MODAL --- */}
      {isSaverOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[500] p-4 animate-fade-in">
          <div className="bg-charcoal border border-white/10 w-full max-w-md shadow-2xl text-white">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-display text-lg text-brick-copper italic">Save Layout as Template</h3>
              <button 
                onClick={() => setIsSaverOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              {/* Template Name */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-black block">Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxury Single Listing, Modern Portal"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white font-medium text-xs px-3 py-2 outline-none focus:border-brick-copper transition-colors"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-black block">Category / Type *</label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full bg-white/5 border border-[#ffffff15] text-white text-xs px-3 py-2 outline-none focus:border-brick-copper transition-colors uppercase tracking-widest"
                >
                  <option value="Core Business" className="bg-charcoal">Core Business</option>
                  <option value="Media Showcase" className="bg-charcoal">Media Showcase</option>
                  <option value="Pricing & Services" className="bg-charcoal">Pricing & Services</option>
                  <option value="Client Portals" className="bg-charcoal">Client Portals</option>
                  <option value="Custom" className="bg-charcoal">Custom Layouts</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-black block">Short Description</label>
                <textarea
                  placeholder="Describe your layout to help others select it..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 text-white text-xs px-3 py-2 outline-none focus:border-brick-copper transition-colors"
                />
              </div>

              {/* Standard Theme Color Preview Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-black block">Aesthetic Preview Icon Accent</label>
                <div className="flex gap-3 pt-1">
                  {[
                    { key: "slate", label: "Midnight", class: "bg-gradient-to-br from-slate-700 to-slate-900 border" },
                    { key: "indigo", label: "Sapphire", class: "bg-gradient-to-br from-indigo-700 to-indigo-900 border" },
                    { key: "copper", label: "Copper", class: "bg-gradient-to-br from-brick-copper/50 to-slate-900 border" },
                    { key: "emerald", label: "Jade", class: "bg-gradient-to-br from-emerald-800 to-charcoal border" }
                  ].map(color => (
                    <button
                      key={color.key}
                      type="button"
                      onClick={() => setSelectedImgPlaceholder(color.key)}
                      title={color.label}
                      className={`h-8 w-8 rounded-full ${color.class} transition-all relative ${
                        selectedImgPlaceholder === color.key ? "ring-2 ring-brick-copper ring-offset-2 ring-offset-charcoal" : "border-white/15"
                      }`}
                    >
                      {selectedImgPlaceholder === color.key && (
                        <Check size={12} className="text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSaverOpen(false)}
                  className="px-4 py-2 border border-white/15 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="px-4 py-2 bg-brick-copper text-charcoal font-bold hover:bg-white text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingTemplate ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Caching...
                    </>
                  ) : (
                    <>
                      <Plus size={12} />
                      Verify & Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
