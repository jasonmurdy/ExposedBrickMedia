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
import { toast, Toaster } from 'react-hot-toast';
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
  setDoc,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { useSiteContent } from '../lib/SiteContentContext';
import { 
  LogOut, Plus, Trash2, Edit2, Check, X, Shield, Sparkles, Upload, 
  Layout, MoveUp, MoveDown, Compass, Save, Palette, Type, Globe, 
  Users, MessageSquare, Briefcase, FileText, Settings, Instagram, 
  Twitter, Linkedin, Facebook, Mail, Phone, MapPin, Loader2, Box,
  Eye, EyeOff, GripVertical, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileUpload } from './FileUpload';
import { LinkSelector } from './LinkSelector';
import { GoogleGenAI } from '@google/genai';
import { PuckEditor } from './PuckEditor';
import { Portfolio } from './PortfolioSections';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { ADMIN_EMAILS } from '../constants';

// Initialize Gemini on the frontend as per system instructions
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SortablePortfolioRow = ({ 
  item, 
  onEdit, 
  onToggleHidden, 
  onDelete 
}: { 
  item: any; 
  onEdit: (item: any) => void; 
  onToggleHidden: (id: string, hidden: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`group hover:bg-white/[0.02] transition-colors ${isDragging ? 'bg-white/5 border-y border-brick-copper/50 shadow-2xl relative' : ''}`}
    >
      <td className="p-4 w-10">
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={Boolean(item.selected)}
            onChange={(e) => item.onSelect(item.id, e.target.checked)}
            className="w-4 h-4 accent-brick-copper bg-transparent border-white/20"
          />
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-white/10 hover:text-brick-copper transition-colors">
            <GripVertical size={16} />
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-white/10 overflow-hidden flex-shrink-0 bg-charcoal">
            <img src={item.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
          </div>
          <div>
            <p className="text-sm font-medium text-white group-hover:text-brick-copper transition-colors uppercase tracking-tight">{item.title}</p>
            <p className="text-[8px] text-white/20 font-mono tracking-tighter mt-0.5 select-all">{item.id}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        {item.bannerText ? (
          <span 
            className="text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-sm border border-white/10"
            style={{ 
              backgroundColor: item.bannerColor || '#C57D5D',
              color: item.bannerColor === '#FAFAFA' ? '#1a1a1a' : (item.bannerColor === '#1A1A1A' ? '#ffffff' : '#1a1a1a')
            }}
          >
            {item.bannerText}
          </span>
        ) : (
          <span className="text-[8px] text-white/10 uppercase tracking-widest">—</span>
        )}
      </td>
      <td className="p-4">
        <span className="text-[9px] uppercase tracking-widest text-white/40">{item.category}</span>
      </td>
      <td className="p-4">
        <span className="text-[11px] font-mono text-brick-copper">{item.mlsNumber || 'N/A'}</span>
      </td>
      <td className="p-4">
        <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
          item.status?.toLowerCase().includes('sold') ? 'border-red-500/30 text-red-500 bg-red-500/5' : 
          item.status?.toLowerCase().includes('sale') ? 'border-green-500/30 text-green-500 bg-green-500/5' : 
          'border-white/10 text-white/40'
        }`}>
          {item.status || 'Pending'}
        </span>
      </td>
      <td className="p-4">
         <div className="flex flex-col gap-1">
           <span className="text-[8px] uppercase tracking-tighter text-white/20">Panel: {item.panel || 'main'}</span>
           <span className="text-[8px] uppercase tracking-tighter text-white/20">Order: {item.order}</span>
         </div>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={() => onEdit(item)}
            className="p-2 text-white/40 hover:text-brick-copper hover:bg-white/5 transition-all outline-none"
            title="Edit Details"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onToggleHidden(item.id, item.hidden)}
            className={`p-2 transition-all outline-none ${item.hidden ? 'text-red-500 bg-red-500/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title={item.hidden ? "Restore to Public" : "Archive"}
          >
            {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/5 transition-all outline-none"
            title="Delete Item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const AdminDashboard = ({ onClose }: { onClose: () => void }) => {
  const [user, setUser] = useState<any>(null);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingMLS, setIsFetchingMLS] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'layout' | 'portfolio' | 'services' | 'inquiries' | 'pages' | 'testimonials' | 'admins'>('architecture');
  const [activeEditTab, setActiveEditTab] = useState<'media' | 'details' | 'narrative' | 'display'>('media');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPuck, setShowPuck] = useState(false);
  const [puckPageId, setPuckPageId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'order', direction: 'asc' });

  const { settings, pages, setIsEditMode } = useSiteContent();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = portfolioItems.findIndex((item) => item.id === active.id);
      const newIndex = portfolioItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(portfolioItems, oldIndex, newIndex);
      setPortfolioItems(newItems);

      // Persist the new order to Firestore
      const updates = newItems.map((item, index) => {
        if (item.order !== index) {
          return updateDoc(doc(db, 'portfolio_items', item.id), { 
            order: index,
            updatedAt: serverTimestamp() 
          });
        }
        return null;
      }).filter(Boolean);
      
      try {
        await Promise.all(updates);
        await logAction('REORDER_PORTFOLIO', { count: updates.length });
      } catch (err) {
        console.error("Failed to persist new order", err);
      }
    }
  };

  const getSortedItems = (items: any[]) => {
    if (!sortConfig || (sortConfig.key === 'order' && sortConfig.direction === 'asc')) return items;
    return [...items].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  useEffect(() => {
    setIsEditMode(true);
    return () => setIsEditMode(false);
  }, []);

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

  const isAdmin = !!user?.email && (
    ADMIN_EMAILS.includes(user.email) || 
    admins.some(a => a.email === user.email)
  );

  useEffect(() => {
    if (!user || !isAdmin) return;

    let unsub: Unsubscribe | null = null;

    if (activeTab === 'portfolio' || activeTab === 'architecture') {
      const q = query(collection(db, 'portfolio_items'), orderBy('order', 'asc'));
      unsub = onSnapshot(q, (snap) => {
        setPortfolioItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } else if (activeTab === 'services') {
      const q = query(collection(db, 'services'), orderBy('order', 'asc'));
      unsub = onSnapshot(q, (snap) => {
        setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } else if (activeTab === 'testimonials') {
      const q = query(collection(db, 'testimonials'), orderBy('order', 'asc'));
      unsub = onSnapshot(q, (snap) => {
        setTestimonials(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } else if (activeTab === 'inquiries') {
      const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(50));
      unsub = onSnapshot(q, (snap) => {
        setInquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } else if (activeTab === 'admins') {
      const q = query(collection(db, 'admins'), orderBy('addedAt', 'desc'));
      unsub = onSnapshot(q, (snap) => {
        setAdmins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [user, isAdmin, activeTab]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
      toast.success('Access Granted');
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/popup-blocked') {
        toast.error("Please allow popups for this site.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Silent
      } else {
        toast.error(`Login failed: ${err.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => signOut(auth);

  if (!user) {
    return (
      <div className="fixed inset-0 bg-charcoal z-[100] flex flex-col items-center justify-center p-6">
        <Toaster position="bottom-right" />
        <Shield size={48} className="text-brick-copper mb-8" />
        <h2 className="font-display text-4xl mb-8">Admin Login</h2>
        <button 
          onClick={login}
          disabled={isLoggingIn}
          className="px-12 py-4 bg-brick-copper text-charcoal font-semibold uppercase tracking-widest hover:bg-off-white transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-wait font-sans"
        >
          {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : null}
          {isLoggingIn ? 'Verifying...' : 'Identify as Admin'}
        </button>
        <button onClick={onClose} className="mt-8 text-off-white/40 uppercase text-[10px] tracking-widest hover:text-off-white font-sans">Return to Site</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-charcoal z-[100] flex flex-col items-center justify-center p-6">
        <Toaster position="bottom-right" />
        <h2 className="font-display text-2xl mb-4 text-red-500">Access Refused</h2>
        <p className="text-off-white/60 mb-8 font-sans">This portal is reserved for authorized administrators.</p>
        <button onClick={logout} className="px-8 py-3 bg-red-900/20 text-red-500 border border-red-500/30 uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all font-sans font-bold">Sign Out</button>
        <button onClick={onClose} className="mt-8 text-off-white/40 uppercase text-[10px] tracking-widest font-sans">Close</button>
      </div>
    );
  }

  const logAction = async (action: string, details: any) => {
    try {
      // Deep clone and clean to avoid circular structures in JSON.stringify
      const sanitizedDetails = JSON.parse(JSON.stringify(details, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (key === 'layout') return '[Layout Data]'; // Avoid logging huge layouts twice
          return value;
        }
        return value;
      }));

      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details: sanitizedDetails, user: user.email })
      });
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  const handleMLSLookup = async () => {
    if (!editData.mlsNumber) {
      toast.error("Enter an MLS number first");
      return;
    }
    setIsFetchingMLS(true);
    try {
      const result = await fetch('/api/ddf/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mlsNumber: editData.mlsNumber })
      });
      
      const listingData = await result.json();

      if (!result.ok) {
        throw new Error(listingData.error || "Lookup failed");
      }

      toast.success('MLS Data Ingested');
      // Convert CREA dates if needed, or simple calculate DOM
      const timestamp = Date.parse(listingData.ListingDate);
      const dom = !isNaN(timestamp) ? Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)) : 0;

      setEditData({
        ...editData,
        title: listingData.Address?.AddressLine1 || editData.title,
        description: listingData.PublicRemarks || editData.description,
        img: listingData.Property?.Photo?.[0]?.SequenceId ? `https://cdn.realtor.ca/listing/CREA/${listingData.ListingID}/highres/${listingData.Property.Photo[0].SequenceId}.jpg` : editData.img, // Or whatever is provided by DDF
        listPrice: listingData.ListPrice || editData.listPrice,
        propertyType: listingData.Property?.Type || editData.propertyType,
        beds: listingData.Building?.BedroomsTotal || editData.beds,
        baths: listingData.Building?.BathroomTotal || editData.baths,
        sqft: listingData.Building?.SizeInterior || editData.sqft,
        status: listingData.TransactionType || editData.status
      });
    } catch (error: any) {
      console.error("MLS Lookup failed", error);
      toast.error(`Lookup failed: ${error.message}`);
    } finally {
      setIsFetchingMLS(false);
    }
  };

  const handleCreatePortfolio = async () => {
    const newItem = {
      title: 'New Project',
      category: 'Residential',
      description: 'A study in light and space.',
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      gallery: [],
      type: 'item',
      colSpan: 1,
      rowSpan: 1,
      order: portfolioItems.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    try {
      const docRef = await addDoc(collection(db, 'portfolio_items'), newItem);
      await logAction('CREATE_PORTFOLIO', { title: newItem.title });
      setIsEditing(docRef.id);
      setEditData({ id: docRef.id, ...newItem });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'portfolio_items');
    }
  };

  async function handleUpdatePortfolio(id: string) {
    const docRef = doc(db, 'portfolio_items', id);
    const { id: _, createdAt: __, daysOnMarket: ___, ...dataToUpdate } = editData;
    try {
      await updateDoc(docRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      await logAction('UPDATE_PORTFOLIO', { id, title: editData.title });
      setIsEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `portfolio_items/${id}`);
    }
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
    try {
      await addDoc(collection(db, 'services'), newService);
      await logAction('CREATE_SERVICE', { title: newService.title });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'services');
    }
  };

  const handleUpdateService = async (id: string) => {
    const docRef = doc(db, 'services', id);
    const { id: _, createdAt: __, ...dataToUpdate } = editData;
    try {
      await updateDoc(docRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      await logAction('UPDATE_SERVICE', { id, title: editData.title });
      setIsEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `services/${id}`);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (confirm('Delete this service?')) {
      try {
        await deleteDoc(doc(db, 'services', id));
        await logAction('DELETE_SERVICE', { id });
        toast.success('Service Removed');
      } catch (err) {
        toast.error("Failed to delete service");
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
      toast.success('Configuration Saved');
      setSaveSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/site');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePage = async () => {
    const newPage = {
      title: 'New Page',
      slug: 'new-page-' + Date.now(),
      content: '# New Page\n\nBegin your content here...',
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
    try {
      await updateDoc(docRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      await logAction('UPDATE_PAGE', { id, title: editData.slug });
      setIsEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pages/${id}`);
    }
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
      try {
        await deleteDoc(doc(db, 'portfolio_items', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `portfolio_items/${id}`);
      }
    }
  };

  const handleCreateTestimonial = async () => {
    const newItem = {
      name: 'Client Name',
      brokerage: 'Brokerage Name',
      quote: 'An incredible experience end-to-end.',
      headshotUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
      order: testimonials.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'testimonials'), newItem);
    await logAction('CREATE_TESTIMONIAL', { name: newItem.name });
    setIsEditing(docRef.id);
    setEditData({ id: docRef.id, ...newItem });
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail) return;
    try {
      const email = newAdminEmail.toLowerCase().trim();
      const newAdmin = {
        email,
        role: 'admin',
        addedAt: serverTimestamp()
      };
      // Use email as doc ID to make rules checking easier
      await setDoc(doc(db, 'admins', email), newAdmin);
      await logAction('ADD_ADMIN', { email });
      setNewAdminEmail('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'admins');
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (ADMIN_EMAILS.includes(email)) {
      alert("This guardian is part of the core narrative and cannot be erased.");
      return;
    }
    if (confirm(`Relinquish administrative privileges for ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'admins', id));
        await logAction('REMOVE_ADMIN', { email });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `admins/${id}`);
      }
    }
  };

  async function handleUpdateTestimonial(id: string) {
    const docRef = doc(db, 'testimonials', id);
    const { id: _, createdAt: __, ...dataToUpdate } = editData;
    try {
      await updateDoc(docRef, { ...dataToUpdate, updatedAt: serverTimestamp() });
      await logAction('UPDATE_TESTIMONIAL', { id });
      setIsEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `testimonials/${id}`);
    }
  }

  const handleDeleteTestimonial = async (id: string) => {
    if (confirm('Erase this testimonial?')) {
      await deleteDoc(doc(db, 'testimonials', id));
      await logAction('DELETE_TESTIMONIAL', { id });
      toast.success('Testimonial Removed');
    }
  };

  const handleBulkAction = async (action: 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    const message = action === 'archive' 
      ? `Archive ${selectedIds.length} items from public view?` 
      : `PERMANENTLY delete ${selectedIds.length} items? This cannot be undone.`;
      
    if (!confirm(message)) return;

    toast.loading(`${action === 'archive' ? 'Archiving' : 'Deleting'} items...`, { id: 'bulk' });
    
    try {
      const promises = selectedIds.map(id => {
        if (action === 'archive') {
          return updateDoc(doc(db, 'portfolio_items', id), { hidden: true, updatedAt: serverTimestamp() });
        } else {
          return deleteDoc(doc(db, 'portfolio_items', id));
        }
      });
      
      await Promise.all(promises);
      await logAction(`BULK_${action.toUpperCase()}`, { count: selectedIds.length });
      setSelectedIds([]);
      toast.success(`Action applied to ${selectedIds.length} records`, { id: 'bulk' });
    } catch (err) {
      toast.error("Bulk operation failed", { id: 'bulk' });
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal z-[100] flex flex-col p-4 md:p-16 overflow-y-auto no-scrollbar font-sans">
      <Toaster position="bottom-right" />
      {showPuck && <PuckEditor pageId={puckPageId || undefined} onClose={() => { setShowPuck(false); setPuckPageId(null); }} />}
      
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-8 border-b border-white/10 pb-8">
        <div>
          <h2 className="font-display text-3xl md:text-4xl mb-2 italic">Admin Dashboard</h2>
          <p className="text-brick-copper text-[10px] uppercase tracking-[0.3em] font-medium font-sans">User: {user.email}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleUpdateSettings} 
            disabled={isSaving}
            className={`px-6 md:px-8 py-3 uppercase tracking-widest text-[10px] font-bold transition-all flex items-center gap-2 font-sans ${
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
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="px-6 md:px-8 py-3 bg-white/5 border border-white/10 text-off-white/60 uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all font-sans font-bold">Close</button>
        </div>
      </div>

      <nav className="flex items-center gap-x-8 overflow-x-auto no-scrollbar -mx-4 px-4 md:-mx-16 md:px-16 mb-12 border-b border-white/5 pt-4 pb-4">
        {[
          { id: 'architecture', label: 'Home Meta', icon: Compass },
          { id: 'layout', label: 'Visual Builder', icon: Layout },
          { id: 'portfolio', label: 'Portfolio', icon: Layout },
          { id: 'services', label: 'Services', icon: Briefcase },
          { id: 'testimonials', label: 'Social Proof', icon: Users },
          { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
          { id: 'pages', label: 'Pages', icon: FileText },
          { id: 'admins', label: 'Admins', icon: Shield }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setIsEditing(null); }}
            className={`text-[10px] uppercase tracking-[0.4em] transition-all flex items-center gap-3 whitespace-nowrap font-sans font-bold relative py-2 ${
              activeTab === tab.id ? 'text-brick-copper' : 'text-white/40 hover:text-white'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -bottom-4 left-0 right-0 h-0.5 bg-brick-copper"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
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
                Launch Home Engine
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white/5 p-8 border border-white/10 col-span-full">
                <h4 className="text-[10px] uppercase tracking-widest text-brick-copper mb-6">Narrative Orchestration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pages.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => { setPuckPageId(p.id); setShowPuck(true); }}
                      className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 hover:border-brick-copper/40 transition-all group"
                    >
                      <div className="text-left">
                        <p className="text-[10px] text-white font-medium mb-1">{p.title}</p>
                        <p className="text-[8px] text-white/30 font-mono tracking-widest lowercase">/p/{p.slug}</p>
                      </div>
                      <Layout size={14} className="text-white/20 group-hover:text-brick-copper transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
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
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Archive Optimization</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Properties Per Load</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="number"
                          min="1"
                          max="24"
                          className="bg-transparent border-b border-white/10 w-24 outline-none py-2 text-sm text-brick-copper font-mono" 
                          value={localSettings.propertiesPerPage || 6} 
                          onChange={e => setLocalSettings({...localSettings, propertiesPerPage: parseInt(e.target.value) || 6})} 
                        />
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">Items per batch</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60">Cognitive Layer</h4>
                    <button 
                      onClick={() => setLocalSettings({...localSettings, chatbotEnabled: !localSettings.chatbotEnabled})}
                      className={`flex items-center gap-2 px-3 py-1 text-[8px] uppercase tracking-widest transition-all ${localSettings.chatbotEnabled ? 'bg-brick-copper text-charcoal' : 'bg-white/5 text-white/40 border border-white/10'}`}
                    >
                      {localSettings.chatbotEnabled ? <Eye size={10} /> : <EyeOff size={10} />}
                      {localSettings.chatbotEnabled ? 'Live' : 'Deactivated'}
                    </button>
                  </div>
                  
                  {localSettings.chatbotEnabled && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Master Persona</label>
                        <textarea 
                          rows={3}
                          className="bg-white/5 border border-white/10 w-full outline-none p-3 text-[10px] leading-relaxed text-white/80 focus:border-brick-copper transition-colors no-scrollbar"
                          value={localSettings.chatbotPersona}
                          onChange={e => setLocalSettings({...localSettings, chatbotPersona: e.target.value})}
                          placeholder="You are the Exposed Brick assistant..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Flambient Base ($)</label>
                          <input 
                            type="number"
                            className="bg-transparent border-b border-white/10 w-full outline-none py-2 text-sm text-brick-copper font-mono"
                            value={localSettings.chatbotPricing?.flambient_base}
                            onChange={e => setLocalSettings({...localSettings, chatbotPricing: {...(localSettings.chatbotPricing || {flambient_base:150, drone_addon:100, turnaround_time:'24 hours'}), flambient_base: parseInt(e.target.value) || 0}})}
                          />
                        </div>
                        <div>
                          <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Drone Add-on ($)</label>
                          <input 
                            type="number"
                            className="bg-transparent border-b border-white/10 w-full outline-none py-2 text-sm text-brick-copper font-mono"
                            value={localSettings.chatbotPricing?.drone_addon}
                            onChange={e => setLocalSettings({...localSettings, chatbotPricing: {...(localSettings.chatbotPricing || {flambient_base:150, drone_addon:100, turnaround_time:'24 hours'}), drone_addon: parseInt(e.target.value) || 0}})}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Turnaround Narrative</label>
                          <input 
                            className="bg-transparent border-b border-white/10 w-full outline-none py-2 text-sm text-white/60"
                            value={localSettings.chatbotPricing?.turnaround_time}
                            onChange={e => setLocalSettings({...localSettings, chatbotPricing: {...(localSettings.chatbotPricing || {flambient_base:150, drone_addon:100, turnaround_time:'24 hours'}), turnaround_time: e.target.value}})}
                          />
                        </div>
                      </div>
                    </div>
                  )}
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

                <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8">
                  <div className="flex items-center gap-3 text-brick-copper mb-6">
                    <Sparkles size={18} />
                    <h3 className="text-xl font-display italic">Branding Assets</h3>
                  </div>
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

                  <div className="space-y-4 mt-8">
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
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60">Social Nodes</h4>
                    <button 
                      onClick={() => {
                        const newSocial = [...(localSettings.socialLinks || [])];
                        newSocial.push({ id: Date.now().toString(), platform: 'instagram', url: 'https://' });
                        setLocalSettings({...localSettings, socialLinks: newSocial});
                      }}
                      className="text-brick-copper hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-widest transition-colors font-bold"
                    >
                      <Plus size={12} /> Add Node
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(localSettings.socialLinks || []).map((link, idx) => (
                      <div key={link.id} className="bg-white/5 p-4 border border-white/5 space-y-4 group/social">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {link.platform === 'instagram' && <Instagram size={14} className="text-white/40" />}
                            {link.platform === 'twitter' && <Twitter size={14} className="text-white/40" />}
                            {link.platform === 'linkedin' && <Linkedin size={14} className="text-white/40" />}
                            {link.platform === 'facebook' && <Facebook size={14} className="text-white/40" />}
                            <select 
                              className="bg-transparent text-[8px] uppercase tracking-widest text-white/60 outline-none border-none cursor-pointer hover:text-brick-copper transition-colors"
                              value={link.platform}
                              onChange={e => {
                                const newSocial = [...(localSettings.socialLinks || [])];
                                newSocial[idx].platform = e.target.value as any;
                                setLocalSettings({...localSettings, socialLinks: newSocial});
                              }}
                            >
                              <option value="instagram" className="bg-charcoal text-white">Instagram</option>
                              <option value="twitter" className="bg-charcoal text-white">Twitter</option>
                              <option value="linkedin" className="bg-charcoal text-white">LinkedIn</option>
                              <option value="facebook" className="bg-charcoal text-white">Facebook</option>
                            </select>
                          </div>
                          <button 
                            onClick={() => {
                              const newSocial = (localSettings.socialLinks || []).filter(s => s.id !== link.id);
                              setLocalSettings({...localSettings, socialLinks: newSocial});
                            }}
                            className="text-white/10 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <input 
                          className="bg-transparent text-[10px] font-mono outline-none w-full border-b border-white/10 focus:border-brick-copper py-1" 
                          value={link.url} 
                          onChange={e => {
                            const newSocial = [...(localSettings.socialLinks || [])];
                            newSocial[idx].url = e.target.value;
                            setLocalSettings({...localSettings, socialLinks: newSocial});
                          }}
                          placeholder="https://..."
                        />
                      </div>
                    ))}
                  </div>
                  {(localSettings.socialLinks?.length || 0) === 0 && (
                    <p className="text-[9px] text-white/20 text-center uppercase tracking-widest border border-dashed border-white/10 py-8">
                      No social nodes established.
                    </p>
                  )}
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
                        <LinkSelector 
                          value={item.url}
                          allowListing={false}
                          onChange={(val) => {
                            const newItems = [...(localSettings.navigationItems || [])];
                            newItems[idx].url = val;
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
        )}        {activeTab === 'portfolio' && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div>
                <h3 className="font-display text-4xl italic mb-2">Portfolio</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest">Manage your narrative stream and catalog artifacts.</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {selectedIds.length > 0 && (
                   <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                     <span className="text-[10px] text-brick-copper font-bold uppercase tracking-widest">{selectedIds.length} Selected</span>
                     <button 
                       onClick={() => handleBulkAction('archive')}
                       className="p-2 text-white/40 hover:text-white"
                       title="Archive Selected"
                     >
                       <EyeOff size={16} />
                     </button>
                     <button 
                       onClick={() => handleBulkAction('delete')}
                       className="p-2 text-white/40 hover:text-red-500"
                       title="Delete Selected"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                )}
                <div className="relative flex-1 md:flex-none">
                  <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input 
                    placeholder="Search catalog..." 
                    className="bg-white/5 border border-white/5 py-2 pl-10 pr-4 outline-none text-[10px] uppercase tracking-widest text-white/60 focus:border-brick-copper w-full"
                    value={editData.search || ''}
                    onChange={e => setEditData({...editData, search: e.target.value})}
                  />
                  {sortConfig?.key !== 'order' && (
                    <button 
                      onClick={() => setSortConfig({ key: 'order', direction: 'asc' })}
                      className="absolute right-0 -bottom-6 text-[8px] uppercase tracking-widest text-brick-copper hover:text-white transition-colors"
                    >
                      Reset to Manual Order
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleCreatePortfolio}
                  className="px-6 py-2 bg-brick-copper text-charcoal font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>
            </div>

            <div className="border border-white/5 bg-white/[0.01]">
              <div className="hidden md:block overflow-x-auto no-scrollbar">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] uppercase tracking-[0.2em] text-white/20">
                        <th className="p-4 w-10">
                           <input 
                              type="checkbox"
                              checked={portfolioItems.length > 0 && selectedIds.length === portfolioItems.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedIds(portfolioItems.map(i => i.id));
                                else setSelectedIds([]);
                              }}
                              className="w-4 h-4 accent-brick-copper bg-transparent border-white/20"
                           />
                        </th>
                        <th className="p-4 cursor-pointer hover:text-brick-copper transition-colors" onClick={() => requestSort('title')}>Asset <ArrowUp size={8} className="inline ml-1" /></th>
                        <th className="p-4 cursor-pointer hover:text-brick-copper transition-colors" onClick={() => requestSort('bannerText')}>Banner</th>
                        <th className="p-4 cursor-pointer hover:text-brick-copper transition-colors" onClick={() => requestSort('category')}>Taxonomy</th>
                        <th className="p-4 cursor-pointer hover:text-brick-copper transition-colors" onClick={() => requestSort('mlsNumber')}>MLS #</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Fidelity Config</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      <SortableContext 
                        items={portfolioItems.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {getSortedItems(portfolioItems)
                          .filter(item => {
                            const s = editData.search?.toLowerCase() || '';
                            return !s || 
                              item.title?.toLowerCase().includes(s) || 
                              item.mlsNumber?.toLowerCase().includes(s) || 
                              item.status?.toLowerCase().includes(s) ||
                              item.category?.toLowerCase().includes(s) ||
                              item.bannerText?.toLowerCase().includes(s);
                          })
                          .map(item => (
                          <SortablePortfolioRow 
                            key={item.id} 
                            item={{
                              ...item, 
                              selected: selectedIds.includes(item.id),
                              onSelect: (id: string, checked: boolean) => {
                                if (checked) setSelectedIds([...selectedIds, id]);
                                else setSelectedIds(selectedIds.filter(sid => sid !== id));
                              }
                            }} 
                            onEdit={(item) => {
                              setIsEditing(item.id);
                              setEditData(item);
                            }}
                            onToggleHidden={async (id, hidden) => {
                              const docRef = doc(db, 'portfolio_items', id);
                              await updateDoc(docRef, { hidden: !hidden, updatedAt: serverTimestamp() });
                              toast.success(hidden ? 'Restored' : 'Archived');
                            }}
                            onDelete={handleDeletePortfolio}
                          />
                        ))}
                      </SortableContext>
                    </tbody>
                  </table>
                </DndContext>
              </div>

              <div className="md:hidden divide-y divide-white/5">
                {portfolioItems
                  .filter(item => {
                    const s = editData.search?.toLowerCase() || '';
                    return !s || 
                      item.title?.toLowerCase().includes(s) || 
                      item.mlsNumber?.toLowerCase().includes(s) || 
                      item.status?.toLowerCase().includes(s) ||
                      item.category?.toLowerCase().includes(s) ||
                      item.bannerText?.toLowerCase().includes(s);
                  })
                  .map(item => (
                    <div key={item.id} className="p-4 flex gap-4 bg-white/[0.02]">
                      <div className="w-20 h-20 bg-charcoal border border-white/10 overflow-hidden flex-shrink-0">
                        <img src={item.img} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[10px] uppercase tracking-widest text-white font-bold truncate pr-2">{item.title}</h4>
                          <input 
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds([...selectedIds, item.id]);
                              else setSelectedIds(selectedIds.filter(sid => sid !== item.id));
                            }}
                            className="w-4 h-4 accent-brick-copper"
                          />
                        </div>
                        <p className="text-[8px] text-white/40 uppercase tracking-widest mb-3">{item.category} • {item.status || 'Pending'}</p>
                        <div className="flex gap-4">
                          <button onClick={() => { setIsEditing(item.id); setEditData(item); }} className="text-brick-copper text-[8px] uppercase tracking-[0.2em] font-bold">Edit</button>
                          <button 
                            onClick={async () => {
                              const docRef = doc(db, 'portfolio_items', item.id);
                              await updateDoc(docRef, { hidden: !item.hidden, updatedAt: serverTimestamp() });
                              toast.success(item.hidden ? 'Restored' : 'Archived');
                            }} 
                            className="text-white/40 text-[8px] uppercase tracking-[0.2em]"
                          >
                            {item.hidden ? 'Restore' : 'Archive'}
                          </button>
                          <button onClick={() => handleDeletePortfolio(item.id)} className="text-red-500/60 text-[8px] uppercase tracking-[0.2em]">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {isEditing && portfolioItems.find(i => i.id === isEditing) && (
              <div className="fixed inset-0 z-[110] bg-charcoal/95 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-charcoal border border-brick-copper/30 w-full max-w-4xl h-full md:h-auto max-h-[90vh] overflow-hidden flex flex-col shadow-3xl">
                  <header className="p-6 border-b border-white/5 flex justify-between items-center bg-charcoal/80">
                    <div>
                      <h4 className="text-xl font-display italic text-white">{editData.title}</h4>
                      <p className="text-[9px] text-brick-copper uppercase tracking-widest font-bold tracking-[0.2em]">{editData.category}</p>
                    </div>
                    <button onClick={() => setIsEditing(null)} className="text-white/40 hover:text-white transition-colors p-2"><X size={20} /></button>
                  </header>
                  
                  <nav className="flex overflow-x-auto no-scrollbar border-b border-white/5 bg-white/[0.02]">
                    {[
                      { id: 'media', label: 'Media Assets', icon: Palette },
                      { id: 'details', label: 'Listing Details', icon: FileText },
                      { id: 'narrative', label: 'Narrative', icon: Type },
                      { id: 'display', label: 'Display Config', icon: Layout }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveEditTab(tab.id as any)}
                        className={`flex-1 min-w-[100px] py-4 text-[9px] uppercase tracking-widest font-bold flex flex-col md:flex-row items-center justify-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                          activeEditTab === tab.id ? 'border-brick-copper text-brick-copper bg-brick-copper/5' : 'border-transparent text-white/30 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <tab.icon size={12} />
                        <span className="hidden md:inline">{tab.label}</span>
                      </button>
                    ))}
                  </nav>

                  <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    {activeEditTab === 'media' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <FileUpload 
                          label="Primary Showcase Image"
                          path="portfolio"
                          onUploadComplete={(url) => setEditData({...editData, img: url})}
                        />
                        {editData.img && (
                          <div className="aspect-video border border-white/10 overflow-hidden bg-charcoal/50 flex items-center justify-center relative group">
                            <img src={editData.img} className="w-full h-full object-contain" alt="" />
                            <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <p className="text-[10px] uppercase tracking-[0.4em] font-bold">Primary Asset</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeEditTab === 'details' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-brick-copper/[0.03] p-8 border border-brick-copper/10 space-y-6">
                           <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1">
                                <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold">MLS Network Integration</label>
                                <div className="flex gap-2">
                                  <input 
                                    placeholder="MLS Identification Number"
                                    className="bg-charcoal/50 border border-brick-copper/20 flex-1 outline-none py-3 px-4 text-[10px] font-mono text-white" 
                                    value={editData.mlsNumber || ''} 
                                    onChange={e => setEditData({...editData, mlsNumber: e.target.value})} 
                                  />
                                  <button 
                                    onClick={handleMLSLookup}
                                    disabled={isFetchingMLS}
                                    className="px-6 py-3 bg-brick-copper text-charcoal text-[9px] uppercase font-bold tracking-widest hover:bg-white transition-all disabled:opacity-50"
                                  >
                                    {isFetchingMLS ? <Loader2 size={12} className="animate-spin" /> : 'Fetch Metadata'}
                                  </button>
                                </div>
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">List Price</label>
                                <input 
                                  className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-[10px] font-mono text-white" 
                                  value={editData.listPrice || ''} 
                                  onChange={e => setEditData({...editData, listPrice: e.target.value})} 
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Commercial Status</label>
                                <input 
                                  className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-[10px] font-mono text-white" 
                                  value={editData.status || ''} 
                                  onChange={e => setEditData({...editData, status: e.target.value})} 
                                />
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                            <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Project Title / Address</label>
                            <input 
                              className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm font-display italic text-white" 
                              value={editData.title || ''} 
                              onChange={e => setEditData({...editData, title: e.target.value})} 
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Narrative Category</label>
                            <input 
                              className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-[10px] uppercase tracking-widest text-white" 
                              value={editData.category || ''} 
                              onChange={e => setEditData({...editData, category: e.target.value})} 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeEditTab === 'narrative' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                             <label className="text-[9px] uppercase tracking-widest text-white/30 block">Project Description</label>
                             <button 
                               onClick={async () => {
                                 const sugg = await getAiSuggestion("Architectural narrative for:", editData.title);
                                 setEditData({...editData, description: sugg});
                               }}
                               disabled={isGenerating}
                               className="text-[9px] uppercase tracking-widest text-brick-copper flex items-center gap-2 hover:text-white transition-colors"
                             >
                               <Sparkles size={10} /> {isGenerating ? 'Drafting...' : 'AI Refinement'}
                             </button>
                          </div>
                          <textarea 
                            className="bg-white/5 border border-white/5 w-full h-64 p-6 text-[11px] font-mono focus:border-brick-copper outline-none transition-colors leading-relaxed no-scrollbar" 
                            value={editData.description || ''} 
                            onChange={e => setEditData({...editData, description: e.target.value})} 
                          />
                        </div>
                      </div>
                    )}

                    {activeEditTab === 'display' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <label className="text-[9px] uppercase tracking-widest text-white/30 block font-bold">Catalog Sash Configuration</label>
                              <div className="bg-white/5 p-6 border border-white/5 space-y-4">
                                <input 
                                  placeholder="Banner Text (e.g. RECORD BREAKING)"
                                  className="bg-charcoal/50 border border-white/10 w-full outline-none py-3 px-4 text-[10px] uppercase tracking-widest text-brick-copper font-bold" 
                                  value={editData.bannerText || ''} 
                                  onChange={e => setEditData({...editData, bannerText: e.target.value})} 
                                />
                                <div className="grid grid-cols-2 gap-4">
                                   <select 
                                      className="bg-charcoal border border-white/10 w-full outline-none text-[9px] uppercase py-2 px-2"
                                      value={editData.bannerSize || 'normal'}
                                      onChange={e => setEditData({...editData, bannerSize: e.target.value})}
                                    >
                                      <option value="compact">Compact</option>
                                      <option value="normal">Standard</option>
                                      <option value="large">Large</option>
                                      <option value="extra">Extra</option>
                                    </select>
                                    <input 
                                      placeholder="Color Hex"
                                      className="bg-charcoal/50 border border-white/10 w-full outline-none py-2 px-3 text-[10px] font-mono text-white/60" 
                                      value={editData.bannerColor || '#C57D5D'} 
                                      onChange={e => setEditData({...editData, bannerColor: e.target.value})} 
                                    />
                                </div>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <label className="text-[9px] uppercase tracking-widest text-white/30 block font-bold">Grid Matrix Geometry</label>
                              <div className="bg-white/5 p-6 border border-white/5 grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Column Span</label>
                                    <input type="number" min="1" max="4" className="bg-charcoal/50 border border-white/10 w-full p-2 text-xs font-mono" value={editData.colSpan || 1} onChange={e => setEditData({...editData, colSpan: parseInt(e.target.value)})} />
                                 </div>
                                 <div>
                                    <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Row Span</label>
                                    <input type="number" min="1" max="4" className="bg-charcoal/50 border border-white/10 w-full p-2 text-xs font-mono" value={editData.rowSpan || 1} onChange={e => setEditData({...editData, rowSpan: parseInt(e.target.value)})} />
                                 </div>
                                 <div>
                                    <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Panel Stage</label>
                                    <select className="bg-charcoal border border-white/10 w-full p-2 text-[9px] uppercase text-brick-copper font-bold" value={editData.panel || 'main'} onChange={e => setEditData({...editData, panel: e.target.value})}>
                                       <option value="main">Main Showcase</option>
                                       <option value="side">Side Channel</option>
                                    </select>
                                 </div>
                                 <div>
                                    <label className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Display Rank</label>
                                    <input type="number" className="bg-charcoal/50 border border-white/10 w-full p-2 text-xs font-mono" value={editData.order || 0} onChange={e => setEditData({...editData, order: parseInt(e.target.value)})} />
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <footer className="p-6 border-t border-white/5 bg-charcoal/80 flex gap-4">
                    <button 
                      onClick={() => handleUpdatePortfolio(isEditing)} 
                      className="flex-1 py-4 bg-brick-copper text-charcoal text-[10px] uppercase font-bold tracking-widest hover:bg-white transition-all shadow-xl font-sans"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setIsEditing(null)} 
                      className="px-8 py-4 border border-white/10 text-white/40 text-[10px] uppercase tracking-widest hover:text-white transition-all font-sans font-bold"
                    >
                      Cancel
                    </button>
                  </footer>
                </div>
              </div>
            )}

            {/* Visual Grid Perspective */}
            <div className="space-y-8 pt-12 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/40 italic">Visual Orchestration (Active Preview)</h4>
                <p className="text-[8px] font-mono text-white/20">EDITS_PERMITTED_DIRECTLY_IN_GRID</p>
              </div>
              
              <div className="space-y-16">
                <div className="space-y-6">
                  <h5 className="text-[9px] uppercase tracking-[0.3em] text-brick-copper/60">Main Showcase Stream</h5>
                  <div className="bg-white/[0.01] border border-white/5 p-6 md:p-12">
                    <Portfolio panel="main" variant="grid" />
                  </div>
                </div>

                <div className="space-y-6">
                  <h5 className="text-[9px] uppercase tracking-[0.3em] text-brick-copper/60">Side Narrative Channel</h5>
                  <div className="bg-white/[0.01] border border-white/5 p-6 md:p-12">
                    <Portfolio panel="side" variant="grid" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'pages' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-brick-copper">
                <FileText size={18} />
                <h3 className="font-display text-2xl italic">Custom Pages</h3>
              </div>
              <button onClick={handleCreatePage} className="text-brick-copper flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-sand transition-colors font-bold font-sans">
                <Plus size={14} /> New Page
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
                          <button onClick={() => handleUpdatePage(page.id)} className="text-green-500 text-[10px] uppercase tracking-widest font-bold">Persist</button>
                          <button onClick={() => setIsEditing(null)} className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Abandon</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div><h4 className="text-sm font-semibold text-white uppercase tracking-tight">{page.title}</h4><p className="text-[10px] text-white/40 font-mono">/p/{page.slug}</p></div>
                      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setPuckPageId(page.id); setShowPuck(true); }} className="text-white/20 hover:text-brick-copper outline-none" title="Launch Visual Editor"><Layout size={16} /></button>
                        <button onClick={() => { setIsEditing(page.id); setEditData(page); }} className="text-white/20 hover:text-brick-copper outline-none"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeletePage(page.id)} className="text-white/20 hover:text-red-500 outline-none"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'testimonials' && (
          <section>
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-brick-copper">
                <Users size={18} />
                <h3 className="font-display text-2xl italic">Social Proof & Testimonials</h3>
              </div>
              <button onClick={handleCreateTestimonial} className="text-brick-copper flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-white transition-colors">
                <Plus size={14} /> Add Testimonial
              </button>
            </div>
            <div className="space-y-6">
              {testimonials.map(item => (
                <div key={item.id} className="border border-white/5 p-6 md:p-8 bg-white/[0.01] hover:border-brick-copper/30 transition-all group">
                  {isEditing === item.id ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <FileUpload 
                                label="Client Headshot"
                                path="testimonials"
                                onUploadComplete={(url) => setEditData({...editData, headshotUrl: url})}
                              />
                              {(editData.headshotUrl || item.headshotUrl) && (
                                <div className="mt-4 w-16 h-16 rounded-full overflow-hidden border border-white/10">
                                  <img src={editData.headshotUrl || item.headshotUrl} className="w-full h-full object-cover" alt="headshot" />
                                </div>
                              )}
                           </div>
                           <div className="space-y-4">
                              <input className="bg-transparent border-b border-white/10 w-full outline-none text-sm py-1 font-display" placeholder="Client Name" value={editData.name ?? ''} onChange={e => setEditData({...editData, name: e.target.value})} />
                              <input className="bg-transparent border-b border-white/10 w-full outline-none text-[10px] uppercase tracking-widest" placeholder="Brokerage / Company" value={editData.brokerage ?? ''} onChange={e => setEditData({...editData, brokerage: e.target.value})} />
                              <input type="number" className="bg-transparent border-b border-white/10 w-full outline-none text-[10px] uppercase" placeholder="Index Order" value={editData.order ?? 0} onChange={e => setEditData({...editData, order: parseInt(e.target.value)})} />
                           </div>
                        </div>
                        <textarea className="bg-transparent border border-white/10 w-full h-32 p-4 text-xs font-mono" placeholder="Enter quotation..." value={editData.quote ?? ''} onChange={e => setEditData({...editData, quote: e.target.value})} />
                        <div className="flex gap-4">
                           <button onClick={() => handleUpdateTestimonial(item.id)} className="px-6 py-3 bg-brick-copper text-charcoal text-[10px] uppercase tracking-widest">Persist</button>
                           <button onClick={() => setIsEditing(null)} className="px-6 py-3 border border-white/10 text-white/40 text-[10px] uppercase tracking-widest">Release</button>
                        </div>
                      </div>
                  ) : (
                    <div className="flex justify-between items-start">
                       <div className="flex gap-6 items-start">
                          <img src={item.headshotUrl} className="w-16 h-16 rounded-full object-cover border border-white/10" alt="" />
                          <div>
                             <h4 className="text-lg font-display italic text-white mb-1">{item.name}</h4>
                             <p className="text-[9px] uppercase tracking-widest text-brick-copper mb-4">{item.brokerage}</p>
                             <p className="text-xs text-white/60 font-mono italic">"{item.quote}"</p>
                          </div>
                       </div>
                       <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setIsEditing(item.id); setEditData(item); }} className="text-white/20 hover:text-brick-copper"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteTestimonial(item.id)} className="text-white/20 hover:text-red-500"><Trash2 size={16} /></button>
                       </div>
                    </div>
                  )}
                </div>
              ))}
              {testimonials.length === 0 && (
                <div className="py-20 text-center border border-dashed border-white/5 text-white/20">
                  <p className="text-[10px] uppercase tracking-[0.3em]">No social proof registered.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'inquiries' && (
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

        {activeTab === 'admins' && (
          <section className="max-w-4xl">
            <div className="flex items-center gap-3 text-brick-copper mb-8 border-b border-white/5 pb-4">
              <Shield size={18} />
              <h3 className="font-display text-2xl italic">Guardian Access</h3>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 p-8 mb-12 flex justify-between items-center">
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-2">System Orchestration</h4>
                <p className="text-[10px] text-white/20 italic font-mono">Initialize high-quality narratives for your core services.</p>
              </div>
              <button 
                onClick={async () => {
                  const servicePages = [
                    {
                      title: 'Architectural Photography',
                      slug: 'architectural-photography',
                      description: 'High-fidelity architectural photography capturing the soul of structural design.',
                      content: '# Architectural Photography: The Art of Stillness\n\nAt **Exposed Brick Media**, we don\'t just take pictures of buildings. We capture the conversation between light, shadow, and structure.\n\n## Our Approach\nEvery property has a "hero" narrative. Our process involves:\n- **Light Study**: We analyze the sun\'s path to ensure we capture the exterior at the precise moment of \'Golden Hour\' or \'Blue Hour\'.\n- **Composition**: Using wide-angle shift lenses to maintain vertical integrity and geometric precision.\n- **Atmosphere**: Beyond the wide shot, we focus on the textures—the grain of the wood, the coldness of the steel, the "exposed brick."\n\n### Technical Standard\n- Full-frame high-resolution sensors.\n- Manual bracketed exposures for perfect HDR (High Dynamic Range) without the "fake" look.\n- Advanced post-processing for color accuracy.',
                      showInNav: false,
                      order: 10
                    },
                    {
                      title: 'Cinematic Video Tours',
                      slug: 'cinematic-video-tours',
                      description: 'Story-driven cinematic video tours for luxury real estate.',
                      content: '# Cinematic Video: Rhythmic Narratives\n\nVideo should be an experience, not just a walkthrough. We create rhythmic, story-driven films that evoke an emotional connection with the space.\n\n## The Narrative Flow\nWe treat every video like a short film:\n1. **The Arrival**: Capturing the approach and the first impression.\n2. **The Heart**: Focusing on the primary living spaces where life happens.\n3. **The Details**: Macro shots of premium finishes and architectural flourishes.\n4. **The Context**: Aerial footage showing the property\'s place in the world.\n\n### Deliverables\n- 4K High Bitrate delivery.\n- Licensed cinematic soundtrack.\n- Social media "Teaser" trailers (9:16 vertical).',
                      showInNav: false,
                      order: 11
                    },
                    {
                      title: 'Aerial Perspective',
                      slug: 'aerial-perspective',
                      description: 'Precision drone photography and videography to capture context and scale.',
                      content: '# Aerial Perspective: The Big Picture\n\nContext is everything. Our aerial services provide the bird\'s eye view necessary to understand a property\'s scale, its surrounding landscape, and its relationship to the environment.\n\n## Precision Flight\n- **RPAS Licensed Pilots**: Safety and regulation compliance is non-negotiable.\n- **Advanced Sensors**: We use drones with large sensors to ensure aerial shots match the quality of our ground-based photography.\n- **Site Planning**: We map out flight paths to highlight proximity to landmarks, water, and acreage.\n\n### Use Cases\n- Large estate overviews.\n- Commercial site progress.\n- Neighborhood context for residential listings.',
                      showInNav: false,
                      order: 12
                    }
                  ];
                  
                  for (const pageData of servicePages) {
                    if (!pages.find(p => p.slug === pageData.slug)) {
                       await addDoc(collection(db, 'pages'), {
                         ...pageData,
                         createdAt: serverTimestamp(),
                         updatedAt: serverTimestamp()
                       });
                    }
                  }

                  // Link existing services
                  for (const service of services) {
                    const match = servicePages.find(p => p.title.toLowerCase().includes(service.title.toLowerCase()) || service.title.toLowerCase().includes(p.title.toLowerCase()));
                    if (match && !service.url) {
                      await updateDoc(doc(db, 'services', service.id), {
                        url: `/p/${match.slug}`,
                        updatedAt: serverTimestamp()
                      });
                    }
                  }
                  alert("Narratives seeded and linked.");
                }}
                className="px-6 py-2 border border-brick-copper text-brick-copper text-[10px] uppercase tracking-widest font-bold hover:bg-brick-copper hover:text-charcoal transition-all"
              >
                Seed Service Narratives
              </button>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-8 mb-12">
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Authorize New Guardian</h4>
              <div className="flex gap-4">
                <input 
                  className="flex-1 bg-transparent border-b border-white/10 outline-none py-2 text-sm focus:border-brick-copper transition-colors"
                  placeholder="Enter email address..."
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                />
                <button 
                  onClick={handleCreateAdmin}
                  className="px-8 py-3 bg-brick-copper text-charcoal text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-all"
                >
                  Authorize
                </button>
              </div>
              <p className="mt-4 text-[10px] text-white/20 italic italic font-mono">Note: Core developers defined in source code have persistent access.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Active Guardians</h4>
              
              {/* Hardcoded Core Admins */}
              {ADMIN_EMAILS.map(email => (
                <div key={email} className="flex justify-between items-center p-6 border border-brick-copper/20 bg-brick-copper/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-brick-copper animate-pulse" />
                    <div>
                      <p className="text-sm font-medium">{email}</p>
                      <p className="text-[10px] text-brick-copper uppercase tracking-widest">Core Narrative Guardian</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest italic">Immutable</div>
                </div>
              ))}

              {/* Dynamic Admins */}
              {admins.map(admin => (
                <div key={admin.id} className="flex justify-between items-center p-6 border border-white/5 bg-white/[0.01] group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div>
                      <p className="text-sm font-medium">{admin.email}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Authorized Administrator</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                    className="p-3 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
