/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Video, Box, Edit3, Trash2, ChevronUp, ChevronDown, Plus, Check, X, GripVertical, Image as ImageIcon, LayoutGrid, Grid3X3 } from 'lucide-react';
import { PROPERTY_TYPES, PROPERTY_STATUSES, PORTFOLIO_CATEGORIES } from '../constants';
import { useState, useEffect, useMemo } from 'react';
import { useSiteContent } from '../lib/SiteContentContext';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileUpload } from './FileUpload';
import { ImageSelector } from './ImageSelector';
import { LinkSelector } from './LinkSelector';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortablePortfolioItem = ({ 
  item, 
  index, 
  isEditMode, 
  isAdmin, 
  isFeatured, 
  variant,
  startEdit, 
  deleteItem 
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.3 : 1
  };

  const isGallery = variant === 'gallery';
  const isSpacer = item.type === 'spacer';
  const width = isFeatured && !isGallery ? 1000 : 600;
  const isUnsplash = item.img && item.img.includes('unsplash.com');
  const optimizedUrl = isUnsplash
    ? `${item.img.split('?')[0]}?auto=format&fit=crop&q=80&w=${width}`
    : item.img;

  const content = isSpacer ? (
    <div className="absolute inset-0 bg-transparent flex items-center justify-center border border-dashed border-white/5 group-hover:border-white/10 transition-colors">
       {isEditMode && <span className="text-[8px] uppercase tracking-widest text-white/10">Blank Space</span>}
    </div>
  ) : (
    <>
      <motion.img 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.215, 0.61, 0.355, 1], delay: index * 0.05 }}
        whileHover={!isEditMode ? { scale: 1.05 } : {}}
        src={optimizedUrl} 
        alt={item.title}
        loading={index < 4 ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-all duration-700 ${isGallery ? 'opacity-90 group-hover:opacity-100' : 'opacity-60 group-hover:opacity-100 grayscale group-hover:grayscale-0'}`}
      />
      
      {/* Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 ${isGallery ? 'opacity-40 group-hover:opacity-70' : 'opacity-40 group-hover:opacity-0'}`} />
      
      {/* 45% overall darker overlay on hover for better contrast */}
      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Gallery Info Overlay (Gallery Mode specific) */}
      {isGallery && (
        <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-3 group-hover:translate-y-0 transition-transform duration-500 z-20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] uppercase tracking-[0.4em] text-brick-copper block font-black drop-shadow-2xl">{item.propertyType || item.category}</span>
            {item.status && <span className="text-[9px] uppercase tracking-widest px-3 py-1 bg-brick-copper text-white rounded-sm shadow-2xl font-bold">{item.status}</span>}
          </div>
          <h3 className="text-xl font-display italic text-white tracking-tight drop-shadow-2xl">{item.title}</h3>
          {(item.beds || item.baths || item.sqft || item.listPrice) && (
            <div className="flex gap-4 mt-3 text-[10px] font-mono text-white drop-shadow-md">
              {item.listPrice && <span>{item.listPrice}</span>}
              {item.sqft && <span>{item.sqft} SQFT</span>}
            </div>
          )}
        </div>
      )}

      {/* Category Tag (Grid Mode) */}
      {!isGallery && (
        <div className="absolute bottom-4 left-4 z-10 transition-transform group-hover:-translate-y-1">
           <span className="text-[10px] uppercase tracking-widest bg-charcoal px-3 py-1.5 border border-border-subtle group-hover:border-brick-copper group-hover:text-brick-copper transition-all font-bold shadow-2xl">
             {index + 1 < 10 ? `0${index + 1}` : index + 1} / {item.category}
           </span>
        </div>
      )}

      {/* Grid Hover State */}
      {!isGallery && !isEditMode && (
        <div className="absolute inset-0 bg-charcoal/98 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
           <span className="text-[11px] uppercase tracking-[0.6em] font-black text-brick-copper mb-5 drop-shadow-2xl border-b-2 border-brick-copper/40 pb-2">
             Archive Entry
           </span>
           <h3 className="text-2xl font-display italic text-white mb-6 leading-tight drop-shadow-2xl">{item.title}</h3>
           
           <div className="flex flex-col gap-2 mb-6">
             {item.propertyType && <span className="text-[10px] uppercase tracking-widest text-white/40">{item.propertyType}</span>}
             {(item.beds || item.baths || item.sqft || item.listPrice || item.status) && (
               <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[9px] font-mono text-white/70 border-t border-white/10 pt-4 mt-2">
                 {item.status && <span className="text-brick-copper font-bold drop-shadow-sm">{item.status}</span>}
                 {item.listPrice && <span>{item.listPrice}</span>}
                 {item.beds && <span>{item.beds} BD</span>}
                 {item.baths && <span>{item.baths} BA</span>}
                 {item.sqft && <span>{item.sqft} SQFT</span>}
                 {item.mlsNumber && <span className="text-white/30"># {item.mlsNumber}</span>}
               </div>
             )}
           </div>

           {item.description && (
             <p className="text-[10px] text-white/50 font-mono tracking-tighter leading-relaxed max-w-[240px] line-clamp-3 italic">
               "{item.description}"
             </p>
           )}

           <div className="mt-8 transform translate-y-6 group-hover:translate-y-0 transition-all duration-700 delay-100 flex gap-3">
              <span className="px-6 py-3.5 border-2 border-brick-copper text-brick-copper text-[11px] uppercase tracking-[0.3em] bg-brick-copper/10 shadow-[0_0_40px_rgba(184,115,51,0.25)] drop-shadow-2xl font-black">Open Archive</span>
              {item.externalLink && (
                <a 
                  href={item.externalLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-6 py-3.5 border-2 border-white/20 text-white text-[11px] uppercase tracking-[0.3em] bg-white/5 hover:bg-white/10 transition-all font-black pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Listing
                </a>
              )}
           </div>
        </div>
      )}
    </>
  );

  const getLinkContent = () => {
    if (isEditMode || isSpacer) return content;
    const to = item.url && item.url !== 'listing' ? item.url : `/listing/${item.id}`;
    
    if (to.startsWith('http')) {
      return (
        <a href={to} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          {content}
        </a>
      );
    }

    return (
      <Link to={to} className="block w-full h-full">
        {content}
      </Link>
    );
  };

  const colSpanClasses: Record<number, string> = {
    1: 'sm:col-span-1',
    2: 'sm:col-span-2',
    3: 'sm:col-span-3',
    4: 'sm:col-span-4'
  };

  const rowSpanClasses: Record<number, string> = {
    1: 'sm:row-span-1',
    2: 'sm:row-span-2',
    3: 'sm:row-span-3',
    4: 'sm:row-span-4'
  };

  const colSpan = item.colSpan || (isFeatured && !isGallery ? 2 : 1);
  const rowSpan = item.rowSpan || (isFeatured && !isGallery ? 2 : 1);
  const panel = item.panel || 'main';

  const isClickable = !isEditMode && !isSpacer;

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style}
      whileTap={isClickable ? { scale: 0.985 } : {}}
      className={`relative overflow-hidden group ${isSpacer ? 'bg-transparent' : 'bg-stone-900 border border-border-subtle'} ${isClickable ? 'cursor-pointer' : ''} hover:border-brick-copper/80 hover:shadow-[0_0_30px_rgba(184,115,51,0.15)] transition-all duration-500 rounded-sm ${
        !isGallery ? `${colSpanClasses[colSpan] || 'sm:col-span-1'} ${rowSpanClasses[rowSpan] || 'sm:row-span-1'}` : ''
      } ${isGallery ? 'aspect-[4/5]' : 'aspect-square md:aspect-auto'}`}
    >
      {/* Hidden Badge for Admin */}
      {isAdmin && item.hidden && (
        <div className="absolute top-4 left-4 z-[25] bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.3em] px-2 py-1 shadow-lg border border-red-400">
          Hidden from public
        </div>
      )}

      {/* Custom Banner - Prominent Diagonal Sash */}
      {item.bannerText && (
        <div className={`absolute top-0 right-0 z-[25] pointer-events-none overflow-hidden ${
          item.bannerSize === 'compact' ? 'w-24 h-24' : 
          item.bannerSize === 'large' ? 'w-40 h-40' : 
          item.bannerSize === 'extra' ? 'w-56 h-56' : 'w-32 h-32'
        }`}>
          <div 
            className={`absolute text-center rotate-45 shadow-2xl border-y border-white/20 font-black uppercase tracking-[0.2em] px-2 transition-all duration-500 ${
              item.bannerSize === 'compact' ? 'top-4 -right-12 text-[7px] py-1 w-[140px]' : 
              item.bannerSize === 'large' ? 'top-10 -right-10 text-[10px] py-2 w-[200px]' : 
              item.bannerSize === 'extra' ? 'top-16 -right-14 text-[14px] py-3 w-[280px]' : 'top-6 -right-10 text-[8px] py-1.5 w-[160px]'
            }`}
            style={{ 
              backgroundColor: item.bannerColor || '#C57D5D',
              color: item.bannerColor === '#FAFAFA' ? '#1a1a1a' : (item.bannerColor === '#1A1A1A' ? '#ffffff' : '#1a1a1a')
            }}
          >
            {item.bannerText}
          </div>
        </div>
      )}

      {getLinkContent()}

      {/* Admin Controls */}
      {isEditMode && (
        <div className="absolute inset-0 bg-charcoal/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="flex flex-col gap-2 scale-90">
            <div className="flex gap-2">
              <div {...attributes} {...listeners} className="p-2 bg-brick-copper text-charcoal rounded cursor-grab active:cursor-grabbing hover:bg-white transition-colors">
                <GripVertical size={16} />
              </div>
              {!isSpacer && (
                <button onClick={() => startEdit(item)} className="p-2 bg-charcoal text-brick-copper rounded border border-brick-copper hover:bg-brick-copper hover:text-charcoal transition-all">
                  <Edit3 size={16} />
                </button>
              )}
              <button 
                onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { panel: panel === 'main' ? 'side' : 'main', updatedAt: serverTimestamp() })}
                className="p-2 bg-charcoal text-white rounded border border-white/20 hover:bg-white hover:text-charcoal transition-all flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest"
                title={`Move to ${panel === 'main' ? 'Side' : 'Main'} Panel`}
              >
                {panel === 'main' ? 'MAIN' : 'SIDE'}
              </button>
              <button onClick={() => deleteItem(item.id)} className="p-2 bg-charcoal text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-white transition-all">
                <Trash2 size={16} />
              </button>
            </div>
            
            {!isGallery && panel === 'main' && (
              <div className="flex flex-col gap-1 bg-charcoal/80 p-2 rounded border border-white/10">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[8px] uppercase tracking-widest text-white/40">Width</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { colSpan: Math.max(1, colSpan - 1), updatedAt: serverTimestamp() })}
                      className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[10px] rounded"
                    >
                      -
                    </button>
                    <span className="text-[10px] w-4 text-center font-mono">{colSpan}</span>
                    <button 
                      onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { colSpan: Math.min(4, colSpan + 1), updatedAt: serverTimestamp() })}
                      className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[10px] rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[8px] uppercase tracking-widest text-white/40">Height</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { rowSpan: Math.max(1, rowSpan - 1), updatedAt: serverTimestamp() })}
                      className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[10px] rounded"
                    >
                      -
                    </button>
                    <span className="text-[10px] w-4 text-center font-mono">{rowSpan}</span>
                    <button 
                      onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { rowSpan: Math.min(4, rowSpan + 1), updatedAt: serverTimestamp() })}
                      className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[10px] rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Clean object for Firestore (remove functions and non-serializable fields)
const cleanObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  const result: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'function') continue;
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object') {
      result[key] = cleanObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

export const Portfolio = ({ variant = 'grid', panel = 'main' }: { variant?: 'grid' | 'gallery', panel?: 'main' | 'side' }) => {
  const { isEditMode, isAdmin, portfolioItems: rawItems, settings } = useSiteContent();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [activeCategory, setActiveCategory] = useState('All');

  const propertiesPerPage = settings.propertiesPerPage || 6;
  const [visibleCount, setVisibleCount] = useState(propertiesPerPage);

  const items = useMemo(() => {
    let baseItems = rawItems.filter(item => (item.panel || 'main') === panel);
    
    // Non-admins should not see hidden items
    if (!isAdmin) {
      baseItems = baseItems.filter(item => !item.hidden);
    }
    
    return baseItems;
  }, [rawItems, panel, isAdmin]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(items.map(item => item.category).filter(Boolean))];
    return cats;
  }, [items]);

  const propertyTypes = useMemo(() => {
    const types = ['All Types', ...new Set(items.map(item => item.propertyType).filter(Boolean))];
    return types;
  }, [items]);

  const statuses = useMemo(() => {
    const s = ['All Statuses', ...new Set(items.map(item => item.status).filter(Boolean))];
    return s;
  }, [items]);

  const [activePropertyType, setActivePropertyType] = useState('All Types');
  const [activeStatus, setActiveStatus] = useState('All Statuses');

  // Reset pagination when active filters change
  useEffect(() => {
    setVisibleCount(propertiesPerPage);
  }, [activeCategory, activePropertyType, activeStatus, propertiesPerPage]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchPropertyType = activePropertyType === 'All Types' || item.propertyType === activePropertyType;
      const matchStatus = activeStatus === 'All Statuses' || item.status === activeStatus;
      return matchCategory && matchPropertyType && matchStatus;
    });
  }, [items, activeCategory, activePropertyType, activeStatus]);

  const displayedItems = useMemo(() => {
    // In edit mode, we show all items to allow reordering the entire set.
    // In public view, we use the visibleCount for pagination optimization.
    if (isEditMode) return filteredItems;
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount, isEditMode]);

  const hasMore = !isEditMode && visibleCount < filteredItems.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + propertiesPerPage);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      const batch = writeBatch(db);
      newItems.forEach((item, index) => {
        batch.update(doc(db, 'portfolio_items', item.id), { 
          order: index,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
    }
  };

  const addItem = async () => {
    const newDoc = await addDoc(collection(db, 'portfolio_items'), {
      title: 'New Project',
      category: PORTFOLIO_CATEGORIES[0],
      propertyType: PROPERTY_TYPES[0],
      status: PROPERTY_STATUSES[0],
      img: 'https://images.unsplash.com/photo-1600607687940-c52fb036999c',
      description: 'Short project story...',
      url: '',
      type: 'item',
      panel: panel,
      colSpan: 1,
      rowSpan: 1,
      order: items.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    // Automatically start editing
    const itemData = { 
      id: newDoc.id, 
      title: 'New Project', 
      category: PORTFOLIO_CATEGORIES[0], 
      propertyType: PROPERTY_TYPES[0],
      status: PROPERTY_STATUSES[0],
      description: 'Short project story...', 
      img: 'https://images.unsplash.com/photo-1600607687940-c52fb036999c',
      url: '',
      type: 'item'
    };
    setEditingItem(itemData);
    setEditFields({ ...itemData });
  };

  const addSpacer = async () => {
    await addDoc(collection(db, 'portfolio_items'), {
      title: 'Spacer',
      category: 'Utility',
      img: '',
      description: '',
      url: '',
      type: 'spacer',
      panel: panel,
      colSpan: 1,
      rowSpan: 1,
      order: items.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const deleteItem = async (id: string) => {
    if (confirm('Delete this project forever?')) {
      await deleteDoc(doc(db, 'portfolio_items', id));
    }
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    const { id: _, ...dataToUpdate } = editFields;
    await updateDoc(doc(db, 'portfolio_items', editingItem.id), {
      ...cleanObject(dataToUpdate),
      updatedAt: serverTimestamp()
    });
    setEditingItem(null);
  };

  const itemIds = useMemo(() => displayedItems.map(i => i.id), [displayedItems]);

  return (
    <div className="relative w-full">
      {/* Category & Property Filter */}
      <div className="mb-8 space-y-4 border-b border-border-subtle pb-6 px-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-6 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] uppercase tracking-[0.4em] transition-all whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'text-brick-copper font-black border-b-2 border-brick-copper pb-1' 
                    : 'text-text-primary/70 hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {isAdmin && isEditMode && (
            <div className="flex gap-2">
              <button 
                onClick={addSpacer}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 text-white/40 hover:text-white transition-all uppercase text-[8px] tracking-widest font-bold rounded-sm"
              >
                <LayoutGrid size={12} /> Add Space
              </button>
              <button 
                onClick={addItem}
                className="flex items-center gap-2 px-6 py-2 bg-brick-copper text-charcoal hover:bg-white transition-all uppercase text-[10px] tracking-widest font-bold shadow-xl rounded-sm"
              >
                <Plus size={14} /> Add Project
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 overflow-x-auto no-scrollbar py-1 border-t border-white/5 pt-4">
          <div className="flex gap-2">
            {propertyTypes.map(type => (
              <button
                key={type}
                onClick={() => setActivePropertyType(type)}
                className={`text-[9px] uppercase tracking-widest px-3 py-1 border transition-all whitespace-nowrap ${
                  activePropertyType === type 
                    ? 'border-brick-copper text-brick-copper bg-brick-copper/5' 
                    : 'border-white/5 text-white/20 hover:text-white/40'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />

          <div className="flex gap-2">
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`text-[9px] uppercase tracking-widest px-3 py-1 border transition-all whitespace-nowrap ${
                  activeStatus === status
                    ? 'border-white text-white bg-white/5' 
                    : 'border-white/5 text-white/20 hover:text-white/40'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-charcoal/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-bg-primary border border-border-subtle p-6 md:p-10 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setEditingItem(null)}
                className="absolute top-4 right-4 text-text-primary/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h2 className="font-display text-2xl tracking-tight text-white italic">Project Matrix</h2>
                  
                  <ImageSelector 
                    label="Cover Image"
                    path="portfolio"
                    value={editFields.img || ''}
                    onChange={(url) => setEditFields({...editFields, img: url})}
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
      {/* Identification & URL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">Identification</label>
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-2 text-sm outline-none focus:border-brick-copper transition-colors placeholder:text-white/10"
                          placeholder="Project Title"
                          value={editFields.title}
                          onChange={e => setEditFields({...editFields, title: e.target.value})}
                        />
                      </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">Allocation</label>
                        <select 
                          className="w-full bg-charcoal border-b border-border-subtle p-2 text-xs outline-none focus:border-brick-copper transition-colors uppercase tracking-widest"
                          value={editFields.panel || 'main'}
                          onChange={e => setEditFields({...editFields, panel: e.target.value})}
                        >
                          <option value="main">Main Panel</option>
                          <option value="side">Side Panel</option>
                        </select>
                      </div>
                      <div>
                        <LinkSelector 
                          label="Destination"
                          value={editFields.url || 'listing'}
                          onChange={(val) => setEditFields({...editFields, url: val})}
                        />
                      </div>
                    </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">Taxonomy & Technicals</label>
                      <div className="grid grid-cols-2 gap-4">
                        <select 
                          className="w-full bg-transparent border-b border-border-subtle p-2 text-sm outline-none focus:border-brick-copper transition-colors appearance-none bg-charcoal"
                          value={editFields.category || ''}
                          onChange={e => setEditFields({...editFields, category: e.target.value})}
                        >
                          <option value="">Select Category</option>
                          {PORTFOLIO_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <select 
                          className="w-full bg-transparent border-b border-border-subtle p-2 text-sm outline-none focus:border-brick-copper transition-colors appearance-none bg-charcoal"
                          value={editFields.propertyType || ''}
                          onChange={e => setEditFields({...editFields, propertyType: e.target.value})}
                        >
                          <option value="">Select Property Type</option>
                          {PROPERTY_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/40 mb-1 block">MLS #</label>
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-1 text-xs outline-none focus:border-brick-copper"
                          value={editFields.mlsNumber || ''}
                          onChange={e => setEditFields({...editFields, mlsNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/40 mb-1 block">Price</label>
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-1 text-xs outline-none focus:border-brick-copper"
                          value={editFields.listPrice || ''}
                          onChange={e => setEditFields({...editFields, listPrice: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/40 mb-1 block">Status</label>
                        <select 
                          className="w-full bg-transparent border-b border-border-subtle p-1 text-xs outline-none focus:border-brick-copper appearance-none bg-charcoal"
                          value={editFields.status || ''}
                          onChange={e => setEditFields({...editFields, status: e.target.value})} 
                        >
                          <option value="">Status</option>
                          {PROPERTY_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">External Listing Agents Link</label>
                      <input 
                        className="w-full bg-transparent border-b border-border-subtle p-1 text-xs outline-none focus:border-brick-copper placeholder:text-white/10"
                        placeholder="https://listing-agent.com/property"
                        value={editFields.externalLink || ''}
                        onChange={e => setEditFields({...editFields, externalLink: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pb-4">
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/40 mb-1 block">Beds</label>
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-1 text-xs outline-none focus:border-brick-copper"
                          value={editFields.beds || ''}
                          onChange={e => setEditFields({...editFields, beds: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/40 mb-1 block">Baths</label>
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-1 text-xs outline-none focus:border-brick-copper"
                          value={editFields.baths || ''}
                          onChange={e => setEditFields({...editFields, baths: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/40 mb-1 block">SQFT</label>
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-1 text-xs outline-none focus:border-brick-copper"
                          value={editFields.sqft || ''}
                          onChange={e => setEditFields({...editFields, sqft: e.target.value})}
                        />
                      </div>
                    </div>

                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">Visibility & Narrative</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-4 bg-charcoal/50 p-3 border border-border-subtle">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                className="hidden"
                                checked={editFields.hidden || false}
                                onChange={e => setEditFields({...editFields, hidden: e.target.checked})}
                              />
                              <div className={`w-4 h-4 border flex items-center justify-center transition-all ${editFields.hidden ? 'bg-red-500 border-red-500' : 'border-white/20 group-hover:border-brick-copper'}`}>
                                {editFields.hidden && <Check size={10} className="text-white" />}
                              </div>
                              <span className="text-[10px] uppercase tracking-widest text-white/60">Hide listing from public</span>
                            </label>
                          </div>
                          <div className="bg-charcoal/50 p-3 border border-border-subtle space-y-4">
                            <div>
                              <label className="text-[8px] uppercase tracking-widest text-white/40 mb-1 block">Banner Ribbon Text</label>
                              <input 
                                className="w-full bg-transparent border-b border-white/10 p-1 text-[10px] outline-none focus:border-brick-copper transition-colors uppercase tracking-widest"
                                placeholder="e.g. JUST LISTED"
                                value={editFields.bannerText || ''}
                                onChange={e => setEditFields({...editFields, bannerText: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[8px] uppercase tracking-widest text-white/40 mb-2 block">Color</label>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {['#C57D5D', '#B5A48F', '#1A1A1A', '#FAFAFA', '#E53E3E', '#38A169'].map(c => (
                                    <button 
                                      key={c}
                                      onClick={() => setEditFields({...editFields, bannerColor: c})}
                                      className={`w-4 h-4 border transition-all ${editFields.bannerColor === c ? 'border-white scale-110 shadow-sm' : 'border-white/10 hover:scale-105'}`}
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </div>
                                <input 
                                  className="w-full bg-transparent border-b border-white/10 p-1 text-[8px] outline-none focus:border-brick-copper transition-colors font-mono"
                                  placeholder="#HEX"
                                  value={editFields.bannerColor || ''}
                                  onChange={e => setEditFields({...editFields, bannerColor: e.target.value})}
                                />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase tracking-widest text-white/40 mb-2 block">Size</label>
                                <select 
                                  className="w-full bg-transparent border-b border-white/10 p-1 text-[8px] outline-none focus:border-brick-copper transition-colors uppercase tracking-widest appearance-none bg-charcoal/50"
                                  value={editFields.bannerSize || 'normal'}
                                  onChange={e => setEditFields({...editFields, bannerSize: e.target.value})}
                                >
                                  <option value="compact">Compact</option>
                                  <option value="normal">Normal</option>
                                  <option value="large">Large</option>
                                  <option value="extra">Extra</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <textarea 
                        className="w-full bg-transparent border border-border-subtle p-3 h-32 text-xs outline-none focus:border-brick-copper transition-colors resize-none custom-scrollbar"
                        placeholder="Project technical details and atmosphere..."
                        value={editFields.description}
                        onChange={e => setEditFields({...editFields, description: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border-subtle">
                    <button 
                      onClick={saveEdit} 
                      className="flex-grow py-3 bg-brick-copper text-charcoal uppercase text-[10px] tracking-[0.2em] font-bold hover:bg-white transition-all shadow-lg"
                    >
                      Commit Changes
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Display */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={`w-full p-4 grid gap-4 md:gap-1 lg:gap-2 ${
          variant === 'gallery' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
            : panel === 'side'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 auto-rows-[120px]'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[150px] md:auto-rows-[200px]'
        }`}>
          <SortableContext 
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            {displayedItems.map((item, index) => (
              <SortablePortfolioItem 
                key={item.id}
                item={item}
                index={index}
                isEditMode={isEditMode}
                isAdmin={isAdmin}
                variant={variant}
                isFeatured={index === 0}
                startEdit={(item: any) => {
                  setEditingItem(item);
                  setEditFields({ ...item });
                }}
                deleteItem={deleteItem}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
      
      {/* Load More Button */}
      {hasMore && (
        <div className="mt-12 flex justify-center pb-12">
          <button
            onClick={handleLoadMore}
            className="px-12 py-4 bg-transparent border-2 border-brick-copper text-brick-copper hover:bg-brick-copper hover:text-charcoal transition-all uppercase text-[11px] tracking-[0.4em] font-black shadow-2xl relative group overflow-hidden"
          >
            <span className="relative z-10">Expand Archive</span>
            <div className="absolute inset-0 bg-brick-copper translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          </button>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="py-24 text-center border border-dashed border-border-subtle rounded m-4">
          <p className="text-[10px] uppercase tracking-[0.4em] text-text-primary/20 italic">No archive entries for this filter</p>
        </div>
      )}
    </div>
  );
};


const SortableServiceItem = ({ 
  tier, 
  index,
  isEditMode, 
  isAdmin, 
  editingId, 
  editFields, 
  setEditFields, 
  startEdit, 
  saveEdit, 
  setEditingId, 
  deleteTier 
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tier.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1
  };

  const targetUrl = tier.url ? (tier.url.startsWith('/') || tier.url.startsWith('http') ? tier.url : `/p/${tier.url}`) : null;
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) return;
    if (targetUrl) {
      if (targetUrl.startsWith('http')) {
        // Handled by anchor tag if we use one, but keeping for compatibility
        return; 
      } else {
        navigate(targetUrl);
      }
    }
  };

  const cardContent = (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      whileHover={!isEditMode && targetUrl ? { 
        x: 5, 
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(184, 115, 51, 0.5)',
      } : {}}
      whileTap={!isEditMode && targetUrl ? { scale: 0.98 } : {}}
      className={`group relative border border-border-subtle p-5 transition-all bg-text-primary/[0.02] ${
        isEditMode 
          ? 'hover:border-brick-copper/50' 
          : (targetUrl ? 'cursor-pointer shadow-sm hover:shadow-md' : 'cursor-default')
      }`}
    >
      {editingId === tier.id ? (
        <div className="space-y-3" onClick={e => e.stopPropagation()}>
          <div className="flex gap-2">
            <input 
              className="bg-transparent border-b border-brick-copper/30 w-full outline-none text-sm font-semibold"
              value={editFields.title}
              onChange={e => setEditFields({...editFields, title: e.target.value})}
              autoFocus
            />
            <input 
              className="bg-transparent border-b border-brick-copper/30 w-24 outline-none text-[10px] font-mono text-brick-copper"
              value={editFields.price}
              onChange={e => setEditFields({...editFields, price: e.target.value})}
            />
          </div>
          <textarea 
            className="bg-transparent border border-brick-copper/10 w-full h-16 p-2 text-[10px] outline-none"
            value={editFields.description}
            onChange={e => setEditFields({...editFields, description: e.target.value})}
          />
          <div className="py-2">
            <LinkSelector 
              label="Service URL / Destination"
              value={editFields.url || ''}
              allowListing={false}
              onChange={val => setEditFields({...editFields, url: val})}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => saveEdit(tier.id)} className="text-green-500 hover:text-green-400 font-bold p-1"><Check size={14} /></button>
            <button onClick={() => setEditingId(null)} className="text-text-primary/30 hover:text-text-primary font-bold p-1"><X size={14} /></button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              {isEditMode && (
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-text-primary/20 hover:text-brick-copper transition-colors p-1" onClick={e => e.stopPropagation()}>
                  <GripVertical size={14} />
                </div>
              )}
              <h4 className="text-sm font-semibold group-hover:text-brick-copper transition-colors">{tier.title}</h4>
            </div>
            {tier.price && <span className="text-[10px] font-mono text-brick-copper tracking-widest font-bold drop-shadow-sm">{tier.price}</span>}
          </div>
          <p className="text-[10px] text-text-primary/40 leading-relaxed tracking-wide pl-6">
            {tier.description}
          </p>

          {!isEditMode && targetUrl && (
            <div className="pl-6 mt-3">
               <span className="text-[8px] uppercase tracking-[0.2em] text-brick-copper border-b border-brick-copper/20 pb-0.5 group-hover:border-brick-copper transition-colors">Explore Potential &rarr;</span>
            </div>
          )}

          {isAdmin && isEditMode && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-3 pr-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <button onClick={() => startEdit(tier)} className="text-text-primary/20 hover:text-brick-copper transition-colors"><Edit3 size={12} /></button>
              <button onClick={() => deleteTier(tier.id)} className="text-text-primary/20 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  if (!isEditMode && targetUrl) {
    if (targetUrl.startsWith('http')) {
      return (
        <a 
          ref={setNodeRef} 
          href={targetUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={style}
          className="block no-underline"
        >
          {cardContent}
        </a>
      );
    }
    return (
      <Link 
        ref={setNodeRef} 
        to={targetUrl} 
        style={style}
        className="block no-underline"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      {cardContent}
    </div>
  );
};

export const Services = ({ override }: { override?: { title: string, subtitle: string } }) => {
  const { services, settings, isAdmin, isEditMode, loading } = useSiteContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ title: '', description: '', price: '', url: '' });

  if (loading) {
    return null; // Or skeleton
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex(s => s.id === active.id);
      const newIndex = services.findIndex(s => s.id === over.id);
      
      const newItems = arrayMove(services, oldIndex, newIndex);
      
      // Update all orders in Firestore
      const batch = writeBatch(db);
      newItems.forEach((item, index) => {
        batch.update(doc(db, 'services', item.id), { 
          order: index,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
    }
  };

  const deleteTier = async (id: string) => {
    if (confirm('Erase this tier?')) {
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch (err) {
        console.error("Failed to delete service:", err);
        alert("System refusal: Could not delete service. Verify permissions.");
      }
    }
  };

  const addTier = async () => {
    try {
      await addDoc(collection(db, 'services'), {
        title: 'New Service',
        description: 'Refined media solution...',
        price: '$—',
        url: '',
        order: services.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to add service:", err);
      alert("System refusal: Could not create service.");
    }
  };

  const startEdit = (tier: any) => {
    setEditingId(tier.id);
    setEditFields({ 
      title: tier.title, 
      description: tier.description, 
      price: tier.price || '',
      url: tier.url || ''
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'services', id), {
        ...editFields,
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update service:", err);
      alert("System refusal: Could not persist changes.");
    }
  };

  const displayServices = (services.length > 0 || (isAdmin && isEditMode)) ? services : [
    { 
      id: 'photography',
      title: 'Photography', 
      description: 'Editorial-grade architectural coverage capturing movement and soul.'
    },
    { 
      id: 'videography',
      title: 'Cinematography', 
      description: '4K Cinematic storytelling using rhythmic pacing and aerials.'
    },
    { 
      id: '3dtours',
      title: '3D Virtual Tours', 
      description: 'High-fidelity digital twins for remote structural understanding.'
    }
  ];

  const serviceIds = useMemo(() => displayServices.map(s => s.id), [displayServices]);

  return (
    <div className="mt-12 lg:mt-auto space-y-8">
      <div className="border-b border-border-subtle pb-3 flex justify-between items-end">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-text-primary/40 mb-1">{override?.title || settings.servicesTitle || 'Service Tiers'}</h3>
          {(override?.subtitle || settings.servicesSubtitle) && <p className="text-[9px] text-text-primary/30 uppercase tracking-widest">{override?.subtitle || settings.servicesSubtitle}</p>}
        </div>
        {isAdmin && isEditMode && (
          <button onClick={addTier} className="p-1 text-brick-copper hover:text-text-primary transition-colors">
            <Plus size={14} />
          </button>
        )}
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          <SortableContext 
            items={serviceIds}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence>
              {displayServices.map((tier, index) => (
                <SortableServiceItem 
                  key={tier.id}
                  tier={tier}
                  index={index}
                  isEditMode={isEditMode}
                  isAdmin={isAdmin}
                  editingId={editingId}
                  editFields={editFields}
                  setEditFields={setEditFields}
                  startEdit={startEdit}
                  saveEdit={saveEdit}
                  setEditingId={setEditingId}
                  deleteTier={deleteTier}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};
