import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Camera, Sun, Layers, Aperture, Sparkles, MoveUpRight, ArrowRight, Compass } from 'lucide-react';
import { useSiteContent } from '../../lib/SiteContentContext';
import { useMemo } from 'react';
import { Render } from '@measured/puck';
import { createConfig } from '../../lib/puck.config';
import { sanitizeLayout } from '../../lib/sanitizeLayout';
import { BookingForm } from '../../components/BookingAndFooter';

export default function InteriorPhotographyPage() {
  const { pages, portfolioItems, partners, teams, brandResources } = useSiteContent();
  const page = pages.find(p => p.slug === 'interior');

  const config = useMemo(() => createConfig(pages, portfolioItems, partners, teams, brandResources), [pages, portfolioItems, partners, teams, brandResources]);

  const sanitizedLayout = useMemo(() => {
    return sanitizeLayout(page?.layout, page?.title || 'Interior Photography');
  }, [page?.layout, page?.title]);

  if (sanitizedLayout && (sanitizedLayout.content?.length > 0 || sanitizedLayout.zones)) {
    return (
      <div className="w-full flex-col min-h-screen bg-[#0a0a0a] text-text-primary">
        <Helmet>
          <title>Interior Photography | Exposed Brick Media</title>
          <meta name="description" content="Editorial-grade interior photography for luxury real estate." />
        </Helmet>
        <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-white/5 flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
          <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
          <span>/</span>
          <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
          <span>/</span>
          <span className="text-text-primary">Interior Photography</span>
        </div>
        <Render config={config} data={sanitizedLayout} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full bg-[#0a0a0a] text-text-primary min-h-screen flex flex-col"
    >
      <Helmet>
        <title>Interior Photography | Exposed Brick Media</title>
        <meta name="description" content="Editorial-grade interior photography for luxury real estate." />
      </Helmet>
      
      {/* Breadcrumbs */}
      <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-white/5 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-white/40">
        <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
        <span>/</span>
        <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
        <span>/</span>
        <span className="text-white">Interior Photography</span>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] lg:min-h-[85vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(197,125,93,0.08),transparent_50%)]" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-8 md:px-16 lg:px-24 py-20 w-full">
            <div className="max-w-3xl space-y-8 text-left">
              <span className="text-brick-copper text-[10px] uppercase tracking-[0.5em] font-bold block">PREMIUM SERVICE</span>
              
              <h1 className="font-display text-5xl md:text-8xl tracking-tight leading-[0.95] text-white">
                THE ART OF THE <br/>
                <span className="font-serif italic font-light text-brick-copper/90">INTERIOR</span>
              </h1>
              
              <p className="text-sm md:text-base text-text-primary/60 font-light leading-relaxed max-w-2xl pt-2">
                Capturing the soul of architectural spaces through light, shadow, and cinematic precision. We don't just photograph rooms; we tell the story of a lifestyle.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-8">
                <a 
                  href="#portfolio" 
                  className="px-8 py-4 bg-brick-copper text-charcoal font-mono text-[11px] tracking-[0.3em] font-bold hover:bg-brick-copper/90 transition-all uppercase"
                >
                  VIEW PORTFOLIO
                </a>
                <a 
                  href="#process" 
                  className="px-8 py-4 bg-transparent border border-white/20 text-white font-mono text-[11px] tracking-[0.3em] hover:border-brick-copper hover:text-brick-copper transition-all uppercase"
                >
                  OUR PROCESS
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology / Highlights Section */}
        <section id="process" className="py-24 lg:py-32 px-8 md:px-16 lg:px-24 border-t border-white/5 bg-[#0d0d0d] relative">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <span className="text-brick-copper text-[10px] uppercase tracking-[0.4em] font-bold block">METHODOLOGY</span>
              <h2 className="text-3xl md:text-5xl font-display text-white italic tracking-tight leading-none mt-2">
                CRAFTED FOR PERMANENCE
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Card 1: Advanced Flambient Techniques */}
              <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-8 md:p-12 flex flex-col justify-between min-h-[320px] hover:border-brick-copper/20 transition-all duration-500 group">
                <div>
                  <Sun className="text-brick-copper w-10 h-10 mb-8 stroke-[1.2]" />
                  <h3 className="text-2xl md:text-3xl font-display text-white italic tracking-tight mb-4">
                    Advanced Flambient Techniques
                  </h3>
                  <p className="text-sm text-text-primary/60 leading-relaxed font-light max-w-xl">
                    By blending natural ambient light with strategic flash placement, we achieve a dynamic range that mimics the human eye, preserving true color accuracy and vibrant detail.
                  </p>
                </div>
                <div className="pt-8">
                  <a href="#inquire" className="group/link flex items-center gap-3 text-[10px] uppercase font-mono font-bold tracking-[0.25em] text-brick-copper hover:text-white transition-colors">
                    LEARN MORE <ArrowRight size={14} className="transform group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Card 2: Vertical Alignment */}
              <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10 flex flex-col justify-between min-h-[320px] hover:border-brick-copper/20 transition-all duration-500 group">
                <div>
                  <Compass className="text-brick-copper w-10 h-10 mb-8 stroke-[1.2]" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brick-copper/80 block mb-3 font-bold">
                    VERTICAL ALIGNMENT
                  </span>
                  <p className="text-sm text-text-primary/60 leading-relaxed font-light">
                    Precision tilt-shift optics ensuring every line is perfectly vertical, eliminating architectural distortion.
                  </p>
                </div>
                <div className="border-t border-white/5 pt-6 mt-6">
                  <span className="text-[10px] text-white/40 font-mono tracking-widest">ZERO DISTORTION</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 3: HIGH DYNAMIC RANGE */}
              <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10 hover:border-brick-copper/20 transition-all duration-500">
                <Aperture className="text-brick-copper w-8 h-8 mb-6 stroke-[1.2]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brick-copper/80 block mb-3 font-bold">
                  HIGH DYNAMIC RANGE
                </span>
                <p className="text-xs md:text-sm text-text-primary/60 leading-relaxed font-light">
                  Balanced exposure for window views and interior shadows.
                </p>
              </div>

              {/* Card 4: DIGITAL RETOUCHING */}
              <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10 hover:border-brick-copper/20 transition-all duration-500">
                <Sparkles className="text-brick-copper w-8 h-8 mb-6 stroke-[1.2]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brick-copper/80 block mb-3 font-bold">
                  DIGITAL RETOUCHING
                </span>
                <p className="text-xs md:text-sm text-text-primary/60 leading-relaxed font-light">
                  Pixel-perfect removal of distractions and color grading.
                </p>
              </div>

              {/* Card 5: CINEMATIC STYLING */}
              <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10 hover:border-brick-copper/20 transition-all duration-500">
                <Camera className="text-brick-copper w-8 h-8 mb-6 stroke-[1.2]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brick-copper/80 block mb-3 font-bold">
                  CINEMATIC STYLING
                </span>
                <p className="text-xs md:text-sm text-text-primary/60 leading-relaxed font-light">
                  Intentional composition that guides the viewer's eye.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section id="portfolio" className="py-24 lg:py-32 px-8 md:px-16 lg:px-24 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-16">
              <div>
                <span className="text-brick-copper text-[10px] uppercase tracking-[0.4em] font-bold block mb-2">THE PORTFOLIO</span>
                <h2 className="text-3xl md:text-5xl font-display text-white italic tracking-tight">CAPTURED NARRATIVES</h2>
              </div>
              <p className="text-sm md:text-base text-text-primary/60 font-light leading-relaxed max-w-md lg:text-right">
                A curation of high-end residential and commercial spaces defined by their unique character and our unwavering attention to detail.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Project 1: The Modern Manor */}
              <div className="group space-y-6">
                <div className="aspect-[4/3] overflow-hidden bg-charcoal border border-white/5 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" 
                    alt="The Modern Manor" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03] opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl md:text-2xl font-display text-white italic tracking-tight">
                      The Modern Manor
                    </h3>
                    <span className="font-mono text-[10px] tracking-[0.3em] text-text-primary/50 block mt-1 uppercase">
                      GREENWICH, CT
                    </span>
                  </div>
                  <Link to="/inquiry" className="p-3 border border-white/10 hover:border-brick-copper hover:text-brick-copper text-white transition-all">
                    <MoveUpRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Project 2: Industrial Loft Series */}
              <div className="group space-y-6">
                <div className="aspect-[4/3] overflow-hidden bg-charcoal border border-white/5 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80" 
                    alt="Industrial Loft Series" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03] opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl md:text-2xl font-display text-white italic tracking-tight">
                      Industrial Loft Series
                    </h3>
                    <span className="font-mono text-[10px] tracking-[0.3em] text-text-primary/50 block mt-1 uppercase">
                      TRIBECA, NY
                    </span>
                  </div>
                  <Link to="/inquiry" className="p-3 border border-white/10 hover:border-brick-copper hover:text-brick-copper text-white transition-all">
                    <MoveUpRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Call / Footer CTA Block */}
        <section className="my-24 lg:my-32 relative bg-[#C09E7E] text-charcoal p-12 md:p-20 overflow-hidden w-full flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto shadow-2xl border border-white/10">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-[0.08] pointer-events-none rotate-12">
            <Aperture className="w-[350px] h-[350px]" />
          </div>
          <div className="max-w-2xl relative z-10">
            <h2 className="font-display text-3xl md:text-5xl italic tracking-tight mb-4 leading-tight text-charcoal">
              Ready to elevate your listing to a work of art?
            </h2>
            <p className="text-xs md:text-sm text-charcoal/85 max-w-xl font-light leading-relaxed">
              Schedule a consultation or book your shoot date today. Our team is ready to capture your space with the precision it deserves.
            </p>
          </div>
          <div className="relative z-10 self-start md:self-center shrink-0">
            <a 
              href="#inquire" 
              className="inline-block bg-charcoal text-white px-10 py-5 font-mono text-[11px] tracking-[0.4em] font-black hover:bg-white hover:text-charcoal transition-all uppercase"
            >
              BOOK NOW
            </a>
          </div>
        </section>

        {/* Dynamic Interactive Booking Form */}
        <section id="inquire" className="py-20 md:py-28 px-8 md:px-16 lg:px-24 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-3xl mx-auto">
            <BookingForm override={{ title: "INQUIRE ABOUT INTERIOR PORTRAITS" }} />
          </div>
        </section>

      </div>
    </motion.div>
  );
}
