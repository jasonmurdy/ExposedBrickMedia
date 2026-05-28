import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export const TestimonialCarousel = ({ maxItems = 5 }: { maxItems?: number }) => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const fetchTestimonials = async () => {
      try {
        const res = await fetch("/api/testimonials");
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setTestimonials(data.slice(0, maxItems));
          }
        } else {
          throw new Error("Aggregator endpoint failed");
        }
      } catch (err) {
        if (!active) return;
        console.warn("[TestimonialCarousel] Unified API fetch failed, falling back to direct Firestore subscribe:", err);
        
        const q = query(collection(db, 'testimonials'), orderBy('order', 'asc'), limit(maxItems));
        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            if (active) {
              setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
          },
          (firestoreErr) => {
            console.warn("[TestimonialCarousel] Direct Firestore subscription also failed (Sandbox rules):", firestoreErr.message);
          }
        );
      }
    };

    fetchTestimonials();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [maxItems]);

  if (testimonials.length === 0) return null;

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="relative w-full max-w-4xl mx-auto py-16 overflow-hidden">
      <div className="flex items-center justify-center mb-8 text-brick-copper opacity-50">
        <Quote size={32} />
      </div>
      
      <div className="relative h-64 md:h-48 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-12"
          >
            <p className="font-display italic text-2xl md:text-3xl text-white mb-8 leading-tight">
              "{testimonials[currentIndex]?.quote}"
            </p>
            <div className="flex items-center gap-4">
              <img src={testimonials[currentIndex]?.headshotUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" loading="lazy" decoding="async" />
              <div className="text-left">
                <h4 className="text-xs uppercase tracking-widest text-brick-copper font-bold flex items-center gap-2 flex-wrap">
                  <span>{testimonials[currentIndex]?.name}</span>
                  {testimonials[currentIndex]?.source === 'google' && (
                    <span className="inline-flex items-center text-[7px] bg-[rgba(234,179,8,0.15)] border border-yellow-500/30 text-yellow-500 font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                      ★ Google Review
                    </span>
                  )}
                </h4>
                <p className="text-[9px] uppercase tracking-widest text-white/40">{testimonials[currentIndex]?.brokerage}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {testimonials.length > 1 && (
        <div className="flex justify-center gap-8 mt-12">
          <button onClick={handlePrev} className="p-3 border border-white/10 text-white/40 hover:text-charcoal hover:bg-brick-copper hover:border-brick-copper transition-all duration-300 hover:-translate-y-0.5 active:scale-90 rounded-full">
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-2 items-center">
            {testimonials.map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 transition-all duration-300 rounded-full ${idx === currentIndex ? 'bg-brick-copper scale-150' : 'bg-white/20'}`} />
            ))}
          </div>
          <button onClick={handleNext} className="p-3 border border-white/10 text-white/40 hover:text-charcoal hover:bg-brick-copper hover:border-brick-copper transition-all duration-300 hover:-translate-y-0.5 active:scale-90 rounded-full">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
