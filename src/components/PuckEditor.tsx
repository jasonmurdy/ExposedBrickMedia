/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Puck } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { createConfig, BASELINE_LAYOUT } from "../lib/puck.config";
import { useSiteContent } from "../lib/SiteContentContext";
import { db } from "../lib/firebase";
import { doc, setDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { useState, useMemo, useEffect } from "react";
import { Save, X, Loader2, RotateCcw, LayoutGrid, FileText, Check, Folder, Info, Plus } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firestoreError";
import { sanitizeLayout } from "../lib/sanitizeLayout";

export interface PuckTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  previewImage?: string;
  puckData: any;
  createdAt: any;
}

export const PuckEditor = ({ pageId, onClose }: { pageId?: string; onClose: () => void }) => {
  const { settings, pages, isLight, portfolioItems, partners, teams, brandResources, isAdmin } = useSiteContent();
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
  const initialData = useMemo(() => {
    const rawData = page?.layout && (page.layout.content?.length > 0 || page.layout.zones)
      ? page.layout
      : (!currentPageId && settings.layout && (settings.layout.content?.length > 0 || settings.layout.zones))
        ? settings.layout 
        : BASELINE_LAYOUT;
    return sanitizeLayout(cleanObject(rawData), page?.title || settings.brandName || "Page");
  }, [page, currentPageId, settings.layout, settings.brandName]);

  const [editorData, setEditorData] = useState<any>(initialData);

  // Update editorData when initialData changes (e.g. changing pageId)
  useMemo(() => {
    setEditorData(initialData);
  }, [initialData]);

  // Pre-seeded local templates for seeding
  const seedPresets: Omit<PuckTemplateItem, "id" | "createdAt">[] = [
    {
      name: "Aerial & Drone Photography",
      category: "Media Showcase",
      description: "Advanced aerial drone portfolio template page. Includes a professional cinematic intro banner, top-down perspective insights, bento gallery with property boundaries, and a lead capture footer.",
      previewImage: "copper",
      puckData: {
        content: [],
        root: {
          props: {
            title: "Aerial Photography",
            side: [
              {
                type: "TextContent",
                props: { 
                  id: "brand-header-aerial",
                  title1: "AERIAL",
                  title2: "DRONE",
                  accent: "MEDIA",
                  tagline: "ELEVATED PROPERTY PERSPECTIVES"
                }
              }
            ],
            main: [
              {
                type: "CinematicHero",
                props: {
                  id: "aerial-hero",
                  title: "Aerial & Drone Photography",
                  subtitle: "Elevate your listings above the competition. Showcase lot sizes, property boundaries, and neighborhood context with breathtaking drone imagery.",
                  mediaUrl: "https://images.unsplash.com/photo-1506126279646-a697353d3166?auto=format&fit=crop&q=80&w=2000",
                  mediaType: "image",
                  ctaText: "Request Quote / Book Shoot",
                  ctaUrl: "#booking"
                }
              },
              {
                type: "Heading",
                props: {
                  id: "aerial-section-heading",
                  text: "Highlighting What Ground Photos Can't",
                  level: 2,
                  align: "center",
                  accent: true,
                  width: "full"
                }
              },
              {
                type: "RichText",
                props: {
                  id: "aerial-section-intro",
                  content: "A standard eye-level photo tells a fraction of the story. Drone media provides the critical context that luxury and rural property buyers demand before booking a showing. Perfect for large acreages, farms, or deep suburban lots.",
                  size: "lg",
                  maxWidth: "800px",
                  width: "full"
                }
              },
              {
                type: "DynamicGallery",
                props: {
                  id: "aerial-gallery",
                  title: "Exquisite Aerial Perspectives",
                  subtitle: "A selection of top-down property boundaries, b-roll layouts, and high-resolution vistas.",
                  layout: "bento",
                  aspectRatio: "16/9",
                  grayscaleEffect: "hover-color",
                  lightbox: true,
                  images: [
                    { url: "https://images.unsplash.com/photo-1512100251789-c4fb505291b5?auto=format&fit=crop&q=80&w=1200", alt: "Suburban Acreage aerial boundary" },
                    { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200", alt: "Estate vista with sunset backdrop" },
                    { url: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?auto=format&fit=crop&q=80&w=1200", alt: "Top-down geometric property outline" },
                    { url: "https://images.unsplash.com/photo-1563456382029-79ad30950130?auto=format&fit=crop&q=80&w=1200", alt: "Waterfront estate layout" }
                  ],
                  width: "full"
                }
              },
              {
                type: "Contact",
                props: {
                  id: "aerial-booking",
                  title: "Schedule Your Drone Flyover",
                  width: "full"
                }
              },
              {
                type: "Footer",
                props: {
                  id: "aerial-footer",
                  quote: "Exposed Brick Media - Fully licensed & transport-compliant commercial drone capture."
                }
              }
            ]
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
                type: "Hero",
                props: { 
                  id: "hero-hub",
                  height: "tall",
                  width: "full",
                  imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
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
                  maxWidth: "800px",
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
                type: "Hero",
                props: { 
                  id: "hero-portfolio",
                  height: "medium",
                  width: "full",
                  imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
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
    },
    {
      name: "Tiered Coaching & Packages",
      category: "Pricing & Services",
      description: "Designed to compare your premium and essential services in a structured visual layout.",
      previewImage: "emerald",
      puckData: {
        content: [],
        root: {
          props: {
            title: "Services and Packages",
            side: [
              {
                type: "TextContent",
                props: { 
                  id: "brand-header-pricing",
                  title1: "SELECT",
                  title2: "PACK",
                  accent: "BRICK",
                  tagline: "TIERED PRICING AND MEDIA FEES"
                }
              }
            ],
            main: [
              {
                type: "Heading",
                props: { 
                  id: "heading-pricing-top",
                  text: "Pricing Plans & Packages",
                  level: 2,
                  align: "center",
                  accent: true,
                  width: "full"
                }
              },
              {
                type: "Services",
                props: { 
                  id: "services-pricing-table",
                  title: "Coaching & Production Packages",
                  subtitle: "Choose the standard tier built for scaling your visual property exposure.",
                  width: "full"
                }
              },
              {
                type: "Contact",
                props: { 
                  id: "contact-pricing",
                  title: "Enquire About Bespoke Plans",
                  width: "full"
                }
              },
              {
                type: "Footer",
                props: { 
                  id: "footer-pricing",
                  quote: "Flexible packages constructed for real estate listings, architects, and designers."
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

      if (items.length === 0) {
        if (isAdmin) {
          // Auto-seed presets for Admin
          console.log("No templates found in FireStore. Seeding defaults...");
          const seededList: PuckTemplateItem[] = [];
          for (const preset of seedPresets) {
            const docId = preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const docRef = doc(db, "puck_templates", docId);
            const newDoc = {
              ...preset,
              createdAt: serverTimestamp()
            };
            try {
              await setDoc(docRef, newDoc);
              seededList.push({ id: docId, ...newDoc } as any);
            } catch (writeErr: any) {
              console.warn(`Failed to seed preset '${preset.name}' into firestore:`, writeErr);
              // Safe fallback for this preset item locally
              seededList.push({
                id: docId,
                createdAt: new Date().toISOString(),
                ...preset
              } as any);
            }
          }
          setTemplates(seededList);
        } else {
          // Non-admin: Fallback and display local presets in read-only mode, without writing to DB
          setTemplates(seedPresets.map((p, idx) => ({
            id: `seed-preset-${idx}`,
            createdAt: new Date().toISOString(),
            ...p
          })) as PuckTemplateItem[]);
        }
      } else {
        setTemplates(items);
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
    if (!templateName.trim()) return;

    setIsSavingTemplate(true);
    try {
      const docId = `template-${Date.now()}`;
      const docRef = doc(db, "puck_templates", docId);
      
      const newTemplate = {
        name: templateName,
        category: templateCategory,
        description: templateDescription || "Custom user-generated page layout template.",
        previewImage: selectedImgPlaceholder,
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
      alert("Failed to save layout as template: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Handler to load template to Puck Editor
  const handleLoadTemplate = (templateData: any) => {
    setEditorData(sanitizeLayout(cleanObject(templateData), page?.title || settings.brandName || "Page"));
    setPuckVersion(v => v + 1);
    setIsPickerOpen(false);
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPickerOpen(true)}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] tracking-widest font-medium uppercase text-white transition-all flex items-center gap-2"
          >
            <LayoutGrid size={12} className="text-brick-copper" />
            Load Layout Template
          </button>
          <button
            onClick={() => {
              setTemplateName(page ? `Template: ${page.title}` : "Template: Home Layout");
              setIsSaverOpen(true);
            }}
            className="px-4 py-1.5 bg-brick-copper text-charcoal font-bold hover:bg-white transition-all text-[10px] tracking-widest uppercase flex items-center gap-2"
          >
            <Save size={12} />
            Save as Template
          </button>
          
          <div className="h-4 w-px bg-white/15 mx-2" />

          <button 
            onClick={onClose}
            className="px-4 py-2 border border-white/5 hover:border-white/20 text-off-white/60 hover:text-white transition-colors uppercase text-[10px] tracking-widest"
          >
            Exit Editor
          </button>
        </div>
      </div>

      <div className={`flex-grow overflow-hidden relative puck-container bg-bg-primary text-text-primary ${isLight ? 'light' : ''}`}>
        <Puck
          key={`${currentPageId || 'home'}-v${puckVersion}`}
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

      {/* --- TEMPLATE PICKER MODAL --- */}
      {isPickerOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[500] p-4 animate-fade-in">
          <div className="bg-charcoal border border-white/10 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-white">
            {/* Header */}
            <div className="p-6 border-b border-white/15 flex justify-between items-center">
              <div>
                <h3 className="font-display text-xl text-brick-copper italic">Page Template Selector</h3>
                <p className="text-xs text-white/50 mt-1">Select a visual template layout to replace current workspace content.</p>
              </div>
              <button 
                onClick={() => setIsPickerOpen(false)}
                className="text-white/40 hover:text-white transition-colors p-2"
              >
                <X size={20} />
              </button>
            </div>

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
                      <div className={`h-36 bg-gradient-to-br ${getPlaceholderBg(template.previewImage)} p-4 flex flex-col justify-between relative overflow-hidden`}>
                        {/* Overlay Accent Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_24px]" />
                        
                        <div className="flex justify-between items-start z-10">
                          <span className="bg-charcoal/90 border border-white/10 text-[9px] uppercase tracking-widest text-brick-copper px-2 py-0.5 font-mono">
                            {template.category}
                          </span>
                          <span className="text-[9px] text-white/35 font-mono">
                            {formatTemplateDate(template.createdAt)}
                          </span>
                        </div>
                        <div className="z-10">
                          <h4 className="font-display text-lg text-white group-hover:text-brick-copper transition-colors font-semibold">
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
                          <span className="text-[9px] text-white/45 uppercase tracking-widest flex items-center gap-1">
                            <Info size={10} className="text-brick-copper" />
                            Puck Layout
                          </span>
                          <button
                            onClick={() => handleLoadTemplate(template.puckData)}
                            className="bg-brick-copper/90 hover:bg-white text-charcoal font-bold text-[9px] tracking-widest uppercase px-4 py-1.5 transition-all flex items-center gap-1.5"
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

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsPickerOpen(false)}
                className="px-4 py-2 border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-xs uppercase tracking-widest transition-colors font-medium"
              >
                Cancel
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
