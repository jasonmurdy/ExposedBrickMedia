/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, Twitter, Linkedin, Facebook, Mail, Phone, MapPin, Edit3, Check } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSiteContent } from '../lib/SiteContentContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook
};

export const BookingForm = ({ override }: { override?: { title: string } }) => {
  const { isEditMode, settings } = useSiteContent();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    propertyAddress: '',
    realtorName: '',
    email: '',
    serviceType: 'Photography'
  });

  const saveInquiryTitle = async (val: string) => {
    try {
      await updateDoc(doc(db, 'settings', 'site'), {
        inquiryTitle: val,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/site');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const path = 'inquiries';
    try {
      await addDoc(collection(db, path), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div id="inquire" className="w-full pb-12 lg:pb-0 flex flex-col items-center justify-center text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
           <h3 className="font-display text-4xl mb-4 text-brick-copper italic">Received</h3>
           <p className="text-text-primary/60 text-sm">Your vision has been transmitted. Expect a response shortly.</p>
           <button onClick={() => setSubmitted(false)} className="mt-8 text-[10px] uppercase underline tracking-widest opacity-40 hover:opacity-100 italic transition-all">New Inquiry</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="inquire" className="w-full pb-12 lg:pb-0">
      <h3 className={`text-[10px] uppercase tracking-[0.3em] text-brick-copper mb-8 outline-none ${isEditMode ? 'focus:ring-1 focus:ring-brick-copper/50 rounded px-1' : ''}`}
        contentEditable={isEditMode}
        suppressContentEditableWarning
        onBlur={(e) => saveInquiryTitle(e.currentTarget.textContent || 'Inquiry')}
      >
        {override?.title || settings.inquiryTitle || 'Inquiry'}
      </h3>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="border-b border-border-subtle pb-2">
          <label className="block text-[9px] uppercase tracking-widest text-text-primary/30 mb-1">Property Address</label>
          <input 
            required
            type="text" 
            placeholder="Property Address or Location" 
            className="bg-transparent w-full outline-none text-xs py-1 placeholder:text-text-primary/10 border-none p-0 focus:ring-0"
            value={formData.propertyAddress}
            onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
          />
        </div>
        <div className="border-b border-border-subtle pb-2">
          <label className="block text-[9px] uppercase tracking-widest text-text-primary/30 mb-1">Your Name</label>
          <input 
            required
            type="text" 
            placeholder="Your Name / Agency" 
            className="bg-transparent w-full outline-none text-xs py-1 placeholder:text-text-primary/10 border-none p-0 focus:ring-0"
            value={formData.realtorName}
            onChange={e => setFormData({ ...formData, realtorName: e.target.value })}
          />
        </div>
        <div className="border-b border-border-subtle pb-2">
          <label className="block text-[9px] uppercase tracking-widest text-text-primary/30 mb-1">Email Coordinates</label>
          <input 
            required
            type="email" 
            placeholder="your@email.com" 
            className="bg-transparent w-full outline-none text-xs py-1 placeholder:text-text-primary/10 border-none p-0 focus:ring-0"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="flex pt-4">
           <button 
             disabled={loading}
             className="flex-1 bg-brick-copper/90 text-bg-primary font-semibold text-[10px] uppercase tracking-widest py-4 transition-all duration-300 hover:bg-white hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-brick-copper/90"
           >
             {loading ? 'Transmitting...' : 'Request Quote'}
           </button>
        </div>
      </form>
    </div>
  );
};

export const FooterContent = ({ override }: { override?: { quote: string } }) => {
  const { settings, isEditMode } = useSiteContent();

  const saveFooterQuote = async (val: string) => {
    try {
      await updateDoc(doc(db, 'settings', 'site'), {
        footerQuote: val,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/site');
    }
  };
  
  return (
    <div className="w-full flex flex-col pt-12 lg:pt-0 pb-12 lg:pb-0 px-4 md:px-8">
      <div className="space-y-6">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className={`font-display text-2xl lg:text-3xl leading-snug italic text-text-primary/70 font-light outline-none ${isEditMode ? 'focus:ring-1 focus:ring-brick-copper/50 rounded px-1' : ''}`}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => saveFooterQuote(e.currentTarget.textContent || '')}
        >
          &ldquo;{override?.quote || settings.footerQuote}&rdquo;
        </motion.p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-12 border-t border-border-subtle/30">
          <div className="space-y-6">
            <h4 className="text-[9px] uppercase tracking-[0.4em] text-brick-copper font-bold">Contact Coordinates</h4>
            <div className="flex flex-col gap-4">
              {settings.contactInfo?.email && (
                <motion.a 
                  href={`mailto:${settings.contactInfo.email}`}
                  whileHover={{ x: 4 }}
                  className="group flex items-center gap-3 text-[11px] text-text-primary/50 hover:text-text-primary transition-colors w-fit"
                >
                  <span className="p-2 bg-text-primary/5 rounded-full group-hover:bg-brick-copper/10 group-hover:text-brick-copper transition-colors">
                    <Mail size={14} />
                  </span>
                  <span className="tracking-wide">{settings.contactInfo.email}</span>
                </motion.a>
              )}
              {settings.contactInfo?.phone && (
                <motion.a 
                  href={`tel:${settings.contactInfo.phone.replace(/[^0-9]/g, '')}`}
                  whileHover={{ x: 4 }}
                  className="group flex items-center gap-3 text-[11px] text-text-primary/50 hover:text-text-primary transition-colors w-fit"
                >
                  <span className="p-2 bg-text-primary/5 rounded-full group-hover:bg-brick-copper/10 group-hover:text-brick-copper transition-colors">
                    <Phone size={14} />
                  </span>
                  <span className="tracking-wide">{settings.contactInfo.phone}</span>
                </motion.a>
              )}
              {settings.contactInfo?.address && (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="group flex items-start gap-3 text-[11px] text-text-primary/50 w-fit"
                >
                  <span className="p-2 bg-text-primary/5 rounded-full">
                    <MapPin size={14} />
                  </span>
                  <span className="tracking-wide max-w-[200px] leading-relaxed italic">{settings.contactInfo.address}</span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:pl-12 border-l border-border-subtle/20">
            <h4 className="text-[9px] uppercase tracking-[0.4em] text-brick-copper font-bold">Digital Nodes</h4>
            <div className="flex flex-wrap gap-3">
              {(settings.socialLinks || [])
                .filter(link => link.url && link.url.trim() !== '')
                .map(link => {
                  const Icon = platformIcons[link.platform];
                  if (!Icon) return null;
                  return (
                    <motion.a 
                      key={link.id} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      whileHover={{ y: -4, scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 bg-text-primary/5 rounded-xl text-text-primary/40 hover:text-brick-copper hover:bg-brick-copper/5 transition-all shadow-sm hover:shadow-md"
                      title={link.platform}
                    >
                      <Icon size={20} />
                    </motion.a>
                  );
                })}
            </div>
            <p className="text-[9px] text-text-primary/30 italic max-w-[180px] leading-relaxed">
              Connect with us across platforms for the latest property showcases and technical insights.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-auto flex flex-col sm:flex-row justify-between items-end gap-6 pt-12">
        <div className="text-[10px] text-text-primary/30 space-y-3 tracking-widest uppercase text-left w-full sm:w-auto">
          {settings.logoDark && (
            <img 
              src={settings.logoDark} 
              alt="Brand Logo" 
              className="h-10 w-auto object-contain opacity-20 grayscale brightness-200" 
            />
          )}
          <div>
            <p>#exposedbrick_media</p>
            <p>#definedbylight</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
           <div className="text-[10px] tracking-tighter text-text-primary/40">© {new Date().getFullYear()} {settings.brandName}</div>
           <div className="text-[9px] text-brick-copper uppercase tracking-[0.2em] font-medium">{settings.tagline}</div>
        </div>
      </div>
    </div>
  );
};
