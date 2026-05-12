import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X, Image as ImageIcon, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';

interface ListingEditModalProps {
  listing: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ListingEditModal({ listing, isOpen, onClose }: ListingEditModalProps) {
  const [formData, setFormData] = useState({
    title: listing.title || '',
    description: listing.description || '',
    mlsNumber: listing.mlsNumber || '',
    listPrice: listing.listPrice || '',
    propertyType: listing.propertyType || '',
    beds: listing.beds || '',
    baths: listing.baths || '',
    sqft: listing.sqft || '',
    status: listing.status || 'Active',
    gallery: listing.gallery || []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'portfolio_items', listing.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `portfolio_items/${listing.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const addImage = () => {
    if (!newImageUrl) return;
    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, newImageUrl]
    }));
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_: any, i: number) => i !== index)
    }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-bg-primary border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div>
              <h2 className="font-display text-2xl italic text-white flex items-center gap-3">
                Manage Listing <span className="text-brick-copper text-sm font-mono not-italic opacity-50 uppercase tracking-widest">#{listing.id.slice(0, 8)}</span>
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={24} className="text-white/40" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Listing Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-brick-copper outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-brick-copper outline-none transition-colors appearance-none"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Sold">Sold</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Narrative Description</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-brick-copper outline-none transition-colors resize-none"
              />
            </div>

            {/* Property Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'MLS#', key: 'mlsNumber' },
                { label: 'List Price', key: 'listPrice' },
                { label: 'Beds', key: 'beds' },
                { label: 'Baths', key: 'baths' },
                { label: 'SqFt', key: 'sqft' },
                { label: 'Property Type', key: 'propertyType' },
              ].map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">{field.label}</label>
                  <input 
                    type="text" 
                    value={(formData as any)[field.key]}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:border-brick-copper outline-none transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Gallery Manager */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-brick-copper font-black">Asset Gallery</h3>
                <span className="text-[10px] text-white/20 font-mono">{formData.gallery.length} Images</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {formData.gallery.map((url: string, index: number) => (
                  <div key={index} className="group relative aspect-square bg-white/5 border border-white/10 overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    <button 
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-900/80 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                
                <div className="aspect-square border border-dashed border-white/10 flex flex-col items-center justify-center p-4 group hover:border-brick-copper/50 transition-colors">
                  <ImageIcon size={24} className="text-white/10 mb-2 group-hover:text-brick-copper/50 transition-colors" />
                  <p className="text-[8px] text-center text-white/20 uppercase tracking-widest">Add Archive Image</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Paste External Image URL or Archive Hash..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:border-brick-copper outline-none transition-colors font-mono"
                />
                <button 
                  onClick={addImage}
                  disabled={!newImageUrl}
                  className="px-6 bg-white/5 border border-white/10 text-white hover:bg-brick-copper hover:text-charcoal hover:border-brick-copper transition-all disabled:opacity-20 flex items-center justify-center"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 flex justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-3 text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Discard Changes
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-10 py-3 bg-brick-copper text-charcoal text-[10px] uppercase font-black tracking-widest hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Commit Snapshot
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
