/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSiteContent } from '../lib/SiteContentContext';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, MapPin, Home, Bed, Bath, Square, 
  DollarSign, Clock, ExternalLink, Share2, 
  ChevronRight, Camera, Grid, Info, CheckCircle2, Shield, Download, FileText,
  Mail, Phone, Instagram
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackMediaInteraction } from '../lib/analytics';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

import { PDFViewer } from './PDFViewer';

export const ProjectDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { portfolioItems, partners, settings, loading } = useSiteContent();
  const project = portfolioItems?.find(p => p.id === id || p.mlsNumber === id);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (project) {
      setActiveImage(project.img);
      trackMediaInteraction({
        property_id: project.id,
        media_type: 'flambient_gallery',
        action: 'view'
      });
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

  const associatedPartners = partners?.filter(p => 
    p.id === project.partnerUid || 
    project.partnerUids?.includes(p.id)
  ) || [];

  return (
    <div className="flex flex-col w-full min-h-screen bg-bg-primary text-text-primary selection:bg-brick-copper selection:text-charcoal">
      <Helmet>
        <title>{`${project.title} | ${project.category} | Exposed Brick Media`}</title>
        <meta name="description" content={`Explore ${project.title}, a ${project.propertyType || project.category} showcase. ${project.description?.substring(0, 120)}`} />
        <meta property="og:title" content={`${project.title} | Architectural Showcase`} />
        <meta property="og:image" content={project.img} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
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
           {(project.externalLink || project.url) && (
             <a 
               href={project.externalLink || project.url} 
               target="_blank" 
               rel="noopener noreferrer"
               onClick={() => {
                 trackMediaInteraction({
                   property_id: project.id,
                   media_type: project.externalLink ? 'agent_listing' : 'matterport_tour',
                   action: 'view'
                 });
               }}
               className="text-[10px] uppercase tracking-widest text-brick-copper hover:text-white transition-colors flex items-center gap-2"
             >
               {project.externalLink ? 'Listing Agent Page' : 'View Source Listing'} <ExternalLink size={12} />
             </a>
           )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-full">
        {/* Column 1: Listing Advisory Profile & Portfolio List */}
        <div className="order-3 lg:order-1 w-full lg:w-[22%] border-t lg:border-t-0 lg:border-r border-white/5 p-6 space-y-8 overflow-y-auto custom-scrollbar lg:h-[calc(100vh-69px)] bg-black/10">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div>
              <span className="text-[8px] uppercase tracking-[0.3em] text-brick-copper font-black font-mono block mb-1">Architectural Contact</span>
              <h4 className="text-xs uppercase tracking-wider font-bold text-white">Listing Advisory</h4>
            </div>

            {associatedPartners.length > 0 ? (
              <div className="space-y-6">
                {associatedPartners.map((partner) => (
                  <div key={partner.id} className="space-y-4">
                    {/* Headshot & Brand */}
                    <div className="relative group overflow-hidden border border-white/10 aspect-square bg-charcoal rounded-sm">
                      {partner.headshotUrl ? (
                        <img 
                          src={partner.headshotUrl} 
                          alt={partner.displayName} 
                          className="w-full h-full object-cover transition-all grayscale duration-500 group-hover:grayscale-0 scale-100 group-hover:scale-[1.03]" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <span className="text-sm font-bold text-white/40">{partner.displayName?.charAt(0) || '?'}</span>
                        </div>
                      )}
                      {partner.logoUrl && (
                        <div className="absolute bottom-3 right-3 w-8 h-8 border border-white/10 bg-black/80 backdrop-blur-md p-1 rounded-full overflow-hidden">
                          <img src={partner.logoUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[7px] uppercase tracking-[0.25em] text-brick-copper font-mono font-bold block">
                        {partner.role === 'preferred' ? 'Preferred Advisor' : 'Advisory Partner'}
                      </span>
                      <h5 className="text-sm uppercase tracking-wider font-bold text-white">{partner.displayName || 'No Name'}</h5>
                      {partner.licenseNumber && (
                        <p className="text-[7px] tracking-widest text-white/30 uppercase font-mono">Lic: {partner.licenseNumber}</p>
                      )}
                    </div>

                    {/* Contact Direct Hotlinks */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {partner.phone && (
                        <a 
                          href={`tel:${partner.phone}`}
                          title={`Call ${partner.displayName}`}
                          className="py-2 flex items-center justify-center bg-white/5 hover:bg-brick-copper border border-white/10 hover:border-brick-copper text-white hover:text-charcoal transition-all rounded-xs text-[8px] uppercase tracking-wider font-bold font-mono"
                        >
                          <Phone size={9} className="mr-1" /> Call
                        </a>
                      )}
                      {partner.email && (
                        <a 
                          href={`mailto:${partner.email}`}
                          title={`Email ${partner.displayName}`}
                          className="py-2 flex items-center justify-center bg-white/5 hover:bg-brick-copper border border-white/10 hover:border-brick-copper text-white hover:text-charcoal transition-all rounded-xs text-[8px] uppercase tracking-wider font-bold font-mono"
                        >
                          <Mail size={9} className="mr-1" /> Mail
                        </a>
                      )}
                      {partner.instagram && (
                        <a 
                          href={`https://instagram.com/${partner.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Instagram @${partner.instagram.replace('@', '')}`}
                          className="py-2 flex items-center justify-center bg-white/5 hover:bg-brick-copper border border-white/10 hover:border-brick-copper text-white hover:text-charcoal transition-all rounded-xs text-[8px] uppercase tracking-wider font-bold font-mono"
                        >
                          <Instagram size={9} className="mr-1" /> IG
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Fallback to agency contact
              <div className="space-y-4">
                <div className="relative border border-white/10 aspect-square bg-white/[0.02] flex items-center justify-center rounded-sm">
                   <span className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono">Exposed Brick</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[7px] uppercase tracking-[0.25em] text-brick-copper font-mono font-bold block">Agency Contact</span>
                  <h5 className="text-sm uppercase tracking-wider font-bold text-white">Exposed Brick Advisory</h5>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href={`tel:${settings?.contactInfo?.phone || '+1 (555) 000-0000'}`}
                    className="py-2 bg-white/5 hover:bg-brick-copper hover:text-charcoal text-center border border-white/10 text-[9px] uppercase tracking-widest font-bold text-white transition-all rounded-xs flex items-center justify-center gap-1.5"
                  >
                    <Phone size={10} /> Call
                  </a>
                  <a 
                    href={`mailto:${settings?.contactInfo?.email || 'office@exposedbrick.com'}`}
                    className="py-2 bg-white/5 hover:bg-brick-copper hover:text-charcoal text-center border border-white/10 text-[9px] uppercase tracking-widest font-bold text-white transition-all rounded-xs flex items-center justify-center gap-1.5"
                  >
                    <Mail size={10} /> Email
                  </a>
                </div>
              </div>
            )}
          </motion.div>

          {/* Connected Portfolio Items */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 pt-6 border-t border-white/5"
          >
            {(() => {
              const otherProperties = portfolioItems?.filter(p => 
                p.id !== project.id && (
                  associatedPartners.some(partner => p.partnerUid === partner.id || p.partnerUids?.includes(partner.id))
                )
              ) || [];

              const isShowingAdvisorListings = otherProperties.length > 0;
              const listingsToShow = isShowingAdvisorListings 
                ? otherProperties.slice(0, 5)
                : portfolioItems?.filter(p => p.id !== project.id).slice(0, 4) || [];

              return (
                <>
                  <div>
                    <span className="text-[8px] uppercase tracking-[0.3em] text-brick-copper font-black font-mono block mb-1">
                      {isShowingAdvisorListings ? 'Advisor\'s Portfolio' : 'Curated Selection'}
                    </span>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-white">
                      {isShowingAdvisorListings ? 'Connected Listings' : 'Exposed Brick Selection'}
                    </h4>
                  </div>

                  {listingsToShow.length > 0 ? (
                    <div className="space-y-3">
                      {listingsToShow.map((other) => (
                        <Link 
                          key={other.id} 
                          to={`/listing/${other.id}`}
                          className="flex gap-3 p-2 bg-white/[0.01] hover:bg-white/[0.04] border border-transparent hover:border-white/5 rounded-xs transition-colors group text-left"
                        >
                          <div className="w-12 h-12 flex-shrink-0 overflow-hidden bg-charcoal border border-white/10 aspect-square rounded-xs">
                            <img 
                              src={other.img} 
                              alt={other.title} 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <span className="text-[7px] uppercase tracking-wider text-brick-copper font-bold block">{other.category || 'Architecture'}</span>
                            <h5 className="text-[9px] uppercase tracking-wider font-bold text-white group-hover:text-brick-copper transition-colors truncate">{other.title}</h5>
                            {other.listPrice && (
                              <span className="text-[8px] font-mono text-white/40">{other.listPrice}</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-white/30 italic font-mono">No other listings cataloged.</p>
                  )}
                </>
              );
            })()}
          </motion.div>
        </div>

        {/* Column 2: Architectural Details & Specifications */}
        <div className="order-2 lg:order-2 w-full lg:w-[35%] p-8 md:p-10 space-y-12 overflow-y-auto custom-scrollbar lg:h-[calc(100vh-69px)] border-t lg:border-t-0 lg:border-r border-white/5">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-brick-copper mb-4 block font-bold">{project.category}</span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-5xl mb-6 italic tracking-tight leading-tight">{project.title}</h1>
            
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
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-y-8 gap-x-4 border-t border-white/5 pt-8"
          >
            {[
              { label: 'Property Type', value: project.propertyType || project.category, icon: Home },
              { label: 'Beds', value: project.beds, icon: Bed },
              { label: 'Baths', value: project.baths, icon: Bath },
              { label: 'Square Footage', value: project.sqft ? `${project.sqft} FT²` : null, icon: Square },
              { label: 'MLS Number', value: project.mlsNumber, icon: Info },
            ].filter(spec => spec.value).map((spec, idx) => (
              <div key={idx} className="space-y-1.5 group">
                <div className="flex items-center gap-2 text-brick-copper/50 group-hover:text-brick-copper transition-colors">
                  <spec.icon size={12} />
                  <span className="text-[8.5px] uppercase tracking-widest">{spec.label}</span>
                </div>
                <p className="text-lg font-display">{spec.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Description */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 pt-8 border-t border-white/5"
          >
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Architectural Narrative</h4>
            <div className="prose prose-invert prose-p:text-text-primary/70 prose-p:leading-relaxed prose-p:text-base max-w-none">
              <p>{project.description || 'A masterpiece of contemporary architecture, defined by precision, light, and materiality.'}</p>
            </div>
          </motion.div>

          {/* External Listing Connection */}
          {(project.externalLink || project.url) && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-5 bg-white/[0.02] border border-white/10 hover:border-brick-copper/40 transition-all rounded-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-[0.3em] text-brick-copper font-black font-mono">Public Syndicate Link</span>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-white">Full Property Listing</h4>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full text-[8px] tracking-widest text-text-primary/60 uppercase font-mono">
                  Verified Data
                </div>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                Access the verified MLS data sheet, tax assessments, and official listing details for this property.
              </p>
              <a 
                href={project.externalLink || project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackMediaInteraction({
                    property_id: project.id,
                    media_type: project.externalLink ? 'agent_listing' : 'matterport_tour',
                    action: 'view'
                  });
                }}
                className="inline-flex w-full items-center justify-between py-3 px-4 bg-white/5 hover:bg-brick-copper hover:text-charcoal border border-white/10 text-[9px] uppercase tracking-[0.2em] font-bold text-white transition-all group"
              >
                <span>Browse Full Listing Details</span>
                <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>
          )}

          {/* Partner Exclusive Content */}
          {(project.partnerUids?.includes(auth.currentUser?.uid) || project.teamId === (window as any).currentUserProfile?.teamId) && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="pt-8 border-t border-brick-copper/20 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-brick-copper">Partner Fulfillment Assets</h4>
                <div className="flex items-center gap-2 px-2 py-1 bg-brick-copper/10 border border-brick-copper/20 rounded-full">
                   <Shield size={8} className="text-brick-copper" />
                   <span className="text-[7px] uppercase tracking-widest text-brick-copper font-bold">Confidential Access</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {project.fotelloUrl && (
                  <a 
                    href={project.fotelloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 hover:border-brick-copper transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Download size={14} className="text-brick-copper" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Fotello Content Package</span>
                    </div>
                    <ExternalLink size={12} className="opacity-20 group-hover:opacity-100" />
                  </a>
                )}
                {project.matterportUrl && (
                  <a 
                    href={project.matterportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 hover:border-brick-copper transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Camera size={14} className="text-brick-copper" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Unbranded Matterport Tour</span>
                    </div>
                    <ExternalLink size={12} className="opacity-20 group-hover:opacity-100" />
                  </a>
                )}
                {project.specsUrl && (
                  <button 
                    onClick={() => setSelectedPdf({ url: project.specsUrl, title: `${project.title} - Technical Sheet` })}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 hover:border-brick-copper transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={14} className="text-brick-copper" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Quick Specs Technical Sheet</span>
                    </div>
                    <ExternalLink size={12} className="opacity-20 group-hover:opacity-100" />
                  </button>
                )}
              </div>
              
              <div className="p-4 bg-brick-copper/5 border border-brick-copper/10 rounded-sm">
                <p className="text-[9px] text-white/40 leading-relaxed italic">
                  Disclaimer: These assets are provided under our non-exclusive license. Commercial use is restricted to active listing engagement for the specified subject property.
                </p>
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-8 border-t border-white/5 space-y-4"
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
             {(project.externalLink || project.url) && (
                <a 
                  href={project.externalLink || project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackMediaInteraction({
                      property_id: project.id,
                      media_type: project.externalLink ? 'agent_listing' : 'matterport_tour',
                      action: 'view'
                    });
                  }}
                  className="w-full py-5 border border-white/10 text-white uppercase tracking-[0.2em] font-bold text-[10px] hover:bg-white hover:text-charcoal transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {project.externalLink ? 'Agency Listing Details' : 'View Full Listing'} <ExternalLink size={12} />
                </a>
             )}
             <p className="mt-4 text-[9px] text-white/20 text-center uppercase tracking-widest">Confidential technical dossiers available upon request.</p>
          </motion.div>
        </div>

        {/* Column 3: Immersive Image Gallery */}
        <div className="order-1 lg:order-3 w-full lg:w-[43%] bg-charcoal relative lg:h-[calc(100vh-69px)] overflow-hidden">
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
                loading="eager"
                decoding="async"
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
                 onClick={() => {
                   setActiveImage(img);
                   trackMediaInteraction({
                     property_id: project.id,
                     media_type: 'flambient_gallery',
                     action: 'play'
                   });
                 }}
                 className={`relative flex-shrink-0 w-24 h-24 border-2 transition-all overflow-hidden ${activeImage === img ? 'border-brick-copper scale-105 shadow-xl' : 'border-transparent opacity-40 hover:opacity-100'}`}
               >
                 <img src={img} className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
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

      {/* PDF MODAL REVEAL */}
      <AnimatePresence>
        {selectedPdf && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-4 md:p-12 lg:p-24"
          >
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
               <div className="space-y-1">
                 <h2 className="font-display text-4xl italic text-white">{selectedPdf.title}</h2>
                 <p className="text-[10px] uppercase tracking-[0.3em] text-brick-copper font-black">Strategic Partner Document</p>
               </div>
               <button 
                 onClick={() => setSelectedPdf(null)}
                 className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brick-copper hover:text-charcoal transition-all"
               >
                 <Shield size={20} className="rotate-45" />
               </button>
            </div>
            <div className="flex-1 overflow-hidden">
               <PDFViewer fileUrl={selectedPdf.url} title={selectedPdf.title} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
