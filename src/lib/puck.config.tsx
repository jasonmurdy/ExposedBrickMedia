/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config, DropZone } from "@measured/puck";
import { HeroVisual, BrandHeader } from "../components/Hero";
import { Portfolio, Services } from "../components/PortfolioSections";
import { BookingForm, FooterContent } from "../components/BookingAndFooter";
import { TestimonialCarousel } from "../components/TestimonialCarousel";
import { PropertyHighlight, TourEmbed } from "../components/PropertyFeatures";
import { LogoCloud, InstagramFeed } from "../components/SocialNodes";

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
  };
  RichText: {
    content: string;
    size: "sm" | "base" | "lg";
  };
  Hero: {
    imageUrl?: string;
    height: "short" | "medium" | "tall";
  };
  TextContent: {
    title1: string;
    title2: string;
    accent: string;
    tagline: string;
  };
  Portfolio: {
    variant: "grid" | "gallery";
    limit?: number;
    showFilter: boolean;
  };
  Services: {
    title: string;
    subtitle: string;
  };
  Contact: {
    title: string;
    description?: string;
  };
  Footer: {
    quote: string;
  };
  Spacer: {
    size: number;
  };
  Testimonials: {
    maxItems: number;
  };
  MediaEmbed: {
    url: string;
    mediaType: "image" | "video";
    widthPercentage: number;
    aspectRatio: "16/9" | "4/3" | "1/1" | "9/16";
  };
  PropertyHighlight: {
    mediaUrl: string;
    mediaType: "image" | "video";
    daysOnMarket: number;
    salePrice: string;
    listPrice: string;
    packageUsed: string;
  };
  TourEmbed: {
    url: string;
    height: number;
  };
  LogoCloud: {
    logos: { url: string; alt: string }[];
  };
  InstagramFeed: {
    username: string;
  };
  HTMLEmbed: {
    html: string;
    height?: number;
    title?: string;
    wrapInIframe?: boolean;
  };
};

