/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Puck } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { createConfig, BASELINE_LAYOUT } from "../lib/puck.config";
import { useSiteContent } from "../lib/SiteContentContext";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState, useMemo } from "react";
import { Save, X, Loader2, RotateCcw } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firestoreError";

export const PuckEditor = ({ pageId, onClose }: { pageId?: string; onClose: () => void }) => {
  const { settings, pages, isLight, portfolioItems, partners, teams, brandResources } = useSiteContent();
  const [isSaving, setIsSaving] = useState(false);
  const [currentPageId, setCurrentPageId] = useState(pageId);

  const config = useMemo(() => createConfig(pages, portfolioItems, partners, teams, brandResources), [pages, portfolioItems, partners, teams, brandResources]);

  // Define cleanObject before usage or as a helper
  const cleanObject = (obj: any): any => {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (err) {
      console.warn("Circular structure detected, pruning.");
      const cache = new WeakSet();
      const prune = (val: any): any => {
        if (val === null || typeof val !== 'object') return val;
        if (cache.has(val)) return undefined;
        cache.add(val);
        if (Array.isArray(val)) return val.map(prune);
        const cleaned: any = {};
        for (const [k, v] of Object.entries(val)) {
          cleaned[k] = prune(v);
        }
        return cleaned;
      };
      return prune(obj);
    }
  };

  const page = currentPageId ? pages.find(p => p.id === currentPageId) : null;

  // Initialize with current layout or the baseline structure
  const initialData = useMemo(() => cleanObject(page?.layout && (page.layout.content?.length > 0 || page.layout.zones)
    ? page.layout
    : (!currentPageId && settings.layout && (settings.layout.content?.length > 0 || settings.layout.zones))
      ? settings.layout 
      : BASELINE_LAYOUT), [page, currentPageId, settings.layout]);

  const [editorData, setEditorData] = useState<any>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");

  // Update editorData when initialData changes (e.g. changing pageId)
  useMemo(() => {
    setEditorData(initialData);
  }, [initialData]);

  const handleAIGeneration = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      
      let resText = await res.text();
      
      if (!res.ok) {
         let errorMessage = "Failed to generate layout";
         try {
           const data = JSON.parse(resText);
           errorMessage = data.error || errorMessage;
         } catch(e) {}
         throw new Error(errorMessage + ` (Status: ${res.status})`);
      }
      
      let generated;
      try {
        generated = JSON.parse(resText);
      } catch (err) {
        console.error("Non-JSON response received (Status " + res.status + "):", resText.substring(0, 200));
        throw new Error("Server returned an invalid response. Please ensure you are logged in and the server is running.");
      }
      
      // Merge generated layout safely
      setEditorData((prev: any) => ({
        ...prev,
        ...generated
      }));
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      alert("Failed to generate layout: " + err.message);
    } finally {
      setIsGenerating(false);
      setPrompt("");
    }
  };

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

  return (
    <div className="fixed inset-0 z-[200] bg-bg-primary flex flex-col">
      <div className="bg-charcoal p-4 flex justify-between items-center border-b border-border-subtle">
        <div className="flex items-center gap-6">
          <h2 className="text-brick-copper font-display text-xl italic">Visual Layout Engine</h2>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Editing:</span>
            <select 
              value={currentPageId || ""} 
              onChange={(e) => setCurrentPageId(e.target.value || undefined)}
              className="bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white py-1 px-3 outline-none focus:border-brick-copper transition-colors"
            >
              <option value="">Home Page</option>
              {pages.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 mr-6">
            <input 
              type="text" 
              placeholder="Describe the page you want to build..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="bg-white/5 border border-white/10 text-white py-1 px-3 outline-none focus:border-brick-copper transition-colors w-64 text-sm"
            />
            <button
              onClick={handleAIGeneration}
              disabled={isGenerating || !prompt.trim()}
              className="px-4 py-1.5 bg-brick-copper text-charcoal font-medium hover:bg-white transition-colors text-[10px] tracking-widest uppercase disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate with AI"}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-off-white/60 hover:text-white transition-colors uppercase text-[10px] tracking-widest"
          >
            Exit Editor
          </button>
        </div>
      </div>
      <div className={`flex-grow overflow-hidden relative puck-container bg-bg-primary text-text-primary ${isLight ? 'light' : ''}`}>
        <Puck
          key={currentPageId || 'home'}
          config={config}
          data={editorData}
          onChange={(newData) => setEditorData(newData)}
          onPublish={handleSave}
          headerPath="EB Editor"
          iframe={{ enabled: false }}
        />
      </div>
      
      {/* Save Status Overlay */}
      {isSaving && (
        <div className="absolute bottom-8 right-8 bg-brick-copper text-charcoal px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[300]">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Persisting Layout...</span>
        </div>
      )}
    </div>
  );
};
