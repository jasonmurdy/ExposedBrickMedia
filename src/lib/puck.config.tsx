/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { 
  MoveUpRight, 
  Shield, 
  User, 
  Globe, 
  Mail, 
  Phone, 
  Download, 
  FileText, 
  Box as BoxIcon,
  Bold, 
  Italic, 
  Underline, 
  Link as LinkIcon, 
  Link2Off,
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Quote, 
  Palette, 
  Type,
  ChevronDown,
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  RefreshCw,
  Eye,
  Trash,
  Camera,
  Plane,
  Check,
  Minus,
  Layers,
  Circle,
  Ban
} from "lucide-react";
import { Config } from "@measured/puck";
import { HeroVisual, BrandHeader } from "../components/Hero";
import { Portfolio, Services } from "../components/PortfolioSections";
import { BookingForm, FooterContent } from "../components/BookingAndFooter";
import { TestimonialCarousel } from "../components/TestimonialCarousel";
import { PropertyHighlight, TourEmbed } from "../components/PropertyFeatures";
import { LogoCloud, InstagramFeed } from "../components/SocialNodes";
import { LinkButton } from "../components/LinkButton";
import { Button as ShadcnButton } from "../components/ui/button";

import { FileUpload } from "../components/FileUpload";
import { PDFViewer } from "../components/PDFViewer";
import { DynamicCuratedGallery } from "../components/DynamicCuratedGallery";

// Reusable Elementor-style Spacing Control
const SpacingControl = {
  type: "custom" as const,
  render: ({ name, value, onChange }: any) => {
    const val = value || { pt: "0", pb: "0", mt: "0", mb: "0" };
    return (
      <div className="grid grid-cols-2 gap-3 text-[10px] p-3 bg-charcoal/80 border border-white/5 rounded-sm">
        <div className="space-y-1">
          <label className="text-white/40 uppercase tracking-tighter block font-black">Pad Top (px)</label>
          <input 
            className="w-full bg-[#151515] border border-white/5 p-2 text-white outline-none focus:border-brick-copper transition-colors font-mono" 
            type="number"
            value={val.pt} 
            onChange={(e) => onChange({ ...val, pt: e.target.value })} 
          />
        </div>
        <div className="space-y-1">
          <label className="text-white/40 uppercase tracking-tighter block font-black">Pad Bot (px)</label>
          <input 
            className="w-full bg-[#151515] border border-white/5 p-2 text-white outline-none focus:border-brick-copper transition-colors font-mono" 
            type="number"
            value={val.pb} 
            onChange={(e) => onChange({ ...val, pb: e.target.value })} 
          />
        </div>
        <div className="space-y-1">
          <label className="text-white/40 uppercase tracking-tighter block font-black">Mar Top (px)</label>
          <input 
            className="w-full bg-[#151515] border border-white/5 p-2 text-white outline-none focus:border-brick-copper transition-colors font-mono" 
            type="number"
            value={val.mt} 
            onChange={(e) => onChange({ ...val, mt: e.target.value })} 
          />
        </div>
        <div className="space-y-1">
          <label className="text-white/40 uppercase tracking-tighter block font-black">Mar Bot (px)</label>
          <input 
            className="w-full bg-[#151515] border border-white/5 p-2 text-white outline-none focus:border-brick-copper transition-colors font-mono" 
            type="number"
            value={val.mb} 
            onChange={(e) => onChange({ ...val, mb: e.target.value })} 
          />
        </div>
      </div>
    );
  }
};

// Helper component to wrap elements with the spacing
const SpacingWrapper = ({ spacing, children, className = "", style = {}, id }: { spacing: any, children: React.ReactNode, className?: string, style?: React.CSSProperties, id?: string }) => (
  <div 
    id={id}
    style={{
      paddingTop: spacing?.pt ? `${spacing.pt}px` : undefined,
      paddingBottom: spacing?.pb ? `${spacing.pb}px` : undefined,
      marginTop: spacing?.mt ? `${spacing.mt}px` : undefined,
      marginBottom: spacing?.mb ? `${spacing.mb}px` : undefined,
      ...style
    }} 
    className={className}
  >
    {children}
  </div>
);

const InlineHTML = ({ html, height }: { html: string, height?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear and set HTML
    containerRef.current.innerHTML = html;
    
    // Find all scripts inside the injected HTML
    const scripts = Array.from(containerRef.current.querySelectorAll('script'));
    
    // Re-create and append scripts to force execution
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      
      // Copy attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy content if inline
      if (oldScript.innerHTML) {
        newScript.innerHTML = oldScript.innerHTML;
      }
      
      // Replace old script with new one
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [html]);

  return (
    <div 
      ref={containerRef}
      className="w-full overflow-hidden" 
      style={height ? { height: `${height}px`, overflowY: 'auto' } : {}}
    />
  );
};

