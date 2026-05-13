/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Puck } from "@puckeditor/core";
import "@puckeditor/core/dist/index.css";
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
      <style>{`
        /* Global Puck Theme Overrides */
        .puck-container {
          background-color: #1c1c1c !important;
          --puck-color-white: #f5f5f5 !important;
          --puck-color-black: #1c1c1c !important;
          --puck-color-grey-1: #161616 !important;
          --puck-color-grey-2: #242424 !important;
          --puck-color-grey-3: #2d2d2d !important;
          --puck-color-grey-4: #383838 !important;
          --puck-color-grey-5: #666666 !important;
          --puck-color-grey-6: #999999 !important;
          --puck-color-grey-7: #cccccc !important;
          --puck-color-grey-8: #e0e0e0 !important;
          --puck-color-grey-9: #ffffff !important;
          --puck-color-primary: #a47149 !important; /* Brick Copper */
          --puck-color-primary-dark: #8b5e3c !important;
          --puck-color-background: #1c1c1c !important;
        }

        /* Sidebar & Panel Backgrounds - Matching site charcoal */
        .puck-container [class*="Sidebar"],
        .puck-container [class*="SideBar"],
        .puck-container [class*="PanelContent"],
        .puck-container [class*="SidebarContent"],
        .puck-container [class*="Canvas-Sidebar"],
        .puck-container [class*="Panel"] {
          background-color: #1c1c1c !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
        }

        /* Primary Text in Sidebars - Off-white for readability */
        .puck-container [class*="Sidebar"] label,
        .puck-container [class*="Sidebar"] span,
        .puck-container [class*="Sidebar"] p,
        .puck-container [class*="SideBar"] label,
        .puck-container [class*="SideBar"] span,
        .puck-container [class*="Panel"] label,
        .puck-container [class*="Panel"] span,
        .puck-container [class*="Field"] label,
        .puck-container [class*="Path"] {
          color: #f5f5f5 !important;
          font-family: var(--font-body) !important;
        }

        /* Category Titles - Sophisticated Gold Accents */
        .puck-container [class*="Category"] [class*="Title"],
        .puck-container [class*="category"] [class*="title"] {
          color: #a47149 !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          font-size: 10px !important;
          opacity: 0.8 !important;
          margin-bottom: 16px !important;
          border-bottom: 1px solid rgba(164, 113, 73, 0.3) !important;
          padding-bottom: 6px !important;
        }

        /* Sidebar Navigation Tabs */
        .puck-container [class*="SideBar-Item"],
        .puck-container [class*="sidebar-tab"] {
          color: rgba(245, 245, 245, 0.4) !important;
          background: transparent !important;
          padding: 14px 0 !important;
          margin-right: 32px !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          font-weight: 600 !important;
        }
        .puck-container [class*="SideBar-Item--active"],
        .puck-container [class*="sidebar-tab--active"] {
          color: #a47149 !important;
          font-weight: 800 !important;
          border-bottom: 2px solid #a47149 !important;
        }

        /* Component List Items (Blocks) */
        .puck-container [class*="ComponentListItem"],
        .puck-container [class*="draggable"] {
          background-color: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          margin-bottom: 6px !important;
          padding: 14px !important;
          border-radius: 2px !important;
          transition: all 0.2s ease !important;
        }
        .puck-container [class*="ComponentListItem"]:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(164, 113, 73, 0.5) !important;
          transform: translateX(4px) !important;
        }
        .puck-container [class*="ComponentListItem"] label {
          color: #f5f5f5 !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        }

        /* Icons */
        .puck-container svg,
        .puck-container [class*="Icon"] {
          color: rgba(245, 245, 245, 0.3) !important;
          stroke: rgba(245, 245, 245, 0.3) !important;
        }
        .puck-container [class*="SideBar-Item--active"] svg,
        .puck-container [class*="sidebar-tab--active"] svg,
        .puck-container [class*="ComponentListItem"]:hover svg {
          color: #a47149 !important;
          stroke: #a47149 !important;
        }

        /* Fields - Clean & Dark */
        .puck-container input,
        .puck-container select,
        .puck-container textarea {
          background-color: #121212 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          padding: 10px 14px !important;
          border-radius: 0 !important;
          font-size: 11px !important;
        }
        .puck-container input:focus,
        .puck-container select:focus,
        .puck-container textarea:focus {
          border-color: #a47149 !important;
          box-shadow: 0 0 0 1px rgba(164, 113, 73, 0.2) !important;
          outline: none !important;
        }
        .puck-container label {
          font-weight: 600 !important;
          font-size: 10px !important;
          opacity: 0.9 !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          margin-bottom: 8px !important;
          display: block !important;
          color: #a47149 !important;
        }

        /* Header Styling */
        .puck-container header {
          background-color: #161616 !important;
          border-bottom: 2px solid #a47149 !important;
          height: 64px !important;
          padding: 0 32px !important;
        }
        
        /* Buttons */
        .puck-container button[class*="Button--primary"],
        .puck-container [class*="Actions"] button:nth-of-type(1) {
          background-color: #a47149 !important;
          color: #1c1c1c !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.2em !important;
          font-size: 10px !important;
          border-radius: 0 !important;
          padding: 12px 24px !important;
          border: none !important;
          transition: all 0.3s ease !important;
        }
        .puck-container button[class*="Button--primary"]:hover {
          background-color: #f5f5f5 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        .puck-container button[class*="Button"]:not([class*="primary"]) {
          color: #f5f5f5 !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          background: transparent !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 0.1em !important;
          padding: 10px 20px !important;
          border-radius: 0 !important;
        }
        
        .puck-header-select {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f5f5f5 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          padding: 8px 16px !important;
          border-radius: 0 !important;
        }

        /* Canvas improvements */
        .puck-container [class*="Canvas"] {
          background-color: #111111 !important;
        }
        .puck-container [class*="Canvas-page"] {
          background-color: #1c1c1c !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8) !important;
        }

        /* Selection & Hover Overlays */
        .puck-container [class*="Overlay"] {
          border: 1px solid #a47149 !important;
        }
        .puck-container [class*="SelectionBorder"] {
          border: 2px solid #a47149 !important;
          box-shadow: 0 0 15px rgba(164, 113, 73, 0.3) !important;
        }
        
        /* DropZones */
        .puck-container [class*="DropZone"] {
          background-color: rgba(164, 113, 73, 0.05) !important;
          border: 1px dashed rgba(164, 113, 73, 0.2) !important;
          transition: all 0.3s ease !important;
        }
        .puck-container [class*="DropZone--hover"] {
          background-color: rgba(164, 113, 73, 0.15) !important;
          border: 1px solid #a47149 !important;
        }

        /* Floating Labels (Component Tags) */
        .puck-container [class*="Label"] {
          background-color: #a47149 !important;
          color: #1c1c1c !important;
          font-size: 9px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          padding: 4px 8px !important;
          border-radius: 0 !important;
        }

        /* Action Buttons (Delete, Duplicate, etc) */
        .puck-container [class*="ActionGroup"] button {
          background-color: #1c1c1c !important;
          border: 1px solid rgba(164, 113, 73, 0.3) !important;
          color: #a47149 !important;
          transition: all 0.2s ease !important;
        }
        .puck-container [class*="ActionGroup"] button:hover {
          background-color: #a47149 !important;
          color: #1c1c1c !important;
        }

        /* DropZone Indicators (The "Drop here" circles) */
        .puck-container [class*="DropZone-indicator"] {
          background-color: #a47149 !important;
          box-shadow: 0 0 10px #a47149 !important;
        }

        /* Scrollbars (Elegant Dark) */
        .puck-container ::-webkit-scrollbar {
          width: 6px !important;
        }
        .puck-container ::-webkit-scrollbar-track {
          background: #1c1c1c !important;
        }
        .puck-container ::-webkit-scrollbar-thumb {
          background: rgba(164, 113, 73, 0.2) !important;
        }
        .puck-container ::-webkit-scrollbar-thumb:hover {
          background: #a47149 !important;
        }

        /* Outline View Styling */
        .puck-container [class*="Outline-item"] {
          color: #f5f5f5 !important;
          font-size: 11px !important;
        }
        .puck-container [class*="Outline-item--active"] {
          background-color: rgba(164, 113, 73, 0.1) !important;
          color: #a47149 !important;
          font-weight: 700 !important;
        }

      `}</style>
      <div className={`flex-grow overflow-hidden relative puck-container bg-bg-primary text-text-primary ${isLight ? 'light' : ''}`}>
        <Puck
          key={currentPageId || "home"}
          config={config}
          data={initialData}
          onPublish={handleSave}
          headerPath="Exposed Brick Editor"
          iframe={{ enabled: false }}
          overrides={{
            headerActions: ({ children }) => (
              <div className="flex items-center gap-6 mr-6">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brick-copper/50">Context:</span>
                  <select 
                    value={currentPageId || ""} 
                    onChange={(e) => setCurrentPageId(e.target.value || undefined)}
                    className="puck-header-select focus:border-brick-copper transition-all"
                  >
                    <option value="">Master Template (Home)</option>
                    {pages.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div className="h-4 w-px bg-brick-copper/20" />
                {children}
                <button 
                  onClick={onClose}
                  className="px-6 py-[10px] border border-brick-copper/40 text-brick-copper hover:bg-brick-copper hover:text-charcoal transition-all uppercase text-[10px] font-bold tracking-[0.2em] bg-transparent"
                >
                  Exit Engine
                </button>
              </div>
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
    </div>
  );
};
