/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { auth, db, storage } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { useSiteContent } from '../lib/SiteContentContext';
import { 
  LogOut, Plus, Trash2, Edit2, Check, X, Shield, Sparkles, Upload, 
  Layout, MoveUp, MoveDown, Compass, Save, Palette, Type, Globe, 
  Users, MessageSquare, Briefcase, FileText, Settings, Instagram, 
  Twitter, Linkedin, Facebook, Mail, Phone, MapPin, Loader2, Box
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { GoogleGenAI } from '@google/genai';
import { PuckEditor } from './PuckEditor';

const ADMIN_EMAILS = ['jasonmurdy@gmail.com', 'sherwin.131986@gmail.com'];

// Initialize Gemini on the frontend as per system instructions
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const AdminDashboard = ({ onClose }: { onClose: () => void }) => {
  const [user, setUser] = useState<any>(null);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'aesthetics' | 'journal' | 'services' | 'exchange' | 'narratives' | 'layout'>('architecture');
  const [showPuck, setShowPuck] = useState(false);

  const { settings, pages } = useSiteContent();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email)) return;

    const qPortfolio = query(collection(db, 'portfolio_items'), orderBy('order', 'asc'));
    const unsubPortfolio = onSnapshot(qPortfolio, (snap) => {
      setPortfolioItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qServices = query(collection(db, 'services'), orderBy('order', 'asc'));
    const unsubServices = onSnapshot(qServices, (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qInquiries = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubInquiries = onSnapshot(qInquiries, (snap) => {
      setInquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubPortfolio();
      unsubServices();
      unsubInquiries();
    };
  }, [user]);

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  if (!user) {
    return (
      <div className="fixed inset-0 bg-charcoal z-[100] flex flex-col items-center justify-center p-6">
        <Shield size={48} className="text-brick-copper mb-8" />
        <h2 className="font-display text-4xl mb-8">Admin Gateway</h2>
        <button 
          onClick={login}
          className="px-12 py-4 bg-brick-copper text-charcoal font-semibold uppercase tracking-widest hover:bg-off-white transition-all"
        >
          Identify as Admin
        </button>
        <button onClick={onClose} className="mt-8 text-off-white/40 uppercase text-[10px] tracking-widest hover:text-off-white">Return to Site</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-charcoal z-[100] flex flex-col items-center justify-center p-6">
        <h2 className="font-display text-2xl mb-4 text-error">Access Refused</h2>
        <p className="text-off-white/60 mb-8">This portal is reserved for high-fidelity administrators.</p>
        <button onClick={logout} className="px-8 py-3 bg-red-900/20 text-red-500 border border-red-500/30 uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all">Sign Out</button>
        <button onClick={onClose} className="mt-8 text-off-white/40 uppercase text-[10px] tracking-widest">Close</button>
      </div>
    );
  }

  const logAction = async (action: string, details: any) => {
    try {
      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details, user: user.email })
      });
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  const handleCreatePortfolio = async () => {
    const newItem = {
      title: 'New Project',
      category: 'Residential',
      description: 'A study in light and space.',
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      gallery: [],
      order: portfolioItems.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'portfolio_items'), newItem);
    await logAction('CREATE_PORTFOLIO', { title: newItem.title });
    setIsEditing(docRef.id);
    setEditData({ id: docRef.id, ...newItem });
  };

  async function handleUpdatePortfolio(id: string) {
    const docRef = doc(db, 'portfolio_items', id);
    const { id: _, createdAt: __, ...dataToUpdate } = editData;
    await updateDoc(docRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp()
    });
    await logAction('UPDATE_PORTFOLIO', { id, title: editData.title });
    setIsEditing(null);
  }

  const handleCreateService = async () => {
    const newService = {
      title: 'New Offering',
      description: 'Describe the value proposition...',
      price: '$500+',
      order: services.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await addDoc(collection(db, 'services'), newService);
    await logAction('CREATE_SERVICE', { title: newService.title });
  };

  const handleUpdateService = async (id: string) => {
    const docRef = doc(db, 'services', id);
    const { id: _, createdAt: __, ...dataToUpdate } = editData;
    await updateDoc(docRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp()
    });
    await logAction('UPDATE_SERVICE', { id, title: editData.title });
    setIsEditing(null);
  };

  const handleDeleteService = async (id: string) => {
    if (confirm('Erase this service tier?')) {
      try {
        await deleteDoc(doc(db, 'services', id));
        await logAction('DELETE_SERVICE', { id });
      } catch (err) {
        console.error("Failed to delete service:", err);
        alert("Action restricted: Service deletion failed.");
      }
    }
  };

  const handleUpdateSettings = async () => {
    setIsSaving(true);
    try {
      const { updatedAt: _, ...settingsToSave } = localSettings;
      await setDoc(doc(db, 'settings', 'site'), {
        ...settingsToSave,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await logAction('UPDATE_SETTINGS', { localSettings });
      setSaveSuccess(true);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePage = async () => {
    const newPage = {
      title: 'New Narrative',
      slug: 'new-narrative-' + Date.now(),
      content: '# New Narrative\n\nBegin your story here...',
      showInNav: true,
      order: pages.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await addDoc(collection(db, 'pages'), newPage);
    await logAction('CREATE_PAGE', { title: newPage.title });
  };

  const handleUpdatePage = async (id: string) => {
    const docRef = doc(db, 'pages', id);
    const { id: _, createdAt: __, ...dataToUpdate } = editData;
    await updateDoc(docRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp()
    });
    await logAction('UPDATE_PAGE', { id, title: editData.slug });
    setIsEditing(null);
  };

  const handleDeletePage = async (id: string) => {
    if (confirm('Erase this entire narrative?')) {
      await deleteDoc(doc(db, 'pages', id));
      await logAction('DELETE_PAGE', { id });
    }
  };

  const getAiSuggestion = async (prompt: string, context?: string) => {
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${prompt}\nContext: ${context || 'None'}\n\nStrict Tone: High-end, minimalist architectural media agency.`,
      });
      return response.text || 'No suggestion received.';
    } catch (err) {
      console.error(err);
      return 'AI suggestion unavailable.';
    } finally {
      setIsGenerating(false);
    }
  };

  async function handleDeletePortfolio(id: string) {
    if (confirm('Erase this project narrative?')) {
      await deleteDoc(doc(db, 'portfolio_items', id));
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal z-[100] flex flex-col p-8 md:p-16 overflow-y-auto no-scrollbar">
      {showPuck && <PuckEditor onClose={() => setShowPuck(false)} />}
      
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-8 border-b border-white/10 pb-8">
        <div>
          <h2 className="font-display text-3xl md:text-4xl mb-2 italic">Command Center</h2>
          <p className="text-brick-copper text-[10px] uppercase tracking-[0.3em] font-medium">Administrator Panel: {user.email}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleUpdateSettings} 
            disabled={isSaving}
            className={`px-6 md:px-8 py-3 uppercase tracking-widest text-[10px] font-bold transition-all flex items-center gap-2 ${
              saveSuccess 
                ? 'bg-green-500 text-white' 
                : isSaving 
                  ? 'bg-brick-copper/50 text-charcoal/50 cursor-wait' 
                  : 'bg-brick-copper text-charcoal hover:bg-off-white'
            }`}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? 'Persisting...' : saveSuccess ? 'Changes Captured' : 'Commit Changes'}
          </button>
          <button onClick={onClose} className="px-6 md:px-8 py-3 bg-white/5 border border-white/10 text-off-white/60 uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Relinquish</button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-12 mb-12 border-b border-white/5 pb-4">
        {[
          { id: 'architecture', label: 'Architecture', icon: Compass },
          { id: 'layout', label: 'Layout Engine', icon: Layout },
          { id: 'aesthetics', label: 'Aesthetics', icon: Palette },
          { id: 'journal', label: 'Journal', icon: Layout },
          { id: 'services', label: 'Offerings', icon: Briefcase },
          { id: 'exchange', label: 'Exchange', icon: MessageSquare },
          { id: 'narratives', label: 'Narratives', icon: FileText }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setIsEditing(null); }}
            className={`text-[10px] uppercase tracking-[0.4em] transition-all flex items-center gap-3 ${
              activeTab === tab.id ? 'text-brick-copper border-b border-brick-copper pb-2 -mb-[17px]' : 'text-white/40 hover:text-white'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-16 pb-32">
        {activeTab === 'layout' && (
          <section className="space-y-12">
            <div className="bg-brick-copper/5 border border-brick-copper/20 p-12 flex flex-col items-center text-center">
              <Layout size={48} className="text-brick-copper mb-6" />
              <h3 className="font-display text-4xl mb-4 italic">Visual Builder</h3>
              <p className="text-white/40 text-sm max-w-xl mb-8 leading-relaxed">
                Orchestrate your high-fidelity narrative using a block-based visual engine. 
                Arrange, redefine, and persist your brand's digital presence with precision.
              </p>
              <button 
                onClick={() => setShowPuck(true)}
                className="px-12 py-4 bg-brick-copper text-charcoal font-bold uppercase tracking-widest hover:bg-white transition-all shadow-2xl"
              >
                Launch Engine
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 p-8 border border-white/10">
                <h4 className="text-[10px] uppercase tracking-widest text-brick-copper mb-4">Draft Status</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  Active Layout: {localSettings.layout ? 'Custom Orchestration' : 'Standard Baseline'}
                </p>
              </div>
              <div className="bg-white/5 p-8 border border-white/10">
                <h4 className="text-[10px] uppercase tracking-widest text-brick-copper mb-4">Engine Specs</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  Powered by Puck @measured/puck v0.x
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'architecture' && (
          <section className="space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="flex items-center gap-3 text-brick-copper mb-6">
                  <Compass size={18} />
                  <h3 className="text-xl font-display italic">Stage Assembly</h3>
                </div>
                
                <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Hero Environment</h4>
                  <FileUpload 
                    label="Hero Cinema (Image)"
                    path="hero"
                    onUploadComplete={(url) => setLocalSettings(prev => ({ ...prev, heroImage: url }))}
                  />
                  {localSettings.heroImage && (
                    <div className="relative h-48 w-full border border-white/10 overflow-hidden mt-4 group">
                      <img src={localSettings.heroImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  
                  <div className="space-y-4 pt-6">
                    <label className="text-[10px] uppercase tracking-widest text-white/30 block">Narrative Alignment</label>
                    <div className="flex gap-4">
                      {['left', 'center'].map(align => (
                        <button 
                          key={align}
                          onClick={() => setLocalSettings({...localSettings, heroAlignment: align as any})}
                          className={`flex-1 py-3 text-[10px] uppercase tracking-widest border transition-all ${localSettings.heroAlignment === align ? 'bg-brick-copper text-charcoal border-brick-copper font-bold' : 'border-white/10 text-white/40 hover:border-white/20'}`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Home Orchestration</h4>
                  <div className="space-y-2">
                    {(localSettings.homeSectionsOrder || ['portfolio', 'services']).map((section, idx) => (
                      <div key={section} className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 group">
                        <div className="flex items-center gap-4">
                          <span className="text-white/20 font-mono text-[10px]">0{idx + 1}</span>
                          <span className="text-[10px] uppercase tracking-widest">{section}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            disabled={idx === 0}
                            onClick={() => {
                              const newOrder = [...(localSettings.homeSectionsOrder || [])];
                              [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                              setLocalSettings({...localSettings, homeSectionsOrder: newOrder});
                            }}
                            className={`${idx === 0 ? 'text-white/5' : 'text-white/40 hover:text-brick-copper'}`}
                          >
                            <MoveUp size={14} />
                          </button>
                          <button 
                            disabled={idx === (localSettings.homeSectionsOrder?.length || 0) - 1}
                            onClick={() => {
                              const newOrder = [...(localSettings.homeSectionsOrder || [])];
                              [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
                              setLocalSettings({...localSettings, homeSectionsOrder: newOrder});
                            }}
                            className={`${idx === (localSettings.homeSectionsOrder?.length || 0) - 1 ? 'text-white/5' : 'text-white/40 hover:text-brick-copper'}`}
                          >
                            <MoveDown size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Identity Specs</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Hero Title Accent</label>
                      <input 
                        className="bg-transparent border-b border-white/10 w-full outline-none py-2 text-sm text-brick-copper" 
                        value={localSettings.heroTitleAccent} 
                        onChange={e => setLocalSettings({...localSettings, heroTitleAccent: e.target.value})} 
                        placeholder="e.g. Cinematic Visualization"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-3 text-brick-copper mb-6">
                  <Globe size={18} />
                  <h3 className="text-xl font-display italic">Global Footprint</h3>
                </div>

                <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Contact Coordinates</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-white/5 p-3 border border-white/5 focus-within:border-brick-copper transition-colors">
                      <Mail size={14} className="text-white/20" />
                      <input 
                        className="bg-transparent text-[10px] outline-none w-full" 
                        value={localSettings.contactInfo?.email} 
                        onChange={e => setLocalSettings({...localSettings, contactInfo: {...(localSettings.contactInfo || {email:'',phone:'',address:''}), email: e.target.value}})}
                        placeholder="email@agency.com"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 border border-white/5 focus-within:border-brick-copper transition-colors">
                      <Phone size={14} className="text-white/20" />
                      <input 
                        className="bg-transparent text-[10px] outline-none w-full" 
                        value={localSettings.contactInfo?.phone} 
                        onChange={e => setLocalSettings({...localSettings, contactInfo: {...(localSettings.contactInfo || {email:'',phone:'',address:''}), phone: e.target.value}})}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 border border-white/5 focus-within:border-brick-copper transition-colors">
                      <MapPin size={14} className="text-white/20" />
                      <input 
                        className="bg-transparent text-[10px] outline-none w-full" 
                        value={localSettings.contactInfo?.address} 
                        onChange={e => setLocalSettings({...localSettings, contactInfo: {...(localSettings.contactInfo || {email:'',phone:'',address:''}), address: e.target.value}})}
                        placeholder="123 Archive St..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Social Nodes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {(localSettings.socialLinks || []).map((link, idx) => (
                      <div key={link.id} className="bg-white/5 p-3 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-[8px] uppercase tracking-widest text-white/20">
                          <span>{link.platform}</span>
                        </div>
                        <input 
                          className="bg-transparent text-[9px] font-mono outline-none w-full border-b border-white/10 focus:border-brick-copper" 
                          value={link.url} 
                          onChange={e => {
                            const newSocial = [...(localSettings.socialLinks || [])];
                            newSocial[idx].url = e.target.value;
                            setLocalSettings({...localSettings, socialLinks: newSocial});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Header Links</h4>
                  <div className="space-y-4">
                    {(localSettings.navigationItems || []).sort((a,b) => a.order - b.order).map((item, idx) => (
                      <div key={item.id} className="bg-white/5 border border-white/5 p-4 flex flex-col gap-3 relative group">
                        <div className="flex justify-between items-center">
                          <input 
                            className="bg-transparent border-b border-white/10 text-[10px] uppercase tracking-widest outline-none w-1/2 p-1 focus:border-brick-copper transition-colors" 
                            value={item.label}
                            placeholder="Link Label"
                            onChange={e => {
                              const newItems = [...(localSettings.navigationItems || [])];
                              newItems[idx].label = e.target.value;
                              setLocalSettings({...localSettings, navigationItems: newItems});
                            }}
                          />
                          <button 
                            onClick={() => {
                              const newItems = (localSettings.navigationItems || []).filter(i => i.id !== item.id);
                              setLocalSettings({...localSettings, navigationItems: newItems});
                            }}
                            className="text-white/20 hover:text-red-500 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <input 
                          className="bg-transparent border-b border-white/10 text-[10px] font-mono text-white/40 outline-none w-full p-1 focus:border-brick-copper transition-colors" 
                          value={item.url}
                          placeholder="Path (/p/about) or External (https://...)"
                          onChange={e => {
                            const newItems = [...(localSettings.navigationItems || [])];
                            newItems[idx].url = e.target.value;
                            setLocalSettings({...localSettings, navigationItems: newItems});
                          }}
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newItems = [...(localSettings.navigationItems || [])];
                        newItems.push({ id: Date.now().toString(), label: 'New Exploration', url: '#', order: newItems.length });
                        setLocalSettings({...localSettings, navigationItems: newItems});
                      }}
                      className="w-full py-4 border border-dashed border-white/10 text-[9px] uppercase tracking-widest text-white/20 hover:border-brick-copper/50 hover:text-brick-copper transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add Navigation Node
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'aesthetics' && (
          <section className="space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="flex items-center gap-3 text-brick-copper mb-6">
                  <Type size={18} />
                  <h3 className="text-xl font-display italic">Typography & Tones</h3>
                </div>

                <div className="space-y-8 bg-white/[0.02] border border-white/5 p-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/60 block">Display Foundry (Headings)</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Prata', 'Playfair Display', 'Inter', 'Montserrat'].map(font => (
                        <button 
                          key={font}
                          onClick={() => setLocalSettings({...localSettings, fontTitle: font as any})}
                          className={`py-3 px-4 text-[11px] border transition-all text-left flex justify-between items-center ${localSettings.fontTitle === font ? 'border-brick-copper bg-brick-copper/10 text-brick-copper' : 'border-white/5 text-white/30 hover:border-white/20'}`}
                        >
                          <span style={{ fontFamily: font }}>{font}</span>
                          {localSettings.fontTitle === font && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/60 block">Body Foundry (Content)</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Montserrat', 'Inter', 'Open Sans'].map(font => (
                        <button 
                          key={font}
                          onClick={() => setLocalSettings({...localSettings, fontBody: font as any})}
                          className={`py-3 px-4 text-[11px] border transition-all text-left flex justify-between items-center ${localSettings.fontBody === font ? 'border-brick-copper bg-brick-copper/10 text-brick-copper' : 'border-white/5 text-white/30 hover:border-white/20'}`}
                        >
                          <span style={{ fontFamily: font }}>{font}</span>
                          {localSettings.fontBody === font && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8 bg-white/[0.02] border border-white/5 p-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/60 block">Brand Pigment (Accent)</label>
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <input 
                          type="color" 
                          value={localSettings.accentColor || '#A47149'} 
                          onChange={e => setLocalSettings({...localSettings, accentColor: e.target.value})}
                          className="bg-transparent border-none w-20 h-20 cursor-pointer rounded-none"
                        />
                      </div>
                      <div className="space-y-2 flex-grow">
                        <input 
                          type="text" 
                          value={localSettings.accentColor || '#A47149'} 
                          onChange={e => setLocalSettings({...localSettings, accentColor: e.target.value})}
                          className="bg-transparent border-b border-white/10 text-lg font-mono w-full outline-none focus:border-brick-copper p-2"
                        />
                        <p className="text-[9px] uppercase tracking-widest text-white/20">Hexadecimal Identity</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-3 text-brick-copper mb-6">
                  <Sparkles size={18} />
                  <h3 className="text-xl font-display italic">Branding Assets</h3>
                </div>

                <div className="space-y-8 bg-white/[0.02] border border-white/5 p-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <FileUpload 
                        label="Logo Spectrum (Light)"
                        path="logos"
                        onUploadComplete={(url) => setLocalSettings(prev => ({ ...prev, logoLight: url }))}
                      />
                      {localSettings.logoLight && (
                        <div className="h-20 bg-white flex items-center justify-center p-4 border border-white/5">
                          <img src={localSettings.logoLight} className="max-h-full object-contain" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <FileUpload 
                        label="Logo Spectrum (Dark)"
                        path="logos"
                        onUploadComplete={(url) => setLocalSettings(prev => ({ ...prev, logoDark: url }))}
                      />
                      {localSettings.logoDark && (
                        <div className="h-20 bg-charcoal flex items-center justify-center p-4 border border-white/5">
                          <img src={localSettings.logoDark} className="max-h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/60 block">Identity Status</label>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Brand Name</label>
                        <input 
                          className="bg-transparent border-b border-white/10 w-full outline-none py-2 text-lg tracking-[0.2em]" 
                          value={localSettings.brandName} 
                          onChange={e => setLocalSettings({...localSettings, brandName: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Monogram Text</label>
                        <input 
                          className="bg-transparent border-b border-white/10 w-full outline-none py-2 text-lg tracking-[0.3em]" 
                          value={localSettings.logoText} 
                          onChange={e => setLocalSettings({...localSettings, logoText: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Tagline</label>
                        <input 
                          className="bg-transparent border-b border-white/10 w-full outline-none py-2 text-xs" 
                          value={localSettings.tagline} 
                          onChange={e => setLocalSettings({...localSettings, tagline: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'services' && (
          <section>
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-brick-copper">
                <Briefcase size={18} />
                <h3 className="font-display text-2xl italic">Service Architecture</h3>
              </div>
              <button onClick={handleCreateService} className="text-brick-copper hover:text-off-white flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors">
                <Plus size={14} /> New Tier
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white/[0.02] border border-white/5 p-6 space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-white/40">Section Context</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Title</label>
                        <input className="bg-transparent border-b border-white/10 w-full outline-none py-2 text-sm" value={localSettings.servicesTitle} onChange={e => setLocalSettings({...localSettings, servicesTitle: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Subtitle</label>
                        <textarea className="bg-transparent border border-white/10 w-full outline-none p-4 text-xs h-24" value={localSettings.servicesSubtitle} onChange={e => setLocalSettings({...localSettings, servicesSubtitle: e.target.value})} />
                      </div>
                    </div>
                  </div>
               </div>

               <div className="lg:col-span-2 space-y-4">
                {services.map(tier => (
                  <div key={tier.id} className="bg-white/5 border border-white/5 p-6 group hover:border-brick-copper/30 transition-all">
                    {isEditing === tier.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input className="bg-transparent border-b border-white/10 w-full outline-none py-1 text-sm font-display italic" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="Tier Title" />
                          <input className="bg-transparent border-b border-white/10 w-full outline-none py-1 text-[10px] font-mono text-brick-copper" value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} placeholder="Project Pricing (e.g. $500)" />
                        </div>
                        <textarea className="bg-transparent border border-white/5 w-full h-24 p-4 text-xs font-mono" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} placeholder="Detailed value proposition..." />
                        <div className="flex gap-4 pt-4">
                          <button onClick={() => handleUpdateService(tier.id)} className="text-green-500 text-[10px] uppercase tracking-widest">Seal</button>
                          <button onClick={() => setIsEditing(null)} className="text-white/40 text-[10px] uppercase tracking-widest">Revert</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex-grow">
                          <div className="flex items-center gap-4 mb-2">
                            <h4 className="text-sm font-semibold">{tier.title}</h4>
                            <span className="text-[10px] bg-brick-copper/20 text-brick-copper px-2 py-0.5 border border-brick-copper/30">{tier.price}</span>
                          </div>
                          <p className="text-[10px] text-white/40 line-clamp-1">{tier.description}</p>
                        </div>
                        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all ml-8">
                          <button onClick={() => { setIsEditing(tier.id); setEditData(tier); }} className="text-white/20 hover:text-brick-copper"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteService(tier.id)} className="text-white/20 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {services.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/5 text-white/20">
                    <p className="text-[10px] uppercase tracking-[0.3em]">No services defined in the registry.</p>
                  </div>
                )}
               </div>
            </div>
          </section>
        )}

        {activeTab === 'journal' && (
          <section>
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-brick-copper">
                <Box size={18} />
                <h3 className="font-display text-2xl italic">Project Catalog</h3>
              </div>
              <button onClick={handleCreatePortfolio} className="text-brick-copper hover:text-off-white flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors font-bold">
                <Plus size={14} /> New Project
              </button>
            </div>
            <div className="space-y-6">
              {portfolioItems.map(item => (
                <div key={item.id} className="bg-white/5 border border-white/5 p-6 md:p-10 group hover:border-brick-copper/30 transition-all">
                  {isEditing === item.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <FileUpload 
                          label="Project Cinema"
                          path="portfolio"
                          onUploadComplete={(url) => setEditData({...editData, img: url})}
                        />
                        {(editData.img || item.img) && (
                          <div className="aspect-square rounded border border-white/10 overflow-hidden">
                            <img src={editData.img || item.img} className="w-full h-full object-cover" alt="Preview" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Project Identification</label>
                            <input 
                              className="bg-transparent border-b border-brick-copper w-full outline-none py-2 text-lg font-display italic text-white" 
                              value={editData.title ?? item.title} 
                              onChange={e => setEditData({...editData, title: e.target.value})} 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Taxonomy</label>
                              <input 
                                className="bg-transparent border-b border-white/10 w-full outline-none py-1 text-[10px] uppercase tracking-widest" 
                                value={editData.category ?? item.category} 
                                onChange={e => setEditData({...editData, category: e.target.value})} 
                              />
                            </div>
                            <div>
                              <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Index Order</label>
                              <input 
                                type="number"
                                className="bg-transparent border-b border-white/10 w-full outline-none py-1 text-[10px] font-mono" 
                                value={editData.order ?? item.order} 
                                onChange={e => setEditData({...editData, order: parseInt(e.target.value)})} 
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Project Narrative</label>
                            <textarea 
                              className="bg-transparent border border-white/10 w-full h-32 p-4 text-xs font-mono leading-relaxed focus:border-brick-copper outline-none transition-colors" 
                              placeholder="Describe the architectural soul of this project..." 
                              value={editData.description ?? item.description} 
                              onChange={e => setEditData({...editData, description: e.target.value})} 
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-white/5">
                           <button onClick={() => handleUpdatePortfolio(item.id)} className="flex-grow py-4 bg-brick-copper text-charcoal text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-all shadow-xl">Persist Matrix</button>
                           <button onClick={() => setIsEditing(null)} className="px-8 py-4 border border-white/10 text-white/40 text-[10px] uppercase tracking-widest hover:border-white/30 transition-all">Release</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex gap-8 items-center">
                        <div className="relative w-16 h-16 md:w-24 md:h-24 overflow-hidden border border-white/10">
                          <img src={item.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                          <div className="absolute top-1 left-1 bg-brick-copper text-charcoal text-[8px] font-bold px-1">{item.order}</div>
                        </div>
                        <div>
                          <h4 className="text-xl font-display italic text-white mb-1">{item.title}</h4>
                          <p className="text-[9px] text-brick-copper uppercase tracking-[0.3em] font-medium">{item.category}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setIsEditing(item.id); setEditData(item); }} className="p-3 border border-white/5 hover:border-brick-copper hover:text-brick-copper transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeletePortfolio(item.id)} className="p-3 border border-white/5 hover:border-red-500 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {portfolioItems.length === 0 && (
                <div className="py-20 text-center border border-dashed border-white/5 text-white/20">
                  <p className="text-[10px] uppercase tracking-[0.3em]">No projects in the archive matrix.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'narratives' && (
          <section>
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-brick-copper">
                <FileText size={18} />
                <h3 className="font-display text-2xl italic">Custom Narratives</h3>
              </div>
              <button onClick={handleCreatePage} className="text-brick-copper flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-sand transition-colors">
                <Plus size={14} /> New Narrative
              </button>
            </div>
            <div className="space-y-4">
              {pages.map(page => (
                <div key={page.id} className="border border-white/5 p-6 group hover:border-white/10 transition-all bg-white/[0.01]">
                  {isEditing === page.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input className="bg-transparent border-b border-white/10 w-full outline-none text-sm py-1 font-display" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                        <input className="bg-transparent border-b border-white/5 w-full outline-none text-[10px] font-mono" value={editData.slug} placeholder="slug (e.g. about-us)" onChange={e => setEditData({...editData, slug: e.target.value})} />
                      </div>
                      <input className="bg-transparent border-b border-white/5 w-full outline-none text-[10px] italic text-white/40" value={editData.description || ''} placeholder="SEO Meta Description..." onChange={e => setEditData({...editData, description: e.target.value})} />
                      <textarea className="bg-transparent border border-white/5 w-full h-64 p-4 text-xs font-mono" value={editData.content} onChange={e => setEditData({...editData, content: e.target.value})} />
                      <div className="flex justify-between items-center bg-white/5 p-4">
                        <div className="flex items-center gap-4">
                          <label className="text-[10px] uppercase tracking-widest text-white/30">Show in Navigation</label>
                          <button 
                            onClick={() => setEditData({...editData, showInNav: !editData.showInNav})}
                            className={`w-10 h-5 rounded-full transition-colors relative ${editData.showInNav ? 'bg-brick-copper' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${editData.showInNav ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => handleUpdatePage(page.id)} className="text-green-500 text-[10px] uppercase tracking-widest">Persist</button>
                          <button onClick={() => setIsEditing(null)} className="text-white/40 text-[10px] uppercase tracking-widest">Abandon</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div><h4 className="text-sm font-semibold">{page.title}</h4><p className="text-[10px] text-white/40 font-mono">/p/{page.slug}</p></div>
                      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setIsEditing(page.id); setEditData(page); }} className="text-white/20 hover:text-brick-copper"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeletePage(page.id)} className="text-white/20 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'exchange' && (
          <section className="space-y-8">
            <div className="flex items-center gap-3 text-brick-copper mb-8 border-b border-white/5 pb-4">
              <MessageSquare size={18} />
              <h3 className="font-display text-2xl italic">Project Inquiries</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inquiries.map(inq => (
                <div key={inq.id} className="bg-white/5 border border-white/5 p-8 group hover:border-brick-copper/20 transition-all relative">
                  <div className="flex justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-display italic mb-1">{inq.realtorName}</h4>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest">{inq.firmName}</p>
                    </div>
                    <button onClick={() => deleteDoc(doc(db, 'inquiries', inq.id))} className="text-white/10 hover:text-red-500 transition-colors"><X size={16} /></button>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <MapPin size={12} className="text-brick-copper mt-1" />
                      <p className="text-xs text-white/60 leading-relaxed">{inq.propertyAddress}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={12} className="text-brick-copper" />
                      <p className="text-xs text-white/60">{inq.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 border-t border-white/5 pt-6">
                    <button onClick={async () => {
                      const reply = await getAiSuggestion("Draft a professional architectural project acceptance/follow-up", `${inq.realtorName} from ${inq.firmName} for ${inq.propertyAddress}`);
                      alert(reply);
                    }} className="flex-1 py-3 bg-brick-copper/10 text-brick-copper text-[10px] uppercase tracking-widest border border-brick-copper/20 hover:bg-brick-copper hover:text-charcoal transition-all font-bold">
                      Draft Correspondence
                    </button>
                  </div>
                </div>
              ))}
              {inquiries.length === 0 && (
                <div className="col-span-full py-20 text-center border border-dashed border-white/5 text-white/20">
                  <p className="text-[10px] uppercase tracking-[0.3em]">No inquiries found in the stream.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
