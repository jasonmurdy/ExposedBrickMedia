/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export const LogoCloud = ({ logos = [] }: { logos: { url: string, alt: string, link?: string }[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewCount, setViewCount] = useState(5);
  const items = logos || [];
  const isEmpty = items.length === 0;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setViewCount(2);
      else if (window.innerWidth < 1024) setViewCount(3);
      else setViewCount(5);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  // Auto-rotate if more than viewCount
  useEffect(() => {
    if (isEmpty || items.length <= viewCount) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [items.length, isEmpty, viewCount]);

  return (
    <div className="w-full py-12 border-y border-white/5 bg-charcoal/30 backdrop-blur-sm relative group overflow-hidden">
      <div className="max-w-7xl mx-auto px-12 lg:px-24">
        <p className="text-center text-[8px] uppercase tracking-[0.5em] text-white/30 mb-8 font-bold">Trusted Industry Collaborators</p>
        
        {isEmpty ? (
          <div className="flex justify-center items-center h-24 opacity-20 italic text-[10px] uppercase tracking-widest text-white border border-dashed border-white/10">
            Brand identifiers manifest here.
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-center -mx-4 overflow-hidden">
              <div className="flex transition-all duration-700 ease-in-out gap-4 md:gap-12">
                <AnimatePresence mode="popLayout" initial={false}>
                  {Array.from({ length: Math.min(items.length, viewCount) }).map((_, i) => {
                    const idx = (currentIndex + i) % items.length;
                    const item = items[idx];
                    if (!item?.url) return null;

                    const logoContent = (
                      <motion.div
                        key={`${item.url}-${idx}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.4 }}
                        className="w-24 sm:w-32 md:w-44 h-12 md:h-16 flex items-center justify-center flex-shrink-0 group/logo relative grayscale hover:grayscale-0 transition-all duration-500"
                      >
                        <div className="w-full h-full p-2 md:p-4 flex items-center justify-center">
                          <img 
                            src={item.url} 
                            alt={item.alt || `Logo ${idx}`} 
                            className="max-h-full max-w-full object-contain opacity-40 group-hover/logo:opacity-100 transition-all duration-500" 
                          />
                        </div>
                        {item.link && (
                          <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/logo:opacity-100 transition-opacity">
                            <ExternalLink size={10} className="text-brick-copper" />
                          </div>
                        )}
                      </motion.div>
                    );

                    return item.link ? (
                      <a 
                        key={`link-${item.url}-${idx}`} 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        {logoContent}
                      </a>
                    ) : logoContent;
                  })}
                </AnimatePresence>
              </div>
            </div>

            {items.length > viewCount && (
              <>
                <button 
                  onClick={handlePrevious}
                  className="absolute left-0 lg:left-[-40px] top-1/2 -translate-y-1/2 z-20 p-2 text-white/20 hover:text-brick-copper transition-colors bg-charcoal/80 lg:bg-transparent rounded-full shadow-lg lg:shadow-none"
                  aria-label="Previous logo"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={handleNext}
                  className="absolute right-0 lg:right-[-40px] top-1/2 -translate-y-1/2 z-20 p-2 text-white/20 hover:text-brick-copper transition-colors bg-charcoal/80 lg:bg-transparent rounded-full shadow-lg lg:shadow-none"
                  aria-label="Next logo"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Define the shape of Behold's API response
interface BeholdPost {
  id: string;
  mediaUrl: string;
  permalink: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  thumbnailUrl?: string;
}

export const InstagramFeed = ({ username = 'exposedbrickmedia' }: { username?: string }) => {
  const [posts, setPosts] = useState<BeholdPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSocialFeed = async () => {
      try {
        const url = import.meta.env.VITE_BEHOLD_URL || "/api/social-feed";
        
        const response = await fetch(url);
        
        if (response.status === 404) {
          // Silent fallback for unconfigured feed
          setLoading(false);
          return;
        }

        if (!response.ok) throw new Error(`Feed response status: ${response.status}`);
        
        const data = await response.json();
        
        // Behold API can return an array or an object containing a 'posts' array
        const postsArray = Array.isArray(data) ? data : (data.posts || []);
        
        // Limit to 4 posts for the grid
        setPosts(postsArray.slice(0, 4));
      } catch (err) {
        console.warn("Instagram feed using placeholder fallback:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialFeed();
  }, []);

  return (
    <div className="w-full py-16">
      <div className="text-center mb-12">
        <h3 className="font-display italic text-2xl mb-2">Live from the Field</h3>
        <p className="text-[10px] uppercase tracking-[0.3em] text-brick-copper">@the.xposedbrick</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {/* State 1: Loading (Skeletons) */}
        {loading && [1, 2, 3, 4].map(idx => (
          <div key={idx} className="relative aspect-square bg-white/5 animate-pulse flex items-center justify-center">
            <Loader2 className="animate-spin text-brick-copper/30" size={24} />
          </div>
        ))}

        {/* State 2: Error or Missing Data (Graceful Fallback) */}
        {!loading && (error || posts.length === 0) && [1, 2, 3, 4].map(idx => (
          <a key={idx} href={`https://instagram.com/${username}`} target="_blank" rel="noreferrer" className="relative aspect-square group overflow-hidden bg-white/5">
            <img 
              src={`https://images.unsplash.com/photo-1600607687940-c52fb036999c?w=400&q=80&auto=format&fit=crop&sig=${idx}`} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
              alt="Real estate media placeholder" 
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white border-b border-white pb-1">View Profile</span>
            </div>
          </a>
        ))}

        {/* State 3: Live Feed */}
        {!loading && !error && posts.length > 0 && posts.map(post => (
          <a key={post.id} href={post.permalink} target="_blank" rel="noreferrer" className="relative aspect-square group overflow-hidden bg-white/5">
            <img 
              // Videos require the thumbnail URL, images use the standard media URL
              src={post.mediaType === 'VIDEO' && post.thumbnailUrl ? post.thumbnailUrl : post.mediaUrl} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
              alt="Recent property shoot"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white border-b border-white pb-1">View Post</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