export type PuckConfig = {
  root: {
    title?: string;
    description?: string;
    ogImage?: string;
    layoutMode?: "one-panel" | "two-panel";
    main?: React.ReactNode;
    side?: React.ReactNode;
  };
  components: {
    Section: {
      spacing: any;
      padding: string;
      background: "bg-transparent" | "bg-bg-primary" | "bg-bg-secondary" | "bg-charcoal text-white";
      bgImage?: string;
      overlayOpacity: number;
      blur: number;
      parallax: boolean;
      gradientDirection: string;
      anchorId?: string;
      layout: "boxed" | "full" | "bleed";
      children?: React.ReactNode;
      styles?: string;
    };
    DecorativeFrame: {
      spacing: any;
      borderWidth: number;
      borderColor: string;
      borderRadius: number;
      padding: number;
      styles?: string;
      entranceAnimation?: string;
      children?: React.ReactNode;
    };
    DynamicGrid: {
      collection: "portfolio" | "pages";
      limit: number;
      columns: 2 | 3 | 4;
      staggerDelay: number;
      spacing?: any;
      entranceAnimation?: string;
    };
    FlexBox: {
      direction: string;
      align: string;
      justify: string;
      gap: number;
      wrap: string;
      content?: React.ReactNode;
      spacing?: any;
    };
    GridBox: {
      columnsDesktop: string;
      columnsMobile: string;
      gap: number;
      content?: React.ReactNode;
      spacing?: any;
    };
    MediaBackground: {
      mediaUrl: string;
      mediaType: "video" | "image";
      overlayOpacity: number;
      height: string;
      content?: React.ReactNode;
      spacing?: any;
    };
    Image: {
      imageUrl: string;
      aspectRatio: string;
      objectFit: "cover" | "contain";
      borderRadius: string;
      width: "full" | "half";
      spacing?: any;
      visibility?: string;
      styles?: string;
    };
    Columns: {
      leftColumnWidth: number;
      gap: number;
      left?: React.ReactNode;
      right?: React.ReactNode;
      spacing?: any;
      entranceAnimation?: string;
    };
    Heading: {
      text: string;
      level: 1 | 2 | 3 | 4;
      sizeDesktop: string;
      sizeMobile: string;
      align: "text-left" | "text-center" | "text-right" | "left" | "center" | "right";
      tracking: string;
      lineHeight: string;
      accent: boolean;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
      visibility?: string;
      styles?: string;
    };
    RichText: {
      content: string;
      size: "sm" | "base" | "lg";
      tracking: string;
      maxWidth: string;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
      visibility?: string;
      styles?: string;
    };
    Hero: {
      imageUrl?: string;
      height: "short" | "medium" | "tall";
      width: "full" | "half";
      cta: {
        type: "internal" | "external";
        url: string;
        label: string;
      };
      spacing?: any;
      entranceAnimation?: string;
    };
    TextContent: {
      title1: string;
      title2: string;
      accent: string;
      tagline: string;
      showLogo?: boolean;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    Portfolio: {
      variant: "grid" | "gallery";
      panel?: "main" | "side";
      limit?: number;
      showFilter: boolean;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    Services: {
      title: string;
      subtitle: string;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    Contact: {
      title: string;
      description?: string;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    Footer: {
      quote: string;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    Spacer: {
      size: number;
      width: "full" | "half";
      spacing?: any;
    };
    Testimonials: {
      maxItems: number;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    MediaEmbed: {
      url: string;
      mediaType: "image" | "video";
      widthPercentage: number;
      aspectRatio: "16/9" | "4/3" | "1/1" | "9/16" | "4/5";
      objectFit: "cover" | "contain";
      autoPlay?: boolean;
      loop?: boolean;
      muted?: boolean;
      showControls?: boolean;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
      styles?: string;
      customHeight?: number;
    };
    PropertyHighlight: {
      mediaUrl: string;
      mediaType: "image" | "video";
      autoPlay?: boolean;
      daysOnMarket: number;
      salePrice: string;
      listPrice: string;
      packageUsed: string;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    TourEmbed: {
      url: string;
      height: number;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    LogoCloud: {
      logos: { url: string; alt: string; link?: string }[];
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    InstagramFeed: {
      username: string;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    HTMLEmbed: {
      html: string;
      height?: number;
      title?: string;
      wrapInIframe: boolean;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    Button: {
      link: {
        type: "internal" | "external";
        url: string;
        label: string;
      };
      variant: "solid" | "outline" | "underline";
      align: "left" | "center" | "right";
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
      styles?: string;
    };
    PartnerShowcase: {
      partnerId: string;
      layout: "profile" | "card";
      showAssets: boolean;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    BrandGallery: {
      title: string;
      category?: string;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    PDFReader: {
      url: string;
      title?: string;
      height?: number;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    DynamicGallery: {
      title?: string;
      subtitle?: string;
      images: Array<{
        url: string;
        portfolioId: string;
        portfolioTitle: string;
        category?: string;
      }>;
      layout: "masonry" | "grid" | "bento" | "carousel";
      columns: number;
      aspectRatio: "16/9" | "4/3" | "1/1" | "portrait" | "auto";
      grayscaleEffect: "none" | "hover-color" | "always-grayscale";
      lightbox: boolean;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
    ServicePackages: {
      sectionLabel?: string;
      title?: string;
      subtitle?: string;
      packages: Array<{
        name: string;
        tierLabel?: string;
        price: string;
        billingUnit: string;
        featuresText: string;
        buttonText: string;
        isPopular?: boolean;
        customLink?: string;
      }>;
      byoHeading?: string;
      byoSubtitle?: string;
      byoItems: Array<{
        id: string;
        title: string;
        description: string;
        price: number;
        iconName: "camera" | "plane" | "stairs" | "box" | "video" | "home";
      }>;
      byoButtonText: string;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
  };
};

const MediaPickerComponent = React.memo(({ value, onChange, portfolioItems }: any) => {
  const selectedImages = value || [];
  const [isOpen, setIsOpen] = React.useState(false);
  const [limit, setLimit] = React.useState(24);
  const [filterCategory, setFilterCategory] = React.useState("All");

  const allAppMedia = React.useMemo(() => {
    const pool: Array<{ url: string; portfolioId: string; portfolioTitle: string; category?: string }> = [];
    const seenUrls = new Set<string>();

    portfolioItems.forEach((item: any) => {
      if (item?.img && typeof item.img === "string") {
        const cleanUrl = item.img.trim();
        if (cleanUrl && !seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          pool.push({
            url: cleanUrl,
            portfolioId: item.id || "",
            portfolioTitle: item.title || "Untitled Project",
            category: item.category || "General"
          });
        }
      }

      if (Array.isArray(item?.gallery)) {
        item.gallery.forEach((gImg: any) => {
          if (gImg && typeof gImg === "string") {
            const cleanUrl = gImg.trim();
            if (cleanUrl && !seenUrls.has(cleanUrl)) {
              seenUrls.add(cleanUrl);
              pool.push({
                url: cleanUrl,
                portfolioId: item.id || "",
                portfolioTitle: item.title || "Untitled Project",
                category: item.category || "General"
              });
            }
          }
        });
      }
    });

    return pool;
  }, [portfolioItems]);

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    allAppMedia.forEach(m => {
      if (m.category) cats.add(m.category);
    });
    return ["All", ...Array.from(cats)];
  }, [allAppMedia]);

  const [localSearch, setLocalSearch] = React.useState("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch);
      setLimit(24);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const filteredPool = React.useMemo(() => {
    return allAppMedia.filter(m => {
      const matchSearch = 
        m.portfolioTitle.toLowerCase().includes(search.toLowerCase()) ||
        (m.category && m.category.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = filterCategory === "All" || m.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [allAppMedia, search, filterCategory]);

  const paginatedPool = React.useMemo(() => {
    return filteredPool.slice(0, limit);
  }, [filteredPool, limit]);

  const toggleSelection = (media: any) => {
    const exists = selectedImages.some((img: any) => img.url === media.url);
    if (exists) {
      onChange(selectedImages.filter((img: any) => img.url !== media.url));
    } else {
      onChange([...selectedImages, media]);
    }
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newList = [...selectedImages];
    const targetIndex = index + (direction === "up" ? -1 : 1);
    if (targetIndex >= 0 && targetIndex < newList.length) {
      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;
      onChange(newList);
    }
  };

  const removeItem = (url: string) => {
    onChange(selectedImages.filter((img: any) => img.url !== url));
  };

  return (
    <div className="space-y-3 bg-[#181818] p-3 border border-white/5">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Curated Queue</span>
        <span className="text-[9px] bg-brick-copper/20 text-brick-copper px-1.5 py-0.5 font-mono font-black">
          {selectedImages.length} items
        </span>
      </div>

      {selectedImages.length > 0 ? (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 no-scrollbar">
          {selectedImages.map((img: any, idx: number) => (
            <div key={`${img.url}-${idx}`} className="flex items-center gap-1.5 bg-black/40 p-1 border border-white/5 rounded-sm">
              <img src={img.url} className="w-8 h-8 object-cover bg-black" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-white font-medium truncate leading-tight">{img.portfolioTitle}</p>
                <p className="text-[7px] text-white/40 truncate uppercase font-mono">{img.category || "General"}</p>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => moveItem(idx, "up")}
                  disabled={idx === 0}
                  className="p-1 px-1.5 text-[8px] text-white/40 hover:text-white disabled:opacity-20 select-none bg-white/5 border border-white/5"
                  type="button"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(idx, "down")}
                  disabled={idx === selectedImages.length - 1}
                  className="p-1 px-1.5 text-[8px] text-white/40 hover:text-white disabled:opacity-20 select-none bg-white/5 border-l-0 border-white/5"
                  type="button"
                >
                  ▼
                </button>
                <button
                  onClick={() => removeItem(img.url)}
                  className="p-1 px-1.5 text-[9px] text-red-400 hover:text-red-300 font-bold bg-white/5 border-l-0 border-white/5"
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-black/20 text-center border border-dashed border-white/5">
          <span className="text-[9px] text-white/30 italic font-mono">No media curated yet.</span>
        </div>
      )}

      <button
        onClick={() => {
          setIsOpen(true);
          setLimit(24);
        }}
        className="w-full bg-[#202020] border border-white/10 hover:border-brick-copper hover:text-brick-copper py-2 text-[10px] text-white transition-all font-black tracking-widest uppercase cursor-pointer"
        type="button"
      >
        Curate Gallery Media
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8">
          <div 
            className="w-full max-w-6xl h-[85vh] bg-[#151515] border border-white/10 flex flex-col shadow-2xl overflow-hidden rounded-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <div>
                <h3 className="font-display text-2xl italic text-white font-medium">
                  Curate Portfolio Media
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Pick images directly from project files. They will be sequenced in the order you select them.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all text-xl font-bold cursor-pointer border border-white/5"
                type="button"
              >
                ×
              </button>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-white/5 bg-black/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <input
                  className="w-full bg-black/40 border border-white/10 text-white placeholder-white/30 text-xs py-2 px-3 focus:outline-none focus:border-brick-copper transition-all"
                  placeholder="Search property title..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
                {localSearch && (
                  <button 
                    onClick={() => setLocalSearch("")} 
                    className="absolute right-2.5 top-1.5 text-white/30 hover:text-white font-bold"
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map((cat: string) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilterCategory(cat);
                      setLimit(24);
                    }}
                    className={`text-[9px] uppercase tracking-widest px-3 py-1.5 transition-all border shrink-0 ${filterCategory === cat ? "bg-brick-copper text-charcoal font-black border-brick-copper" : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20"}`}
                    type="button"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid vs Sidebar */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
              {/* Left media pool browser */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-[#161616] flex flex-col justify-between">
                <div>
                  {paginatedPool.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                      {paginatedPool.map((media) => {
                        const selectionIndex = selectedImages.findIndex((img: any) => img.url === media.url);
                        const isSelected = selectionIndex >= 0;

                        return (
                          <div
                            key={media.url}
                            onClick={() => toggleSelection(media)}
                            className={`group relative aspect-video bg-black/40 border transition-all duration-300 overflow-hidden cursor-pointer ${isSelected ? "border-brick-copper scale-[0.98]" : "border-white/5 hover:border-white/30"}`}
                          >
                            <img
                              src={media.url}
                              className={`w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-105 ${isSelected ? "opacity-90" : "opacity-70 group-hover:opacity-100"}`}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                            {isSelected ? (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-brick-copper text-charcoal rounded-full flex items-center justify-center font-mono text-[10px] font-black shadow-lg">
                                {selectionIndex + 1}
                              </div>
                            ) : (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                +
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                              <p className="text-[10px] text-white font-bold truncate">{media.portfolioTitle}</p>
                              <p className="text-[8px] text-brick-copper uppercase tracking-wider font-semibold">{media.category || "General"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-sm text-white/35 italic">No media items match your search filter.</p>
                    </div>
                  )}
                </div>

                {filteredPool.length > limit && (
                  <div className="mt-6 flex justify-center pb-4">
                    <button
                      onClick={() => setLimit(prev => prev + 24)}
                      className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] tracking-widest uppercase border border-white/10 hover:border-white/20 transition-all font-bold cursor-pointer"
                      type="button"
                    >
                      Load More Images ({filteredPool.length - limit} remaining)
                    </button>
                  </div>
                )}
              </div>

              {/* Right hand selection queue */}
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/5 bg-[#1a1a1a] flex flex-col h-60 lg:h-auto">
                <div className="px-4 py-3 bg-black/20 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Queue Setup</span>
                  <button
                    onClick={() => onChange([])}
                    className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-300 font-bold"
                    disabled={selectedImages.length === 0}
                    type="button"
                  >
                    Reset Queue
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
                  {selectedImages.length > 0 ? (
                    selectedImages.map((img: any, index: number) => (
                      <div key={`${img.url}-queue-${index}`} className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-sm relative">
                        <img src={img.url} className="w-10 h-10 object-cover bg-black flex-shrink-0" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-white font-bold truncate">{img.portfolioTitle}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] uppercase font-mono font-black text-brick-copper">{index + 1}</span>
                            <span className="text-[8px] text-white/40 truncate uppercase tracking-tight">{img.category || "General"}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(img.url)}
                          className="h-6 w-6 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded-full transition-all text-xs"
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-center p-4">
                      <p className="text-[10px] text-white/20 italic font-mono">Add images from the pool to build your sequence list.</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-black/20 border-t border-white/5">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-brick-copper hover:bg-white text-charcoal font-black text-[10px] tracking-widest uppercase py-2 transition-all cursor-pointer"
                    type="button"
                  >
                    Confirm Selection Setup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
MediaPickerComponent.displayName = "MediaPickerComponent";

export const createConfig = (pages: any[] = [], portfolioItems: any[] = [], partners: any[] = [], teams: any[] = [], brandResources: any[] = [], popups: any[] = []): Config<PuckConfig> => {
  const pageOptions = pages.map(p => ({ label: p.title || p.slug, value: p.slug }));
  const partnerOptions = partners.map(p => ({ label: p.displayName, value: p.id }));
  const popupOptions = popups.map(p => ({ id: p.id, label: p.title || p.headline || p.id, value: p.id }));
  
  const LinkField = {
    type: "custom" as const,
    render: ({ name, value, onChange }: any) => {
      const val = value || { type: 'internal', label: '', url: '' };
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ ...val, type: "internal" })}
              className={`flex-1 py-1 text-xs border ${val.type === "internal" ? "bg-brick-copper border-brick-copper text-charcoal font-bold" : "bg-transparent border-gray-600 text-gray-300"}`}
            >Internal</button>
            <button
              onClick={() => onChange({ ...val, type: "popup" })}
              className={`flex-1 py-1 text-xs border ${val.type === "popup" ? "bg-brick-copper border-brick-copper text-charcoal font-bold" : "bg-transparent border-gray-600 text-gray-300"}`}
            >Popup</button>
            <button
              onClick={() => onChange({ ...val, type: "external" })}
              className={`flex-1 py-1 text-xs border ${val.type === "external" ? "bg-brick-copper border-brick-copper text-charcoal font-bold" : "bg-transparent border-gray-600 text-gray-300"}`}
            >External</button>
          </div>
          <input
            className="w-full bg-[#202020] border-none p-2 text-xs text-white"
            placeholder="Button Label"
            value={val.label || ""}
            onChange={(e) => onChange({ ...val, label: e.target.value })}
          />
          {val.type === "internal" ? (
            <select
              className="w-full bg-[#202020] border-none p-2 text-xs text-white"
              value={val.url || ""}
              onChange={(e) => onChange({ ...val, url: e.target.value })}
            >
              <option value="">Select a page...</option>
              <option value="/">Home</option>
              {pageOptions.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          ) : val.type === "popup" ? (
            <select
              className="w-full bg-[#202020] border-none p-2 text-xs text-white"
              value={val.url || ""}
              onChange={(e) => onChange({ ...val, url: e.target.value })}
            >
              <option value="">Select a global popup...</option>
              {popupOptions.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          ) : (
            <input
              className="w-full bg-[#202020] border-none p-2 text-xs text-white"
              placeholder="https://"
              value={val.url || ""}
              onChange={(e) => onChange({ ...val, url: e.target.value })}
            />
          )}
        </div>
      );
    }
  };
  
  const WidthField = {
    type: "radio" as const,
    options: [
      { label: "Full Width", value: "full" },
      { label: "Half Width", value: "half" }
    ]
  };

  const EntranceAnimationField = {
    type: "select" as const,
    options: [
      { label: "None", value: "" },
      { label: "Fade In", value: "fade" },
      { label: "Slide Up", value: "slide-up" },
      { label: "Slide In Left", value: "slide-left" },
      { label: "Slide In Right", value: "slide-right" },
      { label: "Scale Up", value: "scale" }
    ]
  };

  const StylesField = {
    type: "textarea" as const,
  };

  const VisibilityField = {
    type: "select" as const,
    options: [
      { label: "Show Everywhere", value: "block" },
      { label: "Hide on Mobile", value: "hidden md:block" },
      { label: "Hide on Desktop", value: "block md:hidden" },
    ]
  };

  const WysiwygEditorField = {
    type: "custom" as const,
    render: ({ name, value, onChange }: any) => {
      const val = value || "";
      const containerRef = useRef<HTMLDivElement>(null);
      const lastEmittedValue = useRef<string>(value || "");

      // Synchronize content to contentEditable safely to avoid cursor jump
      useEffect(() => {
        if (containerRef.current && containerRef.current.innerHTML !== val) {
          // If the raw val matches our last emitted edit, skip update (prevents cursor reset)
          if (val === lastEmittedValue.current) {
            return;
          }
          containerRef.current.innerHTML = val;
          lastEmittedValue.current = val;
        }
      }, [val]);

      const execCommand = (command: string, arg: string = "") => {
        document.execCommand(command, false, arg);
        if (containerRef.current) {
          const newHtml = containerRef.current.innerHTML;
          lastEmittedValue.current = newHtml;
          onChange(newHtml);
        }
      };

      const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const text = e.currentTarget.innerHTML;
        lastEmittedValue.current = text;
        onChange(text);
      };

      const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        const text = e.currentTarget.innerHTML;
        lastEmittedValue.current = text;
        onChange(text);
      };

      return (
        <div className="space-y-2 p-3 bg-charcoal/90 border border-white/5 rounded-sm shadow-inner">
          {/* Custom Rich Text Toolbar */}
          <div className="flex flex-col gap-1.5 p-1.5 bg-black/40 rounded border border-white/5">
            {/* Font Config Selectors Row */}
            <div className="grid grid-cols-4 gap-1">
              {/* Font Style */}
              <select
                onChange={(e) => {
                  const tag = e.target.value;
                  if (tag) execCommand("formatBlock", tag);
                  e.target.value = "";
                }}
                className="text-[9px] uppercase tracking-widest bg-[#151515] border border-white/5 rounded text-white py-1 px-1.5 font-mono select-none focus:outline-none cursor-pointer hover:border-white/20 transition-colors"
                defaultValue=""
              >
                <option value="" disabled>Style</option>
                <option value="p">Paragraph</option>
                <option value="h1">H1 Title</option>
                <option value="h2">H2 Subtitle</option>
                <option value="h3">H3 Heading</option>
                <option value="h4">H4 Small</option>
                <option value="blockquote">Blockquote</option>
              </select>

              {/* Font Family */}
              <select
                onChange={(e) => {
                  const font = e.target.value;
                  if (font) execCommand("fontName", font);
                  e.target.value = "";
                }}
                className="text-[9px] uppercase tracking-widest bg-[#151515] border border-white/5 rounded text-white py-1 px-1.5 font-mono select-none focus:outline-none cursor-pointer hover:border-white/20 transition-colors"
                defaultValue=""
              >
                <option value="" disabled>Font</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Prata">Prata</option>
                <option value="Inter">Inter</option>
                <option value="Playfair Display">Playfair</option>
                <option value="monospace">Mono</option>
              </select>

              {/* Font Size */}
              <select
                onChange={(e) => {
                  const size = e.target.value;
                  if (size) execCommand("fontSize", size);
                  e.target.value = "";
                }}
                className="text-[9px] uppercase tracking-widest bg-[#151515] border border-white/5 rounded text-white py-1 px-1.5 font-mono select-none focus:outline-none cursor-pointer hover:border-white/20 transition-colors"
                defaultValue=""
              >
                <option value="" disabled>Size</option>
                <option value="1">Tiny (12px)</option>
                <option value="2">Small (14px)</option>
                <option value="3">Base (16px)</option>
                <option value="4">Large (18px)</option>
                <option value="5">XL (20px)</option>
                <option value="6">2XL (24px)</option>
                <option value="7">3XL (32px)</option>
              </select>

              {/* Text Color */}
              <select
                onChange={(e) => {
                  const color = e.target.value;
                  if (color) execCommand("foreColor", color);
                  e.target.value = "";
                }}
                className="text-[9px] uppercase tracking-widest bg-[#151515] border border-white/5 rounded text-white py-1 px-1.5 font-mono select-none focus:outline-none cursor-pointer hover:border-white/20 transition-colors"
                defaultValue=""
              >
                <option value="" disabled>Color</option>
                <option value="#A47149">Copper</option>
                <option value="#CBBB8D">Sand</option>
                <option value="#ffffff">White</option>
                <option value="#9ca3af">Gray</option>
                <option value="#1C1C1C">Charcoal</option>
              </select>
            </div>

            {/* Inline Formatting & Lists & Linking Operations Row */}
            <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-white/5">
              {/* Bold */}
              <button 
                type="button"
                onClick={() => execCommand("bold")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Bold (B)"
              >
                <Bold size={11} />
              </button>

              {/* Italic */}
              <button 
                type="button"
                onClick={() => execCommand("italic")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Italic (I)"
              >
                <Italic size={11} />
              </button>

              {/* Underline */}
              <button 
                type="button"
                onClick={() => execCommand("underline")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Underline (U)"
              >
                <Underline size={11} />
              </button>

              <div className="h-4 w-px bg-white/10 mx-0.5" />

              {/* Align Left */}
              <button 
                type="button"
                onClick={() => execCommand("justifyLeft")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Align Left"
              >
                <AlignLeft size={11} />
              </button>

              {/* Align Center */}
              <button 
                type="button"
                onClick={() => execCommand("justifyCenter")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Align Center"
              >
                <AlignCenter size={11} />
              </button>

              {/* Align Right */}
              <button 
                type="button"
                onClick={() => execCommand("justifyRight")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Align Right"
              >
                <AlignRight size={11} />
              </button>

              {/* Align Justify */}
              <button 
                type="button"
                onClick={() => execCommand("justifyFull")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Justify"
              >
                <AlignJustify size={11} />
              </button>

              <div className="h-4 w-px bg-white/10 mx-0.5" />

              {/* Unordered List */}
              <button 
                type="button"
                onClick={() => execCommand("insertUnorderedList")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Bullet List"
              >
                <List size={11} />
              </button>

              {/* Ordered List */}
              <button 
                type="button"
                onClick={() => execCommand("insertOrderedList")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Numbered List"
              >
                <ListOrdered size={11} />
              </button>

              <div className="h-4 w-px bg-white/10 mx-0.5" />

              {/* Create Link */}
              <button 
                type="button"
                onClick={() => {
                  const url = prompt("Enter complete URL:", "https://");
                  if (url) execCommand("createLink", url);
                }}
                className="px-2 h-6 flex items-center justify-center gap-1 bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white text-[9px] font-bold font-mono tracking-wide cursor-pointer active:scale-95"
                title="Insert Link"
              >
                <LinkIcon size={10} />
                <span>Link</span>
              </button>

              {/* Unlink */}
              <button 
                type="button"
                onClick={() => execCommand("unlink")}
                className="w-6 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white cursor-pointer active:scale-95"
                title="Remove Link"
              >
                <Link2Off size={11} />
              </button>

              {/* Clear Formatting / Reset */}
              <button 
                type="button"
                onClick={() => execCommand("removeFormat")}
                className="ml-auto px-2 h-6 flex items-center justify-center bg-[#151515] border border-white/5 rounded hover:bg-brick-copper hover:text-charcoal transition-all text-white text-[9px] font-bold font-mono tracking-widest cursor-pointer active:scale-95"
                title="Clear Formatting"
              >
                Reset
              </button>
            </div>
          </div>

          <div 
            ref={containerRef}
            contentEditable
            onBlur={handleBlur}
            onInput={handleInput}
            className="min-h-[140px] max-h-[350px] overflow-y-auto bg-[#101010] border border-white/5 p-3 text-xs text-white outline-none focus:border-brick-copper/50 transition-colors font-sans leading-relaxed rounded wysiwyg-editor-area"
            style={{ whiteSpace: "normal" }}
          />
        </div>
      );
    }
  };

  const MediaField = (label: string, type: "image/*" | "video/*" = "image/*", storagePath: string = "uploads") => ({
    type: "custom" as const,
    render: ({ name, value, onChange }: any) => {
      const [useUrl, setUseUrl] = React.useState(true);
      return (
        <div className="space-y-3 bg-[#181818] p-3 border border-white/5">
          <div className="flex justify-between items-center bg-black/40 p-1 rounded-sm">
            <button 
              onClick={() => setUseUrl(true)}
              className={`flex-1 py-1 text-[9px] uppercase tracking-widest transition-all ${useUrl ? 'bg-brick-copper text-charcoal font-bold' : 'text-white/40 hover:text-white'}`}
            >
              URL Link
            </button>
            <button 
              onClick={() => setUseUrl(false)}
              className={`flex-1 py-1 text-[9px] uppercase tracking-widest transition-all ${!useUrl ? 'bg-brick-copper text-charcoal font-bold' : 'text-white/40 hover:text-white'}`}
            >
              File Upload
            </button>
          </div>

          {useUrl ? (
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-widest text-white/40 block">{label} URL</label>
              <input 
                className="w-full bg-[#101010] border border-white/5 p-2 text-xs text-white transition-all focus:border-brick-copper outline-none"
                value={value || ""}
                placeholder="https://..."
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
          ) : (
            <FileUpload 
              label={`${label} Upload`}
              path={storagePath}
              accept={type}
              onUploadComplete={onChange}
            />
          )}

          {value && (
            <div className="mt-2 group relative">
              <p className="text-[8px] uppercase tracking-tighter text-white/30 truncate mb-1">Previewing: {value}</p>
              <div className="aspect-video bg-black/60 border border-white/5 overflow-hidden flex items-center justify-center">
                {type === "video/*" ? (
                  <video src={value} className="max-w-full max-h-full" controls={false} />
                ) : (
                  <img src={value} className="max-w-full max-h-full object-contain" alt="Preview" />
                )}
              </div>
              <button 
                onClick={() => onChange("")}
                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoveUpRight size={8} className="rotate-45" /> 
              </button>
            </div>
          )}
        </div>
      );
    }
  });

  const MediaPickerField = {
    type: "custom" as const,
    render: ({ name, value, onChange }: any) => {
      return (
        <MediaPickerComponent
          value={value}
          onChange={onChange}
          portfolioItems={portfolioItems}
        />
      );
    }
  };

  class PuckErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error("Puck block render error caught:", error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-6 bg-red-950/40 border border-red-900/50 rounded-sm text-red-200 text-xs font-mono">
            <p className="font-bold mb-1">⚠️ Component Render Block Error</p>
            <p className="opacity-80 text-[11px]">This block failed to render due to bad field inputs or state mismatch.</p>
            {this.state.error && <p className="mt-2 text-[10px] bg-red-950/80 p-2 text-red-300 rounded border border-red-900/30 overflow-auto">{this.state.error.message}</p>}
          </div>
        );
      }
      return this.props.children;
    }
  }

  const ComponentWrapper = ({ width, spacing, entranceAnimation, styles, children, visibility = "block" }: { width?: "full" | "half", spacing?: any, entranceAnimation?: string, styles?: string, children: React.ReactNode, visibility?: string }) => {
    const variants = {
       fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
       "slide-up": { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
       "slide-left": { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
       "slide-right": { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
       scale: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } },
    };

    const anim = (entranceAnimation && variants[entranceAnimation as keyof typeof variants]) || { initial: {}, animate: {} };

    return (
      <motion.div 
        initial={anim.initial}
        whileInView={anim.animate}
        viewport={{ once: true, margin: "-10%" }}
        className={`${visibility} ${width === 'half' ? 'w-full lg:w-1/2' : 'w-full'} overflow-hidden ${styles || ""}`}
      >
        <SpacingWrapper spacing={spacing}>
          {/* Basic protection to catch inline runtime render errors from breaking the side catalog bar */}
          <div className="error-boundary-sandbox-wrapper">
            <PuckErrorBoundary>
              {children}
            </PuckErrorBoundary>
          </div>
        </SpacingWrapper>
      </motion.div>
    );
  };
  
  return {
    categories: {
      Layout: {
        components: ["Section", "Columns", "Spacer", "DynamicGrid", "FlexBox", "GridBox"],
      },
      Typography: {
        components: ["Heading", "RichText", "TextContent"],
      },
      Media: {
        components: ["Hero", "MediaBackground", "Image", "MediaEmbed", "TourEmbed", "PDFReader", "BrandGallery", "DynamicGallery"],
      },
      Interactive: {
        components: ["Button", "Contact", "Testimonials", "LogoCloud", "InstagramFeed"],
      },
      Integrations: {
        components: ["PartnerShowcase", "PropertyHighlight", "HTMLEmbed", "ServicePackages"],
      },
      Brand: {
        components: ["Footer"],
      },
    },
    root: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        ogImage: MediaField("OG Image"),
        layoutMode: {
          type: "radio",
          options: [
            { label: "1 Panel (Full)", value: "one-panel" },
            { label: "2 Panel (Split)", value: "two-panel" }
          ]
        },
        main: { type: "slot" },
        side: { type: "slot" }
      },
      defaultProps: {
        layoutMode: "two-panel"
      },
      render: ({ children, main, side, title, description, ogImage, layoutMode = "two-panel" }) => {
        const MainSlot = main as any;
        const SideSlot = side as any;
        // Sync with document head
        useEffect(() => {
          if (title) document.title = `${title} | Exposed Brick Media`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc && description) metaDesc.setAttribute('content', description);
        }, [title, description]);

        if (layoutMode === "one-panel") {
          return (
            <div className="min-h-screen bg-bg-primary overflow-hidden">
               <main className="w-full overflow-y-auto no-scrollbar scroll-smooth">
                 <div className="flex flex-wrap content-start">
                  <MainSlot />
                </div>
                {children}
              </main>
            </div>
          );
        }

        return (
          <div className="flex flex-col lg:flex-row min-h-screen bg-bg-primary overflow-hidden relative">
            {/* LEFT COLUMN: BRAND & SERVICES */}
            <aside className="hidden lg:flex w-1/3 border-r border-border-subtle flex-col p-8 md:p-12 lg:p-16 pt-32 lg:pt-12 overflow-y-auto no-scrollbar">
              <div className="flex flex-col flex-wrap lg:flex-nowrap gap-y-4">
                <SideSlot />
              </div>
            </aside>

            {/* RIGHT AREA: HERO, PORTFOLIO & BOOKING */}
            <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-20 lg:pt-0">
               <div className="flex flex-wrap content-start">
                <MainSlot />
              </div>
              {children}
            </main>
          </div>
        );
      }
    },
    components: {
      Button: {
        fields: {
          link: LinkField as any,
          variant: {
            type: "select",
            options: [
              { label: "Solid", value: "solid" },
              { label: "Outline", value: "outline" },
              { label: "Underline", value: "underline" },
            ]
          },
          align: {
            type: "radio",
            options: [
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ]
          },
          width: WidthField as any,
          spacing: SpacingControl as any,
          entranceAnimation: EntranceAnimationField as any,
          styles: StylesField as any,
        },
        defaultProps: {
          link: {
            type: "internal",
            label: "Learn More",
            url: "about"
          },
          variant: "solid",
          align: "left",
          width: "full",
          spacing: { pt: "0", pb: "0", mt: "16", mb: "16" },
        },
        render: ({ link, variant, align, width, spacing, entranceAnimation, styles }) => {
          const justify = align === 'center' ? 'center' : align === 'right' ? 'end' : 'start';
          return (
            <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation} styles={styles}>
              <div className={`flex justify-${justify}`}>
                <LinkButton link={link} variant={variant} />
              </div>
            </ComponentWrapper>
          );
        }
      },
    PartnerShowcase: {
        fields: {
          partnerId: {
            type: "select",
            options: partnerOptions
          },
          layout: {
            type: "radio",
            options: [
              { label: "Full Profile", value: "profile" },
              { label: "Compact Card", value: "card" }
            ]
          },
          showAssets: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
          width: WidthField as any,
          spacing: SpacingControl as any,
          entranceAnimation: EntranceAnimationField as any,
        },
        defaultProps: {
          partnerId: partners[0]?.id || "",
          layout: "card",
          showAssets: false,
          width: "full",
          spacing: { pt: "20", pb: "20", mt: "0", mb: "0" },
        },
        render: ({ partnerId, layout, showAssets, width, spacing, entranceAnimation }) => {
          const partner = partners.find(p => p.id === partnerId);
          if (!partner) return <div className="p-8 text-center opacity-20 italic">Select a verified partner to display.</div>;

          const localFormatSocialUrl = (val: string, platform: string) => {
            if (!val) return "";
            const v = val.trim();
            if (v.startsWith("http://") || v.startsWith("https://")) return v;
            const handle = v.startsWith("@") ? v.substring(1) : v;
            if (platform === "instagram") return `https://instagram.com/${handle}`;
            if (platform === "facebook") return `https://facebook.com/${handle}`;
            if (platform === "linkedin") {
              if (handle.startsWith('in/') || handle.startsWith('company/')) {
                return `https://linkedin.com/${handle}`;
              }
              return `https://linkedin.com/in/${handle}`;
            }
            if (platform === "twitter") return `https://twitter.com/${handle}`;
            if (platform === "youtube") return `https://youtube.com/${handle}`;
            return v;
          };

          if (layout === 'card') {
            return (
              <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
                <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center group bg-[#111111]/80 hover:bg-[#151515] p-6 border border-white/5 hover:border-brick-copper/30 transition-all duration-300 rounded shadow-md">
                  {/* Top Linkable Area to point directly to partner showcase */}
                  <Link 
                    to={`/partners/${partner.id}`}
                    className="w-full flex flex-col items-center cursor-pointer"
                    title="Click to view complete advisor profile"
                  >
                    <div className="relative w-32 h-32 rounded-full p-1 border border-brick-copper/60 mb-4 bg-charcoal/40 overflow-hidden transition-transform duration-300 group-hover:scale-[1.03] group-hover:border-white">
                      {partner.headshotUrl ? (
                        <img
                          src={partner.headshotUrl}
                          alt={partner.displayName}
                          className="w-full h-full rounded-full object-cover filter grayscale contrast-125 transition-all duration-500 group-hover:grayscale-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center">
                          <span className="text-xl font-bold text-white/40">{partner.displayName?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] tracking-widest text-brick-copper font-semibold uppercase mb-1">
                      {partner.role === 'preferred' ? 'PREFERRED ADVISOR' : 'ADVISORY PARTNER'}
                    </span>
                    <h3 className="text-sm font-medium tracking-wider text-neutral-200 uppercase mb-0.5 group-hover:text-brick-copper transition-colors">
                      {partner.displayName}
                    </h3>
                    <span className="text-[8px] uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors font-mono mb-2">
                      Click to view profile & achievements
                    </span>
                  </Link>

                  {/* Operational Controls Block */}
                  <div className="w-full flex flex-col items-center mt-1">
                    {(() => {
                      const totalCommissions = portfolioItems?.filter(p => p.partnerUid === partner.id || p.partnerUids?.includes(partner.id))?.length || 0;
                      if (totalCommissions > 0) {
                        return (
                          <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-neutral-500 font-bold mb-4 block">
                            ● {totalCommissions} {totalCommissions === 1 ? 'COMMISSION' : 'COMMISSIONS'}
                          </span>
                        );
                      }
                      return <div className="h-4" />;
                    })()}

                    <div className="flex gap-2 w-full max-w-[180px]">
                      {partner.phone && (
                        <a
                          href={`tel:${partner.phone}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full border border-white/10 text-[10px] tracking-wider text-neutral-400 hover:text-white hover:border-white/30 transition-all uppercase"
                        >
                          <Phone size={11} className="text-brick-copper" /> Call
                        </a>
                      )}
                      {partner.email && (
                        <a
                          href={`mailto:${partner.email}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full border border-white/10 text-[10px] tracking-wider text-neutral-400 hover:text-white hover:border-white/30 transition-all uppercase"
                        >
                          <Mail size={11} className="text-brick-copper" /> Mail
                        </a>
                      )}
                    </div>

                    {(partner.instagram || partner.facebook || partner.linkedin || partner.twitter || partner.youtube) && (
                      <div className="flex items-center justify-center flex-wrap gap-2 pt-4 mt-4 border-t border-white/5 w-full max-w-[180px]">
                        {partner.instagram && (
                          <a
                            href={localFormatSocialUrl(partner.instagram, 'instagram')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300"
                            title="Contact via Instagram"
                          >
                            <Instagram size={13} />
                          </a>
                        )}
                        {partner.facebook && (
                          <a
                            href={localFormatSocialUrl(partner.facebook, 'facebook')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300"
                            title="Contact via Facebook"
                          >
                            <Facebook size={13} />
                          </a>
                        )}
                        {partner.linkedin && (
                          <a
                            href={localFormatSocialUrl(partner.linkedin, 'linkedin')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-[#151515] hover:bg-white hover:text-charcoal border border-white/5 text-neutral-400 flex items-center justify-center transition-all duration-300"
                            title="Contact via LinkedIn"
                          >
                            <Linkedin size={13} />
                          </a>
                        )}
                        {partner.twitter && (
                          <a
                            href={localFormatSocialUrl(partner.twitter, 'twitter')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300"
                            title="Contact via Twitter/X"
                          >
                            <Twitter size={11} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ComponentWrapper>
            );
          }

          // Full Profile Layout
          return (
            <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
              <div className="px-8 md:px-12 lg:px-16 py-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                   <div className="flex justify-center">
                     <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full p-1 border border-brick-copper/60 bg-charcoal/40 overflow-hidden shadow-2xl">
                        {partner.headshotUrl ? (
                           <img 
                             src={partner.headshotUrl} 
                             alt={partner.displayName} 
                             className="w-full h-full rounded-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-500" 
                             referrerPolicy="no-referrer"
                           />
                        ) : (
                           <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center">
                             <User size={80} className="text-white/20" />
                           </div>
                        )}
                     </div>
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                         <span className="w-12 h-[1px] bg-brick-copper" />
                         <span className="text-[10px] uppercase tracking-[0.25em] text-brick-copper font-black">
                           {partner.role === 'preferred' ? 'PREFERRED NARRATIVE ADVISOR' : 'VERIFIED NARRATIVE ADVISOR'}
                         </span>
                      </div>
                      <h3 className="font-display text-4xl md:text-5xl italic leading-none">{partner.displayName}<span className="text-brick-copper">.</span></h3>
                      <p className="text-text-primary/60 italic font-serif leading-relaxed text-base">{partner.bio || "Crafting premium architectural experiences through high-fidelity visual narratives and trusted property portfolios."}</p>
                      
                      {/* Operational Commissions indicator */}
                      {(() => {
                        const totalCommissions = portfolioItems?.filter(p => p.partnerUid === partner.id || p.partnerUids?.includes(partner.id))?.length || 0;
                        if (totalCommissions > 0) {
                          return (
                            <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-xs text-[9px] uppercase tracking-[0.2em] font-mono text-brick-copper font-bold">
                              ● {totalCommissions} {totalCommissions === 1 ? 'COMMISSIONED PORTFOLIO' : 'COMMISSIONED PORTFOLIOS'}
                            </span>
                          );
                        }
                        return null;
                      })()}

                      <div className="flex flex-wrap gap-4 pt-2 items-center">
                         <Link to={`/partners/${partner.id}`} className="px-8 py-3 bg-brick-copper text-charcoal text-[9px] uppercase font-black tracking-widest hover:bg-white hover:text-charcoal transition-all">View Showcase</Link>
                         {partner.phone && <a href={`tel:${partner.phone}`} className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-brick-copper/40 transition-all text-neutral-300 hover:text-white" title="Call advisor"><Phone size={14} /></a>}
                         {partner.email && <a href={`mailto:${partner.email}`} className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-brick-copper/40 transition-all text-neutral-300 hover:text-white" title="Email advisor"><Mail size={14} /></a>}
                      </div>

                      {/* Symmetrical & Sizable Partner Social Nodes with Custom Tooltips */}
                      {(partner.instagram || partner.facebook || partner.linkedin || partner.twitter || partner.youtube) && (
                        <div className="flex items-center gap-2 pt-4 border-t border-white/5 w-full max-w-sm">
                          {partner.instagram && (
                            <a
                              href={localFormatSocialUrl(partner.instagram, 'instagram')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300"
                              title="Instagram Profile"
                            >
                              <Instagram size={13} />
                            </a>
                          )}
                          {partner.facebook && (
                            <a
                              href={localFormatSocialUrl(partner.facebook, 'facebook')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300"
                              title="Facebook Profile"
                            >
                              <Facebook size={13} />
                            </a>
                          )}
                          {partner.linkedin && (
                            <a
                              href={localFormatSocialUrl(partner.linkedin, 'linkedin')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-full bg-[#151515] hover:bg-white hover:text-charcoal border border-white/5 text-neutral-400 flex items-center justify-center transition-all duration-300"
                              title="LinkedIn Profile"
                            >
                              <Linkedin size={13} />
                            </a>
                          )}
                          {partner.twitter && (
                            <a
                              href={localFormatSocialUrl(partner.twitter, 'twitter')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300"
                              title="Twitter/X Profile"
                            >
                              <Twitter size={11} />
                            </a>
                          )}
                        </div>
                      )}
                   </div>
                </div>

                {showAssets && partner.resources && partner.resources.length > 0 && (
                  <div className="pt-12 border-t border-white/5 animate-fade-in">
                     <h5 className="text-[11px] uppercase tracking-[0.4em] text-white/30 mb-8 font-mono">Direct Brand Resources</h5>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {partner.resources.map((res: any, idx: number) => (
                          <div key={idx} className="bg-[#101010] border border-white/5 p-6 hover:border-brick-copper/30 transition-all flex flex-col justify-between rounded-sm">
                             <div className="mb-6">
                                <FileText className="text-brick-copper/40 mb-3" size={16} />
                                <h6 className="text-sm font-display italic text-white leading-snug">{res.name}</h6>
                             </div>
                             <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-[9px] uppercase tracking-widest text-brick-copper border-b border-brick-copper/20 self-start hover:text-white hover:border-white transition-colors">Download Asset</a>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
            </ComponentWrapper>
          );
        }
      },
      BrandGallery: {
        fields: {
          title: { type: "text" },
          category: { type: "text" },
          width: WidthField as any,
          spacing: SpacingControl as any,
          entranceAnimation: EntranceAnimationField as any,
        },
        defaultProps: {
          title: "Brand Artifacts",
          category: "Templates",
          width: "full",
          spacing: { pt: "40", pb: "40", mt: "0", mb: "0" },
        },
        render: ({ title, category, width, spacing, entranceAnimation }) => {
          const resources = brandResources.filter(r => !category || r.category === category);
          
          return (
            <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
              <div className="px-8 md:px-12">
                <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
                   <h2 className="font-display text-4xl italic text-white">{title}</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                   {resources.map(res => (
                     <div key={res.id} className="group relative bg-white/5 border border-white/5 p-8 transition-all hover:bg-black/40">
                        <div className="flex justify-between items-start mb-8">
                           <div className="w-12 h-12 bg-charcoal border border-white/5 flex items-center justify-center text-brick-copper transition-all group-hover:scale-110">
                              <BoxIcon size={20} />
                           </div>
                           <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-brick-copper transition-colors">
                              <Download size={18} />
                           </a>
                        </div>
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-2">{res.category}</p>
                        <h4 className="font-display text-xl italic text-white mb-6 leading-tight">{res.title}</h4>
                        <div className="h-[1px] w-full bg-white/5 group-hover:bg-brick-copper/30 transition-colors" />
                     </div>
                   ))}
                </div>
                {resources.length === 0 && (
                   <div className="py-20 text-center border border-dashed border-white/5 opacity-20">
                      <FileText size={32} className="mx-auto mb-4" />
                      <p className="text-[10px] uppercase tracking-widest">No matching resources discovered.</p>
                   </div>
                )}
              </div>
            </ComponentWrapper>
          );
        }
      },
      PDFReader: {
        fields: {
          url: MediaField("PDF URL", "image/*", "documents") as any, // Using image/* for file selection UI, but it will store any URL
          title: { type: "text" },
          height: { type: "number" },
          width: WidthField as any,
          spacing: SpacingControl as any,
          entranceAnimation: EntranceAnimationField as any,
        },
        defaultProps: {
          url: "",
          title: "Technical Archive",
          height: 600,
          width: "full",
          spacing: { pt: "40", pb: "40", mt: "0", mb: "0" },
        },
        render: ({ url, title, height, width, spacing, entranceAnimation }) => {
          if (!url) return <div className="p-12 text-center opacity-20 italic">Upload a PDF to initialize the reader.</div>;
          return (
            <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
              {/* Removed the <div className="px-4 md:px-8"> that was forcing margins */}
              <PDFViewer fileUrl={url} title={title} height={height} />
            </ComponentWrapper>
          );
        }
      },
    Section: {
      fields: {
        spacing: SpacingControl as any,
        padding: {
           type: "select",
           options: [
             { label: "Standard", value: "py-16" },
             { label: "Hero (Tall)", value: "py-32" },
             { label: "Compact", value: "py-8" }
           ]
        },
        background: {
          type: "select",
          options: [
            { label: "Transparent", value: "bg-transparent" },
            { label: "Primary Base", value: "bg-bg-primary" },
            { label: "Secondary Base", value: "bg-bg-secondary" },
            { label: "Charcoal Dark", value: "bg-charcoal text-white" },
          ],
        },
        bgImage: MediaField("Background Image"),
        overlayOpacity: { type: "number", min: 0, max: 100 },
        blur: { type: "number", min: 0, max: 20 },
        parallax: { type: "radio", options: [{ label: "On", value: true }, { label: "Off", value: false }] },
        gradientDirection: {
           type: "select",
           options: [
             { label: "None", value: "" },
             { label: "Bottom to Top", value: "bg-gradient-to-t from-black/80 to-transparent" },
             { label: "Top to Bottom", value: "bg-gradient-to-b from-black/80 to-transparent" }
           ]
        },
        anchorId: { type: "text" },
        layout: {
          type: "radio",
          options: [
            { label: "Boxed", value: "boxed" },
            { label: "Full Width", value: "full" },
            { label: "Edge-to-Edge (Bleed)", value: "bleed" },
          ],
        },
        children: { type: "slot" },
        styles: StylesField as any,
      },
      defaultProps: {
        spacing: { pt: "0", pb: "0", mt: "0", mb: "0" },
        padding: "py-16",
        background: "bg-bg-primary",
        overlayOpacity: 50,
        blur: 0,
        parallax: false,
        layout: "boxed",
        gradientDirection: "",
      },
      render: ({ children, spacing, padding, background, bgImage, overlayOpacity, blur, parallax, gradientDirection, anchorId, layout, styles }) => {
        const ChildrenSlot = children as any;
        
        // Define the layout constraint classes
        const layoutClass = layout === 'boxed' 
          ? 'max-w-7xl mx-auto px-8 md:px-16' 
          : layout === 'bleed'
            ? 'w-full px-0' // Zero padding for edge-to-edge embed
            : 'w-full px-8 md:px-16'; // Standard full width with safe zones
            
        return (
        <section id={anchorId} className="w-full">
          <SpacingWrapper spacing={spacing} className={`relative ${background} overflow-hidden group/section ${styles || ""}`}>
             {bgImage && (
              <>
                <div 
                  className={`absolute inset-0 bg-cover bg-center ${parallax ? 'bg-fixed' : ''}`}
                  style={{ backgroundImage: `url(${bgImage})`, filter: blur ? `blur(${blur}px)` : undefined }}
                />
                <div 
                  className={`absolute inset-0 bg-black ${gradientDirection || ""}`} 
                  style={{ opacity: overlayOpacity / 100 }} 
                />
              </>
            )}
            {/* Replaced the hardcoded padding with our new layoutClass */}
            <div className={`relative z-10 transition-all ${layoutClass} ${layout === 'bleed' ? 'py-0' : padding}`}>
              <div className="min-h-[100px] w-full">
                <ChildrenSlot />
              </div>
            </div>
          </SpacingWrapper>
        </section>
        );
      },
    },
    DecorativeFrame: {
      fields: {
        spacing: SpacingControl as any,
        borderWidth: { type: "number", min: 0, max: 20 },
        borderColor: { type: "text" },
        borderRadius: { type: "number", min: 0, max: 100 },
        padding: { type: "number", min: 0, max: 100 },
        entranceAnimation: EntranceAnimationField as any,
        styles: StylesField as any,
        children: { type: "slot" },
      },
      defaultProps: {
        spacing: { pt: "16", pb: "16", mt: "0", mb: "0" },
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 0,
        padding: 24,
      },
      render: ({ children, spacing, borderWidth, borderColor, borderRadius, padding, entranceAnimation, styles }) => {
        const ChildrenSlot = children as any;
        return (
        <ComponentWrapper spacing={spacing} entranceAnimation={entranceAnimation} styles={styles}>
          <div 
            style={{ 
              borderWidth: `${borderWidth}px`, 
              borderColor: borderColor, 
              borderRadius: `${borderRadius}px`,
              padding: `${padding}px`
            }}
            className="w-full h-full min-h-[50px] relative"
          >
            <ChildrenSlot />
          </div>
        </ComponentWrapper>
        );
      }
    },
    FlexBox: {
      fields: {
        direction: {
          type: "radio",
          options: [
            { label: "Row", value: "flex-row" },
            { label: "Column", value: "flex-col" },
          ]
        },
        align: {
          type: "select",
          options: [
            { label: "Start", value: "items-start" },
            { label: "Center", value: "items-center" },
            { label: "End", value: "items-end" },
            { label: "Stretch", value: "items-stretch" },
          ]
        },
        justify: {
          type: "select",
          options: [
            { label: "Start", value: "justify-start" },
            { label: "Center", value: "justify-center" },
            { label: "Space Between", value: "justify-between" },
          ]
        },
        gap: { type: "number" },
        wrap: {
          type: "radio",
          options: [
            { label: "Wrap", value: "flex-wrap" },
            { label: "No Wrap", value: "flex-nowrap" }
          ]
        },
        content: { type: "slot" },
        spacing: SpacingControl as any,
      },
      defaultProps: {
        direction: "flex-col",
        align: "items-start",
        justify: "justify-start",
        gap: 24,
        wrap: "flex-wrap",
        spacing: { desktop: { pt: "0", pb: "0", mt: "0", mb: "0" }, mobile: { pt: "0", pb: "0", mt: "0", mb: "0" } }
      },
      render: ({ direction, align, justify, gap, wrap, content, spacing }) => {
        const ContentSlot = content as any;
        return (
          <SpacingWrapper spacing={spacing}>
            <div className={`flex w-full ${direction} ${align} ${justify} ${wrap}`} style={{ gap: `${gap}px` }}>
              <ContentSlot />
            </div>
          </SpacingWrapper>
        );
      }
    },
    GridBox: {
      fields: {
        columnsDesktop: {
          type: "select",
          options: [
            { label: "1 Column", value: "md:grid-cols-1" },
            { label: "2 Columns", value: "md:grid-cols-2" },
            { label: "3 Columns", value: "md:grid-cols-3" },
            { label: "4 Columns", value: "md:grid-cols-4" },
          ]
        },
        columnsMobile: {
          type: "select",
          options: [
            { label: "1 Column", value: "grid-cols-1" },
            { label: "2 Columns", value: "grid-cols-2" },
          ]
        },
        gap: { type: "number" },
        content: { type: "slot" },
        spacing: SpacingControl as any,
      },
      defaultProps: {
        columnsDesktop: "md:grid-cols-3",
        columnsMobile: "grid-cols-1",
        gap: 24,
        spacing: { desktop: { pt: "0", pb: "0", mt: "0", mb: "0" }, mobile: { pt: "0", pb: "0", mt: "0", mb: "0" } }
      },
      render: ({ columnsDesktop, columnsMobile, gap, content, spacing }) => {
        const ContentSlot = content as any;
        return (
          <SpacingWrapper spacing={spacing}>
            <div className={`grid ${columnsMobile} ${columnsDesktop} w-full`} style={{ gap: `${gap}px` }}>
              <ContentSlot />
            </div>
          </SpacingWrapper>
        );
      }
    },
    Image: {
      fields: {
        imageUrl: MediaField("Image") as any,
        aspectRatio: {
          type: "select",
          options: [
            { label: "16:9", value: "aspect-video" },
            { label: "4:3", value: "aspect-[4/3]" },
            { label: "1:1", value: "aspect-square" },
            { label: "Portrait (4:5)", value: "aspect-[4/5]" },
            { label: "Auto", value: "aspect-auto" }
          ]
        },
        objectFit: {
          type: "radio",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" }
          ]
        },
        borderRadius: {
          type: "select",
          options: [
            { label: "None", value: "rounded-none" },
            { label: "Small", value: "rounded-sm" },
            { label: "Medium", value: "rounded-md" },
            { label: "Large", value: "rounded-lg" },
            { label: "Full Circle", value: "rounded-full" }
          ]
        },
        width: WidthField as any,
        spacing: SpacingControl as any,
        visibility: VisibilityField as any,
        styles: StylesField as any,
      },
      defaultProps: {
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        aspectRatio: "aspect-video",
        objectFit: "cover",
        borderRadius: "rounded-none",
        width: "full",
        visibility: "block",
      },
      render: ({ imageUrl, aspectRatio, objectFit, borderRadius, width, spacing, visibility, styles }) => {
        const fitClass = objectFit === "cover" ? "object-cover" : "object-contain";
        return (
          <ComponentWrapper width={width} spacing={spacing} visibility={visibility} styles={styles}>
            <div className="px-8">
              <div className={`overflow-hidden ${borderRadius} ${aspectRatio} bg-black/10`}>
                <img 
                  src={imageUrl} 
                  alt="Puck Visual Content" 
                  className={`w-full h-full ${fitClass}`}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </ComponentWrapper>
        );
      }
    },
    MediaBackground: {
      fields: {
        mediaUrl: MediaField("Background Media", "video/*", "hero") as any,
        mediaType: {
          type: "radio",
          options: [{ label: "Video", value: "video" }, { label: "Image", value: "image" }]
        },
        overlayOpacity: { type: "number", min: 0, max: 100 },
        height: {
          type: "select",
          options: [
            { label: "Screen Height (100vh)", value: "h-screen" },
            { label: "Tall (80vh)", value: "h-[80vh] min-h-[600px]" },
            { label: "Medium (50vh)", value: "h-[50vh] min-h-[400px]" },
            { label: "Auto (Fits Content)", value: "min-h-[300px]" }
          ]
        },
        content: { type: "slot" },
        spacing: SpacingControl as any,
      },
      defaultProps: {
        mediaUrl: "https://images.unsplash.com/photo-1600607687940-c52fb036999c",
        mediaType: "video",
        overlayOpacity: 40,
        height: "h-[80vh] min-h-[600px]",
        spacing: { desktop: { pt: "0", pb: "0", mt: "0", mb: "0" }, mobile: { pt: "0", pb: "0", mt: "0", mb: "0" } },
      },
      render: ({ mediaUrl, mediaType, overlayOpacity, height, content, spacing }) => {
        const ContentSlot = content as any;
        return (
          <SpacingWrapper spacing={spacing}>
            <div className={`relative w-full flex items-center justify-center overflow-hidden ${height}`}>
              {mediaType === 'video' ? (
                <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                  <source src={mediaUrl} type="video/mp4" />
                </video>
              ) : (
                <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Background" referrerPolicy="no-referrer" />
              )}
              <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity / 100 }} />
              <div className="relative z-10 w-full max-w-7xl mx-auto px-8 py-16">
                <ContentSlot />
              </div>
            </div>
          </SpacingWrapper>
        );
      }
    },
    DynamicGrid: {
      fields: {
        collection: {
          type: "select",
          options: [
            { label: "Portfolio Items", value: "portfolio" },
            { label: "CMS Pages", value: "pages" }
          ]
        },
        limit: { type: "number" },
        columns: {
          type: "radio",
          options: [
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 }
          ]
        },
        staggerDelay: { type: "number", min: 0, max: 1 },
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        collection: "portfolio",
        limit: 6,
        columns: 3,
        staggerDelay: 0.1,
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ collection: coll, limit, columns, staggerDelay, spacing, entranceAnimation }) => {
        const items = coll === 'portfolio' ? portfolioItems : pages;
        const displayItems = items.slice(0, limit);
        const gridCols = {
          2: "grid-cols-1 md:grid-cols-2",
          3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }[columns];

        return (
          <SpacingWrapper spacing={spacing}>
            <div className={`grid ${gridCols} gap-8 p-8`}>
              {displayItems.map((item: any, idx: number) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * (staggerDelay || 0.1) }}
                  whileHover={{ y: -10 }}
                  className="group relative h-80 bg-charcoal overflow-hidden border border-white/5"
                >
                  <img 
                    src={item.img || item.heroImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" 
                    alt={item.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
                    <span className="text-[9px] uppercase tracking-widest text-brick-copper font-black mb-2">{item.propertyType || item.category || 'PROJECT'}</span>
                    <h4 className="text-xl font-display italic text-white">{item.title}</h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </SpacingWrapper>
        );
      }
    },
    Columns: {
      fields: {
        left: { type: "slot" },
        right: { type: "slot" },
        leftColumnWidth: {
          type: "number",
          min: 10,
          max: 90,
        },
        gap: { type: "number" },
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        leftColumnWidth: 50,
        gap: 32,
        spacing: { pt: "0", pb: "0", mt: "0", mb: "0" },
      },
      render: ({ left, right, leftColumnWidth, gap, spacing, entranceAnimation }) => {
        const LeftSlot = left as any;
        const RightSlot = right as any;
        return (
          <ComponentWrapper spacing={spacing} entranceAnimation={entranceAnimation}>
            <div className="flex flex-col md:grid" style={{ gap: `${gap}px`, gridTemplateColumns: `${leftColumnWidth}% calc(${100 - leftColumnWidth}% - ${gap}px)` }}>
              <div className="w-full min-h-[50px] transition-all border border-transparent hover:border-white/5">
                <LeftSlot />
              </div>
              <div className="w-full min-h-[50px] transition-all border border-transparent hover:border-white/5">
                <RightSlot />
              </div>
            </div>
          </ComponentWrapper>
        );
      },
    },
    Heading: {
      fields: {
        text: { type: "text" },
        level: {
          type: "select",
          options: [
            { label: "Heading 1", value: 1 },
            { label: "Heading 2", value: 2 },
            { label: "Heading 3", value: 3 },
            { label: "Heading 4", value: 4 },
          ],
        },
        sizeDesktop: {
          type: "select",
          options: [
            { label: "XS (text-xl)", value: "md:text-xl" },
            { label: "SM (text-2xl)", value: "md:text-2xl" },
            { label: "MD (text-4xl)", value: "md:text-4xl" },
            { label: "LG (text-5xl)", value: "md:text-5xl" },
            { label: "XL (text-6xl)", value: "md:text-6xl" },
            { label: "XXL (text-8xl)", value: "md:text-8xl" },
          ]
        },
        sizeMobile: {
          type: "select",
          options: [
            { label: "XS (text-base)", value: "text-base" },
            { label: "SM (text-xl)", value: "text-xl" },
            { label: "MD (text-2xl)", value: "text-2xl" },
            { label: "LG (text-3xl)", value: "text-3xl" },
            { label: "XL (text-4xl)", value: "text-4xl" },
          ]
        },
        align: {
          type: "radio",
          options: [
            { label: "Left", value: "text-left" },
            { label: "Center", value: "text-center" },
            { label: "Right", value: "text-right" },
          ],
        },
        tracking: {
          type: "select",
          options: [
            { label: "Tighter", value: "tracking-tighter" },
            { label: "Tight", value: "tracking-tight" },
            { label: "Normal", value: "tracking-normal" },
            { label: "Wide", value: "tracking-wide" },
            { label: "Widest", value: "tracking-[0.3em]" },
          ]
        },
        lineHeight: {
          type: "select",
          options: [
            { label: "None", value: "leading-none" },
            { label: "Tight", value: "leading-tight" },
            { label: "Snug", value: "leading-snug" },
            { label: "Normal", value: "leading-normal" },
            { label: "Relaxed", value: "leading-relaxed" },
            { label: "Loose", value: "leading-loose" },
          ]
        },
        accent: { 
          type: "radio",
          options: [
            { label: "Standard", value: false },
            { label: "Accent Color", value: true }
          ]
        },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
        visibility: VisibilityField as any,
        styles: StylesField as any,
      },
      defaultProps: {
        text: "Elevated Architecture",
        level: 2,
        sizeDesktop: "md:text-5xl",
        sizeMobile: "text-2xl",
        align: "text-left",
        tracking: "tracking-tight",
        lineHeight: "leading-tight",
        accent: false,
        width: "full",
        visibility: "block",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ text, level, sizeDesktop, sizeMobile, align, tracking, lineHeight, accent, width, spacing, entranceAnimation, visibility, styles }) => {
        const Tag = (`h${level}` as any) || "h2";
        const alignClass = align === "left" ? "text-left" : align === "center" ? "text-center" : align === "right" ? "text-right" : align;
        return (
          <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation} visibility={visibility} styles={styles}>
            <div className="px-8">
              <Tag className={`${alignClass} ${sizeMobile} ${sizeDesktop} ${tracking} ${lineHeight} font-display italic ${accent ? "text-brick-copper" : "text-text-primary"}`}>
                {text}
              </Tag>
            </div>
          </ComponentWrapper>
        );
      },
    },
    RichText: {
      fields: {
        content: WysiwygEditorField as any,
        size: {
          type: "select",
          options: [
            { label: "Small", value: "sm" },
            { label: "Base", value: "base" },
            { label: "Large", value: "lg" },
          ],
        },
        tracking: {
          type: "select",
          options: [
            { label: "Tight", value: "tracking-tight" },
            { label: "Normal", value: "tracking-normal" },
            { label: "Wide", value: "tracking-wide" },
          ]
        },
        maxWidth: {
          type: "select",
          options: [
            { label: "Prose", value: "max-w-prose" },
            { label: "MD", value: "max-w-md" },
            { label: "LG", value: "max-w-lg" },
            { label: "XL", value: "max-w-xl" },
            { label: "2XL", value: "max-w-2xl" },
            { label: "Full", value: "max-w-full" }
          ]
        },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
        visibility: VisibilityField as any,
        styles: StylesField as any,
      },
      defaultProps: {
        content: "<p>High-fidelity narratives for architectural excellence.</p>",
        size: "base",
        tracking: "tracking-normal",
        maxWidth: "max-w-2xl",
        width: "full",
        visibility: "block",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ content, size, tracking, maxWidth, width, spacing, entranceAnimation, visibility, styles }) => {
        const sizeClass = { sm: "text-xs", base: "text-sm", lg: "text-base" }[size];
        return (
          <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation} visibility={visibility} styles={styles}>
            <div 
              className={`${sizeClass} ${tracking} ${maxWidth} leading-relaxed text-text-primary/60 px-8 md:px-12 wysiwyg-content`}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </ComponentWrapper>
        );
      },
    },
    Hero: {
      fields: {
        imageUrl: MediaField("Hero Image"),
        height: {
          type: "select",
          options: [
            { label: "Short", value: "short" },
            { label: "Medium", value: "medium" },
            { label: "Tall", value: "tall" },
          ],
        },
        cta: LinkField as any,
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        height: "short",
        width: "full",
        cta: {
          type: "internal",
          label: "View Portfolio",
          url: "portfolio"
        },
        spacing: { pt: "0", pb: "0", mt: "0", mb: "0" },
      },
      render: ({ imageUrl, cta, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <div className="relative">
            <HeroVisual 
              imageUrl={imageUrl} 
              showCta={false} 
            />
            {cta?.label && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-24">
                <div className="pointer-events-auto">
                  <LinkButton link={cta} />
                </div>
              </div>
            )}
          </div>
        </ComponentWrapper>
      ),
    },
    TextContent: {
      fields: {
        showLogo: { 
          type: "radio", 
          options: [
            { label: "Show Logo", value: true }, 
            { label: "Show Text", value: false }
          ] 
        },
        title1: { type: "text" },
        title2: { type: "text" },
        accent: { type: "text" },
        tagline: { type: "text" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        showLogo: true,
        title1: "EXPOSED",
        title2: "BRICK",
        accent: "MEDIA",
        tagline: "HIGH-FIDELITY ARCHITECTURAL NARRATIVES",
        width: "full",
        spacing: { pt: "0", pb: "0", mt: "0", mb: "20" },
      },
      render: ({ title1, title2, accent, tagline, showLogo, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <BrandHeader override={{ title1, title2, accent, tagline, showLogo }} />
        </ComponentWrapper>
      ),
    },
    Portfolio: {
      fields: {
        variant: {
          type: "select",
          options: [
            { label: "Classic Grid", value: "grid" },
            { label: "Gallery Masonry", value: "gallery" }
          ]
        },
        panel: {
          type: "select",
          options: [
            { label: "Main Panel Items", value: "main" },
            { label: "Side Panel Items", value: "side" }
          ]
        },
        limit: { type: "number" },
        showFilter: { 
          type: "radio",
          options: [
            { label: "Show", value: true },
            { label: "Hide", value: false }
          ]
        },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        variant: "grid",
        panel: "main",
        showFilter: true,
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ variant, panel, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <Portfolio variant={variant} panel={panel as any} />
        </ComponentWrapper>
      ),
    },
    Services: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        title: "SERVICES",
        subtitle: "Refined Solutions",
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ title, subtitle, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <Services override={{ title, subtitle }} />
        </ComponentWrapper>
      ),
    },
    Contact: {
      fields: {
        title: { type: "text" },
        description: { type: "text" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        title: "GET IN TOUCH",
        description: "Let's discuss your next project",
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ title, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <BookingForm override={{ title }} />
        </ComponentWrapper>
      ),
    },
    Footer: {
      fields: {
        quote: { type: "text" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        quote: "Elegance is the only beauty that never fades.",
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ quote, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <FooterContent override={{ quote }} />
        </ComponentWrapper>
      ),
    },
    Spacer: {
      fields: {
        size: { 
          type: "number",
          min: 0,
          max: 200
        },
        width: WidthField as any,
        spacing: SpacingControl as any,
      },
      defaultProps: {
        size: 40,
        width: "full",
        spacing: { pt: "0", pb: "0", mt: "0", mb: "0" },
      },
      render: ({ size, width, spacing }) => (
        <ComponentWrapper width={width} spacing={spacing}>
          <div style={{ height: `${size}px` }} />
        </ComponentWrapper>
      ),
    },
    Testimonials: {
      fields: {
        maxItems: { type: "number" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: { maxItems: 5, width: "full", spacing: { pt: "32", pb: "32", mt: "0", mb: "0" } },
      render: ({ maxItems, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <TestimonialCarousel maxItems={maxItems} />
        </ComponentWrapper>
      ),
    },
    PropertyHighlight: {
      fields: {
        mediaUrl: MediaField("Highlight Media", "video/*", "properties"),
        mediaType: { 
          type: "select", 
          options: [{label: "Image", value: "image"}, {label: "Video", value: "video"}] 
        },
        autoPlay: { type: "radio", options: [{ label: "On", value: true }, { label: "Off", value: false }] },
        daysOnMarket: { type: "number" },
        salePrice: { type: "text" },
        listPrice: { type: "text" },
        packageUsed: { type: "text" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        mediaUrl: "https://images.unsplash.com/photo-1600607687940-c52fb036999c",
        mediaType: "image",
        autoPlay: true,
        daysOnMarket: 14,
        salePrice: "$1,250,000",
        listPrice: "$1,150,000",
        packageUsed: "Cinematic Plus",
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ mediaUrl, mediaType, autoPlay, daysOnMarket, salePrice, listPrice, packageUsed, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <PropertyHighlight 
            mediaUrl={mediaUrl} 
            mediaType={mediaType} 
            autoPlay={autoPlay}
            daysOnMarket={daysOnMarket} 
            salePrice={salePrice} 
            listPrice={listPrice} 
            packageUsed={packageUsed} 
          />
        </ComponentWrapper>
      ),
    },
    TourEmbed: {
      fields: {
        url: { type: "text" },
        height: { type: "number" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: { url: "", height: 600, width: "full", spacing: { pt: "32", pb: "32", mt: "0", mb: "0" } },
      render: ({ url, height, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <TourEmbed url={url} height={height} />
        </ComponentWrapper>
      ),
    },
    LogoCloud: {
      fields: {
        logos: {
          type: "array",
          getItemSummary: (item) => item.alt || "Logo",
          arrayFields: {
            url: MediaField("Logo", "image/*", "logos") as any,
            alt: { type: "text" },
            link: { type: "text" },
          },
        },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
        logos: [
          { url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Compass_logo.svg", alt: "Compass" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Sotheby%27s_International_Realty_logo.svg", alt: "Sotheby's" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Coldwell_Banker_logo.svg", alt: "Coldwell Banker" },
        ]
      },
      render: ({ logos, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <LogoCloud logos={logos} />
        </ComponentWrapper>
      ),
    },
    InstagramFeed: {
      fields: {
        username: { type: "text" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: { username: "exposedbrickmedia", width: "full", spacing: { pt: "32", pb: "32", mt: "0", mb: "0" } },
      render: ({ username, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <InstagramFeed username={username} />
        </ComponentWrapper>
      ),
    },
    MediaEmbed: {
      fields: {
        url: MediaField("Media Source", "image/*", "embeds"),
        mediaType: { 
          type: "select", 
          options: [{label: "Image", value: "image"}, {label: "Video", value: "video"}] 
        },
        widthPercentage: { type: "number", min: 10, max: 100 },
        aspectRatio: {
          type: "select",
          options: [
            { label: "16:9", value: "16/9" },
            { label: "4:3", value: "4/3" },
            { label: "1:1", value: "1/1" },
            { label: "9:16", value: "9/16" },
            { label: "4:5", value: "4/5" },
          ]
        },
        customHeight: { type: "number" },
        objectFit: {
          type: "radio",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" }
          ]
        },
        autoPlay: { type: "radio", options: [{ label: "On", value: true }, { label: "Off", value: false }] },
        loop: { type: "radio", options: [{ label: "On", value: true }, { label: "Off", value: false }] },
        muted: { type: "radio", options: [{ label: "On", value: true }, { label: "Off", value: false }] },
        showControls: { type: "radio", options: [{ label: "On", value: true }, { label: "Off", value: false }] },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
        styles: StylesField as any,
      },
      defaultProps: {
        url: "https://images.unsplash.com/photo-1600607687940-c52fb036999c",
        mediaType: "image",
        widthPercentage: 100,
        aspectRatio: "16/9",
        customHeight: 0,
        objectFit: "cover",
        autoPlay: true,
        loop: true,
        muted: true,
        showControls: false,
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ url, mediaType, widthPercentage, aspectRatio, customHeight, objectFit, autoPlay, loop, muted, showControls, width, spacing, entranceAnimation, styles }) => {
        return (
          <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation} styles={styles}>
            <div className="w-full flex justify-center">
              <div 
                style={{ 
                  width: `${widthPercentage}%`, 
                  aspectRatio: customHeight ? undefined : aspectRatio, 
                  height: customHeight ? `${customHeight}px` : undefined 
                }} 
                className="overflow-hidden bg-white/5 relative group border border-white/10"
              >
                {mediaType === 'video' ? (
                  url ? <video src={url} autoPlay={autoPlay} loop={loop} muted={muted} controls={showControls} playsInline className={`w-full h-full object-${objectFit}`} /> : null
                ) : (
                  url ? <img src={url} className={`w-full h-full object-${objectFit}`} alt="" /> : null
                )}
              </div>
            </div>
          </ComponentWrapper>
        )
      }
    },
    DynamicGallery: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        images: MediaPickerField as any,
        layout: {
          type: "select",
          options: [
            { label: "Standard Grid", value: "grid" },
            { label: "Artistic Masonry", value: "masonry" },
            { label: "Asymmetric Bento Showcase", value: "bento" },
            { label: "Fluid Carousel Scrollstrip", value: "carousel" },
          ]
        },
        columns: {
          type: "number",
        },
        aspectRatio: {
          type: "select",
          options: [
            { label: "16:9 Cinema", value: "16/9" },
            { label: "4:3 Classic", value: "4/3" },
            { label: "1:1 Perfect Square", value: "1/1" },
            { label: "3:4 Portrait", value: "portrait" },
            { label: "Variable (Auto Heights)", value: "auto" },
          ]
        },
        grayscaleEffect: {
          type: "select",
          options: [
            { label: "None", value: "none" },
            { label: "Artistic (Grayscale until Hover)", value: "hover-color" },
            { label: "Always Black & White", value: "always-grayscale" },
          ]
        },
        lightbox: {
          type: "radio",
          options: [
            { label: "Enabled (Fullscreen Slide View)", value: true },
            { label: "Disabled", value: false },
          ]
        },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        title: "Selected Property Stories",
        subtitle: "High-fidelity captures handpicked from our architectural detail files.",
        images: [],
        layout: "grid",
        columns: 3,
        aspectRatio: "16/9",
        grayscaleEffect: "hover-color",
        lightbox: true,
        width: "full",
        spacing: { pt: "40", pb: "40", mt: "0", mb: "0" },
      },
      render: ({ title, subtitle, images, layout, columns, aspectRatio, grayscaleEffect, lightbox, width, spacing, entranceAnimation }) => {
        return (
          <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
            <DynamicCuratedGallery
              title={title}
              subtitle={subtitle}
              images={images}
              layout={layout}
              columns={columns}
              aspectRatio={aspectRatio}
              grayscaleEffect={grayscaleEffect}
              lightbox={lightbox}
            />
          </ComponentWrapper>
        );
      }
    },
    HTMLEmbed: {
      fields: {
        html: { type: "textarea" },
        height: { type: "number" },
        title: { type: "text" },
        wrapInIframe: { 
          type: "radio",
          options: [
            { label: "Inline", value: false },
            { label: "Iframe (Isolated)", value: true }
          ]
        },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        html: "<div style=\"padding: 20px; background: #eee; text-align: center;\">Custom HTML content</div>",
        wrapInIframe: false,
        title: "HTML Embed",
        height: 400,
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ html, height, title, wrapInIframe, width, spacing, entranceAnimation }) => {
        const content = wrapInIframe ? (
          <iframe
            srcDoc={html}
            title={title}
            style={{ width: '100%', height: height ? `${height}px` : 'auto', border: 'none' }}
            sandbox="allow-scripts allow-top-navigation allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <InlineHTML html={html} height={height} />
        );
        return (
          <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
            {content}
          </ComponentWrapper>
        );
      }
    },
    ServicePackages: {
      fields: {
        sectionLabel: { type: "text" },
        title: { type: "text" },
        subtitle: { type: "textarea" },
        packages: {
          type: "array",
          getItemSummary: (p: any) => p.name || "Package",
          arrayFields: {
            name: { type: "text" },
            tierLabel: { type: "text" },
            price: { type: "text" },
            billingUnit: { type: "text" },
            featuresText: { type: "textarea" },
            buttonText: { type: "text" },
            isPopular: {
              type: "radio",
              options: [
                { label: "No", value: false },
                { label: "Yes (Popular Gold Theme)", value: true }
              ]
            },
            customLink: { type: "text" }
          }
        },
        byoHeading: { type: "text" },
        byoSubtitle: { type: "textarea" },
        byoItems: {
          type: "array",
          getItemSummary: (i: any) => i.title || "Add-on Item",
          arrayFields: {
            id: { type: "text" },
            title: { type: "text" },
            description: { type: "text" },
            price: { type: "number" },
            iconName: {
              type: "select",
              options: [
                { label: "Camera", value: "camera" },
                { label: "Plane / Drone", value: "plane" },
                { label: "Stairs / Floor Plans", value: "stairs" },
                { label: "Box / 3D Virtual Tour", value: "box" },
                { label: "Video", value: "video" },
                { label: "Home", value: "home" }
              ]
            }
          }
        },
        byoButtonText: { type: "text" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        sectionLabel: "INVESTMENT",
        title: "High-Fidelity Packages",
        subtitle: "Elevating real estate through cinematic visual storytelling. Select a curated tier or build a bespoke production suite.",
        packages: [
          {
            name: "Essential",
            tierLabel: "ENTRY TIER",
            price: "$495",
            billingUnit: "/ PROJECT",
            featuresText: "25 Professional Interior Photos\n3 Aerial Drone Stills\n2D Schematic Floor Plan\n!3D Matterport Tour",
            buttonText: "SELECT PACKAGE",
            isPopular: false,
            customLink: ""
          },
          {
            name: "Professional",
            tierLabel: "PRODUCTION STANDARD",
            price: "$850",
            billingUnit: "/ PROJECT",
            featuresText: "40 High-End Interior Photos\n10 Aerial Drone 4K Stills\n2D & 3D Interactive Floor Plans\nMatterport 3D Tour (6 Months)\nSocial Media Teaser Video",
            buttonText: "BOOK NOW",
            isPopular: true,
            customLink: ""
          },
          {
            name: "Elite",
            tierLabel: "LUXURY SUITE",
            price: "$1,450",
            billingUnit: "/ PROJECT",
            featuresText: "Unlimited Multi-Flash Interior Photos\nAerial 4K Cinematic Video (60s)\nPremium Dollhouse 3D Render\nFull Walkthrough Cinematic Film\nTwilight Session Included",
            buttonText: "SELECT PACKAGE",
            isPopular: false,
            customLink: ""
          }
        ],
        byoHeading: "Build Your Own",
        byoSubtitle: "Tailor our services to your specific project needs.",
        byoItems: [
          {
            id: "still-photo",
            title: "STILL PHOTOGRAPHY",
            description: "Base 15 Photos",
            price: 150,
            iconName: "camera"
          },
          {
            id: "drone-coverage",
            title: "DRONE COVERAGE",
            description: "Aerial Stills + Video",
            price: 200,
            iconName: "plane"
          },
          {
            id: "floor-plans",
            title: "FLOOR PLANS",
            description: "2D Laser Measured",
            price: 125,
            iconName: "stairs"
          },
          {
            id: "3d-virtual-tour",
            title: "3D VIRTUAL TOUR",
            description: "Matterport Hosting",
            price: 300,
            iconName: "box"
          }
        ],
        byoButtonText: "GENERATE CUSTOM QUOTE",
        width: "full",
        spacing: { pt: "64", pb: "64", mt: "0", mb: "0" },
      },
      render: ({ sectionLabel, title, subtitle, packages, byoHeading, byoSubtitle, byoItems, byoButtonText, width, spacing, entranceAnimation }) => {
        const [selectedBYO, setSelectedBYO] = React.useState<string[]>([]);
        const [byoStep, setByoStep] = React.useState<number>(1);
        const [byoSubmitted, setByoSubmitted] = React.useState<boolean>(false);
        const [byoLoading, setByoLoading] = React.useState<boolean>(false);
        const [contactData, setContactData] = React.useState({
          name: "",
          email: "",
          address: "",
          message: ""
        });

        const toggleBYO = (id: string) => {
          setSelectedBYO(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
          );
        };

        const totalBYOPrice = React.useMemo(() => {
          return byoItems.reduce((acc, item) => {
            if (selectedBYO.includes(item.id)) {
              return acc + (Number(item.price) || 0);
            }
            return acc;
          }, 0);
        }, [byoItems, selectedBYO]);

        const selectedItemsSummaryText = React.useMemo(() => {
          const names = byoItems
            .filter(item => selectedBYO.includes(item.id))
            .map(item => `${item.title} ($${item.price})`)
            .join(", ");
          return names ? `Selected Add-ons: ${names}` : "No add-ons selected";
        }, [byoItems, selectedBYO]);

        const handleBYOSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!contactData.name || !contactData.email || !contactData.address) {
            return;
          }
          setByoLoading(true);
          try {
            const response = await fetch("/api/crm/inquire", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                propertyAddress: contactData.address,
                realtorName: contactData.name,
                email: contactData.email,
                serviceType: `Custom Package - Total: $${totalBYOPrice}. Details: ${selectedItemsSummaryText}. Message: ${contactData.message || 'No additional note.'}`
              })
            });
            if (response.ok) {
              setByoSubmitted(true);
            } else {
              alert("There was an issue submitting your custom packages quote. Please try again.");
            }
          } catch (err) {
            console.error("Custom BYO inquiry submission failed:", err);
          } finally {
            setByoLoading(false);
          }
        };

        return (
          <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
            <section className="bg-charcoal text-white py-12 px-4 sm:px-6 lg:px-8 w-full overflow-hidden select-text">
              <div className="max-w-4xl mx-auto text-center mb-16">
                {sectionLabel && (
                  <span className="text-brick-copper text-[11px] tracking-[0.6em] font-black uppercase block mb-3 font-mono">
                    {sectionLabel}
                  </span>
                )}
                {title && (
                  <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white italic tracking-tighter leading-none mb-4 font-medium">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm sm:text-base text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24 items-stretch">
                {packages && packages.map((pkg, idx) => {
                  const features = pkg.featuresText 
                    ? pkg.featuresText.split("\n").filter(f => f.trim())
                    : [];
                  
                  return (
                    <div 
                      key={idx}
                      className={`flex flex-col justify-between h-full relative p-8 rounded transition-all duration-500 shadow-lg ${
                        pkg.isPopular 
                          ? "bg-[#111111]/95 border border-brick-copper hover:border-brick-copper/80 scale-[1.02] md:scale-[1.03] z-[2]" 
                          : "bg-[#111111]/70 hover:bg-[#151515] border border-white/5 hover:border-white/10 z-[1]"
                      }`}
                    >
                      {pkg.isPopular && (
                        <div className="absolute -top-3 right-6 bg-brick-copper text-charcoal text-[8px] tracking-[0.25em] font-black font-mono py-1 px-4 uppercase rounded shadow-sm">
                          MOST POPULAR
                        </div>
                      )}
                      
                      <div>
                        {pkg.tierLabel && (
                          <span className="text-[10px] tracking-widest text-[#cfa073]/80 uppercase font-mono font-bold mb-4 block">
                            {pkg.tierLabel}
                          </span>
                        )}
                        <h3 className="font-display text-3xl italic text-white mb-2 leading-tight">
                          {pkg.name}
                        </h3>
                        <div className="flex items-baseline mb-6">
                          <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
                            {pkg.price}
                          </span>
                          {pkg.billingUnit && (
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-2 font-mono">
                              {pkg.billingUnit}
                            </span>
                          )}
                        </div>

                        <div className="w-full h-px bg-white/5 my-6" />

                        <ul className="space-y-4 mb-8 text-left">
                          {features.map((feat, fidx) => {
                            const isExcluded = feat.startsWith("!");
                            const cleanText = isExcluded ? feat.substring(1) : feat;
                            
                            return (
                              <li key={fidx} className="flex items-center gap-3">
                                {isExcluded ? (
                                  <Ban size={14} className="text-neutral-700 shrink-0" />
                                ) : (
                                  <Check size={14} className="text-brick-copper shrink-0" />
                                )}
                                <span className={`text-xs font-light font-sans tracking-wide ${
                                  isExcluded 
                                    ? "text-white/20 line-through font-light" 
                                    : "text-white/85"
                                }`}>
                                  {cleanText}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div className="mt-auto pt-4">
                        {pkg.customLink ? (
                          <Link 
                            to={pkg.customLink}
                            className={`block w-full py-3.5 text-center text-[10px] tracking-[0.25em] uppercase font-black transition-all duration-300 font-mono shadow-sm ${
                              pkg.isPopular 
                                ? "bg-brick-copper hover:bg-white text-charcoal" 
                                : "border border-white/10 hover:border-white text-white hover:bg-white/5"
                            }`}
                          >
                            {pkg.buttonText}
                          </Link>
                        ) : (
                          <a 
                            href="#inquire" 
                            className={`block w-full py-3.5 text-center text-[10px] tracking-[0.25em] uppercase font-black transition-all duration-300 font-mono shadow-sm cursor-pointer ${
                              pkg.isPopular 
                                ? "bg-brick-copper hover:bg-white text-charcoal animate-pulse" 
                                : "border border-white/10 hover:border-white text-white hover:bg-white/5"
                            }`}
                            onClick={(e) => {
                              const inquireEl = document.getElementById("inquire");
                              if (inquireEl) {
                                e.preventDefault();
                                inquireEl.scrollIntoView({ behavior: "smooth" });
                                const nameInput = document.querySelector('input[placeholder="Your Name / Agency"]') as HTMLInputElement;
                                if (nameInput) nameInput.focus();
                              }
                            }}
                          >
                            {pkg.buttonText}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border border-white/5 bg-[#0a0a0a]/60 shadow-xl rounded p-8 sm:p-12 md:p-16 max-w-6xl mx-auto w-full relative overflow-hidden">
                {byoStep === 1 ? (
                  <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
                      <div>
                        {byoHeading && (
                          <h3 className="font-display text-2xl sm:text-4xl text-white italic tracking-tight mb-2">
                            {byoHeading}
                          </h3>
                        )}
                        {byoSubtitle && (
                          <p className="text-xs sm:text-sm text-white/50 font-light">
                            {byoSubtitle}
                          </p>
                        )}
                      </div>
                      <div className="text-left md:text-right">
                        <span className="text-[10px] tracking-widest text-white/40 uppercase font-mono font-bold mb-1 block">
                          ESTIMATED TOTAL
                        </span>
                        <div className="text-3xl sm:text-4xl font-mono text-brick-copper font-black tracking-tight">
                          ${totalBYOPrice}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 mb-12">
                      {byoItems && byoItems.map((item, idx) => {
                        const isSelected = selectedBYO.includes(item.id);
                        
                        return (
                          <div 
                            key={item.id || idx}
                            onClick={() => toggleBYO(item.id)}
                            className={`flex flex-col justify-between p-6 border transition-all duration-300 rounded cursor-pointer select-none text-left h-full relative overflow-hidden group min-h-[180px] ${
                              isSelected 
                                ? "border-brick-copper bg-brick-copper/[0.04] shadow-md scale-[1.01]" 
                                : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className="absolute top-4 right-4 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 pointer-events-none">
                              {isSelected ? (
                                <div className="w-2.5 h-2.5 rounded-full bg-brick-copper" />
                              ) : (
                                <div className="w-2.5 h-2.5 rounded-full bg-transparent border border-white/15" />
                              )}
                            </div>

                            <div className="mb-6">
                              {(() => {
                                if (item.iconName === "camera") return <Camera size={20} className="text-brick-copper/80 group-hover:scale-110 transition-transform duration-300" />;
                                if (item.iconName === "plane") return <Plane size={20} className="text-brick-copper/80 group-hover:scale-110 transition-transform duration-300" />;
                                if (item.iconName === "box") return <Layers size={20} className="text-brick-copper/80 group-hover:scale-110 transition-transform duration-300" />;
                                if (item.iconName === "stairs") {
                                  return (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-brick-copper/80 group-hover:scale-110 transition-transform duration-300">
                                      <path d="M19 19H5" />
                                      <path d="M14 19H9" />
                                      <path d="M9 19H4" />
                                      <path d="M19 14h-5" />
                                      <path d="M14 14v5" />
                                      <line x1="14" y1="9" x2="9" y2="9" />
                                      <line x1="9" y1="9" x2="9" y2="14" />
                                      <line x1="9" y1="4" x2="4" y2="4" />
                                      <line x1="4" y1="4" x2="4" y2="9" />
                                    </svg>
                                  );
                                }
                                return <Sparkles size={20} className="text-brick-copper/80 group-hover:scale-110 transition-transform duration-300" />;
                              })()}
                            </div>

                            <div>
                              <h4 className="text-[11px] tracking-widest text-white/90 font-mono font-bold uppercase mb-1">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-white/40 font-light tracking-wide mb-6">
                                {item.description}
                              </p>
                              <div className="text-base font-mono text-white/70 group-hover:text-brick-copper transition-colors font-bold">
                                ${item.price}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={() => {
                          if (selectedBYO.length === 0) {
                            alert("Please select at least one package add-on to generate a custom quote.");
                            return;
                          }
                          setByoStep(2);
                        }}
                        disabled={selectedBYO.length === 0}
                        className="py-4 px-12 bg-brick-copper hover:bg-white text-charcoal font-semibold text-[10px] uppercase tracking-widest transition-all duration-300 tracking-[0.25em] font-mono shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {byoButtonText}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fadeIn max-w-xl mx-auto">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-8">
                      <h3 className="font-display text-xl text-white italic font-medium">Bespoke Suite Specifications</h3>
                      <button 
                        onClick={() => setByoStep(1)} 
                        className="text-[10px] uppercase tracking-widest text-white/50 hover:text-brick-copper transition-colors font-mono"
                      >
                        ← Back to Selector
                      </button>
                    </div>

                    {byoSubmitted ? (
                      <div className="text-center py-12">
                        <Check size={40} className="text-brick-copper mx-auto mb-4 animate-bounce" />
                        <h4 className="font-display text-2xl text-white italic mb-2">Quote Transmitted</h4>
                        <p className="text-xs text-white/50 max-w-sm mx-auto mb-6">
                          Your selections have been securely transferred to our CRM dashboard. An advisory partner will contact you shortly with custom schedules.
                        </p>
                        <button 
                          onClick={() => {
                            setByoSubmitted(false);
                            setSelectedBYO([]);
                            setByoStep(1);
                            setContactData({ name: "", email: "", address: "", message: "" });
                          }}
                          className="text-[9px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white font-mono py-2.5 px-6 rounded transition-all"
                        >
                          Configure Another Quote
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleBYOSubmit} className="space-y-6 text-left">
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded">
                          <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-bold block mb-1">
                            Your Selections Summary
                          </span>
                          <p className="text-xs text-brick-copper font-medium">
                            {selectedItemsSummaryText}
                          </p>
                          <span className="text-sm font-mono font-bold text-white block mt-2">
                            Estimated Price: ${totalBYOPrice}
                          </span>
                        </div>

                        <div className="border-b border-white/10 pb-2">
                          <label className="block text-[9px] uppercase tracking-widest text-white/50 mb-1">Property Address</label>
                          <input 
                            required
                            type="text" 
                            placeholder="Address of the project" 
                            className="bg-transparent w-full outline-none text-xs py-1 placeholder:text-white/10 border-none p-0 focus:ring-0 text-white"
                            value={contactData.address}
                            onChange={e => setContactData({ ...contactData, address: e.target.value })}
                          />
                        </div>

                        <div className="border-b border-white/10 pb-2">
                          <label className="block text-[9px] uppercase tracking-widest text-white/50 mb-1">Your Full Name</label>
                          <input 
                            required
                            type="text" 
                            placeholder="Full name / Realtor agency" 
                            className="bg-transparent w-full outline-none text-xs py-1 placeholder:text-white/10 border-none p-0 focus:ring-0 text-white"
                            value={contactData.name}
                            onChange={e => setContactData({ ...contactData, name: e.target.value })}
                          />
                        </div>

                        <div className="border-b border-white/10 pb-2">
                          <label className="block text-[9px] uppercase tracking-widest text-white/50 mb-1">Email Coordinates</label>
                          <input 
                            required
                            type="email" 
                            placeholder="your@email.com" 
                            className="bg-transparent w-full outline-none text-xs py-1 placeholder:text-white/10 border-none p-0 focus:ring-0 text-white"
                            value={contactData.email}
                            onChange={e => setContactData({ ...contactData, email: e.target.value })}
                          />
                        </div>

                        <div className="border-b border-white/10 pb-2">
                          <label className="block text-[9px] uppercase tracking-widest text-white/50 mb-1">Message Detail (Optional)</label>
                          <textarea 
                            rows={2}
                            placeholder="Any specific instructions or timeframe constraints..." 
                            className="bg-transparent w-full outline-none text-xs py-1 placeholder:text-white/10 border-none p-0 focus:ring-0 text-white resize-none"
                            value={contactData.message}
                            onChange={e => setContactData({ ...contactData, message: e.target.value })}
                          />
                        </div>

                        <div className="pt-4 flex gap-4">
                          <button 
                            type="button"
                            onClick={() => setByoStep(1)}
                            className="flex-1 py-4 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-[10px] uppercase tracking-widest font-mono duration-300"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            disabled={byoLoading}
                            className="flex-1 py-4 bg-brick-copper hover:bg-white text-charcoal font-semibold text-[10px] uppercase tracking-widest transition-all duration-300 font-mono shadow-md disabled:opacity-50"
                          >
                            {byoLoading ? "Transmission..." : "Submit Proposal"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </section>
          </ComponentWrapper>
        );
      }
    }
  }
};
};

export const BASELINE_LAYOUT = {
  content: [],
  root: {
    props: {
      title: "Home",
      side: [
        {
          type: "TextContent",
          props: {
            id: "brand-header-1",
            title1: "EXPOSED",
            title2: "BRICK",
            accent: "MEDIA",
            tagline: "HIGH-FIDELITY ARCHITECTURAL NARRATIVES"
          }
        },
        {
          type: "Services",
          props: { id: "services-1" }
        },
        {
          type: "Portfolio",
          props: { id: "portfolio-side", panel: "side" }
        }
      ],
      main: [
        {
          type: "MediaBackground",
          props: {
            id: "hero-1",
            mediaUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
            mediaType: "image",
            height: "h-[80vh] min-h-[600px]",
            overlayOpacity: 40,
            content: [
              {
                type: "FlexBox",
                props: {
                  id: "hero-1-flex",
                  direction: "flex-col",
                  align: "items-center",
                  justify: "justify-center",
                  gap: 24,
                  content: [
                    {
                      type: "Button",
                      props: {
                        id: "hero-1-cta",
                        link: { type: "internal", url: "portfolio", label: "View Portfolio" },
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
          type: "Portfolio",
          props: { id: "portfolio-main", panel: "main" }
        },
        {
          type: "Contact",
          props: { id: "contact-1" }
        },
        {
          type: "Footer",
          props: { id: "footer-1" }
        }
      ]
    }
  }
};
