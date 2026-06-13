/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  LogOut, Plus, Trash2, GitMerge, Edit2, Check, X, Shield, Sparkles, Upload, 
  Layout, MoveUp, MoveDown, Compass, Save, Palette, Type, Globe, 
  Users, MessageSquare, Briefcase, FileText, Settings, Instagram, 
  Twitter, Linkedin, Facebook, Mail, Phone, MapPin, Loader2, Box,
  Eye, EyeOff, GripVertical, ArrowUp, ArrowDown, Bed, Bath, Square, ExternalLink, Download, Bell, Zap, ChevronDown, UserPlus,
  Video, Youtube
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
import { ImageSelector } from './ImageSelector';
import { MultiImageUploader } from './MultiImageUploader';
import { PuckEditor } from './PuckEditor';
import { Portfolio } from './PortfolioSections';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { ADMIN_EMAILS, PROPERTY_TYPES, PROPERTY_STATUSES, PORTFOLIO_CATEGORIES } from '../constants';

const SortableNavItem = ({ 
  item, 
  onDelete, 
  onToggleHidden,
  onChangeLabel, 
  onChangeUrl 
}: { 
  item: any; 
  onDelete: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onChangeLabel: (val: string) => void;
  onChangeUrl: (val: string) => void;
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
    opacity: item.hidden ? 0.4 : (isDragging ? 0.6 : 1),
    filter: item.hidden ? 'grayscale(0.5)' : 'none'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white/5 border border-white/5 p-4 flex flex-col gap-3 relative group ${isDragging ? 'border-brick-copper bg-white/10 z-50' : ''} ${item.hidden ? 'border-red-500/10' : ''}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-white/10 hover:text-brick-copper transition-colors">
            <GripVertical size={16} />
          </div>
          <div className="flex-1 space-y-1">
             <div className="flex items-center gap-2">
                <input 
                  className={`bg-transparent border-b border-white/10 text-[10px] uppercase tracking-widest outline-none w-full p-1 focus:border-brick-copper transition-colors font-bold ${item.hidden ? 'text-white/20' : 'text-white'}`} 
                  value={item.label}
                  placeholder="Link Label"
                  onChange={e => onChangeLabel(e.target.value)}
                />
                {item.isPage && (
                  <span className="text-[7px] bg-brick-copper/20 text-brick-copper px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Page</span>
                )}
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onToggleHidden(item.id)}
            className={`p-1.5 transition-colors ${item.hidden ? 'text-red-500 hover:text-red-400' : 'text-white/10 hover:text-white'}`}
            title={item.hidden ? "Show in Navigation" : "Hide from Navigation"}
          >
            {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="text-white/10 hover:text-red-500 transition-colors p-1.5"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className={item.hidden ? 'opacity-20 pointer-events-none' : ''}>
        <LinkSelector 
          value={item.url}
          allowListing={false}
          onChange={onChangeUrl}
        />
      </div>
    </div>
  );
};

