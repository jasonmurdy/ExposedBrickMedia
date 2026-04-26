/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Video, Box, Edit3, Trash2, ChevronUp, ChevronDown, Plus, Check, X, GripVertical, Image as ImageIcon, LayoutGrid, Grid3X3 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useSiteContent } from '../lib/SiteContentContext';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileUpload } from './FileUpload';
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
        whileHover={!isEditMode && !item.url ? { scale: 1.05 } : {}}
        transition={{ duration: 1.2, ease: [0.215, 0.61, 0.355, 1] }}
        src={optimizedUrl} 
        alt={item.title}
        loading="lazy"
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

           <div className="mt-8 transform translate-y-6 group-hover:translate-y-0 transition-all duration-700 delay-100">
              <span className="px-10 py-3.5 border-2 border-brick-copper text-brick-copper text-[11px] uppercase tracking-[0.3em] bg-brick-copper/10 shadow-[0_0_40px_rgba(184,115,51,0.25)] drop-shadow-2xl font-black">Open Archive</span>
           </div>
        </div>
      )}
    </>
  );

  const getLinkContent = () => {
    if (isEditMode || isSpacer) return content;
    return (
      <Link to={`/listing/${item.id}`} className="block w-full h-full">
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

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative overflow-hidden group ${isSpacer ? 'bg-transparent' : 'bg-stone-900 border border-border-subtle'} hover:border-brick-copper/80 hover:shadow-[0_0_30px_rgba(184,115,51,0.15)] transition-all duration-500 rounded-sm ${
        !isGallery ? `${colSpanClasses[colSpan] || 'sm:col-span-1'} ${rowSpanClasses[rowSpan] || 'sm:row-span-1'}` : ''
      } ${isGallery ? 'aspect-[4/5]' : 'aspect-square md:aspect-auto'}`}
    >
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
                onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { panel: panel === 'main' ? 'side' : 'main' })}
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
                      onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { colSpan: Math.max(1, colSpan - 1) })}
                      className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[10px] rounded"
                    >
                      -
                    </button>
                    <span className="text-[10px] w-4 text-center font-mono">{colSpan}</span>
                    <button 
                      onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { colSpan: Math.min(4, colSpan + 1) })}
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
                      onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { rowSpan: Math.max(1, rowSpan - 1) })}
                      className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[10px] rounded"
                    >
                      -
                    </button>
                    <span className="text-[10px] w-4 text-center font-mono">{rowSpan}</span>
                    <button 
                      onClick={() => updateDoc(doc(db, 'portfolio_items', item.id), { rowSpan: Math.min(4, rowSpan + 1) })}
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
    </div>
  );
};

export const Portfolio = ({ variant = 'grid', panel = 'main' }: { variant?: 'grid' | 'gallery', panel?: 'main' | 'side' }) => {
  const { isEditMode, isAdmin, portfolioItems: rawItems } = useSiteContent();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [activeCategory, setActiveCategory] = useState('All');

  const items = useMemo(() => {
    return rawItems.filter(item => (item.panel || 'main') === panel);
  }, [rawItems, panel]);

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
    const cats = ['All', ...new Set(items.map(item => item.category))];
    return cats;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter(item => item.category === activeCategory);
  }, [items, activeCategory]);

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
      category: 'Detail',
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
      category: 'Detail', 
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
    await updateDoc(doc(db, 'portfolio_items', editingItem.id), {
      ...editFields,
      updatedAt: serverTimestamp()
    });
    setEditingItem(null);
  };

  const itemIds = useMemo(() => filteredItems.map(i => i.id), [filteredItems]);

  return (
    <div className="relative w-full">
      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap gap-4 items-center justify-between border-b border-border-subtle pb-6 px-4">
        <div className="flex gap-6 overflow-x-auto no-scrollbar py-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] uppercase tracking-[0.4em] transition-all whitespace-nowrap ${
                activeCategory === cat 
                  ? 'text-brick-copper font-black border-b-2 border-brick-copper pb-1' 
                  : 'text-text-primary/40 hover:text-text-primary'
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
                  
                  <FileUpload 
                    label="Cover Image"
                    path="portfolio"
                    onUploadComplete={(url) => setEditFields({...editFields, img: url})}
                  />

                  {editFields.img && (
                    <div className="aspect-[4/3] rounded border border-border-subtle overflow-hidden">
                      <img src={editFields.img} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                  )}
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
                        <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">External Link (Optional)</label>
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-2 text-sm outline-none focus:border-brick-copper transition-colors placeholder:text-white/10"
                          placeholder="https://example.com/listing"
                          value={editFields.url || ''}
                          onChange={e => setEditFields({...editFields, url: e.target.value})}
                        />
                      </div>
                    </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">Taxonomy & Technicals</label>
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-2 text-sm outline-none focus:border-brick-copper transition-colors placeholder:text-white/10"
                          placeholder="Category (e.g. Interior)"
                          value={editFields.category}
                          onChange={e => setEditFields({...editFields, category: e.target.value})}
                        />
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-2 text-sm outline-none focus:border-brick-copper transition-colors placeholder:text-white/10"
                          placeholder="Property Type"
                          value={editFields.propertyType || ''}
                          onChange={e => setEditFields({...editFields, propertyType: e.target.value})}
                        />
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
                        <input 
                          className="w-full bg-transparent border-b border-border-subtle p-1 text-xs outline-none focus:border-brick-copper"
                          value={editFields.status || ''}
                          onChange={e => setEditFields({...editFields, status: e.target.value})}
                        />
                      </div>
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
                      <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">Narrative</label>
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
            {filteredItems.map((item, index) => (
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

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div 
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={!isEditMode ? { x: 5 } : {}}
        className={`group relative border border-border-subtle p-5 transition-all bg-text-primary/[0.02] ${isEditMode ? 'hover:border-brick-copper/50' : 'hover:border-brick-copper'}`}
      >
        {editingId === tier.id ? (
          <div className="space-y-3">
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
            <div className="flex gap-3 pt-1">
              <button onClick={() => saveEdit(tier.id)} className="text-green-500 hover:text-green-400"><Check size={14} /></button>
              <button onClick={() => setEditingId(null)} className="text-text-primary/30 hover:text-text-primary"><X size={14} /></button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                {isEditMode && (
                  <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-text-primary/20 hover:text-brick-copper transition-colors">
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

            {isAdmin && isEditMode && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-3 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(tier)} className="text-text-primary/20 hover:text-brick-copper transition-colors"><Edit3 size={12} /></button>
                <button onClick={() => deleteTier(tier.id)} className="text-text-primary/20 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export const Services = ({ override }: { override?: { title: string, subtitle: string } }) => {
  const { services, settings, isAdmin, isEditMode } = useSiteContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ title: '', description: '', price: '' });

  const sensors = useSensors(
    useSensor(PointerSensor),
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
    setEditFields({ title: tier.title, description: tier.description, price: tier.price || '' });
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
              {displayServices.map((tier) => (
                <SortableServiceItem 
                  key={tier.id}
                  tier={tier}
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
