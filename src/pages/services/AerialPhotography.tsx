import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Globe, Wind, Compass, ShieldCheck, CheckCircle2, Camera, Video, Map, Image as ImageIcon, Play, Check } from 'lucide-react';
import { useSiteContent } from '../../lib/SiteContentContext';
import { useMemo, useState } from 'react';
import { Render } from '@measured/puck';
import { createConfig } from '../../lib/puck.config';
import { sanitizeLayout } from '../../lib/sanitizeLayout';
import { BookingForm } from '../../components/BookingAndFooter';

export default function AerialPhotographyPage() {
  const { pages, portfolioItems, partners, teams, brandResources } = useSiteContent();
  const page = pages.find(p => p.slug === 'aerial');

  const config = useMemo(() => createConfig(pages, portfolioItems, partners, teams, brandResources), [pages, portfolioItems, partners, teams, brandResources]);

  const sanitizedLayout = useMemo(() => {
    return sanitizeLayout(page?.layout, page?.title || 'Aerial Photography');
  }, [page?.layout, page?.title]);

  const [activeTab, setActiveTab] = useState<'photos' | 'outlines' | 'video'>('photos');

  if (sanitizedLayout && (sanitizedLayout.content?.length > 0 || sanitizedLayout.zones)) {
    return (
      <div className="w-full flex-col min-h-screen">
        <Helmet>
          <title>Aerial Photography | Exposed Brick Media</title>
          <meta name="description" content="Cinematic aerial drone photography and videography for real estate." />
        </Helmet>
        <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
          <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
          <span>/</span>
          <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
          <span>/</span>
          <span className="text-text-primary">Aerial Photography</span>
        </div>
        <Render config={config} data={sanitizedLayout} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      <Helmet>
        <title>Aerial Photography | Exposed Brick Media</title>
        <meta name="description" content="Cinematic aerial drone photography and videography for real estate." />
      </Helmet>
      
      {/* Breadcrumbs */}
      <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
        <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
        <span>/</span>
        <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
        <span>/</span>
        <span className="text-text-primary">Aerial Photography</span>
      </div>

      <div className="flex-1">
        {/* Full Width Hero */}
        <section className="relative h-[60vh] lg:h-[70vh] flex items-center justify-center text-center overflow-hidden border-b border-border-subtle">
          <img 
            src="https://images.unsplash.com/photo-1506126279646-a697353d3166?auto=format&fit=crop&q=80&w=2000" 
            alt="Aerial Estate Photography" 
            className="absolute inset-0 w-full h-full object-cover scale-105 motion-safe:animate-[pulse_10s_infinite]"
          />
          <div className="absolute inset-0 bg-black/65" />
          
          <div className="relative z-10 space-y-8 px-8 max-w-4xl">
            <span className="text-brick-copper text-[11px] uppercase tracking-[0.6em] font-black block">Elevated Perspective</span>
            <h1 className="font-display text-5xl md:text-8xl text-white italic tracking-tighter leading-tight drop-shadow-2xl">
              Aerial & Drone Photography
            </h1>
            <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
              Elevate your listings above the competition. Showcase lot sizes, property boundaries, and neighborhood context with breathtaking drone imagery.
            </p>
          </div>
        </section>

        {/* 2. Value Proposition Section */}
        <section className="py-24 px-8 md:px-16 lg:px-24 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            <div className="space-y-8">
              <div>
                <span className="text-brick-copper text-[10px] uppercase tracking-[0.5em] font-bold block mb-3">Perspective Matters</span>
                <h2 className="text-3xl md:text-5xl font-display italic text-white leading-tight">
                  Highlighting What Ground Photos Can't
                </h2>
              </div>
              
              <p className="text-base text-text-primary/60 font-light leading-relaxed">
                A standard eye-level photo tells a fraction of the story. Drone media provides the critical context that luxury and rural property buyers demand before booking a showing.
              </p>
              
              <ul className="space-y-6 mt-8">
                {[
                  {
                    title: "Showcase Lot Size & Boundaries",
                    desc: "Perfect for large acreages, farms, or deep suburban lots. We capture the true footprint of the property in a single, impressive frame."
                  },
                  {
                    title: "Neighborhood Amenities",
                    desc: "Is the home close to a lake, golf course, or major park? Aerials visually connect the property to the desirable lifestyle features surrounding it."
                  },
                  {
                    title: "Unobstructed Angles",
                    desc: "Overcome tall trees, steep driveways, and awkward street angles. We fly to the exact height needed to capture the home's best architectural face."
                  }
                ].map((item, idx) => (
                  <motion.li 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start group"
                  >
                    <span className="flex-shrink-0 h-8 w-8 border border-white/10 rounded-sm flex items-center justify-center text-brick-copper mt-1 transition-colors group-hover:bg-brick-copper group-hover:text-charcoal duration-300">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div className="ml-4 space-y-1">
                      <h4 className="text-base font-semibold text-white tracking-wide">{item.title}</h4>
                      <p className="text-text-primary/50 text-sm leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="bg-charcoal p-4 md:p-6 border border-white/5 shadow-2xl relative group overflow-hidden">
              <div className="absolute -inset-4 bg-brick-copper/5 blur-2xl opacity-30 group-hover:opacity-60 transition-opacity" />
              <div className="relative aspect-[4/3] bg-black/40 overflow-hidden border border-white/5">
                <img 
                  src="https://images.unsplash.com/photo-1512100251789-c4fb505291b5?auto=format&fit=crop&q=80&w=1200" 
                  alt="Beautiful Drone Aerial Real Estate" 
                  className="object-cover w-full h-full transition duration-[1.2s] group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                {/* Overlay Badge */}
                <div className="absolute bottom-4 left-4 bg-charcoal/90 border border-white/10 backdrop-blur-md px-4 py-2 flex items-center space-x-2 rounded-sm shadow-md">
                  <Compass className="w-4 h-4 text-brick-copper" />
                  <span className="text-xs uppercase tracking-wider text-white font-medium">Neighborhood Context</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. Features Section */}
        <section className="py-24 px-8 md:px-16 lg:px-24 bg-text-primary/[0.02] border-y border-border-subtle">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <span className="text-brick-copper text-[10px] uppercase tracking-[0.5em] font-bold block">Professional Drone Services</span>
              <h3 className="text-3xl font-display italic text-white md:text-4xl">State-of-The-Art Equipment</h3>
              <p className="text-text-primary/50 text-sm font-light leading-relaxed">
                We utilize state-of-the-art DJI drone platforms to deliver crisp, cinematic, and legally compliant aerial media for your listings.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "High-Res Stills",
                  desc: "Crystal clear 20+ megapixel photos. Perfect for print brochures, MLS galleries, and hero images on your property websites.",
                  icon: <Camera className="w-5 h-5" />
                },
                {
                  title: "Licensed & Insured",
                  desc: "Transport Canada certified drone pilots with full commercial liability insurance. We fly safely, legally, and professionally.",
                  icon: <ShieldCheck className="w-5 h-5" />
                },
                {
                  title: "Cinematic 4K Video",
                  desc: "Smooth, sweeping aerial video that integrates flawlessly into your full property tour videos, capturing attention on social media.",
                  icon: <Video className="w-5 h-5" />
                }
              ].map((feat, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="p-8 border border-white/5 bg-charcoal/20 space-y-6 group hover:border-brick-copper/30 transition-colors"
                >
                  <div className="w-12 h-12 flex items-center justify-center border border-white/10 text-brick-copper group-hover:bg-brick-copper group-hover:text-charcoal transition-all duration-500">
                    {feat.icon}
                  </div>
                  <h4 className="text-lg font-display italic text-white">{feat.title}</h4>
                  <p className="text-sm text-text-primary/50 leading-relaxed font-light">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Interactive Display Options */}
        <section className="py-24 px-8 md:px-16 lg:px-24 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16 space-y-4">
            <span className="text-brick-copper text-[10px] uppercase tracking-[0.5em] font-bold block">AERIAL ADD-ONS & STYLES</span>
            <h3 className="text-3xl font-display italic text-white md:text-4xl">Premium Customizations</h3>
            <p className="text-text-primary/50 text-sm font-light leading-relaxed max-w-2xl mx-auto">
              Customize your aerial shoot to fit the unique selling points of the property.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Controls */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              {[
                {
                  id: "photos" as const,
                  title: "Standard Aerials",
                  desc: "Multiple angles of the home, lot, and neighborhood context. Essential for every listing.",
                  icon: <ImageIcon className="w-4 h-4" />
                },
                {
                  id: "outlines" as const,
                  title: "Property Outlines",
                  desc: "We graphically overlay the property boundaries on top-down images to clearly define the lot lines.",
                  icon: <Map className="w-4 h-4" />
                },
                {
                  id: "video" as const,
                  title: "Video B-Roll",
                  desc: "Dynamic, moving footage to be integrated into full cinematic property tours or social media reels.",
                  icon: <Play className="w-4 h-4" />
                }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-6 border transition-all duration-300 text-left outline-none cursor-pointer ${isActive ? 'border-brick-copper bg-brick-copper/[0.03]' : 'border-white/5 hover:border-white/15 bg-charcoal/20'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-display text-lg italic ${isActive ? 'text-brick-copper' : 'text-white'}`}>{tab.title}</h3>
                      <span className={`${isActive ? 'text-brick-copper animate-pulse' : 'text-text-primary/30'}`}>{tab.icon}</span>
                    </div>
                    <p className={`text-xs font-light leading-relaxed ${isActive ? 'text-text-primary/85' : 'text-text-primary/50'}`}>
                      {tab.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Display Stage Container */}
            <div className="w-full lg:w-2/3 bg-charcoal p-3 border border-white/5 shadow-2x h-[400px] md:h-[500px]">
              <div className="w-full h-full bg-black/60 overflow-hidden relative">
                
                {activeTab === 'photos' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200"
                      alt="Standard Aerial Drone Photo"
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                )}

                {activeTab === 'outlines' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-full h-full"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1592595896551-12b371d546d5?auto=format&fit=crop&q=80&w=1200"
                      alt="Property Outlines Drone Photo"
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                    {/* Branded Graphic Outline Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-3/4 h-3/4 text-brick-copper drop-shadow-[0_0_15px_rgba(164,113,73,0.3)]" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon 
                          points="20,80 30,20 80,30 70,90"
                          fill="rgba(164, 113, 73, 0.18)" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />
                      </svg>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'video' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1563456382029-79ad30950130?auto=format&fit=crop&q=80&w=1200"
                      alt="Aerial Video Preview"
                      className="absolute inset-0 w-full h-full object-cover select-none opacity-85"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/45 hover:bg-black/35 transition-colors duration-500"></div>
                    
                    {/* Pulsing visual play button */}
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl z-10 animate-pulse cursor-pointer hover:scale-115 active:scale-95 transition-transform duration-300">
                      <Play className="w-8 h-8 text-[#A47149] ml-1 fill-current" />
                    </div>
                  </motion.div>
                )}

              </div>
            </div>
          </div>
        </section>

        {/* 5. Booking Section */}
        <section className="py-24 px-8 md:px-16 lg:px-24 border-t border-border-subtle bg-black/10">
          <div className="max-w-3xl mx-auto">
            <BookingForm override={{ title: "Request Drone & Aerial Capture" }} />
          </div>
        </section>
      </div>
    </motion.div>
  );
}
