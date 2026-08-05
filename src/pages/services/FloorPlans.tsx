import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Layout, Maximize, FileText, Check, Compass, Layers, Box, Zap, Clock, Sparkles } from 'lucide-react';
import { useSiteContent } from '../../lib/SiteContentContext';
import { useMemo } from 'react';
import { Render } from '@puckeditor/core';
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
      <div className="w-full flex-col min-h-screen bg-bg-primary text-text-primary">
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
      className="w-full animate-fadeIn bg-bg-primary text-text-primary min-h-screen flex flex-col"
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
        {/* Hero Header Section */}
        <section className="px-8 md:px-12 lg:px-16 max-w-7xl mx-auto mt-12 md:mt-16 mb-16">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 border-b border-white/10 pb-8">
            <div className="max-w-2xl">
              <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.4em] text-brick-copper mb-4 block font-medium">
                PRECISION ARCHITECTURAL MAPPING
              </span>
              <h1 className="font-serif italic text-4xl md:text-7xl text-white tracking-tight leading-[1.1]">
                Visualizing space with technical elegance.
              </h1>
              <p className="text-sm md:text-base text-text-primary/70 max-w-xl leading-relaxed mt-6 font-light">
                Clean, high-fidelity floor plans that bridge the gap between imagination and reality. From detailed 2D layouts to immersive 3D visualizations.
              </p>
            </div>
            
            {/* Horizontal Grid Info Boxes */}
            <div className="flex gap-8 lg:gap-12 font-mono text-[10px] pb-2 w-full md:w-auto justify-start md:justify-end">
              <div className="flex flex-col">
                <span className="text-text-primary/40 tracking-[0.2em] mb-1.5">PRECISION</span>
                <span className="text-white border border-white/10 px-3 py-1.5 bg-white/[0.02]">99.8% ACCURACY</span>
              </div>
              <div className="flex flex-col">
                <span className="text-text-primary/40 tracking-[0.2em] mb-1.5">TURNAROUND</span>
                <span className="text-white border border-white/10 px-3 py-1.5 bg-white/[0.02]">24 HOURS</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Image */}
          <div className="mt-8 relative h-[350px] md:h-[600px] w-full overflow-hidden group border border-white/5 bg-black/20">
            <img 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-90"
              alt="Cinematic architectural luxury master bedroom interior layout"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuArp_Nm8EEMo1oNGZ85G1A4fgG0bFaiX--1LP2TJkVrCCaiEjtQTY4gMbeyWmAP4-EJFllHA1QVZ3tAzcGIIDDNPljCAKo0x_jDHet03EjciVvGU9gMUVn63N7iNCeatgRi3sGIyRSBWxnLdj-IgYwZ3uz_RuaDD0ItnNENSPnFsGNF3EAsYJ7tIzH8fPhfiPAgJVhcF1h-_ByCflWOYY-h20ET848NJ_dTe_niK0UMWASDzruIpdLRnTUrDiymZdC4LL1EVtnfY3sH"
            />
            {/* Overlay Gradient resembling production suite */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-transparent to-transparent opacity-60 pointer-events-none" />
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
              <div className="flex items-center gap-3 backdrop-blur-md bg-black/40 border border-white/10 p-3 rounded-none">
                <Compass className="text-brick-copper w-4 h-4" />
                <span className="font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-white">MASTER SUITE L-422</span>
              </div>
            </div>
          </div>
        </section>

        {/* Product Sections Grid (2D & 3D options) */}
        <section className="px-8 md:px-12 lg:px-16 max-w-7xl mx-auto mb-24 md:mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            
            {/* 2D Schematic Card */}
            <div className="p-8 md:p-12 border border-white/5 bg-white/[0.01] hover:border-brick-copper/20 transition-all duration-500 flex flex-col justify-between group rounded-none min-h-[550px]">
              <div>
                <div className="mb-10 text-brick-copper">
                  <Compass className="w-10 h-10" strokeWidth={1} />
                </div>
                <h2 className="font-serif italic text-3xl md:text-5xl text-white tracking-tight mb-6">
                  Schematic 2D Layouts
                </h2>
                <p className="text-sm text-text-primary/60 leading-relaxed font-light mb-8 max-w-md">
                  Perfect for standard listings. Crisp black and white or color-coded diagrams including precise measurements, room labels, and total square footage.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    "Laser-Accurate Measurements",
                    "Custom Branding Options",
                    "PDF & High-Res JPG Delivery"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 font-mono text-[10px] md:text-[11px] tracking-wider text-text-primary/8 font-medium uppercase">
                      <span className="inline-block w-1.5 h-1.5 bg-brick-copper rounded-none"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sub-image area inside card */}
              <div className="mt-6 h-48 overflow-hidden relative border border-white/5 bg-black/40">
                <img 
                  className="w-full h-full object-cover grayscale opacity-30 group-hover:opacity-60 transition-opacity duration-1000"
                  alt="Stylized monochrome 2D blueprint layout"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQhA1X3G37-u5gX0x4_TwYmCZjTcSsRAO09ODZ2YwX1j15mz5qAqX0CYJ0Vor8loeI8zkyTPwjQ_CCQcsu-Nc4UcyqQzRklEAfwHBXuMNkhBWnhwcvDtQlpENn8u3m-k8StYuryRAWPRLlITV5yfuuoZ57Z3B5LSlIK-FYZ-vn7PjFBnx9-EqQfHh1OUeFAm68to2oyKbfU46_1Qe8OeSgUdR4eIzmPFbEUCMMKZroS8XdXn-wzAUgs9QQbsb-Q1gHMmgaSGCnluo5"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* 3D Immersive Card */}
            <div className="p-8 md:p-12 border border-white/5 bg-white/[0.01] hover:border-brick-copper/20 transition-all duration-500 flex flex-col justify-between group rounded-none min-h-[550px]">
              <div>
                <div className="mb-10 text-brick-copper">
                  <Layers className="w-10 h-10" strokeWidth={1} />
                </div>
                <h2 className="font-serif italic text-3xl md:text-5xl text-white tracking-tight mb-6">
                  Immersive 3D Visuals
                </h2>
                <p className="text-sm text-text-primary/60 leading-relaxed font-light mb-8 max-w-md">
                  Elevate your presentation with volumetric renders. Helping buyers visualize the flow and volume of the property with realistic textures and lighting.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    "Full Furniture Staging",
                    "Lighting & Texture Realism",
                    "Multiple Perspective Angles"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 font-mono text-[10px] md:text-[11px] tracking-wider text-text-primary/8 font-medium uppercase">
                      <span className="inline-block w-1.5 h-1.5 bg-brick-copper rounded-none"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sub-image area inside card */}
              <div className="mt-6 h-48 overflow-hidden relative border border-white/5 bg-black/40">
                <img 
                  className="w-full h-full object-cover grayscale opacity-30 group-hover:opacity-60 transition-opacity duration-1000"
                  alt="Stylized volumetric isometric 3D architectural mockup layout"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8NM12JaEItHxBon6CuazpOjos1lvwh314h11D4ZODfah65zEqiSyj68UgcqdS8ppsyCj1s3WeoD5DDDyhnJSoLDcKvv5yB6zMjqyHtmUf36q2mPn1gmTktPtQkaBAZ_yl8WJTVdgHOAHGCQmgae9xp4TzL8EuEV14oR9o8d78huuiD4XNYkpVcexxnPBjGDVa7U3HO_047autjNbAm0Z8_t8LyIym9f6zzjxV-AN49bny2C9gUo2uffuPcyk3QELTg70mI5wdI2zg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>

          </div>
        </section>

        {/* Process Section with Bento Design */}
        <section className="px-8 md:px-12 lg:px-16 max-w-7xl mx-auto mb-24 md:mb-32">
          <div className="mb-12 md:mb-16">
            <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.4em] text-brick-copper mb-4 block font-medium">
              THE WORKFLOW
            </span>
            <h2 className="font-serif italic text-4xl md:text-6xl text-white tracking-tight">
              Technical precision, delivered fast.
            </h2>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Card 01 - Capture */}
            <div className="bg-white/[0.01] p-8 md:p-10 border border-white/5 flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="font-mono text-xs tracking-widest text-brick-copper/60">01</span>
                <h3 className="font-serif italic text-2xl text-white mt-4 mb-4">Capture</h3>
                <p className="text-sm text-text-primary/60 leading-relaxed font-light">
                  We use high-precision LiDAR and photogrammetry to scan every inch of the property during our visit.
                </p>
              </div>
            </div>

            {/* Card 02 - Process (Tall) */}
            <div className="bg-white/[0.01] p-8 md:p-10 border border-white/5 flex flex-col justify-between md:row-span-2 min-h-[350px]">
              <div>
                <span className="font-mono text-xs tracking-widest text-brick-copper/60">02</span>
                <h3 className="font-serif italic text-2xl text-white mt-4 mb-4">Process</h3>
                <p className="text-sm text-text-primary/60 leading-relaxed font-light mb-8">
                  Our architectural draftsmen convert raw data into clean, formatted plans with 99.8% measurement accuracy.
                </p>
              </div>
              
              <div className="border-t border-white/10 pt-6 mt-6">
                <div className="flex items-center gap-3 mb-3 text-brick-copper">
                  <Zap className="w-4 h-4" />
                  <span className="font-mono text-[11px] tracking-[0.25em] font-medium uppercase">PRIORITY RENDERING</span>
                </div>
                <p className="text-[11px] text-text-primary/50 leading-relaxed font-light">
                  Standard 24-hour turnaround included with all premium media packages.
                </p>
              </div>
            </div>

            {/* Card 03 - Deliver */}
            <div className="bg-white/[0.01] p-8 md:p-10 border border-white/5 flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="font-mono text-xs tracking-widest text-brick-copper/60">03</span>
                <h3 className="font-serif italic text-2xl text-white mt-4 mb-4">Deliver</h3>
                <p className="text-sm text-text-primary/60 leading-relaxed font-light">
                  Receive your print-ready and web-optimized files via our secure client portal.
                </p>
              </div>
            </div>

            {/* Spanning Image Block */}
            <div className="md:col-span-2 bg-white/[0.01] relative h-64 overflow-hidden border border-white/5 group">
              <img 
                className="w-full h-full object-cover opacity-35 group-hover:scale-[1.03] transition-transform duration-700 hover:opacity-50"
                alt="Architectural laser rangefinder measuring device macro close-up"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXWn7O1QduMg8tBFaxMu8CoGB1qfriUiN7gBJ3YUe1fvKRcx1YYFjzUlXmLZEbltWnEKhTWrOKcoF9nvs7pf3EyrG6CPiVegcosMiXugvbUisdft5m40pesaaA98SyfxcDD63EdnSO0Yo2CnazomXd4QahCDPj80MoqOxgduqj9bM2YggqRJKagS4U6EYcyCDWDa4UV9mhNNfdIMc2NcpXer8pbVvdOjCtQ14WWRUXDgnwbeNa6oS_mESGQFEWn_bFNVSCXJzu4y_N"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 to-transparent pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-mono text-xs tracking-[0.4em] text-white font-semibold transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  LASER-GUIDED ACCURACY
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Action Call / Footer CTA Block */}
        <section className="bg-white/[0.01] border-y border-white/5 py-16 md:py-24 px-8 md:px-12 lg:px-16 w-full">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl text-left">
              <h2 className="font-serif italic text-3xl md:text-5xl text-white tracking-tight mb-4">
                Ready to blueprint your listing?
              </h2>
              <p className="text-sm md:text-base text-text-primary/70 leading-relaxed font-light">
                Our floor plans are the perfect companion to our premium photography and cinema services. Book as a standalone or as part of a media suite.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto self-start lg:self-center">
              <Link 
                to="/services/packages"
                className="bg-brick-copper text-charcoal px-8 py-4 font-mono text-[11px] tracking-[0.3em] font-bold text-center hover:opacity-90 active:scale-95 transition-all duration-300"
              >
                VIEW PRICING
              </Link>
              <Link 
                to="/inquiry"
                className="border border-white/20 text-white px-8 py-4 font-mono text-[11px] tracking-[0.3em] text-center hover:border-brick-copper hover:text-brick-copper active:scale-95 transition-all duration-300"
              >
                BOOK NOW
              </Link>
            </div>
          </div>
        </section>

        {/* Dynamic Interactive Booking Form */}
        <section className="py-20 md:py-28 px-8 md:px-16 lg:px-24">
          <div className="max-w-3xl mx-auto">
            <BookingForm override={{ title: "Request Floor Plan Documentation" }} />
          </div>
        </section>

      </div>
    </motion.div>
  );
}
