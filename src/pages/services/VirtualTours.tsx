import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Box, MousePointer2, Smartphone, Zap } from 'lucide-react';

export default function VirtualToursPage() {
  const categories = [
    { title: "Matterport Digital Twins", description: "The industry standard for high-fidelity 3D captures with dollhouse views.", icon: <Box size={20} /> },
    { title: "Interactive Navigation", description: "Intuitive point-and-click movement that lets buyers explore at their own pace.", icon: <MousePointer2 size={20} /> },
    { title: "Any-Device Access", description: "Beautifully responsive experiences that work on mobile, tablet, and desktop.", icon: <Smartphone size={20} /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      <Helmet>
        <title>3D Virtual Tours | Exposed Brick Media</title>
        <meta name="description" content="High-fidelity 3D Matterport tours and digital twins for architectural spaces." />
      </Helmet>
      
      {/* Breadcrumbs */}
      <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
        <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
        <span>/</span>
        <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
        <span>/</span>
        <span className="text-text-primary">3D Virtual Tours</span>
      </div>

      <div className="flex-1">
        {/* Interaction Hero */}
        <section className="relative py-20 lg:py-32 px-8 md:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brick-copper/10 border border-brick-copper/20 text-brick-copper rounded-full">
                <Zap size={12} className="animate-pulse" />
                <span className="text-[9px] uppercase tracking-widest font-black">Now Scanning 4K</span>
              </div>
              <h1 className="font-display text-5xl md:text-8xl italic leading-[1] text-white">Digital <br/><span className="text-white/30">Immortality.</span></h1>
              <p className="text-lg text-text-primary/60 font-light leading-relaxed max-w-lg">
                High-fidelity 3D capture is more than a tour—it's a digital twin. We provide buyers with a visceral sense of space that standard photography cannot replicate.
              </p>
              <div className="flex flex-wrap gap-6 pt-6">
                 <Link to="/inquiry" className="px-8 py-4 bg-brick-copper text-charcoal text-[11px] uppercase tracking-[0.3em] font-black hover:bg-white transition-all shadow-2xl">
                  Book A Scan
                </Link>
              </div>
            </div>
            
            <div className="relative aspect-video bg-charcoal border border-border-subtle overflow-hidden rounded-sm group">
              <img 
                src="https://images.unsplash.com/photo-1626178793926-22b288307329?auto=format&fit=crop&q=80&w=1600" 
                alt="3D Virtual Tour Interface" 
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-1000"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-20 h-20 rounded-full bg-brick-copper/80 flex items-center justify-center text-charcoal hover:scale-110 hover:bg-white transition-all cursor-pointer">
                    <MousePointer2 size={32} />
                 </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-[9px] uppercase tracking-widest text-white/40">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brick-copper animate-ping" /> Live Dollhouse View</span>
                <span>Pro Scan Engine 2.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Matrix */}
        <section className="py-24 px-8 md:px-16 lg:px-24 bg-text-primary/[0.01] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {categories.map((c, i) => (
                <div key={i} className="p-8 border border-white/5 bg-charcoal/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                    {c.icon}
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="text-brick-copper">{c.icon}</div>
                    <h3 className="text-xl font-display italic text-white">{c.title}</h3>
                    <p className="text-sm text-text-primary/50 leading-relaxed font-light">
                      {c.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Specs */}
        <section className="py-32 px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-display italic text-white">Advanced Capture Logistics</h2>
              <p className="text-text-primary/40 font-light max-w-lg mx-auto">Our specialized hardware captures spatial data points and high-resolution imagery simultaneously.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-[0.4em] text-brick-copper font-black">VR Integration</h4>
                <p className="text-sm text-text-primary/60 font-light">Tours are fully compatible with Meta Quest and other VR headsets for a truly immersive architectural walk-though.</p>
              </div>
              <div className="space-y-4">
                 <h4 className="text-[10px] uppercase tracking-[0.4em] text-brick-copper font-black">Guided Walkthroughs</h4>
                 <p className="text-sm text-text-primary/60 font-light">We can architect "Highlight Reels" that automatically guide the viewer through the most impressive features of the property.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
