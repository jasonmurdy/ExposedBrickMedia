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
  const { settings, pages } = useSiteContent();
  const [isSaving, setIsSaving] = useState(false);

  const config = useMemo(() => createConfig(pages), [pages]);

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

  const page = pageId ? pages.find(p => p.id === pageId) : null;

  // Initialize with current layout or the baseline structure
  const initialData = cleanObject(page?.layout && (page.layout.content?.length > 0 || page.layout.zones)
    ? page.layout
    : (!pageId && settings.layout && (settings.layout.content?.length > 0 || settings.layout.zones))
      ? settings.layout 
      : BASELINE_LAYOUT);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      const sanitizedData = cleanObject(data);
      
      if (pageId) {
        await setDoc(doc(db, 'pages', pageId), {
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
        <h2 className="text-brick-copper font-display text-xl italic">Visual Layout Engine</h2>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-off-white/60 hover:text-white transition-colors uppercase text-[10px] tracking-widest"
          >
            Exit Editor
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-hidden relative puck-container">
        <Puck
          config={config}
          data={initialData}
          onPublish={handleSave}
          headerPath="EB Editor"
          iframe={{ enabled: true }}
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
