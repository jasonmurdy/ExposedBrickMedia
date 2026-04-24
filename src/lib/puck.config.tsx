/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config } from "@measured/puck";
import { HeroVisual, BrandHeader } from "../components/Hero";
import { Portfolio, Services } from "../components/PortfolioSections";
import { BookingForm, FooterContent } from "../components/BookingAndFooter";

export type PuckConfig = {
  Section: {
    paddingTop: number;
    paddingBottom: number;
    background: "primary" | "secondary" | "accent";
    children?: React.ReactNode;
  };
  Columns: {
    distribution: "1/1" | "2/1" | "1/2";
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
      render: ({ paddingTop, paddingBottom, background, children }) => {
        const bgClass = {
          primary: "bg-bg-primary",
          secondary: "bg-bg-secondary",
          accent: "bg-charcoal text-white",
        }[background];
        return (
          <section className={`${bgClass} px-8 md:px-16`} style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }}>
            <div className="max-w-7xl mx-auto">{children}</div>
          </section>
        );
      },
    },
    Columns: {
      fields: {
        left: { type: "slot" },
        right: { type: "slot" },
        distribution: {
          type: "select",
          options: [
            { label: "50/50", value: "1/1" },
            { label: "66/33", value: "2/1" },
            { label: "33/66", value: "1/2" },
          ],
        },
        gap: { type: "number" },
      },
      defaultProps: {
        distribution: "1/1",
        gap: 32,
      },
      render: ({ distribution, gap, left, right }) => {
        const gridClass = {
          "1/1": "grid-cols-1 md:grid-cols-2",
          "2/1": "grid-cols-1 md:grid-cols-[2fr_1fr]",
          "1/2": "grid-cols-1 md:grid-cols-[1fr_2fr]",
        }[distribution];
        return (
          <div className={`grid ${gridClass}`} style={{ gap: `${gap}px` }}>
            <div>{left}</div>
            <div>{right}</div>
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
              distribution: "1/1",
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
