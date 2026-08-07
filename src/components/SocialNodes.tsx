/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export interface LogoCloudProps {
  logos?: { url: string; alt: string; link?: string }[];
  layout?: 'marquee' | 'grid' | 'carousel';
  styleMode?: 'minimal' | 'color' | 'copper';
  speed?: 'slow' | 'normal' | 'fast';
  title?: string;
  logoSize?: 'sm' | 'md' | 'lg';
}

export const LogoCloud = ({ 
  logos = [], 
  layout = 'marquee', 
  styleMode = 'minimal', 
  speed = 'normal', 
  title = 'Trusted Industry Collaborators',
  logoSize = 'md' 
}: LogoCloudProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewCount, setViewCount] = useState(5);
  const items = logos || [];
  const isEmpty = items.length === 0;

  // Responsive view count adjustment based on logo size and viewport width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setViewCount(logoSize === 'sm' ? 3 : logoSize === 'lg' ? 1 : 2);
      } else if (width < 1024) {
        setViewCount(logoSize === 'sm' ? 4 : logoSize === 'lg' ? 2 : 3);
      } else {
        setViewCount(logoSize === 'sm' ? 6 : logoSize === 'lg' ? 3 : 5);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [logoSize]);

  // Adjust current index bounds on resize
  const maxIndex = Math.max(0, items.length - viewCount);
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [viewCount, maxIndex, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Auto-rotate logic for Carousel layout
  useEffect(() => {
    if (layout !== 'carousel' || isEmpty || items.length <= viewCount) return;
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [items.length, isEmpty, viewCount, layout]);

  const getLogoClass = () => {
    let sizeClass = "h-8 md:h-12";
    if (logoSize === 'sm') sizeClass = "h-6 md:h-9";
    if (logoSize === 'lg') sizeClass = "h-12 md:h-16";

    let filterClass = "opacity-40 grayscale hover:opacity-100 hover:grayscale-0";
    if (styleMode === 'minimal') {
      filterClass = "opacity-35 grayscale hover:opacity-100 hover:filter-none contrast-125 dark:brightness-200";
    } else if (styleMode === 'copper') {
      filterClass = "opacity-45 sepia-[0.5] hue-rotate-[320deg] saturate-[2.5] contrast-[1.15] hover:opacity-100 hover:filter-none";
    } else if (styleMode === 'color') {
      filterClass = "opacity-50 hover:opacity-100 transition-opacity";
    }

    return `${sizeClass} ${filterClass} transition-all duration-500 object-contain max-w-full`;
  };

  const renderLogo = (item: { url: string; alt: string; link?: string }, idx: number) => {
    if (!item?.url) return null;

    const logoInner = (
      <div className="relative group/logo flex items-center justify-center px-4 py-3 sm:px-6 sm:py-4 rounded-xl border border-white/[0.03] hover:border-white/[0.08] bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 shadow-sm hover:shadow-md h-16 md:h-22 w-full">
        <img 
          src={item.url} 
          alt={item.alt || `Logo ${idx}`} 
          className={getLogoClass()} 
          referrerPolicy="no-referrer"
        />
        {item.link && (
          <div className="absolute top-2 right-2 opacity-0 group-hover/logo:opacity-100 transition-opacity">
            <ExternalLink size={9} className="text-brick-copper" />
          </div>
        )}
      </div>
    );

    if (item.link) {
      return (
        <a 
          href={item.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full focus:outline-none focus:ring-1 focus:ring-brick-copper/30 rounded-xl"
        >
          {logoInner}
        </a>
      );
    }

    return logoInner;
  };

  // Render layouts
  const renderLayoutContent = () => {
    if (isEmpty) {
      return (
        <div className="flex justify-center items-center h-24 opacity-20 italic text-[10px] uppercase tracking-widest text-white border border-dashed border-white/10 rounded-xl max-w-5xl mx-auto">
          Brand identifiers manifest here.
        </div>
      );
    }

    // INFINITE TICKER MARQUEE LAYOUT
    if (layout === 'marquee') {
      // Repeat list to create infinite seamless feel
      const repetitions = Math.max(3, Math.ceil(12 / items.length));
      const duplicatedItems = Array(repetitions).fill(items).flat();
      
      const speedInSeconds = speed === 'slow' ? 45 : speed === 'fast' ? 18 : 28;

      return (
        <div className="w-full overflow-hidden relative py-3">
          {/* Subtle horizontal blur fades */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-charcoal via-charcoal/40 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-charcoal via-charcoal/40 to-transparent z-10 pointer-events-none" />
          
          <motion.div 
            className="flex whitespace-nowrap items-center min-w-full w-max gap-4 sm:gap-6 md:gap-8"
            animate={{ x: [0, `-${100 / repetitions}%`] }}
            transition={{
              ease: "linear",
              duration: speedInSeconds,
              repeat: Infinity,
            }}
          >
            {duplicatedItems.map((item, idx) => (
              <div 
                key={`${item.url}-${idx}`}
                className="inline-flex flex-shrink-0 items-center justify-center w-32 sm:w-40 md:w-52"
              >
                {renderLogo(item, idx)}
              </div>
            ))}
          </motion.div>
        </div>
      );
    }

    // SYMMETRICAL GRID LAYOUT
    if (layout === 'grid') {
      return (
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 justify-center">
            {items.map((item, idx) => (
              <motion.div
                key={`${item.url}-${idx}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="flex justify-center items-center w-full"
              >
                {renderLogo(item, idx)}
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    // INTERACTIVE CAROUSEL LAYOUT
    return (
      <div className="max-w-7xl mx-auto px-8 sm:px-14 relative group/carousel">
        <div className="relative overflow-hidden w-full py-2">
          <motion.div 
            className="flex"
            animate={{ x: `-${currentIndex * (100 / viewCount)}%` }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
          >
            {items.map((item, idx) => (
              <div 
                key={`${item.url}-${idx}`} 
                style={{ width: `${100 / viewCount}%` }}
                className="flex-shrink-0 px-1.5 sm:px-2.5 flex justify-center items-center"
              >
                <div className="w-full">
                  {renderLogo(item, idx)}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {items.length > viewCount && (
          <>
            <button 
              onClick={handlePrevious}
              className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white/30 hover:text-brick-copper hover:bg-white/5 transition-all rounded-full cursor-pointer active:scale-90"
              aria-label="Previous logo"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white/30 hover:text-brick-copper hover:bg-white/5 transition-all rounded-full cursor-pointer active:scale-90"
              aria-label="Next logo"
            >
              <ChevronRight size={20} />
            </button>

            {/* Pagination Bullet Indicators */}
            <div className="flex justify-center items-center gap-1.5 mt-6">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    currentIndex === idx ? "w-5 bg-brick-copper" : "w-1.5 bg-white/15 hover:bg-white/30"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full py-12 border-y border-white/5 bg-charcoal/20 backdrop-blur-sm relative overflow-hidden">
      <div className="w-full">
        {title && (
          <div className="text-center mb-8 space-y-2.5">
            <p className="text-[8px] sm:text-[9.5px] uppercase tracking-[0.45em] text-brick-copper font-mono font-bold px-4">{title}</p>
            <div className="w-10 h-[1px] bg-brick-copper/20 mx-auto" />
          </div>
        )}
        
        {renderLayoutContent()}
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

