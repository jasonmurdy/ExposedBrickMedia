import React from 'react';

export const LogoCloud = ({ logos }: { logos: { url: string, alt: string }[] }) => {
  if (!logos || logos.length === 0) return null;
  return (
    <div className="w-full py-16 border-y border-white/5 bg-charcoal">
      <div className="max-w-5xl mx-auto px-8">
        <p className="text-center text-[9px] uppercase tracking-[0.4em] text-white/40 mb-12">Trusted by the industry's vanguard</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60">
          {logos.map((logo, idx) => (
            <img 
              key={idx} 
              src={logo.url} 
              alt={logo.alt || `Brand ${idx}`} 
              className="h-8 md:h-12 object-contain grayscale hover:grayscale-0 transition-all duration-500 hover:scale-105 cursor-pointer" 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const InstagramFeed = ({ username = 'exposedbrickmedia' }: { username?: string }) => {
  return (
    <div className="w-full py-16">
      <div className="text-center mb-12">
        <h3 className="font-display italic text-2xl mb-2">Live from the Field</h3>
        <p className="text-[10px] uppercase tracking-[0.3em] text-brick-copper">@{username}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
         {/* Placeholder for Elfsight or raw API inject. Since we can't reliably load a free dynamic widget out of nothing, we'll build a grid of branded placeholders that link to social. */}
         {[1,2,3,4].map(idx => (
           <a key={idx} href={`https://instagram.com/${username}`} target="_blank" rel="noreferrer" className="relative aspect-square group overflow-hidden bg-white/5">
             <img src={`https://images.unsplash.com/photo-1600607687940-c52fb036999c?w=400&q=80&auto=format&fit=crop&sig=${idx}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" alt="Instagram post" />
             <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-widest font-bold text-white border-b border-white pb-1">View Post</span>
             </div>
           </a>
         ))}
      </div>
    </div>
  );
};
