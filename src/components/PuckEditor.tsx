/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Puck, usePuck, createUsePuck } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { createConfig, BASELINE_LAYOUT } from "../lib/puck.config";
import { useSiteContent } from "../lib/SiteContentContext";
import { db } from "../lib/firebase";
import { doc, setDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { useState, useMemo, useEffect, useRef } from "react";
import { Save, X, Loader2, RotateCcw, LayoutGrid, FileText, Check, Folder, Info, Plus, Undo2, Redo2 } from "lucide-react";
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
      name: "Interior Photography",
      category: "Media Showcase",
      description: "Editorial-grade interior capture utilizing ambient light mastery and exposure blending for flawless, balanced interior scenes.",
      previewImage: "slate",
      puckData: {
        content: [],
        root: {
          props: {
            title: "Interior Photography",
            side: [
              {
                type: "TextContent",
                props: {
                  id: "brand-header-interior",
                  title1: "INTERIOR",
                  title2: "SPACES",
                  accent: "MEDIA",
                  tagline: "PREMIUM INTERIOR PHOTOGRAPHY"
                }
              }
            ],
            main: [
              {
                type: "MediaBackground",
                props: {
                  id: "interior-hero",
                  mediaUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=80",
                  mediaType: "image",
                  height: "h-[80vh] min-h-[600px]",
                  overlayOpacity: 40,
                  content: [
                    {
                      type: "FlexBox",
                      props: {
                        id: "interior-hero-flex",
                        direction: "flex-col",
                        align: "items-center",
                        justify: "justify-center",
                        gap: 24,
                        content: [
                          {
                            type: "Heading",
                            props: {
                              id: "interior-hero-heading",
                              text: "Premium Interior Photography",
                              level: 1,
                              align: "center",
                              accent: false,
                              width: "full",
                              styles: "text-white"
                            }
                          },
                          {
                            type: "RichText",
                            props: {
                              id: "interior-hero-sub",
                              content: "Make buyers fall in love before they even step inside. We capture the true flow, light, and atmosphere of every home.",
                              size: "lg",
                              width: "full",
                              styles: "text-white/80 text-center"
                            }
                          },
                          {
                            type: "Button",
                            props: {
                              id: "interior-hero-cta",
                              link: { type: "internal", url: "#booking", label: "Book a Shoot" },
                              variant: "solid",
                              align: "center"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              },
              {
                type: "Heading",
                props: {
                  id: "interior-value-heading",
                  text: "Scroll-Stopping Images That Drive Showings",
                  level: 2,
                  align: "left",
                  accent: true,
                  width: "full"
                }
              },
              {
                type: "RichText",
                props: {
                  id: "interior-value-text",
                  content: "In today's digital-first market, your listing photos are the actual first showing. Bad lighting and distorted angles drive buyers away. Our magazine-quality interior photography ensures your property stands out in a crowded MLS feed.\n\n• True-to-Life Colors\n• Crystal Clear Window Views\n• Distortion-Free Angles",
                  size: "lg",
                  width: "full"
                }
              },
              {
                type: "Heading",
                props: {
                  id: "interior-diff-heading",
                  text: "The Exposed Brick Difference",
                  level: 3,
                  align: "center",
                  accent: false,
                  width: "full"
                }
              },
              {
                type: "RichText",
                props: {
                  id: "interior-diff-text",
                  content: "We don't just 'point and shoot.' We use advanced lighting and editing techniques to produce high-end architectural imagery for every listing.\n\n• Flambient Blending\n• Magazine Retouching\n• Detail & Vignette Shots",
                  size: "base",
                  width: "full"
                }
              },
              {
                type: "DynamicGallery",
                props: {
                  id: "interior-gallery",
                  title: "Capturing Every Space",
                  subtitle: "See how we highlight the best features of different rooms in a home.",
                  layout: "bento",
                  aspectRatio: "4/3",
                  images: [
                    {
                      url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
                      portfolioTitle: "Living Spaces",
                      category: "Interior"
                    },
                    {
                      url: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1200&q=80",
                      portfolioTitle: "Kitchens & Dining",
                      category: "Interior"
                    },
                    {
                      url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
                      portfolioTitle: "Lifestyle Details",
                      category: "Details"
                    }
                  ],
                  width: "full"
                }
              },
              {
                type: "Contact",
                props: {
                  id: "interior-booking",
                  title: "Ready to elevate your listing?",
                  width: "full"
                }
              },
              {
                type: "Footer",
                props: {
                  id: "interior-footer",
                  quote: "Premium real estate media services designed to help agents win more listings and sell homes faster."
                }
              }
            ]
          }
        }
      }
    },
    {
      name: "3D Virtual Tours",
      category: "Media Showcase",
      description: "Immersive 3D Matterport captures allowing interactive navigation and responsive dollhouse perspective tours.",
      previewImage: "indigo",
      puckData: {
        content: [],
        root: {
          props: {
            title: "3D Virtual Tours",
            side: [
              {
                type: "TextContent",
                props: {
                  id: "brand-header-tours",
                  title1: "VIRTUAL",
                  title2: "TOURS",
                  accent: "3D",
                  tagline: "INTERACTIVE DIGITAL TWINS"
                }
              }
            ],
            main: [
              {
                type: "MediaBackground",
                props: {
                  id: "tours-hero",
                  mediaUrl: "https://images.unsplash.com/photo-1558442074-3c1985715e09?auto=format&fit=crop&w=1920&q=80",
                  mediaType: "image",
                  height: "h-[80vh] min-h-[600px]",
                  overlayOpacity: 40,
                  content: [
                    {
                      type: "FlexBox",
                      props: {
                        id: "tours-hero-flex",
                        direction: "flex-col",
                        align: "items-center",
                        justify: "justify-center",
                        gap: 24,
                        content: [
                          {
                            type: "Heading",
                            props: {
                              id: "tours-hero-heading",
                              text: "Immersive 3D Virtual Tours",
                              level: 1,
                              align: "center",
                              accent: false,
                              width: "full",
                              styles: "text-white"
                            }
                          },
                          {
                            type: "RichText",
                            props: {
                              id: "tours-hero-sub",
                              content: "Host a 24/7 open house. Let buyers walk through the property, measure spaces, and fall in love from anywhere in the world.",
                              size: "lg",
                              width: "full",
                              styles: "text-white/80 text-center"
                            }
                          },
                          {
                            type: "Button",
                            props: {
                              id: "tours-hero-cta",
                              link: { type: "internal", url: "#booking", label: "Book a Scan" },
                              variant: "solid",
                              align: "center"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              },
              {
                type: "Heading",
                props: {
                  id: "tours-value-heading",
                  text: "Qualify Leads Before They Even Arrive",
                  level: 2,
                  align: "left",
                  accent: true,
                  width: "full"
                }
              },
              {
                type: "RichText",
                props: {
                  id: "tours-value-text",
                  content: "Photos spark interest, but a 3D tour creates certainty. By allowing potential buyers to virtually walk through a home, you eliminate unnecessary showings and ensure that the buyers who do walk through the front door are serious, qualified, and already in love with the layout.\n\n• The 24/7 Open House\n• Win More Listings\n• Attract Relocating Buyers",
                  size: "lg",
                  width: "full"
                }
              },
              {
                type: "TourEmbed",
                props: {
                  id: "tours-embed",
                  url: "https://my.matterport.com/show/?m=your_tour_id_here",
                  height: 600,
                  width: "full"
                }
              },
              {
                type: "Heading",
                props: {
                  id: "tours-specs-heading",
                  text: "Included with Every Scan",
                  level: 3,
                  align: "center",
                  accent: false,
                  width: "full"
                }
              },
              {
                type: "RichText",
                props: {
                  id: "tours-specs-text",
                  content: "Everything you need to market the property's layout in one package.\n\n• Dollhouse View\n• Mobile Optimized\n• Fast Turnaround\n• MLS & Zillow Sync",
                  size: "base",
                  width: "full"
                }
              },
              {
                type: "Contact",
                props: {
                  id: "tours-booking",
                  title: "Ready to digitize your listing?",
                  width: "full"
                }
              },
              {
                type: "Footer",
                props: {
                  id: "tours-footer",
                  quote: "Premium real estate media services designed to help agents win more listings and sell homes faster."
                }
              }
            ]
          }
        }
      }
    },
    {
      name: "Aerial & Drone Photography",
      category: "Media Showcase",
      description: "High-resolution aerial vistas and cinematic drone flyovers capturing property context.",
      previewImage: "copper",
      puckData: {
        content: [],
        root: {
          props: {
            title: "Aerial & Drone Photography",
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
                type: "MediaBackground",
                props: {
                  id: "aerial-hero",
                  mediaUrl: "https://images.unsplash.com/photo-1506126279646-a697353d3166?auto=format&fit=crop&q=80",
                  mediaType: "image",
                  height: "h-[80vh] min-h-[600px]",
                  overlayOpacity: 40,
                  content: [
                    {
                      type: "FlexBox",
                      props: {
                        id: "aerial-hero-flex",
                        direction: "flex-col",
                        align: "items-center",
                        justify: "justify-center",
                        gap: 24,
                        content: [
                          {
                            type: "Heading",
                            props: {
                              id: "aerial-hero-heading",
                              text: "Aerial & Drone Photography",
                              level: 1,
                              align: "center",
                              accent: false,
                              width: "full",
                              styles: "text-white"
                            }
                          },
                          {
                            type: "RichText",
                            props: {
                              id: "aerial-hero-sub",
                              content: "Elevate your listings above the competition. Showcase lot sizes, property boundaries, and neighborhood context with breathtaking drone imagery.",
                              size: "lg",
                              width: "full",
                              styles: "text-white/80 text-center"
                            }
                          },
                          {
                            type: "Button",
                            props: {
                              id: "aerial-hero-cta",
                              link: { type: "internal", url: "#booking", label: "Book a Shoot" },
                              variant: "solid",
                              align: "center"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              },
              {
                type: "Heading",
                props: {
                  id: "aerial-value-heading",
                  text: "Highlighting What Ground Photos Can't",
                  level: 2,
                  align: "left",
                  accent: true,
                  width: "full"
                }
              },
              {
                type: "RichText",
                props: {
                  id: "aerial-value-text",
                  content: "A standard eye-level photo tells a fraction of the story. Drone media provides the critical context that luxury and rural property buyers demand before booking a showing.\n\n• Showcase Lot Size & Boundaries\n• Neighborhood Amenities\n• Unobstructed Angles",
                  size: "lg",
                  width: "full"
                }
              },
              {
                type: "Heading",
                props: {
                  id: "aerial-specs-heading",
                  text: "Professional Drone Services",
                  level: 3,
                  align: "center",
                  accent: false,
                  width: "full"
                }
              },
              {
                type: "RichText",
                props: {
                  id: "aerial-specs-text",
                  content: "We utilize state-of-the-art DJI drone platforms to deliver crisp, cinematic, and legally compliant aerial media for your listings.\n\n• High-Res Stills (20+ megapixel photos)\n• Licensed & Insured (Transport Canada certified)\n• Cinematic 4K Video",
                  size: "base",
                  width: "full"
                }
              },
              {
                type: "DynamicGallery",
                props: {
                  id: "aerial-gallery",
                  title: "Aerial Add-Ons & Styles",
                  subtitle: "Customize your aerial shoot to fit the unique selling points of the property.",
                  layout: "grid",
                  aspectRatio: "16/9",
                  images: [
                    {
                      url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80",
                      portfolioTitle: "Standard Aerials",
                      category: "Aerial"
                    },
                    {
                      url: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?auto=format&fit=crop&q=80",
                      portfolioTitle: "Property Outlines",
                      category: "Graphics"
                    },
                    {
                      url: "https://images.unsplash.com/photo-1563456382029-79ad30950130?auto=format&fit=crop&q=80",
                      portfolioTitle: "Video B-Roll",
                      category: "Video"
                    }
                  ],
                  width: "full"
                }
              },
              {
                type: "Contact",
                props: {
                  id: "aerial-booking",
                  title: "Ready to elevate your listing?",
                  width: "full"
                }
              },
              {
                type: "Footer",
                props: {
                  id: "aerial-footer",
                  quote: "Premium real estate media services designed to help agents win more listings and sell homes faster."
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

      if (isAdmin) {
        const seededList: PuckTemplateItem[] = [...items];
        for (const preset of seedPresets) {
          const docId = preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const existing = items.find(item => item.id === docId);
          
          if (!existing) {
            const docRef = doc(db, "puck_templates", docId);
            const newDoc = { ...preset, createdAt: serverTimestamp() };
            try {
              await setDoc(docRef, newDoc);
              seededList.push({ id: docId, ...newDoc } as any);
            } catch (wErr) {
              console.warn("Could not seed preset into firestore:", wErr);
            }
          }
        }
        setTemplates(seededList);
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
