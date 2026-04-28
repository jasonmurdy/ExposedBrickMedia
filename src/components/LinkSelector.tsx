import React from 'react';
import { useSiteContent } from '../lib/SiteContentContext';
import { Link2, FileText, ExternalLink, Box } from 'lucide-react';

interface LinkSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  allowListing?: boolean;
}

export const LinkSelector: React.FC<LinkSelectorProps> = ({ value, onChange, label, allowListing = true }) => {
  const { pages } = useSiteContent();

  const isCustomPage = value.startsWith('/p/');
  const isListing = value === 'listing' || value.startsWith('/listing/');
  const isExternal = value.startsWith('http');
  const isNone = value === '';

  const getActiveType = () => {
    if (isListing) return 'listing';
    if (isCustomPage) return 'page';
    if (isExternal) return 'external';
    return 'none';
  };

  const activeType = getActiveType();

  return (
    <div className="space-y-2">
      {label && <label className="text-[9px] uppercase tracking-widest text-brick-copper mb-1 block font-bold">{label}</label>}
      
      <div className="flex gap-2 mb-3">
        {allowListing && (
          <button 
            onClick={() => onChange('listing')}
            className={`flex-1 py-2 px-3 rounded border text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeType === 'listing' ? 'bg-brick-copper text-charcoal border-brick-copper' : 'border-white/10 text-white/40 hover:border-white/30'}`}
          >
            <Box size={14} /> Listing
          </button>
        )}
        <button 
          onClick={() => onChange('/p/')}
          className={`flex-1 py-2 px-3 rounded border text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeType === 'page' ? 'bg-brick-copper text-charcoal border-brick-copper' : 'border-white/10 text-white/40 hover:border-white/30'}`}
        >
          <FileText size={14} /> Page
        </button>
        <button 
          onClick={() => onChange('https://')}
          className={`flex-1 py-2 px-3 rounded border text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeType === 'external' ? 'bg-brick-copper text-charcoal border-brick-copper' : 'border-white/10 text-white/40 hover:border-white/30'}`}
        >
          <ExternalLink size={14} /> URL
        </button>
      </div>

      {activeType === 'page' && (
        <select 
          className="w-full bg-charcoal border border-border-subtle p-2 text-xs outline-none focus:border-brick-copper transition-colors uppercase tracking-widest"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="/p/">Select a Page...</option>
          {pages.map(page => (
            <option key={page.id} value={`/p/${page.slug}`}>{page.title}</option>
          ))}
        </select>
      )}

      {activeType === 'external' && (
        <input 
          className="w-full bg-transparent border border-border-subtle p-2 text-sm outline-none focus:border-brick-copper transition-colors placeholder:text-white/10"
          placeholder="https://example.com"
          value={value === 'https://' ? '' : value}
          onChange={e => onChange(e.target.value)}
        />
      )}

      {activeType === 'listing' && allowListing && (
        <div className="p-3 bg-white/5 border border-white/5 rounded text-[10px] italic text-white/30">
          Links automatically to the internal detailed view. No configuration needed.
        </div>
      )}
    </div>
  );
};
