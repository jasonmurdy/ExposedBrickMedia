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
  Download, ExternalLink, Mail, Phone, FileText, Search, X, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useSiteContent } from '../lib/SiteContentContext';

import { PDFViewer } from './PDFViewer';
import { DynamicCuratedGallery } from './DynamicCuratedGallery';
import { LinkButton } from './LinkButton';
import { Calendar, Clock, Zap } from 'lucide-react';

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

  // Media Archive state managers
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [listingsSearch, setListingsSearch] = useState('');
  const [listingsStatusFilter, setListingsStatusFilter] = useState<'all' | 'scheduled' | 'processing' | 'delivered'>('all');

  // Referral Draft
  const [newReferral, setNewReferral] = useState({ name: '', phone: '', email: '', notes: '' });
  const [showReferralForm, setShowReferralForm] = useState(false);

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleCopyShareLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/listing/${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Shareable property catalog node link copied!");
    });
  };

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
    // To prevent massive document over-fetching and minimize Firestore read costs, we fetch listings in a standard query
    // and limit the admin query to the most recent 200 items. Clients stay restricted to their actual specific profiles.
    const listingsQuery = currentUser.uid === auth.currentUser?.uid && (isAdmin || userProfile?.role === 'admin') 
      ? query(collection(db, 'portfolio_items'), limit(200)) // Admins view top 200 items to optimize billing
      : query(
          collection(db, 'portfolio_items'), 
          or(
            where('partnerUids', 'array-contains', currentUser.uid),
            where('teamId', '==', userProfile?.teamId || 'NONE')
          )
        );
    
    const fetchListings = async () => {
      try {
        const snapshot = await getDocs(listingsQuery);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListings(list);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'portfolio_items');
      }
    };
    fetchListings();

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
      unSubTeam();
      unSubTeamMembers();
      unSubResources();
    };
  }, [currentUser, userProfile?.teamId]);

  // Aggressive cover preloading hook removed to optimize memory allocation and eliminate massive data transfers

  // Preload all preview/gallery assets when a listing is clicked and selected, so switching inside the popup modal is instantaneous
  useEffect(() => {
    if (selectedListing) {
      const hasThumb = selectedListing.previewThumbnails && selectedListing.previewThumbnails.length > 0;
      const hasGall = selectedListing.gallery && selectedListing.gallery.length > 0;
      const srcArr = hasThumb ? selectedListing.previewThumbnails : (hasGall ? selectedListing.gallery : [selectedListing.img]);
      const urls = srcArr.filter(Boolean);
      urls.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [selectedListing]);

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
        const adminEmail = settings.portalNotifyEmail || settings.contactInfo?.email || 'jasonmurdy@gmail.com';
        
        // 1. Send detailed referral alert to Admin Team
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: adminEmail,
            subject: `New Partner Referral Submitted: ${newReferral.name}`,
            body: `
              <h3>New Partner Referral Submitted</h3>
              <p>A new client referral has been registered through the Partner Portal by <strong>${userProfile?.displayName || currentUser?.email}</strong>.</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
              
              <h4 style="margin-bottom: 12px; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; color: #555;">Referral Contact Details</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666; width: 35%; font-size: 13px;">Referral Agent Name:</td>
                  <td style="padding: 8px 0; font-size: 13px;">${newReferral.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666; font-size: 13px;">Email Address:</td>
                  <td style="padding: 8px 0; font-size: 13px;"><a href="mailto:${newReferral.email || ''}" style="color: #c43b2a; text-decoration: none;">${newReferral.email || 'Not provided'}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666; font-size: 13px;">Phone Contact:</td>
                  <td style="padding: 8px 0; font-size: 13px;">${newReferral.phone || 'Not provided'}</td>
                </tr>
              </table>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
              
              <div style="margin: 20px 0; padding: 15px; border-left: 3px solid #c43b2a; background-color: #fafafa; border-radius: 2px;">
                <p style="margin: 0; font-weight: bold; font-size: 10px; text-transform: uppercase; color: #c43b2a; letter-spacing: 0.1em;">Strategic Referral Notes:</p>
                <p style="margin: 8px 0 0 0; font-style: italic; font-size: 13px; color: #2c3e50; line-height: 1.5;">"${newReferral.notes || 'No additional notes provided.'}"</p>
              </div>
              
              <p style="font-size: 11px; color: #888; margin-top: 30px;">
                This referral entry has been locked and archived in your internal database pipeline for automated rewards tracking.
              </p>
            `,
            type: "referral_notification"
          })
        });

        // 2. Clear receipt email confirmation directly to the Submitting Partner
        if (currentUser?.email) {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: currentUser.email,
              subject: `Referral Submission Confirmed - ${newReferral.name}`,
              body: `
                <h3>Referral Submission Confirmed</h3>
                <p>Hello ${userProfile?.displayName || 'Partner'},</p>
                <p>We've successfully received and logged the new client referral you submitted in your Brand Hub portal. Thank you for connecting us with your network!</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                
                <h4 style="margin-bottom: 12px; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; color: #555;">Logged Referral Details</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666; width: 35%; font-size: 13px;">Agent Name:</td>
                    <td style="padding: 8px 0; font-size: 13px;">${newReferral.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666; font-size: 13px;">Email Address:</td>
                    <td style="padding: 8px 0; font-size: 13px;">${newReferral.email || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666; font-size: 13px;">Phone Contact:</td>
                    <td style="padding: 8px 0; font-size: 13px;">${newReferral.phone || 'Not provided'}</td>
                  </tr>
                </table>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                
                <p style="font-size: 13px; line-height: 1.6; color: #333;">Our account managers are initiating contact immediately. You can track this client's onboarding progress and view pending rewards at any time inside your <strong>Referral Tracker</strong> dashboard.</p>
                
                <p style="margin-top: 25px; margin-bottom: 0; font-size: 13px; font-weight: 500; color: #555;">Best regards,</p>
                <p style="margin: 4px 0 0 0; color: #c43b2a; font-weight: bold; font-size: 14px;">The Broker Support Team</p>
              `,
              type: "referral_receipt"
            })
          });
        }
      } catch (e) {
        console.error("Failed to send referral notification emails", e);
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
                   className="space-y-8"
                >
                  <header className="space-y-4">
                     <h1 className="font-display text-5xl md:text-7xl lowercase italic mt-12 md:mt-0">Media Archive<span className="text-brick-copper">.</span></h1>
                     <p className="text-sm text-text-primary/50 max-w-xl font-light">
                       Access, search, and download your scheduled, in-production, and historically delivered architectural visual assets in a consolidated tabular catalog.
                     </p>
                  </header>

                  {(() => {
                    const scheduledCount = listings.filter(item => item.status?.toLowerCase() === 'scheduled').length;
                    const processingCount = listings.filter(item => item.status?.toLowerCase() === 'processing').length;
                    const deliveredCount = listings.filter(item => 
                      item.status?.toLowerCase() === 'completed' || 
                      item.status?.toLowerCase() === 'active' || 
                      item.status?.toLowerCase() === 'sold' || 
                      item.status?.toLowerCase() === 'pending' || 
                      !item.status
                    ).length;

                    const filteredListings = listings.filter(item => {
                      // 1. Search Query Match
                      const queryStr = listingsSearch.toLowerCase().trim();
                      const matchSearch = !queryStr || (
                        (item.title || '').toLowerCase().includes(queryStr) ||
                        (item.address || '').toLowerCase().includes(queryStr) ||
                        (item.city || '').toLowerCase().includes(queryStr) ||
                        (item.mlsNumber || '').toLowerCase().includes(queryStr) ||
                        (item.category || '').toLowerCase().includes(queryStr)
                      );

                      // 2. Status Filter Match
                      const statusVal = (item.status || 'delivered').toLowerCase();
                      let matchStatus = true;
                      if (listingsStatusFilter === 'scheduled') {
                        matchStatus = statusVal === 'scheduled';
                      } else if (listingsStatusFilter === 'processing') {
                        matchStatus = statusVal === 'processing';
                      } else if (listingsStatusFilter === 'delivered') {
                        matchStatus = statusVal === 'completed' || statusVal === 'active' || statusVal === 'sold' || statusVal === 'pending' || !item.status;
                      }

                      return matchSearch && matchStatus;
                    });

                    return (
                      <div className="space-y-6">
                        {/* Control Bar: Flexible Search & Filter Navigation */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-text-primary/[0.02] border border-white/5 p-4 rounded-sm">
                          {/* Search Input */}
                          <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                              <Search size={14} />
                            </span>
                            <input
                              type="text"
                              value={listingsSearch}
                              onChange={(e) => setListingsSearch(e.target.value)}
                              placeholder="Search address, MLS#, or category..."
                              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/35 text-xs pl-9 pr-4 py-2.5 rounded-sm focus:border-brick-copper focus:outline-none transition-colors"
                            />
                            {listingsSearch && (
                              <button 
                                onClick={() => setListingsSearch('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          {/* Quick Filter Tabs */}
                          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                            <button
                              onClick={() => setListingsStatusFilter('all')}
                              className={`px-3 py-2 text-[10px] tracking-wider uppercase font-bold transition-all rounded-xs flex items-center gap-1.5 ${listingsStatusFilter === 'all' ? 'bg-brick-copper text-charcoal' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                            >
                              All Assets <span className="text-[8px] font-mono opacity-60 bg-black/15 px-1.5 py-0.5 rounded-sm">{listings.length}</span>
                            </button>
                            <button
                              onClick={() => setListingsStatusFilter('scheduled')}
                              className={`px-3 py-2 text-[10px] tracking-wider uppercase font-bold transition-all rounded-xs flex items-center gap-1.5 ${listingsStatusFilter === 'scheduled' ? 'bg-amber-500 text-charcoal' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                            >
                              Scheduled <span className="text-[8px] font-mono opacity-60 bg-black/15 px-1.5 py-0.5 rounded-sm">{scheduledCount}</span>
                            </button>
                            <button
                              onClick={() => setListingsStatusFilter('processing')}
                              className={`px-3 py-2 text-[10px] tracking-wider uppercase font-bold transition-all rounded-xs flex items-center gap-1.5 ${listingsStatusFilter === 'processing' ? 'bg-yellow-400 text-charcoal animation-pulse' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                            >
                              In Production <span className="text-[8px] font-mono opacity-60 bg-black/15 px-1.5 py-0.5 rounded-sm">{processingCount}</span>
                            </button>
                            <button
                              onClick={() => setListingsStatusFilter('delivered')}
                              className={`px-3 py-2 text-[10px] tracking-wider uppercase font-bold transition-all rounded-xs flex items-center gap-1.5 ${listingsStatusFilter === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                            >
                              Delivered <span className="text-[8px] font-mono opacity-60 bg-black/15 px-1.5 py-0.5 rounded-sm">{deliveredCount}</span>
                            </button>
                          </div>
                        </div>

                        {/* List / Table Implementation */}
                        {filteredListings.length === 0 ? (
                          <div className="bg-text-primary/[0.01] border border-border-subtle p-16 text-center rounded-sm">
                            <p className="text-[10px] uppercase tracking-wider text-text-primary/30 mb-2">No matching archive assets found.</p>
                            <p className="text-[8px] text-text-primary/20 tracking-normal font-mono mb-4">Try refining your selection filters or search terms.</p>
                            <button 
                              onClick={() => { setListingsSearch(''); setListingsStatusFilter('all'); }}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-bold text-[9px] uppercase tracking-widest text-text-primary/70"
                            >
                              Reset Active Filter
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Desktops / Tables View */}
                            <div className="hidden md:block overflow-x-auto border border-border-subtle bg-bg-primary/40 rounded-sm">
                              <table className="min-w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-border-subtle bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] text-text-primary/40 font-bold">Property Resource</th>
                                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] text-text-primary/40 font-bold">MLS / Ref #</th>
                                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] text-text-primary/40 font-bold text-center">Category</th>
                                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] text-text-primary/40 font-bold">Shoot / Delivery</th>
                                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] text-text-primary/40 font-bold text-center">Status</th>
                                    <th className="px-6 py-4 text-right text-[9px] uppercase tracking-[0.2em] text-text-primary/40 font-bold pr-8">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {filteredListings.map(item => {
                                    const statusVal = (item.status || 'delivered').toLowerCase();
                                    const isScheduled = statusVal === 'scheduled';
                                    const isProcessing = statusVal === 'processing';
                                    const isDelivered = !isScheduled && !isProcessing;

                                    return (
                                      <tr 
                                        key={item.id} 
                                        onClick={() => setSelectedListing(item)}
                                        className="hover:bg-white/[0.02] active:bg-white/[0.04] cursor-pointer transition-colors group"
                                      >
                                        {/* Property Column */}
                                        <td className="px-6 py-4">
                                          <div className="flex items-center gap-4">
                                            <div className="w-14 h-10 bg-charcoal border border-white/10 rounded-xs overflow-hidden flex-shrink-0 relative">
                                              {item.img ? (
                                                <img src={item.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" referrerPolicy="no-referrer" />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[8px] text-white/30 uppercase tracking-widest font-mono">Photo</div>
                                              )}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-xs font-bold text-text-primary group-hover:text-brick-copper transition-colors truncate max-w-[200px]">{item.title}</p>
                                              <p className="text-[10px] text-text-primary/40 truncate max-w-[200px]">{item.address || 'Address TBD'}</p>
                                            </div>
                                          </div>
                                        </td>

                                        {/* MLS / ID Column */}
                                        <td className="px-6 py-4 font-mono text-[10px] text-text-primary/60">
                                          {item.mlsNumber ? `#${item.mlsNumber}` : `#LN-${item.id.substring(0, 8).toUpperCase()}`}
                                        </td>

                                        {/* Category Column */}
                                        <td className="px-6 py-4 text-center">
                                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-white/5 bg-white/[0.02] text-text-primary/50 font-medium">
                                            {item.category || 'Architecture'}
                                          </span>
                                        </td>

                                        {/* Date Column */}
                                        <td className="px-6 py-4 text-xs font-mono text-text-primary/60">
                                          {formatDateStr(item.scheduledDate || item.date)}
                                        </td>

                                        {/* Status Column */}
                                        <td className="px-6 py-4 text-center">
                                          <div className="flex justify-center">
                                            {isScheduled ? (
                                              <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-widest px-2.5 py-0.5 border border-amber-500/20 text-amber-500 bg-amber-500/5 font-bold rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Scheduled
                                              </span>
                                            ) : isProcessing ? (
                                              <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-widest px-2.5 py-0.5 border border-yellow-500/30 text-yellow-400 bg-yellow-500/5 font-bold rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> Darkroom
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-widest px-2.5 py-0.5 border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 font-bold rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Delivered
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        {/* Actions Column */}
                                        <td className="px-6 py-4 text-right pr-8">
                                          <div className="flex items-center justify-end gap-2.5">
                                            <button 
                                              type="button"
                                              onClick={(e) => handleCopyShareLink(item.id, e)}
                                              className="p-1 px-2 border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/5 text-text-primary/40 hover:text-white transition-all text-[8px] uppercase tracking-wider font-mono flex items-center gap-1 rounded-sm"
                                              title="Copy direct share links to clipboard"
                                            >
                                              <Share2 size={10} /> Link
                                            </button>
                                            {(() => {
                                              const tableAssetUrl = item.fotelloUrl || item.externalLink || item.matterportUrl || item.url || item.specsUrl || item.img;
                                              if (tableAssetUrl && tableAssetUrl.startsWith('http')) {
                                                return (
                                                  <a 
                                                    href={tableAssetUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 bg-white/5 hover:bg-brick-copper border border-white/10 hover:border-transparent text-white/60 hover:text-charcoal hover:scale-105 rounded-full transition-all flex items-center justify-center shadow-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Directly access asset package / source link in a new tab"
                                                  >
                                                    <ExternalLink size={11} />
                                                  </a>
                                                );
                                              }
                                              return null;
                                            })()}
                                            <button 
                                              type="button"
                                              className="p-1.5 bg-brick-copper hover:bg-white text-charcoal hover:scale-105 rounded-full transition-all flex items-center justify-center shadow-sm"
                                              onClick={(e) => { e.stopPropagation(); setSelectedListing(item); }}
                                              title="Inspect listing details & asset catalog"
                                            >
                                              <Eye size={11} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile User-Friendly Responsive Cards Layout */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                              {filteredListings.map(item => {
                                const statusVal = (item.status || 'delivered').toLowerCase();
                                const isScheduled = statusVal === 'scheduled';
                                const isProcessing = statusVal === 'processing';

                                return (
                                  <div 
                                    key={item.id}
                                    onClick={() => setSelectedListing(item)}
                                    className="bg-bg-primary border border-border-subtle p-4 rounded-sm flex flex-col justify-between hover:border-brick-copper/30 transition-all active:bg-text-primary/[0.01] relative overflow-hidden group"
                                  >
                                    <div className="flex gap-3.5 items-start">
                                      <div className="w-16 h-12 bg-charcoal border border-white/5 rounded-xs overflow-hidden flex-shrink-0">
                                        {item.img ? (
                                          <img src={item.img} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                                        ) : (
                                          <div className="w-full h-full bg-white/5" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-brick-copper uppercase font-mono tracking-widest">{item.category || 'Architecture'}</p>
                                        <p className="text-sm font-bold text-text-primary mt-0.5 truncate">{item.title}</p>
                                        <p className="text-[10px] text-text-primary/40 truncate">{item.address || 'Address TBD'}</p>
                                      </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                      <div>
                                        <span className="text-[9px] text-text-primary/30 block tracking-wider font-mono">DATE</span>
                                        <span className="text-[10px] text-text-primary/60 font-mono font-bold">{formatDateStr(item.scheduledDate || item.date)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isScheduled ? (
                                          <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 border border-amber-500/20 text-amber-500 bg-amber-500/5 font-bold rounded-full">
                                            Scheduled
                                          </span>
                                        ) : isProcessing ? (
                                          <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 border border-yellow-500/30 text-yellow-400 bg-yellow-500/5 font-bold rounded-full animate-pulse">
                                            Darkroom
                                          </span>
                                        ) : (
                                          <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 font-bold rounded-full">
                                            Delivered
                                          </span>
                                        )}
                                        <ChevronRight size={14} className="text-text-primary/30 group-hover:text-brick-copper transition-colors" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* HIGH-FIDELITY INTERACTIVE PREVIEW POPUP MODAL */}
            <AnimatePresence>
              {selectedListing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 lg:p-12"
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-charcoal border border-white/10 w-full max-w-5xl h-full max-h-[90vh] md:max-h-[85vh] rounded-sm flex flex-col md:flex-row overflow-hidden shadow-2xl relative text-left"
                  >
                    {/* Close Control Top-Right */}
                    <button 
                      onClick={() => setSelectedListing(null)}
                      className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/50 hover:bg-brick-copper border border-white/10 flex items-center justify-center text-white hover:text-charcoal transition-all rounded-xs"
                    >
                      <X size={16} />
                    </button>

                    {/* Media Show Area (Left Frame) */}
                    <div className="w-full md:w-3/5 bg-black/40 border-r border-white/5 flex flex-col p-6 overflow-y-auto no-scrollbar justify-center min-h-[250px] md:min-h-0">
                      {(() => {
                        const hasThumb = selectedListing.previewThumbnails && selectedListing.previewThumbnails.length > 0;
                        const hasGall = selectedListing.gallery && selectedListing.gallery.length > 0;
                        const srcArr = hasThumb ? selectedListing.previewThumbnails : (hasGall ? selectedListing.gallery : [selectedListing.img]);
                        const galleryItems = srcArr.filter(Boolean).map((url: string) => ({
                          url,
                          portfolioId: selectedListing.id,
                          portfolioTitle: selectedListing.title,
                          category: selectedListing.category
                        }));

                        if (galleryItems.length > 0) {
                          return (
                            <div className="space-y-4">
                              <DynamicCuratedGallery 
                                title={`Asset Catalog Preview`}
                                subtitle="Live high-fidelity imagery CDN server sync stream"
                                images={galleryItems}
                                layout="grid"
                                columns={galleryItems.length > 3 ? 4 : 3}
                                aspectRatio="16/9"
                                grayscaleEffect="hover-color"
                                lightbox={true}
                                hideOverlays={true}
                                minimalGap={true}
                              />
                              <p className="text-[9px] uppercase tracking-widest text-white/30 text-center select-none font-mono">
                                Interactive Sandbox: Click thumbnail tiles to toggle preview lightbox view mode.
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="w-full text-center py-12 space-y-3">
                              <ImageIcon size={32} className="mx-auto text-brick-copper/40 animate-pulse" />
                              <div className="space-y-1">
                                <p className="text-[10px] tracking-widest uppercase font-mono text-white/40">Visual Cache Processing</p>
                                <p className="text-[11px] text-white/60 font-light max-w-xs mx-auto">
                                  Currently aligning property coordinates with CDN image servers. Direct asset folders are linked on the specifications sidebar.
                                </p>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    {/* Specifications Details Area (Right Frame) */}
                    <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-bg-primary/95">
                      <div className="space-y-6">
                        <div className="space-y-1.5 border-b border-white/5 pb-4">
                          <span className="text-[8px] uppercase px-2 py-0.5 rounded-sm border border-brick-copper/20 text-brick-copper bg-brick-copper/5 font-black tracking-[0.2em]">
                            {selectedListing.category || 'Architecture'}
                          </span>
                          <h2 className="text-3xl font-display lowercase italic tracking-tight text-white mt-2 leading-tight">
                            {selectedListing.title}
                          </h2>
                          <p className="text-xs text-text-primary/40 font-mono tracking-tight">{selectedListing.address || 'Address pending setup'}{selectedListing.city ? `, ${selectedListing.city}` : ''}</p>
                        </div>

                        {/* Property Specs Monospace Matrix */}
                        <div className="grid grid-cols-2 gap-3.5 bg-black/20 p-3.5 border border-white/5 rounded-xs font-mono text-[9px]">
                          <div>
                            <span className="text-white/30 block uppercase tracking-wider">SYSTEM RESOURCE ID</span>
                            <span className="text-white font-bold">{selectedListing.id.substring(0, 10).toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-white/30 block uppercase tracking-wider">REALTOR / MLS REF</span>
                            <span className="text-white font-bold">{selectedListing.mlsNumber ? `#${selectedListing.mlsNumber}` : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-white/30 block uppercase tracking-wider">RESOURCE ASSIGNMENT</span>
                            <span className="text-brick-copper font-bold uppercase">Direct Hub Partner</span>
                          </div>
                          <div>
                            <span className="text-white/30 block uppercase tracking-wider">PRODUCTION STAGE</span>
                            <span className="text-emerald-400 font-bold uppercase">{selectedListing.status || 'Delivered'}</span>
                          </div>
                        </div>

                        {/* Copy details */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-primary/40 font-mono">Production Narrative</h4>
                          <p className="text-xs text-text-primary/60 leading-relaxed font-light">
                            {selectedListing.description || 'Fully custom visual media suite processed, graded, and optimized for strategic property marketing deployments.'}
                          </p>
                        </div>
                      </div>

                      {/* Download/Copy Direct Hub Links */}
                      <div className="pt-6 border-t border-white/5 mt-8 space-y-3.5">
                        {(() => {
                          const linksToRender = [];
                          if (selectedListing.fotelloUrl) {
                            linksToRender.push({
                              url: selectedListing.fotelloUrl,
                              label: "Access Complete Media Package",
                              type: "external"
                            });
                          }
                          if (selectedListing.externalLink) {
                            linksToRender.push({
                              url: selectedListing.externalLink,
                              label: "View Listing Agent Page",
                              type: "external"
                            });
                          }
                          const mUrl = selectedListing.matterportUrl || selectedListing.url;
                          if (mUrl && mUrl.startsWith('http')) {
                            linksToRender.push({
                              url: mUrl,
                              label: "Launch Virtual Matterport 3D Tour",
                              type: "external"
                            });
                          }
                          if (selectedListing.specsUrl) {
                            linksToRender.push({
                              url: selectedListing.specsUrl,
                              label: "Download Specifications PDF",
                              type: "external"
                            });
                          }

                          // If totally empty, implement robust fallback to image asset or listing showcase page
                          if (linksToRender.length === 0) {
                            if (selectedListing.img) {
                              linksToRender.push({
                                url: selectedListing.img,
                                label: "Download Property Cover Photo",
                                type: "external"
                              });
                            } else {
                              linksToRender.push({
                                url: `/listing/${selectedListing.id}`,
                                label: "View Public Showcase Page",
                                type: "internal"
                              });
                            }
                          }

                          return (
                            <div className="space-y-2.5">
                              {linksToRender.map((linkItem, idx) => (
                                <LinkButton
                                  key={idx}
                                  link={linkItem}
                                  variant={idx === 0 ? "solid" : "outline"}
                                  className={`w-full py-2.5 shadow-sm hover:shadow-md text-[10px] tracking-widest font-black uppercase text-center block rounded-xs transition-colors ${
                                    idx === 0 
                                      ? "bg-brick-copper hover:bg-white text-charcoal" 
                                      : "bg-transparent border border-brick-copper/40 hover:border-brick-copper text-brick-copper hover:text-white"
                                  }`}
                                />
                              ))}
                              <p className="text-[8px] font-mono text-white/30 text-center mt-2">
                                Safe verification links directed to primary high-speed content delivery networks.
                              </p>
                            </div>
                          );
                        })()}

                        {/* Share Page & Close Matrix */}
                        <div className="flex justify-between items-center gap-4 pt-2">
                          <button 
                            type="button"
                            onClick={(e) => handleCopyShareLink(selectedListing.id, e)}
                            className="text-[9px] uppercase tracking-widest font-bold font-mono text-text-primary/55 hover:text-white flex items-center gap-1.5 transition-colors"
                          >
                            <Share2 size={12} /> Clipboard share links
                          </button>
                          <Link 
                            to={`/listing/${selectedListing.id}`}
                            className="text-[9px] uppercase tracking-widest font-bold font-mono text-brick-copper hover:text-white hover:underline transition-colors flex items-center gap-1"
                          >
                            Public Page <ChevronRight size={10} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