export const config: Config<PuckConfig> = {
  components: {
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
      },
      defaultProps: {
        text: "Elevated Architecture",
        level: 2,
        align: "left",
        accent: false,
      },
      render: ({ text, level, align, accent }) => {
        const Tag = (`h${level}` as any) || "h2";
        const alignClass = { left: "text-left", center: "text-center", right: "text-right" }[align];
        const sizeClass = {
          1: "text-5xl md:text-7xl",
          2: "text-4xl md:text-5xl",
          3: "text-2xl md:text-3xl",
          4: "text-xl md:text-2xl",
        }[level];
        return (
          <Tag className={`${alignClass} ${sizeClass} font-display italic tracking-tight ${accent ? "text-brick-copper" : "text-text-primary"}`}>
            {text}
          </Tag>
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
      },
      defaultProps: {
        content: "High-fidelity narratives for architectural excellence.",
        size: "base",
      },
      render: ({ content, size }) => {
        const sizeClass = { sm: "text-xs", base: "text-sm", lg: "text-base" }[size];
        return (
          <div className={`${sizeClass} leading-relaxed text-text-primary/60 max-w-2xl`}>
            {content}
          </div>
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
      },
      render: ({ imageUrl }) => <HeroVisual imageUrl={imageUrl} />,
    },
    TextContent: {
      fields: {
        title1: { type: "text" },
        title2: { type: "text" },
        accent: { type: "text" },
        tagline: { type: "text" },
      },
      render: ({ title1, title2, accent, tagline }) => (
        <BrandHeader override={{ title1, title2, accent, tagline }} />
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
        limit: { type: "number" },
        showFilter: { 
          type: "radio",
          options: [
            { label: "Show", value: true },
            { label: "Hide", value: false }
          ]
        },
      },
      defaultProps: {
        variant: "grid",
        showFilter: true,
      },
      render: ({ variant }) => <Portfolio variant={variant} />,
    },
    Services: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
      },
      render: ({ title, subtitle }) => <Services override={{ title, subtitle }} />,
    },
    Contact: {
      fields: {
        title: { type: "text" },
        description: { type: "text" },
      },
      render: ({ title }) => <BookingForm override={{ title }} />,
    },
    Footer: {
      fields: {
        quote: { type: "text" },
      },
      render: ({ quote }) => <FooterContent override={{ quote }} />,
    },
    Spacer: {
      fields: {
        size: { 
          type: "number",
          min: 0,
          max: 200
        },
      },
      defaultProps: {
        size: 40,
      },
      render: ({ size }) => <div style={{ height: `${size}px` }} />,
    },
    Testimonials: {
      fields: {
        maxItems: { type: "number" },
      },
      defaultProps: { maxItems: 5 },
      render: ({ maxItems }) => <TestimonialCarousel maxItems={maxItems} />,
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
      },
      defaultProps: {
        mediaUrl: "https://images.unsplash.com/photo-1600607687940-c52fb036999c",
        mediaType: "image",
        daysOnMarket: 14,
        salePrice: "$1,250,000",
        listPrice: "$1,150,000",
        packageUsed: "Cinematic Plus",
      },
      render: ({ mediaUrl, mediaType, daysOnMarket, salePrice, listPrice, packageUsed }) => (
        <PropertyHighlight 
          mediaUrl={mediaUrl} 
          mediaType={mediaType} 
          daysOnMarket={daysOnMarket} 
          salePrice={salePrice} 
          listPrice={listPrice} 
          packageUsed={packageUsed} 
        />
      ),
    },
    TourEmbed: {
      fields: {
        url: { type: "text" },
        height: { type: "number" },
      },
      defaultProps: { url: "", height: 600 },
      render: ({ url, height }) => <TourEmbed url={url} height={height} />,
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
      },
      defaultProps: {
        logos: [
          { url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Compass_logo.svg", alt: "Compass" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Sotheby%27s_International_Realty_logo.svg", alt: "Sotheby's" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Coldwell_Banker_logo.svg", alt: "Coldwell Banker" },
        ]
      },
      render: ({ logos }) => <LogoCloud logos={logos} />,
    },
    InstagramFeed: {
      fields: {
        username: { type: "text" },
      },
      defaultProps: { username: "exposedbrickmedia" },
      render: ({ username }) => <InstagramFeed username={username} />,
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
        }
      },
      defaultProps: {
        url: "https://images.unsplash.com/photo-1600607687940-c52fb036999c",
        mediaType: "image",
        widthPercentage: 100,
        aspectRatio: "16/9"
      },
      render: ({ url, mediaType, widthPercentage, aspectRatio }) => {
        return (
          <div className="w-full flex justify-center my-8">
            <div style={{ width: `${widthPercentage}%`, aspectRatio: aspectRatio }} className="overflow-hidden bg-white/5 relative group border border-white/10">
              {mediaType === 'video' ? (
                <video src={url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={url} className="w-full h-full object-cover" alt="" />
              )}
            </div>
          </div>
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
      },
      defaultProps: {
        html: "<div style=\"padding: 20px; background: #eee; text-align: center;\">Custom HTML content</div>",
        wrapInIframe: false,
        title: "HTML Embed"
      },
      render: ({ html, height, title, wrapInIframe }) => {
        if (wrapInIframe) {
          return (
            <iframe
              srcDoc={html}
              title={title}
              style={{ width: '100%', height: height ? `${height}px` : 'auto', border: 'none' }}
              sandbox="allow-scripts allow-top-navigation allow-same-origin"
            />
          );
        }
        return (
          <div 
            className="w-full overflow-hidden" 
            style={height ? { height: `${height}px`, overflowY: 'auto' } : {}}
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        );
      }
    },
  },
};

export const BASELINE_LAYOUT = {
  content: [
    {
      type: "Hero",
      props: { id: "hero-1" }
    },
    {
      type: "Section",
      props: {
        id: "section-1",
        background: "primary",
        paddingTop: 80,
        paddingBottom: 80,
        children: [
          {
            type: "TextContent",
            props: { id: "brand-header-1" }
          }
        ]
      }
    },
    {
      type: "Section",
      props: {
        id: "section-2",
        background: "secondary",
        paddingTop: 80,
        paddingBottom: 80,
        children: [
          {
            type: "Portfolio",
            props: { id: "portfolio-1", showFilter: true, variant: "grid" }
          }
        ]
      }
    },
    {
      type: "Section",
      props: {
        id: "section-3",
        background: "primary",
        paddingTop: 80,
        paddingBottom: 80,
        children: [
          {
            type: "Services",
            props: { id: "services-1" }
          }
        ]
      }
    },
    {
      type: "Section",
      props: {
        id: "section-4",
        background: "accent",
        paddingTop: 120,
        paddingBottom: 120,
        children: [
          {
            type: "Columns",
            props: {
              id: "columns-1",
              leftColumnWidth: 50,
              left: [
                {
                  type: "Contact",
                  props: { id: "contact-1" }
                }
              ],
              right: [
                {
                  type: "Footer",
                  props: { id: "footer-1" }
                }
              ]
            }
          }
        ]
      }
    }
  ],
  root: { props: { title: "Home" } }
};
