/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, Sun, Moon, X, Check, Edit3, MoveUpRight } from 'lucide-react';
import { useSiteContent } from '../lib/SiteContentContext';
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const BrandHeader = ({ theme, override }: { theme?: 'light' | 'dark', override?: { title1: string, title2: string, accent: string, tagline: string } }) => {
  const { settings, isEditMode, isAdmin } = useSiteContent();
  const currentTheme = theme || 'dark';
  const logoUrl = currentTheme === 'light' ? settings.logoLight : settings.logoDark;
  const alignment = settings.heroAlignment || 'left';
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const displayTitle1 = override?.title1 || settings.heroTitlePart1 || "Luxury";
  const displayTitle2 = override?.title2 || settings.heroTitlePart2 || "Architecture";
  const displayAccent = override?.accent || settings.heroTitleAccent || "Studios";
  const displayTagline = override?.tagline || settings.tagline || "Defined by Light";

  const saveSetting = async (field: string, value: string) => {
    try {
      await updateDoc(doc(db, 'settings', 'site'), {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      setEditingField(null);
    } catch (error) {
      console.error("Error updating setting:", error);
    }
  };

  const EditableText = ({ field, value, className, multiline = false }: { field: string, value: string, className: string, multiline?: boolean }) => {
    const isEditing = editingField === field && isEditMode;
    
    if (isEditing) {
      return (
        <span className="relative group/edit">
          {multiline ? (
            <textarea
              className={`${className} bg-transparent border-b border-brick-copper outline-none resize-none w-full`}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              autoFocus
              onBlur={() => saveSetting(field, tempValue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  saveSetting(field, tempValue);
                }
              }}
            />
          ) : (
            <input
              type="text"
              className={`${className} bg-transparent border-b border-brick-copper outline-none w-full`}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              autoFocus
              onBlur={() => saveSetting(field, tempValue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveSetting(field, tempValue);
              }}
            />
          )}
          <span className="absolute top-0 -right-8 flex gap-1">
             <button onClick={() => saveSetting(field, tempValue)} className="text-green-500"><Check size={14} /></button>
          </span>
        </span>
      );
    }

    return (
      <span 
        className={`${className} relative ${isEditMode ? 'cursor-pointer hover:ring-1 hover:ring-brick-copper/30 rounded px-1 transition-all' : ''}`}
        onClick={() => {
          if (isEditMode) {
            setEditingField(field);
            setTempValue(value || '');
          }
        }}
      >
        {value}
        {isEditMode && <Edit3 size={10} className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 text-brick-copper" />}
      </span>
    );
  };
  
  return (
    <div className={`mb-12 ${alignment === 'center' ? 'text-center flex flex-col items-center' : ''}`}>
      <Link to="/" onClick={(e) => isEditMode && e.preventDefault()}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
          className="mb-4 pt-16 md:pt-20"
        >
          {logoUrl ? (
            <div className={`w-full max-w-[16rem] md:max-w-xs flex items-center group relative ${isEditMode ? 'hover:ring-2 hover:ring-brick-copper transition-all p-4' : ''}`}>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={settings.brandName || "Logo"} 
                  className="w-full h-auto object-contain transition-all hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              {isEditMode && (
                <div className="absolute inset-0 bg-charcoal/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white bg-brick-copper px-3 py-1 uppercase tracking-widest font-bold">Change Logo in Admin</span>
                </div>
              )}
            </div>
          ) : (
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-display leading-[1.1]"
            >
              <EditableText field="heroTitlePart1" value={displayTitle1} className="inline" />
              <br />
              <EditableText field="heroTitlePart2" value={displayTitle2} className="inline" />
              <br />
              <span className="text-brick-copper">
                <EditableText field="heroTitleAccent" value={displayAccent} className="inline" />
              </span>
            </motion.h1>
          )}
        </motion.div>
      </Link>
      
      {!logoUrl && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[10px] uppercase tracking-[0.4em] text-text-primary/40 mt-8"
        >
          <EditableText field="tagline" value={displayTagline} className="inline-block" />
        </motion.p>
      )}
    </div>
  );
};

