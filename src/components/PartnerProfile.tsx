import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Mail, Phone, Instagram, Linkedin, Facebook, Globe, Box, Shield, Briefcase, ChevronRight, Settings, Edit3, Projector as Project, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteContent } from '../lib/SiteContentContext';
import { Helmet } from 'react-helmet-async';
import { ListingEditModal } from './ListingEditModal';
import toast, { Toaster } from 'react-hot-toast';

export function PartnerProfile() {
  const { partnerId } = useParams();
  const { isLight, user, isAdmin } = useSiteContent();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingListing, setEditingListing] = useState<any>(null);

  // Direct Inquiry State for Agent stand-alone profile page
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    if (profile) {
      setInquiryForm(prev => ({
        ...prev,
        message: `Hello ${profile.displayName}, I'm interested in discussing custom real estate marketing representation, architectural flambient captures, or cinematic HDR drone showcases with Exposed Brick Media.`
      }));
    }
  }, [profile]);

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email) {
      toast.error("Please supply both your name and email address.");
      return;
    }
    setSubmittingInquiry(true);
    const toastId = toast.loading("Conveying inquiry securely directly to advisor...");
    try {
      const crmResponse = await fetch("/api/crm/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyAddress: `General Representation Interest: ${profile.displayName}`,
          realtorName: inquiryForm.name,
          email: inquiryForm.email,
          serviceType: "Directed Advisor Representation Request",
          skipAdminNotification: true
        })
      });

      await crmResponse.json();
      const targetEmail = profile.email || 'jasonmurdy@gmail.com';

      const emailBody = `
        <h3>Direct Advisor Representation Inquiry</h3>
        <p>A new visitor has initiated direct communication specifically to explore architectural capture services or representation alignment with you:</p>
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
          subject: `[Agent Portfolio Inquiry] Strategic Representation Info Request: ${inquiryForm.name}`,
          body: emailBody,
          type: "advisor_direct_inquiry"
        })
      });

      const emailResult = await emailResponse.json();
      if (emailResult && emailResult.success === false) {
        throw new Error(emailResult.error || "Mail transmission rejected by gateway.");
      }

      toast.success(`Inquiry successfully dispatched to ${profile.displayName}! Expect a response shortly.`, { id: toastId });
      setShowInquiryModal(false);
      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        message: `Hello ${profile.displayName}, I'm interested in discussing custom real estate marketing representation, architectural flambient captures, or cinematic HDR drone showcases with Exposed Brick Media.`
      });
    } catch (err: any) {
      console.error("[Inquiry send failed]:", err);
      toast.error(`Ingestion failed: ${err.message || 'System fault'}`, { id: toastId });
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const canEdit = isAdmin || (user && user.uid === partnerId);

  useEffect(() => {
    if (!partnerId) return;

    // Load Profile
    const unsubProfile = onSnapshot(doc(db, 'users', partnerId), (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${partnerId}`);
      setLoading(false);
    });

    // Load Listings associated with this partner
    const q = query(
      collection(db, 'portfolio_items'),
      where('assignedTo', 'array-contains', partnerId),
      orderBy('order', 'asc')
    );

    const unsubListings = onSnapshot(q, (snap) => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Listing load failed:", err);
    });

    return () => {
      unsubProfile();
      unsubListings();
    };
  }, [partnerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse text-brick-copper font-display italic text-2xl">Initializing Narrative...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-8 text-center">
        <Shield size={48} className="text-text-primary/10 mb-6" />
        <h1 className="font-display text-4xl italic mb-4">Advisory Profile Not Found</h1>
        <p className="text-text-primary/40 uppercase tracking-widest text-[10px] mb-8">The requested identity has not been established in our ecosystem.</p>
        <Link to="/" className="px-8 py-4 bg-brick-copper text-charcoal text-[10px] uppercase font-black tracking-widest hover:bg-white transition-all">
          Return to Registry
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-bg-primary text-text-primary transition-colors duration-500 ${isLight ? 'light' : ''}`}>
      <Helmet>
        <title>{`${profile.displayName} | Partner Profile | Exposed Brick Media`}</title>
        <meta name="description" content={`Strategic partner profile for ${profile.displayName}. View architectural showcases and curated real estate narratives.`} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden bg-charcoal">
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent z-10" />
        {profile.headshotUrl ? (
          <img 
            src={profile.headshotUrl} 
            alt={profile.displayName}
            className="w-full h-full object-cover grayscale opacity-60 scale-105 hover:scale-100 transition-transform duration-[3s] ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Box size={200} className="text-white/5" />
          </div>
        )}

        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-16 lg:p-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="w-12 h-[1px] bg-brick-copper" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-brick-copper font-black">Strategic Partner</span>
            </div>
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-white italic lowercase leading-none mb-8">
              {profile.displayName}<span className="text-brick-copper">.</span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl font-serif italic max-w-2xl leading-relaxed">
              {profile.bio || "Crafting premium architectural experiences and delivering exceptional real estate outcomes through high-fidelity visual narratives."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Profile Details & Contact */}
      <section className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4 space-y-12">
          {profile.logoUrl && (
            <div className="p-8 border border-border-subtle bg-text-primary/[0.02]">
              <img src={profile.logoUrl} alt="Agency Monogram" className="h-16 w-auto object-contain grayscale brightness-125" />
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-brick-copper font-black">Identity Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b border-border-subtle group">
                <span className="text-[10px] uppercase tracking-widest text-text-primary/40 group-hover:text-text-primary transition-colors">Designation</span>
                <span className="font-mono text-sm italic">{profile.role || 'Partner'}</span>
              </div>
              {profile.teamName && (
                <div className="flex items-center justify-between py-4 border-b border-border-subtle group">
                  <span className="text-[10px] uppercase tracking-widest text-text-primary/40 group-hover:text-text-primary transition-colors">Collective</span>
                  <Link to={`/teams/${profile.teamId}`} className="font-mono text-sm italic text-brick-copper hover:text-text-primary transition-colors">{profile.teamName}</Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-brick-copper font-black">Connectivity</h3>
            <div className="flex flex-wrap gap-4">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="w-12 h-12 flex items-center justify-center border border-border-subtle hover:bg-brick-copper hover:text-charcoal transition-all">
                  <Mail size={18} />
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="w-12 h-12 flex items-center justify-center border border-border-subtle hover:bg-brick-copper hover:text-charcoal transition-all">
                  <Phone size={18} />
                </a>
              )}
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center border border-border-subtle hover:bg-brick-copper hover:text-charcoal transition-all">
                  <Instagram size={18} />
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center border border-border-subtle hover:bg-brick-copper hover:text-charcoal transition-all">
                  <Linkedin size={18} />
                </a>
              )}
            </div>
            {(profile.email || profile.phone) && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowInquiryModal(true)}
                  className="w-full py-4 text-center bg-brick-copper hover:bg-white text-charcoal transition-all text-[10px] tracking-widest uppercase font-black font-sans flex items-center justify-center gap-2 shadow-xl"
                >
                  <Mail size={14} /> Inquire Directly To Agent
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-16">
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.5em] font-black text-text-primary/30 mb-8 flex items-center gap-4">
              <span className="w-12 h-[1px] bg-border-subtle" /> Curated Showcase
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {listings.map((item, idx) => (
                <div key={item.id} className="group relative">
                  <Link to={`/listing/${item.id}`}>
                    <div className="relative aspect-[4/5] overflow-hidden bg-charcoal mb-4">
                      {item.coverImage || item.img ? (
                        <img 
                          src={item.coverImage || item.img} 
                          alt="" 
                          className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/5 opacity-50">
                          <Briefcase size={64} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-charcoal/20 group-hover:bg-transparent transition-all duration-500" />
                      <div className="absolute bottom-0 left-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <p className="text-[8px] uppercase tracking-[0.3em] font-black text-brick-copper mb-2">{item.location || 'Kingston, ON'}</p>
                        <h4 className="font-display text-2xl italic text-white">{item.title}</h4>
                      </div>
                    </div>
                  </Link>

                  {canEdit && (
                    <button 
                      onClick={() => setEditingListing(item)}
                      className="absolute top-4 right-4 z-30 p-3 bg-charcoal border border-white/10 text-brick-copper opacity-0 group-hover:opacity-100 transition-all hover:bg-brick-copper hover:text-charcoal"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}

                  <div className="flex justify-between items-center group">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-text-primary/40 group-hover:text-text-primary transition-colors">Case Study 0{idx + 1}</span>
                    <ChevronRight size={14} className="text-text-primary/10 group-hover:text-brick-copper transition-colors" />
                  </div>
                </div>
              ))}
              {listings.length === 0 && (
                <div className="col-span-full py-24 text-center border border-dashed border-border-subtle rounded-sm">
                   <Briefcase size={32} className="mx-auto mb-4 opacity-5" />
                   <p className="text-[10px] uppercase tracking-[0.4em] text-text-primary/20">No active captures documented.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {editingListing && (
          <ListingEditModal 
            listing={editingListing} 
            isOpen={!!editingListing} 
            onClose={() => setEditingListing(null)} 
          />
        )}
      </AnimatePresence>

      {/* DIRECT ADVISOR COMMISSION INTAKE PORTAL */}
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
              className="bg-charcoal border border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative text-left rounded"
            >
              <button 
                onClick={() => setShowInquiryModal(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                type="button"
                aria-label="Close form"
              >
                <X size={16} />
              </button>

              <div className="space-y-1 pr-6">
                <span className="text-[8px] uppercase tracking-[0.3em] text-brick-copper font-mono font-black block">Strategic Brief Pipeline</span>
                <h3 className="font-display text-2xl text-white italic">Inquire with Advisor</h3>
                <p className="text-[10px] text-white/40 font-mono">Directed to {profile.displayName}</p>
              </div>

              {profile.email && (
                <div className="flex items-center gap-2 px-3 py-2 bg-brick-copper/10 border border-brick-copper/20 rounded-xs text-brick-copper">
                  <Shield size={12} className="shrink-0" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.1em]">
                    Securing direct line to: <strong className="font-bold underline">{profile.email}</strong>
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
                  <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold font-mono block">Message Inquiry Details *</label>
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
                    onClick={() => setShowInquiryModal(false)}
                    className="border border-white/10 text-white px-5 py-3 hover:bg-white hover:text-charcoal transition-all rounded-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingInquiry}
                    className="bg-brick-copper text-charcoal px-5 py-3 hover:bg-white hover:text-charcoal transition-all rounded-xs disabled:opacity-40 flex items-center gap-1.5 font-black"
                  >
                    {submittingInquiry ? 'Transmitting...' : 'Transmit Inquiry'} <Send size={10} />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer CTA */}
      <section className="bg-charcoal py-24 text-center px-8">
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white italic lowercase mb-8">Elevate your architectural narrative<span className="text-brick-copper">.</span></h2>
        <button 
          onClick={() => setShowInquiryModal(true)}
          className="inline-block px-12 py-5 bg-brick-copper text-charcoal text-xs uppercase font-black tracking-[0.4em] hover:bg-white transition-all shadow-2xl"
        >
          Inquire Directly with Agent
        </button>
      </section>

      <Toaster position="bottom-right" />
    </div>
  );
}
