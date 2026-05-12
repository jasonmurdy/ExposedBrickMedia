import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Camera, Sun, Layers, Aperture } from 'lucide-react';

export default function InteriorPhotographyPage() {
  const highlights = [
    { title: "Natural Light Mastery", description: "Architectural lighting techniques that emphasize depth and textures.", icon: <Sun size={20} /> },
    { title: "HDR Composition", description: "Advanced multi-exposure blending for perfect views inside and out.", icon: <Layers size={20} /> },
    { title: "Wide-Angle Precision", description: "Carefully chosen perspectives that show room volume without distortion.", icon: <Aperture size={20} /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      <Helmet>
        <title>Interior Photography | Exposed Brick Media</title>
        <meta name="description" content="Editorial-grade interior photography for luxury real estate." />
      </Helmet>
      
      {/* Breadcrumbs */}
      <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
        <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
        <span>/</span>
        <Link to="/services" className="hover:text-brick-copper transition-colors">Services</Link>
        <span>/</span>
        <span className="text-text-primary">Interior Photography</span>
      </div>

      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] lg:h-[80vh] flex items-center overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1600607687940-c52fb036999c?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Interior Photography" 
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/80 to-transparent" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-8 md:px-16 lg:px-24">
            <div className="max-w-2xl space-y-8">
              <span className="text-brick-copper text-[10px] uppercase tracking-[0.5em] font-black">Visual Narrative</span>
              <h1 className="font-display text-5xl md:text-8xl italic leading-[0.9]">Portrait of <br/><span className="text-white/40">Living Art.</span></h1>
              <p className="text-lg md:text-xl text-text-primary/60 font-light leading-relaxed">
                We don't just photograph rooms; we capture the atmosphere of home. Our editorial approach focuses on the interplay of light, shadow, and architectural detail.
              </p>
              <div className="pt-8">
                <Link to="/inquiry" className="px-10 py-5 bg-transparent border-2 border-brick-copper text-brick-copper text-[11px] uppercase tracking-[0.4em] font-black hover:bg-brick-copper hover:text-charcoal transition-all shadow-2xl">
                  Commission Capture
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Highlight Grid */}
        <section className="py-24 lg:py-32 px-8 md:px-16 lg:px-24 border-y border-border-subtle">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
              {highlights.map((h, i) => (
                <div key={i} className="space-y-6">
                  <div className="text-brick-copper mb-8">
                    {h.icon}
                  </div>
                  <h3 className="text-2xl font-display italic text-white tracking-tight">{h.title}</h3>
                  <p className="text-sm text-text-primary/50 leading-relaxed font-light border-l border-brick-copper/20 pl-6">
                    {h.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Split Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-16 md:p-24 lg:p-32 flex flex-col justify-center space-y-8 bg-text-primary/[0.02]">
            <h2 className="text-4xl font-display italic text-white leading-tight">Every angle is a <br/>deliberate choice.</h2>
            <div className="space-y-6 text-text-primary/60 font-light leading-relaxed">
              <p>
                Real estate photography is more than just documenting a space—it's about evoking an emotional response. We utilize advanced off-camera lighting to preserve natural textures and eliminate unwanted glares.
              </p>
              <p>
                Our post-production process is meticulous, involving hand-blended exposures to ensure that every window view is perfectly preserved and every shadow has intentional depth.
              </p>
            </div>
          </div>
          <div className="relative aspect-square lg:aspect-auto min-h-[600px] overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=1600" 
              alt="Interior Detail" 
              className="absolute inset-0 w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100"
            />
          </div>
        </section>
      </div>
    </motion.div>
  );
}