const SortablePortfolioRow = ({ 
  item, 
  onEdit, 
  onToggleHidden, 
  onDelete,
  users
}: { 
  item: any; 
  onEdit: (item: any) => void; 
  onToggleHidden: (id: string, hidden: boolean) => void;
  onDelete: (id: string) => void;
  users?: any[];
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
          item.status?.toLowerCase().includes('active') ? 'border-green-500/30 text-green-500 bg-green-500/5' : 
          item.status?.toLowerCase().includes('pending') ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' :
          item.status?.toLowerCase().includes('contract') ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' :
          item.status?.toLowerCase().includes('soon') ? 'border-purple-500/30 text-purple-500 bg-purple-500/5' :
          'border-white/10 text-white/40'
        }`}>
          {item.status || 'Pending'}
        </span>
      </td>
      <td className="p-4">
        {(item.partnerUids?.length > 0 || item.partnerUid) ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Shield size={10} className="text-brick-copper" />
              <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold truncate max-w-[100px]">
                {item.partnerUid ? (users?.find(u => u.id === item.partnerUid)?.displayName || 'Assigned') : (
                  item.partnerUids?.length === 1 ? (users?.find(u => u.id === item.partnerUids[0])?.displayName || item.partnerUids[0].substring(0, 8)) : `${item.partnerUids.length} Elements`
                )}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[9px] uppercase tracking-widest text-white/10 italic">Global</span>
        )}
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

// Safe JSON stringify helper for circular structures
const safeStringify = (obj: any, replacer?: (key: string, value: any) => any, indent?: number) => {
  const cache = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }
    return replacer ? replacer(key, value) : value;
  }, indent);
};

// Clean object for Firestore (remove functions and non-serializable fields)
const cleanObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Use safeStringify to break circles before cleaning
  try {
    return JSON.parse(safeStringify(obj));
  } catch (err) {
    console.error("CleanObject failure:", err);
    return obj;
  }
};

const PaginationControls = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/5 bg-white/[0.01] px-6 py-4 mt-6">
      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
        Showing <span className="text-white font-bold">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> to{" "}
        <span className="text-white font-bold">{Math.min(totalItems, currentPage * pageSize)}</span> of{" "}
        <span className="text-brick-copper font-bold">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1.5 border text-[10px] uppercase font-mono tracking-widest transition-all ${
            currentPage === 1
              ? "border-white/5 text-white/20 cursor-not-allowed"
              : "border-white/10 hover:border-brick-copper hover:text-brick-copper text-white/70"
          }`}
        >
          &larr; Previous
        </button>
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono px-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1.5 border text-[10px] uppercase font-mono tracking-widest transition-all ${
            currentPage === totalPages
              ? "border-white/5 text-white/20 cursor-not-allowed"
              : "border-white/10 hover:border-brick-copper hover:text-brick-copper text-white/70"
          }`}
        >
          Next &rarr;
        </button>
      </div>
    </div>
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
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [brandResources, setBrandResources] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'architecture' | 'layout' | 'portfolio' | 'services' | 'inquiries' | 'pages' | 'testimonials' | 'admins' | 'portal' | 'partners' | 'teams' | 'brand' | 'popups' | 'fotello' | 'communications' | 'referrals'>('architecture');

  // Unified Real-time Notification Hub & Alerts States
  const [hubInquiries, setHubInquiries] = useState<any[]>([]);
  const [hubNotifications, setHubNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationHubOpen, setNotificationHubOpen] = useState(false);
  const [draftReplyModalContent, setDraftReplyModalContent] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Merge duplicate partner states
  const [mergeSource, setMergeSource] = useState<any | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [mergeOptions, setMergeOptions] = useState({
    reassignProjects: true,
    reassignReferrals: true,
    copyMissingDetails: true,
    deleteSource: true
  });
  const [isMerging, setIsMerging] = useState(false);

  const isAdmin = !!user?.email && (
    ADMIN_EMAILS.includes(user.email) || 
    admins.some(a => a.email === user.email)
  );

  // Paginated Views States
  const [portfolioPage, setPortfolioPage] = useState(1);
  const portfolioPageSize = 10;
  
  const [partnersPage, setPartnersPage] = useState(1);
  const partnersPageSize = 10;
  
  const [inquiriesPage, setInquiriesPage] = useState(1);
  const inquiriesPageSize = 12;

  const [referralsPage, setReferralsPage] = useState(1);
  const referralsPageSize = 12;

  const [testimonialsPage, setTestimonialsPage] = useState(1);
  const testimonialsPageSize = 10;

  const [jobsPage, setJobsPage] = useState(1);
  const jobsPageSize = 8;

  // Partner Search & Filtering & Sorting States
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerRoleFilter, setPartnerRoleFilter] = useState('all');
  const [partnerTeamFilter, setPartnerTeamFilter] = useState('all');
  const [partnerSortField, setPartnerSortField] = useState<'displayName' | 'email' | 'createdAt' | 'role'>('displayName');
  const [partnerSortOrder, setPartnerSortOrder] = useState<'asc' | 'desc'>('asc');
  const [partnerDirectorySearch, setPartnerDirectorySearch] = useState('');
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [showFotelloModal, setShowFotelloModal] = useState(false);
  const [fotelloPartners, setFotelloPartners] = useState<any[]>([]);
  const [loadingFotello, setLoadingFotello] = useState(false);

  // Sync pages to 1 on active tab / search change
  useEffect(() => {
    setPortfolioPage(1);
    setPartnersPage(1);
    setInquiriesPage(1);
    setTestimonialsPage(1);
    setJobsPage(1);
  }, [activeTab]);

  // Reset page when any partner filter or sort changes
  useEffect(() => {
    setPartnersPage(1);
  }, [partnerSearch, partnerRoleFilter, partnerTeamFilter, partnerSortField, partnerSortOrder]);

  // Merge and sort all logged entries (Inbound CRM leads + Outbound Brevo Mailer dispatches)
  const mergedHubLogs = useMemo(() => {
    const combined = [...hubInquiries, ...hubNotifications];
    return combined.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  }, [hubInquiries, hubNotifications]);

  // Persistent background onSnapshot listener for both leads and outbound dispatches
  useEffect(() => {
    if (!user || !isAdmin) return;

    const mountTime = Date.now();
    let initialInquiriesLoaded = false;
    let initialNotificationsLoaded = false;

    // A. Listen to incoming inquiry submissions in real-time
    const inquiriesQuery = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(15));
    const unsubInquiries = onSnapshot(inquiriesQuery, (snap) => {
      const parsedInquiries = snap.docs.map(d => {
        const data = d.data();
        let timestamp = mountTime;
        if (data.createdAt) {
          timestamp = data.createdAt.seconds 
            ? data.createdAt.seconds * 1000 
            : new Date(data.createdAt).getTime();
        }
        return {
          id: d.id,
          type: 'inquiry',
          title: `Inquiry: ${data.realtorName || 'Customer Lead'}`,
          description: data.propertyAddress || 'No property specified',
          email: data.email || '',
          service: data.serviceType || 'Photography',
          createdAt: timestamp
        };
      });

      if (!initialInquiriesLoaded) {
        initialInquiriesLoaded = true;
        setHubInquiries(parsedInquiries);
      } else {
        // Look for items that didn't exist before and were added since mountTime
        setHubInquiries(prev => {
          const previousIds = new Set(prev.map(x => x.id));
          const newlyAdded = parsedInquiries.filter(x => !previousIds.has(x.id));

          newlyAdded.forEach(newItem => {
            if (newItem.createdAt > mountTime - 10000) {
              setUnreadCount(c => c + 1);
              toast.custom((t) => (
                <div 
                  id={`noti-toast-${newItem.id}`}
                  className={`${
                    t.visible ? 'animate-in fade-in slide-in-from-bottom-5 duration-300' : 'animate-out fade-out duration-300'
                  } max-w-sm w-full bg-charcoal/95 border border-brick-copper p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col gap-2 rounded-none font-sans`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-brick-copper">
                      <span className="w-1.5 h-1.5 bg-brick-copper rounded-full animate-ping" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-extrabold">CRM Lead Capture</span>
                    </div>
                    <button onClick={() => toast.dismiss(t.id)} className="text-white/30 hover:text-white transition-colors">✕</button>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-semibold text-white font-display italic">{newItem.title}</h5>
                    <p className="text-[10px] text-white/50 leading-relaxed max-w-[280px] truncate">{newItem.description}</p>
                    <p className="text-[8px] font-mono text-brick-copper uppercase tracking-wider">{newItem.service} project request</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('inquiries');
                      setNotificationHubOpen(false);
                      toast.dismiss(t.id);
                    }}
                    className="mt-2 text-[9px] uppercase tracking-[0.2em] font-black py-2 bg-brick-copper text-charcoal hover:bg-white transition-all text-center"
                  >
                    Manage Lead ➔
                  </button>
                </div>
              ), { duration: 10000 });
            }
          });
          return parsedInquiries;
        });
      }
    });

    // B. Listen to outgoing emails and campaign logs in real-time
    const notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(15));
    const unsubNotifications = onSnapshot(notificationsQuery, (snap) => {
      const parsedNotifications = snap.docs.map(d => {
        const data = d.data();
        let timestamp = mountTime;
        if (data.createdAt) {
          timestamp = new Date(data.createdAt).getTime();
        }
        return {
          id: d.id,
          type: 'notification',
          title: `Dispatch: ${data.subject || 'System Mailer'}`,
          description: `Recipient: ${data.to || 'Admin'}`,
          status: data.status,
          error: data.error,
          createdAt: timestamp
        };
      });

      if (!initialNotificationsLoaded) {
        initialNotificationsLoaded = true;
        setHubNotifications(parsedNotifications);
      } else {
        // Look for new dispatches since initial mount
        setHubNotifications(prev => {
          const previousIds = new Set(prev.map(x => x.id));
          const newlyAdded = parsedNotifications.filter(x => !previousIds.has(x.id));

          newlyAdded.forEach(newItem => {
            if (newItem.createdAt > mountTime - 10000) {
              setUnreadCount(c => c + 1);
              toast.custom((t) => (
                <div 
                  id={`noti-toast-${newItem.id}`}
                  className={`${
                    t.visible ? 'animate-in fade-in slide-in-from-bottom-5 duration-300' : 'animate-out fade-out duration-300'
                  } max-w-sm w-full bg-charcoal/95 border border-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col gap-2 rounded-none font-sans`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-white/50">
                      <span className={`w-1.5 h-1.5 rounded-full ${newItem.status === 'delivered' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-extrabold font-sans">Outbound Telemetry</span>
                    </div>
                    <button onClick={() => toast.dismiss(t.id)} className="text-white/30 hover:text-white transition-colors">✕</button>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-semibold text-white/90 truncate max-w-[280px]">{newItem.title}</h5>
                    <p className="text-[10px] text-white/50">{newItem.description}</p>
                    <p className="text-[8px] font-mono text-[#ccd0d4]/80 uppercase">
                      {newItem.status === 'delivered' ? '✔ Routed successfully through Brevo' : `✕ Delivery Refused: ${newItem.error || 'Server error'}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('communications');
                      setNotificationHubOpen(false);
                      toast.dismiss(t.id);
                    }}
                    className="mt-2 text-[9px] uppercase tracking-[0.2em] font-black py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-center"
                  >
                    View Mail Audits ➔
                  </button>
                </div>
              ), { duration: 8000 });
            }
          });
          return parsedNotifications;
        });
      }
    });

    return () => {
      unsubInquiries();
      unsubNotifications();
    };
  }, [user, isAdmin]);

  // Filter and Sort calculation for Partners
  const filteredAndSortedPartners = useMemo(() => {
    let result = [...users];

    // Search term filtering
    if (partnerSearch.trim()) {
      const query = partnerSearch.toLowerCase();
      result = result.filter(u => {
        const name = (u.displayName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
      });
    }

    // Role filtering
    if (partnerRoleFilter !== 'all') {
      result = result.filter(u => {
        const role = u.role || 'client';
        return role === partnerRoleFilter;
      });
    }

    // Team filtering
    if (partnerTeamFilter !== 'all') {
      result = result.filter(u => {
        if (partnerTeamFilter === 'independent') {
          return !u.teamId;
        }
        return u.teamId === partnerTeamFilter;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (partnerSortField === 'displayName') {
        valA = (a.displayName || 'Unnamed Partner').toLowerCase();
        valB = (b.displayName || 'Unnamed Partner').toLowerCase();
      } else if (partnerSortField === 'email') {
        valA = (a.email || '').toLowerCase();
        valB = (b.email || '').toLowerCase();
      } else if (partnerSortField === 'role') {
        valA = (a.role || 'client').toLowerCase();
        valB = (b.role || 'client').toLowerCase();
      } else if (partnerSortField === 'createdAt') {
        valA = a.createdAt?.seconds || 0;
        valB = b.createdAt?.seconds || 0;
      }

      if (valA < valB) return partnerSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return partnerSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, partnerSearch, partnerRoleFilter, partnerTeamFilter, partnerSortField, partnerSortOrder]);

  // Fotello configurable states
  const [fotelloConfig, setFotelloConfig] = useState<{ apiKey: string; liveConnect: boolean }>({
    apiKey: 'api-074832e3d4901ef4d1ec4e8dc98072bcae703dca2b1155dc',
    liveConnect: false
  });
  const [isEditingFotelloApiKey, setIsEditingFotelloApiKey] = useState(false);
  const [tempFotelloApiKey, setTempFotelloApiKey] = useState('');
  const [isSavingFotelloConfig, setIsSavingFotelloConfig] = useState(false);

  // Fotello active jobs and clients state
  const [fotelloJobs, setFotelloJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedClientForJob, setSelectedClientForJob] = useState<{ [jobId: string]: string }>({});
  const [deliveringJobId, setDeliveringJobId] = useState<string | null>(null);

  // Google My Business reviews passive aggregation states
  const [gmbConfig, setGmbConfig] = useState<{
    placeId: string;
    apiKey: string;
    enabled: boolean;
    simulate: boolean;
    autoSync: boolean;
    minRating: number;
  }>({
    placeId: '',
    apiKey: '',
    enabled: true,
    simulate: true,
    autoSync: false,
    minRating: 4
  });
  const [gmbReviews, setGmbReviews] = useState<any[]>([]);
  const [syncingGmb, setSyncingGmb] = useState(false);
  const [savingGmbConfig, setSavingGmbConfig] = useState(false);

  // Load brand resources
  useEffect(() => {
    if (!user) return;
    const unSub = onSnapshot(collection(db, 'brand_resources'), (snapshot) => {
       const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       setBrandResources(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'brand_resources'));
    return () => unSub();
  }, [user]);

  // Load registered partners
  useEffect(() => {
    if (!user) return;

    const fetchUnifiedList = async () => {
      try {
        const res = await fetch('/api/admin/clients');
        if (res.ok) {
          const list = await res.json();
          setUsers(list);
        }
      } catch (err) {
        console.warn("Unified API partners fetch failed:", err);
      }
    };

    fetchUnifiedList();

    const unSub = onSnapshot(collection(db, 'users'), (snapshot) => {
       const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       if (list.length > 0) {
         setUsers(list);
       }
    }, (error) => {
       console.warn("Firebase collection 'users' listener failed, using API fallback:", error.message || error);
       fetchUnifiedList();
    });
    return () => unSub();
  }, [user]);

  // Load teams
  useEffect(() => {
    if (!user) return;
    const unSub = onSnapshot(collection(db, 'teams'), (snapshot) => {
       const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       setTeams(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'teams'));
    return () => unSub();
  }, [user]);

  // Load Fotello Sync Pending Review Queue
  useEffect(() => {
    if (!user) return;

    const fetchQueueList = async () => {
      try {
        const res = await fetch('/api/admin/partners/sync-queue');
        if (res.ok) {
          const list = await res.json();
          setSyncQueue(list);
        }
      } catch (err) {
        console.warn("API fallback queue fetch failed:", err);
      }
    };

    fetchQueueList();

    const unSub = onSnapshot(collection(db, 'fotello_sync_queue'), (snapshot) => {
       const list = snapshot.docs
         .map(doc => ({ id: doc.id, ...doc.data() }))
         .filter((item: any) => item.status !== 'resolved');
       setSyncQueue(list);
    }, (error) => {
       console.warn("Firebase collection 'fotello_sync_queue' listener failed:", error.message || error);
       fetchQueueList();
    });
    return () => unSub();
  }, [user]);
  const [activeEditTab, setActiveEditTab] = useState<'media' | 'details' | 'narrative' | 'display'>('media');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPuck, setShowPuck] = useState(false);
  const [puckPageId, setPuckPageId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'order', direction: 'asc' });

  const { settings, pages, setIsEditMode, popups } = useSiteContent();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [fotelloImportLink, setFotelloImportLink] = useState('');
  const [isImportingLink, setIsImportingLink] = useState(false);

  // Communications Hub states & functions
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notiSearch, setNotiSearch] = useState('');
  const [notiStatusFilter, setNotiStatusFilter] = useState<'all' | 'delivered' | 'failed'>('all');
  const [notiTypeFilter, setNotiTypeFilter] = useState<string>('all');
  const [notiPage, setNotiPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [broadcastTo, setBroadcastTo] = useState<'all-partners' | 'custom'>('all-partners');
  const [broadcastCustomEmail, setBroadcastCustomEmail] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (notiSearch.trim()) {
      const q = notiSearch.toLowerCase();
      result = result.filter(n => 
        (n.to || '').toLowerCase().includes(q) || 
        (n.subject || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q)
      );
    }

    if (notiStatusFilter !== 'all') {
      result = result.filter(n => n.status === notiStatusFilter);
    }

    if (notiTypeFilter !== 'all') {
      result = result.filter(n => n.type === notiTypeFilter);
    }

    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return result;
  }, [notifications, notiSearch, notiStatusFilter, notiTypeFilter]);

  const handleSendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast.error("Subject and Message body are required");
      return;
    }

    let recipients: string[] = [];
    if (broadcastTo === 'custom') {
      if (!broadcastCustomEmail.trim()) {
        toast.error("Please provide a custom recipient email");
        return;
      }
      recipients = [broadcastCustomEmail.trim()];
    } else {
      const partnerEmails = users
        .filter(u => u.role === 'partner' || u.role === 'preferred')
        .map(u => u.email)
        .filter(Boolean);
      
      if (partnerEmails.length === 0) {
        toast.error("No registered partners found to broadcast to.");
        return;
      }
      recipients = Array.from(new Set(partnerEmails));
    }

    setIsSendingBroadcast(true);
    const toastId = toast.loading(`Sending broadcast to ${recipients.length} recipients...`);

    try {
      let successCount = 0;
      let failCount = 0;

      const sendPromises = recipients.map(async (email) => {
        try {
          const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject: broadcastSubject,
              body: broadcastMessage,
              type: 'custom_broadcast'
            })
          });
          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (e) {
          failCount++;
        }
      });

      await Promise.all(sendPromises);

      if (failCount === 0) {
        toast.success(`Successfully broadcasted email to all ${successCount} recipients!`, { id: toastId });
        setBroadcastSubject('');
        setBroadcastMessage('');
        setBroadcastCustomEmail('');
      } else {
        toast.success(`Broadcast partially completed: ${successCount} sent, ${failCount} failed. Check the communication logs below.`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Broadcast failed: ${err.message}`, { id: toastId });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handlePullPreviewsFromLink = async () => {
    if (!fotelloImportLink.trim()) {
      toast.error("Please paste a valid delivery or asset hub link first.");
      return;
    }
    setIsImportingLink(true);
    const toastId = toast.loading("Connecting to source and compiling low-res thumbnails...");
    try {
      const response = await fetch('/api/admin/fotello/extract-previews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fotelloImportLink.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        // Merge extracted external URLs into the current editing session state
        setEditData((prev: any) => ({
          ...prev,
          img: data.coverImg || prev.img,
          gallery: data.gallery ? [...(prev.gallery || []), ...data.gallery] : prev.gallery,
          fotelloUrl: fotelloImportLink.trim(),
          // If the source has a parsed address or title, populate it as a fallback
          title: prev.title === 'New Project' && data.title ? data.title : prev.title
        }));
        toast.success("Source links resolved successfully! Previews populated.", { id: toastId });
        setFotelloImportLink('');
      } else {
        throw new Error("Source rejected lookup or link pattern unrecognized.");
      }
    } catch (err: any) {
      toast.error(`Sync Error: ${err.message || 'Unable to scan target page assets.'}`, { id: toastId });
    } finally {
      setIsImportingLink(false);
    }
  };

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

  const handleNavDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const items = localSettings.navigationItems || [];
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index
      }));
      
      setLocalSettings({ ...localSettings, navigationItems: newItems });
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
    } else if (activeTab === 'communications') {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(100));
      unsub = onSnapshot(q, (snap) => {
        setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } else if (activeTab === 'referrals') {
      const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(q, (snap) => {
        setReferrals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [user, isAdmin, activeTab]);

  // Load and save Fotello configurations dynamically
  useEffect(() => {
    if (!user || !isAdmin || activeTab !== 'fotello') return;
    
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/admin/fotello/config');
        if (response.ok) {
          const data = await response.json();
          setFotelloConfig(data);
          setTempFotelloApiKey(data.apiKey || '');
        }
      } catch (err) {
        console.error("Failed to load Fotello CRM configs", err);
      }
    };

    loadConfig();
  }, [user, isAdmin, activeTab]);

  const handleSaveFotelloConfig = async (apiKey: string, liveConnect: boolean) => {
    setIsSavingFotelloConfig(true);
    const id = toast.loading("Saving Fotello configurations...");
    try {
      const response = await fetch('/api/admin/fotello/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, liveConnect })
      });
      if (response.ok) {
        setFotelloConfig({ apiKey, liveConnect });
        setIsEditingFotelloApiKey(false);
        toast.success("Fotello configurations updated successfully!", { id });
      } else {
        throw new Error("Failed to save changes");
      }
    } catch (err: any) {
      toast.error(`Error saving configurations: ${err.message}`, { id });
    } finally {
      setIsSavingFotelloConfig(false);
    }
  };

  // Synchronize Fotello active construction, shooting, and editing jobs
  useEffect(() => {
    if (!user || !isAdmin || activeTab !== 'fotello') return;

    const loadOrchestratorData = async () => {
      setIsLoadingJobs(true);
      try {
        const jobsResponse = await fetch("/api/admin/fotello/jobs");
        if (jobsResponse.ok) {
          const data = await jobsResponse.json();
          setFotelloJobs(data);
        }
      } catch (err) {
        console.error("Failed to load active Fotello jobs:", err);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadOrchestratorData();
  }, [user, isAdmin, activeTab]);

  const handleDeliverJobToClient = async (jobId: string, address: string) => {
    const targetClientId = selectedClientForJob[jobId];
    if (!targetClientId) {
      toast.error("Please pick a designated target partner from the selection dropdown before delivery.");
      return;
    }

    setDeliveringJobId(jobId);
    const id = toast.loading(`Initiating one-click delivery orchestration for ${address}...`);

    try {
      const response = await fetch("/api/admin/fotello/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enhance_id: jobId,
          client_id: targetClientId,
          property_address: address
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delivery orchestration request was rejected.");
      }

      const resData = await response.json();
      toast.success(`Success: ${resData.message} Material has been dispatched to client's dashboard.`, { id });
      
      // Update jobs list state
      const jobsResponse = await fetch("/api/admin/fotello/jobs");
      if (jobsResponse.ok) {
        const data = await jobsResponse.json();
        setFotelloJobs(data);
      }
    } catch (err: any) {
      toast.error(`Orchestration failure: ${err.message}`, { id });
    } finally {
      setDeliveringJobId(null);
    }
  };

  // Load and save Google My Business reviews config
  useEffect(() => {
    if (!user || !isAdmin || activeTab !== 'testimonials') return;

    const loadGmbConfig = async () => {
      try {
        const response = await fetch('/api/admin/google-reviews/config');
        if (response.ok) {
          const data = await response.json();
          setGmbConfig(data.config);
          setGmbReviews(data.cachedReviews || []);
        }
      } catch (err) {
        console.error("Failed to load Google Reviews configurations", err);
      }
    };

    loadGmbConfig();
  }, [user, isAdmin, activeTab]);

  const handleSaveGmbConfig = async (configUpdate: typeof gmbConfig) => {
    setSavingGmbConfig(true);
    const id = toast.loading("Saving Google Business settings...");
    try {
      const response = await fetch('/api/admin/google-reviews/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configUpdate)
      });
      if (response.ok) {
        const resData = await response.json();
        setGmbConfig(resData.config);
        toast.success("Google My Business settings updated!", { id });
        return true;
      } else {
        throw new Error("Failed to update Google GMB specs");
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id });
      return false;
    } finally {
      setSavingGmbConfig(false);
    }
  };

  const handleSyncGmbReviews = async () => {
    setSyncingGmb(true);
    const id = toast.loading("Syncing passive Google Business Profile reviews...");
    try {
      const response = await fetch('/api/admin/google-reviews/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const resData = await response.json();
        setGmbReviews(resData.reviews || []);
        toast.success(`Success: Passive Sync downloaded ${resData.reviewsCount} Google reviews!`, { id });
      } else {
        throw new Error("Synchronization request failed");
      }
    } catch (err: any) {
      toast.error(`Sync error: ${err.message}`, { id });
    } finally {
      setSyncingGmb(false);
    }
  };

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
      // Use safeStringify to avoid circular structures
      const sanitizedDetails = JSON.parse(safeStringify(details, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (key === 'layout') return '[Layout Data]'; // Avoid logging huge layouts twice
          return value;
        }
        return value;
      }));

      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify({ action, details: sanitizedDetails, user: user.email })
      });
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  const handleCreatePortfolio = async () => {
    const newItem = {
      title: 'New Project',
      category: PORTFOLIO_CATEGORIES[0],
      propertyType: PROPERTY_TYPES[0],
      status: PROPERTY_STATUSES[0],
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
    // Exclude UI-only properties and immutable fields
    const { id: _, createdAt: __, daysOnMarket: ___, onSelect: ____, selected: _____, ...dataToUpdate } = editData;
    
    try {
      await updateDoc(docRef, {
        ...cleanObject(dataToUpdate),
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
      url: '',
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
    const docRef = await addDoc(collection(db, 'pages'), newPage);
    
    // Sync with navigation
    const navId = `page-${docRef.id}`;
    const newNavItems = [...(localSettings.navigationItems || [])];
    newNavItems.push({
      id: navId,
      label: newPage.title,
      url: `/p/${newPage.slug}`,
      order: newNavItems.length,
      hidden: false,
      isPage: true
    });
    setLocalSettings({ ...localSettings, navigationItems: newNavItems });

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
      
      // Sync with navigation items in localSettings
      const navId = `page-${id}`;
      let newNavItems = [...(localSettings.navigationItems || [])];
      const existingNavIndex = newNavItems.findIndex(n => n.id === navId);

      if (editData.showInNav) {
        const newItem = {
          id: navId,
          label: editData.title || 'Untitled',
          url: `/p/${editData.slug}`,
          order: existingNavIndex !== -1 ? newNavItems[existingNavIndex].order : newNavItems.length,
          hidden: false,
          isPage: true
        };
        if (existingNavIndex !== -1) {
          newNavItems[existingNavIndex] = newItem;
        } else {
          newNavItems.push(newItem);
        }
      } else {
        if (existingNavIndex !== -1) {
          newNavItems = newNavItems.filter(n => n.id !== navId);
        }
      }
      setLocalSettings({ ...localSettings, navigationItems: newNavItems });

      await logAction('UPDATE_PAGE', { id, title: editData.slug });
      setIsEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pages/${id}`);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (confirm('Erase this entire narrative?')) {
      await deleteDoc(doc(db, 'pages', id));
      
      // Remove from navigation
      const navId = `page-${id}`;
      const newNavItems = (localSettings.navigationItems || []).filter(n => n.id !== navId);
      setLocalSettings({ ...localSettings, navigationItems: newNavItems });

      await logAction('DELETE_PAGE', { id });
    }
  };

  const getAiSuggestion = async (prompt: string, context?: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context,
          systemInstruction: "You are a high-end, minimalist architectural media agency creative director. Respond with polished, aspirational copy."
        })
      });

      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      return data.text || 'No suggestion received.';
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
      
      // TRIGGER EMAIL NOTIFICATION TO NEW ADMIN
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: `Administrative Access Granted - ${settings.brandName}`,
            body: `
              <div style="font-family: sans-serif; color: #1a1a1a;">
                <p>Hello,</p>
                <p>You have been granted administrative privileges for the <strong>${settings.brandName}</strong> digital platform.</p>
                <p>You can now access the admin dashboard by signing in with your Google account at <strong>${window.location.origin}/?admin=true</strong></p>
                <p style="margin-top: 20px; font-style: italic;">Welcome to the guardians of the narrative.</p>
              </div>
            `
          })
        });
      } catch (e) {
        console.error("Failed to send admin notification email", e);
      }

      await logAction('ADD_ADMIN', { email });
      setNewAdminEmail('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'admins');
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (ADMIN_EMAILS.includes(email)) {
      toast.error("This guardian is part of the core narrative and cannot be erased.");
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

  const handleCreatePopup = async () => {
    const newItem = {
      title: 'Summer Sale Notice',
      type: 'promotion',
      headline: '20% Off All Cinematic Tours!',
      content: 'Book any session this summer and get an instant discount on drone and 3D virtual tour packages. Mention code: SUMMER20 when reserving.',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
      ctaText: 'View Virtual Tours',
      ctaLink: '/p/virtual-tours',
      isActive: true,
      trigger: 'on_load',
      delaySeconds: 5,
      targetPage: 'all',
      createdAt: serverTimestamp()
    };
    try {
      const docRef = await addDoc(collection(db, 'popups'), newItem);
      await logAction('CREATE_POPUP', { title: newItem.title });
      setIsEditing(docRef.id);
      setEditData({ id: docRef.id, ...newItem });
      toast.success('Global Popup Created');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'popups');
    }
  };

  const handleUpdatePopup = async (id: string) => {
    const docRef = doc(db, 'popups', id);
    const { id: _, ...dataToUpdate } = editData;
    try {
      await updateDoc(docRef, { ...dataToUpdate, updatedAt: serverTimestamp() });
      await logAction('UPDATE_POPUP', { id, title: editData.title });
      setIsEditing(null);
      toast.success('Global Popup Updated');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `popups/${id}`);
    }
  };

  const handleDeletePopup = async (id: string) => {
    if (confirm('Permanently remove this global popup? Triggers referencing its ID will no longer function.')) {
      try {
        await deleteDoc(doc(db, 'popups', id));
        await logAction('DELETE_POPUP', { id });
        toast.success('Global Popup Removed');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `popups/${id}`);
      }
    }
  };

  const handleCreateTeam = async () => {
    const name = prompt("Enter team name:");
    if (!name) return;
    try {
      await addDoc(collection(db, 'teams'), {
        name,
        description: '',
        leaderUid: null,
        members: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Team created");
      await logAction('CREATE_TEAM', { name });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teams');
    }
  };

  const handleUpdateTeam = async (id: string, data?: any) => {
    try {
      const dataToUpdate = data || (() => {
        const { id: _, createdAt: __, updatedAt: ___, ...rest } = editData;
        return rest;
      })();
      
      const collectionName = activeTab === 'teams' ? 'teams' : 'users';

      await updateDoc(doc(db, collectionName, id), {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      toast.success(`${collectionName === 'teams' ? 'Team' : 'Partner'} profile updated`);
      if (!data) {
        await logAction(collectionName === 'teams' ? 'UPDATE_TEAM' : 'UPDATE_USER', { id, name: editData.name || editData.displayName });
        setIsEditing(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${activeTab === 'teams' ? 'teams' : 'users'}/${id}`);
    }
  };

  const handleCreateBrandResource = async (data: any) => {
    try {
      await addDoc(collection(db, 'brand_resources'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Resource added");
      await logAction('CREATE_RESOURCE', { title: data.title });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'brand_resources');
    }
  };

  const handleDeleteBrandResource = async (id: string) => {
    if (!confirm("Delete this branding asset?")) return;
    try {
      await deleteDoc(doc(db, 'brand_resources', id));
      toast.success("Resource removed");
      await logAction('DELETE_RESOURCE', { id });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `brand_resources/${id}`);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team? Partners will be dissociated.")) return;
    try {
      await deleteDoc(doc(db, 'teams', id));
      toast.success("Team deleted");
      await logAction('DELETE_TEAM', { id });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teams/${id}`);
    }
  };

  const handleUpdateUserTeam = async (userId: string, teamId: string | null) => {
    try {
      const team = teamId ? teams.find(t => t.id === teamId) : null;
      
      // Keep backend server cache in sync in real-time
      await fetch('/api/admin/partners/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          teamId,
          teamName: team ? team.name : null
        })
      });

      await updateDoc(doc(db, 'users', userId), {
        teamId: teamId,
        teamName: team ? team.name : null,
        updatedAt: serverTimestamp()
      });
      toast.success("Partner team updated and synchronized");
      await logAction('UPDATE_USER_TEAM', { userId, teamId });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleResolveQueue = async (queueId: string, action: 'skip' | 'merge' | 'create', name: string) => {
    const tid = toast.loading(`Resolving match for ${name}: ${action.toUpperCase()}...`);
    try {
      const response = await fetch('/api/admin/partners/sync-queue/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queueId, action }),
      });
      if (response.ok) {
        toast.success(`Successfully resolved match for ${name}!`, { id: tid });
      } else {
        const errData = await response.json();
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }
    } catch (err: any) {
      toast.error(`Error resolving match: ${err.message}`, { id: tid });
    }
  };

  const fetchFotelloPartners = async () => {
    setLoadingFotello(true);
    try {
      const res = await fetch("/api/admin/fotello-partners");
      if (res.ok) {
        const list = await res.json();
        setFotelloPartners(list);
      } else {
        toast.error("Failed to fetch Fotello database partners.");
      }
    } catch (err: any) {
      toast.error("Network error while connecting to Fotello database.");
      console.error(err);
    } finally {
      setLoadingFotello(false);
    }
  };

  const handleImportSinglePartner = async (partner: any) => {
    const tid = toast.loading(`Importing partner: ${partner.displayName}...`);
    try {
      const res = await fetch("/api/admin/partners/import-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partner)
      });
      if (res.ok) {
        toast.success(`Successfully imported ${partner.displayName}!`, { id: tid });
        await fetchFotelloPartners();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to import partner.");
      }
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`, { id: tid });
    }
  };

  const handleCreatePartner = async () => {
    const email = prompt("Enter Partner Email (this will be their login key):")?.toLowerCase().trim();
    if (!email) return;

    // Guardrail against duplicate emails
    const existingEmailMatch = users.find(u => u.email?.toLowerCase().trim() === email);
    if (existingEmailMatch) {
      toast.error(`A partner with email "${email}" is already registered! Please update their existing profile instead of creating a duplicate.`);
      return;
    }
    
    const displayName = prompt("Enter Partner Name:");
    if (!displayName) return;

    // Guardrail: warn of duplicate display names
    const existingNameMatch = users.find(u => u.displayName?.toLowerCase().trim() === displayName.toLowerCase().trim());
    if (existingNameMatch) {
      if (!confirm(`Warning: A registered partner named "${displayName}" already exists. Do you still want to proceed?`)) {
        return;
      }
    }

    try {
      // Use email as ID for pre-linking
      await setDoc(doc(db, 'users', email), {
        email,
        displayName,
        role: 'partner',
        teamId: null,
        teamName: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Synchronize creation with backend server cache too
      await fetch('/api/admin/partners/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: email,
          displayName,
          email,
          role: 'partner',
          teamId: null,
          teamName: null
        })
      });

      // TRIGGER EMAIL NOTIFICATION TO NEW PARTNER
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: `Partner Identity Pre-Synchronized - ${settings.brandName}`,
            body: `
              <div style="font-family: sans-serif; color: #1a1a1a;">
                <p>Hello ${displayName},</p>
                <p>An account has been prepared for you on the <strong>${settings.brandName} Partner Portal</strong>.</p>
                <p>You can access your brand assets, track referrals, and view your media history by signing in with this email at <strong>${window.location.origin}/portal</strong></p>
                <p style="margin-top: 20px; color: #c43b2a; font-weight: bold;">We look forward to defining light together.</p>
              </div>
            `
          })
        });
      } catch (e) {
        console.error("Failed to send partner notification email", e);
      }

      toast.success("Partner profile designated");
      await logAction('CREATE_PARTNER', { email, displayName });
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `users/${email}`);
    }
  };

  const handleDeletePartner = async (userId: string) => {
    if (!confirm("Permanently remove this partner profile? This cannot be undone.")) return;
    try {
      // Deletion sync
      await fetch('/api/admin/partners/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });

      await deleteDoc(doc(db, 'users', userId));
      toast.success("Partner profile removed");
      await logAction('DELETE_PARTNER', { userId });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const handleMergePartners = async () => {
    if (!mergeSource || !mergeTargetId) {
      toast.error("Please select a target primary partner to merge into.");
      return;
    }

    const targetPartner = users.find(u => u.id === mergeTargetId);
    if (!targetPartner) {
      toast.error("Selected primary partner could not be found.");
      return;
    }

    const confirmMsg = `Are you absolutely sure you want to merge duplicate partner "${mergeSource.displayName || mergeSource.id}" into primary partner "${targetPartner.displayName || targetPartner.id}"?\n\nThis will reassign references, migrate profile fields, and optionally remove the duplicate profile permanently.`;
    if (!confirm(confirmMsg)) return;

    setIsMerging(true);
    const toastId = toast.loading("Executing deep merge and reassigning portfolio & referrals...");
    try {
      const response = await fetch('/api/admin/partners/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceId: mergeSource.id,
          targetId: mergeTargetId,
          reassignProjects: mergeOptions.reassignProjects,
          reassignReferrals: mergeOptions.reassignReferrals,
          copyMissingDetails: mergeOptions.copyMissingDetails,
          deleteSource: mergeOptions.deleteSource
        })
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Failed to execute partner merge pipeline.");
      }

      const resData = await response.json();
      
      // Let's also apply client side Firestore updates to ensure the local context updates immediately
      if (mergeOptions.reassignReferrals) {
        try {
          const { getDocs, query, collection, where } = await import('firebase/firestore');
          const refQuery = query(collection(db, 'referrals'), where('referrerUid', '==', mergeSource.id));
          const querySnapshot = await getDocs(refQuery);
          for (const refDoc of querySnapshot.docs) {
            await updateDoc(doc(db, 'referrals', refDoc.id), {
              referrerUid: mergeTargetId,
              updatedAt: serverTimestamp()
            });
          }
        } catch (dbErr: any) {
          console.warn("[Client Referral Reassign Bypassed]:", dbErr.message);
        }
      }

      if (mergeOptions.deleteSource) {
        try {
          await deleteDoc(doc(db, 'users', mergeSource.id));
        } catch (dbErr: any) {
          console.warn("[Client Source Account Delete Bypassed]:", dbErr.message);
        }
      }

      toast.success(resData.message || "Deep merge completed successfully!", { id: toastId });
      
      // Reset state
      setMergeSource(null);
      setMergeTargetId('');
      
      await logAction('MERGE_PARTNERS', { sourceId: mergeSource.id, targetId: mergeTargetId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to complete merge pipeline.", { id: toastId });
    } finally {
      setIsMerging(false);
    }
  };

  const handleUpdatePartner = async (id: string) => {
    try {
      const { id: _, createdAt: __, ...dataToUpdate } = editData;

      // Keep backend server cache fully in sync dynamically in real-time
      await fetch('/api/admin/partners/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...dataToUpdate
        })
      });

      await updateDoc(doc(db, 'users', id), {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      toast.success("Partner profile updated and synchronized");
      await logAction('UPDATE_PARTNER', { id, displayName: editData.displayName });
      setIsEditing(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
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

  const groupedTabs = [
    {
      category: "Design & Identity",
      items: [
        { id: 'architecture', label: 'Home Meta', icon: Compass },
        { id: 'layout', label: 'Visual Builder', icon: Layout },
        { id: 'pages', label: 'Pages', icon: FileText },
        { id: 'brand', label: 'Brand Assets', icon: Box }
      ]
    },
    {
      category: "Portfolio & Offers",
      items: [
        { id: 'portfolio', label: 'Portfolio', icon: Layout },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'testimonials', label: 'Social Proof', icon: Users },
        { id: 'popups', label: 'Global Popups', icon: Bell }
      ]
    },
    {
      category: "Client Relations",
      items: [
        { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
        { id: 'referrals', label: 'Referrals', icon: UserPlus },
        { id: 'communications', label: 'Emails & Alerts', icon: Mail },
        { id: 'fotello', label: 'Fotello Sync', icon: Zap }
      ]
    },
    {
      category: "Access & Personnel",
      items: [
        { id: 'portal', label: 'Portal', icon: Shield },
        { id: 'partners', label: 'Partners', icon: Users },
        { id: 'teams', label: 'Teams', icon: Users },
        { id: 'admins', label: 'Admins', icon: Shield }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-charcoal z-[100] flex flex-col p-4 md:p-16 overflow-y-auto no-scrollbar font-sans">
      <Toaster position="bottom-right" />
      {showPuck && <PuckEditor pageId={puckPageId || undefined} onClose={() => { setShowPuck(false); setPuckPageId(null); }} />}
      
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-8 border-b border-white/10 pb-8">
        <div>
          <h2 className="font-display text-3xl md:text-4xl mb-2 italic">Admin Dashboard</h2>
          <p className="text-brick-copper text-[10px] uppercase tracking-[0.3em] font-medium font-sans">User: {user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 relative">
          {/* Real-time Notification Hub Dropdown */}
          <div className="relative font-sans inline-block">
            <button
              onClick={() => {
                setNotificationHubOpen(!notificationHubOpen);
                setUnreadCount(0); // Clear on view
              }}
              className={`p-3 relative outline-none transition-all border ${
                notificationHubOpen 
                  ? 'bg-brick-copper text-charcoal border-brick-copper hover:bg-brick-copper/90' 
                  : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
              title="Real-time Notification Hub"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brick-copper text-charcoal font-black text-[8px] px-1.5 py-0.5 rounded-full ring-2 ring-charcoal animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationHubOpen && (
                <>
                  {/* Overlay background to handle clicking away and closing drop-down */}
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setNotificationHubOpen(false)} />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-80 bg-charcoal border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-50 text-white p-4 font-sans flex flex-col max-h-[480px] rounded-none before:content-[''] before:absolute before:top-[-6px] before:right-[15px] before:w-3 before:h-3 before:bg-charcoal before:rotate-45 before:border-l before:border-t before:border-white/10 cursor-default"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 relative z-10">
                      <div className="flex items-center gap-2">
                        <Bell size={13} className="text-brick-copper animate-pulse" />
                        <h4 className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-white">Live Event Stream</h4>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider text-brick-copper bg-brick-copper/10 px-2 py-0.5 font-bold font-mono">Live</span>
                    </div>

                    <div className="overflow-y-auto no-scrollbar flex-1 space-y-2.5 pr-0.5 max-h-[320px] relative z-10">
                      {mergedHubLogs.map((log) => (
                        <div
                          key={log.id}
                          onClick={() => {
                            if (log.type === 'inquiry') {
                              setActiveTab('inquiries');
                            } else {
                              setActiveTab('communications');
                            }
                            setNotificationHubOpen(false);
                          }}
                          className="p-3 bg-white/[0.02] border border-white/5 hover:border-brick-copper/30 hover:bg-white/[0.04] transition-all cursor-pointer flex flex-col gap-1 text-left group relative"
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className={`text-[8px] tracking-[0.05em] uppercase font-bold font-mono ${
                              log.type === 'inquiry' 
                                ? 'text-brick-copper' 
                                : log.status === 'delivered' 
                                  ? 'text-emerald-400' 
                                  : 'text-red-400'
                            }`}>
                              {log.type === 'inquiry' ? '● Lead Capture' : log.status === 'delivered' ? '✓ Dispatch' : '✕ Outbound Err'}
                            </span>
                            <span className="text-[7px] font-mono text-white/30 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-white/95 group-hover:text-brick-copper transition-colors truncate max-w-[240px]">
                            {log.title}
                          </p>
                          <p className="text-[9.5px] text-white/50 leading-relaxed truncate max-w-[240px]">
                            {log.description}
                          </p>
                        </div>
                      ))}

                      {mergedHubLogs.length === 0 && (
                        <div className="py-12 text-center text-white/20 uppercase tracking-[0.25em] text-[8px] font-bold">
                          No active events in stream.
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center text-[7.5px] uppercase tracking-widest text-white/40 relative z-10 font-mono">
                      <span>Telemetry Logs</span>
                      <button 
                        onClick={() => {
                          setActiveTab('communications');
                          setNotificationHubOpen(false);
                        }} 
                        className="text-brick-copper hover:text-white hover:underline transition-all font-bold"
                      >
                        All Audits ➔
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

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

      {/* Mobile Selector Dropdown */}
      <div className="lg:hidden mb-12 relative font-sans">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex justify-between items-center bg-white/5 border border-white/10 p-4 text-white uppercase tracking-[0.2em] text-[10.5px] font-bold"
        >
          <span className="flex items-center gap-3">
            {(() => {
              const currentTabItem = groupedTabs.flatMap(g => g.items).find(i => i.id === activeTab);
              if (currentTabItem) {
                const Icon = currentTabItem.icon;
                return (
                  <>
                    <Icon size={14} className="text-brick-copper animate-pulse" />
                    <span>{currentTabItem.label}</span>
                  </>
                );
              }
              return 'Select View';
            })()}
          </span>
          <ChevronDown size={14} className={`text-white/55 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-180': ''}`} />
        </button>
        
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute left-0 right-0 mt-2 bg-charcoal border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 max-h-[360px] overflow-y-auto no-scrollbar p-2 flex flex-col gap-2">
              {groupedTabs.map((group, groupIdx) => (
                <div key={groupIdx} className="border-b border-white/5 last:border-b-0 pb-2 mb-2 last:pb-0 last:mb-0">
                  <span className="text-[7.5px] uppercase tracking-[0.25em] font-extrabold text-white/30 px-3 py-1.5 block">
                    {group.category}
                  </span>
                  <div className="flex flex-col gap-1">
                    {group.items.map((tab) => {
                      const Icon = tab.icon;
                      const isCur = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            setIsEditing(null);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-left font-bold transition-all ${
                            isCur 
                              ? 'bg-brick-copper/10 text-brick-copper border border-brick-copper/20' 
                              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <Icon size={12} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start pb-32">
        {/* Sidebar for Desktop navigation */}
        <aside className="hidden lg:flex flex-col gap-8 sticky top-6 bg-white/[0.01] border border-white/5 p-6 max-h-[85vh] overflow-y-auto no-scrollbar font-sans">
          {groupedTabs.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-2 border-b border-white/5 last:border-b-0 pb-6 last:pb-0">
              <span className="text-[8.5px] uppercase tracking-[0.25em] font-extrabold text-white/30 mb-2 block px-1">
                {group.category}
              </span>
              <div className="flex flex-col gap-1.5">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isCur = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsEditing(null);
                      }}
                      className={`flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-left font-semibold transition-all border ${
                        isCur 
                          ? 'bg-brick-copper/10 text-brick-copper border-brick-copper/20 font-black' 
                          : 'text-white/50 hover:text-white hover:bg-white/[0.03] border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={13} className={isCur ? 'text-brick-copper animate-pulse' : 'text-white/30'} />
                        <span>{tab.label}</span>
                      </span>
                      {isCur && <span className="w-1.5 h-1.5 bg-brick-copper rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Content Panel Workspace */}
        <div className="space-y-16">
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
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold">Header Navigation Nodes</h4>
                      <p className="text-[8px] text-white/30 uppercase tracking-widest mt-1">Populated by pages and custom entries</p>
                    </div>
                    <div className="flex gap-4">
                      {(localSettings.navigationItems?.length || 0) > 0 && (
                        <div className="flex gap-2 border-r border-white/10 pr-4 mr-2">
                           <button 
                             onClick={() => {
                               const newItems = (localSettings.navigationItems || []).map(i => ({...i, hidden: true}));
                               setLocalSettings({...localSettings, navigationItems: newItems});
                             }}
                             className="text-white/20 hover:text-white text-[8px] uppercase tracking-widest font-bold"
                             title="Hide All"
                           >
                             Hide All
                           </button>
                           <button 
                             onClick={() => {
                               const newItems = (localSettings.navigationItems || []).map(i => ({...i, hidden: false}));
                               setLocalSettings({...localSettings, navigationItems: newItems});
                             }}
                             className="text-white/20 hover:text-white text-[8px] uppercase tracking-widest font-bold"
                             title="Show All"
                           >
                             Show All
                           </button>
                           <button 
                             onClick={() => {
                               if (confirm('Erase all navigation nodes?')) {
                                 setLocalSettings({...localSettings, navigationItems: []});
                               }
                             }}
                             className="text-red-500/40 hover:text-red-500 text-[8px] uppercase tracking-widest font-bold ml-2"
                             title="Clear All"
                           >
                             Clear
                           </button>
                        </div>
                      )}
                      {(localSettings.navigationItems?.length || 0) === 0 && (
                        <button 
                          onClick={() => {
                            const defaultItems = [
                              { id: 'nav-about', label: 'About', url: '/about', order: 0, hidden: false },
                              { id: 'nav-services', label: 'Services', url: '/services', order: 1, hidden: false },
                              { id: 'nav-portfolio', label: 'Portfolio', url: '/', order: 2, hidden: false },
                              { id: 'nav-inquire', label: 'Inquire', url: '#inquire', order: 3, hidden: false },
                            ];
                            setLocalSettings({...localSettings, navigationItems: defaultItems});
                          }}
                          className="text-white/40 hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-widest transition-colors font-bold"
                        >
                          Populate Defaults
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const newItems = [...(localSettings.navigationItems || [])];
                          newItems.push({ id: Date.now().toString(), label: 'New Exploration', url: '#', order: newItems.length, hidden: false });
                          setLocalSettings({...localSettings, navigationItems: newItems});
                        }}
                        className="text-brick-copper hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-widest transition-colors font-bold"
                      >
                        <Plus size={12} /> Add Node
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleNavDragEnd}
                    >
                      <SortableContext 
                        items={(localSettings.navigationItems || []).map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {(localSettings.navigationItems || []).sort((a,b) => a.order - b.order).map((item, idx) => (
                            <SortableNavItem 
                              key={item.id}
                              item={item}
                              onDelete={(id) => {
                                const newItems = (localSettings.navigationItems || []).filter(i => i.id !== id);
                                setLocalSettings({...localSettings, navigationItems: newItems});
                              }}
                              onToggleHidden={(id) => {
                                const newItems = [...(localSettings.navigationItems || [])];
                                const index = newItems.findIndex(i => i.id === id);
                                if (index !== -1) {
                                  newItems[index].hidden = !newItems[index].hidden;
                                  setLocalSettings({...localSettings, navigationItems: newItems});
                                }
                              }}
                              onChangeLabel={(val) => {
                                const newItems = [...(localSettings.navigationItems || [])];
                                const index = newItems.findIndex(i => i.id === item.id);
                                if (index !== -1) {
                                  newItems[index].label = val;
                                  setLocalSettings({...localSettings, navigationItems: newItems});
                                }
                              }}
                              onChangeUrl={(val) => {
                                const newItems = [...(localSettings.navigationItems || [])];
                                const index = newItems.findIndex(i => i.id === item.id);
                                if (index !== -1) {
                                  newItems[index].url = val;
                                  setLocalSettings({...localSettings, navigationItems: newItems});
                                }
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    
                    {(localSettings.navigationItems?.length || 0) === 0 && (
                      <div className="py-12 text-center border border-dashed border-white/10 text-white/20">
                        <p className="text-[9px] uppercase tracking-widest italic">No navigation nodes established.</p>
                      </div>
                    )}
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
                        <div className="py-2">
                          <LinkSelector 
                            label="Link (Optional)"
                            value={editData.url || ''}
                            allowListing={false}
                            onChange={(val) => setEditData({...editData, url: val})}
                          />
                        </div>
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
                        <th className="p-4">Partner</th>
                        <th className="p-4">Fidelity Config</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      <SortableContext 
                        items={portfolioItems.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {(() => {
                          const searchedItems = getSortedItems(portfolioItems)
                            .filter(item => {
                              const s = editData.search?.toLowerCase() || '';
                              return !s || 
                                item.title?.toLowerCase().includes(s) || 
                                item.mlsNumber?.toLowerCase().includes(s) || 
                                item.status?.toLowerCase().includes(s) ||
                                item.category?.toLowerCase().includes(s) ||
                                item.bannerText?.toLowerCase().includes(s);
                            });
                          return searchedItems
                            .slice((portfolioPage - 1) * portfolioPageSize, portfolioPage * portfolioPageSize)
                            .map(item => (
                            <SortablePortfolioRow 
                              key={item.id} 
                              users={users}
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
                          ));
                        })()}
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
                  .slice((portfolioPage - 1) * portfolioPageSize, portfolioPage * portfolioPageSize)
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

            {(() => {
              const searchedCount = portfolioItems.filter(item => {
                const s = editData.search?.toLowerCase() || '';
                return !s || 
                  item.title?.toLowerCase().includes(s) || 
                  item.mlsNumber?.toLowerCase().includes(s) || 
                  item.status?.toLowerCase().includes(s) ||
                  item.category?.toLowerCase().includes(s) ||
                  item.bannerText?.toLowerCase().includes(s);
              }).length;
              return (
                <PaginationControls
                  currentPage={portfolioPage}
                  totalItems={searchedCount}
                  pageSize={portfolioPageSize}
                  onPageChange={setPortfolioPage}
                />
              );
            })()}

            {isEditing && portfolioItems.find(i => i.id === isEditing) && (
              <div className="fixed inset-0 z-[110] bg-charcoal/95 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-charcoal border border-brick-copper/30 w-full max-w-4xl h-full md:h-auto max-h-[90vh] overflow-hidden flex flex-col shadow-3xl">
                  <header className="p-6 border-b border-white/5 flex justify-between items-center bg-charcoal/80 shrink-0">
                    <div>
                      <h4 className="text-xl font-display italic text-white">{editData.title}</h4>
                      <p className="text-[9px] text-brick-copper uppercase tracking-widest font-bold tracking-[0.2em]">{editData.category}</p>
                    </div>
                    <button onClick={() => setIsEditing(null)} className="text-white/40 hover:text-white transition-colors p-2"><X size={20} /></button>
                  </header>
                  
                  <nav className="flex overflow-x-auto no-scrollbar border-b border-white/5 bg-white/[0.02] shrink-0">
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
                        {/* NEW: AUTOMATED PASTE-LINK CONSOLE */}
                        <div className="bg-brick-copper/[0.03] p-6 border border-brick-copper/20 rounded-sm space-y-4">
                          <div>
                            <h5 className="text-[10px] uppercase tracking-[0.3em] text-brick-copper font-black flex items-center gap-2">
                              <Zap size={12} className="animate-pulse" /> Source Stream Auto-Populate
                            </h5>
                            <p className="text-[8px] text-white/40 uppercase tracking-widest mt-1">
                              Paste your external delivery link below to fetch web-previews automatically.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                              <input
                                type="text"
                                placeholder="Paste Fotello or asset hub delivery URL (https://...)"
                                className="w-full bg-charcoal/60 border border-white/10 py-3 pl-10 pr-4 outline-none text-[11px] font-mono text-white focus:border-brick-copper transition-all"
                                value={fotelloImportLink}
                                onChange={e => setFotelloImportLink(e.target.value)}
                                disabled={isImportingLink}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handlePullPreviewsFromLink}
                              disabled={isImportingLink || !fotelloImportLink}
                              className={`px-6 text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2 h-[40px] ${
                                !fotelloImportLink
                                  ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                                  : 'bg-brick-copper text-charcoal hover:bg-white'
                              }`}
                            >
                              {isImportingLink ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              {isImportingLink ? 'Extracting...' : 'Sync Previews'}
                            </button>
                          </div>
                        </div>

                        <ImageSelector 
                          label="Primary Showcase Image"
                          path="portfolio"
                          value={editData.img || ''}
                          onChange={(url) => setEditData({...editData, img: url})}
                        />

                        {/* Photo Gallery Assets Manager */}
                        <div className="space-y-6 bg-white/[0.01] p-6 border border-white/5 rounded-sm">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div>
                              <h5 className="text-[10px] uppercase tracking-[0.3em] text-brick-copper font-black">Asset Gallery</h5>
                              <p className="text-[8px] text-white/40 uppercase tracking-widest mt-1 font-medium">These images are integrated into the listing subpage galleries</p>
                            </div>
                            <span className="text-[10px] text-white/20 font-mono">{(editData.gallery || []).length} Images</span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {(editData.gallery || []).map((url: string, index: number) => (
                              <div key={index} className="group relative aspect-square bg-white/5 border border-white/10 overflow-hidden">
                                <img src={url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all animate-in fade-in" referrerPolicy="no-referrer" />
                                <button 
                                  onClick={() => {
                                    const updatedGallery = (editData.gallery || []).filter((_: any, i: number) => i !== index);
                                    setEditData({ ...editData, gallery: updatedGallery });
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-red-900/80 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete Image"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}

                            <div className="aspect-square">
                              <MultiImageUploader 
                                listingId={editData.id} 
                                onUploadComplete={(newUrls) => {
                                  const currentGallery = editData.gallery || [];
                                  setEditData({
                                    ...editData,
                                    gallery: [...currentGallery, ...newUrls]
                                  });
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeEditTab === 'details' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-brick-copper/[0.03] p-8 border border-brick-copper/10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                 <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold">MLS Network Integration</label>
                                 <div className="flex gap-2">
                                   <input 
                                     placeholder="MLS Identification Number"
                                     className="bg-charcoal/50 border border-brick-copper/20 flex-1 outline-none py-3 px-4 text-[10px] font-mono text-white" 
                                     value={editData.mlsNumber || ''} 
                                     onChange={e => setEditData({...editData, mlsNumber: e.target.value})} 
                                   />
                                 </div>
                               </div>
                               <div className="flex-1">
                                 <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold">Listing Agent Page</label>
                                 <div className="flex gap-2">
                                   <div className="relative flex-1">
                                     <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12} />
                                     <input 
                                       placeholder="External Listing URL (https://...)"
                                       className="bg-charcoal/50 border border-brick-copper/20 w-full outline-none py-3 pl-10 pr-4 text-[10px] text-white" 
                                       value={editData.externalLink || ''} 
                                       onChange={e => setEditData({...editData, externalLink: e.target.value})} 
                                     />
                                   </div>
                                 </div>
                               </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold flex items-center gap-2">
                                  <Video size={10} /> Cinematic Video Tour
                                </label>
                                <input 
                                  placeholder="YouTube or Vimeo video link"
                                  className="bg-charcoal/50 border border-white/10 w-full outline-none py-3 px-4 text-[10px] text-white font-mono" 
                                  value={editData.videoUrl || ''} 
                                  onChange={e => setEditData({...editData, videoUrl: e.target.value})} 
                                />
                              </div>
                               <div>
                                 <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold flex items-center gap-2">
                                   <ExternalLink size={10} /> Fotello Package
                                 </label>
                                 <input 
                                   placeholder="Fotello direct link"
                                   className="bg-charcoal/50 border border-white/10 w-full outline-none py-3 px-4 text-[10px] text-white font-mono" 
                                   value={editData.fotelloUrl || ''} 
                                   onChange={e => setEditData({...editData, fotelloUrl: e.target.value})} 
                                 />
                               </div>
                               <div>
                                 <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold flex items-center gap-2">
                                   <ExternalLink size={10} /> Matterport Tour
                                 </label>
                                 <input 
                                    placeholder="Matterport scan link"
                                   className="bg-charcoal/50 border border-white/10 w-full outline-none py-3 px-4 text-[10px] text-white font-mono" 
                                   value={editData.matterportUrl || ''} 
                                   onChange={e => setEditData({...editData, matterportUrl: e.target.value})} 
                                 />
                               </div>
                               <div>
                                 <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold flex items-center gap-2">
                                   <FileText size={10} /> Technical Specs (PDF)
                                 </label>
                                 <div className="space-y-4">
                                   <input 
                                     placeholder="PDF Technical Sheet Link"
                                     className="bg-charcoal/50 border border-white/10 w-full outline-none py-3 px-4 text-[10px] text-white font-mono" 
                                     value={editData.specsUrl || ''} 
                                     onChange={e => setEditData({...editData, specsUrl: e.target.value})} 
                                   />
                                   <FileUpload 
                                      label="Upload Data Sheet" 
                                      path={`portfolio/${isEditing}/specs`} 
                                      accept="application/pdf"
                                      onUploadComplete={(url) => setEditData({...editData, specsUrl: url})}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold flex items-center gap-2">
                                    <Download size={10} className="text-emerald-400" /> Google Drive Link (Media Asset Package)
                                  </label>
                                  <div className="space-y-4">
                                    <input 
                                      placeholder="Google Drive folder link"
                                      className="bg-charcoal/50 border border-emerald-500/10 w-full outline-none py-3 px-4 text-[10px] text-white font-mono placeholder-white/20" 
                                      value={editData.driveDeliveryLink || ''} 
                                      onChange={e => setEditData({...editData, driveDeliveryLink: e.target.value})} 
                                    />
                                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-sm">
                                      <p className="text-[9px] text-white/40 leading-relaxed font-sans italic">
                                        This holds the high-res original assets delivery link. It is protected and is only visible/accessible to linked partners on their portfolio view.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                             </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">List Price</label>
                                <input 
                                  className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-[10px] font-mono text-white" 
                                  value={editData.listPrice || ''} 
                                  placeholder="$0,000,000"
                                  onChange={e => setEditData({...editData, listPrice: e.target.value})} 
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Property Type</label>
                                <select 
                                  className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-[10px] font-mono text-white" 
                                  value={editData.propertyType || ''} 
                                  onChange={e => setEditData({...editData, propertyType: e.target.value})} 
                                >
                                  <option value="" className="bg-charcoal">Select Type</option>
                                  {PROPERTY_TYPES.map(type => (
                                    <option key={type} value={type} className="bg-charcoal">{type}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Listing Status</label>
                                <select 
                                  className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-[10px] font-mono text-white" 
                                  value={editData.status || ''} 
                                  onChange={e => setEditData({...editData, status: e.target.value})} 
                                >
                                  <option value="" className="bg-charcoal">Select Status</option>
                                  {PROPERTY_STATUSES.map(status => (
                                    <option key={status} value={status} className="bg-charcoal">{status}</option>
                                  ))}
                                </select>
                              </div>
                           </div>

                           <div className="grid grid-cols-3 gap-6 bg-white/[0.02] p-6 border border-white/5 shadow-inner">
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold flex items-center gap-2">
                                  <Bed size={10} /> Beds
                                </label>
                                <input 
                                  type="number"
                                  className="bg-charcoal/50 border border-white/10 w-full outline-none py-3 px-4 text-xs text-white" 
                                  value={editData.beds || ''} 
                                  placeholder="0"
                                  onChange={e => setEditData({...editData, beds: e.target.value})} 
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold flex items-center gap-2">
                                  <Bath size={10} /> Baths
                                </label>
                                <input 
                                  type="number"
                                  step="0.5"
                                  className="bg-charcoal/50 border border-white/10 w-full outline-none py-3 px-4 text-xs text-white" 
                                  value={editData.baths || ''} 
                                  placeholder="0.0"
                                  onChange={e => setEditData({...editData, baths: e.target.value})} 
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-brick-copper block mb-2 font-bold flex items-center gap-2">
                                  <Square size={10} /> Sqft
                                </label>
                                <input 
                                  type="number"
                                  className="bg-charcoal/50 border border-white/10 w-full outline-none py-3 px-4 text-xs text-white font-mono" 
                                  value={editData.sqft || ''} 
                                  placeholder="0"
                                  onChange={e => setEditData({...editData, sqft: e.target.value})} 
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
                            <select 
                              className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-[10px] uppercase tracking-widest text-white" 
                              value={editData.category || ''} 
                              onChange={e => setEditData({...editData, category: e.target.value})} 
                            >
                              <option value="" className="bg-charcoal">Select Category</option>
                              {PORTFOLIO_CATEGORIES.map(cat => (
                                <option key={cat} value={cat} className="bg-charcoal">{cat}</option>
                              ))}
                            </select>
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
                        <div className="pt-8 border-t border-white/5 bg-brick-copper/[0.02] p-8 border border-brick-copper/10">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <Shield size={16} className="text-brick-copper" />
                                <h3 className="text-[11px] uppercase tracking-[0.4em] font-black text-brick-copper">Partner Allocation</h3>
                              </div>
                              <span className="text-[9px] uppercase tracking-widest text-white/20 font-mono">Multi-Agent Protocol</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                               <div className="space-y-6">
                                 <div className="space-y-4">
                                   <label className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Assigned Identities</label>
                                   <div className="flex flex-wrap gap-2 min-h-[48px] p-2 bg-charcoal border border-white/10 rounded-sm">
                                      {(!editData.partnerUids || editData.partnerUids.length === 0) && !editData.partnerUid && (
                                        <p className="text-[9px] text-white/10 italic p-2 uppercase">No agents assigned to this narrative.</p>
                                      )}
                                      
                                      {/* Backwards compatibility helper display */}
                                      {editData.partnerUid && (
                                        <div className="bg-brick-copper/20 border border-brick-copper/30 px-3 py-1 flex items-center gap-2 rounded-sm group relative">
                                          <Shield size={10} className="text-brick-copper" />
                                          <span className="text-[9px] font-bold text-white uppercase tracking-tight">
                                            {users.find(u => u.id === editData.partnerUid)?.displayName || 'Legacy Assignment'}
                                          </span>
                                          <button 
                                            onClick={() => {
                                              const currentUids = editData.partnerUids || [];
                                              if (!currentUids.includes(editData.partnerUid)) {
                                                setEditData({...editData, partnerUids: [...currentUids, editData.partnerUid], partnerUid: null});
                                              } else {
                                                setEditData({...editData, partnerUid: null});
                                              }
                                            }}
                                            className="ml-1 text-white/20 hover:text-white"
                                          >
                                            <ArrowDown size={10} />
                                          </button>
                                        </div>
                                      )}

                                      {editData.partnerUids?.map((uid: string) => {
                                        const registeredUser = users.find(u => u.id === uid);
                                        return (
                                          <div key={uid} className="bg-white/5 border border-white/10 px-3 py-1.5 flex items-center gap-3 rounded-sm group">
                                            <div className="flex flex-col">
                                              <span className="text-[9px] font-bold text-white uppercase tracking-tight">
                                                {registeredUser?.displayName || (uid.includes('@') ? uid : `ID: ${uid.substring(0, 8)}`)}
                                              </span>
                                              {registeredUser && <span className="text-[7px] text-white/30 uppercase tracking-tighter">Registered Partner</span>}
                                              {!registeredUser && <span className="text-[7px] text-brick-copper/60 uppercase tracking-tighter italic">External/Custom</span>}
                                            </div>
                                            <button 
                                              onClick={() => setEditData({...editData, partnerUids: editData.partnerUids.filter((id: string) => id !== uid)})}
                                              className="text-white/20 hover:text-red-500 transition-colors"
                                            >
                                              <X size={10} />
                                            </button>
                                          </div>
                                        );
                                      })}
                                   </div>
                                 </div>

                                 <div className="space-y-4 pt-4 border-t border-white/5">
                                   <label className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Add Custom Agent / UID</label>
                                   <div className="flex gap-2">
                                     <input 
                                       id="custom-agent-input"
                                       className="flex-1 bg-charcoal border border-white/10 p-4 text-xs font-mono text-white outline-none focus:border-brick-copper"
                                       placeholder="Enter UID or Manual Identifier"
                                       onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const val = e.currentTarget.value.trim();
                                            if (val) {
                                              const currentUids = editData.partnerUids || [];
                                              if (!currentUids.includes(val)) {
                                                setEditData({...editData, partnerUids: [...currentUids, val]});
                                              }
                                              e.currentTarget.value = '';
                                            }
                                          }
                                       }}
                                     />
                                     <button 
                                       onClick={() => {
                                         const input = document.getElementById('custom-agent-input') as HTMLInputElement;
                                         const val = input.value.trim();
                                         if (val) {
                                           const currentUids = editData.partnerUids || [];
                                           if (!currentUids.includes(val)) {
                                             setEditData({...editData, partnerUids: [...currentUids, val]});
                                           }
                                           input.value = '';
                                         }
                                       }}
                                       className="px-6 bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest font-bold hover:bg-brick-copper hover:text-charcoal transition-all"
                                     >
                                       Assign
                                     </button>
                                   </div>
                                   <p className="text-[8px] text-white/20 uppercase tracking-widest text-balance border-l border-brick-copper/20 pl-2">Assigning UIDs restricts this listing to those specific partners' portal views. Manual strings are stored but don't trigger portal filtering.</p>
                                 </div>
                               </div>

                               <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                                   <label className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Registered Partner Directory</label>
                                   <input 
                                     placeholder="Search partners..."
                                     value={partnerDirectorySearch}
                                     onChange={(e) => setPartnerDirectorySearch(e.target.value)}
                                     className="bg-white/5 border border-white/10 text-white text-[9px] px-3 py-1 outline-none focus:border-brick-copper transition-colors"
                                   />
                                 </div>
                                 <div className="bg-charcoal border border-white/10 max-h-[340px] overflow-y-auto no-scrollbar rounded-sm">
                                    {users.filter(u => u.displayName?.toLowerCase().includes(partnerDirectorySearch.toLowerCase()) || u.email?.toLowerCase().includes(partnerDirectorySearch.toLowerCase())).length === 0 ? (
                                      <p className="p-8 text-[9px] text-white/20 italic uppercase tracking-widest text-center">No matching partners found.</p>
                                    ) : (
                                      <div className="divide-y divide-white/5">
                                        {users.filter(u => u.displayName?.toLowerCase().includes(partnerDirectorySearch.toLowerCase()) || u.email?.toLowerCase().includes(partnerDirectorySearch.toLowerCase())).map(u => {
                                          const isActive = editData.partnerUids?.includes(u.id) || editData.partnerUid === u.id;
                                          return (
                                            <button 
                                              key={u.id}
                                              onClick={() => {
                                                const currentUids = editData.partnerUids || [];
                                                if (currentUids.includes(u.id)) {
                                                  setEditData({...editData, partnerUids: currentUids.filter((id: string) => id !== u.id)});
                                                } else {
                                                  setEditData({...editData, partnerUids: [...currentUids, u.id]});
                                                }
                                              }}
                                              className={`w-full text-left p-4 hover:bg-white/5 transition-all flex items-center justify-between group ${isActive ? 'bg-brick-copper/10 border-l-2 border-brick-copper' : 'border-l-2 border-transparent'}`}
                                            >
                                              <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 border border-white/5 flex items-center justify-center text-[10px] font-bold bg-white/[0.02]">
                                                  {u.displayName?.charAt(0) || u.email?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                  <p className={`text-[10px] font-bold truncate ${isActive ? 'text-brick-copper' : 'text-white'}`}>{u.displayName || 'Unnamed Partner'}</p>
                                                  <p className="text-[8px] text-white/30 truncate uppercase tracking-tighter">{u.email}</p>
                                                </div>
                                              </div>
                                              <div className={`p-1.5 rounded-sm border transition-colors ${isActive ? 'bg-brick-copper border-brick-copper text-charcoal' : 'border-white/10 text-white/10'}`}>
                                                {isActive ? <Check size={10} strokeWidth={4} /> : <Plus size={10} />}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
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
          <section className="space-y-16 animate-in fade-in duration-500">
            {/* MANUAL TESTIMONIALS SECTION */}
            <div>
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3 text-brick-copper">
                  <Users size={18} />
                  <h3 className="font-display text-2xl italic">Social Proof & Manual Testimonials</h3>
                </div>
                <button onClick={handleCreateTestimonial} className="text-brick-copper flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-white transition-colors">
                  <Plus size={14} /> Add Testimonial
                </button>
              </div>
              
              <div className="space-y-6">
                {testimonials.slice((testimonialsPage - 1) * testimonialsPageSize, testimonialsPage * testimonialsPageSize).map(item => (
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
                             <button onClick={() => handleUpdateTestimonial(item.id)} className="px-6 py-3 bg-brick-copper text-charcoal text-[10px] uppercase tracking-widest font-bold">Persist</button>
                             <button onClick={() => setIsEditing(null)} className="px-6 py-3 border border-white/10 text-white/40 text-[10px] uppercase tracking-widest font-bold">Release</button>
                          </div>
                        </div>
                    ) : (
                      <div className="flex justify-between items-start">
                         <div className="flex gap-6 items-start">
                            <img src={item.headshotUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"} className="w-16 h-16 rounded-full object-cover border border-white/10" alt="" />
                            <div>
                               <h4 className="text-lg font-display italic text-white mb-1 flex items-center gap-2 flex-wrap">
                                 <span>{item.name}</span>
                                 {item.source === 'google' && (
                                   <span className="inline-flex items-center text-[7px] bg-[rgba(234,179,8,0.15)] border border-yellow-500/30 text-yellow-500 font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                                     Google Sync
                                   </span>
                                 )}
                               </h4>
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
                    <p className="text-[10px] uppercase tracking-[0.3em]">No manual testimonials registered.</p>
                  </div>
                )}
              </div>
              <PaginationControls
                currentPage={testimonialsPage}
                totalItems={testimonials.length}
                pageSize={testimonialsPageSize}
                onPageChange={setTestimonialsPage}
              />
            </div>

            {/* GOOGLE BUSINESS PROFILE INTEGRATION SECTION */}
            <div className="border-t border-white/5 pt-12">
              <div className="flex justify-between items-center mb-8 pb-4">
                <div className="flex items-center gap-3 text-brick-copper font-bold">
                  <Globe size={18} />
                  <h3 className="font-display text-2xl italic">Google Business Profile Sync</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${gmbConfig.enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[9px] uppercase tracking-widest text-white/40">{gmbConfig.enabled ? 'Passive Sync Connected' : 'Inactive'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SETTINGS CARD */}
                <div className="lg:col-span-1 bg-white/[0.01] border border-white/5 p-6 space-y-6">
                  <h4 className="text-xs uppercase tracking-widest text-brick-copper font-bold">Passive Sync Settings</h4>
                  <p className="text-[11px] text-white/40 leading-relaxed font-mono">
                    Configure your Google Places account parameters to passively synchronize five-star reviews directly to your live social proof loops.
                  </p>

                  <div className="space-y-4">
                    {/* TOGGLES */}
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-xs text-white/60 font-mono">Aggregation State</span>
                      <button 
                        onClick={() => handleSaveGmbConfig({ ...gmbConfig, enabled: !gmbConfig.enabled })}
                        className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 transition-all ${gmbConfig.enabled ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}
                      >
                        {gmbConfig.enabled ? 'ACTIVE' : 'MUTED'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                      <div className="flex flex-col">
                        <span className="text-xs text-white/60 font-mono">Develop Simulator</span>
                        <span className="text-[8px] text-white/30">Sandbox Resilient</span>
                      </div>
                      <button 
                        onClick={() => handleSaveGmbConfig({ ...gmbConfig, simulate: !gmbConfig.simulate })}
                        className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 transition-all ${gmbConfig.simulate ? 'bg-brick-copper/10 text-brick-copper border border-brick-copper/30' : 'bg-white/5 text-white/30 border border-white/10'}`}
                      >
                        {gmbConfig.simulate ? 'ACTIVE' : 'LIVE API'}
                      </button>
                    </div>

                    {/* FIELDS */}
                    <div className="space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-white/40">Google Place ID</label>
                      <input 
                        type="text"
                        className="bg-white/5 border border-white/10 w-full outline-none text-xs p-2.5 text-white focus:border-brick-copper"
                        placeholder="ChIJs_U_Xy9Z..."
                        value={gmbConfig.placeId}
                        onChange={(e) => setGmbConfig({ ...gmbConfig, placeId: e.target.value })}
                        disabled={gmbConfig.simulate}
                      />
                      <span className="block text-[8px] text-white/30 leading-snug">Find your Place ID via the Google Maps developer tool.</span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-white/40">Places API Key</label>
                      <input 
                        type="password"
                        className="bg-white/5 border border-white/10 w-full outline-none text-xs p-2.5 text-white focus:border-brick-copper"
                        placeholder={gmbConfig.simulate ? "Inactive in Simulation" : "AIzaSyA..."}
                        value={gmbConfig.apiKey}
                        onChange={(e) => setGmbConfig({ ...gmbConfig, apiKey: e.target.value })}
                        disabled={gmbConfig.simulate}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-white/40">Minimum Stars limit</label>
                      <select 
                        className="bg-charcoal border border-white/10 w-full outline-none text-xs p-2.5 text-white/60 focus:border-brick-copper"
                        value={gmbConfig.minRating}
                        onChange={(e) => handleSaveGmbConfig({ ...gmbConfig, minRating: parseInt(e.target.value) })}
                      >
                        <option value={5}>5 Stars Only</option>
                        <option value={4}>4 Stars and Above</option>
                        <option value={3}>3 Stars and Above</option>
                      </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        onClick={() => handleSaveGmbConfig(gmbConfig)}
                        disabled={savingGmbConfig}
                        className="flex-1 bg-white/5 border border-white/10 text-white/60 text-[10px] py-3 text-center uppercase tracking-widest hover:border-white hover:text-white transition-all font-bold disabled:opacity-40"
                      >
                        {savingGmbConfig ? 'Saving...' : 'Save Meta'}
                      </button>
                      <button 
                        onClick={handleSyncGmbReviews}
                        disabled={syncingGmb}
                        className="flex-1 bg-brick-copper text-charcoal text-[10px] py-3 text-center uppercase tracking-widest hover:-translate-y-0.5 transition-all font-bold disabled:opacity-40 flex items-center justify-center gap-1.5"
                      >
                        {syncingGmb ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Syncing...</span>
                          </>
                        ) : (
                          <span>Sync Feed</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* LOGS / PREVIEW CONTAINER */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <h4 className="text-xs uppercase tracking-widest text-brick-copper font-bold font-display italic">Synchronized Reviews Feed</h4>
                    <span className="text-[10px] text-white/40 font-mono">{gmbReviews.length} cached reviews</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                    {gmbReviews.map(item => (
                      <div key={item.id || Math.random().toString()} className="border border-white/5 p-5 bg-white/[0.01] hover:border-brick-copper/20 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <img src={item.headshotUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"} className="w-8 h-8 rounded-full object-cover border border-white/10" alt="" />
                            <div>
                              <h5 className="text-white text-xs font-display italic font-semibold">{item.name}</h5>
                              <p className="text-[8px] text-white/30 uppercase tracking-wider">{item.brokerage}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-white/60 font-mono italic mb-4 leading-relaxed">"{item.quote}"</p>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                          <span className="text-yellow-500 text-[10px] font-bold">
                            {"★".repeat(item.rating || 5)}{"☆".repeat(5 - (item.rating || 5))}
                          </span>
                          <span className="text-[7px] text-white/20 uppercase tracking-widest">PASSED REVIEWS CACHE</span>
                        </div>
                      </div>
                    ))}
                    {gmbReviews.length === 0 && (
                      <div className="col-span-2 py-16 text-center border border-dashed border-white/5 text-white/20">
                        <p className="text-[10px] uppercase tracking-[0.3em]">No synced Google reviews in local cache.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'popups' && (
          <section className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-brick-copper">
                <Bell size={18} />
                <h3 className="font-display text-2xl italic">Global Popups & Announcements</h3>
              </div>
              <button 
                onClick={handleCreatePopup} 
                className="text-brick-copper flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
              >
                <Plus size={14} /> Add Global Popup
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {popups.map(item => (
                <div key={item.id} className="border border-white/5 p-6 md:p-8 bg-white/[0.01] hover:border-brick-copper/30 transition-all group relative">
                  {isEditing === item.id ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* LEFT COLUMN: PRIMARY DETAILS */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">Internal Reference Name</label>
                            <input 
                              className="bg-white/5 border border-white/10 w-full outline-none text-sm p-3 text-white focus:border-brick-copper focus:bg-white/[0.08]" 
                              placeholder="e.g. Summer Shoot Promo" 
                              value={editData.title ?? ''} 
                              onChange={e => setEditData({...editData, title: e.target.value})} 
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">Display Headline</label>
                            <input 
                              className="bg-white/5 border border-white/10 w-full outline-none text-sm p-3 font-display italic text-white focus:border-brick-copper focus:bg-white/[0.08]" 
                              placeholder="e.g. Get 20% off Aerial Photography!" 
                              value={editData.headline ?? ''} 
                              onChange={e => setEditData({...editData, headline: e.target.value})} 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">Popup Type</label>
                              <select 
                                className="bg-white/5 border border-white/10 w-full outline-none text-xs p-3 text-white focus:border-brick-copper focus:bg-white/[0.08]" 
                                value={editData.type ?? 'promotion'} 
                                onChange={e => setEditData({...editData, type: e.target.value})}
                              >
                                <option value="promotion" className="bg-[#121212] text-white">Promotion / Coupon</option>
                                <option value="lead-gen" className="bg-[#121212] text-white">Lead Generation Form</option>
                                <option value="news" className="bg-[#121212] text-white">News Indicator</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">Trigger Mechanism</label>
                              <select 
                                className="bg-white/5 border border-white/10 w-full outline-none text-xs p-3 text-white focus:border-brick-copper focus:bg-white/[0.08]" 
                                value={editData.trigger ?? 'onclick_only'} 
                                onChange={e => setEditData({...editData, trigger: e.target.value})}
                              >
                                <option value="onclick_only" className="bg-[#121212] text-white">Button / Click Trigger Only</option>
                                <option value="on_load" className="bg-[#121212] text-white">Trigger Instantly On Load</option>
                                <option value="exit_intent" className="bg-[#121212] text-white">On Mouse Exit Intent</option>
                                <option value="time_delay" className="bg-[#121212] text-white">Timed Delay</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">Restrict Active Trigger to Specific Page</label>
                            <select 
                              className="bg-white/5 border border-white/10 w-full outline-none text-xs p-3 text-white focus:border-brick-copper focus:bg-white/[0.08]" 
                              value={editData.targetPage ?? 'all'} 
                              onChange={e => setEditData({...editData, targetPage: e.target.value})}
                            >
                              <option value="all" className="bg-[#121212] text-white">Show on All Pages</option>
                              <option value="home" className="bg-[#121212] text-white">Home Page Only</option>
                              <option value="/about" className="bg-[#121212] text-white">About Page Only</option>
                              <option value="/services" className="bg-[#121212] text-white">Services Page Only</option>
                              <option value="/inquiry" className="bg-[#121212] text-white">Inquiry Booking Only</option>
                              <option value="/portal" className="bg-[#121212] text-white">Client Portal Only</option>
                              <option value="listing" className="bg-[#121212] text-white">MLS Listing Details Only</option>
                              {pages.map(p => (
                                <option key={p.id} value={`/p/${p.slug}`} className="bg-[#121212] text-white">Custom Page: {p.title || p.slug}</option>
                              ))}
                            </select>
                            <p className="text-[9px] text-white/30 mt-1 font-sans">
                              If "Button / Click Trigger Only" is selected as the mechanism, page restriction has no effect since the popup is only triggered by custom button onclick events.
                            </p>
                          </div>

                          {editData.trigger === 'time_delay' && (
                            <div>
                              <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">Delay Duration (Seconds)</label>
                              <input 
                                type="number" 
                                min="1" 
                                max="60" 
                                className="bg-white/5 border border-white/10 w-full outline-none text-xs p-3 text-white focus:border-brick-copper focus:bg-white/[0.08]" 
                                value={editData.delaySeconds ?? 5} 
                                onChange={e => setEditData({...editData, delaySeconds: parseInt(e.target.value)})} 
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 font-sans">
                            <input 
                              type="checkbox" 
                              id={`checkbox-popup-active-${item.id}`} 
                              checked={editData.isActive ?? false} 
                              onChange={e => setEditData({...editData, isActive: e.target.checked})} 
                              className="w-4 h-4 accent-brick-copper"
                            />
                            <label htmlFor={`checkbox-popup-active-${item.id}`} className="text-[10px] uppercase tracking-widest text-white/70 select-none cursor-pointer font-bold font-sans">
                              Enable Popup Automations
                            </label>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: MEDIA & INTERACTION */}
                        <div className="space-y-4">
                          <div>
                            <FileUpload 
                              label="Top Accent Banner Image"
                              path="popups"
                              onUploadComplete={(url) => setEditData({...editData, imageUrl: url})}
                            />
                            {(editData.imageUrl || item.imageUrl) && (
                              <div className="mt-4 h-24 w-full relative overflow-hidden border border-white/10 bg-charcoal">
                                <img src={editData.imageUrl || item.imageUrl} className="w-full h-full object-cover" alt="Banner preview" />
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">CTA Button Copy</label>
                            <input 
                              className="bg-white/5 border border-white/10 w-full outline-none text-sm p-3 text-white focus:border-brick-copper focus:bg-white/[0.08]" 
                              placeholder="e.g. Subscribe Now" 
                              value={editData.ctaText ?? ''} 
                              onChange={e => setEditData({...editData, ctaText: e.target.value})} 
                            />
                          </div>

                          {editData.type !== 'lead-gen' && (
                            <div>
                              <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1.5">Action Link Destination</label>
                              <LinkSelector 
                                value={typeof editData.ctaLink === 'string' ? editData.ctaLink : (editData.ctaLink?.url ? `/p/${editData.ctaLink.url}` : '')}
                                onChange={(val: string) => setEditData({ ...editData, ctaLink: val })}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] uppercase tracking-widest text-white/40 font-mono text-xs">Popup Content / Announcement body</label>
                        <textarea 
                          className="bg-white/5 border border-white/10 w-full h-32 p-4 text-xs font-sans text-white focus:border-brick-copper outline-none" 
                          placeholder="Provide the notification body paragraphs..." 
                          value={editData.content ?? ''} 
                          onChange={e => setEditData({...editData, content: e.target.value})} 
                        />
                      </div>

                      {/* ACTIONS BAR */}
                      <div className="flex gap-4 border-t border-white/5 pt-4">
                        <button 
                          onClick={() => handleUpdatePopup(item.id)} 
                          className="px-6 py-3 bg-brick-copper text-charcoal font-sans text-[10px] uppercase tracking-widest font-bold"
                        >
                          Persist Changes
                        </button>
                        <button 
                          onClick={() => setIsEditing(null)} 
                          className="px-6 py-3 border border-white/10 text-white/40 font-sans text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 hover:text-white transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 font-sans">
                      <div className="flex-1 space-y-3 font-sans">
                        <div className="flex items-center gap-3 flex-wrap font-sans">
                          <h4 className="text-xl font-display italic text-white font-sans">{item.title}</h4>
                          <span className="text-[8px] px-2 py-0.5 bg-brick-copper/15 border border-brick-copper/30 text-brick-copper uppercase font-sans tracking-widest font-bold font-mono">
                            {item.type}
                          </span>
                          <span className={`text-[8px] px-2 py-0.5 uppercase font-sans tracking-widest font-bold font-mono border ${
                            item.isActive 
                              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                              : 'bg-white/5 border-white/10 text-white/30'
                          }`}>
                            {item.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white/[0.01] border border-white/[0.03] p-4 text-[10px] font-sans">
                          <div>
                            <span className="block text-white/30 uppercase tracking-widest text-[8px] mb-0.5">Headline</span>
                            <span className="text-white/80 font-medium truncate block max-w-[120px]">{item.headline}</span>
                          </div>
                          <div>
                            <span className="block text-white/30 uppercase tracking-widest text-[8px] mb-0.5 font-sans">Trigger</span>
                            <span className="text-white/80 font-mono capitalize">{item.trigger?.replace('_', ' ')}</span>
                          </div>
                          <div>
                            <span className="block text-white/30 uppercase tracking-widest text-[8px] mb-0.5 font-sans">Page Target</span>
                            <span className="text-brick-copper font-mono font-bold capitalize truncate block max-w-[110px]">{item.targetPage || 'All Pages'}</span>
                          </div>
                          <div>
                            <span className="block text-white/30 uppercase tracking-widest text-[8px] mb-0.5 font-sans">CTA Button Copy</span>
                            <span className="text-white/80">{item.ctaText || 'None'}</span>
                          </div>
                          <div>
                            <span className="block text-white/30 uppercase tracking-widest text-[8px] mb-0.5 flex items-center gap-1 font-sans">Popup Slug (ID)</span>
                            <span className="text-brick-copper font-mono font-semibold select-all truncate block max-w-[100px]">{item.id}</span>
                          </div>
                        </div>

                        <p className="text-xs text-white/40 max-w-3xl leading-relaxed italic border-l border-white/10 pl-3">
                          "{item.content?.substring(0, 160)}{item.content?.length > 160 ? '...' : ''}"
                        </p>
                      </div>

                      <div className="flex gap-4 md:self-start opacity-0 group-hover:opacity-100 transition-all font-sans">
                        <button 
                          onClick={() => { setIsEditing(item.id); setEditData(item); }} 
                          className="text-white/20 hover:text-brick-copper p-1"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeletePopup(item.id)} 
                          className="text-white/20 hover:text-red-500 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {popups.length === 0 && (
                <div className="py-20 text-center border border-dashed border-white/5 text-white/20">
                  <p className="text-[10px] uppercase tracking-[0.3em] mb-2 font-sans font-bold">No Global Popups created yet.</p>
                  <button 
                    onClick={handleCreatePopup}
                    className="mt-4 px-6 py-2 border border-brick-copper text-brick-copper text-[10px] uppercase tracking-widest font-bold hover:bg-brick-copper hover:text-charcoal transition-all font-sans"
                  >
                    Create Default Promo Popup
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'portal' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-3 text-brick-copper mb-8 border-b border-white/5 pb-4">
              <Shield size={18} />
              <h3 className="font-display text-2xl italic">Portal Hub Configuration</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white/5 border border-white/10 p-8 space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest text-brick-copper font-bold mb-4">Auth Landing Content</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-2">Display Title</label>
                        <input 
                          className="w-full bg-white/5 border border-white/10 p-4 text-xl font-display italic text-white focus:border-brick-copper outline-none"
                          value={localSettings.portalTitle || ''}
                          onChange={e => setLocalSettings({...localSettings, portalTitle: e.target.value})}
                          placeholder="e.g. The Brand Hub"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-2">Description / Value Prop</label>
                        <textarea 
                          className="w-full bg-white/5 border border-white/10 p-4 text-xs h-32 focus:border-brick-copper outline-none resize-none leading-relaxed"
                          value={localSettings.portalDescription || ''}
                          onChange={e => setLocalSettings({...localSettings, portalDescription: e.target.value})}
                          placeholder="Explain what partners get access to..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-8 space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest text-brick-copper font-bold">Portal Communication</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-2">Support Email</label>
                        <input 
                          className="w-full bg-white/5 border border-white/10 p-3 text-xs outline-none"
                          value={localSettings.portalSupportEmail || ''}
                          onChange={e => setLocalSettings({...localSettings, portalSupportEmail: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-2">Inquiry Notifications</label>
                        <input 
                          className="w-full bg-white/5 border border-white/10 p-3 text-xs outline-none"
                          value={localSettings.portalNotifyEmail || ''}
                          onChange={e => setLocalSettings({...localSettings, portalNotifyEmail: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="bg-white/5 border border-white/10 p-8">
                    <h4 className="text-[10px] uppercase tracking-widest text-brick-copper font-bold mb-6">Visual Identity</h4>
                    <ImageSelector 
                      label="Landing Splash Image"
                      path="portal"
                      value={localSettings.portalImg || ''}
                      onChange={url => setLocalSettings({...localSettings, portalImg: url})}
                    />
                  </div>

                  <div className="bg-brick-copper/5 border border-brick-copper/20 p-8">
                    <h4 className="text-[10px] uppercase tracking-widest text-brick-copper font-bold mb-3">Live Preview</h4>
                    <p className="text-[9px] text-white/40 uppercase mb-6">As seen by partners</p>
                    <div className="border border-white/10 p-4 bg-charcoal scale-90 origin-top">
                       <h5 className="font-display italic text-lg mb-2">{localSettings.portalTitle || 'The Brand Hub'}</h5>
                       <p className="text-[10px] text-white/40 leading-relaxed truncate">{localSettings.portalDescription || 'A dedicated ecosystem...'}</p>
                    </div>
                  </div>
               </div>
            </div>
          </section>
        )}

        {activeTab === 'partners' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-brick-copper">
                <Users size={18} />
                <h3 className="font-display text-2xl italic">Partner Ecosystem</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => {
                    setShowFotelloModal(true);
                    fetchFotelloPartners();
                  }}
                  className="px-5 py-2 border border-white/10 hover:border-brick-copper text-white hover:text-brick-copper text-[10px] uppercase font-black tracking-widest transition-all flex items-center gap-2"
                  title="View partners in your Fotello Database and select which ones to import"
                >
                  📥 Import from Fotello DB
                </button>
                <button 
                  onClick={handleCreatePartner}
                  className="px-6 py-2 bg-brick-copper text-charcoal text-[10px] uppercase font-black tracking-widest hover:bg-white transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Designate Partner
                </button>
              </div>
            </div>

            {/* Fotello Sync Conflict Resolving Queue */}
            {syncQueue && syncQueue.length > 0 && (
              <div className="mb-8 border border-amber-500/20 bg-amber-500/[0.02] p-5 rounded-xs animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between border-b border-amber-500/10 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-amber-500">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                    <h4 className="font-display text-base uppercase tracking-wider font-semibold">Fotello Directory Sync Review ({syncQueue.length} Pending)</h4>
                  </div>
                  <span className="text-[10px] text-amber-500/60 uppercase tracking-widest font-black">Manual Action Required</span>
                </div>
                <p className="text-[10px] text-white/50 mb-4 tracking-wide max-w-3xl leading-relaxed">
                  We found partial matching conflicts between newly imported Fotello partners and current profiles synchronized on our website. To maintain database pristine fidelity, decide whether to skip, merge new details, or register a distinct new partner layout card.
                </p>

                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                  {syncQueue.map((item) => {
                    const fp = item.fotelloPartner || {};
                    const ep = item.existingPartner || {};
                    let matchLabel = "";
                    if (item.matchType === "email_match_different_details") matchLabel = "Email belongs to another synchronized user on our database (name or phone differs)";
                    else if (item.matchType === "name_match_different_email") matchLabel = "Name represents a synchronized user with a different matching email on file";
                    else if (item.matchType === "phone_match_different_email") matchLabel = "Phone matches a synchronized user on file but exists under a different user email";
                    else matchLabel = "Conflicting overlapping data on duplicate fields";

                    return (
                      <div key={item.id} className="border border-white/5 bg-charcoal/45 p-4 rounded-xs flex flex-col md:flex-row gap-4 items-stretch justify-between transition-all hover:border-white/10">
                        {/* Conflict Detail Boxes */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                          
                          {/* Left: Our Site Existing Partner */}
                          <div className="border border-charcoal bg-charcoal/30 p-3 rounded-xs flex gap-3">
                            <div className="w-10 h-10 bg-white/5 flex items-center justify-center text-white/20 select-none text-xs font-bold shrink-0 rounded-xs">
                              SITE
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[8px] uppercase tracking-wider text-white/30 font-bold mb-1">Active Site Partner</span>
                              <h5 className="font-display font-semibold text-xs text-white truncate">{ep.displayName || "Unknown User"}</h5>
                              <p className="text-[10px] text-white/50 font-mono truncate">{ep.email}</p>
                              {ep.phone && <p className="text-[9px] text-white/40 font-mono mt-0.5">{ep.phone}</p>}
                            </div>
                          </div>

                          {/* Right: incoming Fotello Partner */}
                          <div className="border border-amber-500/10 bg-amber-500/[0.01] p-3 rounded-xs flex gap-3">
                            <div className="w-10 h-10 bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold shrink-0 rounded-xs">
                              FOT
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[8px] uppercase tracking-wider text-amber-500/50 font-bold mb-1">Incoming Fotello Profile</span>
                              <h5 className="font-display font-semibold text-xs text-amber-500 truncate">{fp.displayName || "No Name"}</h5>
                              <p className="text-[10px] text-amber-500/70 font-mono truncate">{fp.email}</p>
                              {fp.phone && <p className="text-[9px] text-amber-500/60 font-mono mt-0.5">{fp.phone}</p>}
                            </div>
                          </div>

                        </div>

                        {/* Middle: Match Alert Message */}
                        <div className="flex flex-col justify-center min-w-[200px] max-w-[280px] text-left border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                          <span className="text-[8px] uppercase tracking-wider text-amber-500 font-black mb-1">Conflict Scenario</span>
                          <p className="text-[10px] text-white/70 leading-normal font-sans italic font-medium">"{matchLabel}"</p>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                          <button
                            onClick={() => handleResolveQueue(item.id, 'skip', fp.displayName || "Incoming")}
                            className="bg-white/5 hover:bg-white/10 text-white/80 active:scale-95 px-3 py-1.5 text-[8px] uppercase font-bold tracking-wider rounded-xs transition-all w-full text-center hover:cursor-pointer"
                            title="Ignore subsequent sync imports for this user strictly, keeping site profile pristine and untouched."
                          >
                            Skip Always
                          </button>
                          <button
                            onClick={() => handleResolveQueue(item.id, 'merge', fp.displayName || "Incoming")}
                            className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black active:scale-95 px-3 py-1.5 text-[8px] uppercase font-bold tracking-wider rounded-xs transition-all w-full text-center hover:cursor-pointer"
                            title="Update active site partner with complementary new details from Fotello partner."
                          >
                            Merge Profile
                          </button>
                          <button
                            onClick={() => handleResolveQueue(item.id, 'create', fp.displayName || "Incoming")}
                            className="bg-white hover:bg-brick-copper hover:text-charcoal text-black active:scale-95 px-3 py-1.5 text-[8px] uppercase font-bold tracking-wider rounded-xs transition-all w-full text-center hover:cursor-pointer"
                            title="Create a completely distinct and independent new partner profile using Fotello credentials."
                          >
                            Force Create
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter and Sorting Control Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-white/[0.02] border border-white/5 p-4 rounded-xs">
              <div>
                <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1 font-bold">Search Directory</label>
                <div className="relative">
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="NAME, EMAIL..."
                    className="w-full bg-charcoal border border-white/10 p-2.5 pl-3 pr-8 text-xs text-white placeholder-white/20 outline-none focus:border-brick-copper transition-colors uppercase tracking-widest font-sans"
                  />
                  {partnerSearch && (
                    <button 
                      onClick={() => setPartnerSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1 font-bold">Filter By Role</label>
                <select
                  value={partnerRoleFilter}
                  onChange={(e) => setPartnerRoleFilter(e.target.value)}
                  className="w-full bg-charcoal border border-white/10 p-2.5 text-xs text-white outline-none focus:border-brick-copper transition-colors uppercase tracking-widest font-sans"
                >
                  <option value="all">All Roles</option>
                  <option value="preferred">preferred</option>
                  <option value="partner">partner</option>
                  <option value="client">client</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1 font-bold">Team Allocation</label>
                <select
                  value={partnerTeamFilter}
                  onChange={(e) => setPartnerTeamFilter(e.target.value)}
                  className="w-full bg-charcoal border border-white/10 p-2.5 text-xs text-white outline-none focus:border-brick-copper transition-colors uppercase tracking-widest font-sans"
                >
                  <option value="all">All Teams</option>
                  <option value="independent">Independent</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-widest text-white/40 mb-1 font-bold">Sort Settings</label>
                <div className="flex gap-1">
                  <select
                    value={partnerSortField}
                    onChange={(e) => setPartnerSortField(e.target.value as any)}
                    className="flex-1 bg-charcoal border border-white/10 p-2.5 text-xs text-white outline-none focus:border-brick-copper transition-colors uppercase tracking-widest font-sans"
                  >
                    <option value="displayName">Name</option>
                    <option value="email">Email</option>
                    <option value="role">Role</option>
                    <option value="createdAt">Registration Date</option>
                  </select>
                  <button
                    onClick={() => setPartnerSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="bg-charcoal border border-white/10 hover:border-brick-copper px-3 text-xs text-white transition-all uppercase tracking-widest flex items-center justify-center font-bold"
                    title={partnerSortOrder === 'asc' ? "Ascending order" : "Descending order"}
                  >
                    {partnerSortOrder === 'asc' ? '▲' : '▼'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    <tr>
                      <th 
                        className="p-6 font-normal cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          if (partnerSortField === 'displayName') {
                            setPartnerSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setPartnerSortField('displayName');
                            setPartnerSortOrder('asc');
                          }
                        }}
                      >
                        <div className="flex items-center gap-1.5 select-none">
                          Partner
                          {partnerSortField === 'displayName' && (
                            <span className="text-brick-copper text-[8px]">{partnerSortOrder === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-6 font-normal cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          if (partnerSortField === 'role') {
                            setPartnerSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setPartnerSortField('role');
                            setPartnerSortOrder('asc');
                          }
                        }}
                      >
                        <div className="flex items-center gap-1.5 select-none">
                          Team Allocation & Role
                          {partnerSortField === 'role' && (
                            <span className="text-brick-copper text-[8px]">{partnerSortOrder === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-6 font-normal cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          if (partnerSortField === 'createdAt') {
                            setPartnerSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setPartnerSortField('createdAt');
                            setPartnerSortOrder('asc');
                          }
                        }}
                      >
                        <div className="flex items-center gap-1.5 select-none">
                          Registered
                          {partnerSortField === 'createdAt' && (
                            <span className="text-brick-copper text-[8px]">{partnerSortOrder === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                      <th className="p-6 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAndSortedPartners.slice((partnersPage - 1) * partnersPageSize, partnersPage * partnersPageSize).map(user => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-brick-copper/20 rounded-full flex items-center justify-center overflow-hidden">
                                 {user.headshotUrl ? <img src={user.headshotUrl} className="w-full h-full object-cover" /> : <Shield size={16} className="text-brick-copper" />}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{user.displayName || 'Unnamed Partner'}</p>
                                <p className="text-xs text-white/40">{user.email}</p>
                                <div className="flex gap-2 mt-1">
                                  <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-full font-black ${user.role === 'preferred' ? 'bg-sand text-charcoal' : 'bg-white/10 text-white/40'}`}>
                                    {user.role || 'client'}
                                  </span>
                                  {user.isInvitation && (
                                    <span className="text-[8px] uppercase px-1.5 py-0.5 rounded-full font-black bg-brick-copper/20 text-brick-copper">
                                      Invitation
                                    </span>
                                  )}
                                </div>
                              </div>
                           </div>
                        </td>
                        <td className="p-6">
                           <select 
                             className="bg-transparent border border-white/10 text-[10px] uppercase tracking-widest text-brick-copper py-1 px-2 outline-none focus:border-brick-copper"
                             value={user.teamId || ''}
                             onChange={(e) => handleUpdateUserTeam(user.id, e.target.value || null)}
                           >
                             <option value="" className="bg-charcoal text-white/40">Independent</option>
                             {teams.map(t => (
                               <option key={t.id} value={t.id} className="bg-charcoal text-white">{t.name}</option>
                             ))}
                           </select>
                        </td>
                        <td className="p-6 text-xs text-white/40 font-mono">
                           {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '---'}
                        </td>
                        <td className="p-6 text-right">
                           <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => { setIsEditing(user.id); setEditData(user); }}
                               className="p-2 text-white/20 hover:text-white transition-colors"
                               title="Edit Partner Profile"
                             >
                                <Settings size={14} />
                             </button>
                             <button 
                               onClick={() => {
                                 const role = user.role === 'preferred' ? 'partner' : 'preferred';
                                 updateDoc(doc(db, 'users', user.id), { role, updatedAt: serverTimestamp() });
                               }}
                               className={`p-2 transition-colors ${user.role === 'preferred' ? 'text-brick-copper' : 'text-white/20 hover:text-white'}`}
                               title="Toggle Preferred Status"
                             >
                                <Sparkles size={14} />
                             </button>
                             <a 
                                href={`/partners/${user.id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 text-white/20 hover:text-brick-copper transition-colors"
                                title="View Public Profile"
                              >
                                 <ExternalLink size={14} />
                              </a>
                              <button className="p-2 text-white/20 hover:text-white transition-colors" title="Send Message"><MessageSquare size={14} /></button>
                              <button 
                                onClick={() => { setMergeSource(user); setMergeTargetId(''); }}
                                className="p-2 text-white/20 hover:text-amber-500 transition-colors"
                                title="Merge Duplicate"
                              >
                                 <GitMerge size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeletePartner(user.id)}
                                className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                                title="Delete Partner"
                              >
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAndSortedPartners.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-16 text-center text-white/20 italic uppercase tracking-widest text-xs">
                          No partners found matching search terms or filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
            <PaginationControls
              currentPage={partnersPage}
              totalItems={filteredAndSortedPartners.length}
              pageSize={partnersPageSize}
              onPageChange={setPartnersPage}
            />
          </section>
        )}

        {activeTab === 'teams' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-brick-copper">
                <Box size={18} />
                <h3 className="font-display text-2xl italic">Strategic Teams</h3>
              </div>
              <button 
                onClick={handleCreateTeam}
                className="px-6 py-2 bg-brick-copper text-charcoal text-[10px] uppercase font-black tracking-widest hover:bg-white transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Designate Team
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teams.map(team => (
                <div key={team.id} className="bg-white/5 border border-white/10 p-8 flex flex-col space-y-6 group hover:border-brick-copper/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display text-2xl italic text-white mb-1">{team.name}</h4>
                      <p className="text-[10px] text-brick-copper uppercase tracking-widest font-black">Designation</p>
                    </div>
                    <div className="flex gap-2">
                       <a 
                         href={`/teams/${team.id}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-white/10 hover:text-brick-copper transition-colors p-2"
                         title="View Public Profile"
                       >
                          <ExternalLink size={16} />
                       </a>
                       <button 
                         onClick={() => { setIsEditing(team.id); setEditData(team); }}
                         className="text-white/10 hover:text-brick-copper transition-colors p-2"
                         title="Edit Team Profile"
                       >
                          <Settings size={16} />
                       </button>
                       <button onClick={() => handleDeleteTeam(team.id)} className="text-white/10 hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] uppercase tracking-widest text-white/30 block">Team Description</label>
                    <textarea 
                      className="w-full bg-transparent border border-white/5 p-4 text-[10px] h-24 focus:border-brick-copper/40 outline-none resize-none no-scrollbar font-mono"
                      value={team.description || ''}
                      placeholder="Define the team's specialization or territory..."
                      onChange={e => handleUpdateTeam(team.id, { description: e.target.value })}
                    />
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                       <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Roster</p>
                       <span className="text-[9px] font-mono text-brick-copper">{users.filter(u => u.teamId === team.id).length} Active members</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {users.filter(u => u.teamId === team.id).map(u => (
                         <div key={u.id} className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-brick-copper/20 flex items-center justify-center text-[10px] font-black" title={u.displayName}>
                            {u.headshotUrl ? <img src={u.headshotUrl} className="w-full h-full object-cover" /> : u.displayName?.charAt(0)}
                         </div>
                       ))}
                       {users.filter(u => u.teamId === team.id).length === 0 && (
                         <p className="text-[9px] text-white/20 italic uppercase">No members assigned.</p>
                       )}
                    </div>
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="col-span-full py-24 text-center border border-dashed border-white/5 text-white/10">
                   <Box size={32} className="mx-auto mb-4 opacity-5" />
                   <p className="text-[10px] uppercase tracking-[0.4em]">No strategic teams initialized.</p>
                </div>
              )}
            </div>
          </section>
        )}
        {activeTab === 'inquiries' && (
          <section className="space-y-8 font-sans">
            <div className="flex items-center gap-3 text-brick-copper mb-8 border-b border-white/5 pb-4 font-sans">
              <MessageSquare size={18} />
              <h3 className="font-display text-2xl italic">Project Inquiries</h3>
            </div>
            
            <div className="bg-white/[0.01] border border-white/5 overflow-hidden font-sans">
              <div className="overflow-x-auto select-none no-scrollbar font-sans">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-white/30 font-bold bg-white/[0.01] font-sans">
                      <th className="p-4 pl-6 uppercase">Timestamp</th>
                      <th className="p-4 uppercase">Realtor / Partner</th>
                      <th className="p-4 uppercase">Property Address</th>
                      <th className="p-4 uppercase">Email Contact</th>
                      <th className="p-4 pr-6 text-right uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-xs font-sans">
                    {inquiries.slice((inquiriesPage - 1) * inquiriesPageSize, inquiriesPage * inquiriesPageSize).map(inq => {
                      let dateStr = 'N/A';
                      if (inq.createdAt) {
                        try {
                          const epoch = inq.createdAt.seconds 
                            ? inq.createdAt.seconds * 1000 
                            : new Date(inq.createdAt).getTime();
                          if (!isNaN(epoch)) {
                            dateStr = new Date(epoch).toLocaleString();
                          }
                        } catch (err) {
                          console.log("Date parsing failed, rendering N/A:", err);
                        }
                      }
                      return (
                        <tr key={inq.id} className="hover:bg-white/[0.01] transition-all group font-sans">
                          {/* Timestamp */}
                          <td className="p-4 pl-6 font-mono text-[10px] text-white/40 whitespace-nowrap">
                            {dateStr}
                          </td>
                          {/* Realtor / Partner */}
                          <td className="p-4 font-semibold text-white/80 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-display italic text-white">{inq.realtorName}</p>
                              {inq.firmName && <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{inq.firmName}</p>}
                            </div>
                          </td>
                          {/* Property Address */}
                          <td className="p-4 text-white/60 max-w-xs truncate font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin size={11} className="text-brick-copper flex-shrink-0" />
                              <span className="truncate">{inq.propertyAddress}</span>
                            </div>
                          </td>
                          {/* Email Contact */}
                          <td className="p-4 text-white/50 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Mail size={11} className="text-brick-copper flex-shrink-0" />
                              <span>{inq.email}</span>
                            </div>
                          </td>
                          {/* Actions */}
                          <td className="p-4 pr-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3 font-sans">
                              <button 
                                onClick={async () => {
                                  const toastId = toast.loading("Invoking Gemini smart draft companion...");
                                  try {
                                    const reply = await getAiSuggestion("Draft a professional architectural project acceptance/follow-up", `${inq.realtorName} for ${inq.propertyAddress}`);
                                    setDraftReplyModalContent(reply);
                                    toast.success("Correspondence outline compiled!", { id: toastId });
                                  } catch (err) {
                                    toast.error("Failed to compile suggestion", { id: toastId });
                                  }
                                }} 
                                className="text-[9px] uppercase tracking-widest font-black text-brick-copper hover:text-white transition-all underline outline-none"
                              >
                                Draft
                              </button>
                              <span className="text-white/10 select-none">|</span>
                              <button 
                                onClick={() => deleteDoc(doc(db, 'inquiries', inq.id))} 
                                className="text-[9px] uppercase tracking-widest font-black text-white/30 hover:text-red-500 transition-colors outline-none"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {inquiries.length === 0 && (
                      <tr className="font-sans">
                        <td colSpan={5} className="p-12 text-center text-white/20 uppercase tracking-widest text-[9px] font-bold font-sans animate-pulse">
                          No inquiries found in the stream.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <PaginationControls
              currentPage={inquiriesPage}
              totalItems={inquiries.length}
              pageSize={inquiriesPageSize}
              onPageChange={setInquiriesPage}
            />
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
                  toast.success("Narratives seeded and linked successfully!");
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

        {activeTab === 'fotello' && (
          <section className="space-y-12">
            <div className="flex items-center gap-3 text-brick-copper mb-4 border-b border-white/5 pb-4">
              <Zap size={18} />
              <h3 className="font-display text-2xl italic">Fotello CRM Orchestration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Connection Diagnostics Card */}
              <div className="bg-white/[0.01] border border-white/5 p-8 flex flex-col justify-between h-full group hover:border-brick-copper/20 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60">Diagnostics & Keys</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-white/40 text-[9px] uppercase tracking-wider mb-2">Fotello API Key</p>
                      {isEditingFotelloApiKey ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            className="bg-charcoal border border-white/10 w-full outline-none py-2 px-3 text-xs font-mono text-white focus:border-brick-copper/50"
                            value={tempFotelloApiKey}
                            onChange={(e) => setTempFotelloApiKey(e.target.value)}
                            placeholder="Enter Fotello API Key"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveFotelloConfig(tempFotelloApiKey, fotelloConfig.liveConnect)}
                              disabled={isSavingFotelloConfig}
                              className="px-3 py-1 bg-brick-copper text-charcoal text-[9px] uppercase tracking-wider font-bold hover:bg-white transition-all animate-none"
                            >
                              {isSavingFotelloConfig ? "Saving..." : "Save Key"}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingFotelloApiKey(false);
                                setTempFotelloApiKey(fotelloConfig.apiKey);
                              }}
                              disabled={isSavingFotelloConfig}
                              className="px-3 py-1 bg-white/5 text-white/60 text-[9px] uppercase tracking-wider font-bold hover:bg-white/15 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-mono text-xs text-white/80 bg-white/5 p-3 rounded-sm truncate" title={fotelloConfig.apiKey}>
                            {fotelloConfig.apiKey || "No API Key Set"}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setIsEditingFotelloApiKey(true);
                                setTempFotelloApiKey(fotelloConfig.apiKey);
                              }}
                              className="text-[9px] text-brick-copper uppercase tracking-wider font-bold hover:underline self-start"
                            >
                              ✏ Edit API Key
                            </button>
                            {fotelloConfig.apiKey && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(fotelloConfig.apiKey);
                                  toast.success("API Key copied to clipboard!");
                                }}
                                className="text-[9px] text-white/40 uppercase tracking-wider hover:text-white/80 transition-all self-start"
                              >
                                📋 Copy
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <span className="text-[9px] text-emerald-400 mt-2 block">✔ Stored securely in database settings</span>
                    </div>
                    <div>
                      <p className="text-white/40 text-[9px] uppercase tracking-wider mb-2">Sync Connection Routing</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSaveFotelloConfig(fotelloConfig.apiKey, !fotelloConfig.liveConnect)}
                          className={`px-3 py-1 text-[9px] uppercase tracking-widest font-black transition-all ${
                            fotelloConfig.liveConnect 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
                          }`}
                        >
                          {fotelloConfig.liveConnect ? "● Dynamic Live Connected" : "○ Local Simulation Only"}
                        </button>
                      </div>
                      <span className="text-[9px] text-white/40 mt-1.5 block">
                        {fotelloConfig.liveConnect 
                          ? "Relays inquiry leads & webhooks dynamically." 
                          : "Resilient sandboxed local data sync cache."}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-6 mt-6">
                  <p className="text-[10px] text-white/30 italic">Securely proxies CRM calls protecting sensitive keys from client browser discovery.</p>
                </div>
              </div>

              {/* Automated Webhook Simulators */}
              <div className="bg-white/[0.01] border border-white/5 p-8 flex flex-col justify-between h-full group hover:border-brick-copper/20 transition-all md:col-span-2">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">Interactive Webhook Simulator</h4>
                  <p className="text-xs text-white/40 max-w-xl mb-6">
                    Trigger synthetic Fotello webhook payloads to test system responsiveness. Since our backend is fully operational, these triggers make actual server POSTs that write real, live data straight to your Firestore database.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Webhook 1 */}
                    <div className="border border-white/5 bg-white/[0.02] p-5 hover:border-brick-copper/30 transition-all flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-mono uppercase bg-brick-copper/10 text-brick-copper px-2 py-1 rounded mb-3 inline-block">
                          gallery.delivered
                        </span>
                        <h5 className="text-xs font-bold text-white mb-2">Automated Portfolio Sync</h5>
                        <p className="text-[10px] text-white/30 leading-relaxed mb-4">
                          Simulate Fotello video & photo system delivering completed shoot materials for a luxury property.
                        </p>
                      </div>
                      <button 
                        onClick={async () => {
                          const loadingToast = toast.loading("Invoking portfolio sync webhook...");
                          try {
                            const response = await fetch(`/api/fotello/webhook?token=${encodeURIComponent(fotelloConfig.apiKey)}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                event: 'gallery.delivered',
                                data: {
                                  project: {
                                    id: 'synced-brick-88',
                                    address: '88 Brick Road, Toronto',
                                    title: 'Modern Architecture Masterpiece',
                                    category: 'Residential',
                                    description: 'A striking structural composition showcasing clean brutalist geometries, concrete finishes, and warm oak detailing. Sync completed from Fotello automatically.',
                                    mainPhoto: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                                    gallery: [
                                      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                                      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
                                      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
                                    ],
                                    specs: {
                                      beds: '4',
                                      baths: '4.5',
                                      sqft: '4,200',
                                      price: '$2,850,000',
                                      propertyType: 'Modern Loft'
                                    }
                                  }
                                }
                              })
                            });
                            if (!response.ok) throw new Error("Webhook failed");
                            toast.success("Portfolio Item Mock Synchronized! Check 'Portfolio' or reload page to see it live.", { id: loadingToast });
                          } catch (err) {
                            toast.error("Failed to trigger webhook", { id: loadingToast });
                          }
                        }}
                        className="w-full py-2.5 bg-brick-copper text-charcoal text-[9px] uppercase tracking-widest font-black hover:bg-white transition-all text-center"
                      >
                        Trigger Sync Post
                      </button>
                    </div>

                    {/* Webhook 2 */}
                    <div className="border border-white/5 bg-white/[0.02] p-5 hover:border-brick-copper/30 transition-all flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-mono uppercase bg-brick-copper/10 text-brick-copper px-2 py-1 rounded mb-3 inline-block">
                          agent.created
                        </span>
                        <h5 className="text-xs font-bold text-white mb-2">Dynamic Partner Roster Sync</h5>
                        <p className="text-[10px] text-white/30 leading-relaxed mb-4">
                          Simulate an elite Realtor joining your booking portal and instantly syncing their agency profile.
                        </p>
                      </div>
                      <button 
                        onClick={async () => {
                          const loadingToast = toast.loading("Invoking partner sync webhook...");
                          try {
                            const response = await fetch(`/api/fotello/webhook?token=${encodeURIComponent(fotelloConfig.apiKey)}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                event: 'agent.created',
                                data: {
                                  agent: {
                                    uid: 'charlotte-sothelbys',
                                    name: 'Charlotte Sterling',
                                    email: 'charlotte@sterlingestates.ca',
                                    bio: 'Representing elite modern architectural estates in Toronto with Sotheby’s International Realty. Dedicated partner of Exposed Brick Media.',
                                    brokerage: 'Sotheby’s International Realty',
                                    headshotUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956',
                                    brokerageLogo: 'https://images.unsplash.com/photo-1543286386-7a39e65fecab',
                                    linkedin: 'https://linkedin.com/'
                                  }
                                }
                              })
                            });
                            if (!response.ok) throw new Error("Webhook failed");
                            toast.success("Agent Partner Synchronized! Check 'Partners' tab to see Charlotte.", { id: loadingToast });
                          } catch (err) {
                            toast.error("Failed to trigger webhook", { id: loadingToast });
                          }
                        }}
                        className="w-full py-2.5 bg-brick-copper text-charcoal text-[9px] uppercase tracking-widest font-black hover:bg-white transition-all text-center"
                      >
                        Sync Agent Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Production & Delivery Pipeline */}
            <div className="bg-white/[0.01] border border-white/5 p-8 group hover:border-brick-copper/20 transition-all space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60">Active Production & Delivery Pipeline</h4>
                  <p className="text-[10px] text-white/30 mt-1">One-click delivery orchestrator linking finalized Fotello shoots to designated realtor profiles.</p>
                </div>
                <button
                  onClick={async () => {
                    const id = toast.loading("Loading live pipeline jobs...");
                    try {
                      const res = await fetch("/api/admin/fotello/jobs");
                      if (res.ok) {
                        const data = await res.json();
                        setFotelloJobs(data);
                        toast.success("Jobs pipeline refreshed!", { id });
                      } else throw new Error();
                    } catch {
                      toast.error("Failed to refresh jobs", { id });
                    }
                  }}
                  className="px-3 py-1 border border-white/10 hover:border-brick-copper hover:text-brick-copper transition-all text-[9px] uppercase tracking-wider text-white/50"
                >
                  🔄 Force Refresh
                </button>
              </div>

              {isLoadingJobs ? (
                <div className="text-center py-12 text-white/30 text-xs font-mono">
                  <div className="animate-pulse mb-2">● Scanning CRM queue...</div>
                  Connecting backend orchestration port
                </div>
              ) : fotelloJobs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/5 text-white/40 text-xs leading-relaxed">
                  No active Fotello jobs found. Please create draft orders or turn on simulation fallback.
                </div>
              ) : (
                <div className="divide-y divide-white/5 border border-white/5 bg-white/[0.01]">
                  {fotelloJobs.slice((jobsPage - 1) * jobsPageSize, jobsPage * jobsPageSize).map((job) => {
                    const isCompleted = job.status === "Completed" || job.status === "completed";
                    return (
                      <div key={job.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.01] transition-all">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                              isCompleted 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : job.status === "In Production" 
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" 
                                : "bg-white/10 text-white/40 border border-white/5"
                            }`}>
                              {job.status}
                            </span>
                            <span className="text-[10px] font-mono text-white/30">{job.id}</span>
                            {job.photographer && (
                              <span className="text-[9px] text-white/40 font-mono">Photographer: <strong className="text-white/60">{job.photographer}</strong></span>
                            )}
                          </div>
                          
                          <div>
                            <h5 className="font-bold text-white text-base font-display italic">{job.address}</h5>
                            <p className="text-xs text-white/50 mt-1 leading-relaxed">{job.productionStatus}</p>
                          </div>

                          {job.packages && job.packages.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {job.packages.map((pkg: string) => (
                                <span key={pkg} className="bg-white/5 text-white/60 text-[8px] px-2 py-0.5 uppercase tracking-wider font-mono">
                                  {pkg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delivery Control Actions */}
                        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center justify-end gap-3 md:w-80">
                          <div className="flex-1 min-w-[160px] space-y-1">
                            <label className="text-[8px] uppercase tracking-wider text-white/30 block">Target Designated Partner</label>
                            <select
                              className="w-full bg-charcoal border border-white/10 text-[10px] uppercase tracking-widest text-brick-copper py-2.5 px-3 outline-none focus:border-brick-copper/50"
                              value={selectedClientForJob[job.id] || ""}
                              onChange={(e) => setSelectedClientForJob({
                                ...selectedClientForJob,
                                [job.id]: e.target.value
                              })}
                            >
                              <option value="" className="bg-charcoal text-white/30">-- Choose Realtor --</option>
                              {users.length > 0 ? (
                                users.map(userItem => (
                                  <option key={userItem.id} value={userItem.id} className="bg-charcoal text-white">
                                    {userItem.displayName || userItem.email}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="client-marcus" className="bg-charcoal text-white">Marcus Thompson</option>
                                  <option value="client-charlotte" className="bg-charcoal text-white">Charlotte Sterling</option>
                                  <option value="client-lucas" className="bg-charcoal text-white">Lucas Gray</option>
                                </>
                              )}
                            </select>
                          </div>

                          <button
                            onClick={() => handleDeliverJobToClient(job.id, job.address)}
                            disabled={!isCompleted || deliveringJobId === job.id}
                            className={`px-4 py-2.5 text-[9px] uppercase tracking-widest font-black transition-all text-center self-end h-[38px] flex items-center justify-center min-w-[120px] ${
                              !isCompleted
                                ? "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
                                : "bg-brick-copper text-charcoal hover:bg-white active:scale-[0.98]"
                            }`}
                            title={isCompleted ? "Deliver finished media to chosen realtor's portal" : "Job must be in completed status to deliver"}
                          >
                            {deliveringJobId === job.id ? "Delivering..." : "Deliver to Client"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <PaginationControls
                currentPage={jobsPage}
                totalItems={fotelloJobs.length}
                pageSize={jobsPageSize}
                onPageChange={setJobsPage}
              />
            </div>

            {/* AI conversational pipeline logs */}
            <div className="bg-white/[0.01] border border-white/5 p-8 group hover:border-brick-copper/20 transition-all">
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-6">AI Agent System Logs</h4>
              <div className="font-mono text-[10px] text-white/40 h-48 overflow-y-auto bg-charcoal p-5 space-y-2 border border-white/5 rounded-none leading-relaxed">
                <div>[SYSTEM] <span className="text-white/60 font-mono">Initialize Fotello Live Connection Middleware...</span></div>
                <div>[SYSTEM] <span className="text-emerald-400 font-mono">SUCCESS: Verified Bearer api-0748...c98072bc</span></div>
                <div>[AI MODEL] <span className="text-white/60 font-medium font-mono">Equipped @google/genai system tools: getJobStatus, getPricingPackages, createDraftOrder</span></div>
                <div>[WEBHOOK] <span className="text-white/40 font-mono">Secure sync port listening at /api/fotello/webhook</span></div>
                <div>[CRM] <span className="text-white/40 font-medium font-mono">Inquiry lead interception pipeline active -&gt; https://api.fotello.com/v1/leads</span></div>
                <div className="text-brick-copper font-medium animate-pulse font-mono">● Waiting for user interaction or bot conversational function executes...</div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'communications' && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
            <div className="flex items-center gap-3 text-brick-copper mb-4 border-b border-white/5 pb-4">
              <Mail size={18} />
              <h3 className="font-display text-2xl italic">Communications & Notification Hub</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Send Campaign/Broadcast */}
              <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 p-8 space-y-6">
                <div className="flex items-center gap-2 text-brick-copper">
                  <Mail size={16} />
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold font-sans">Send Broadcast Mailer</h4>
                </div>
                <p className="text-xs text-white/40 leading-relaxed font-sans">
                  Instantly dispatch professional, real-estate brand-aligned HTML announcements to selected preferred partners or single addresses. This campaign uses Exposed Brick's customized templates and colors.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                  <div>
                    <label className="block text-[8px] uppercase tracking-[0.2em] text-white/40 mb-2">Recipient Scope</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 text-xs font-sans text-white p-3 outline-none focus:border-brick-copper"
                      value={broadcastTo}
                      onChange={(e) => setBroadcastTo(e.target.value as any)}
                    >
                      <option value="all-partners" className="bg-charcoal text-white">All Preferred Partners & Realtors</option>
                      <option value="custom" className="bg-charcoal text-white">Single Custom Email Address</option>
                    </select>
                  </div>

                  {broadcastTo === 'custom' && (
                    <div>
                      <label className="block text-[8px] uppercase tracking-[0.2em] text-white/40 mb-2 font-sans">Recipient Email</label>
                      <input
                        type="email"
                        placeholder="e.g. agent@brokerage.com"
                        className="w-full bg-white/5 border border-white/10 text-xs p-3 outline-none text-white focus:border-brick-copper"
                        value={broadcastCustomEmail}
                        onChange={(e) => setBroadcastCustomEmail(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 font-sans">
                  <div>
                    <label className="block text-[8px] uppercase tracking-[0.2em] text-white/40 mb-2">Campaign Subject Line</label>
                    <input
                      type="text"
                      placeholder="e.g. Elite Spring Drone Flight Scheduling Hold Open"
                      className="w-full bg-white/5 border border-white/10 text-xs p-3 outline-none text-white focus:border-brick-copper"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] uppercase tracking-[0.2em] text-white/40 mb-2 font-sans">Body Content (HTML/Paragraph Text)</label>
                    <textarea
                      placeholder="Write the announcement message body. You can use standard formatting..."
                      className="w-full bg-white/5 border border-white/10 text-xs text-white p-4 h-48 outline-none focus:border-brick-copper resize-none leading-relaxed"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleSendBroadcast}
                    disabled={isSendingBroadcast}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-brick-copper text-charcoal font-sans text-[10px] uppercase tracking-[0.25em] font-black self-start hover:bg-white active:scale-95 disabled:bg-brick-copper/50 disabled:cursor-wait transition-all"
                  >
                    {isSendingBroadcast && <Loader2 size={12} className="animate-spin" />}
                    {isSendingBroadcast ? "Dispatched Announcements..." : "Send Campaign Broadcast"}
                  </button>
                </div>
              </div>

              {/* Right Column: Template & Settings Config */}
              <div className="bg-white/[0.01] border border-white/5 p-8 flex flex-col justify-between h-full group hover:border-brick-copper/20 transition-all font-sans">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-brick-copper">
                    <Shield size={16} />
                    <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold">Email Config & Branding</h4>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed font-sans">
                    Configure the sender profiles, brand accents, and fallback notification redirects. Always hit the "Save Changes" button in the top menu to lock these configurations into Firestore.
                  </p>

                  <div className="space-y-4 font-sans">
                    <div>
                      <label className="block text-[8px] uppercase tracking-[0.2em] text-white/40 mb-1.5 font-sans">Sender Visual Name</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 text-xs text-white p-3 outline-none focus:border-brick-copper"
                        value={localSettings.portalSupportName || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, portalSupportName: e.target.value })}
                        placeholder="e.g. Exposed Brick Media Support"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase tracking-[0.2em] text-white/40 mb-1.5 font-sans">Sender Outbound Email</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 text-xs text-white p-3 outline-none focus:border-brick-copper"
                        value={localSettings.portalSupportEmail || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, portalSupportEmail: e.target.value })}
                        placeholder="e.g. info@exposedbrickmedia.ca"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase tracking-[0.2em] text-white/40 mb-1.5 font-sans">Inquiry Alerts email</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 text-xs text-white p-3 outline-none focus:border-brick-copper"
                        value={localSettings.portalNotifyEmail || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, portalNotifyEmail: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase tracking-[0.2em] text-white/40 mb-1.5 block font-sans">Accent Color (Hex)</label>
                      <div className="flex gap-2 font-sans">
                        <input
                          className="w-full bg-white/5 border border-white/10 text-xs font-mono text-white p-3 outline-none focus:border-brick-copper"
                          value={localSettings.accentColor || '#c43b2a'}
                          onChange={(e) => setLocalSettings({ ...localSettings, accentColor: e.target.value })}
                        />
                        <div
                          className="w-10 h-10 border border-white/15 rounded-none self-center shadow-inner"
                          style={{ backgroundColor: localSettings.accentColor || '#c43b2a' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-brick-copper/5 border border-brick-copper/10 p-5 mt-6 font-sans">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-brick-copper font-bold mb-2">Passive Logging active</p>
                  <p className="text-[10px] text-white/40 leading-relaxed font-sans">
                    Every outbound mail dispatched by the platform (invitations, referrals, chatbot holds, automated CRM listings) is recorded below with Delivery telemetry.
                  </p>
                </div>
              </div>
            </div>

            {/* Email & Audit logs list */}
            <div className="space-y-6 font-sans">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 font-sans">
                <div className="flex items-center gap-2 font-sans">
                  <FileText size={16} className="text-brick-copper" />
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold font-sans">Outbound Telemetry & Audit Logs</h4>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 font-sans">
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search recipient / subject..."
                    className="bg-white/5 border border-white/10 outline-none text-xs px-3 py-2 text-white placeholder:text-white/20 min-w-[200px]"
                    value={notiSearch}
                    onChange={(e) => { setNotiSearch(e.target.value); setNotiPage(1); }}
                  />

                  {/* Status Dropdown */}
                  <select
                    className="bg-white/5 border border-white/10 text-xs text-white px-3 py-2 outline-none"
                    value={notiStatusFilter}
                    onChange={(e) => { setNotiStatusFilter(e.target.value as any); setNotiPage(1); }}
                  >
                    <option value="all" className="bg-charcoal text-white">All Deliveries</option>
                    <option value="delivered" className="bg-charcoal text-emerald-400">✔ Delivered</option>
                    <option value="failed" className="bg-charcoal text-red-400">❌ Failed</option>
                  </select>

                  {/* Type Dropdown */}
                  <select
                    className="bg-white/5 border border-white/10 text-xs text-white px-3 py-2 outline-none"
                    value={notiTypeFilter}
                    onChange={(e) => { setNotiTypeFilter(e.target.value); setNotiPage(1); }}
                  >
                    <option value="all" className="bg-charcoal text-white">All Message Types</option>
                    <option value="custom_broadcast" className="bg-charcoal text-white">Broadcast/Campaign</option>
                    <option value="inquiry_notification" className="bg-charcoal text-white">CRM Inquiries</option>
                    <option value="ai_booking_notification" className="bg-charcoal text-white">AI Assistant hold</option>
                    <option value="system_notification" className="bg-charcoal text-white">System notifications</option>
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white/[0.01] border border-white/5 overflow-hidden font-sans">
                <div className="overflow-x-auto select-none no-scrollbar font-sans">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-white/30 font-bold bg-white/[0.01]">
                        <th className="p-4 pl-6 uppercase">Timestamp</th>
                        <th className="p-4 uppercase">Recipient</th>
                        <th className="p-4 uppercase">Subject</th>
                        <th className="p-4 uppercase">Template / Type</th>
                        <th className="p-4 uppercase text-center">Status</th>
                        <th className="p-4 pr-6 text-right uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] text-xs font-sans">
                      {filteredNotifications.slice((notiPage - 1) * 6, notiPage * 6).map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.01] transition-all group font-sans">
                          {/* Time */}
                          <td className="p-4 pl-6 font-mono text-[10px] text-white/40 whitespace-nowrap">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                          </td>
                          {/* Recipient */}
                          <td className="p-4 font-semibold text-white/80 whitespace-nowrap max-w-[150px] truncate">
                            {item.to || 'Unknown'}
                          </td>
                          {/* Subject */}
                          <td className="p-4 text-white/60 max-w-xs truncate font-medium">
                            {item.subject}
                          </td>
                          {/* Type */}
                          <td className="p-4 whitespace-nowrap font-mono text-[9px] tracking-wider text-brick-copper font-bold uppercase">
                            {item.type?.replace(/_/g, ' ')}
                          </td>
                          {/* Status */}
                          <td className="p-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                              item.status === 'delivered'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              {item.status === 'delivered' ? '✔ Delivered' : '❌ Failed'}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="p-4 pr-6 text-right whitespace-nowrap">
                            <button
                                onClick={() => setSelectedNotification(item)}
                                className="text-[9px] uppercase tracking-widest font-black text-brick-copper hover:text-white transition-all underline outline-none"
                            >
                              Inspect Payload
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredNotifications.length === 0 && (
                        <tr className="font-sans">
                          <td colSpan={6} className="p-12 text-center text-white/20 uppercase tracking-widest text-[9px] font-bold font-sans">
                            No logs matched the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <PaginationControls
                  currentPage={notiPage}
                  totalItems={filteredNotifications.length}
                  pageSize={6}
                  onPageChange={setNotiPage}
                />
              </div>
            </div>
          </section>
        )}
        
        {activeTab === 'referrals' && (
          <section className="space-y-8 font-sans">
            <div className="flex items-center gap-3 text-brick-copper mb-8 border-b border-white/5 pb-4 font-sans">
              <UserPlus size={18} />
              <h3 className="font-display text-2xl italic">Partner Referrals</h3>
            </div>
            
            <div className="bg-white/[0.01] border border-white/5 overflow-hidden font-sans">
              <div className="overflow-x-auto select-none no-scrollbar font-sans">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-white/30 font-bold bg-white/[0.01]">
                      <th className="p-4 pl-6 uppercase">Timestamp</th>
                      <th className="p-4 uppercase">Referrer</th>
                      <th className="p-4 uppercase">Target Referral</th>
                      <th className="p-4 uppercase">Status / Value</th>
                      <th className="p-4 pr-6 text-right uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-xs font-sans">
                    {referrals.slice((referralsPage - 1) * referralsPageSize, referralsPage * referralsPageSize).map(ref => {
                      let dateStr = 'N/A';
                      if (ref.createdAt) {
                        try {
                          const epoch = ref.createdAt.seconds 
                            ? ref.createdAt.seconds * 1000 
                            : new Date(ref.createdAt).getTime();
                          if (!isNaN(epoch)) {
                            dateStr = new Date(epoch).toLocaleString();
                          }
                        } catch (err) {}
                      }
                      
                      const referrerUser = users.find(u => u.id === ref.referrerUid);

                      return (
                        <tr key={ref.id} className="hover:bg-white/[0.01] transition-all group font-sans">
                          <td className="p-4 pl-6 font-mono text-[10px] text-white/40 whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="p-4 font-semibold text-white/80 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-display italic text-white">{referrerUser?.displayName || 'Unknown User'}</p>
                              <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{referrerUser?.email}</p>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-white/80 whitespace-nowrap">
                            <div>
                              <p className="text-sm text-white">{ref.referralName}</p>
                              <p className="text-[10px] text-brick-copper py-1 max-w-[200px] truncate" title={ref.notes}>{ref.notes || 'No description provided'}</p>
                              <div className="flex items-center gap-3">
                                {ref.email && <a href={`mailto:${ref.email}`} className="text-[9px] text-white/40 hover:text-white transition-colors">{ref.email}</a>}
                                {ref.phone && <a href={`tel:${ref.phone}`} className="text-[9px] text-white/40 hover:text-white transition-colors">{ref.phone}</a>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <select 
                                value={ref.status || 'Pending'}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  try {
                                    await updateDoc(doc(db, 'referrals', ref.id), { status: newStatus });
                                    toast.success("Referral status updated");
                                  } catch (err) {
                                    toast.error("Failed to update status");
                                  }
                                }}
                                className={`text-[9px] uppercase tracking-widest font-black py-1 px-2 rounded-sm outline-none transition-colors border max-w-min ${
                                  ref.status === 'Completed' ? 'bg-brick-copper/10 text-brick-copper border-brick-copper/20' : 
                                  ref.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                  'bg-white/5 text-white/40 border-white/10'
                                }`}
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Lost">Lost</option>
                            </select>
                            
                            <div className="flex items-center mt-2 gap-2">
                                <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono">Value: $</span>
                                <input 
                                    className="bg-transparent border-b border-white/10 w-16 text-xs text-brick-copper font-bold outline-none focus:border-brick-copper transition-colors"
                                    type="number"
                                    value={ref.value || 0}
                                    onBlur={async (e) => {
                                        try {
                                            await updateDoc(doc(db, 'referrals', ref.id), { value: Number(e.target.value) });
                                            toast.success("Referral value updated!");
                                        } catch (err) {
                                            toast.error("Failed to update value");
                                        }
                                    }}
                                    onChange={(e) => {
                                        const next = [...referrals];
                                        const idx = next.findIndex(r => r.id === ref.id);
                                        if (idx >= 0) {
                                            next[idx].value = Number(e.target.value);
                                            setReferrals(next);
                                        }
                                    }}
                                />
                            </div>
                          </td>
                          <td className="p-4 pr-6 whitespace-nowrap text-right">
                              <button 
                                onClick={async () => {
                                  if (confirm("Are you sure you want to permanently delete this referral record?")) {
                                    try {
                                      await deleteDoc(doc(db, 'referrals', ref.id));
                                      toast.success("Referral deleted");
                                    } catch (err) {
                                      toast.error("Error deleting referral");
                                    }
                                  }
                                }}
                                className="p-2 ml-auto text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors group/btn" 
                                title="Delete Referral"
                              >
                                <Trash2 size={16} />
                              </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <PaginationControls
              currentPage={referralsPage}
              totalItems={referrals.length}
              pageSize={referralsPageSize}
              onPageChange={setReferralsPage}
            />
          </section>
        )}

        {isEditing && (activeTab === 'teams' || activeTab === 'partners') && (
           <div className="fixed inset-0 z-[110] bg-charcoal/95 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-charcoal border border-brick-copper/30 w-full max-w-2xl h-full md:h-auto max-h-[90vh] overflow-hidden flex flex-col shadow-3xl">
              <header className="p-6 border-b border-white/5 flex justify-between items-center bg-charcoal/80">
                <div>
                  <h4 className="text-xl font-display italic text-white">
                    {activeTab === 'teams' ? (editData.name || 'Unnamed Collective') : (editData.displayName || 'Unnamed Partner')}
                  </h4>
                  <p className="text-[9px] text-brick-copper uppercase tracking-widest font-bold tracking-[0.2em]">
                    {activeTab === 'teams' ? 'Collective Architecture' : 'Partner Narrative'}
                  </p>
                </div>
                <button onClick={() => setIsEditing(null)} className="text-white/40 hover:text-white transition-colors p-2"><X size={20} /></button>
              </header>
              
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <ImageSelector 
                      label={activeTab === 'teams' ? "Collective Identity / Logo" : "Portal headshot"}
                      path={activeTab === 'teams' ? "teams" : "users"}
                      value={activeTab === 'teams' ? (editData.logoUrl || '') : (editData.headshotUrl || '')}
                      onChange={(url) => setEditData({...editData, [activeTab === 'teams' ? 'logoUrl' : 'headshotUrl']: url})}
                   />
                   <div>
                      <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">
                        {activeTab === 'teams' ? 'Standard Guidelines (URL)' : 'Email Identity'}
                      </label>
                      {activeTab === 'teams' ? (
                        <input 
                          className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white" 
                          placeholder="Link to PDF or Brand Portal"
                          value={editData.brandGuideUrl || ''} 
                          onChange={e => setEditData({...editData, brandGuideUrl: e.target.value})} 
                        />
                      ) : (
                        <input 
                          className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white/50" 
                          value={editData.email || ''} 
                          readOnly
                        />
                      )}
                   </div>
                </div>

                <div className="space-y-6">
                   <div>
                      <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">
                        {activeTab === 'teams' ? 'Collective Name' : 'Display Name'}
                      </label>
                      <input 
                        className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white" 
                        value={activeTab === 'teams' ? (editData.name || '') : (editData.displayName || '')} 
                        onChange={e => setEditData({...editData, [activeTab === 'teams' ? 'name' : 'displayName']: e.target.value})} 
                      />
                   </div>

                   <div>
                      <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">
                        {activeTab === 'teams' ? 'Architectural Statement (Description)' : 'Partner Biography'}
                      </label>
                      <textarea 
                        rows={4}
                        className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white resize-none" 
                        value={activeTab === 'teams' ? (editData.description || '') : (editData.bio || '')} 
                        onChange={e => setEditData({...editData, [activeTab === 'teams' ? 'description' : 'bio']: e.target.value})} 
                      />
                   </div>
                </div>
              </div>

              <footer className="p-6 border-t border-white/5 bg-charcoal/80 flex gap-4">
                <button 
                  onClick={() => handleUpdateTeam(isEditing)} 
                  className="flex-1 py-4 bg-brick-copper text-charcoal text-[10px] uppercase font-bold tracking-widest hover:bg-white transition-all shadow-xl font-sans"
                >
                  Persist {activeTab === 'teams' ? 'Collective' : 'Partner'}
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

        {mergeSource && (
           <div className="fixed inset-0 z-[120] bg-charcoal/95 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="bg-charcoal border border-amber-500/35 w-full max-w-lg shadow-3xl flex flex-col">
               <header className="p-6 border-b border-white/5 flex justify-between items-center bg-charcoal/80">
                 <div>
                   <h4 className="text-xl font-display italic text-amber-500 flex items-center gap-2">
                     <GitMerge size={20} className="inline text-amber-500" /> Merge Partner Profile
                   </h4>
                   <p className="text-[9px] text-white/40 uppercase tracking-widest font-black tracking-[0.2em] mt-1">
                     Consolidate duplicate identity entries
                   </p>
                 </div>
                 <button onClick={() => setMergeSource(null)} className="text-white/40 hover:text-white transition-colors p-2"><X size={20} /></button>
               </header>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                 {/* Duplicate profile (source) recap */}
                 <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xs">
                   <h5 className="text-[10px] text-amber-500 uppercase tracking-widest font-black mb-2">Duplicate Source Profile</h5>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 text-amber-500 flex items-center justify-center font-bold text-xs select-none">
                       {mergeSource.headshotUrl ? <img src={mergeSource.headshotUrl} className="w-full h-full object-cover" /> : <Users size={12} />}
                     </div>
                     <div>
                       <p className="text-xs font-bold text-white">{mergeSource.displayName || 'Unnamed'}</p>
                       <p className="text-[10px] text-white/40 font-mono">{mergeSource.email}</p>
                     </div>
                   </div>
                 </div>

                 {/* Select Target Profile */}
                 <div>
                   <label className="block text-[8px] uppercase tracking-widest text-white/50 mb-2 font-bold">Target Primary Profile (Keep this profile)</label>
                   <select
                     value={mergeTargetId}
                     onChange={(e) => setMergeTargetId(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white outline-none focus:border-brick-copper transition-colors tracking-wide"
                   >
                     <option value="" className="bg-charcoal text-white/40">-- SELECT THE PRIMARY PROFILE --</option>
                     {users
                       .filter(u => u.id !== mergeSource.id && (u.role === 'partner' || u.role === 'preferred' || u.role === 'client'))
                       .map(u => (
                         <option key={u.id} value={u.id} className="bg-charcoal text-white">
                           {u.displayName || 'Unnamed'} ({u.email || u.id})
                         </option>
                       ))
                     }
                   </select>
                   <p className="text-[8px] text-white/30 uppercase mt-2 pl-1 leading-relaxed">
                     Selected duplicate details will be merged, and database associations will be safely mapped of this target profile.
                   </p>
                 </div>

                 {/* Merge Customization Controls */}
                 <div className="space-y-4 pt-2">
                   <h5 className="text-[8px] uppercase tracking-wider text-white/60 font-bold border-b border-white/5 pb-1 mb-2">Deep Merge Configuration</h5>
                   
                   <label className="flex items-start gap-3 cursor-pointer group select-none">
                     <input
                       type="checkbox"
                       checked={mergeOptions.copyMissingDetails}
                       onChange={(e) => setMergeOptions(prev => ({ ...prev, copyMissingDetails: e.target.checked }))}
                       className="mt-0.5 rounded-sm accent-amber-500"
                     />
                     <div>
                       <p className="text-[10px] font-bold text-white group-hover:text-amber-500 transition-colors">Migrate Missing Profile Fields</p>
                       <p className="text-[8px] text-white/30 leading-normal">Copy empty fields (phone, biography narrative, social links) from the source duplicate into the primary profile.</p>
                     </div>
                   </label>

                   <label className="flex items-start gap-3 cursor-pointer group select-none">
                     <input
                       type="checkbox"
                       checked={mergeOptions.reassignProjects}
                       onChange={(e) => setMergeOptions(prev => ({ ...prev, reassignProjects: e.target.checked }))}
                       className="mt-0.5 rounded-sm accent-amber-500"
                     />
                     <div>
                       <p className="text-[10px] font-bold text-white group-hover:text-amber-500 transition-colors">Reassign Portfolio & Projects</p>
                       <p className="text-[8px] text-white/30 leading-normal">Identify and scan all synchronized media projects matching the source duplicate and re-route them to the primary profile.</p>
                     </div>
                   </label>

                   <label className="flex items-start gap-3 cursor-pointer group select-none">
                     <input
                       type="checkbox"
                       checked={mergeOptions.reassignReferrals}
                       onChange={(e) => setMergeOptions(prev => ({ ...prev, reassignReferrals: e.target.checked }))}
                       className="mt-0.5 rounded-sm accent-amber-500"
                     />
                     <div>
                       <p className="text-[10px] font-bold text-white group-hover:text-amber-500 transition-colors">Convert Referrals Stream</p>
                       <p className="text-[8px] text-white/30 leading-normal">Transfer outstanding registered client referrals linked with the source duplicate record to the primary partner.</p>
                     </div>
                   </label>

                   <label className="flex items-start gap-3 cursor-pointer group select-none">
                     <input
                       type="checkbox"
                       checked={mergeOptions.deleteSource}
                       onChange={(e) => setMergeOptions(prev => ({ ...prev, deleteSource: e.target.checked }))}
                       className="mt-0.5 rounded-sm accent-amber-500"
                     />
                     <div>
                       <p className="text-[10px] font-bold text-rose-400 group-hover:text-rose-300 transition-colors">Retire Duplicate Profile</p>
                       <p className="text-[8px] text-white/30 leading-normal">Safely delete duplicate profile "{mergeSource.displayName}" from the database once merging completes successfully.</p>
                     </div>
                   </label>
                 </div>
               </div>

               <footer className="p-6 border-t border-white/5 bg-charcoal/80 flex gap-4">
                 <button 
                   onClick={handleMergePartners}
                   disabled={!mergeTargetId || isMerging}
                   className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-charcoal disabled:opacity-40 disabled:hover:bg-amber-500 text-[10px] uppercase font-bold tracking-widest transition-all font-sans flex items-center justify-center gap-2"
                 >
                   {isMerging ? 'Merging Profiles...' : 'Integrate & Consolidate'}
                 </button>
                 <button 
                   onClick={() => setMergeSource(null)}
                   disabled={isMerging}
                   className="px-6 py-3.5 border border-white/10 text-white/40 hover:text-white disabled:opacity-40 text-[10px] uppercase tracking-widest transition-all font-sans font-bold"
                 >
                   Discard
                 </button>
               </footer>
             </div>
           </div>
        )}

        {activeTab === 'brand' && (
           <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-brick-copper">
                <Box size={18} />
                <h3 className="font-display text-2xl italic">Brand Assets</h3>
              </div>
              <button 
                onClick={() => {
                   const title = prompt("Asset Title:");
                   if (!title) return;
                   const url = prompt("Asset URL (Cloud storage or external link):");
                   if (!url) return;
                   const category = prompt("Category (e.g. Logos, Guidelines, Templates):", "Templates");
                   handleCreateBrandResource({ title, url, category });
                }}
                className="px-6 py-2 bg-brick-copper text-charcoal text-[10px] uppercase font-black tracking-widest hover:bg-white transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Upload Resource
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {brandResources.map(resource => (
                 <div key={resource.id} className="bg-white/5 border border-white/10 p-8 group hover:border-brick-copper/30 transition-all">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-10 h-10 bg-brick-copper/10 flex items-center justify-center text-brick-copper">
                          <FileText size={18} />
                       </div>
                       <button onClick={() => handleDeleteBrandResource(resource.id)} className="text-white/10 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-brick-copper font-black mb-2">{resource.category}</p>
                    <h4 className="font-display text-xl italic text-white mb-6">{resource.title}</h4>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors border-b border-white/10 pb-1"
                    >
                       <Download size={14} /> Download Asset
                    </a>
                 </div>
               ))}
               {brandResources.length === 0 && (
                  <div className="col-span-full py-24 text-center border border-dashed border-white/5 opacity-20">
                     <Box size={48} className="mx-auto mb-4" />
                     <p className="font-display text-2xl italic">No assets documented.</p>
                  </div>
               )}
            </div>
           </section>
        )}
        </div>
      </div>

        {isEditing && activeTab === 'partners' && (
           <div className="fixed inset-0 z-[110] bg-charcoal/95 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-charcoal border border-brick-copper/30 w-full max-w-2xl h-full md:h-auto max-h-[90vh] overflow-hidden flex flex-col shadow-3xl">
              <header className="p-6 border-b border-white/5 flex justify-between items-center bg-charcoal/80">
                <div>
                  <h4 className="text-xl font-display italic text-white">{editData.displayName || 'Unnamed Partner'}</h4>
                  <p className="text-[9px] text-brick-copper uppercase tracking-widest font-bold tracking-[0.2em]">Profile Architecture</p>
                </div>
                <button onClick={() => setIsEditing(null)} className="text-white/40 hover:text-white transition-colors p-2"><X size={20} /></button>
              </header>
              
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <ImageSelector 
                      label="Advisory Headshot"
                      path="partners"
                      value={editData.headshotUrl || ''}
                      onChange={(url) => setEditData({...editData, headshotUrl: url})}
                   />
                   <ImageSelector 
                      label="Agency Monogram / Logo"
                      path="partners"
                      value={editData.logoUrl || ''}
                      onChange={(url) => setEditData({...editData, logoUrl: url})}
                   />
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Full Name</label>
                         <input 
                           className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white" 
                           value={editData.displayName || ''} 
                           onChange={e => setEditData({...editData, displayName: e.target.value})} 
                         />
                      </div>
                      <div>
                         <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Email (Identity Key)</label>
                         <input 
                           readOnly
                           className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white/30 cursor-not-allowed" 
                           value={editData.email || ''} 
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Office Phone</label>
                         <input 
                           className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white" 
                           value={editData.phone || ''} 
                           onChange={e => setEditData({...editData, phone: e.target.value})} 
                         />
                      </div>
                      <div>
                         <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Instagram Handle</label>
                         <input 
                           className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white" 
                           value={editData.instagram || ''} onChange={e => setEditData({...editData, instagram: e.target.value})}                            placeholder="@username or handle"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                         <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Facebook Handle / URL</label>
                         <input 
                           className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white" 
                           value={editData.facebook || ''} 
                           onChange={e => setEditData({...editData, facebook: e.target.value})} 
                           placeholder="username or link"
                         />
                      </div>
                      <div>
                         <label className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">LinkedIn Handle / URL</label>
                         <input 
                           className="bg-white/5 border border-white/5 w-full outline-none py-3 px-4 text-sm text-white" 
                           value={editData.linkedin || ''} 
                           onChange={e => setEditData({...editData, linkedin: e.target.value})} 
                           placeholder="in/username or link"
                         />
                      </div>
                   </div>
                   <div className="hidden" style={{display: 'none'}}><div className="grid"><input 
                           onChange={e => setEditData({...editData, instagram: e.target.value})} 
                         />
                      </div>
                   </div>
                </div>
              </div>

              <footer className="p-6 border-t border-white/5 bg-charcoal/80 flex gap-4">
                <button 
                  onClick={() => handleUpdatePartner(isEditing)} 
                  className="flex-1 py-4 bg-brick-copper text-charcoal text-[10px] uppercase font-bold tracking-widest hover:bg-white transition-all shadow-xl font-sans"
                >
                  Persist Profile
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

        {selectedNotification && (
          <div className="fixed inset-0 z-[120] bg-charcoal/95 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-charcoal border border-brick-copper/30 w-full max-w-3xl h-full md:h-auto max-h-[90vh] overflow-hidden flex flex-col shadow-3xl font-sans">
              <header className="p-6 border-b border-white/5 flex justify-between items-center bg-charcoal/80 font-sans">
                <div>
                  <h4 className="text-xl font-display italic text-white truncate max-w-sm md:max-w-md">{selectedNotification.subject}</h4>
                  <p className="text-[10px] text-brick-copper uppercase tracking-widest font-bold font-sans tracking-[0.2em] mt-1">
                    Recipient: {selectedNotification.to} &bull; Type: {selectedNotification.type?.replace(/_/g, ' ')}
                  </p>
                </div>
                <button onClick={() => setSelectedNotification(null)} className="text-white/40 hover:text-white transition-colors p-2"><X size={20} /></button>
              </header>
              
              <div className="flex-1 bg-white p-6 overflow-y-auto min-h-[400px]">
                {selectedNotification.body ? (
                  <iframe
                    title="Branded Outbound Email Preview"
                    srcDoc={selectedNotification.body}
                    className="w-full h-full border-none min-h-[380px]"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <p className="text-xs text-charcoal/40 italic font-sans text-center mt-8">No content template available.</p>
                )}
              </div>

              <footer className="p-4 border-t border-white/5 bg-charcoal/50 flex justify-between items-center text-[10px] text-white/30 font-sans">
                <span>Timestamp: {selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : 'N/A'}</span>
                {selectedNotification.error && (
                  <span className="text-red-400 font-bold">Error Info: {selectedNotification.error}</span>
                )}
                <button 
                  onClick={() => setSelectedNotification(null)} 
                  className="px-6 py-2 bg-white/5 border border-white/10 text-white/70 uppercase tracking-widest hover:bg-white/15 transition-all text-[8px] font-bold"
                >
                  Close Inspector
                </button>
              </footer>
            </div>
          </div>
        )}

        {draftReplyModalContent && (
          <div className="fixed inset-0 z-[120] bg-charcoal/95 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-charcoal border border-brick-copper/30 w-full max-w-2xl overflow-hidden flex flex-col shadow-3xl font-sans">
              <header className="p-6 border-b border-white/5 flex justify-between items-center bg-charcoal/80 font-sans">
                <div>
                  <h4 className="text-lg font-display italic text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-brick-copper" />
                    Gemini Smart Correspondence Pilot
                  </h4>
                  <p className="text-[9px] text-[#ccd0d4]/80 uppercase tracking-widest font-bold mt-1">
                    AI-Powered Actionable Lead Draft
                  </p>
                </div>
                <button onClick={() => setDraftReplyModalContent(null)} className="text-white/40 hover:text-white transition-colors p-2"><X size={20} /></button>
              </header>
              
              <div className="p-6 overflow-y-auto max-h-[50vh] bg-neutral-900 border-b border-white/5">
                <p className="text-xs text-white/90 font-mono leading-relaxed whitespace-pre-wrap select-all selection:bg-brick-copper selection:text-charcoal p-4 bg-white/[0.02] border border-white/5">
                  {draftReplyModalContent}
                </p>
              </div>

              <footer className="p-4 bg-charcoal/50 flex justify-between items-center gap-4">
                <span className="text-[8px] uppercase tracking-wider text-white/30 font-mono">Tip: Text is fully selectable & copyable</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(draftReplyModalContent);
                      toast.success("Draft copied to clipboard!");
                    }}
                    className="px-6 py-2.5 bg-brick-copper text-charcoal uppercase tracking-widest text-[9px] hover:bg-white font-bold transition-all"
                  >
                    Copy to Clipboard
                  </button>
                  <button 
                    onClick={() => setDraftReplyModalContent(null)} 
                    className="px-6 py-2.5 bg-white/5 border border-white/10 text-white/70 uppercase tracking-widest hover:bg-white/15 transition-all text-[9px] font-bold"
                  >
                    Close Draft
                  </button>
                </div>
              </footer>
            </div>
          </div>
        )}

      {/* SELECTIVE FOTELLO PARTNERS IMPORT PORTAL */}
      <AnimatePresence>
        {showFotelloModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-charcoal border border-white/10 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative text-left rounded-sm"
            >
              <button 
                onClick={() => setShowFotelloModal(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                type="button"
                aria-label="Close portal"
              >
                <X size={18} />
              </button>

              <div className="p-6 md:p-8 border-b border-white/5 space-y-1">
                <span className="text-[8px] uppercase tracking-[0.3em] text-brick-copper font-mono font-black block">Directory Access Integration</span>
                <h3 className="font-display text-2xl text-white italic">Fotello Database Catalog</h3>
                <p className="text-[10px] text-white/40 font-mono">Select individual advisor directories to import into Exposed Brick Media ecosystems.</p>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                {loadingFotello ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-white/50">
                    <span className="w-8 h-8 border-2 border-brick-copper border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Accessing secure Fotello registries...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fotelloPartners.length === 0 ? (
                      <div className="py-8 text-center text-[10px] uppercase tracking-wider text-white/30 font-mono">
                        No external partners catalogued in external registries.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fotelloPartners.map((partner) => (
                          <div 
                            key={partner.email} 
                            className={`border p-4 rounded-xs flex gap-3 items-start transition-all duration-300 ${
                              partner.isImported 
                                ? "border-emerald-500/20 bg-emerald-500/[0.01]" 
                                : "border-white/5 bg-white/[0.01] hover:border-white/10"
                            }`}
                          >
                            <img 
                              src={partner.headshotUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"} 
                              alt={partner.displayName} 
                              className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-display font-semibold text-sm text-white truncate flex items-center gap-2">
                                {partner.displayName}
                                {partner.isImported && (
                                  <span className="text-[8px] uppercase font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-sm font-bold">
                                    ✓ Imported
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-white/50 font-mono truncate">{partner.email}</p>
                              {partner.phone && <p className="text-[9px] text-white/40 font-mono mt-0.5">{partner.phone}</p>}
                              <p className="text-[10px] text-white/40 line-clamp-2 mt-2 leading-relaxed font-sans">
                                {partner.bio}
                              </p>
                            </div>
                            
                            <div className="shrink-0 pt-1">
                              {partner.isImported ? (
                                <button
                                  disabled
                                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[8px] uppercase font-bold tracking-wider rounded-xs cursor-not-allowed"
                                >
                                  Active
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleImportSinglePartner(partner)}
                                  className="px-3 py-1.5 bg-brick-copper hover:bg-white text-charcoal text-[8px] uppercase font-black tracking-wider rounded-xs transition-all cursor-pointer"
                                >
                                  Import
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 mt-auto border-t border-white/5 flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowFotelloModal(false)}
                  className="border border-white/10 text-white px-6 py-2.5 hover:bg-white hover:text-charcoal transition-all rounded-xs text-[9px] uppercase font-black tracking-widest cursor-pointer"
                >
                  Close Directory
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
