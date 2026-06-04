import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../../lib/SiteContentContext';
import { useMemo, useState } from 'react';
import { Render } from '@measured/puck';
import { createConfig } from '../../lib/puck.config';
import { sanitizeLayout } from '../../lib/sanitizeLayout';
import { Check, Ban, Camera, Plane, Layers, Sparkles } from 'lucide-react';

export default function PackagesPage() {
  const { pages, portfolioItems, partners, teams, brandResources, popups } = useSiteContent();
  const page = pages.find(p => p.slug === 'packages');

  const config = useMemo(() => createConfig(pages, portfolioItems, partners, teams, brandResources, popups), [pages, portfolioItems, partners, teams, brandResources, popups]);

  const sanitizedLayout = useMemo(() => {
    return sanitizeLayout(page?.layout, page?.title || 'Packages');
  }, [page?.layout, page?.title]);

  // Fallback states for non-Puck layout
  const [selectedBYO, setSelectedBYO] = useState<string[]>([]);
  const [byoStep, setByoStep] = useState<number>(1);
  const [byoSubmitted, setByoSubmitted] = useState<boolean>(false);
  const [byoLoading, setByoLoading] = useState<boolean>(false);
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    address: '',
    message: ''
  });

  const byoItems = [
    { id: 'still-photo', title: 'STILL PHOTOGRAPHY', description: 'Base 15 Photos', price: 150, iconName: 'camera' },
    { id: 'drone-coverage', title: 'DRONE COVERAGE', description: 'Aerial Stills + Video', price: 200, iconName: 'plane' },
    { id: 'floor-plans', title: 'FLOOR PLANS', description: '2D Laser Measured', price: 125, iconName: 'stairs' },
    { id: '3d-virtual-tour', title: '3D VIRTUAL TOUR', description: 'Matterport Hosting', price: 300, iconName: 'box' }
  ];

  const toggleBYO = (id: string) => {
    setSelectedBYO(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totalBYOPrice = useMemo(() => {
    return byoItems.reduce((acc, item) => {
      if (selectedBYO.includes(item.id)) {
        return acc + item.price;
      }
      return acc;
    }, 0);
  }, [selectedBYO]);

  const selectedItemsSummaryText = useMemo(() => {
    const names = byoItems
      .filter(item => selectedBYO.includes(item.id))
      .map(item => `${item.title} ($${item.price})`)
      .join(', ');
    return names ? `Selected Add-ons: ${names}` : 'No add-ons selected';
  }, [selectedBYO]);

  const handleBYOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactData.name || !contactData.email || !contactData.address) {
      return;
    }
    setByoLoading(true);
    try {
      const response = await fetch('/api/crm/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        alert('There was an issue submitting your custom packages quote. Please try again.');
      }
    } catch (err) {
      console.error('Custom BYO inquiry submission failed:', err);
    } finally {
      setByoLoading(false);
    }
  };

  if (sanitizedLayout && (sanitizedLayout.content?.length > 0 || sanitizedLayout.zones)) {
    return (
      <div className="w-full flex-col min-h-screen">
        <Helmet>
          <title>Packages | Exposed Brick Media</title>
          <meta name="description" content="High-fidelity curated packages & bespoke pricing for real estate cinematic visual storytelling." />
        </Helmet>
        <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
          <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
          <span>/</span>
          <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
          <span>/</span>
          <span className="text-text-primary">Packages</span>
        </div>
        <Render config={config} data={sanitizedLayout} />
      </div>
    );
  }

  // Fallback high-fidelity Page Layout (mirroring the screenshot)
  const packages = [
    {
      name: "Essential",
      tierLabel: "ENTRY TIER",
      price: "$495",
      billingUnit: "/ PROJECT",
      features: [
        { text: "25 Professional Interior Photos", included: true },
        { text: "3 Aerial Drone Stills", included: true },
        { text: "2D Schematic Floor Plan", included: true },
        { text: "3D Matterport Tour", included: false }
      ],
      buttonText: "SELECT PACKAGE",
      isPopular: false
    },
    {
      name: "Professional",
      tierLabel: "PRODUCTION STANDARD",
      price: "$850",
      billingUnit: "/ PROJECT",
      features: [
        { text: "40 High-End Interior Photos", included: true },
        { text: "10 Aerial Drone 4K Stills", included: true },
        { text: "2D & 3D Interactive Floor Plans", included: true },
        { text: "Matterport 3D Tour (6 Months)", included: true },
        { text: "Social Media Teaser Video", included: true }
      ],
      buttonText: "BOOK NOW",
      isPopular: true
    },
    {
      name: "Elite",
      tierLabel: "LUXURY SUITE",
      price: "$1,450",
      billingUnit: "/ PROJECT",
      features: [
        { text: "Unlimited Multi-Flash Interior Photos", included: true },
        { text: "Aerial 4K Cinematic Video (60s)", included: true },
        { text: "Premium Dollhouse 3D Render", included: true },
        { text: "Full Walkthrough Cinematic Film", included: true },
        { text: "Twilight Session Included", included: true }
      ],
      buttonText: "SELECT PACKAGE",
      isPopular: false
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex-col min-h-screen bg-charcoal text-white selection:bg-brick-copper selection:text-charcoal"
    >
      <Helmet>
        <title>Packages | Exposed Brick Media</title>
        <meta name="description" content="High-fidelity curated packages & bespoke pricing for real estate cinematic visual storytelling." />
      </Helmet>

      {/* Breadcrumbs */}
      <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-white/5 flex items-center gap-4 text-[10px] uppercase tracking-widest text-white/50">
        <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
        <span>/</span>
        <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
        <span>/</span>
        <span className="text-white">Packages</span>
      </div>

      <div className="flex-1 py-16 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-brick-copper text-[11px] uppercase tracking-[0.6em] font-black block font-mono">INVESTMENT</span>
          <h1 className="font-display text-4xl sm:text-6xl text-white italic tracking-tighter leading-tight font-medium animate-fadeIn">High-Fidelity Packages</h1>
          <p className="text-sm sm:text-base text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
            Elevating real estate through cinematic visual storytelling. Select a curated tier or build a bespoke production suite.
          </p>
        </div>

        {/* Curated packages cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-stretch">
          {packages.map((pkg, idx) => (
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
                <span className="text-[10px] tracking-widest text-[#cfa073]/80 uppercase font-mono font-bold mb-4 block">
                  {pkg.tierLabel}
                </span>
                <h3 className="font-display text-3xl italic text-white mb-2 leading-tight font-medium">
                  {pkg.name}
                </h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
                    {pkg.price}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-2 font-mono">
                    {pkg.billingUnit}
                  </span>
                </div>

                <div className="w-full h-px bg-white/5 my-6" />

                <ul className="space-y-4 mb-8 text-left">
                  {pkg.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-center gap-3">
                      {!feat.included ? (
                        <Ban size={14} className="text-[#3a3a3a] shrink-0" />
                      ) : (
                        <Check size={14} className="text-brick-copper shrink-0" />
                      )}
                      <span className={`text-xs font-light font-sans tracking-wide ${
                        !feat.included 
                          ? "text-white/20 line-through font-light" 
                          : "text-white/85"
                      }`}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-4">
                <a 
                  href="#calculator" 
                  onClick={(e) => {
                    const calcEl = document.getElementById("calculator");
                    if (calcEl) {
                      e.preventDefault();
                      calcEl.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`block w-full py-3.5 text-center text-[10px] tracking-[0.25em] uppercase font-black transition-all duration-300 font-mono shadow-sm cursor-pointer ${
                    pkg.isPopular 
                      ? "bg-brick-copper hover:bg-white text-charcoal shadow-lg shadow-brick-copper/10" 
                      : "border border-white/10 hover:border-white text-white hover:bg-white/5"
                  }`}
                >
                  {pkg.buttonText}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Build Your Own bespoke calculator */}
        <div id="calculator" className="border border-white/5 bg-[#0a0a0a]/60 shadow-xl rounded p-8 sm:p-12 md:p-16 w-full relative overflow-hidden">
          {byoStep === 1 ? (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
                <div>
                  <h3 className="font-display text-2xl sm:text-4xl text-white italic tracking-tight mb-2 font-medium">Build Your Own</h3>
                  <p className="text-xs sm:text-sm text-white/50 font-light">Tailor our services to your specific project needs.</p>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-[10px] tracking-widest text-white/40 uppercase font-mono font-bold mb-1 block">ESTIMATED TOTAL</span>
                  <div className="text-3xl sm:text-4xl font-mono text-brick-copper font-black tracking-tight">${totalBYOPrice}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 mb-12">
                {byoItems.map((item) => {
                  const isSelected = selectedBYO.includes(item.id);
                  
                  return (
                    <div 
                      key={item.id}
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
                          if (item.iconName === 'camera') return <Camera size={20} className="text-brick-copper/80 group-hover:scale-110 transition-transform duration-300" />;
                          if (item.iconName === 'plane') return <Plane size={20} className="text-brick-copper/80 group-hover:scale-110 transition-transform duration-300" />;
                          if (item.iconName === 'box') return <Layers size={20} className="text-brick-copper/80 group-hover:scale-110 transition-transform duration-300" />;
                          if (item.iconName === 'stairs') {
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
                        <h4 className="text-[11px] tracking-widest text-white/90 font-mono font-bold uppercase mb-1">{item.title}</h4>
                        <p className="text-[10px] text-white/40 font-light tracking-wide mb-6">{item.description}</p>
                        <div className="text-base font-mono text-white/70 group-hover:text-brick-copper transition-colors font-bold">${item.price}</div>
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
                  GENERATE CUSTOM QUOTE
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn max-w-xl mx-auto">
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-8">
                <h3 className="font-display text-xl text-white italic font-medium">Bespoke Suite Specifications</h3>
                <button onClick={() => setByoStep(1)} className="text-[10px] uppercase tracking-widest text-white/50 hover:text-brick-copper transition-colors font-mono font-bold">← Back to Selector</button>
              </div>

              {byoSubmitted ? (
                <div className="text-center py-12">
                  <Check size={40} className="text-brick-copper mx-auto mb-4 animate-bounce" />
                  <h4 className="font-display text-2xl text-white italic mb-2 font-medium">Quote Transmitted</h4>
                  <p className="text-xs text-white/50 max-w-sm mx-auto mb-6">
                    Your selections have been securely transferred to our CRM dashboard. An advisory partner will contact you shortly with custom schedules.
                  </p>
                  <button 
                    onClick={() => {
                      setByoSubmitted(false);
                      setSelectedBYO([]);
                      setByoStep(1);
                      setContactData({ name: '', email: '', address: '', message: '' });
                    }}
                    className="text-[9px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white font-mono py-2.5 px-6 rounded transition-all"
                  >
                    Configure Another Quote
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBYOSubmit} className="space-y-6 text-left">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-bold block mb-1">Your Selections Summary</span>
                    <p className="text-xs text-brick-copper font-medium">{selectedItemsSummaryText}</p>
                    <span className="text-sm font-mono font-bold text-white block mt-2">Estimated Price: ${totalBYOPrice}</span>
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
                      placeholder="Your Full Name" 
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
                      className="flex-1 py-4 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-[10px] uppercase tracking-widest font-mono duration-300 font-bold"
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
      </div>
    </motion.div>
  );
}