export const Navbar = ({ theme, onThemeToggle }: { theme: 'light' | 'dark', onThemeToggle: () => void }) => {
  const { pages, settings, isEditMode } = useSiteContent();
  const location = useLocation();

  const navItems = settings.navigationItems || [];
  const logoUrl = theme === 'light' ? settings.logoLight : settings.logoDark;

  const saveBrandName = async (val: string) => {
    await updateDoc(doc(db, 'settings', 'site'), {
      brandName: val,
      updatedAt: serverTimestamp()
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-12 py-8 hidden lg:flex justify-between items-center bg-bg-primary/50 backdrop-blur-sm">
      <Link to="/" className="group flex items-center italic">
        <span className="font-display text-2xl text-text-primary outline-none focus:ring-1 focus:ring-brick-copper/50 rounded px-1"
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => saveBrandName(e.currentTarget.textContent || 'The Exposed Brick')}
        >
          The Exposed <span className="text-brick-copper" contentEditable={false}>Brick</span>
        </span>
      </Link>

      <div className="flex items-center gap-10">
        <button 
          onClick={onThemeToggle}
          className="text-text-primary/40 hover:text-brick-copper transition-colors p-2"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        {/* Dynamic Pages in Nav */}
        {pages.filter(p => p.showInNav).map(page => (
          <Link 
            key={page.id}
            to={`/p/${page.slug}`}
            className={`transition-colors uppercase text-[10px] tracking-widest font-medium ${
              location.pathname === `/p/${page.slug}` ? 'text-brick-copper' : 'text-text-primary/40 hover:text-brick-copper'
            }`}
          >
            {page.title}
          </Link>
        ))}

        {/* Custom Navigation Items */}
        {navItems.sort((a,b) => a.order - b.order).map(item => (
          <a 
            key={item.id}
            href={item.url}
            target={item.url.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="transition-colors uppercase text-[10px] tracking-widest font-medium text-text-primary/40 hover:text-brick-copper"
          >
            {item.label}
          </a>
        ))}

        <Link 
          to="/"
          className={`transition-colors uppercase text-[10px] tracking-widest font-medium ${
            location.pathname === '/' ? 'text-brick-copper' : 'text-text-primary/40 hover:text-brick-copper'
          }`}
        >
          Portfolio
        </Link>
        
        <button 
          onClick={() => {
            const el = document.getElementById('inquire');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-6 py-2 bg-brick-copper text-charcoal transition-all duration-300 hover:bg-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0 uppercase text-[10px] tracking-widest font-bold shadow-sm hover:shadow-md"
        >
          Inquire
        </button>
      </div>
    </nav>
  );
};

export const MobileNavbar = ({ theme, onThemeToggle }: { theme: 'light' | 'dark', onThemeToggle: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { pages, settings } = useSiteContent();
  const location = useLocation();
  const alignment = settings.heroAlignment || 'left';

  const navItems = settings.navigationItems || [];
  const logoUrl = theme === 'light' ? settings.logoLight : settings.logoDark;

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="lg:hidden">
      <div className="fixed top-0 left-0 right-0 z-[60] bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle p-6 flex justify-between items-center transition-colors">
        <Link to="/" onClick={closeMenu} className="group italic">
          <span className="font-display text-xl text-text-primary whitespace-nowrap">
            The Exposed <span className="text-brick-copper">Brick</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <button onClick={onThemeToggle} className="text-text-primary/40 p-2">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="text-text-primary/60 p-2">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[55] bg-bg-primary pt-24 px-8 overflow-y-auto"
          >
            <div className="flex flex-col gap-8 py-12">
              <Link to="/" onClick={closeMenu} className={`text-2xl font-display italic ${location.pathname === '/' ? 'text-brick-copper' : 'text-text-primary/60'}`}>Portfolio</Link>
              
              {pages.filter(p => p.showInNav).map(page => (
                <Link 
                  key={page.id} 
                  to={`/p/${page.slug}`} 
                  onClick={closeMenu}
                  className={`text-2xl font-display italic ${location.pathname === `/p/${page.slug}` ? 'text-brick-copper' : 'text-text-primary/60'}`}
                >
                  {page.title}
                </Link>
              ))}

              {navItems.sort((a,b) => a.order - b.order).map(item => (
                <a 
                  key={item.id} 
                  href={item.url} 
                  className="text-2xl font-display italic text-text-primary/60"
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              ))}
              
              <button 
                onClick={() => {
                  closeMenu();
                  const el = document.getElementById('inquire');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-left text-2xl font-display italic text-brick-copper mt-8"
              >
                Inquire
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simplified Hero visual for the right-hand panel
export const HeroVisual = ({ 
  imageUrl, 
  showCta, 
  ctaLabel, 
  ctaLinkType, 
  ctaInternalPage, 
  ctaExternalUrl 
}: { 
  imageUrl?: string, 
  showCta?: boolean, 
  ctaLabel?: string, 
  ctaLinkType?: "internal" | "external", 
  ctaInternalPage?: string, 
  ctaExternalUrl?: string 
}) => {
  const { settings, isEditMode } = useSiteContent();
  const [isEditing, setIsEditing] = useState(false);
  const [imgUrl, setImgUrl] = useState(settings.heroImage || '');

  const saveImage = async () => {
    await updateDoc(doc(db, 'settings', 'site'), {
      heroImage: imgUrl,
      updatedAt: serverTimestamp()
    });
    setIsEditing(false);
  };

  const displayImage = imageUrl || settings.heroImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200";
  
  const href = ctaLinkType === 'internal' ? ctaInternalPage : ctaExternalUrl;
  
  return (
    <div className="relative h-80 sm:h-[60vh] lg:h-[50%] w-full overflow-hidden border-b border-border-subtle group">
       <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src={displayImage} 
          alt="Luxury Architecture"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-8 left-8 right-8 flex flex-wrap justify-between items-end gap-4">
          <div>
            <span className="text-[9px] uppercase tracking-[0.3em] bg-bg-primary/80 px-3 py-1 border border-border-subtle">01 / Site Identity</span>
            <h2 className="font-display text-2xl mt-3 text-text-primary/90 italic">{settings.brandName}</h2>
          </div>
          
          {showCta && href && (
            <div className="bg-bg-primary/50 backdrop-blur-sm p-3 border border-border-subtle">
              {ctaLinkType === 'external' ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-brick-copper text-charcoal font-bold uppercase tracking-widest text-[10px] inline-flex items-center gap-2 transition-all duration-300 hover:bg-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0 shadow-sm hover:shadow-md">
                  {ctaLabel} <MoveUpRight size={12} />
                </a>
              ) : (
                <Link to={href} className="px-6 py-3 bg-brick-copper text-charcoal font-bold uppercase tracking-widest text-[10px] inline-block transition-all duration-300 hover:bg-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0 shadow-sm hover:shadow-md">
                  {ctaLabel}
                </Link>
              )}
            </div>
          )}
        </div>

        {isEditMode && (
          <div className="absolute inset-0 bg-charcoal/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            {isEditing ? (
              <div className="bg-bg-primary p-6 border border-brick-copper shadow-2xl w-full max-w-sm space-y-4">
                 <label className="text-[10px] uppercase tracking-widest block opacity-50">Hero Image URL (Unsplash)</label>
                 <input 
                   className="w-full bg-transparent border-b border-brick-copper p-2 text-xs outline-none"
                   value={imgUrl}
                   onChange={e => setImgUrl(e.target.value)}
                   autoFocus
                 />
                 <div className="flex gap-2">
                   <button onClick={saveImage} className="flex-grow py-2 bg-brick-copper text-charcoal text-[10px] uppercase tracking-widest font-bold">Save</button>
                   <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-border-subtle text-[10px] uppercase tracking-widest font-bold">Cancel</button>
                 </div>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setImgUrl(settings.heroImage || '');
                  setIsEditing(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-brick-copper text-charcoal hover:bg-white transition-all uppercase text-[10px] tracking-widest font-bold shadow-xl"
              >
                <Edit3 size={16} /> Change Hero Image
              </button>
            )}
          </div>
        )}
    </div>
  );
};
