/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { MoveUpRight } from "lucide-react";
import { Config, DropZone } from "@measured/puck";
import { HeroVisual, BrandHeader } from "../components/Hero";
import { Portfolio, Services } from "../components/PortfolioSections";
import { BookingForm, FooterContent } from "../components/BookingAndFooter";
import { TestimonialCarousel } from "../components/TestimonialCarousel";
import { PropertyHighlight, TourEmbed } from "../components/PropertyFeatures";
import { LogoCloud, InstagramFeed } from "../components/SocialNodes";
import { LinkButton } from "../components/LinkButton";
import { Button as ShadcnButton } from "../components/ui/button";

import { FileUpload } from "../components/FileUpload";

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
const SpacingWrapper = ({ spacing, children, className = "" }: { spacing: any, children: React.ReactNode, className?: string }) => (
  <div 
    style={{
      paddingTop: spacing?.pt ? `${spacing.pt}px` : undefined,
      paddingBottom: spacing?.pb ? `${spacing.pb}px` : undefined,
      marginTop: spacing?.mt ? `${spacing.mt}px` : undefined,
      marginBottom: spacing?.mb ? `${spacing.mb}px` : undefined,
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
  };
  components: {
    Section: {
      spacing: any;
      background: "bg-transparent" | "bg-bg-primary" | "bg-bg-secondary" | "bg-charcoal text-white";
      bgImage?: string;
      overlayOpacity: number;
      layout: "boxed" | "full";
      children?: React.ReactNode;
    };
    DynamicGrid: {
      collection: "portfolio" | "pages";
      limit: number;
      columns: 2 | 3 | 4;
    };
    CinematicHero: {
      title: string;
      subtitle: string;
      mediaUrl: string;
      mediaType: "video" | "image";
      ctaText: string;
      ctaUrl: string;
    };
    Columns: {
      leftColumnWidth: number;
      gap: number;
      left?: React.ReactNode;
      right?: React.ReactNode;
    };
    Heading: {
      text: string;
      level: 1 | 2 | 3 | 4;
      align: "left" | "center" | "right";
      accent: boolean;
      width: "full" | "half";
    };
    RichText: {
      content: string;
      size: "sm" | "base" | "lg";
      width: "full" | "half";
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
    };
    TextContent: {
      title1: string;
      title2: string;
      accent: string;
      tagline: string;
      width: "full" | "half";
    };
    Portfolio: {
      variant: "grid" | "gallery";
      panel?: "main" | "side";
      limit?: number;
      showFilter: boolean;
      width: "full" | "half";
    };
    Services: {
      title: string;
      subtitle: string;
      width: "full" | "half";
    };
    Contact: {
      title: string;
      description?: string;
      width: "full" | "half";
    };
    Footer: {
      quote: string;
      width: "full" | "half";
    };
    Spacer: {
      size: number;
      width: "full" | "half";
    };
    Testimonials: {
      maxItems: number;
      width: "full" | "half";
    };
    MediaEmbed: {
      url: string;
      mediaType: "image" | "video";
      widthPercentage: number;
      aspectRatio: "16/9" | "4/3" | "1/1" | "9/16";
      width: "full" | "half";
    };
    PropertyHighlight: {
      mediaUrl: string;
      mediaType: "image" | "video";
      daysOnMarket: number;
      salePrice: string;
      listPrice: string;
      packageUsed: string;
      width: "full" | "half";
    };
    TourEmbed: {
      url: string;
      height: number;
      width: "full" | "half";
    };
    LogoCloud: {
      logos: { url: string; alt: string }[];
      width: "full" | "half";
    };
    InstagramFeed: {
      username: string;
      width: "full" | "half";
    };
    HTMLEmbed: {
      html: string;
      height?: number;
      title?: string;
      wrapInIframe?: boolean;
      width: "full" | "half";
    };
    Button: {
      link: {
        type: "internal" | "external";
        url: string;
        label: string;
      };
      align: "left" | "center" | "right";
      width: "full" | "half";
    };
  };
};

export const createConfig = (pages: any[] = [], portfolioItems: any[] = []): Config<PuckConfig> => {
  const pageOptions = pages.map(p => ({ label: p.title || p.slug, value: p.slug }));
  
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

  const ComponentWrapper = ({ width, children }: { width?: "full" | "half", children: React.ReactNode }) => {
    return (
      <div className={`${width === 'half' ? 'w-full lg:w-1/2' : 'w-full'}`}>
        {children}
      </div>
    );
  };
  
  return {
    root: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        ogImage: MediaField("OG Image"),
      },
      render: ({ children, title, description, ogImage }) => {
        // Sync with document head
        useEffect(() => {
          if (title) document.title = `${title} | Exposed Brick Media`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc && description) metaDesc.setAttribute('content', description);
        }, [title, description]);

        return (
          <div className="flex flex-col lg:flex-row min-h-screen bg-bg-primary overflow-hidden">
            {/* LEFT COLUMN: BRAND & SERVICES */}
            <aside className="hidden lg:flex w-1/3 border-r border-border-subtle flex-col p-8 md:p-12 lg:p-16 pt-32 lg:pt-12 overflow-y-auto no-scrollbar">
              <div className="flex flex-col flex-wrap lg:flex-nowrap gap-y-4">
                <DropZone zone="side" />
              </div>
            </aside>

            {/* RIGHT AREA: HERO, PORTFOLIO & BOOKING */}
            <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-20 lg:pt-0">
              <div className="flex flex-wrap content-start">
                <DropZone zone="main" />
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
          align: {
            type: "radio",
            options: [
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ]
          },
          width: WidthField as any,
        },
        defaultProps: {
          link: {
            type: "internal",
            label: "Learn More",
            url: "about"
          },
          align: "left",
          width: "full",
        },
        render: ({ link, align, width }) => {
          const justify = align === 'center' ? 'center' : align === 'right' ? 'end' : 'start';
          return (
            <ComponentWrapper width={width}>
              <div className={`flex justify-${justify} my-4`}>
                <LinkButton link={link} />
              </div>
            </ComponentWrapper>
          );
        }
      },
    Section: {
      fields: {
        spacing: SpacingControl as any,
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
        layout: {
          type: "radio",
          options: [
            { label: "Boxed", value: "boxed" },
            { label: "Full Width", value: "full" },
          ],
        },
        children: { type: "slot" },
      },
      defaultProps: {
        spacing: { pt: "80", pb: "80", mt: "0", mb: "0" },
        background: "bg-bg-primary",
        overlayOpacity: 50,
        layout: "boxed",
      },
      render: ({ spacing, background, bgImage, overlayOpacity, layout }) => (
        <SpacingWrapper spacing={spacing} className={`relative ${background} overflow-hidden group/section`}>
          {bgImage && (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
              <div 
                className="absolute inset-0 bg-black" 
                style={{ opacity: overlayOpacity / 100 }} 
              />
            </>
          )}
          <div className={`relative z-10 transition-all ${layout === 'boxed' ? 'max-w-7xl mx-auto px-8 md:px-16' : 'w-full px-8 md:px-16'}`}>
            <div className="min-h-[100px] w-full">
              <DropZone zone="children" />
            </div>
          </div>
        </SpacingWrapper>
      ),
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
        ctaUrl: { type: "text" }
      },
      defaultProps: {
        title: "Architectural Narratives",
        subtitle: "Immersive 8K visual storytelling for luxury real estate.",
        mediaUrl: "https://images.unsplash.com/photo-1600607687940-c52fb036999c",
        mediaType: "video",
        ctaText: "View Portfolio",
        ctaUrl: "/"
      },
      render: ({ title, subtitle, mediaUrl, mediaType, ctaText, ctaUrl }) => (
        <div className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
          {mediaType === 'video' ? (
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src={mediaUrl} type="video/mp4" />
            </video>
          ) : (
            <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Hero" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center text-white px-4 max-w-4xl flex flex-col items-center">
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
          </div>
        </div>
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
        }
      },
      defaultProps: {
        collection: "portfolio",
        limit: 6,
        columns: 3
      },
      render: ({ collection: coll, limit, columns }) => {
        const items = coll === 'portfolio' ? portfolioItems : pages;
        const displayItems = items.slice(0, limit);
        const gridCols = {
          2: "grid-cols-1 md:grid-cols-2",
          3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }[columns];

        return (
          <div className={`grid ${gridCols} gap-8 p-8`}>
            {displayItems.map((item: any) => (
              <motion.div 
                key={item.id}
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
        )
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
      },
      defaultProps: {
        leftColumnWidth: 50,
        gap: 32,
      },
      render: ({ leftColumnWidth, gap }) => {
        return (
          <div className="flex flex-col md:grid" style={{ gap: `${gap}px`, gridTemplateColumns: `${leftColumnWidth}% calc(${100 - leftColumnWidth}% - ${gap}px)` }}>
            <div className="w-full min-h-[50px] transition-all border border-transparent hover:border-white/5">
              <DropZone zone="left" />
            </div>
            <div className="w-full min-h-[50px] transition-all border border-transparent hover:border-white/5">
              <DropZone zone="right" />
            </div>
          </div>
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
        accent: { 
          type: "radio",
          options: [
            { label: "Standard", value: false },
            { label: "Accent Color", value: true }
          ]
        },
        width: WidthField as any,
      },
      defaultProps: {
        text: "Elevated Architecture",
        level: 2,
        align: "left",
        accent: false,
        width: "full",
      },
      render: ({ text, level, align, accent, width }) => {
        const Tag = (`h${level}` as any) || "h2";
        const alignClass = { left: "text-left", center: "text-center", right: "text-right" }[align];
        const sizeClass = {
          1: "text-5xl md:text-7xl",
          2: "text-4xl md:text-5xl",
          3: "text-2xl md:text-3xl",
          4: "text-xl md:text-2xl",
        }[level];
        return (
          <ComponentWrapper width={width}>
            <div className="p-8">
              <Tag className={`${alignClass} ${sizeClass} font-display italic tracking-tight ${accent ? "text-brick-copper" : "text-text-primary"}`}>
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
        width: WidthField as any,
      },
      defaultProps: {
        content: "High-fidelity narratives for architectural excellence.",
        size: "base",
        width: "full",
      },
      render: ({ content, size, width }) => {
        const sizeClass = { sm: "text-xs", base: "text-sm", lg: "text-base" }[size];
        return (
          <ComponentWrapper width={width}>
            <div className={`${sizeClass} leading-relaxed text-text-primary/60 max-w-2xl p-8`}>
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
        cta: LinkField as any,
        width: WidthField as any,
      },
      defaultProps: {
        height: "short",
        width: "full",
        cta: {
          type: "internal",
          label: "View Portfolio",
          url: "portfolio"
        }
      },
      render: ({ imageUrl, cta, width }) => (
        <ComponentWrapper width={width}>
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
        title1: { type: "text" },
        title2: { type: "text" },
        accent: { type: "text" },
        tagline: { type: "text" },
        width: WidthField as any,
      },
      defaultProps: {
        title1: "EXPOSED",
        title2: "BRICK",
        accent: "MEDIA",
        tagline: "HIGH-FIDELITY ARCHITECTURAL NARRATIVES",
        width: "full",
      },
      render: ({ title1, title2, accent, tagline, width }) => (
        <ComponentWrapper width={width}>
          <BrandHeader override={{ title1, title2, accent, tagline }} />
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
      },
      defaultProps: {
        variant: "grid",
        panel: "main",
        showFilter: true,
        width: "full",
      },
      render: ({ variant, panel, width }) => (
        <ComponentWrapper width={width}>
          <Portfolio variant={variant} panel={panel as any} />
        </ComponentWrapper>
      ),
    },
    Services: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        width: WidthField as any,
      },
      defaultProps: {
        title: "SERVICES",
        subtitle: "Refined Solutions",
        width: "full",
      },
      render: ({ title, subtitle, width }) => (
        <ComponentWrapper width={width}>
          <Services override={{ title, subtitle }} />
        </ComponentWrapper>
      ),
    },
    Contact: {
      fields: {
        title: { type: "text" },
        description: { type: "text" },
        width: WidthField as any,
      },
      defaultProps: {
        title: "GET IN TOUCH",
        description: "Let's discuss your next project",
        width: "full",
      },
      render: ({ title, width }) => (
        <ComponentWrapper width={width}>
          <BookingForm override={{ title }} />
        </ComponentWrapper>
      ),
    },
    Footer: {
      fields: {
        quote: { type: "text" },
        width: WidthField as any,
      },
      defaultProps: {
        quote: "Elegance is the only beauty that never fades.",
        width: "full",
      },
      render: ({ quote, width }) => (
        <ComponentWrapper width={width}>
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
      },
      defaultProps: {
        size: 40,
        width: "full",
      },
      render: ({ size, width }) => (
        <ComponentWrapper width={width}>
          <div style={{ height: `${size}px` }} />
        </ComponentWrapper>
      ),
    },
    Testimonials: {
      fields: {
        maxItems: { type: "number" },
        width: WidthField as any,
      },
      defaultProps: { maxItems: 5, width: "full" },
      render: ({ maxItems, width }) => (
        <ComponentWrapper width={width}>
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
        daysOnMarket: { type: "number" },
        salePrice: { type: "text" },
        listPrice: { type: "text" },
        packageUsed: { type: "text" },
        width: WidthField as any,
      },
      defaultProps: {
        mediaUrl: "https://images.unsplash.com/photo-1600607687940-c52fb036999c",
        mediaType: "image",
        daysOnMarket: 14,
        salePrice: "$1,250,000",
        listPrice: "$1,150,000",
        packageUsed: "Cinematic Plus",
        width: "full",
      },
      render: ({ mediaUrl, mediaType, daysOnMarket, salePrice, listPrice, packageUsed, width }) => (
        <ComponentWrapper width={width}>
          <PropertyHighlight 
            mediaUrl={mediaUrl} 
            mediaType={mediaType} 
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
      },
      defaultProps: { url: "", height: 600, width: "full" },
      render: ({ url, height, width }) => (
        <ComponentWrapper width={width}>
          <TourEmbed url={url} height={height} />
        </ComponentWrapper>
      ),
    },
    LogoCloud: {
      fields: {
        logos: {
          type: "array",
          arrayFields: {
            url: { type: "text" },
            alt: { type: "text" },
          },
        },
        width: WidthField as any,
      },
      defaultProps: {
        width: "full",
        logos: [
          { url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Compass_logo.svg", alt: "Compass" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Sotheby%27s_International_Realty_logo.svg", alt: "Sotheby's" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Coldwell_Banker_logo.svg", alt: "Coldwell Banker" },
        ]
      },
      render: ({ logos, width }) => (
        <ComponentWrapper width={width}>
          <LogoCloud logos={logos} />
        </ComponentWrapper>
      ),
    },
    InstagramFeed: {
      fields: {
        username: { type: "text" },
        width: WidthField as any,
      },
      defaultProps: { username: "exposedbrickmedia", width: "full" },
      render: ({ username, width }) => (
        <ComponentWrapper width={width}>
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
          ]
        },
        width: WidthField as any,
      },
      defaultProps: {
        url: "https://images.unsplash.com/photo-1600607687940-c52fb036999c",
        mediaType: "image",
        widthPercentage: 100,
        aspectRatio: "16/9",
        width: "full",
      },
      render: ({ url, mediaType, widthPercentage, aspectRatio, width }) => {
        return (
          <ComponentWrapper width={width}>
            <div className="w-full flex justify-center my-8">
              <div style={{ width: `${widthPercentage}%`, aspectRatio: aspectRatio }} className="overflow-hidden bg-white/5 relative group border border-white/10">
                {mediaType === 'video' ? (
                  url ? <video src={url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : null
                ) : (
                  url ? <img src={url} className="w-full h-full object-cover" alt="" /> : null
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
      },
      defaultProps: {
        html: "<div style=\"padding: 20px; background: #eee; text-align: center;\">Custom HTML content</div>",
        wrapInIframe: false,
        title: "HTML Embed",
        width: "full"
      },
      render: ({ html, height, title, wrapInIframe, width }) => {
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
          <ComponentWrapper width={width}>
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
