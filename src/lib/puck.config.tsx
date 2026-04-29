/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MoveUpRight } from "lucide-react";
import { Config, DropZone } from "@measured/puck";
import { HeroVisual, BrandHeader } from "../components/Hero";
import { Portfolio, Services } from "../components/PortfolioSections";
import { BookingForm, FooterContent } from "../components/BookingAndFooter";
import { TestimonialCarousel } from "../components/TestimonialCarousel";
import { PropertyHighlight, TourEmbed } from "../components/PropertyFeatures";
import { LogoCloud, InstagramFeed } from "../components/SocialNodes";
import { LinkButton } from "../components/LinkButton";

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
  Section: {
    paddingTop: number;
    paddingBottom: number;
    background: "primary" | "secondary" | "accent";
    children?: React.ReactNode;
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

export const createConfig = (pages: any[] = []): Config<PuckConfig> => {
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

  const ComponentWrapper = ({ width, children }: { width?: "full" | "half", children: React.ReactNode }) => {
    return (
      <div className={`${width === 'half' ? 'w-full lg:w-1/2' : 'w-full'}`}>
        {children}
      </div>
    );
  };
  
  return {
    root: {
      render: ({ children }) => {
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
        children: { type: "slot" },
        paddingTop: {
          type: "number",
          min: 0,
          max: 400
        },
        paddingBottom: {
          type: "number",
          min: 0,
          max: 400
        },
        background: {
          type: "select",
          options: [
            { label: "White (Primary)", value: "primary" },
            { label: "Off-White (Secondary)", value: "secondary" },
            { label: "Charcoal (Accent)", value: "accent" },
          ],
        },
      },
      defaultProps: {
        paddingTop: 80,
        paddingBottom: 80,
        background: "primary",
      },
      render: ({ paddingTop, paddingBottom, background }) => {
        const bgClass = {
          primary: "bg-bg-primary",
          secondary: "bg-bg-secondary",
          accent: "bg-charcoal text-white",
        }[background];
        return (
          <section className={`${bgClass} px-8 md:px-16`} style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }}>
            <div className="max-w-7xl mx-auto"><DropZone zone="children" /></div>
          </section>
        );
      },
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
          <div className="flex flex-col md:grid" style={{ gap: `${gap}px`, gridTemplateColumns: `${leftColumnWidth}% ${100 - leftColumnWidth}%` }}>
            <div className="w-full"><DropZone zone="left" /></div>
            <div className="w-full"><DropZone zone="right" /></div>
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
        imageUrl: { type: "text" },
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
        mediaUrl: { type: "text" },
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
        url: { type: "text" },
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
