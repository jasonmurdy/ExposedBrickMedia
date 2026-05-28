import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Megaphone, Check, Loader2, Mail } from 'lucide-react';
import { useSiteContent } from '../lib/SiteContentContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const GlobalPopupHost: React.FC = () => {
  const { popups } = useSiteContent();
  const [activePopup, setActivePopup] = useState<any | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Suppress auto-triggering if already shown in this session
  const getDismissedPopups = (): string[] => {
    try {
      const dismissed = sessionStorage.getItem('dismissed-popups');
      return dismissed ? JSON.parse(dismissed) : [];
    } catch {
      return [];
    }
  };

  const markPopupAsShown = (id: string) => {
    try {
      const dismissed = getDismissedPopups();
      if (!dismissed.includes(id)) {
        sessionStorage.setItem('dismissed-popups', JSON.stringify([...dismissed, id]));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!popups || popups.length === 0) return;

    const dismissed = getDismissedPopups();
    
    // Find active popups to auto-trigger
    const autoPopups = popups.filter(p => p.isActive && p.trigger !== 'onclick_only' && !dismissed.includes(p.id));

    // 1. Trigger "on_load" popups
    const onLoadPopup = autoPopups.find(p => p.trigger === 'on_load');
    if (onLoadPopup) {
      const timer = setTimeout(() => {
        setActivePopup(onLoadPopup);
        markPopupAsShown(onLoadPopup.id);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // 2. Trigger "time_delay" popups
    const delayPopup = autoPopups.find(p => p.trigger === 'time_delay');
    if (delayPopup) {
      const secs = delayPopup.delaySeconds || 5;
      const timer = setTimeout(() => {
        setActivePopup(delayPopup);
        markPopupAsShown(delayPopup.id);
      }, secs * 1000);
      return () => clearTimeout(timer);
    }

    // 3. Trigger "exit_intent" popups
    const exitPopup = autoPopups.find(p => p.trigger === 'exit_intent');
    if (exitPopup) {
      const handleMouseLeave = (e: MouseEvent) => {
        // Did the pointer leave the top of screen? (classic exit intent trigger)
        if (e.clientY < 20) {
          const currentDismissed = getDismissedPopups();
          if (!currentDismissed.includes(exitPopup.id)) {
            setActivePopup(exitPopup);
            markPopupAsShown(exitPopup.id);
            document.removeEventListener('mouseleave', handleMouseLeave);
          }
        }
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [popups]);

  // Listen to custom dispatch events for onclick manual popup trigger
  useEffect(() => {
    const handleManualTrigger = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.popupId) {
        const found = popups.find(p => p.id === detail.popupId);
        if (found) {
          setIsSuccess(false);
          setEmailInput('');
          setNameInput('');
          setActivePopup(found);
        } else {
          console.warn(`Popup with specified ID '${detail.popupId}' not found in active database.`);
        }
      }
    };

    window.addEventListener('trigger-global-popup', handleManualTrigger);
    return () => {
      window.removeEventListener('trigger-global-popup', handleManualTrigger);
    };
  }, [popups]);

  const handleClose = () => {
    setActivePopup(null);
    setIsSuccess(false);
    setEmailInput('');
    setNameInput('');
  };

  const handleLeadGenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/crm/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: `Popup Lead Capture: ${activePopup?.title || activePopup?.headline}`,
          realtorName: nameInput || 'Subscribed Lead',
          email: emailInput,
          serviceType: activePopup?.type?.toUpperCase() || 'LEAD_GEN'
        })
      });

      if (!response.ok) {
        throw new Error("Popup submission failed on backend CRM");
      }

      setIsSuccess(true);
      setEmailInput('');
      setNameInput('');
    } catch (err) {
      console.error("Lead submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activePopup) return null;

  return (
    <AnimatePresence>
      <div 
        id="global-popup-overlay"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-charcoal/85 backdrop-blur-md"
        onClick={(e) => {
          if ((e.target as HTMLElement).id === 'global-popup-overlay') {
            handleClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-charcoal border border-brick-copper/30 max-w-lg w-full overflow-hidden shadow-3xl flex flex-col"
        >
          {/* Top Banner Image (if provided) */}
          {activePopup.imageUrl && (
            <div className="relative h-48 w-full border-b border-white/5">
              <img src={activePopup.imageUrl} className="w-full h-full object-cover" alt="Banner" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal to-transparent opacity-80" />
            </div>
          )}

          {/* Close trigger button */}
          <button 
            type="button"
            onClick={handleClose} 
            className="absolute top-4 right-4 p-2 bg-charcoal/40 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all rounded-none z-10"
          >
            <X size={16} />
          </button>

          {/* Core Info Layout inside */}
          <div className="p-8 md:p-10 flex flex-col space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-brick-copper font-sans">
                {activePopup.type === 'promotion' ? (
                  <>
                    <Megaphone size={12} />
                    <span>Exclusive Promotion</span>
                  </>
                ) : activePopup.type === 'lead-gen' ? (
                  <>
                    <Mail size={12} />
                    <span>Special Access Inquiry</span>
                  </>
                ) : (
                  <>
                    <Bell size={12} />
                    <span>Exposed Brick News</span>
                  </>
                )}
              </div>
              <h3 className="font-display text-3xl italic tracking-tight text-white leading-tight">
                {activePopup.headline}
              </h3>
            </div>

            <div className="text-white/70 text-sm leading-relaxed whitespace-pre-line font-light">
              {activePopup.content}
            </div>

            {/* Custom Interactive Elements based on Popup type */}
            {activePopup.type === 'lead-gen' && (
              <div className="border-t border-white/5 pt-6 mt-2">
                {isSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-brick-copper/10 border border-brick-copper/30 p-6 text-center text-brick-copper flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="p-2 bg-brick-copper rounded-full text-charcoal">
                      <Check size={18} />
                    </div>
                    <h5 className="font-sans font-bold text-xs uppercase tracking-widest mt-2">Access Granted</h5>
                    <p className="text-xs text-white/60">Our media specialists will reach out shortly with instructions.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleLeadGenSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[8px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1.5 label-required">Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Your name..."
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 outline-none p-3 text-xs text-white focus:border-brick-copper focus:bg-white/[0.08] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1.5 label-required">Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="you@domain.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 outline-none p-3 text-xs text-white focus:border-brick-copper focus:bg-white/[0.08] transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-brick-copper text-charcoal text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-white transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>{activePopup.ctaText || 'Claim Instant Access'}</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {activePopup.type !== 'lead-gen' && activePopup.ctaText && activePopup.ctaLink && (
              <div className="border-t border-white/5 pt-6 mt-2 flex justify-end">
                <button
                  onClick={() => {
                    handleClose();
                    const link = activePopup.ctaLink;
                    if (typeof link === 'string') {
                      if (link.startsWith('http')) {
                        window.open(link, '_blank', 'noopener,noreferrer');
                      } else if (link.startsWith('/p/')) {
                        window.location.href = link;
                      } else if (link.startsWith('popup:')) {
                        const targetPopup = link.replace('popup:', '');
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('trigger-global-popup', { detail: { popupId: targetPopup } }));
                        }, 200);
                      } else if (link === 'listing') {
                        window.location.href = '/listing';
                      } else {
                        window.location.href = link;
                      }
                    } else if (link && typeof link === 'object') {
                      if (link.type === 'internal') {
                        window.location.href = link.url === '/' ? '/' : `/p/${link.url}`;
                      } else if (link.type === 'external' && link.url) {
                        window.open(link.url, '_blank', 'noopener,noreferrer');
                      } else if (link.type === 'popup' && link.url) {
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('trigger-global-popup', { detail: { popupId: link.url } }));
                        }, 200);
                      }
                    }
                  }}
                  className="px-6 py-3 bg-brick-copper text-charcoal hover:bg-white text-[10px] uppercase tracking-[0.2em] font-bold transition-all"
                >
                  {activePopup.ctaText}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
