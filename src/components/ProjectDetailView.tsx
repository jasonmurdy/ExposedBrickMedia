/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSiteContent } from '../lib/SiteContentContext';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, Home, Bed, Bath, Square, Info, 
  ExternalLink, ChevronRight, Camera, Shield, Download, FileText,
  Mail, Phone, Instagram, X, Send, Globe, CloudSun, CloudMoon,
  Facebook, Linkedin, Twitter, Youtube, Video
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackMediaInteraction } from '../lib/analytics';
import { toast, Toaster } from 'react-hot-toast';


import { PDFViewer } from './PDFViewer';


// Robust social handle to URL formatter
const formatSocialUrl = (value: string, platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'youtube' | 'globe') => {
  if (!value) return '';
  const val = value.trim();
  if (val.startsWith('http://') || val.startsWith('https://')) {
    return val;
  }
  const handle = val.startsWith('@') ? val.substring(1) : val;
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'linkedin':
      if (handle.startsWith('in/') || handle.startsWith('company/')) {
        return `https://linkedin.com/${handle}`;
      }
      return `https://linkedin.com/in/${handle}`;
    case 'twitter':
      return `https://twitter.com/${handle}`;
    case 'youtube':
      return `https://youtube.com/@${handle}`;
    case 'globe':
      return `https://${handle}`;
    default:
      return val;
  }
};


// Robust external URL formatter to prevent relative link resolution errors
const formatExternalUrl = (url: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};


