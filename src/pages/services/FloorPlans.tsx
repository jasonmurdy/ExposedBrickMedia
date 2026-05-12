import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Layout, Maximize, FileText, CheckCircle2 } from 'lucide-react';

export default function FloorPlansPage() {
  const features = [
    { title: "2D Schematic Layouts", description: "Clean, high-contrast layouts perfect for listing portals and print marketing.", icon: <FileText size={20} /> },
    { title: "3D Visualizations", description: "Immersive 3D renderings that provide a sense of volume and spatial flow.", icon: <Layout size={20} /> },
    { title: "Precise Measurements", description: "Accurate dimensions for every room, ensuring buyers understand the true scale.", icon: <Maximize size={20} /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
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
        <section className="relative py-20 lg:py-32 px-8 md:px-16 lg:px-24 overflow-hidden border-b border-border-subtle">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-brick-copper text-[10px] uppercase tracking-[0.5em] font-black">Strategic Documentation</span>
              <h1 className="font-display text-5xl md:text-7xl italic leading-[1.1]">The Blueprint of <br/><span className="text-white/40">Spatial Clarity.</span></h1>
              <p className="text-lg text-text-primary/60 leading-relaxed font-light max-w-lg">
                More than just lines on a page. Our floor plans provide the context that photos alone cannot—giving potential buyers a logical understanding of flow, scale, and possibility.
              </p>
              <div className="pt-4">
                <Link to="/inquiry" className="px-8 py-4 bg-brick-copper text-charcoal text-[11px] uppercase tracking-[0.3em] font-black hover:bg-white transition-all shadow-2xl">
                  Request Documentation
                </Link>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-4 bg-brick-copper/10 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative aspect-[4/3] bg-charcoal border border-white/10 p-8 overflow-hidden rounded-sm">
                <img 
                  src="https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=1200" 
                  alt="Architectural Floor Plan" 
                  className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-8 md:px-16 lg:px-24 bg-text-primary/[0.01]">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {features.map((f, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-6 group"
                >
                  <div className="w-12 h-12 flex items-center justify-center border border-white/10 text-brick-copper group-hover:bg-brick-copper group-hover:text-charcoal transition-all duration-500">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-display italic text-white">{f.title}</h3>
                  <p className="text-sm text-text-primary/50 leading-relaxed font-light">
                    {f.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Narrative Section */}
        <section className="py-24 px-8 md:px-16 lg:px-24">
          <div className="max-w-3xl mx-auto space-y-12 text-center">
            <h2 className="text-3xl font-display italic text-white leading-tight">Eliminate the guesswork. <br/><span className="text-text-primary/40 text-2xl">93% of buyers say floor plans are a must-have for any listing.</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left pt-12">
              <div className="flex gap-4">
                <CheckCircle2 className="text-brick-copper shrink-0" size={20} />
                <p className="text-sm text-text-primary/60"><strong className="text-white block mb-1">MLS Ready.</strong> Precision-crafted to meet all major listing portal requirements.</p>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-brick-copper shrink-0" size={20} />
                <p className="text-sm text-text-primary/60"><strong className="text-white block mb-1">Fast Delivery.</strong> Delivered within 24 hours of on-site capture.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
