/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Puck, usePuck, createUsePuck } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { createConfig, BASELINE_LAYOUT } from "../lib/puck.config";
import { useSiteContent } from "../lib/SiteContentContext";
import { db } from "../lib/firebase";
import { doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { useState, useMemo, useEffect, useRef } from "react";
import { Save, X, Loader2, RotateCcw, LayoutGrid, FileText, Check, Folder, Info, Plus, Undo2, Redo2, Upload, Terminal, AlertTriangle, Trash2 } from "lucide-react";
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
  const [pickerTab, setPickerTab] = useState<"browse" | "import">("browse");
  const [pastedJson, setPastedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [parsedPuckData, setParsedPuckData] = useState<any>(null);
  const [importSaveName, setImportSaveName] = useState("");
  const [importSaveCategory, setImportSaveCategory] = useState("Custom Layouts");
  const [importSaveDesc, setImportSaveDesc] = useState("");
  const [isSavingImportTemplate, setIsSavingImportTemplate] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState<boolean>(false);

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
  const seedPresets: Omit<PuckTemplateItem, "id" | "createdAt">[] = [
    {
      name: "Services / Interior Photography Landing Page",
      category: "Media Showcase",
      description: "Premium landing page for Interior Photography utilizing custom asymmetric split layouts via Columns, explicit Image configurations, and interactive portfolios.",
      previewImage: "slate",
      puckData: {
        content: [
          {
            type: "Section",
            props: {
              padding: "py-32",
              background: "bg-transparent",
              layout: "full",
              spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Columns",
                props: {
                  leftColumnWidth: 45,
                  gap: 48,
                  spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" }
                },
                children: [
                  {
                    type: "FlexBox",
                    props: {
                      direction: "flex-col",
                      align: "items-start",
                      justify: "justify-center",
                      gap: 16
                    },
                    children: [
                      {
                        type: "Heading",
                        props: {
                          text: "THE ART OF THE INTERIOR",
                          level: 1,
                          sizeDesktop: "md:text-5xl",
                          sizeMobile: "text-3xl",
                          accent: true
                        }
                      },
                      {
                        type: "RichText",
                        props: {
                          content: "<p>Capturing architectural spaces through intentional balance, light, and symmetry. We deploy specialized multi-flash flambient methodologies to ensure spatial realities match raw aesthetic luxury.</p>",
                          size: "base"
                        }
                      },
                      {
                        type: "Button",
                        props: {
                          link: { type: "internal", url: "portfolio", label: "View Interior Portfolio" },
                          variant: "underline"
                        }
                      }
                    ]
                  },
                  {
                    type: "Image",
                    props: {
                      imageUrl: "https://images.unsplash.com/photo-1600607687940-c52fb036999c?auto=format&fit=crop&w=1200&q=80",
                      aspectRatio: "aspect-video",
                      objectFit: "cover",
                      borderRadius: "rounded-none"
                    }
                  }
                ]
              }
            ]
          },
          {
            type: "Section",
            props: {
              padding: "py-16",
              background: "bg-bg-secondary",
              layout: "boxed",
              spacing: { "pt": "20", "pb": "20", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Heading",
                props: {
                  text: "Curated Detail Captures",
                  level: 2,
                  sizeDesktop: "md:text-4xl",
                  align: "text-center",
                  accent: false
                }
              },
              {
                type: "DynamicGallery",
                props: {
                  title: "Featured Residential Spaces",
                  subtitle: "High-fidelity spatial design files compiled across recent regional productions.",
                  layout: "masonry",
                  columns: 3,
                  aspectRatio: "16/9",
                  grayscaleEffect: "hover-color",
                  lightbox: true
                }
              }
            ]
          }
        ],
        root: {
          props: {
            title: "Interior Architecture Media",
            layoutMode: "one-panel"
          }
        }
      }
    },
    {
      name: "Spatial Intelligence & 3D Tours",
      category: "Media Showcase",
      description: "Structures deep immersive engine specs (such as dollhouse tracking and digital twins) cleanly into nested slot trees.",
      previewImage: "indigo",
      puckData: {
        content: [
          {
            type: "Section",
            props: {
              padding: "py-24",
              background: "bg-charcoal text-white",
              layout: "boxed",
              spacing: { "pt": "40", "pb": "20", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Heading",
                props: {
                  text: "Spatial Intelligence. Digital Twins.",
                  level: 1,
                  sizeDesktop: "md:text-5xl",
                  accent: true
                }
              },
              {
                type: "RichText",
                props: {
                  content: "<p>Transcend traditional photography with hyper-accurate 3D Matterport tours. Provide potential buyers with a true-to-life walkthrough experience from anywhere in the world.</p>",
                  size: "lg"
                }
              }
            ]
          },
          {
            type: "Section",
            props: {
              padding: "py-16",
              background: "bg-bg-secondary",
              layout: "boxed",
              spacing: { "pt": "0", "pb": "32", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "GridBox",
                props: { "columnsDesktop": "md:grid-cols-3", "gap": 24 },
                children: [
                  {
                    type: "DecorativeFrame",
                    props: { "borderWidth": 1, "borderColor": "rgba(255,255,255,0.05)", "padding": 24 },
                    children: [
                      { "type": "Heading", "props": { "text": "Unmatched Engagement", "level": 3, "sizeDesktop": "text-xl" } },
                      { "type": "RichText", "props": { "content": "<p>Properties with 3D virtual tours see an average of 403% more inquiries than those without. We use Matterport Pro3 technology to capture every millimeter with LiDAR precision.</p>" } }
                    ]
                  },
                  {
                    type: "DecorativeFrame",
                    props: { "borderWidth": 1, "borderColor": "rgba(255,255,255,0.05)", "padding": 24 },
                    children: [
                      { "type": "Heading", "props": { "text": "Accessibility", "level": 3, "sizeDesktop": "text-xl", "accent": true } },
                      { "type": "RichText", "props": { "content": "<p>Global reach without travel. Allow international investors to walk the halls of your listing instantly.</p>" } }
                    ]
                  },
                  {
                    type: "DecorativeFrame",
                    props: { "borderWidth": 1, "borderColor": "rgba(255,255,255,0.05)", "padding": 24 },
                    children: [
                      { "type": "Heading", "props": { "text": "Dollhouse View", "level": 3, "sizeDesktop": "text-xl" } },
                      { "type": "RichText", "props": { "content": "<p>A unique bird's-eye perspective that allows users to understand the flow and volume of the entire structure seamlessly.</p>" } }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: "Section",
            props: {
              padding: "py-20",
              background: "bg-bg-primary",
              layout: "boxed",
              spacing: { "pt": "20", "pb": "40", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Heading",
                props: { "text": "Digital Twin Solutions", "level": 2, "sizeDesktop": "md:text-3xl", "align": "text-center" }
              },
              {
                type: "GridBox",
                props: { "columnsDesktop": "md:grid-cols-3", "gap": 32 },
                children: [
                  {
                    type: "DecorativeFrame",
                    props: { "borderWidth": 1, "borderColor": "rgba(255,255,255,0.05)", "padding": 24 },
                    children: [
                      { "type": "Heading", "props": { "text": "Essential Tour", "level": 3, "sizeDesktop": "text-lg" } },
                      { "type": "RichText", "props": { "content": "<h4>$299/start</h4><ul><li>Up to 2,500 sq.ft.</li><li>3 Months Hosting</li><li>10 Mattertags</li></ul>" } }
                    ]
                  },
                  {
                    type: "DecorativeFrame",
                    props: { "borderWidth": 2, "borderColor": "#c87a53", "padding": 24 },
                    children: [
                      { "type": "Heading", "props": { "text": "Professional Twin", "level": 3, "sizeDesktop": "text-lg", "accent": true } },
                      { "type": "RichText", "props": { "content": "<h4>$449/start</h4><ul><li>Up to 5,000 sq.ft.</li><li>6 Months Hosting</li><li>Floor Plan Included</li><li>Unlimited Mattertags</li></ul>" } }
                    ]
                  },
                  {
                    type: "DecorativeFrame",
                    props: { "borderWidth": 1, "borderColor": "rgba(255,255,255,0.05)", "padding": 24 },
                    children: [
                      { "type": "Heading", "props": { "text": "Industrial Scale", "level": 3, "sizeDesktop": "text-lg" } },
                      { "type": "RichText", "props": { "content": "<h4>CUSTOM</h4><ul><li>Large Scale Commercial</li><li>BIM & Autodesk Integration</li><li>Asset Tracking Solutions</li></ul>" } }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        root: { "props": { "title": "Virtual Tours Spatial Layout", "layoutMode": "one-panel" } }
      }
    },
    {
      name: "Aerial Photography & Drone Operations",
      category: "Media Showcase",
      description: "Expansive layout strategy for striking drone viewpoints and commercial features with custom Columns and Section spacing.",
      previewImage: "copper",
      puckData: {
        content: [
          {
            type: "Section",
            props: {
              padding: "py-32",
              background: "bg-charcoal text-white",
              layout: "boxed",
              spacing: { "pt": "48", "pb": "32", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Heading",
                props: {
                  text: "THE SKY IS NO LONGER THE LIMIT.",
                  level: 1,
                  sizeDesktop: "md:text-6xl",
                  accent: true
                }
              },
              {
                type: "RichText",
                props: {
                  content: "<p>Cinematic aerial storytelling for luxury estates and commercial developments. Captured in 4K with FAA-certified precision.</p>",
                  size: "lg"
                }
              }
            ]
          },
          {
            type: "Section",
            props: {
              padding: "py-16",
              background: "bg-bg-secondary",
              layout: "boxed",
              spacing: { "pt": "0", "pb": "24", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Columns",
                props: { "leftColumnWidth": 60, "gap": 32 },
                children: [
                  {
                    type: "DecorativeFrame",
                    props: { "borderWidth": 1, "borderColor": "rgba(255,255,255,0.05)", "padding": 32 },
                    children: [
                      { "type": "Heading", "props": { "text": "ULTRA-HD 4K OPTICS", "level": 3, "sizeDesktop": "md:text-2xl" } },
                      { "type": "RichText", "props": { "content": "<p>Our fleet utilizes Hasselblad sensors and advanced gimbal stabilization to deliver razor-sharp 4K video and 20MP stills with 14 stops of dynamic range. Perfect for dramatic aerial detail and atmospheric twilight captures.</p>", "size": "base" } }
                    ]
                  },
                  {
                    type: "FlexBox",
                    props: { "direction": "flex-col", "gap": 16 },
                    children: [
                      {
                        type: "DecorativeFrame",
                        props: { "borderWidth": 1, "borderColor": "rgba(255,255,255,0.05)", "padding": 20 },
                        children: [
                          { "type": "Heading", "props": { "text": "FAA CERTIFIED", "level": 3, "sizeDesktop": "text-xl", "accent": true } },
                          { "type": "RichText", "props": { "content": "<p>Part 107 licensed pilots ensuring fully compliant and insured flights in any airspace.</p>" } }
                        ]
                      },
                      {
                        type: "DecorativeFrame",
                        props: { "borderWidth": 0, "borderColor": "transparent", "padding": 20 },
                        children: [
                          { "type": "Heading", "props": { "text": "ADVANCED FLEET", "level": 3, "sizeDesktop": "text-xl" } },
                          { "type": "RichText", "props": { "content": "<p>From agile FPV systems to heavy-lift cinematic tracking platforms.</p>" } }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: "Section",
            props: {
              padding: "py-20",
              background: "bg-bg-primary",
              layout: "boxed",
              spacing: { "pt": "24", "pb": "24", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Columns",
                props: { "leftColumnWidth": 50, "gap": 48 },
                children: [
                  {
                    type: "Image",
                    props: {
                      imageUrl: "screen_4.jpg",
                      aspectRatio: "aspect-video",
                      objectFit: "cover"
                    }
                  },
                  {
                    type: "FlexBox",
                    props: { "direction": "flex-col", "justify": "justify-center", "gap": 16 },
                    children: [
                      { "type": "Heading", "props": { "text": "RESIDENTIAL LUXURY", "level": 2, "sizeDesktop": "md:text-3xl" } },
                      { "type": "RichText", "props": { "content": "<p>Give potential buyers a true sense of place. Our residential drone services highlight not just the home, but its relationship to the landscape, neighborhood, and local amenities.</p><ul><li>Twilight Exterior Elevations</li><li>Proximity & Neighborhood Mapping</li><li>Dynamic Orbit & Tracking Shots</li></ul>" } }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        root: { "props": { "title": "Aerial Photography Layout", "layoutMode": "one-panel" } }
      }
    },
    {
      name: "Floor Plans & Layouts Template",
      category: "Media Showcase",
      description: "Clean technical breakdown utilizing asymmetric Columns, a metadata grid highlighting accuracy, and a sequential process layout.",
      previewImage: "slate",
      puckData: {
        content: [
          {
            type: "Section",
            props: {
              padding: "py-24",
              background: "bg-charcoal text-white",
              layout: "boxed",
              spacing: { "pt": "40", "pb": "24", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Heading",
                props: {
                  text: "Visualizing space with technical elegance.",
                  level: 1,
                  sizeDesktop: "md:text-5xl",
                  accent: true
                }
              },
              {
                type: "RichText",
                props: {
                  content: "<p>Clean, high-fidelity floor plans that bridge the gap between imagination and reality. From detailed 2D layouts to immersive 3D visualizations.</p>",
                  size: "lg"
                }
              }
            ]
          },
          {
            type: "Section",
            props: {
              padding: "py-16",
              background: "bg-bg-primary",
              layout: "boxed",
              spacing: { "pt": "0", "pb": "32", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "GridBox",
                props: {
                  columnsDesktop: "md:grid-cols-2",
                  gap: 40,
                  spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" }
                },
                children: [
                  {
                    type: "DecorativeFrame",
                    props: { "borderWidth": 1, "borderColor": "rgba(255,255,255,0.05)", "padding": 24 },
                    children: [
                      { "type": "Heading", "props": { "text": "Schematic 2D Layouts", "level": 3, "sizeDesktop": "md:text-2xl" } },
                      { "type": "RichText", "props": { "content": "<p>Perfect for standard listings. Crisp black and white or color-coded diagrams including precise measurements, room labels, and total square footage.</p><ul><li>Laser-Accurate Measurements</li><li>Custom Branding Options</li><li>PDF & High-Res JPG Delivery</li></ul>", "size": "base" } }
                    ]
                  },
                  {
                    type: "DecorativeFrame",
                    props: { "borderWidth": 1, "borderColor": "rgba(255,255,255,0.05)", "padding": 24 },
                    children: [
                      { "type": "Heading", "props": { "text": "Immersive 3D Visuals", "level": 3, "sizeDesktop": "md:text-2xl" } },
                      { "type": "RichText", "props": { "content": "<p>Elevate your presentation with volumetric renders. Helping buyers visualize the flow and volume of the property with realistic textures and lighting.</p><ul><li>Full Furniture Staging</li><li>Lighting & Texture Realism</li><li>Multiple Perspective Angles</li></ul>", "size": "base" } }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: "Section",
            props: {
              padding: "py-20",
              background: "bg-bg-secondary",
              layout: "boxed",
              spacing: { "pt": "24", "pb": "40", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Heading",
                props: { "text": "Technical precision, delivered fast.", "level": 2, "sizeDesktop": "md:text-3xl", "align": "text-center" }
              },
              {
                type: "GridBox",
                props: { "columnsDesktop": "md:grid-cols-3", "gap": 24 },
                children: [
                  {
                    type: "FlexBox",
                    props: { "direction": "flex-col", "gap": 12 },
                    children: [
                      { "type": "Heading", "props": { "text": "01 / Capture", "level": 4, "sizeDesktop": "text-lg", "accent": true } },
                      { "type": "RichText", "props": { "content": "<p>We use high-precision LiDAR and photogrammetry to scan every inch of the property during our visit.</p>" } }
                    ]
                  },
                  {
                    type: "FlexBox",
                    props: { "direction": "flex-col", "gap": 12 },
                    children: [
                      { "type": "Heading", "props": { "text": "02 / Process", "level": 4, "sizeDesktop": "text-lg", "accent": true } },
                      { "type": "RichText", "props": { "content": "<p>Our architectural draftsmen convert raw data into clean, formatted plans with 99.5% measurement accuracy.</p>" } }
                    ]
                  },
                  {
                    type: "FlexBox",
                    props: { "direction": "flex-col", "gap": 12 },
                    children: [
                      { "type": "Heading", "props": { "text": "03 / Deliver", "level": 4, "sizeDesktop": "text-lg", "accent": true } },
                      { "type": "RichText", "props": { "content": "<p>Receive your print-ready and web-optimized files via our secure client portal within 24 hours.</p>" } }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        root: { "props": { "title": "Floor Plans & Renders Layout", "layoutMode": "one-panel" } }
      }
    },
    {
      name: "Packages & Pricing Template",
      category: "Pricing & Services",
      description: "High-fidelity packages layout with standard Section components, Headings, RichTexts, and structured GridBox layouts comparing plans, plus an interactive custom calculator.",
      previewImage: "emerald",
      puckData: {
        content: [
          {
            type: "Section",
            props: {
              padding: "py-16",
              background: "bg-charcoal text-white",
              layout: "boxed",
              spacing: { "pt": "40", "pb": "0", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Heading",
                props: {
                  text: "INVESTMENT",
                  level: 4,
                  sizeDesktop: "text-[10px] tracking-[0.4em] text-brick-copper",
                  align: "text-center",
                  accent: true,
                  styles: "text-center opacity-80"
                }
              },
              {
                type: "Heading",
                props: {
                  text: "High-Fidelity Packages",
                  level: 1,
                  sizeDesktop: "md:text-6xl text-4xl",
                  sizeMobile: "text-4xl",
                  align: "text-center",
                  tracking: "tracking-tight",
                  accent: false,
                  spacing: { "pt": "8", "pb": "16", "mt": "0", "mb": "0" }
                }
              },
              {
                type: "RichText",
                props: {
                  content: "<p style='text-align: center;'>Elevating real estate through cinematic visual storytelling. Select a curated tier below or coordinate a bespoke production layout tailored exactly to your listing timeline.</p>",
                  size: "lg",
                  tracking: "tracking-normal",
                  maxWidth: "max-w-2xl",
                  spacing: { "pt": "0", "pb": "32", "mt": "0", "mb": "0" },
                  styles: "mx-auto text-white/60"
                }
              }
            ]
          },
          {
            type: "Section",
            props: {
              padding: "py-16",
              background: "bg-bg-primary",
              layout: "boxed",
              spacing: { "pt": "0", "pb": "40", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "GridBox",
                props: {
                  columnsDesktop: "md:grid-cols-3",
                  columnsMobile: "grid-cols-1",
                  gap: 32,
                  spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" }
                },
                children: [
                  {
                    type: "DecorativeFrame",
                    props: {
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.05)",
                      padding: 32,
                      spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" },
                      styles: "bg-[#111111]/90 hover:border-white/10 transition-all duration-300 flex flex-col justify-between h-full"
                    },
                    children: [
                      {
                        type: "Heading",
                        props: { "text": "ENTRY TIER", "level": 4, "sizeDesktop": "text-[10px] tracking-widest text-[#c87a53]", "accent": true }
                      },
                      {
                        type: "Heading",
                        props: { "text": "Essential", "level": 2, "sizeDesktop": "text-2xl font-light text-white mt-1", "accent": false }
                      },
                      {
                        type: "RichText",
                        props: { 
                          content: "<h3><span style='font-size: 2.5rem; font-family: monospace; font-weight: bold; color: white;'>$495</span> <span style='font-size: 10px; tracking: 0.1em; color: rgba(255,255,255,0.4); text-transform: uppercase;'>/ PROJECT</span></h3><ul class='space-y-4 mt-8 mb-8'><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/70 font-medium'>25 Professional Interior Photos</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/70 font-medium'>3 Aerial Drone Stills</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/70 font-medium'>2D Schematic Floor Plan</span></li><li class='flex items-center gap-3 opacity-30'><svg class='w-4 h-4 text-white/20 shrink-0' fill='none' stroke='currentColor' stroke-width='2.5' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M10 18a8 8 0 100-16 8 8 0 000 16zm-3-7h6'></path></svg><span class='text-xs text-white/50 line-through'>3D Matterport Tour</span></li></ul>", 
                          size: "base" 
                        }
                      },
                      {
                        type: "Button",
                        props: { "link": { "type": "internal", "url": "contact", "label": "SELECT PACKAGE" }, "variant": "outline", "align": "center", "styles": "w-full border-white/10 hover:border-transparent text-white hover:text-black py-2.5 transition-all text-xs tracking-widest font-semibold mt-auto" }
                      }
                    ]
                  },
                  {
                    type: "DecorativeFrame",
                    props: {
                      borderWidth: 2,
                      borderColor: "#c87a53",
                      padding: 32,
                      spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" },
                      styles: "bg-[#111111] shadow-[0_0_50px_rgba(200,122,83,0.12)] border-[#c87a53] relative flex flex-col justify-between h-full group"
                    },
                    children: [
                      {
                        type: "Heading",
                        props: { "text": "PRODUCTION STANDARD", "level": 4, "sizeDesktop": "text-[10px] tracking-widest text-[#c87a53]", "accent": true }
                      },
                      {
                        type: "Heading",
                        props: { "text": "Professional", "level": 2, "sizeDesktop": "text-2xl font-light text-white mt-1", "accent": false }
                      },
                      {
                        type: "RichText",
                        props: { 
                          content: "<h3><span style='font-size: 2.5rem; font-family: monospace; font-weight: bold; color: white;'>$850</span> <span style='font-size: 10px; tracking: 0.1em; color: rgba(255,255,255,0.4); text-transform: uppercase;'>/ PROJECT</span></h3><ul class='space-y-4 mt-8 mb-8'><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/80 font-semibold'>40 High-End Interior Photos</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/80 font-semibold'>10 Aerial Drone 4K Stills</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/80 font-semibold'>2D & 3D Interactive Floor Plans</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/80 font-semibold'>Matterport 3D Tour (6 Months)</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/80 font-semibold'>Social Media Teaser Video</span></li></ul>", 
                          size: "base" 
                        }
                      },
                      {
                        type: "Button",
                        props: { "link": { "type": "internal", "url": "contact", "label": "BOOK NOW" }, "variant": "solid", "align": "center", "styles": "w-full bg-[#c87a53] hover:bg-white text-black hover:text-black py-2.5 transition-all text-xs tracking-widest font-extrabold" }
                      }
                    ]
                  },
                  {
                    type: "DecorativeFrame",
                    props: {
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.05)",
                      padding: 32,
                      spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" },
                      styles: "bg-[#111111]/90 hover:border-white/10 transition-all duration-300 flex flex-col justify-between h-full"
                    },
                    children: [
                      {
                        type: "Heading",
                        props: { "text": "LUXURY SUITE", "level": 4, "sizeDesktop": "text-[10px] tracking-widest text-[#c87a53]", "accent": true }
                      },
                      {
                        type: "Heading",
                        props: { "text": "Elite", "level": 2, "sizeDesktop": "text-2xl font-light text-white mt-1", "accent": false }
                      },
                      {
                        type: "RichText",
                        props: { 
                          content: "<h3><span style='font-size: 2.5rem; font-family: monospace; font-weight: bold; color: white;'>$1,450</span> <span style='font-size: 10px; tracking: 0.1em; color: rgba(255,255,255,0.4); text-transform: uppercase;'>/ PROJECT</span></h3><ul class='space-y-4 mt-8 mb-8'><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/70 font-medium'>Unlimited Multi-Flash Interior Photos</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/70 font-medium'>Aerial 4K Cinematic Video (60s)</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/70 font-medium'>Premium Dollhouse 3D Render</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/70 font-medium'>Full Walkthrough Cinematic Film</span></li><li class='flex items-center gap-3'><svg class='w-4 h-4 text-[#c87a53] shrink-0' fill='none' stroke='currentColor' stroke-width='3' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg><span class='text-xs text-white/70 font-medium'>Twilight Session Included</span></li></ul>", 
                          size: "base" 
                        }
                      },
                      {
                        type: "Button",
                        props: { "link": { "type": "internal", "url": "contact", "label": "SELECT PACKAGE" }, "variant": "outline", "align": "center", "styles": "w-full border-white/10 hover:border-transparent text-white hover:text-black py-2.5 transition-all text-xs tracking-widest font-semibold mt-auto" }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: "Section",
            props: {
              padding: "py-8",
              background: "bg-transparent",
              layout: "full",
              spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "HTMLEmbed",
                props: {
                  wrapInIframe: false,
                  title: "Interactive Calculator block",
                  width: "full",
                  spacing: { "pt": "0", "pb": "32", "mt": "0", "mb": "0" },
                  html: `<section class='py-12 bg-[#080808]/40 font-sans border border-white/5 max-w-6xl mx-auto px-6 rounded-md'>
  <div class='relative overflow-hidden transition-all duration-300'>
    
    <!-- Top Title and Total -->
    <div class='flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8 mb-8'>
      <div>
        <h2 class='text-3xl font-light text-white tracking-tight mb-2'>Build Your Own</h2>
        <p class='text-xs text-white/40 font-light'>Tailor our services to your specific project needs.</p>
      </div>
      <div class='flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0'>
        <span class='text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold leading-none text-right'>ESTIMATED<br>TOTAL</span>
        <span id='calc-total' class='text-4xl md:text-5xl font-mono text-[#c87a53] font-light'>$0</span>
      </div>
    </div>

    <!-- Grid of Selection Cards -->
    <div class='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
      <!-- Card 1 -->
      <div class='calc-card group bg-[#161616]/40 border border-white/5 p-6 cursor-pointer hover:border-white/15 transition-all duration-300 relative select-none rounded-[3px]' data-price='150' data-selected='false'>
        <!-- Icon Holder -->
        <div class='text-white/40 group-hover:text-white transition-colors mb-6'>
          <svg class='w-8 h-8' fill='none' stroke='currentColor' stroke-width='1.2' viewBox='0 0 24 24'>
            <path stroke-linecap='round' stroke-linejoin='round' d='M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z' />
            <path stroke-linecap='round' stroke-linejoin='round' d='M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z' />
          </svg>
        </div>
        <h3 class='text-[10px] font-bold tracking-wider text-white/50 uppercase mb-1 font-sans'>STILL PHOTOGRAPHY</h3>
        <p class='text-[11px] text-white/30 mb-6'>Base 15 Photos</p>
        <span class='text-base font-mono text-white/80 font-medium'>$150</span>
      </div>

      <!-- Card 2 -->
      <div class='calc-card group bg-[#161616]/40 border border-white/5 p-6 cursor-pointer hover:border-white/15 transition-all duration-300 relative select-none rounded-[3px]' data-price='200' data-selected='false'>
        <!-- Icon Holder -->
        <div class='text-white/40 group-hover:text-white transition-colors mb-6'>
          <svg class='w-8 h-8' fill='none' stroke='currentColor' stroke-width='1.2' viewBox='0 0 24 24'>
            <path stroke-linecap='round' stroke-linejoin='round' d='M12 18a6 6 0 100-12 6 6 0 000 12zM21 12h-3M6 12H3M12 3v3M12 18v3' />
            <path stroke-linecap='round' stroke-linejoin='round' d='M18.364 5.636l-2.122 2.122M7.757 16.243l-2.121 2.121M18.364 18.364l-2.122-2.122M7.757 7.757l-2.121-2.121' />
          </svg>
        </div>
        <h3 class='text-[10px] font-bold tracking-wider text-white/50 uppercase mb-1 font-sans'>DRONE COVERAGE</h3>
        <p class='text-[11px] text-white/30 mb-6'>Aerial Stills + Video</p>
        <span class='text-base font-mono text-white/80 font-medium'>$200</span>
      </div>

      <!-- Card 3 -->
      <div class='calc-card group bg-[#161616]/40 border border-white/5 p-6 cursor-pointer hover:border-white/15 transition-all duration-300 relative select-none rounded-[3px]' data-price='125' data-selected='false'>
        <!-- Icon Holder -->
        <div class='text-white/40 group-hover:text-white transition-colors mb-6'>
          <svg class='w-8 h-8' fill='none' stroke='currentColor' stroke-width='1.2' viewBox='0 0 24 24'>
            <path stroke-linecap='round' stroke-linejoin='round' d='M4 19h16M4 14h12M4 9h8M4 4h4' />
          </svg>
        </div>
        <h3 class='text-[10px] font-bold tracking-wider text-white/50 uppercase mb-1 font-sans'>FLOOR PLANS</h3>
        <p class='text-[11px] text-white/30 mb-6'>2D Laser Measured</p>
        <span class='text-base font-mono text-white/80 font-medium'>$125</span>
      </div>

      <!-- Card 4 -->
      <div class='calc-card group bg-[#161616]/40 border border-white/5 p-6 cursor-pointer hover:border-white/15 transition-all duration-300 relative select-none rounded-[3px]' data-price='300' data-selected='false'>
        <!-- Icon Holder -->
        <div class='text-white/40 group-hover:text-white transition-colors mb-6'>
          <svg class='w-8 h-8' fill='none' stroke='currentColor' stroke-width='1.2' viewBox='0 0 24 24'>
            <path stroke-linecap='round' stroke-linejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
            <path stroke-linecap='round' stroke-linejoin='round' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
          </svg>
        </div>
        <h3 class='text-[10px] font-bold tracking-wider text-white/50 uppercase mb-1 font-sans'>3D VIRTUAL TOUR</h3>
        <p class='text-[11px] text-white/30 mb-6'>Matterport Hosting</p>
        <span class='text-base font-mono text-white/80 font-medium'>$300</span>
      </div>
    </div>

    <!-- Action Button -->
    <div class='flex justify-center mt-12'>
      <button id='calc-submit-btn' class='px-8 py-3 bg-[#1d1d1d] hover:bg-[#c87a53] hover:text-black text-white/90 border border-white/10 hover:border-transparent text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer rounded-sm hover:scale-[1.02]'>
        GENERATE CUSTOM QUOTE
      </button>
    </div>

  </div>

  <script>
    (function() {
      // Find elements contextual to this block
      const containerSelector = '.calc-card';
      const cards = document.querySelectorAll(containerSelector);
      const totalDisplay = document.getElementById('calc-total');
      const submitBtn = document.getElementById('calc-submit-btn');
      
      let selectedTotal = 0;
      
      cards.forEach(card => {
        card.addEventListener('click', function() {
          const isSelected = this.getAttribute('data-selected') === 'true';
          const price = parseInt(this.getAttribute('data-price') || '0', 10);
          
          if (isSelected) {
            this.setAttribute('data-selected', 'false');
            this.classList.remove('border-[#c87a53]', 'shadow-[0_0_20px_rgba(200,122,83,0.12)]', 'bg-[#c87a53]/5');
            this.classList.add('border-white/5', 'bg-[#161616]/40');
            const icon = this.querySelector('div');
            if (icon) {
              icon.classList.remove('text-[#c87a53]');
              icon.classList.add('text-white/40');
            }
            selectedTotal -= price;
          } else {
            this.setAttribute('data-selected', 'true');
            this.classList.remove('border-white/5', 'bg-[#161616]/40');
            this.classList.add('border-[#c87a53]', 'shadow-[0_0_20px_rgba(200,122,83,0.12)]', 'bg-[#c87a53]/5');
            const icon = this.querySelector('div');
            if (icon) {
              icon.classList.remove('text-white/40');
              icon.classList.add('text-[#c87a53]');
            }
            selectedTotal += price;
          }
          
          if (totalDisplay) {
            totalDisplay.textContent = '$' + selectedTotal;
          }
          
          if (submitBtn) {
            if (selectedTotal > 0) {
              submitBtn.classList.remove('bg-[#1d1d1d]', 'text-white/90', 'border-white/10');
              submitBtn.classList.add('bg-[#c87a53]', 'text-black', 'border-transparent');
            } else {
              submitBtn.classList.remove('bg-[#c87a53]', 'text-black', 'border-transparent');
              submitBtn.classList.add('bg-[#1d1d1d]', 'text-white/90', 'border-white/10');
            }
          }
        });
      });

      if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (selectedTotal === 0) {
            alert('Please select at least one custom service to configure your package recipe.');
            return;
          }
          
          const selectedServices = [];
          document.querySelectorAll('.calc-card[data-selected="true"]').forEach(c => {
            const h3 = c.querySelector('h3');
            if (h3) selectedServices.push(h3.textContent.trim());
          });
          
          // Render a custom elegant popup modal safely on the document body
          const alertOverlay = document.createElement('div');
          alertOverlay.className = 'fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans';
          alertOverlay.style.zIndex = '999999';
          alertOverlay.innerHTML = \`
            <div class="bg-[#121212] border border-[#c87a53]/25 p-8 max-w-sm w-full md:max-w-md relative rounded-lg text-center shadow-[0_0_30px_rgba(200,122,83,0.1)]">
              <div class="w-12 h-12 bg-[#c87a53]/15 rounded-full flex items-center justify-center text-[#c87a53] mx-auto mb-4 font-bold">✓</div>
              <h4 class="text-lg font-medium text-white mb-2">Quote Generated Successfully</h4>
              <p class="text-xs text-white/50 mb-6 leading-relaxed">
                Your custom service menu has been configured. The estimated cost for your package recipe is:
              </p>
              <div class="text-3xl font-mono text-[#c87a53] font-black mb-6">
                $\${selectedTotal}
              </div>
              <div class="space-y-2 mb-6 text-left bg-black/50 p-4 border border-white/5 rounded-sm max-h-40 overflow-y-auto">
                \${selectedServices.map(s => '<div class="text-[10px] text-white/70 font-mono tracking-wider">• ' + s + '</div>').join('')}
              </div>
              <div class="flex gap-3">
                <button id="close-calc-modal" class="flex-1 py-2.5 bg-[#202020] hover:bg-[#303030] text-white text-[10px] tracking-widest uppercase font-bold transition-all border border-white/5 cursor-pointer rounded-sm">
                  Refine Specs
                </button>
                <button id="calc-proceed-lead" class="flex-1 py-2.5 bg-[#c87a53] hover:bg-white text-black transition-all text-[10px] tracking-widest uppercase font-black cursor-pointer rounded-sm">
                  Lock & Book
                </button>
              </div>
            </div>
          \`;
          document.body.appendChild(alertOverlay);
          
          document.getElementById('close-calc-modal').addEventListener('click', () => {
            alertOverlay.remove();
          });
          
          document.getElementById('calc-proceed-lead').addEventListener('click', () => {
            alertOverlay.remove();
            const bookingSec = document.getElementById('booking') || document.querySelector('[id*="booking"]') || document.querySelector('[class*="booking"]') || document.getElementById('contact');
            if (bookingSec) {
              bookingSec.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.location.hash = '#booking';
            }
          });
        });
      }
    })();
  </script>
</section>`
                }
              }
            ]
          }
        ],
        root: {
          props: {
            title: "Investment Packages",
            layoutMode: "one-panel"
          }
        }
      }
    },
    {
      name: "Home Page (The Hub)",
      category: "Core Business",
      description: "Default premium homepage. Incorporates top cinematic intro banner, architectural services, portfolio, and active booking section.",
      previewImage: "indigo",
      puckData: {
        content: [],
        root: {
          props: {
            title: "Home Page",
            side: [
              {
                type: "TextContent",
                props: {
                  id: "brand-header-hub",
                  title1: "EXPOSED",
                  title2: "BRICK",
                  accent: "MEDIA",
                  tagline: "HIGH-FIDELITY ARCHITECTURAL NARRATIVES"
                }
              }
            ],
            main: [
              {
                type: "MediaBackground",
                props: {
                  id: "hero-hub",
                  mediaUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                  mediaType: "image",
                  height: "h-[80vh] min-h-[600px]",
                  overlayOpacity: 20,
                  content: []
                }
              },
              {
                type: "Services",
                props: {
                  id: "services-hub",
                  title: "Editorial Real Estate Services",
                  subtitle: "Visual marketing assets produced in absolute fidelity.",
                  width: "full"
                }
              },
              {
                type: "Portfolio",
                props: {
                  id: "portfolio-hub",
                  variant: "grid",
                  panel: "main",
                  showFilter: true,
                  width: "full"
                }
              },
              {
                type: "Testimonials",
                props: {
                  id: "testimonials-hub",
                  maxItems: 5,
                  width: "full"
                }
              },
              {
                type: "Contact",
                props: {
                  id: "contact-hub",
                  title: "Let's Capture Your Spatial Narrative",
                  width: "full"
                }
              },
              {
                type: "Footer",
                props: {
                  id: "footer-hub",
                  quote: "Exposed Brick Media - Setting a new standard in architectural content."
                }
              }
            ]
          }
        }
      }
    },
    {
      name: "About Us (The Story)",
      category: "Core Business",
      description: "Narrative-driven layout highlighting your team's background, equipment highlights, and testimonial carousels.",
      previewImage: "slate",
      puckData: {
        content: [],
        root: {
          props: {
            title: "About Us",
            side: [
              {
                type: "TextContent",
                props: {
                  id: "brand-header-about",
                  title1: "OUR",
                  title2: "STORY",
                  accent: "MEDIA",
                  tagline: "CREATIVE CRAFT AND MAJESTY"
                }
              }
            ],
            main: [
              {
                type: "Heading",
                props: {
                  id: "heading-about",
                  text: "Crafting the Narrative of Luxury Spaces",
                  level: 1,
                  align: "center",
                  tracking: "normal",
                  lineHeight: "normal",
                  accent: true,
                  width: "full"
                }
              },
              {
                type: "RichText",
                props: {
                  id: "text-about-core",
                  content: "Exposed Brick Media is built on a passion for spatial design, lighting mastery, and cinematic narratives. We capture architectural works with absolute structural and aesthetic fidelity.",
                  size: "lg",
                  tracking: "normal",
                  maxWidth: "max-w-2xl",
                  width: "full"
                }
              },
              {
                type: "Testimonials",
                props: {
                  id: "testimonials-about",
                  maxItems: 3,
                  width: "full"
                }
              },
              {
                type: "Footer",
                props: {
                  id: "footer-about",
                  quote: "We don't just outline spaces. We frame your brand legacy."
                }
              }
            ]
          }
        }
      }
    },
    {
      name: "Property Tour Portfolio",
      category: "Media Showcase",
      description: "Highly visual media layout ideal for showcasing luxury estates, incorporating hero sections and media placeholders.",
      previewImage: "copper",
      puckData: {
        content: [],
        root: {
          props: {
            title: "Property Portfolio",
            side: [
              {
                type: "TextContent",
                props: {
                  id: "brand-header-portfolio",
                  title1: "LUXURY",
                  title2: "WORKS",
                  accent: "BRICK",
                  tagline: "ESTATES & SEAMLESS TOURS"
                }
              }
            ],
            main: [
              {
                type: "MediaBackground",
                props: {
                  id: "hero-portfolio",
                  mediaUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
                  mediaType: "image",
                  height: "h-[50vh] min-h-[400px]",
                  overlayOpacity: 20,
                  content: []
                }
              },
              {
                type: "Heading",
                props: {
                  id: "heading-portfolio",
                  text: "Featured Architectural Marvels",
                  level: 2,
                  align: "center",
                  accent: true,
                  width: "full"
                }
              },
              {
                type: "Portfolio",
                props: {
                  id: "portfolio-portfolio-item",
                  variant: "gallery",
                  panel: "main",
                  showFilter: true,
                  width: "full"
                }
              },
              {
                type: "Footer",
                props: {
                  id: "footer-portfolio",
                  quote: "Architectural fidelity meets narrative mastery."
                }
              }
            ]
          }
        }
      }
    }
  ];

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
        if (items.length === 0) {
          // If the template database is completely empty, seed the initial set
          const seededItems: PuckTemplateItem[] = [];
          for (const preset of seedPresets) {
            const docId = preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
          setTemplates(seededItems.length > 0 ? seededItems : seedPresets.map((p, idx) => ({ id: `seed-${idx}`, createdAt: new Date().toISOString(), ...p })) as any);
        } else {
          // Display the stored templates as is - any deleted ones will stay deleted!
          setTemplates(items);
        }
      } else {
        setTemplates(items.length === 0 ? seedPresets.map((p, idx) => ({ id: `seed-${idx}`, createdAt: new Date().toISOString(), ...p })) as any : items);
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

  // Handler to load template to Puck Editor
  const handleLoadTemplate = (templateData: any) => {
    setEditorData(sanitizeLayout(cleanObject(templateData), page?.title || settings.brandName || "Page"));
    setPuckVersion(v => v + 1);
    setIsPickerOpen(false);
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
                </div>
                <button 
                  onClick={() => setIsPickerOpen(false)}
                  className="text-white/40 hover:text-white transition-colors p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {pickerTab === "browse" ? (
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
            ) : (
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