export const ProjectDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { portfolioItems, partners, settings, loading, user, isAdmin, isLight, setIsLight } = useSiteContent();
  const project = portfolioItems?.find(p => p.id === id || p.mlsNumber === id);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVirtualTour, setSelectedVirtualTour] = useState<string | null>(null);
  const [selectedPartnerProfile, setSelectedPartnerProfile] = useState<any | null>(null);

  // Helper to transform any YouTube or Vimeo link into its correct embeddable version
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const val = url.trim();

    try {
      // 1. YouTube Shorts Matcher
      if (val.includes('/shorts/')) {
        const parts = val.split('/shorts/');
        if (parts[1]) {
          const id = parts[1].split(/[?#&]/)[0];
          return `https://www.youtube.com/embed/${id}?autoplay=1`;
        }
      }

      // 2. Standard YouTube Matcher
      const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const youtubeMatch = val.match(youtubeRegExp);
      if (youtubeMatch && youtubeMatch[2].length === 11) {
        return `https://www.youtube.com/embed/${youtubeMatch[2]}?autoplay=1`;
      }

      // 3. Vimeo Matcher with optional private hash (Format: vimeo.com/123456789/abcdef)
      const privateVimeoMatch = val.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
      if (privateVimeoMatch) {
        return `https://player.vimeo.com/video/${privateVimeoMatch[1]}?h=${privateVimeoMatch[2]}&autoplay=1`;
      }

      // Standard Vimeo matcher (just ID)
      const vimeoRegExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
      const vimeoMatch = val.match(vimeoRegExp);
      if (vimeoMatch) {
        const urlObj = new URL(val.startsWith('http') ? val : `https://${val}`);
        const hashParam = urlObj.searchParams.get('h');
        if (hashParam) {
          return `https://player.vimeo.com/video/${vimeoMatch[1]}?h=${hashParam}&autoplay=1`;
        }
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
      }

      // 4. Already an embed URL check
      if (val.includes('youtube.com/embed/') || val.includes('player.vimeo.com/video/')) {
        return val;
      }
    } catch (e) {
      console.error("Error parsing video URL:", e);
    }

    return null;
  };

  // Inquiry state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryTargetPartner, setInquiryTargetPartner] = useState<any | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const handleCloseInquiryModal = () => {
    setShowInquiryModal(false);
    setInquiryTargetPartner(null);
  };


  useEffect(() => {
    if (project) {
      setActiveImage(project.img);
      const welcomeName = inquiryTargetPartner?.displayName ? ` ${inquiryTargetPartner.displayName}` : "";
      setInquiryForm(prev => ({
        ...prev,
        message: `Hello${welcomeName}, I'm interested in receiving technical documentation, active listing brochures, and HDR media files regarding this property listing: ${project.title || 'Subject Property'} (ID: ${project.mlsNumber || project.id}).`
      }));
      trackMediaInteraction({
        property_id: project.id,
        media_type: 'flambient_gallery',
        action: 'view'
      });
      window.scrollTo(0, 0);

      // Reset scroll of all custom custom-scrollbar containers on transition
      const scrollables = document.querySelectorAll('.custom-scrollbar');
      scrollables.forEach(el => {
        el.scrollTop = 0;
      });

      // Preload all listing images into browser cache for instant high-speed switching
      const allImgs = [project.img, ...(project.gallery || [])].filter(Boolean);
      allImgs.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [project, inquiryTargetPartner]);


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


  const allImages = [project.img, ...(project.gallery || [])].filter(Boolean);


  const associatedPartners = partners?.filter(p => 
    p.id === project.partnerUid || 
    project.partnerUids?.includes(p.id)
  ) || [];


  const isLinkedPartner = isAdmin || !!(
    user && (
      associatedPartners.some(p => p.id === user.uid || p.email === user.email) ||
      project.partnerUid === user.uid ||
      project.partnerUids?.includes(user.uid)
    )
  );

  const currentPartnerIds = associatedPartners.map(p => p.id);
  const partnerListings = portfolioItems?.filter(p => 
    p.id !== project.id && (
      (p.partnerUid && currentPartnerIds.includes(p.partnerUid)) ||
      (p.partnerUids && p.partnerUids.some(uid => currentPartnerIds.includes(uid)))
    )
  ) || [];

  const alternativeListings = (portfolioItems?.filter(p => 
    p.id !== project.id && !partnerListings.some(pl => pl.id === p.id)
  ) || []).slice(0, 4);

  const displayListings = partnerListings.length > 0 ? partnerListings : alternativeListings;
  const isFallback = partnerListings.length === 0;


  const handleNextImage = () => {
    const currentIndex = allImages.indexOf(activeImage || '');
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % allImages.length;
      setActiveImage(allImages[nextIndex]);
    }
  };


  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email) {
      toast.error("Please supply both your name and email address.");
      return;
    }
    setSubmittingInquiry(true);
    const toastId = toast.loading("Conveying documentation request securely...");
    try {
      const crmResponse = await fetch("/api/crm/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyAddress: project.title || "Subject Property",
          realtorName: inquiryForm.name,
          email: inquiryForm.email,
          serviceType: "Documentation & Listing Resource Request",
          skipAdminNotification: (inquiryTargetPartner || associatedPartners[0]) ? true : false
        })
      });


      await crmResponse.json();
      const targetEmail = inquiryTargetPartner?.email || associatedPartners[0]?.email || 'jasonmurdy@gmail.com';
      const recipientName = inquiryTargetPartner?.displayName || associatedPartners[0]?.displayName || 'Representative';
      
      const emailBody = `
        <h3>New Strategic Documentation Request</h3>
        <p>An inquiry has been captured specifically for your architectural listing and routed to <strong>${recipientName}</strong>:</p>
        <p><strong>Property:</strong> ${project.title} (${project.mlsNumber || project.id})</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #555; width: 30%;">Inquirer Name:</td>
            <td style="padding: 6px 0;">${inquiryForm.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #555;">Inquirer Email:</td>
            <td style="padding: 6px 0;"><a href="mailto:${inquiryForm.email}">${inquiryForm.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #555;">Inquirer Phone:</td>
            <td style="padding: 6px 0;">${inquiryForm.phone || 'Not provided'}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Proposed Message:</strong></p>
        <blockquote style="background: #fdfdfd; border-left: 3px solid #c43b2a; margin: 15px 0; padding: 12px; font-style: italic; color: #333;">
          "${inquiryForm.message}"
        </blockquote>
      `;


      const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: targetEmail,
          subject: `[Direct Advisor Inquiry] ${project.title} - ${inquiryForm.name}`,
          body: emailBody,
          type: "listing_inquiry"
        })
      });


      const emailResult = await emailResponse.json();
      if (emailResult && emailResult.success === false) {
        throw new Error(emailResult.error || "Email delivery rejected by the transport gateway.");
      }


      toast.success(`Inquiry dispatched directly to ${recipientName}! The brochure and links will be sent shortly.`, { id: toastId });
      handleCloseInquiryModal();
      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        message: `Hello, I'm interested in receiving technical documentation, active listing brochures, and HDR media files regarding this property listing: ${project.title || 'Subject Property'} (ID: ${project.mlsNumber || project.id}).`
      });
    } catch (err: any) {
      console.error("[Inquiry send failed]:", err);
      toast.error(`Ingestion failed: ${err.message || 'System fault'}`, { id: toastId });
    } finally {
      setSubmittingInquiry(false);
    }
  };


  return (
    <div className="flex flex-col w-full h-screen bg-bg-primary text-text-primary selection:bg-brick-copper selection:text-charcoal overflow-hidden">
      <Helmet>
        <title>{`${project.title} | ${project.category} | Exposed Brick Media`}</title>
        <meta name="description" content={`Explore ${project.title}, a ${project.propertyType || project.category} showcase. ${project.description?.substring(0, 120)}`} />
        <meta property="og:title" content={`${project.title} | Architectural Showcase`} />
        <meta property="og:image" content={project.img} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>


      {/* Top Integrated Breadcrumb Navigation Header Frame */}
      <header className="w-full h-[80px] border-b border-white/5 px-8 flex items-center justify-between text-xs tracking-widest text-neutral-400 uppercase bg-bg-primary shrink-0 z-50">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-white font-medium tracking-normal normal-case text-lg font-serif italic">
            The Exposed <span className="text-brick-copper not-italic">Brick</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-text-primary/65">
            <Link to="/" className="hover:text-brick-copper transition-colors flex items-center gap-1 group font-bold">
              <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform text-brick-copper" /> BACK
            </Link>
            <span>/</span>
            <span className="text-brick-copper font-bold">{project.category}</span>
            <span>/</span>
            <span className="truncate max-w-[180px] normal-case text-text-primary/50">{project.title}</span>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-[11px] font-bold">
          <Link to="/portal" className="hover:text-brick-copper transition-colors">SIGN IN</Link>
          <button 
            onClick={() => setIsLight(!isLight)}
            className="text-text-primary/80 hover:text-brick-copper transition-all"
            aria-label="Toggle Theme"
          >
            {isLight ? <CloudMoon size={16} /> : <CloudSun size={16} />}
          </button>
          <Link to="/about" className="hover:text-brick-copper transition-colors">ABOUT</Link>
          <button onClick={() => setShowInquiryModal(true)} className="hover:text-brick-copper transition-colors">BOOK NOW</button>
          <Link to="/prep" className="hover:text-brick-copper transition-colors hidden sm:inline">HOME PREP GUIDE</Link>
        </nav>
      </header>


      {/* Asymmetric Master Core Grid Environment Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-0 overflow-y-auto lg:overflow-hidden select-none pb-[60px] lg:pb-0">
        
        {/* COLUMN 1: Fixed Side Panel for Team / Advisors / Partners Row */}
        <aside className="order-3 lg:order-1 w-full lg:w-[22%] bg-black/10 border-b lg:border-b-0 lg:border-r border-white/5 p-8 flex flex-col gap-10 items-center justify-start overflow-y-auto custom-scrollbar lg:h-full shrink-0">
          <div className="w-full text-center lg:text-left">
            <span className="text-[8px] uppercase tracking-[0.3em] text-brick-copper font-black font-mono block mb-1">Architectural Contact</span>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white">Listing Advisory</h4>
          </div>


          {associatedPartners.length > 0 ? (
            <div className="w-full space-y-6">
              {associatedPartners.map((partner) => (
                <div 
                  key={partner.id} 
                  onClick={() => setSelectedPartnerProfile(partner)}
                  className="w-full flex flex-col items-center text-center group cursor-pointer hover:bg-white/[0.02] p-4 border border-transparent hover:border-white/5 transition-all duration-300 rounded"
                  title="Click to view complete advisor profile & contact card"
                >
                  <div className="relative w-36 h-36 rounded-full p-1 border border-brick-copper/60 mb-4 bg-charcoal/40 overflow-hidden transition-transform duration-300 group-hover:scale-[1.03] group-hover:border-white">
                    {partner.headshotUrl ? (
                      <img
                        src={partner.headshotUrl}
                        alt={partner.displayName}
                        className="w-full h-full rounded-full object-cover filter grayscale contrast-125 transition-all duration-500 group-hover:grayscale-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center">
                        <span className="text-xl font-bold text-white/40">{partner.displayName?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] tracking-widest text-brick-copper font-semibold uppercase mb-1">
                    {partner.role === 'preferred' ? 'PREFERRED ADVISOR' : 'ADVISORY PARTNER'}
                  </span>
                  <h3 className="text-sm font-medium tracking-wider text-neutral-200 uppercase mb-0.5 group-hover:text-brick-copper transition-colors">
                    {partner.displayName}
                  </h3>
                  <span className="text-[8px] uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors font-mono mb-2">
                    Click to view profile
                  </span>
                  {(() => {
                    const totalCommissions = portfolioItems?.filter(p => p.partnerUid === partner.id || p.partnerUids?.includes(partner.id))?.length || 0;
                    if (totalCommissions > 0) {
                      return (
                        <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-neutral-500 font-bold mb-4 block">
                          ● {totalCommissions} {totalCommissions === 1 ? 'COMMISSION' : 'COMMISSIONS'}
                        </span>
                      );
                    }
                    return <div className="h-4" />;
                  })()}
                  <div className="flex flex-col gap-2 w-full max-w-[180px]">
                    <div className="flex gap-2">
                      {partner.phone && (
                        <a
                          href={`tel:${partner.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full border border-white/10 text-[10px] tracking-wider text-neutral-400 hover:text-white hover:border-white/30 transition-all uppercase"
                        >
                          <Phone size={11} className="text-brick-copper" /> Call
                        </a>
                      )}
                      {partner.email && (
                        <a
                          href={`mailto:${partner.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full border border-white/10 text-[10px] tracking-wider text-neutral-400 hover:text-white hover:border-white/30 transition-all uppercase"
                        >
                          <Mail size={11} className="text-brick-copper" /> Mail
                        </a>
                      )}
                    </div>
                    {(partner.email || partner.phone) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInquiryTargetPartner(partner);
                          setShowInquiryModal(true);
                        }}
                        className="w-full py-2 bg-brick-copper/10 hover:bg-brick-copper hover:text-charcoal border border-brick-copper/20 hover:border-transparent text-[9px] font-mono font-bold uppercase tracking-widest text-brick-copper transition-all duration-300 rounded-full text-center"
                      >
                        Inquire Directly
                      </button>
                    )}
                  </div>

                  {/* Symmetrical & Sizable Partner Social Nodes with Custom Tooltips */}
                  {(partner.instagram || partner.facebook || partner.linkedin || partner.twitter || partner.youtube) && (
                    <div className="flex items-center justify-center flex-wrap gap-2 pt-4 mt-2 border-t border-white/5 w-full max-w-[180px]">
                      {partner.instagram && (
                        <a
                          href={formatSocialUrl(partner.instagram, 'instagram')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300 group"
                          aria-label="Instagram Profile"
                          title="Contact via Instagram"
                        >
                          <Instagram size={13} className="transition-transform group-hover:scale-110" />
                        </a>
                      )}
                      {partner.facebook && (
                        <a
                          href={formatSocialUrl(partner.facebook, 'facebook')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300 group"
                          aria-label="Facebook Profile"
                          title="Contact via Facebook"
                        >
                          <Facebook size={13} className="transition-transform group-hover:scale-110" />
                        </a>
                      )}
                      {partner.linkedin && (
                        <a
                          href={formatSocialUrl(partner.linkedin, 'linkedin')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300 group"
                          aria-label="LinkedIn Profile"
                          title="Contact via LinkedIn"
                        >
                          <Linkedin size={13} className="transition-transform group-hover:scale-110" />
                        </a>
                      )}
                      {partner.twitter && (
                        <a
                          href={formatSocialUrl(partner.twitter, 'twitter')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300 group"
                          aria-label="Twitter Profile"
                          title="Contact via Twitter/X"
                        >
                          <Twitter size={13} className="transition-transform group-hover:scale-110" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center text-center group">
              <div className="relative w-36 h-36 rounded-full p-1 border border-brick-copper/40 mb-4 bg-charcoal/40 flex items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono">Exposed Brick</span>
              </div>
              <span className="text-[9px] tracking-widest text-brick-copper font-semibold uppercase mb-1">AGENCY CONTACT</span>
              <h3 className="text-sm font-medium tracking-wider text-neutral-200 uppercase mb-4">Exposed Brick Advisory</h3>
              <div className="flex gap-2 w-full max-w-[180px]">
                <a
                  href={`tel:${settings?.contactInfo?.phone || '+1 (555) 000-0000'}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full border border-white/10 text-[10px] tracking-wider text-neutral-400 hover:text-white hover:border-white/30 transition-all uppercase"
                >
                  <Phone size={11} className="text-brick-copper" /> Call
                </a>
                <a
                  href={`mailto:${settings?.contactInfo?.email || 'office@exposedbrick.com'}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full border border-white/10 text-[10px] tracking-wider text-neutral-400 hover:text-white hover:border-white/30 transition-all uppercase"
                >
                  <Mail size={11} className="text-brick-copper" /> Mail
                </a>
              </div>

              {/* Polished Default Agency Social Row to showcase complete network */}
              <div className="flex items-center justify-center gap-2.5 pt-4 mt-4 border-t border-white/5 w-full max-w-[180px]">
                <a
                  href="https://www.instagram.com/exposedbrickmedia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300 group"
                  title="Agency Instagram"
                >
                  <Instagram size={13} className="transition-transform group-hover:scale-110" />
                </a>
                <a
                  href="https://www.facebook.com/exposedbrickmedia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300 group"
                  title="Agency Facebook"
                >
                  <Facebook size={13} className="transition-transform group-hover:scale-110" />
                </a>
                <a
                  href="https://youtube.com/@exposedbrickmedia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300 group"
                  title="Agency YouTube Cinema Channel"
                >
                  <Youtube size={13} className="transition-transform group-hover:scale-110" />
                </a>
                <a
                  href="https://exposedbrickmedia.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper flex items-center justify-center transition-all duration-300 group"
                  title="Agency Feature Website"
                >
                  <Globe size={13} className="transition-transform group-hover:scale-110" />
                </a>
              </div>
            </div>
          )}
        </aside>


        {/* COLUMN 2: Fluid Narrative & Specification Center Workspace */}
        <main className="order-2 lg:order-2 flex-1 bg-bg-primary p-8 lg:p-14 flex flex-col justify-between gap-12 overflow-y-auto custom-scrollbar lg:h-full border-b lg:border-b-0 lg:border-r border-white/5">
          <div className="flex flex-col gap-8 max-w-2xl w-full">
            <div>
              <span className="text-xs font-bold tracking-widest text-brick-copper uppercase block mb-3">
                {project.category}
              </span>
              <h1 className="text-4xl lg:text-5xl font-serif text-neutral-100 tracking-tight leading-tight">
                {project.title?.split(',')[0]}
                {project.title?.includes(',') && (
                  <span className="italic block lg:inline text-neutral-400 font-sans font-light text-2xl lg:text-4xl ml-0 lg:ml-3">
                    , {project.title.substring(project.title.indexOf(',') + 1)}
                  </span>
                )}
              </h1>
              {project.listPrice && (
                <div className="mt-2 text-xl font-display italic text-brick-copper/90 font-medium">
                  {project.listPrice}
                </div>
              )}
            </div>


            <div className="mt-2">
              <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block mb-1 font-mono">
                ARCHITECTURAL NARRATIVE
              </span>
              <h2 className="text-2xl font-serif text-neutral-200 mb-3 font-medium">
                A study in light and space.
              </h2>
              <div className="text-sm text-neutral-400 leading-relaxed font-light prose prose-invert">
                <p>{project.description || 'A masterpiece of contemporary architecture, defined by precision, light, and materiality.'}</p>
              </div>
            </div>


            {/* Quick Specs Symmetrical Grid Layout */}
            <div className="py-6 border-b border-t border-white/5 my-4 w-full space-y-4">
              {/* Top Row: 3 Symmetrical Columns */}
              <div className="grid grid-cols-3 gap-3">
                <div id="spec-property-type" className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col items-center text-center justify-center gap-3 group hover:border-brick-copper/20 transition-all duration-300">
                  <Home size={28} className="text-brick-copper transition-transform group-hover:scale-110 duration-300" />
                  <div className="space-y-1 w-full min-w-0">
                    <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold font-mono block">Property Type</span>
                    <p className="text-xs sm:text-sm font-semibold tracking-wide text-neutral-200 uppercase truncate">
                      {project.propertyType || "Residential"}
                    </p>
                  </div>
                </div>

                <div id="spec-bedrooms" className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col items-center text-center justify-center gap-3 group hover:border-brick-copper/20 transition-all duration-300">
                  <Bed size={28} className="text-brick-copper transition-transform group-hover:scale-110 duration-300" />
                  <div className="space-y-0.5 w-full min-w-0">
                    <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold font-mono block">Bedrooms</span>
                    <p className="text-base sm:text-xl font-bold text-white font-serif italic">
                      {project.beds || "—"}
                    </p>
                  </div>
                </div>

                <div id="spec-bathrooms" className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col items-center text-center justify-center gap-3 group hover:border-brick-copper/20 transition-all duration-300">
                  <Bath size={28} className="text-brick-copper transition-transform group-hover:scale-110 duration-300" />
                  <div className="space-y-0.5 w-full min-w-0">
                    <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold font-mono block">Bathrooms</span>
                    <p className="text-base sm:text-xl font-bold text-white font-serif italic">
                      {project.baths || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Row: 2 Symmetrical Columns */}
              <div className="grid grid-cols-2 gap-3">
                <div id="spec-sqft" className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col items-center text-center justify-center gap-3 group hover:border-brick-copper/20 transition-all duration-300">
                  <Square size={26} className="text-brick-copper transition-transform group-hover:scale-110 duration-300" />
                  <div className="space-y-0.5 w-full min-w-0">
                    <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold font-mono block">Square Footage</span>
                    <p className="text-xs sm:text-sm font-bold text-neutral-200 font-mono tracking-wide">
                      {project.sqft ? `${project.sqft} SQ FT` : "—"}
                    </p>
                  </div>
                </div>

                <div id="spec-mls" className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col items-center text-center justify-center gap-3 group hover:border-brick-copper/20 transition-all duration-300">
                  <Info size={26} className="text-brick-copper transition-transform group-hover:scale-110 duration-300" />
                  <div className="space-y-0.5 w-full min-w-0">
                    <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold font-mono block">MLS Listing ID</span>
                    <p className="text-[10px] sm:text-xs font-semibold text-neutral-400 font-mono tracking-wider truncate">
                      {project.mlsNumber || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Public Showcase Sites & Documents / Private Request Fallback */}
          {(() => {
            const hasPublicLinks = !!(project.fotelloUrl || project.matterportUrl || project.specsUrl || project.externalLink || project.url || project.videoUrl);
            if (hasPublicLinks) {
              return (
                <div id="public-showcase-card" className="w-full max-w-xl bg-white/[0.01] border border-white/10 rounded-md p-6 relative overflow-hidden mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] tracking-widest text-brick-copper font-bold font-mono">
                      PUBLIC SHOWCASE SITES
                    </span>
                    <span className="text-[8px] tracking-widest bg-white/5 text-neutral-400 px-2 py-0.5 rounded uppercase font-semibold font-mono font-bold">
                      PUBLIC ACCESS
                    </span>
                  </div>
                  <h4 className="text-base font-semibold tracking-wider text-neutral-200">
                    INTERACTIVE LISTING MEDIA & DETAILS
                  </h4>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed">
                    Explore the publicly available interactive property websites, virtual tours, spec sheets, and syndicate listing details.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    {project.videoUrl && (
                      <button 
                        id="link-video-showcase"
                        onClick={() => setSelectedVideo(project.videoUrl)}
                        className="flex items-center justify-between py-2.5 px-4 bg-red-600/10 hover:bg-red-600 hover:text-white border border-red-600/20 rounded text-[10px] uppercase tracking-wider font-bold text-white transition-all group cursor-pointer text-left w-full"
                      >
                        <div className="flex items-center gap-2">
                          {project.videoUrl.toLowerCase().includes('vimeo') ? (
                            <Video size={13} className="text-red-500 group-hover:text-inherit" />
                          ) : (
                            <Youtube size={13} className="text-red-500 group-hover:text-inherit" />
                          )}
                          <span>{project.videoUrl.toLowerCase().includes('vimeo') ? 'Watch Vimeo Virtual Tour' : 'Watch Cinematic Video Showcase'}</span>
                        </div>
                        <Video size={12} className="opacity-60 group-hover:opacity-100" />
                      </button>
                    )}

                    {project.fotelloUrl && (
                      <a 
                        id="link-fotello"
                        href={formatExternalUrl(project.fotelloUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between py-2.5 px-4 bg-brick-copper/10 hover:bg-brick-copper hover:text-charcoal border border-brick-copper/20 rounded text-[10px] uppercase tracking-wider font-bold text-white transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Globe size={13} className="text-brick-copper group-hover:text-inherit" />
                          <span>Browse Fotello Feature Website</span>
                        </div>
                        <ExternalLink size={12} />
                      </a>
                    )}

                    {project.matterportUrl && (
                      <button 
                        id="link-matterport"
                        onClick={() => setSelectedVirtualTour(project.matterportUrl)}
                        className="flex items-center justify-between py-2.5 px-4 bg-white/5 hover:bg-white hover:text-charcoal border border-white/10 rounded text-[10px] uppercase tracking-wider font-bold text-white transition-all group cursor-pointer w-full text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Camera size={13} className="text-brick-copper" />
                          <span>Unbranded 3D Virtual Tour (Matterport)</span>
                        </div>
                        <Camera size={12} className="opacity-40 group-hover:opacity-100" />
                      </button>
                    )}

                    {project.specsUrl && (
                      <button 
                        id="btn-specs"
                        onClick={() => setSelectedPdf({ url: formatExternalUrl(project.specsUrl), title: `${project.title} - Technical Sheet` })}
                        className="flex items-center justify-between py-2.5 px-4 bg-white/5 hover:bg-white hover:text-charcoal border border-white/10 rounded text-[10px] uppercase tracking-wider font-bold text-white transition-all group w-full text-left"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={13} className="text-brick-copper" />
                          <span>Quick Specs Technical Sheet</span>
                        </div>
                        <ExternalLink size={12} className="opacity-40 group-hover:opacity-100" />
                      </button>
                    )}

                    {(project.externalLink || project.url) && (
                      <a 
                        id="link-agency"
                        href={formatExternalUrl(project.externalLink || project.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between py-2.5 px-4 bg-white/5 hover:bg-white hover:text-charcoal border border-white/10 rounded text-[10px] uppercase tracking-wider font-bold text-white transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <ExternalLink size={13} className="text-brick-copper" />
                          <span>Agency Listing Details</span>
                        </div>
                        <ChevronRight size={13} className="opacity-40 group-hover:opacity-100" />
                      </a>
                    )}

                    <button 
                      id="btn-inquire"
                      onClick={() => setShowInquiryModal(true)}
                      className="w-full mt-2 py-3 bg-white hover:bg-brick-copper hover:text-charcoal text-neutral-950 font-bold transition-all duration-300 text-[10px] tracking-widest uppercase font-mono rounded"
                    >
                      Inquire & Request Full Dossier
                    </button>
                  </div>
                </div>
              );
            } else {
              return (
                <div id="public-showcase-card" className="w-full max-w-xl bg-white/[0.01] border border-white/10 rounded-md p-6 relative overflow-hidden mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] tracking-widest text-brick-copper font-bold font-mono">
                      PRIVATE REQUEST
                    </span>
                    <span className="text-[8px] tracking-widest bg-white/5 text-neutral-400 px-2 py-0.5 rounded uppercase font-semibold font-mono font-bold">
                      SECURE PIPELINE
                    </span>
                  </div>
                  <h4 className="text-base font-semibold tracking-wider text-neutral-200">
                    ACQUISITION & INQUIRY DOSSIER
                  </h4>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed">
                    Floor plans, off-market specifications, and complete high-definition archives of this listing are available upon request through our secure agent advisory pipeline.
                  </p>
                  <button 
                    id="btn-inquire"
                    onClick={() => setShowInquiryModal(true)}
                    className="w-full mt-2 py-3 bg-white hover:bg-brick-copper hover:text-charcoal text-neutral-950 font-bold transition-all duration-300 text-[10px] tracking-widest uppercase font-mono rounded"
                  >
                    Inquire & Request Full Dossier
                  </button>
                </div>
              );
            }
          })()}


          {/* Secure Partner Assets Integration Sub-frame: Visible only to validated partners/admins */}
          {isLinkedPartner && (
            <div id="secure-partner-frame" className="w-full max-w-xl pt-8 border-t border-white/5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-brick-copper font-mono">Confidential Deliverables</h4>
                <div className="flex items-center gap-2 px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  <Shield size={9} />
                  <span className="text-[8px] uppercase tracking-widest font-bold font-mono">
                    Partner Unlocked
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {project.driveDeliveryLink ? (
                  <a 
                    id="link-drive-download"
                    href={formatExternalUrl(project.driveDeliveryLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-400 transition-all rounded text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Download size={14} className="text-emerald-400" />
                      <span className="font-bold tracking-wider uppercase text-[10px]">RAW Media Package Folder (Google Drive)</span>
                    </div>
                    <ExternalLink size={12} className="text-emerald-400" />
                  </a>
                ) : (
                  <div className="p-4 bg-neutral-900 border border-white/5 rounded italic text-neutral-500 text-[10px] font-mono">
                    Google Drive Media Asset Package is currently being synchronized by the automated pipeline...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Columns Commissions Portfolio Showcase Grid */}
          {displayListings.length > 0 && (
            <div className="w-full max-w-xl pt-8 border-t border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-[0.3em] text-brick-copper font-black font-mono block">
                    {isFallback ? 'CURATED COLLECTION' : 'PARTNER PORTFOLIO'}
                  </span>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-200">
                    {isFallback ? 'More Curated Showcases' : `More Commissions by ${associatedPartners.map(p => p.displayName).filter(Boolean).join(' or ') || 'Advisor'}`}
                  </h4>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono font-bold">
                  ({displayListings.length})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayListings.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/listing/${item.id}`}
                    className="flex flex-col group bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-brick-copper/30 transition-all rounded p-3 gap-3 text-left"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-charcoal rounded relative">
                      <img 
                        src={item.img} 
                        alt={item.title} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-[1.03]"
                        referrerPolicy="no-referrer"
                      />
                      {item.listPrice && (
                        <div className="absolute bottom-2 left-2 bg-black/85 backdrop-blur-sm px-2 py-0.5 text-[9px] font-mono font-medium text-brick-copper rounded-xs uppercase">
                          {item.listPrice}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[7.5px] uppercase tracking-widest text-brick-copper/80 font-mono font-bold block">
                        {item.category}
                      </span>
                      <h5 className="text-[10px] uppercase tracking-wider font-bold text-white group-hover:text-brick-copper transition-colors truncate">
                        {item.title?.split(',')[0]}
                      </h5>
                      {item.title?.includes(',') && (
                        <p className="text-[8.5px] text-neutral-400 font-light truncate">
                          {item.title.substring(item.title.indexOf(',') + 1).trim()}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>


        {/* COLUMN 3: Expansive Visual Media Viewport Engine and Anchored Thumbnail Carousel Strip */}
        <section className="order-1 lg:order-3 w-full lg:w-[43%] min-h-[400px] lg:min-h-0 bg-[#141414] relative flex flex-col justify-between overflow-hidden lg:h-full">
          {/* Mobile Sticky Details Bar: Sticky above the photos on mobile viewports */}
          <div className="lg:hidden sticky top-0 z-30 w-full bg-neutral-950/95 backdrop-blur-md border-b border-white/5 px-4 py-3.5 flex flex-col gap-2 shrink-0">
            <div className="flex items-start justify-between min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-bold tracking-[0.25em] text-brick-copper uppercase block mb-0.5 font-mono">
                  {project.category}
                </span>
                <h3 className="text-sm font-bold text-neutral-100 truncate pr-2 tracking-tight uppercase">
                  {project.title?.split(',')[0]}
                  {project.title?.includes(',') && (
                    <span className="text-neutral-400 font-light font-sans text-[11px] ml-1 normal-case italic">
                      , {project.title.substring(project.title.indexOf(',') + 1)}
                    </span>
                  )}
                </h3>
              </div>
              {project.listPrice && (
                <div className="text-xs sm:text-sm font-semibold tracking-wider text-brick-copper italic font-medium whitespace-nowrap pt-1">
                  {project.listPrice}
                </div>
              )}
            </div>
            
            {/* Horizontal Specs Bar */}
            <div className="flex items-center justify-between text-[10px] text-neutral-300 font-mono py-1 border-t border-white/5 gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {project.propertyType && (
                  <span className="flex items-center gap-1">
                    <Home size={11} className="text-brick-copper/80" />
                    <span className="uppercase text-[9px] tracking-wide max-w-[80px] truncate">{project.propertyType}</span>
                  </span>
                )}
                {project.beds && (
                  <span className="flex items-center gap-1 border-l border-white/10 pl-3">
                    <Bed size={11} className="text-brick-copper/80" />
                    <span>{project.beds} BD</span>
                  </span>
                )}
                {project.baths && (
                  <span className="flex items-center gap-1 border-l border-white/10 pl-3">
                    <Bath size={11} className="text-brick-copper/80" />
                    <span>{project.baths} BA</span>
                  </span>
                )}
                {project.sqft && (
                  <span className="flex items-center gap-1 border-l border-white/10 pl-3">
                    <Square size={10} className="text-brick-copper/80" />
                    <span className="uppercase text-[9px]">{project.sqft} SQ FT</span>
                  </span>
                )}
              </div>

              {/* Sticky action link button to the full listing website */}
              {(project.fotelloUrl || project.externalLink || project.url) && (
                <a
                  id="mobile-sticky-web-link"
                  href={formatExternalUrl(project.fotelloUrl || project.externalLink || project.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-brick-copper/20 text-brick-copper hover:bg-brick-copper hover:text-charcoal border border-brick-copper/30 px-2 py-1 rounded text-[8px] uppercase tracking-widest font-extrabold transition-all duration-300 whitespace-nowrap shrink-0 animate-pulse"
                >
                  <span>Visit Site</span>
                  <ExternalLink size={8} />
                </a>
              )}
            </div>
          </div>

          {/* Main Visual Node Display background */}
          <div className="absolute inset-0 w-full h-full z-0">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImage}
                src={activeImage || project.img} 
                className="w-full h-full object-cover brightness-[0.9] contrast-[1.03]" 
                alt={project.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30 pointer-events-none" />
          </div>


          {/* Desktop & Mobile Visual Showcase Floating Overlay Menu */}
          {(project.fotelloUrl || project.matterportUrl || project.specsUrl || project.externalLink || project.url || project.videoUrl) && (
            <div className="flex flex-wrap max-w-[65%] md:max-w-none absolute top-4 left-4 lg:top-6 lg:left-6 z-20 items-center gap-1.5 bg-neutral-950/75 backdrop-blur-md p-1.5 border border-white/10 rounded-sm shadow-2xl">
              <span className="hidden sm:inline text-[8px] uppercase tracking-widest text-neutral-400 font-mono font-bold px-1 select-none">Websites:</span>
              {project.videoUrl && (
                <button
                  onClick={() => setSelectedVideo(project.videoUrl)}
                  className="flex items-center gap-1.5 bg-red-650 hover:bg-white hover:text-charcoal text-white px-2.5 py-1.5 text-[8.5px] font-extrabold uppercase tracking-widest transition-all rounded-xs hover:scale-102 cursor-pointer"
                  title="Play Cinematic Video Showcase"
                >
                  {project.videoUrl.toLowerCase().includes('vimeo') ? <Video size={11} /> : <Youtube size={11} />}
                  <span>{project.videoUrl.toLowerCase().includes('vimeo') ? 'Video' : 'Video'}</span>
                </button>
              )}
              {project.fotelloUrl && (
                <a
                  href={formatExternalUrl(project.fotelloUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-brick-copper hover:bg-white text-charcoal px-2.5 py-1.5 text-[8.5px] font-extrabold uppercase tracking-widest transition-all rounded-xs hover:scale-102"
                  title="Browse Fotello Feature Website"
                >
                  <Globe size={11} />
                  <span>Fotello Feature</span>
                </a>
              )}
              {project.matterportUrl && (
                <button
                  onClick={() => setSelectedVirtualTour(project.matterportUrl)}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white hover:text-charcoal text-white px-2.5 py-1.5 text-[8.5px] font-extrabold uppercase tracking-widest transition-all rounded-xs border border-white/10 hover:scale-102 cursor-pointer"
                  title="3D Matterport Virtual Tour"
                >
                  <Camera size={11} />
                  <span>3D Tour</span>
                </button>
              )}
              {project.specsUrl && (
                <button
                  onClick={() => setSelectedPdf({ url: formatExternalUrl(project.specsUrl), title: `${project.title} - Technical Sheet` })}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white hover:text-charcoal text-white px-2.5 py-1.5 text-[8.5px] font-extrabold uppercase tracking-widest transition-all rounded-xs border border-white/10 cursor-pointer hover:scale-102"
                  title="Quick Specs Sheet"
                >
                  <FileText size={11} />
                  <span>Specs</span>
                </button>
              )}
              {(project.externalLink || project.url) && (
                <a
                  href={formatExternalUrl(project.externalLink || project.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white hover:text-charcoal text-white px-2.5 py-1.5 text-[8.5px] font-extrabold uppercase tracking-widest transition-all rounded-xs border border-white/10 hover:scale-102"
                  title="Agency Listing Details"
                >
                  <ExternalLink size={11} />
                  <span>Agency Listing</span>
                </a>
              )}
            </div>
          )}


          {/* Chronology Badge Counter layout display */}
          <div className="absolute top-[85px] right-4 lg:top-6 lg:right-6 z-20">
             <div className="bg-bg-primary/60 backdrop-blur-md p-3 border border-white/5 flex flex-col gap-0.5 items-end rounded-xs">
                <span className="text-[8px] uppercase tracking-widest text-white/40 font-mono">Visual Index</span>
                <span className="text-base font-display text-brick-copper italic font-medium">
                  {allImages.indexOf(activeImage || '') + 1} / {allImages.length}
                </span>
             </div>
          </div>


          {/* Invisible padding anchor node pushing frame boundaries */}
          <div className="flex-1" />


          {/* Horizontal Slider Controls Strip locked onto bottom window perimeter alignment */}
          <div className="w-full p-6 z-10 flex items-center justify-end gap-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 max-w-full">
              {allImages.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative flex-shrink-0 w-16 h-12 border rounded-sm transition-all overflow-hidden ${activeImage === img ? 'border-brick-copper scale-105 shadow-xl ring-1 ring-brick-copper' : 'border-white/20 opacity-40 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleNextImage}
              className="w-10 h-10 rounded-full bg-brick-copper hover:bg-brick-copper/80 transition-colors flex items-center justify-center text-charcoal shadow-xl shrink-0 group"
              type="button"
              aria-label="Next media asset"
            >
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>


      </div>


      {/* STRATEGIC TECHNICAL SHEET PDF VIEWER OVERLAY FRAME */}
      <AnimatePresence>
        {selectedPdf && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-6 md:p-16"
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <div>
                 <h2 className="font-display text-3xl italic text-white">{selectedPdf.title}</h2>
                 <p className="text-[9px] uppercase tracking-[0.25em] text-brick-copper font-mono">Verified Architectural Ledger</p>
               </div>
               <button 
                 onClick={() => setSelectedPdf(null)}
                 className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-brick-copper transition-colors"
               >
                 <X size={18} />
               </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-sm">
               <PDFViewer fileUrl={selectedPdf.url} title={selectedPdf.title} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* STRATEGIC CINEMATIC VIDEO POPUP PLAYER */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-4 md:p-16"
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <div>
                 <h2 className="font-display text-3xl italic text-white font-medium">Cinematic Video Tour</h2>
                 <p className="text-[9px] uppercase tracking-[0.25em] text-brick-copper font-mono">High-Definition Media Stream</p>
               </div>
               <button 
                 onClick={() => setSelectedVideo(null)}
                 className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-brick-copper transition-colors cursor-pointer"
               >
                 <X size={18} />
               </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-sm bg-neutral-950 flex items-center justify-center relative aspect-video shadow-2xl max-w-5xl mx-auto w-full border border-white/10">
               {getEmbedUrl(selectedVideo) ? (
                 <iframe 
                   src={getEmbedUrl(selectedVideo)!} 
                   className="w-full h-full"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                   allowFullScreen
                   title="Cinematic Property Video Tour"
                 />
               ) : (
                 <div className="text-center p-8">
                   <p className="text-white/60 text-sm font-mono mb-4">Direct stream embed not supported for this provider.</p>
                   <a 
                     href={formatExternalUrl(selectedVideo)}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 bg-brick-copper hover:bg-white text-charcoal px-6 py-3 text-xs uppercase tracking-widest font-extrabold transition-all"
                   >
                     <span>Excursions Site</span>
                     <ExternalLink size={12} />
                   </a>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* STRATEGIC INTERACTIVE 3D VIRTUAL TOUR POPUP PLAYER */}
      <AnimatePresence>
        {selectedVirtualTour && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-4 md:p-16"
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <div>
                 <h2 className="font-display text-3xl italic text-white font-medium">3D Virtual Tour</h2>
                 <p className="text-[9px] uppercase tracking-[0.25em] text-brick-copper font-mono">Interactive Property Walkthrough</p>
               </div>
               <button 
                 onClick={() => setSelectedVirtualTour(null)}
                 className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-brick-copper transition-colors cursor-pointer"
               >
                 <X size={18} />
               </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-sm bg-neutral-950 flex items-center justify-center relative shadow-2xl max-w-5xl mx-auto w-full border border-white/10 h-full">
               <iframe 
                 src={formatExternalUrl(selectedVirtualTour)} 
                 className="w-full h-full border-0"
                 allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen" 
                 allowFullScreen
                 title="3D Matterport Virtual Tour Walkthrough"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* DOCUMENTATION ASSISTANCE INTAKE PIPELINE MODAL OVERLAY */}
      <AnimatePresence>
        {showInquiryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              className="bg-charcoal border border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative text-left"
            >
              <button 
                onClick={handleCloseInquiryModal}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                type="button"
              >
                <X size={16} />
              </button>


              <div className="space-y-1 pr-6">
                <span className="text-[8px] uppercase tracking-[0.3em] text-brick-copper font-mono font-black block">Dossier Request Pipeline</span>
                <h3 className="font-display text-2xl text-white italic">Request Technical Documentation</h3>
                <p className="text-[10px] text-white/40 font-mono">{project.title}</p>
              </div>

              {inquiryTargetPartner && (
                <div className="flex items-center gap-2 px-3 py-2 bg-brick-copper/10 border border-brick-copper/20 rounded-xs text-brick-copper mt-3">
                  <Shield size={12} className="shrink-0" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.1em]">
                    Routed to Strategic Advisor: <strong className="font-bold underline">{inquiryTargetPartner.displayName}</strong>
                  </span>
                </div>
              )}


              <form onSubmit={handleSendInquiry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold font-mono block">Your Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={inquiryForm.name}
                      onChange={e => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Jane Doe"
                      className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brick-copper transition-colors rounded-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold font-mono block">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      value={inquiryForm.email}
                      onChange={e => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="jane@brokerage.com"
                      className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brick-copper transition-colors rounded-xs"
                    />
                  </div>
                </div>


                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold font-mono block">Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    value={inquiryForm.phone}
                    onChange={e => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(613) 555-0199"
                    className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brick-copper transition-colors rounded-xs"
                  />
                </div>


                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold font-mono block">Message Request Details *</label>
                  <textarea 
                    required 
                    value={inquiryForm.message}
                    onChange={e => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 p-4 text-xs text-white focus:outline-none focus:border-brick-copper transition-colors rounded-xs resize-none font-light"
                  />
                </div>


                <div className="pt-4 flex justify-end gap-3 text-[9px] uppercase font-bold tracking-wider">
                  <button 
                    type="button" 
                    onClick={handleCloseInquiryModal}
                    className="border border-white/10 text-white px-5 py-3 hover:bg-white hover:text-charcoal transition-all rounded-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingInquiry}
                    className="bg-brick-copper text-charcoal px-5 py-3 hover:bg-white hover:text-charcoal transition-all rounded-xs disabled:opacity-40 flex items-center gap-1.5 font-black"
                  >
                    {submittingInquiry ? 'Transmitting...' : 'Transmit Request'} <Send size={10} />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* PARTNER PROFILE CARD MODAL SYSTEM */}
      <AnimatePresence>
        {selectedPartnerProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedPartnerProfile(null)}
          >
            <motion.div 
              initial={{ scale: 0.96, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 15 }}
              className="bg-charcoal border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative text-left rounded flex flex-col md:flex-row gap-6 md:gap-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedPartnerProfile(null)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                type="button"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              {/* Left Column: Portrait & Key Details */}
              <div className="w-full md:w-[40%] flex flex-col items-center border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6 shrink-0">
                <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full p-1 border border-brick-copper mb-4 bg-black/40 overflow-hidden">
                  {selectedPartnerProfile.headshotUrl ? (
                    <img
                      src={selectedPartnerProfile.headshotUrl}
                      alt={selectedPartnerProfile.displayName}
                      className="w-full h-full rounded-full object-cover filter contrast-[1.1]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white/30">{selectedPartnerProfile.displayName?.charAt(0)}</span>
                    </div>
                  )}
                </div>

                <span className="text-[9px] tracking-[0.2em] text-brick-copper font-bold uppercase mb-1 text-center">
                  {selectedPartnerProfile.role === 'preferred' ? 'Preferred Advisor' : 'Advisory Partner'}
                </span>
                
                <h3 className="text-lg font-serif tracking-wide text-neutral-100 uppercase text-center font-medium leading-tight mb-2">
                  {selectedPartnerProfile.displayName}
                </h3>

                {selectedPartnerProfile.teamName && (
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono font-medium text-center mb-3">
                    {selectedPartnerProfile.teamName}
                  </span>
                )}

                {/* Direct Action Triggers */}
                <div className="w-full space-y-2 mt-4">
                  {selectedPartnerProfile.phone && (
                    <a
                      href={`tel:${selectedPartnerProfile.phone}`}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded border border-white/10 text-[10px] tracking-wider text-neutral-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all uppercase font-medium"
                    >
                      <Phone size={11} className="text-brick-copper" /> {selectedPartnerProfile.phone}
                    </a>
                  )}
                  {selectedPartnerProfile.email && (
                    <a
                      href={`mailto:${selectedPartnerProfile.email}`}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded border border-white/10 text-[10px] tracking-wider text-neutral-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all uppercase font-medium overflow-hidden whitespace-nowrap text-ellipsis"
                    >
                      <Mail size={11} className="text-brick-copper" /> {selectedPartnerProfile.email}
                    </a>
                  )}
                  {(selectedPartnerProfile.email || selectedPartnerProfile.phone) && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentPartner = selectedPartnerProfile;
                        setSelectedPartnerProfile(null);
                        setInquiryTargetPartner(currentPartner);
                        setShowInquiryModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded bg-brick-copper text-charcoal hover:bg-white transition-all text-[10px] tracking-widest font-black uppercase shadow-lg mt-3"
                    >
                      <Mail size={11} /> Inquire Directly
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Bio, Social Media & Linked Portfolio Items */}
              <div className="flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[8px] uppercase tracking-[0.3em] text-brick-copper font-mono font-black block mb-2">Representative Profile</span>
                  <h4 className="font-serif text-xl text-white italic mb-3">Professional Biography</h4>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed whitespace-pre-line">
                    {selectedPartnerProfile.bio || "This registered advisory partner maintains high-definition media databases, client access portfolios, and raw uncompressed photography archives. For technical layouts, scheduling walkthroughs, or custom commissions, contact this active representative directly."}
                  </p>
                </div>

                {/* Symmetrical Social Networks Grid */}
                {(selectedPartnerProfile.instagram || selectedPartnerProfile.facebook || selectedPartnerProfile.linkedin || selectedPartnerProfile.twitter) && (
                  <div className="pt-4 border-t border-white/5">
                    <span className="text-[8px] uppercase tracking-widest text-neutral-500 font-mono font-bold block mb-2.5">Digital Channels</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedPartnerProfile.instagram && (
                        <a
                          href={formatSocialUrl(selectedPartnerProfile.instagram, 'instagram')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper text-[9px] uppercase tracking-wider font-semibold rounded transition-all duration-300 group"
                        >
                          <Instagram size={11} className="transition-transform group-hover:scale-110" />
                          <span>Instagram</span>
                        </a>
                      )}
                      {selectedPartnerProfile.facebook && (
                        <a
                          href={formatSocialUrl(selectedPartnerProfile.facebook, 'facebook')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper text-[9px] uppercase tracking-wider font-semibold rounded transition-all duration-300 group"
                        >
                          <Facebook size={11} className="transition-transform group-hover:scale-110" />
                          <span>Facebook</span>
                        </a>
                      )}
                      {selectedPartnerProfile.linkedin && (
                        <a
                          href={formatSocialUrl(selectedPartnerProfile.linkedin, 'linkedin')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper text-[9px] uppercase tracking-wider font-semibold rounded transition-all duration-300 group"
                        >
                          <Linkedin size={11} className="transition-transform group-hover:scale-110" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {selectedPartnerProfile.twitter && (
                        <a
                          href={formatSocialUrl(selectedPartnerProfile.twitter, 'twitter')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] hover:bg-brick-copper/10 border border-white/5 hover:border-brick-copper/30 text-neutral-400 hover:text-brick-copper text-[9px] uppercase tracking-wider font-semibold rounded transition-all duration-300 group"
                        >
                          <Twitter size={11} className="transition-transform group-hover:scale-110" />
                          <span>Twitter</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Related Listing Showcases */}
                {(() => {
                  const items = portfolioItems?.filter(p => p.partnerUid === selectedPartnerProfile.id || p.partnerUids?.includes(selectedPartnerProfile.id)) || [];
                  if (items.length > 0) {
                    return (
                      <div className="pt-4 border-t border-white/5">
                        <span className="text-[8px] uppercase tracking-widest text-neutral-500 font-mono font-bold block mb-2">Representative Commissions</span>
                        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                          {items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setSelectedPartnerProfile(null);
                                navigate(`/portfolio/${item.id}`);
                              }}
                              className="w-full flex items-center justify-between p-2 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded transition-all text-left text-xs cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={item.img}
                                  alt={item.title}
                                  className="w-8 h-8 object-cover rounded"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="font-serif italic text-white text-xs truncate max-w-[220px]">{item.title?.split(',')[0]}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[7.5px] uppercase tracking-wider font-bold text-brick-copper">{item.listPrice}</span>
                                <ChevronRight size={10} className="text-white/40" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* MOBILE ACTION BUTTON STICKY FOOTER TRAY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-bg-primary/95 backdrop-blur-md border-t border-white/10 px-4 py-3 flex items-center justify-between lg:hidden safe-area-inset-bottom">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[7px] text-brick-copper font-mono uppercase tracking-wider font-bold">Interactive Media</span>
            <span className="text-[10px] text-white font-bold truncate max-w-[140px]">{project.title?.split(',')[0]}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {associatedPartners[0]?.phone ? (
            <a 
              href={`tel:${associatedPartners[0].phone}`}
              className="px-3 py-2 bg-white/5 border border-white/10 text-white transition-all rounded-xs text-[9px] uppercase tracking-widest font-bold flex items-center gap-1"
            >
              <Phone size={10} /> Call
            </a>
          ) : (
            <a 
              href={`tel:${settings?.contactInfo?.phone || '+1 (555) 000-0000'}`}
              className="px-3 py-2 bg-white/5 border border-white/10 text-white transition-all rounded-xs text-[9px] uppercase tracking-widest font-bold flex items-center gap-1"
            >
              <Phone size={10} /> Call
            </a>
          )}
          <button 
            type="button"
            onClick={() => setShowInquiryModal(true)}
            className="px-4 py-2 bg-brick-copper text-charcoal transition-all rounded-xs text-[9px] uppercase tracking-widest font-black flex items-center gap-1 shadow-lg"
          >
            <Mail size={10} /> Request Dossier
          </button>
        </div>
      </div>


      <Toaster position="bottom-right" />
    </div>
  );
};