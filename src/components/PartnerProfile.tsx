import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Mail, Phone, Instagram, Linkedin, Facebook, Globe, Box, Shield, Briefcase, ChevronRight, Projector as Project } from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteContent } from '../lib/SiteContentContext';
import { Helmet } from 'react-helmet-async';

export function PartnerProfile() {
  const { partnerId } = useParams();
  const { isLight } = useSiteContent();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          </div>
        </div>

        <div className="lg:col-span-8 space-y-16">
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.5em] font-black text-text-primary/30 mb-8 flex items-center gap-4">
              <span className="w-12 h-[1px] bg-border-subtle" /> Curated Showcase
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {listings.map((item, idx) => (
                <Link key={item.id} to={`/listing/${item.id}`} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden bg-charcoal mb-4">
                    {item.coverImage ? (
                      <img 
                        src={item.coverImage} 
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
                  <div className="flex justify-between items-center group">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-text-primary/40 group-hover:text-text-primary transition-colors">Case Study 0{idx + 1}</span>
                    <ChevronRight size={14} className="text-text-primary/10 group-hover:text-brick-copper transition-colors" />
                  </div>
                </Link>
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

      {/* Footer CTA */}
      <section className="bg-charcoal py-24 text-center px-8">
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white italic lowercase mb-8">Elevate your architectural narrative<span className="text-brick-copper">.</span></h2>
        <Link to="/inquiry" className="inline-block px-12 py-5 bg-brick-copper text-charcoal text-xs uppercase font-black tracking-[0.4em] hover:bg-white transition-all shadow-2xl">
          Initiate Capture
        </Link>
      </section>
    </div>
  );
}
