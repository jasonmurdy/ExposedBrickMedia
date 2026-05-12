import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Globe, Wind, Compass, ShieldCheck } from 'lucide-react';

export default function AerialPhotographyPage() {
  const points = [
    { title: "Expanded Context", description: "Showcase the property in relation to its surroundings, neighborhoods, and terrain.", icon: <Globe size={20} /> },
    { title: "Heroic Perspectives", description: "Capture angles impossible from the ground, highlighting rooflines and estate scale.", icon: <Compass size={20} /> },
    { title: "Licensed Operation", description: "Fully insured and Transport Canada licensed drone pilots for legal, safe mission execution.", icon: <ShieldCheck size={20} /> },
  ];

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
        <section className="relative h-[60vh] lg:h-[70vh] flex items-center justify-center text-center overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000" 
            alt="Aerial Estate Photography" 
            className="absolute inset-0 w-full h-full object-cover scale-110 motion-safe:animate-[pulse_10s_infinite]"
          />
          <div className="absolute inset-0 bg-black/60" />
          
          <div className="relative z-10 space-y-8 px-8">
            <span className="text-brick-copper text-[11px] uppercase tracking-[0.6em] font-black drop-shadow-lg">Elevated Perspective</span>
            <h1 className="font-display text-5xl md:text-9xl text-white italic tracking-tighter drop-shadow-2xl">Perspective <br/>is <span className="text-brick-copper">Everything.</span></h1>
            <div className="max-w-xl mx-auto pt-8">
              <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed">
                Unlock the true potential of your property with cinematic aerial documentation that captures scope, beauty, and context.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 lg:py-32 px-8 md:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
            {points.map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group"
              >
                <div className="inline-flex p-4 border border-white/10 text-brick-copper group-hover:border-brick-copper group-hover:scale-110 transition-all duration-500 mb-8">
                  {p.icon}
                </div>
                <h3 className="text-2xl font-display italic text-white mb-4">{p.title}</h3>
                <p className="text-sm text-text-primary/50 leading-relaxed font-light">
                  {p.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Wide Image Section */}
        <section className="py-24 px-8 md:px-16 lg:px-24 bg-text-primary/[0.02]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <h2 className="text-4xl font-display italic text-white">Capture the <br/>Island Context.</h2>
              <p className="text-text-primary/60 font-light leading-relaxed">
                Specializing in waterfront estates and island properties, our aerial missions focus on highlighting the relationship between land and water. We provide high-resolution stills and 4K video clips that serve as the "hook" for any high-end marketing campaign.
              </p>
              <div className="pt-4 border-t border-white/10">
                <div className="flex gap-12">
                  <div>
                    <span className="text-3xl font-display text-brick-copper italic">4K</span>
                    <p className="text-[10px] uppercase tracking-widest text-text-primary/40 mt-1">Resolution</p>
                  </div>
                  <div>
                    <span className="text-3xl font-display text-brick-copper italic">SAFE</span>
                    <p className="text-[10px] uppercase tracking-widest text-text-primary/40 mt-1">Licensed Pilot</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 overflow-hidden border border-white/5 rounded-sm">
              <img 
                src="https://images.unsplash.com/photo-1508817628294-5a453fa0b8fb?auto=format&fit=crop&q=80&w=1600" 
                alt="Aerial Waterfront" 
                className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-1000 grayscale hover:grayscale-0"
              />
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
