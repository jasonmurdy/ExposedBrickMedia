import { useState, useEffect } from 'react';
import { db, auth, storage } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc, getDocs, limit, or } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { 
  Copy, Plus, Image as ImageIcon, Briefcase, Share2, LogOut, 
  CheckCircle2, CopyCheck, UserPlus, CreditCard, Shield,
  Folder, Box, Users as UsersIcon, ChevronRight, Globe,
  Download, ExternalLink, Mail, Phone, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useSiteContent } from '../lib/SiteContentContext';

import { PDFViewer } from './PDFViewer';

export function ClientDashboard() {
  const { settings, isAdmin } = useSiteContent();
  const [activeTab, setActiveTab] = useState<'profile' | 'referrals' | 'listings' | 'resources' | 'team'>('profile');
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [brandResources, setBrandResources] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Referral Draft
  const [newReferral, setNewReferral] = useState({ name: '', phone: '', email: '', notes: '' });
  const [showReferralForm, setShowReferralForm] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);
    const profileRef = doc(db, 'users', currentUser.uid);
    const unSubProfile = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() });
        setIsLoading(false);
      } else {
        // Fallback: Check if there's a pre-seeded profile using the email as document ID 
        // (Admins often create profiles this way before the user first signs in)
        try {
          const emailProfileRef = doc(db, 'users', currentUser.email!);
          const emailSnap = await getDoc(emailProfileRef);
          
          if (emailSnap.exists()) {
            // Found a pre-seeded profile! Migrate it to the UID-based document for security and performance
            const preSeededData = emailSnap.data();
            const migratedProfile = {
              ...preSeededData,
              uid: currentUser.uid,
              updatedAt: serverTimestamp()
            };
            
            await setDoc(profileRef, migratedProfile);
            await deleteDoc(emailProfileRef); // Cleanup the email-indexed document
            
            setUserProfile({ id: currentUser.uid, ...migratedProfile });
            setIsLoading(false);
          } else {
             // Second Fallback: Check via query in case the ID wasn't exactly the email
             const q = query(collection(db, 'users'), where('email', '==', currentUser.email), limit(1));
             const querySnap = await getDocs(q);
             
             if (!querySnap.empty) {
                const seedDoc = querySnap.docs[0];
                const seedData = seedDoc.data();
                
                // Migrate to UID
                await setDoc(profileRef, { ...seedData, uid: currentUser.uid, updatedAt: serverTimestamp() });
                if (seedDoc.id !== currentUser.uid) {
                   await deleteDoc(doc(db, 'users', seedDoc.id));
                }
             } else {
                // Create initial profile if no seeds found
                const defaultProfile = {
                  email: currentUser.email,
                  displayName: currentUser.displayName || '',
                  role: isAdmin ? 'admin' : 'client',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                };
                await setDoc(profileRef, defaultProfile);
             }
             setIsLoading(false);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
          setIsLoading(false);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
      setIsLoading(false);
    });

    // Load Referrals
    const referralsQuery = query(collection(db, 'referrals'), where('referrerUid', '==', currentUser.uid));
    const unSubReferrals = onSnapshot(referralsQuery, (snapshot) => {
      const refs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReferrals(refs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'referrals'));

    // Load Associated Listings (where the partner UID is present in the assignment array OR teamId matches)
    const listingsQuery = currentUser.uid === auth.currentUser?.uid && (isAdmin || userProfile?.role === 'admin') 
      ? query(collection(db, 'portfolio_items')) // Admins see all
      : query(
          collection(db, 'portfolio_items'), 
          or(
            where('partnerUids', 'array-contains', currentUser.uid),
            where('teamId', '==', userProfile?.teamId || 'NONE')
          )
        );
    
    const unSubListings = onSnapshot(listingsQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListings(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'portfolio_items'));

    // Load Team
    let unSubTeam = () => {};
    let unSubTeamMembers = () => {};

    if (userProfile?.teamId) {
       unSubTeam = onSnapshot(doc(db, 'teams', userProfile.teamId), (snap) => {
          if (snap.exists()) setTeam({ id: snap.id, ...snap.data() });
       });

       const membersQuery = query(collection(db, 'users'), where('teamId', '==', userProfile.teamId));
       unSubTeamMembers = onSnapshot(membersQuery, (snap) => {
          setTeamMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
       });
    }

    // Load Brand Resources
    const resourcesQuery = query(collection(db, 'brand_resources'));
    const unSubResources = onSnapshot(resourcesQuery, (snapshot) => {
       setBrandResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'brand_resources'));

    return () => {
      unSubProfile();
      unSubReferrals();
      unSubListings();
      unSubTeam();
      unSubTeamMembers();
      unSubResources();
    };
  }, [currentUser, userProfile?.teamId]);

  const handleProfileUpdate = async (field: string, value: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      toast.success(`${field} updated`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'headshotUrl' | 'logoUrl') => {
    if (!currentUser || !e.target.files || e.target.files.length === 0) return;
    if (!storage) {
       toast.error("Storage not configured.");
       return;
    }
    
    const file = e.target.files[0];
    const storageRef = ref(storage, `users/${currentUser.uid}/${field}/${file.name}`);
    setIsUploading(true);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [field]: downloadURL,
        updatedAt: serverTimestamp()
      });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Upload failed.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const submitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newReferral.name) {
      toast.error("Name is required");
      return;
    }

    try {
      await addDoc(collection(db, 'referrals'), {
        referrerUid: currentUser.uid,
        referralName: newReferral.name,
        email: newReferral.email,
        phone: newReferral.phone,
        notes: newReferral.notes,
        status: 'Contacting...',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // TRIGGER EMAIL NOTIFICATION
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: settings.contactInfo?.email || 'jasonmurdy@gmail.com', // Admin email
            subject: `New Referral Activation from ${userProfile?.displayName || currentUser?.email}`,
            body: `
              <div style="font-family: sans-serif; color: #1a1a1a;">
                <p><strong>Referrer:</strong> ${userProfile?.displayName || currentUser?.email}</p>
                <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #c43b2a; background: #f9f9f9;">
                  <p><strong>Target Agent:</strong> ${newReferral.name}</p>
                  <p><strong>Email:</strong> ${newReferral.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> ${newReferral.phone || 'N/A'}</p>
                  <p><strong>Strategic Notes:</strong> ${newReferral.notes || 'No additional notes provided.'}</p>
                </div>
                <p style="font-size: 11px; color: #666;">This referral was dispatched via the Brand Hub Partner Portal.</p>
              </div>
            `
          })
        });
      } catch (e) {
        console.error("Failed to send referral notification email", e);
      }

      toast.success("Referral submitted successfully!");
      setNewReferral({ name: '', phone: '', email: '', notes: '' });
      setShowReferralForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'referrals');
    }
  };

  const totalValueEarnt = referrals.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const completedReferrals = referrals.filter(r => r.status === 'Completed').length;

  if (!currentUser) {
    const titleParts = (settings.portalTitle || 'The Brand Hub').split(' ');
    const lastWord = titleParts.pop();
    const leadingWords = titleParts.join(' ');

    return (
      <div className="min-h-screen w-full bg-bg-primary text-text-primary flex items-center justify-center p-6 lg:p-0 bg-[radial-gradient(circle_at_top_right,rgba(184,115,51,0.1),transparent)]">
        <div className="max-w-[1400px] w-full min-h-screen lg:h-screen grid grid-cols-1 lg:grid-cols-2 lg:overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center p-8 md:p-16 lg:p-24 space-y-12 bg-bg-primary/80 backdrop-blur-sm z-10"
          >
            <div className="flex items-center justify-between">
              <Link to="/" className="group flex items-center italic">
                <span className="font-display text-2xl text-text-primary">
                  {settings.brandName.split(' ')[0]} <span className="text-brick-copper">{settings.brandName.split(' ').slice(1).join(' ')}</span>
                </span>
              </Link>
              <Link to="/" className="text-[9px] uppercase tracking-widest font-bold text-text-primary/40 hover:text-brick-copper transition-colors lg:hidden">
                Exit Portal
              </Link>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brick-copper/10 border border-brick-copper/20 rounded-full">
                <Shield size={12} className="text-brick-copper" />
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-brick-copper">Secured Partner Access</span>
              </div>
              <h1 className="font-display text-6xl md:text-8xl italic leading-[1.1] tracking-tight">
                {leadingWords} <span className="text-brick-copper">{lastWord}</span>
              </h1>
              <p className="text-base text-text-primary/50 leading-relaxed max-w-md font-sans">
                {settings.portalDescription || 'A dedicated ecosystem for our real estate partners. Access your brand assets, track referrals in real-time, and manage your property media history.'}
              </p>
            </div>

            <div className="space-y-6">
              <button 
                onClick={() => signInWithPopup(auth, new GoogleAuthProvider()).catch(console.error)}
                className="w-full sm:w-auto px-12 py-5 bg-brick-copper text-charcoal font-black text-xs uppercase tracking-[0.3em] hover:bg-white hover:-translate-y-1 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 group"
              >
                Sign In with Google
                <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <Shield size={16} />
                </motion.div>
              </button>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-widest text-text-primary/40 font-bold">
                  New Partner? Your identity will be synchronized on initiation.
                </p>
                {settings.portalSupportEmail && (
                  <p className="text-[9px] uppercase tracking-widest text-text-primary/20">
                    Network Support: {settings.portalSupportEmail}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* SPLASH IMAGE AREA */}
          <div className="relative h-[40vh] lg:h-full bg-charcoal overflow-hidden group">
            <motion.img 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ duration: 1.5 }}
              src={settings.portalImg} 
              alt="Architecture Showcase" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-2000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-transparent to-transparent hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent lg:hidden" />
            
            <div className="absolute bottom-12 right-12 text-right hidden md:block">
              <div className="flex justify-end gap-3 mb-4">
                {[1,2,3,4].map(i => <div key={i} className={`w-12 h-[1px] ${i === 1 ? 'bg-brick-copper' : 'bg-white/10'}`} />)}
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Architectural Narrative Protocol v.4</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-screen w-full bg-bg-primary text-text-primary flex flex-col md:flex-row overflow-hidden selection:bg-brick-copper selection:text-charcoal"
    >
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-72 bg-bg-primary border-r border-border-subtle p-8 flex-col h-full bg-[linear-gradient(to_bottom,rgba(184,115,51,0.02),transparent)]">
        <div className="mb-16">
          <Link to="/" className="group flex items-center italic mb-8">
            <span className="font-display text-xl text-text-primary">
              Exposed <span className="text-brick-copper">Brick</span>
            </span>
          </Link>
          <div className="p-4 bg-text-primary/5 border border-border-subtle rounded-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-primary/40">Authenticated As</h2>
              <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-full font-black tracking-widest ${isAdmin || userProfile?.role === 'admin' ? 'bg-brick-copper text-charcoal' : 'bg-text-primary/10 text-text-primary/60'}`}>
                {isAdmin || userProfile?.role === 'admin' ? 'Admin' : 'Partner'}
              </span>
            </div>
            <p className="text-xs font-bold truncate">{userProfile?.displayName || currentUser?.displayName || 'Partner'}</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {isAdmin && (
            <Link 
              to="/?admin=true"
              className="w-full flex items-center gap-4 px-5 py-4 rounded-sm text-left text-[10px] uppercase tracking-[0.2em] transition-all duration-300 text-brick-copper hover:bg-brick-copper/10 font-black mb-4 border border-brick-copper/20"
            >
              <Shield size={14} /> Admin Dashboard
            </Link>
          )}
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-sm text-left text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'profile' ? 'bg-brick-copper text-charcoal font-black border-l-4 border-charcoal/20' : 'text-text-primary/60 hover:bg-text-primary/5 hover:text-text-primary'}`}
          >
            <Shield size={14} /> Brand Assets
          </button>
          <button 
            onClick={() => setActiveTab('referrals')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-sm text-left text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'referrals' ? 'bg-brick-copper text-charcoal font-black border-l-4 border-charcoal/20' : 'text-text-primary/60 hover:bg-text-primary/5 hover:text-text-primary'}`}
          >
            <UserPlus size={14} /> Referral Tracker
          </button>
          <button 
            onClick={() => setActiveTab('listings')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-sm text-left text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'listings' ? 'bg-brick-copper text-charcoal font-black border-l-4 border-charcoal/20' : 'text-text-primary/60 hover:bg-text-primary/5 hover:text-text-primary'}`}
          >
            <Briefcase size={14} /> Media Archive
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-sm text-left text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'resources' ? 'bg-brick-copper text-charcoal font-black border-l-4 border-charcoal/20' : 'text-text-primary/60 hover:bg-text-primary/5 hover:text-text-primary'}`}
          >
            <Folder size={14} /> Brand Resources
          </button>
          {userProfile?.teamId && (
            <button 
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-sm text-left text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'team' ? 'bg-brick-copper text-charcoal font-black border-l-4 border-charcoal/20' : 'text-text-primary/60 hover:bg-text-primary/5 hover:text-text-primary'}`}
            >
              <UsersIcon size={14} /> Collective
            </button>
          )}
        </nav>
        
        <div className="mt-auto pt-8 border-t border-border-subtle">
          <button 
            onClick={() => auth.signOut().then(() => window.location.href = '/')}
            className="w-full flex items-center justify-between p-4 bg-text-primary/5 border border-border-subtle hover:bg-brick-copper hover:text-charcoal transition-all group"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold">Secure Sign Out</span>
            <LogOut size={14} className="opacity-40 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-bg-primary border-b border-border-subtle p-6 flex items-center justify-between sticky top-0 z-20">
        <span className="font-display text-lg italic">Brand <span className="text-brick-copper">Hub</span></span>
        <div className="flex gap-4">
           <button onClick={() => setActiveTab('profile')} className={`p-2 ${activeTab === 'profile' ? 'text-brick-copper' : 'text-text-primary/40'}`}><Shield size={20}/></button>
           <button onClick={() => setActiveTab('referrals')} className={`p-2 ${activeTab === 'referrals' ? 'text-brick-copper' : 'text-text-primary/40'}`}><UserPlus size={20}/></button>
           <button onClick={() => setActiveTab('listings')} className={`p-2 ${activeTab === 'listings' ? 'text-brick-copper' : 'text-text-primary/40'}`}><Briefcase size={20}/></button>
           <button onClick={() => setActiveTab('resources')} className={`p-2 ${activeTab === 'resources' ? 'text-brick-copper' : 'text-text-primary/40'}`}><Folder size={20}/></button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-text-primary/[0.01] relative scroll-smooth h-[calc(100vh-80px)] md:h-screen">
        {isLoading ? (
           <div className="w-full h-full flex flex-col items-center justify-center text-text-primary/30">
              <div className="w-12 h-12 border-2 border-brick-copper/20 border-t-brick-copper rounded-full animate-spin mb-4" />
              <p className="text-[10px] uppercase tracking-[0.3em]">Accessing Brand Vault...</p>
           </div>
        ) : (
          <div className="max-w-6xl mx-auto p-8 md:p-16">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-16"
                >
                  <header className="space-y-4">
                    <h1 className="font-display text-5xl md:text-7xl lowercase italic mt-12 md:mt-0">Vault<span className="text-brick-copper">.</span></h1>
                    <p className="text-sm text-text-primary/50 max-w-md">Centralize your professional identity. These assets are used to personalize your media deliveries automatically.</p>
                  </header>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
                    <div className="lg:col-span-2 space-y-12">
                      <section className="space-y-6">
                        <h2 className="text-[11px] uppercase tracking-[0.4em] font-black text-text-primary/40 border-b border-border-subtle pb-4 mb-8">Bio & Messaging</h2>
                        <div className="space-y-8">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-text-primary/40 block mb-3 font-bold">Professional Display Name</label>
                            <input 
                              className="w-full bg-text-primary/5 border-b border-border-subtle p-4 text-base focus:border-brick-copper outline-none transition-all placeholder:text-text-primary/10"
                              value={userProfile?.displayName || ''}
                              onChange={(e) => handleProfileUpdate('displayName', e.target.value)}
                              placeholder="e.g. Alexander Knight • Principal Associate"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-text-primary/40 block mb-3 font-bold">Team / Agency Name</label>
                            <input 
                              className="w-full bg-text-primary/5 border-b border-border-subtle p-4 text-base focus:border-brick-copper outline-none transition-all placeholder:text-text-primary/10"
                              value={userProfile?.teamName || ''}
                              onChange={(e) => handleProfileUpdate('teamName', e.target.value)}
                              placeholder="e.g. The Knight Group • XYZ Realty"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-text-primary/40 block mb-3 font-bold">Brand Narrative / Bio</label>
                            <textarea 
                              className="w-full bg-text-primary/5 border border-border-subtle p-6 text-sm focus:border-brick-copper outline-none transition-all resize-none h-40 leading-relaxed font-serif"
                              value={userProfile?.bio || ''}
                              onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                              placeholder="Articulate your value proposition..."
                            />
                          </div>
                        </div>
                      </section>

                      <section className="space-y-6">
                         <h2 className="text-[11px] uppercase tracking-[0.4em] font-black text-text-primary/40 border-b border-border-subtle pb-4 mb-8">Digital Footprint</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-text-primary/40 block mb-3 font-bold">Instagram</label>
                              <div className="flex bg-text-primary/5 border-b border-border-subtle items-center px-4">
                                <span className="text-text-primary/30 text-xs">@</span>
                                <input 
                                  className="flex-1 bg-transparent p-4 text-sm outline-none"
                                  value={userProfile?.instagram || ''}
                                  onChange={(e) => handleProfileUpdate('instagram', e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                               <label className="text-[10px] uppercase tracking-widest text-text-primary/40 block mb-3 font-bold">LinkedIn Profile</label>
                               <input 
                                 className="w-full bg-text-primary/5 border-b border-border-subtle p-4 text-sm outline-none"
                                 value={userProfile?.linkedin || ''}
                                 onChange={(e) => handleProfileUpdate('linkedin', e.target.value)}
                               />
                            </div>
                         </div>
                      </section>
                    </div>

                    <aside className="space-y-12">
                       <h2 className="text-[11px] uppercase tracking-[0.4em] font-black text-text-primary/40 border-b border-border-subtle pb-4 mb-8">Visual Identity</h2>
                       <div className="space-y-10">
                          <div className="space-y-4">
                             <p className="text-[9px] uppercase tracking-widest text-text-primary/40 text-center mb-6 font-bold">Portrait Assets</p>
                             <div className="relative group mx-auto w-40 h-48 bg-text-primary/10 border border-border-subtle flex items-center justify-center overflow-hidden">
                                {userProfile?.headshotUrl ? (
                                   <img src={userProfile.headshotUrl} alt="Headshot" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                ) : (
                                   <ImageIcon size={32} className="text-text-primary/10" />
                                )}
                                <label className="absolute inset-0 bg-charcoal/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                   <Plus className="text-brick-copper mb-2" />
                                   <span className="text-[9px] uppercase tracking-widest font-black text-white">{isUploading ? 'Syncing...' : 'Update'}</span>
                                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'headshotUrl')} disabled={isUploading} />
                                </label>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <p className="text-[9px] uppercase tracking-widest text-text-primary/40 text-center mb-6 font-bold">Agency Logo</p>
                             <div className="relative group mx-auto w-full h-32 bg-text-primary/5 border border-border-subtle border-dashed p-8 flex items-center justify-center">
                                {userProfile?.logoUrl ? (
                                   <img src={userProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain filter invert opacity-80" />
                                ) : (
                                   <ImageIcon size={24} className="text-text-primary/20" />
                                )}
                                <label className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-bg-primary/95">
                                   <span className="text-[9px] uppercase tracking-widest font-black text-brick-copper">Replace Brand Mark</span>
                                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} disabled={isUploading} />
                                </label>
                             </div>
                          </div>
                       </div>
                    </aside>
                  </div>
                </motion.div>
              )}

              {activeTab === 'referrals' && (
                <motion.div 
                   key="referrals"
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-16"
                >
                  <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                    <div className="space-y-4">
                       <h1 className="font-display text-5xl md:text-7xl lowercase italic mt-12 md:mt-0">Referral<span className="text-brick-copper">.</span></h1>
                       <p className="text-sm text-text-primary/50 max-w-sm">Bridge the gap between vision and delivery. Every referral translates into tangible network rewards.</p>
                    </div>
                    <button 
                      onClick={() => setShowReferralForm(!showReferralForm)}
                      className="group relative px-12 py-5 bg-text-primary text-bg-primary font-black text-[11px] uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-brick-copper hover:text-charcoal"
                    >
                      <span className="relative z-10 flex items-center gap-4">
                        <Plus size={16} /> Introduce Agent
                      </span>
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 border border-border-subtle">
                    <div className="p-12 border-b md:border-b-0 md:border-r border-border-subtle bg-bg-primary">
                      <p className="text-[10px] uppercase tracking-[0.4em] text-text-primary/30 mb-4 font-black">Shared Opportunity</p>
                      <p className="text-5xl font-display italic">{referrals.length}</p>
                    </div>
                    <div className="p-12 border-b md:border-b-0 md:border-r border-border-subtle bg-bg-primary">
                      <p className="text-[10px] uppercase tracking-[0.4em] text-text-primary/30 mb-4 font-black">Success Rate</p>
                      <p className="text-5xl font-display italic">
                        {referrals.length === 0 ? '0%' : `${Math.round((completedReferrals / referrals.length) * 100)}%`}
                      </p>
                    </div>
                    <div className="p-12 bg-charcoal text-white">
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4 font-black text-brick-copper">Account Credits</p>
                      <p className="text-5xl font-display italic text-brick-copper">${totalValueEarnt}</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showReferralForm && (
                       <motion.form 
                         initial={{ opacity: 0, scale: 0.98 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.98 }}
                         onSubmit={submitReferral}
                         className="bg-bg-primary border border-brick-copper/30 p-12 space-y-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]"
                       >
                          <div className="space-y-2">
                             <h3 className="text-xs uppercase tracking-[0.4em] font-black">Internal Memo</h3>
                             <p className="text-[10px] text-text-primary/40 uppercase">Provide context so we can tailor our initial outreach.</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="relative border-b border-border-subtle group">
                              <label className="text-[9px] uppercase tracking-widest text-text-primary/30 absolute -top-4 left-0 group-focus-within:text-brick-copper transition-colors">Target Agent Name</label>
                              <input 
                                required className="w-full bg-transparent p-4 text-sm outline-none" 
                                value={newReferral.name} onChange={e => setNewReferral({...newReferral, name: e.target.value})}
                              />
                            </div>
                            <div className="relative border-b border-border-subtle group">
                              <label className="text-[9px] uppercase tracking-widest text-text-primary/30 absolute -top-4 left-0 group-focus-within:text-brick-copper transition-colors">Direct Email Address</label>
                              <input 
                                type="email" className="w-full bg-transparent p-4 text-sm outline-none" 
                                value={newReferral.email} onChange={e => setNewReferral({...newReferral, email: e.target.value})}
                              />
                            </div>
                            <div className="md:col-span-2 relative border-b border-border-subtle group">
                              <label className="text-[9px] uppercase tracking-widest text-text-primary/30 absolute -top-4 left-0 group-focus-within:text-brick-copper transition-colors">Project Specifics / Notes</label>
                              <textarea 
                                className="w-full bg-transparent p-4 text-sm outline-none resize-none h-24 placeholder:italic"
                                placeholder="e.g. Just secure a listing at 420 High St, needs premium interiors..."
                                value={newReferral.notes} onChange={e => setNewReferral({...newReferral, notes: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-6 pt-4">
                            <button type="button" onClick={() => setShowReferralForm(false)} className="text-[10px] uppercase tracking-[0.3em] font-bold hover:text-brick-copper transition-colors">Discard</button>
                            <button type="submit" className="px-10 py-4 bg-brick-copper text-charcoal font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white transition-all shadow-lg active:scale-95">Dispatch Introduction</button>
                          </div>
                       </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="space-y-8">
                    <h2 className="text-[11px] uppercase tracking-[0.4em] font-black text-text-primary/40 flex items-center gap-4">
                       <span className="w-12 h-[1px] bg-border-subtle"/> Activity History
                    </h2>
                    
                    {referrals.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1">
                        {referrals.map((refData) => (
                          <div key={refData.id} className="bg-bg-primary border border-border-subtle p-8 flex flex-col md:flex-row md:items-center justify-between hover:border-brick-copper/50 transition-colors group">
                            <div className="space-y-2">
                              <p className="font-display text-2xl lowercase italic group-hover:text-brick-copper transition-colors">{refData.referralName}</p>
                              <div className="flex items-center gap-4 text-[10px] text-text-primary/40 uppercase tracking-widest">
                                {refData.email && <span>{refData.email}</span>}
                                {refData.createdAt && <span>Added {new Date(refData.createdAt.seconds * 1000).toLocaleDateString()}</span>}
                              </div>
                            </div>
                            
                            <div className="mt-6 md:mt-0 flex items-center gap-12">
                              <div className="text-right">
                                <p className="text-[9px] uppercase tracking-widest text-text-primary/30 mb-1 font-bold">Engagement Status</p>
                                <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${
                                  refData.status === 'Completed' ? 'text-green-500' : 
                                  refData.status === 'Contacting...' ? 'text-brick-copper' : 'text-text-primary/60'
                                }`}>
                                  {refData.status}
                                </p>
                              </div>
                              <div className="w-[1px] h-8 bg-border-subtle hidden md:block" />
                              <div className="text-right min-w-[80px]">
                                <p className="text-[9px] uppercase tracking-widest text-text-primary/30 mb-1 font-bold">Credit</p>
                                <p className="font-mono text-xs font-bold">{refData.value ? `+$${refData.value}` : '---'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-text-primary/[0.02] border border-dashed border-border-subtle py-24 text-center">
                         <UserPlus size={32} className="mx-auto mb-6 text-text-primary/10" />
                         <p className="text-[10px] uppercase tracking-[0.3em] text-text-primary/30 font-bold">Initiate your first referral connection</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'resources' && (
                <motion.div 
                   key="resources"
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-16"
                >
                  <header className="space-y-4">
                     <h1 className="font-display text-5xl md:text-7xl lowercase italic mt-12 md:mt-0">Resources<span className="text-brick-copper">.</span></h1>
                     <p className="text-sm text-text-primary/50 max-w-sm">Exclusive brand assets and strategic documentation tailored for your identity.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Global Asset Registry */}
                    <div className="md:col-span-2 space-y-12">
                       <h2 className="text-[12px] uppercase tracking-[0.5em] font-black text-text-primary/40 flex items-center gap-6">
                          <span className="w-12 h-[1px] bg-border-subtle" /> Global Archive
                       </h2>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {brandResources.map((res) => (
                            <div key={res.id} className="bg-bg-primary border border-border-subtle p-8 hover:border-brick-copper/50 transition-all group flex flex-col justify-between">
                               <div className="mb-8">
                                  <div className="w-10 h-10 bg-brick-copper/10 flex items-center justify-center mb-6">
                                     <FileText className="text-brick-copper" size={18} />
                                  </div>
                                  <h3 className="font-display text-xl italic mb-2">{res.title}</h3>
                                  <p className="text-[10px] text-text-primary/40 uppercase tracking-widest">{res.category || 'Shared Asset'}</p>
                               </div>
                               <a 
                                 href={res.url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="w-full py-4 border border-border-subtle text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 hover:bg-brick-copper hover:text-charcoal transition-all"
                               >
                                  <Download size={12} /> Retrieve Asset
                               </a>
                            </div>
                          ))}
                       </div>

                       <h2 className="text-[12px] uppercase tracking-[0.5em] font-black text-text-primary/40 flex items-center gap-6 pt-12">
                          <span className="w-12 h-[1px] bg-border-subtle" /> Personalized Assets
                       </h2>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {userProfile?.resources?.map((res: any, idx: number) => (
                            <div key={idx} className="bg-bg-primary border border-border-subtle p-8 hover:border-brick-copper/50 transition-all group flex flex-col justify-between">
                               <div className="mb-8">
                                  <div className="w-10 h-10 bg-brick-copper/10 flex items-center justify-center mb-6">
                                     <FileText className="text-brick-copper" size={18} />
                                  </div>
                                  <h3 className="font-display text-xl italic mb-2">{res.name || `Asset ${idx + 1}`}</h3>
                                  <p className="text-[10px] text-text-primary/40 uppercase tracking-widest">{res.type || 'Shared Resource'}</p>
                               </div>
                               <a 
                                 href={res.url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="w-full py-4 border border-border-subtle text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 hover:bg-brick-copper hover:text-charcoal transition-all"
                               >
                                  <Download size={12} /> Retrieve Asset
                               </a>
                            </div>
                          ))}
                          {(!userProfile?.resources || userProfile.resources.length === 0) && brandResources.length === 0 && (
                            <div className="col-span-full py-20 text-center border border-dashed border-border-subtle text-text-primary/20">
                               <Box size={32} className="mx-auto mb-4 opacity-5" />
                               <p className="text-[10px] uppercase tracking-[0.3em]">No brand assets discovered.</p>
                            </div>
                          )}
                       </div>
                    </div>

                    {/* Shared Knowledge */}
                    <div className="space-y-8">
                       <div className="bg-charcoal p-8 border border-white/5">
                          <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-brick-copper mb-6">Strategic Guides</h4>
                          <div className="space-y-6">
                             {[
                               { label: 'Architectural Presentation Guide', url: 'https://firebasestorage.googleapis.com/v0/b/exposed-brick-media.appspot.com/o/guides%2Fpresentation.pdf?alt=media' },
                               { label: 'Social Media Deployment Strategy', url: 'https://firebasestorage.googleapis.com/v0/b/exposed-brick-media.appspot.com/o/guides%2Fsocial.pdf?alt=media' },
                               { label: 'Digital Narrative Protocol', url: 'https://firebasestorage.googleapis.com/v0/b/exposed-brick-media.appspot.com/o/guides%2Fprotocol.pdf?alt=media' }
                             ].map((guide, i) => (
                               <button 
                                 key={i} 
                                 onClick={() => setSelectedPdf({ url: guide.url, title: guide.label })}
                                 className="w-full flex items-center justify-between group text-left"
                               >
                                  <div className="flex items-center gap-3">
                                    <FileText size={12} className="text-white/20 group-hover:text-brick-copper" />
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{guide.label}</span>
                                  </div>
                                  <ChevronRight size={12} className="text-white/10 group-hover:text-brick-copper" />
                               </button>
                             ))}
                          </div>
                       </div>

                       <div className="bg-brick-copper/5 border border-brick-copper/20 p-8">
                          <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-brick-copper mb-4">Request Custom Asset</h4>
                          <p className="text-[9px] text-text-primary/50 uppercase leading-relaxed mb-6">Need a specific brand mark or presentation deck? Contact our fulfillment team.</p>
                          <a href={`mailto:${settings.contactInfo?.email}`} className="text-[10px] uppercase tracking-widest font-black border-b border-brick-copper pb-1 hover:text-brick-copper transition-colors">Submit Request</a>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'team' && (
                <motion.div 
                   key="team"
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-16"
                >
                  <header className="space-y-4">
                     <h1 className="font-display text-5xl md:text-7xl lowercase italic mt-12 md:mt-0">Collective<span className="text-brick-copper">.</span></h1>
                     <p className="text-sm text-text-primary/50 max-w-sm">Synchronized professionals operating under a unified strategic umbrella.</p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                     <div className="lg:col-span-1 space-y-8">
                        <div className="bg-bg-primary border border-brick-copper/30 p-8 shadow-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-5">
                              <Box size={80} />
                           </div>
                           <h3 className="font-display text-3xl italic mb-1 text-brick-copper">{team?.name}</h3>
                           <p className="text-[10px] text-text-primary/40 uppercase tracking-widest mb-6">Identity Shield</p>
                           <p className="text-xs text-text-primary/60 leading-relaxed font-serif italic">"{team?.description || 'A unified collective of real estate professionals committed to architectural excellence.'}"</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-text-primary/5 p-6 border border-border-subtle">
                              <p className="text-[8px] uppercase tracking-widest text-text-primary/30 mb-2">Member Count</p>
                              <p className="font-display text-2xl italic">{teamMembers.length}</p>
                           </div>
                           <div className="bg-text-primary/5 p-6 border border-border-subtle">
                              <p className="text-[8px] uppercase tracking-widest text-text-primary/30 mb-2">Active Listings</p>
                              <p className="font-display text-2xl italic">---</p>
                           </div>
                        </div>
                     </div>

                     <div className="lg:col-span-3 space-y-8">
                        <h2 className="text-[11px] uppercase tracking-[0.4em] font-black text-text-primary/40 flex items-center gap-4">
                           <span className="w-12 h-[1px] bg-border-subtle"/> Team Roster
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                           {teamMembers.map((member) => (
                             <div key={member.id} className="bg-bg-primary border border-border-subtle p-8 group hover:border-brick-copper/40 transition-all flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full border border-border-subtle p-1 mb-6 group-hover:border-brick-copper/30 transition-all">
                                   <div className="w-full h-full rounded-full overflow-hidden bg-text-primary/5 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                                      {member.headshotUrl ? (
                                        <img src={member.headshotUrl} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <Shield size={32} className="text-text-primary/5" />
                                      )}
                                   </div>
                                </div>
                                <h4 className="text-lg font-display italic mb-1">{member.displayName || 'Unnamed Advisor'}</h4>
                                <p className="text-[9px] uppercase tracking-[0.2em] text-brick-copper font-bold mb-6">{member.role || 'Partner'}</p>
                                
                                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                   {member.email && <a href={`mailto:${member.email}`} className="text-text-primary/40 hover:text-brick-copper transition-colors"><Mail size={14} /></a>}
                                   {member.phone && <a href={`tel:${member.phone}`} className="text-text-primary/40 hover:text-brick-copper transition-colors"><Phone size={14} /></a>}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'listings' && (
                <motion.div 
                   key="listings"
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-16"
                >
                  <header className="space-y-4">
                     <h1 className="font-display text-5xl md:text-7xl lowercase italic mt-12 md:mt-0">Archive<span className="text-brick-copper">.</span></h1>
                     <p className="text-sm text-text-primary/50 max-w-sm">Review your historically delivered projects. Download raw assets or share optimized view-links.</p>
                  </header>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-border-subtle border border-border-subtle">
                    {listings.map(item => (
                      <div key={item.id} className="bg-bg-primary p-8 md:p-10 flex flex-col group relative overflow-hidden transition-all hover:bg-text-primary/[0.02]">
                        <div className="aspect-[16/10] bg-text-primary/5 overflow-hidden mb-8">
                          <img src={item.img} alt={item.title} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" />
                        </div>
                        
                        <div className="space-y-6 flex-1 flex flex-col">
                          <div className="space-y-2">
                             <div className="flex items-center gap-3 text-[9px] text-brick-copper font-bold uppercase tracking-[0.3em]">
                                {item.mlsNumber && <span>MLS #{item.mlsNumber}</span>}
                                <span className="w-1 h-1 rounded-full bg-brick-copper/30" />
                                <span>{item.category || 'Architecture'}</span>
                             </div>
                             <h4 className="text-3xl font-display lowercase italic tracking-tight">{item.title}</h4>
                          </div>

                          <div className="pt-8 border-t border-border-subtle mt-auto flex items-center justify-between">
                             <div className="flex gap-10">
                                <Link to={`/listing/${item.id}`} className="text-[10px] uppercase tracking-widest font-black flex items-center gap-3 transition-colors hover:text-brick-copper">
                                  <Share2 size={14} className="opacity-40" /> Share Hub
                                </Link>
                                {item.externalLink && (
                                  <a href={item.externalLink} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-black flex items-center gap-3 transition-colors hover:text-brick-copper">
                                    <Copy size={14} className="opacity-40" /> MLS Sync
                                  </a>
                                )}
                             </div>
                             <span className="text-[9px] uppercase tracking-widest text-text-primary/20 font-mono">ID: {item.id.substring(0,6)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
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
    </motion.div>
  );
}
