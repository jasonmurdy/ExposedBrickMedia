/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';

export const LogoCloud = ({ logos }: { logos: { url: string, alt: string }[] }) => {
  if (!logos || logos.length === 0) return null;
  return (
    <div className="w-full py-16 border-y border-white/5 bg-charcoal">
      <div className="max-w-5xl mx-auto px-8">
        <p className="text-center text-[9px] uppercase tracking-[0.4em] text-white/40 mb-12">Trusted by the industry's vanguard</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60">
          {logos.map((logo, idx) => (
            logo.url ? (
              <img 
                key={idx} 
                src={logo.url} 
                alt={logo.alt || `Brand ${idx}`} 
                className="h-8 md:h-12 object-contain grayscale hover:grayscale-0 transition-all duration-500 hover:scale-105 cursor-pointer" 
              />
            ) : null
          ))}
        </div>
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

