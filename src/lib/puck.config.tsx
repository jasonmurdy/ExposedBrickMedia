/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { MoveUpRight, Shield, User, Globe, Mail, Phone, Download, FileText, Box as BoxIcon } from "lucide-react";
import { Config } from "@puckeditor/core";
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
const SpacingWrapper = ({ spacing, children, className = "", style = {} }: { spacing: any, children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div 
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
  };
  components: {
    Section: {
      spacing: any;
      columns: string;
      padding: string;
      background: "bg-transparent" | "bg-bg-primary" | "bg-bg-secondary" | "bg-charcoal text-white";
      bgImage?: string;
      overlayOpacity: number;
      blur: number;
      parallax: boolean;
      gradientDirection: string;
      anchorId?: string;
      layout: "boxed" | "full";
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
    Container: {
      spacing: any;
      background: "bg-transparent" | "glass" | "bg-charcoal" | "bg-white/5";
      border: boolean;
      padding: number;
      width: "full" | "half";
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
    CinematicHero: {
      title: string;
      subtitle: string;
      mediaUrl: string;
      mediaType: "video" | "image";
      ctaText: string;
      ctaUrl: string;
      content?: React.ReactNode;
      spacing?: any;
      entranceAnimation?: string;
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
      align: "left" | "center" | "right";
      tracking: string;
      lineHeight: string;
      accent: boolean;
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
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
      content?: React.ReactNode;
      spacing?: any;
      entranceAnimation?: string;
    };
    TextContent: {
      title1: string;
      title2: string;
      accent: string;
      tagline: string;
      width: "full" | "half";
      content?: React.ReactNode;
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
      content?: React.ReactNode;
      spacing?: any;
      entranceAnimation?: string;
      styles?: string;
    };
    PropertyHighlight: {
      mediaUrl: string;
      mediaType: "image" | "video";
      autoPlay?: boolean;
      daysOnMarket: number;
      salePrice: string;
      listPrice: string;
      packageUsed: string;
      content?: React.ReactNode;
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
      width: "full" | "half";
      spacing?: any;
      entranceAnimation?: string;
    };
  };
};

export const createConfig = (pages: any[] = [], portfolioItems: any[] = [], partners: any[] = [], teams: any[] = [], brandResources: any[] = []): Config<PuckConfig> => {
  const pageOptions = pages.map(p => ({ label: p.title || p.slug, value: p.slug }));
  const partnerOptions = partners.map(p => ({ label: p.displayName, value: p.id }));
  
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

  const ComponentWrapper = ({ width, spacing, entranceAnimation, styles, children }: { width?: "full" | "half", spacing?: any, entranceAnimation?: string, styles?: string, children: React.ReactNode }) => {
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
        className={`${width === 'half' ? 'w-full lg:w-1/2' : 'w-full'} overflow-hidden ${styles || ""}`}
      >
        <SpacingWrapper spacing={spacing}>
          {children}
        </SpacingWrapper>
      </motion.div>
    );
  };
  
  return {
    categories: {
      Layout: {
        components: ["Section", "Columns", "Container", "Spacer", "DynamicGrid"],
      },
      Typography: {
        components: ["Heading", "RichText", "TextContent"],
      },
      Media: {
        components: ["Hero", "CinematicHero", "MediaEmbed", "TourEmbed", "PDFReader", "BrandGallery"],
      },
      Interactive: {
        components: ["Button", "Contact", "Testimonials", "LogoCloud", "InstagramFeed"],
      },
      Integrations: {
        components: ["PartnerShowcase", "PropertyHighlight", "HTMLEmbed"],
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
        main: { type: "slot" },
        side: { type: "slot" },
        layoutMode: {
          type: "radio",
          options: [
            { label: "1 Panel (Full)", value: "one-panel" },
            { label: "2 Panel (Split)", value: "two-panel" }
          ]
        }
      },
      defaultProps: {
        layoutMode: "two-panel"
      },
      render: ({ children, title, description, ogImage, layoutMode = "two-panel", main, side }) => {
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
                  {main()}
                </div>
                {children}
              </main>
            </div>
          );
        }

        return (
          <div className="flex flex-col lg:flex-row min-h-screen bg-bg-primary overflow-hidden">
            {/* LEFT COLUMN: BRAND & SERVICES */}
            <aside className="hidden lg:flex w-1/3 border-r border-border-subtle flex-col p-8 md:p-12 lg:p-16 pt-32 lg:pt-12 overflow-y-auto no-scrollbar">
              <div className="flex flex-col flex-wrap lg:flex-nowrap gap-y-4">
                {side()}
              </div>
            </aside>

            {/* RIGHT AREA: HERO, PORTFOLIO & BOOKING */}
            <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-20 lg:pt-0">
              <div className="flex flex-wrap content-start">
                {main()}
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

          if (layout === 'card') {
            return (
              <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
                <div className="px-8">
                  <Link to={`/partners/${partner.id}`} className="group block bg-white/5 border border-white/5 hover:border-brick-copper/30 transition-all p-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 overflow-hidden bg-charcoal border border-white/5 grayscale group-hover:grayscale-0 transition-all">
                        {partner.headshotUrl ? (
                           <img src={partner.headshotUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-20"><User size={32} /></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-display text-2xl italic text-white group-hover:text-brick-copper transition-colors">{partner.displayName}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-white/40">{partner.role || 'Strategic Partner'}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </ComponentWrapper>
            );
          }

          return (
            <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
              <div className="px-8 md:px-12 lg:px-16 py-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                   <div className="aspect-square bg-charcoal border border-white/5 overflow-hidden grayscale">
                      {partner.headshotUrl ? (
                         <img src={partner.headshotUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center opacity-10"><Shield size={120} /></div>
                      )}
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                         <span className="w-12 h-[1px] bg-brick-copper" />
                         <span className="text-[10px] uppercase tracking-widest text-brick-copper font-black">Verified Narrative Advisor</span>
                      </div>
                      <h3 className="font-display text-5xl md:text-7xl italic leading-none">{partner.displayName}<span className="text-brick-copper">.</span></h3>
                      <p className="text-text-primary/60 italic font-serif leading-relaxed text-lg">{partner.bio || "Crafting premium architectural experiences through high-fidelity visual narratives."}</p>
                      <div className="flex gap-4 pt-4">
                         <Link to={`/partners/${partner.id}`} className="px-8 py-3 bg-brick-copper text-charcoal text-[9px] uppercase font-black tracking-widest hover:bg-white transition-all">View Showcase</Link>
                         {partner.email && <a href={`mailto:${partner.email}`} className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"><Mail size={14} /></a>}
                      </div>
                   </div>
                </div>

                {showAssets && partner.resources && partner.resources.length > 0 && (
                  <div className="pt-12 border-t border-white/5">
                     <h5 className="text-[11px] uppercase tracking-[0.4em] text-white/30 mb-8">Direct Brand Resources</h5>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {partner.resources.map((res: any, idx: number) => (
                          <div key={idx} className="bg-white/5 border border-white/5 p-6 hover:border-brick-copper/50 transition-all flex flex-col justify-between">
                             <div className="mb-6">
                                <FileText className="text-brick-copper/40 mb-3" size={16} />
                                <h6 className="text-sm font-display italic text-white">{res.name}</h6>
                             </div>
                             <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-[9px] uppercase tracking-widest text-brick-copper border-b border-brick-copper/20 self-start hover:text-white transition-colors">Download Asset</a>
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
          width: WidthField as any,
          spacing: SpacingControl as any,
          entranceAnimation: EntranceAnimationField as any,
        },
        defaultProps: {
          url: "",
          title: "Technical Archive",
          width: "full",
          spacing: { pt: "40", pb: "40", mt: "0", mb: "0" },
        },
        render: ({ url, title, width, spacing, entranceAnimation }) => {
          if (!url) return <div className="p-12 text-center opacity-20 italic">Upload a PDF to initialize the reader.</div>;
          return (
            <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
              <div className="px-4 md:px-8">
                <PDFViewer fileUrl={url} title={title} />
              </div>
            </ComponentWrapper>
          );
        }
      },
    Section: {
      fields: {
        spacing: SpacingControl as any,
        columns: {
           type: "select",
           options: [
             { label: "Single Column", value: "max-w-4xl mx-auto" },
             { label: "Two Column Split", value: "grid grid-cols-1 lg:grid-cols-2 gap-16" },
             { label: "Cinematic Full Width", value: "w-full" }
           ]
        },
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
          ],
        },
        children: { type: "slot" },
        styles: StylesField as any,
      },
      defaultProps: {
        spacing: { pt: "0", pb: "0", mt: "0", mb: "0" },
        columns: "max-w-4xl mx-auto",
        padding: "py-16",
        background: "bg-bg-primary",
        overlayOpacity: 50,
        blur: 0,
        parallax: false,
        layout: "boxed",
      },
      render: ({ spacing, columns, padding, background, bgImage, overlayOpacity, blur, parallax, gradientDirection, anchorId, layout, styles, children }) => (
        <SpacingWrapper spacing={spacing} className={`relative ${background} overflow-hidden group/section ${styles || ""}`} id={anchorId}>
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
          <div className={`relative z-10 transition-all ${layout === 'boxed' ? 'max-w-7xl mx-auto px-8 md:px-16' : 'w-full px-8 md:px-16'} ${padding}`}>
            <div className={`min-h-[100px] w-full ${columns}`}>
              {children()}
            </div>
          </div>
        </SpacingWrapper>
      ),
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
      render: ({ spacing, borderWidth, borderColor, borderRadius, padding, entranceAnimation, styles, children }) => (
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
            {children()}
          </div>
        </ComponentWrapper>
      )
    },
    CinematicHero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        mediaUrl: MediaField("Background Media", "image/*", "hero"),
        mediaType: { 
          type: "radio", 
          options: [
            { label: "Video", value: "video" }, 
            { label: "Image", value: "image" }
          ] 
        },
        ctaText: { type: "text" },
        ctaUrl: { type: "text" },
        content: { type: "slot" },
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        title: "Architectural Narratives",
        subtitle: "Immersive 8K visual storytelling for luxury real estate.",
        mediaUrl: "https://images.unsplash.com/photo-1600607687940-c52fb036999c",
        mediaType: "video",
        ctaText: "View Portfolio",
        ctaUrl: "/",
        spacing: { pt: "0", pb: "0", mt: "0", mb: "0" },
      },
      render: ({ title, subtitle, mediaUrl, mediaType, ctaText, ctaUrl, content, spacing, entranceAnimation }) => (
        <ComponentWrapper spacing={spacing} entranceAnimation={entranceAnimation}>
          <div className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
            {mediaType === 'video' ? (
              <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                <source src={mediaUrl} type="video/mp4" />
              </video>
            ) : (
              <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Hero" />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 text-center text-white px-4 w-full max-w-7xl mx-auto flex flex-col items-center">
              {content ? (
                <div className="w-full flex flex-col items-center font-display">
                  {content()}
                </div>
              ) : (
                <>
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6"
                  >
                    {title}
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl font-light"
                  >
                    {subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Link 
                      to={ctaUrl}
                      className="inline-block bg-brick-copper text-charcoal hover:bg-white transition-all duration-500 rounded-none px-8 py-4 text-[10px] uppercase tracking-[0.3em] font-black"
                    >
                      {ctaText}
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </ComponentWrapper>
      )
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
      render: ({ leftColumnWidth, gap, spacing, entranceAnimation, left, right }) => {
        return (
          <ComponentWrapper spacing={spacing} entranceAnimation={entranceAnimation}>
            <div className="flex flex-col md:grid" style={{ gap: `${gap}px`, gridTemplateColumns: `${leftColumnWidth}% calc(${100 - leftColumnWidth}% - ${gap}px)` }}>
              <div className="w-full min-h-[50px] transition-all border border-transparent hover:border-white/5">
                {left()}
              </div>
              <div className="w-full min-h-[50px] transition-all border border-transparent hover:border-white/5">
                {right()}
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
        align: {
          type: "radio",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
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
        styles: StylesField as any,
      },
      defaultProps: {
        text: "Elevated Architecture",
        level: 2,
        align: "left",
        tracking: "tracking-tight",
        lineHeight: "leading-tight",
        accent: false,
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ text, level, align, tracking, lineHeight, accent, width, spacing, entranceAnimation, styles }) => {
        const Tag = (`h${level}` as any) || "h2";
        const alignClass = { left: "text-left", center: "text-center", right: "text-right" }[align];
        const sizeClass = {
          1: "text-5xl md:text-7xl",
          2: "text-4xl md:text-5xl",
          3: "text-2xl md:text-3xl",
          4: "text-xl md:text-2xl",
        }[level];
        return (
          <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation} styles={styles}>
            <div className="px-8">
              <Tag className={`${alignClass} ${sizeClass} ${tracking} ${lineHeight} font-display italic ${accent ? "text-brick-copper" : "text-text-primary"}`}>
                {text}
              </Tag>
            </div>
          </ComponentWrapper>
        );
      },
    },
    RichText: {
      fields: {
        content: { type: "textarea" },
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
        styles: StylesField as any,
      },
      defaultProps: {
        content: "High-fidelity narratives for architectural excellence.",
        size: "base",
        tracking: "tracking-normal",
        maxWidth: "max-w-2xl",
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ content, size, tracking, maxWidth, width, spacing, entranceAnimation, styles }) => {
        const sizeClass = { sm: "text-xs", base: "text-sm", lg: "text-base" }[size];
        return (
          <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation} styles={styles}>
            <div className={`${sizeClass} ${tracking} ${maxWidth} leading-relaxed text-text-primary/60 px-8 md:px-12`}>
              {content}
            </div>
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
        content: { type: "slot" },
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
      render: ({ imageUrl, cta, content, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <div className="relative">
            <HeroVisual 
              imageUrl={imageUrl} 
              showCta={false} 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-7xl px-8 md:px-12 pointer-events-none">
                 <div className="pointer-events-auto flex flex-col items-center text-center">
                   {content && content()}
                   {cta?.label && (
                     <div className="mt-8">
                       <LinkButton link={cta} />
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>
        </ComponentWrapper>
      )
    },
    TextContent: {
      fields: {
        title1: { type: "text" },
        title2: { type: "text" },
        accent: { type: "text" },
        tagline: { type: "text" },
        content: { type: "slot" },
        width: WidthField as any,
        spacing: SpacingControl as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        title1: "EXPOSED",
        title2: "BRICK",
        accent: "MEDIA",
        tagline: "HIGH-FIDELITY ARCHITECTURAL NARRATIVES",
        width: "full",
        spacing: { pt: "0", pb: "0", mt: "0", mb: "20" },
      },
      render: ({ title1, title2, accent, tagline, content, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <div className="flex flex-col gap-8">
            <BrandHeader override={{ title1, title2, accent, tagline }} />
            {content && (
              <div className="px-8 md:px-12 lg:px-16">
                {content()}
              </div>
            )}
          </div>
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
        content: { type: "slot" },
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
      render: ({ mediaUrl, mediaType, autoPlay, daysOnMarket, salePrice, listPrice, packageUsed, content, width, spacing, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/10 group bg-charcoal">
            <div className="relative aspect-square md:aspect-auto md:h-full overflow-hidden bg-white/5">
              {mediaType === 'video' ? (
                mediaUrl ? <video src={mediaUrl} autoPlay={autoPlay} loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" /> : null
              ) : (
                mediaUrl ? <img src={mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Highlight" /> : null
              )}
            </div>
            <div className="p-8 md:p-16 flex flex-col justify-center">
              {content ? (
                <div className="w-full min-h-[100px]">
                  {content()}
                </div>
              ) : (
                <>
                  <h3 className="font-display italic text-3xl mb-12 text-white">Project Economics</h3>
                  <div className="space-y-8">
                    <div className="border-b border-white/10 pb-4">
                      <span className="block text-[9px] uppercase tracking-[0.3em] text-brick-copper mb-2">Days on Market</span>
                      <span className="font-mono text-2xl text-white">{daysOnMarket}</span>
                    </div>
                    <div className="border-b border-white/10 pb-4">
                      <span className="block text-[9px] uppercase tracking-[0.3em] text-brick-copper mb-2">Sale vs List Price</span>
                      <div className="flex gap-4 items-baseline">
                        <span className="font-mono text-2xl text-white">{salePrice}</span>
                        <span className="font-mono text-xs text-white/40 line-through">{listPrice}</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <span className="block text-[9px] uppercase tracking-[0.3em] text-brick-copper mb-2">Media Package Utilized</span>
                      <span className="text-sm font-semibold uppercase tracking-widest text-white">{packageUsed}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </ComponentWrapper>
      ),
    },
    Container: {
      fields: {
        children: { type: "slot" },
        spacing: SpacingControl as any,
        background: {
          type: "select",
          options: [
            { label: "Transparent", value: "bg-transparent" },
            { label: "Glass", value: "glass" },
            { label: "Charcoal", value: "bg-charcoal" },
            { label: "White Subdued", value: "bg-white/5" },
          ]
        },
        border: { type: "radio", options: [{ label: "On", value: true }, { label: "Off", value: false }] },
        padding: { type: "number", min: 0, max: 100 },
        width: WidthField as any,
        styles: StylesField as any,
        entranceAnimation: EntranceAnimationField as any,
      },
      defaultProps: {
        spacing: { pt: "16", pb: "16", mt: "0", mb: "0" },
        background: "bg-transparent",
        border: true,
        padding: 32,
        width: "full",
      },
      render: ({ children, spacing, background, border, padding, width, styles, entranceAnimation }) => (
        <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation} styles={styles}>
          <div 
            className={`${background} ${border ? 'border border-white/10' : ''}`}
            style={{ padding: `${padding}px` }}
          >
            {children()}
          </div>
        </ComponentWrapper>
      )
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
        content: { type: "slot" },
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
        objectFit: "cover",
        autoPlay: true,
        loop: true,
        muted: true,
        showControls: false,
        width: "full",
        spacing: { pt: "32", pb: "32", mt: "0", mb: "0" },
      },
      render: ({ url, mediaType, widthPercentage, aspectRatio, objectFit, autoPlay, loop, muted, showControls, content, width, spacing, entranceAnimation, styles }) => {
        return (
          <ComponentWrapper width={width} spacing={spacing} entranceAnimation={entranceAnimation} styles={styles}>
            <div className="w-full flex justify-center">
              <div style={{ width: `${widthPercentage}%`, aspectRatio: aspectRatio }} className="overflow-hidden bg-white/5 relative group border border-white/10">
                {mediaType === 'video' ? (
                  url ? <video src={url} autoPlay={autoPlay} loop={loop} muted={muted} controls={showControls} playsInline className={`w-full h-full object-${objectFit}`} /> : null
                ) : (
                  url ? <img src={url} className={`w-full h-full object-${objectFit}`} alt="" /> : null
                )}
                {content && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto w-full">
                      {content()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ComponentWrapper>
        )
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
    }
  }
};
};

export const BASELINE_LAYOUT = {
  content: [],
  zones: {
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
        type: "Hero",
        props: { id: "hero-1" }
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
  },
  root: { props: { title: "Home" } }
};
