/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  const width = isFeatured && !isGallery ? 1000 : 600;
  const isUnsplash = item.img && item.img.includes('unsplash.com');
  const optimizedUrl = isUnsplash
    ? `${item.img.split('?')[0]}?auto=format&fit=crop&q=80&w=${width}`
    : item.img;

  const content = (
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
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 ${isGallery ? 'opacity-40 group-hover:opacity-60' : 'opacity-40 group-hover:opacity-0'}`} />
      
      {/* Info Overlay (Gallery Mode specific) */}
      {isGallery && (
        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <span className="text-[10px] uppercase tracking-[0.3em] text-brick-copper mb-2 block font-medium">{item.category}</span>
          <h3 className="text-lg font-display italic text-white tracking-tight">{item.title}</h3>
        </div>
      )}

      {/* Category Tag (Grid Mode) */}
      {!isGallery && (
        <div className="absolute bottom-4 left-4 z-10 transition-transform group-hover:-translate-y-1">
           <span className="text-[8px] uppercase tracking-widest bg-bg-primary/80 px-2 py-1 border border-border-subtle group-hover:border-brick-copper/50">
             {index + 1 < 10 ? `0${index + 1}` : index + 1} / {item.category}
           </span>
        </div>
      )}

      {/* Grid Hover State */}
      {!isGallery && !isEditMode && (
        <div className="absolute inset-0 bg-brick-copper/10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center pointer-events-none">
           <span className="text-[10px] uppercase tracking-[0.4em] font-medium text-white mb-3 shadow-xl">
             {item.url ? 'View Project' : 'View Journal'}
           </span>
           <h3 className="text-sm font-display italic text-white mb-2">{item.title}</h3>
           {item.description && (
             <p className="text-[9px] text-white/80 font-mono tracking-tighter leading-tight max-w-[200px] line-clamp-3">
               {item.description}
             </p>
           )}
        </div>
      )}
    </>
  );

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative overflow-hidden group bg-stone-900 border border-border-subtle hover:border-brick-copper/30 transition-all duration-500 rounded-sm ${
        !isGallery && isFeatured ? 'sm:col-span-2 sm:row-span-2' : ''
      } ${!isGallery && index === 3 ? 'sm:col-span-2' : ''} ${isGallery ? 'aspect-[4/5]' : 'aspect-square md:aspect-auto'}`}
    >
      {item.url && !isEditMode ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          {content}
        </a>
      ) : (
        content
      )}

      {/* Admin Controls */}
      {isEditMode && (
        <div className="absolute inset-0 bg-charcoal/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="flex gap-2">
            <div {...attributes} {...listeners} className="p-3 bg-brick-copper text-charcoal rounded cursor-grab active:cursor-grabbing hover:bg-white transition-colors">
              <GripVertical size={20} />
            </div>
            <button onClick={() => startEdit(item)} className="p-3 bg-charcoal text-brick-copper rounded border border-brick-copper hover:bg-brick-copper hover:text-charcoal transition-all">
              <Edit3 size={20} />
            </button>
            <button onClick={() => deleteItem(item.id)} className="p-3 bg-charcoal text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-white transition-all">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Portfolio = ({ variant = 'grid' }: { variant?: 'grid' | 'gallery' }) => {
  const { isEditMode, isAdmin } = useSiteContent();
  const [items, setItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [activeCategory, setActiveCategory] = useState('All');

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

  useEffect(() => {
    const q = query(collection(db, 'portfolio_items'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
    });
  }, []);

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
      url: '' 
    };
    setEditingItem(itemData);
    setEditFields({ ...itemData });
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
              className={`text-[10px] uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                activeCategory === cat 
                  ? 'text-brick-copper font-bold border-b border-brick-copper' 
                  : 'text-text-primary/40 hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {isAdmin && isEditMode && (
          <button 
            onClick={addItem}
            className="flex items-center gap-2 px-6 py-2 bg-brick-copper text-charcoal hover:bg-white transition-all uppercase text-[10px] tracking-widest font-bold shadow-xl rounded-sm"
          >
            <Plus size={14} /> Add Project
          </button>
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
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">Taxonomy</label>
                      <input 
                        className="w-full bg-transparent border-b border-border-subtle p-2 text-sm outline-none focus:border-brick-copper transition-colors placeholder:text-white/10"
                        placeholder="Category (e.g. Interior)"
                        value={editFields.category}
                        onChange={e => setEditFields({...editFields, category: e.target.value})}
                      />
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
        <div className={`w-full p-4 grid gap-4 md:gap-6 ${
          variant === 'gallery' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 auto-rows-[250px] md:auto-rows-[350px]'
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
              {tier.price && <span className="text-[8px] font-mono text-brick-copper/50 tracking-tighter">{tier.price}</span>}
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
