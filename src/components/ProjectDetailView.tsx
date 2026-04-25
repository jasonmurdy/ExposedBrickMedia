/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSiteContent } from '../lib/SiteContentContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, MapPin, Home, Bed, Bath, Square, 
  DollarSign, Clock, ExternalLink, Share2, 
  ChevronRight, Camera, Grid, Info, CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';

export const ProjectDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { portfolioItems, loading } = useSiteContent();
  const project = portfolioItems?.find(p => p.id === id || p.mlsNumber === id);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setActiveImage(project.img);
      window.scrollTo(0, 0);
    }
  }, [project]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-bg-primary">
         <div className="w-12 h-12 border-2 border-brick-copper border-t-transparent rounded-full animate-spin"></div>
         <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/40">Synchronizing Archive...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-bg-primary">
        <h2 className="font-display text-4xl mb-4 italic">Entry Lost</h2>
        <p className="text-white/40 mb-8 max-w-md">This architectural narrative cannot be retrieved from the matrix.</p>
        <Link to="/" className="text-brick-copper uppercase tracking-widest text-[10px] border border-brick-copper/30 px-8 py-3 hover:bg-brick-copper hover:text-charcoal transition-all">Return to Home</Link>
      </div>
    );
  }

  const allImages = [project.img, ...(project.gallery || [])];

  return (
    <div className="flex flex-col w-full min-h-screen bg-bg-primary text-text-primary selection:bg-brick-copper selection:text-charcoal">
      {/* Top Nav */}
      <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center justify-between sticky top-0 bg-bg-primary/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
          <Link to="/" className="hover:text-brick-copper transition-colors flex items-center gap-2 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
          </Link>
          <span>/</span>
          <span className="text-text-primary font-medium">{project.category}</span>
          <span>/</span>
          <span className="text-white/30 truncate max-w-[150px]">{project.title}</span>
        </div>
        <div className="flex gap-4">
           {project.url && (
             <a 
               href={project.url} 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-[10px] uppercase tracking-widest text-brick-copper hover:text-white transition-colors flex items-center gap-2"
             >
               View Source Listing <ExternalLink size={12} />
             </a>
           )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-full">
        {/* Left: Content & Meta */}
        <div className="w-full lg:w-2/5 p-8 md:p-12 lg:p-16 space-y-12 overflow-y-auto custom-scrollbar lg:h-[calc(100vh-69px)]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-brick-copper mb-4 block font-bold">{project.category}</span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6 italic tracking-tight leading-tight">{project.title}</h1>
            
            <div className="flex flex-wrap gap-4 items-center">
               {project.status && (
                 <span className="bg-brick-copper text-charcoal px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
                   {project.status}
                 </span>
               )}
               {project.listPrice && (
                 <span className="text-xl font-display italic text-white/90">
                   {project.listPrice}
                 </span>
               )}
            </div>
          </motion.div>

          {/* Quick Specs Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-y-8 gap-x-4 border-t border-white/5 pt-12"
          >
            {[
              { label: 'Property Type', value: project.propertyType || project.category, icon: Home },
              { label: 'Beds', value: project.beds, icon: Bed },
              { label: 'Baths', value: project.baths, icon: Bath },
              { label: 'Square Footage', value: project.sqft ? `${project.sqft} FT²` : null, icon: Square },
              { label: 'MLS Number', value: project.mlsNumber, icon: Info },
            ].filter(spec => spec.value).map((spec, idx) => (
              <div key={idx} className="space-y-2 group">
                <div className="flex items-center gap-2 text-brick-copper/50 group-hover:text-brick-copper transition-colors">
                  <spec.icon size={14} />
                  <span className="text-[9px] uppercase tracking-widest">{spec.label}</span>
                </div>
                <p className="text-xl font-display">{spec.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Description */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-6 pt-8 border-t border-white/5"
          >
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Architectural Narrative</h4>
            <div className="prose prose-invert prose-p:text-text-primary/70 prose-p:leading-relaxed prose-p:text-lg max-w-none">
              <p>{project.description || 'A masterpiece of contemporary architecture, defined by precision, light, and materiality.'}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-12 space-y-4"
          >
             <button 
               onClick={() => {
                 const el = document.getElementById('inquire');
                 if (el) {
                   el.scrollIntoView({ behavior: 'smooth' });
                 } else {
                   navigate('/#inquire');
                 }
               }}
               className="w-full py-5 bg-white text-charcoal uppercase tracking-[0.2em] font-bold text-[10px] hover:bg-brick-copper transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98]"
             >
               Inquire for Documentation
             </button>
             {project.url && (
               <a 
                 href={project.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-full py-5 border border-white/10 text-white uppercase tracking-[0.2em] font-bold text-[10px] hover:bg-white hover:text-charcoal transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
               >
                 View Full Listing <ExternalLink size={12} />
               </a>
             )}
             <p className="mt-4 text-[9px] text-white/20 text-center uppercase tracking-widest">Confidential technical dossiers available upon request.</p>
          </motion.div>
        </div>

        {/* Right: Immersive Image Gallery */}
        <div className="w-full lg:w-3/5 bg-charcoal relative lg:h-[calc(100vh-69px)] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeImage}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img 
                src={activeImage || project.img} 
                className="w-full h-full object-cover" 
                alt={project.title}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-transparent to-transparent opacity-60 pointer-events-none" />
            </motion.div>
          </AnimatePresence>

          {/* Image Navigation */}
          <div className="absolute bottom-12 left-12 right-12 z-10 flex gap-4 overflow-x-auto no-scrollbar py-4">
             {allImages.map((img, idx) => (
               <button 
                 key={idx}
                 onClick={() => setActiveImage(img)}
                 className={`relative flex-shrink-0 w-24 h-24 border-2 transition-all overflow-hidden ${activeImage === img ? 'border-brick-copper scale-105 shadow-xl' : 'border-transparent opacity-40 hover:opacity-100'}`}
               >
                 <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               </button>
             ))}
          </div>

          <div className="absolute top-12 right-12 z-10">
             <div className="bg-bg-primary/50 backdrop-blur-md p-4 border border-white/5 flex flex-col gap-1 items-end">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Visual Chronology</span>
                <span className="text-xl font-display text-brick-copper italic">{allImages.indexOf(activeImage || '') + 1} / {allImages.length}</span>
             </div>
          </div>
          
          {project.mlsNumber?.startsWith('REALTOR.ca') || true && (
             <div className="absolute bottom-8 right-8 text-[8px] text-white/20 italic tracking-widest">
               Powered by Canadian Real Estate Association Technology
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
