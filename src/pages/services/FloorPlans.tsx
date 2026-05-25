import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Layout, Maximize, FileText, Check } from 'lucide-react';
import { useSiteContent } from '../../lib/SiteContentContext';
import { useMemo } from 'react';
import { Render } from '@measured/puck';
import { createConfig } from '../../lib/puck.config';
import { BookingForm } from '../../components/BookingAndFooter';
import { sanitizeLayout } from '../../lib/sanitizeLayout';

export default function FloorPlans() {
  const { pages, portfolioItems, partners, teams, brandResources } = useSiteContent();
  const page = pages.find(p => p.slug === 'floor-plans');

  const config = useMemo(() => createConfig(pages, portfolioItems, partners, teams, brandResources), [pages, portfolioItems, partners, teams, brandResources]);

  const sanitizedLayout = useMemo(() => {
    return sanitizeLayout(page?.layout, page?.title || 'Floor Plans');
  }, [page?.layout, page?.title]);

  if (sanitizedLayout && (sanitizedLayout.content?.length > 0 || sanitizedLayout.zones)) {
    return (
      <div className="w-full flex-col min-h-screen">
        <Helmet>
          <title>Floor Plans | Exposed Brick Media</title>
          <meta name="description" content="Professional 2D and 3D schematic floor plans for real estate marketing." />
        </Helmet>
        <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
          <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
          <span>/</span>
          <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
          <span>/</span>
          <span className="text-text-primary">Floor Plans</span>
        </div>
        <Render config={config} data={sanitizedLayout} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full animate-fadeIn"
    >
      <Helmet>
        <title>Floor Plans | Exposed Brick Media</title>
        <meta name="description" content="Professional 2D and 3D schematic floor plans for real estate marketing." />
      </Helmet>
      
      {/* Breadcrumbs */}
      <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
        <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
        <span>/</span>
        <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
        <span>/</span>
        <span className="text-text-primary">Floor Plans</span>
      </div>

      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] lg:h-[70vh] flex items-center justify-center text-center overflow-hidden border-b border-border-subtle">
          <img 
            src="https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=2000" 
            alt="Professional Floor Plans" 
            className="absolute inset-0 w-full h-full object-cover scale-105 motion-safe:animate-[pulse_10s_infinite] opacity-35 grayscale animate-pulse"
          />
          <div className="absolute inset-0 bg-black/65" />
          
          <div className="relative z-10 space-y-8 px-8 max-w-4xl">
            <span className="text-brick-copper text-[11px] uppercase tracking-[0.6em] font-black block">Strategic Documentation</span>
            <h1 className="font-display text-5xl md:text-8xl text-white italic tracking-tighter leading-tight">Professional <br/><span className="text-brick-copper">Floor Plans</span></h1>
            <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
              Give buyers the complete picture. Accurate, high-quality floor plans that bring your listings to life.
            </p>
          </div>
        </section>

        {/* Main Content: The Importance of Floor Plans */}
        <section className="py-24 lg:py-32 px-8 md:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Text Content */}
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <span className="text-brick-copper text-[10px] uppercase tracking-[0.5em] font-bold block">The Spatial Logic</span>
                <h2 className="text-3xl md:text-5xl font-display italic text-white leading-tight">
                  Why Every Real Estate Listing Needs a Floor Plan
                </h2>
              </div>
              <p className="text-lg text-text-primary/60 font-light leading-relaxed">
                Photography captures the emotion of a home, but a floor plan provides the logic. 
                In today's fast-paced market, buyers want to know if their lifestyle fits the space before they ever step through the front door. 
              </p>
              
              <ul className="space-y-8 pt-4">
                {[
                  {
                    title: "Immediate Spatial Understanding",
                    desc: "Photos can make it hard to understand the flow of a house. Floor plans instantly map out room relationships, showing where the primary bedroom sits relative to the nursery or home office."
                  },
                  {
                    title: "Higher Buyer Engagement",
                    desc: "Listings with floor plans keep potential buyers on the page longer. They actively engage with the layout, mentally placing their furniture and planning their lives in the space."
                  },
                  {
                    title: "Fewer Wasted Showings",
                    desc: "By providing accurate dimensions and layouts upfront, you attract highly qualified buyers who already know the home meets their fundamental structural needs."
                  }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-6 items-start">
                    <span className="flex-shrink-0 h-10 w-10 border border-white/10 rounded-sm flex items-center justify-center text-brick-copper mt-1">
                      <Check size={18} />
                    </span>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white tracking-wide">{item.title}</h4>
                      <p className="text-text-primary/60 text-sm leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Showcase */}
            <div className="lg:col-span-5 bg-charcoal border border-white/10 p-6 rounded-sm relative group overflow-hidden">
              <div className="absolute -inset-4 bg-brick-copper/5 blur-2xl opacity-30 group-hover:opacity-60 transition-opacity" />
              <div className="relative aspect-[4/3] w-full bg-black/40 overflow-hidden border border-white/5">
                <img 
                  src="https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=1200" 
                  alt="Detailed Real Estate Floor Plan" 
                  className="object-cover w-full h-full opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                />
              </div>
              <div className="relative mt-4 flex items-center justify-between text-[11px] uppercase tracking-wider text-text-primary/40">
                <span>Schematic Layout Asset</span>
                <span className="text-brick-copper">Precision Scale</span>
              </div>
            </div>

          </div>
        </section>

        {/* Process / Features Section */}
        <section className="py-24 px-8 md:px-16 lg:px-24 bg-text-primary/[0.02]">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <span className="text-brick-copper text-[10px] uppercase tracking-[0.5em] font-bold">Standard Features</span>
              <h3 className="text-3xl font-display italic text-white">Our Floor Plan Features</h3>
              <p className="text-text-primary/50 text-sm font-light font-sans">Eliminate the guesswork. 93% of buyers consider floor plans essential.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  title: "Laser-Accurate Measurements",
                  desc: "We use advanced LiDAR and laser measuring tools to capture room dimensions with pinpoint accuracy.",
                  icon: <Maximize size={20} />
                },
                {
                  title: "Fixed Furniture Details",
                  desc: "Our plans include essential fixed elements like kitchen islands, bathroom fixtures, and major appliances.",
                  icon: <Layout size={20} />
                },
                {
                  title: "Clean, Branded Delivery",
                  desc: "Receive your floor plans in high-resolution PDF and JPG formats, customized with your branding.",
                  icon: <FileText size={20} />
                }
              ].map((feat, i) => (
                <div key={i} className="p-8 border border-white/5 bg-charcoal/20 space-y-6 group hover:border-white/10 transition-colors">
                  <div className="w-12 h-12 flex items-center justify-center border border-white/10 text-brick-copper group-hover:bg-brick-copper group-hover:text-charcoal transition-all duration-500">
                    {feat.icon}
                  </div>
                  <h4 className="text-lg font-display italic text-white">{feat.title}</h4>
                  <p className="text-sm text-text-primary/50 leading-relaxed font-light">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Booking Section */}
        <section className="py-24 px-8 md:px-16 lg:px-24 border-t border-border-subtle">
          <div className="max-w-3xl mx-auto">
            <BookingForm override={{ title: "Request Floor Plan Documentation" }} />
          </div>
        </section>
      </div>
    </motion.div>
  );
}
