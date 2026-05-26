import React from 'react';
import { Box, Compass, Home as HomeIcon, Globe, Eye, HelpCircle, ExternalLink } from 'lucide-react';

export const PropertyHighlight = ({ 
  mediaUrl, 
  mediaType, 
  autoPlay = true,
  daysOnMarket, 
  salePrice, 
  listPrice, 
  packageUsed 
}: { 
  mediaUrl: string, 
  mediaType: 'image' | 'video', 
  autoPlay?: boolean,
  daysOnMarket: number, 
  salePrice: string, 
  listPrice: string, 
  packageUsed: string 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/10 group">
      <div className="relative aspect-square md:aspect-auto md:h-full overflow-hidden bg-white/5">
        {mediaType === 'video' ? (
          mediaUrl ? <video src={mediaUrl} autoPlay={autoPlay} loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" /> : null
        ) : (
          mediaUrl ? <img src={mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Highlight" /> : null
        )}
      </div>
      <div className="p-8 md:p-16 flex flex-col justify-center bg-charcoal">
        <h3 className="font-display italic text-3xl mb-12 text-white">Project Economics</h3>
        <div className="space-y-8">
          <div className="border-b border-white/10 pb-4">
            <span className="block text-[9px] uppercase tracking-[0.3em] text-brick-copper mb-2">Days on Market</span>
            <span className="font-mono text-2xl text-white">{daysOnMarket}</span>
          </div>
          <div className="border-b border-white/10 pb-4">
            <span className="block text-[9px] uppercase tracking-[0.3em] text-brick-copper mb-2">Sale vs List Price</span>
            <div className="flex gap-4 items-baseline">
              <span className="font-mono text-2xl text-white">{salePrice}</span>
              <span className="font-mono text-xs text-white/40 line-through">{listPrice}</span>
            </div>
          </div>
          <div className="pt-4">
            <span className="block text-[9px] uppercase tracking-[0.3em] text-brick-copper mb-2">Media Package Utilized</span>
            <span className="text-sm font-semibold uppercase tracking-widest text-white">{packageUsed}</span>
          </div>
        </div>
        <div className="mt-12 text-[10px] text-white/40 italic flex justify-end">
          Powered by REALTOR.ca
        </div>
      </div>
    </div>
  );
};

interface TourProviderInfo {
  provider: 'matterport' | 'iguide' | 'zillow' | 'panoee' | 'generic';
  displayName: string;
  embedUrl: string;
}

export const parseTourUrl = (input: string): TourProviderInfo => {
  let cleanUrl = input.trim();
  
  // 1. If user pasted a full iframe, extract the src attribute
  if (cleanUrl.toLowerCase().includes('<iframe')) {
    const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      cleanUrl = srcMatch[1];
    }
  }
  
  // 2. Detect the provider & standardize the embed URLs
  if (cleanUrl.includes('matterport.com')) {
    let modelId = '';
    // Look for m=XXXX or /show/XXXX or /models/XXXX
    const mMatch = cleanUrl.match(/m=([a-zA-Z0-9_-]+)/);
    if (mMatch && mMatch[1]) {
      modelId = mMatch[1];
    } else {
      const showMatch = cleanUrl.match(/\/(show|models)\/([a-zA-Z0-9_-]+)/);
      if (showMatch && showMatch[2]) {
        modelId = showMatch[2];
      }
    }
    
    // Standardize query args for white-label speed loading
    let finalUrl = cleanUrl;
    if (modelId) {
      finalUrl = `https://my.matterport.com/show/?m=${modelId}&play=1&brand=0&title=0&hl=1&qs=1`;
    } else if (!cleanUrl.includes('play=')) {
      finalUrl += finalUrl.includes('?') ? '&play=1&brand=0&qs=1' : '?play=1&brand=0&qs=1';
    }
      
    return {
      provider: 'matterport',
      displayName: 'Matterport 3D Tour',
      embedUrl: finalUrl
    };
  }
  
  if (cleanUrl.includes('youriguide.com')) {
    // Convert paths like http://youriguide.com/123_main_st to embed form http://youriguide.com/embed/123_main_st
    let embedUrl = cleanUrl;
    if (!cleanUrl.includes('/embed/') && cleanUrl.includes('youriguide.com/')) {
      embedUrl = cleanUrl.replace('youriguide.com/', 'youriguide.com/embed/');
    }
    return {
      provider: 'iguide',
      displayName: 'iGuide 3D Space',
      embedUrl
    };
  }
  
  if (cleanUrl.includes('zillow.com')) {
    let finalUrl = cleanUrl;
    if (!finalUrl.includes('setAttribution=')) {
      finalUrl += finalUrl.includes('?') ? '&setAttribution=mls' : '?setAttribution=mls';
    }
    return {
      provider: 'zillow',
      displayName: 'Zillow 3D Home',
      embedUrl: finalUrl
    };
  }
  
  if (cleanUrl.includes('panoee.com')) {
    let embedUrl = cleanUrl;
    if (cleanUrl.includes('panoee.com/t/')) {
      embedUrl = cleanUrl.replace('panoee.com/t/', 'viewer.panoee.com/');
    } else if (cleanUrl.includes('panoee.com/') && !cleanUrl.includes('viewer.panoee.com')) {
      embedUrl = cleanUrl.replace('panoee.com/', 'viewer.panoee.com/');
    }
    return {
      provider: 'panoee',
      displayName: 'Panoee Panorama',
      embedUrl
    };
  }
  
  // Generic fallback
  return {
    provider: 'generic',
    displayName: 'Interactive 3D Space',
    embedUrl: cleanUrl
  };
};

export const TourEmbed = ({ url, height = 600 }: { url: string; height?: number }) => {
  if (!url) {
    return (
      <div className="w-full bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="p-3 bg-white/5 border border-white/10 rounded-full mb-4 text-brick-copper">
          <HelpCircle size={20} className="animate-pulse" />
        </div>
        <p className="text-white text-xs font-mono uppercase tracking-[0.2em]">3D Interactive Virtual Tour</p>
        <p className="text-white/50 text-[11px] max-w-sm mt-2">
          Paste a Matterport, iGuide, Zillow 3D Home, or Panoee sharing link or full iframe embed code in the Puck editor to render.
        </p>
      </div>
    );
  }

  const info = parseTourUrl(url);

  const renderProviderIcon = () => {
    switch (info.provider) {
      case 'matterport':
        return <Box size={12} className="text-brick-copper animate-bounce" />;
      case 'iguide':
        return <Compass size={12} className="text-brick-copper animate-spin" style={{ animationDuration: '6s' }} />;
      case 'zillow':
        return <HomeIcon size={12} className="text-brick-copper" />;
      case 'panoee':
        return <Globe size={12} className="text-brick-copper animate-pulse" />;
      default:
        return <Eye size={12} className="text-brick-copper" />;
    }
  };

  return (
    <div className="w-full border border-white/10 overflow-hidden relative group bg-[#0d0d0d] selection:bg-brick-copper/20 shadow-xl">
      {/* Absolute Header badge */}
      <div className="absolute top-4 right-4 bg-charcoal/90 backdrop-blur-md border border-white/10 px-3 py-1.5 pointer-events-none z-10 flex items-center gap-2 rounded-sm shadow-md transition-all group-hover:bg-[#121212]">
         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
         <div className="flex items-center gap-1.5">
           {renderProviderIcon()}
           <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-white/90">{info.displayName}</span>
         </div>
      </div>

      {/* Absolute Footer link */}
      <div className="absolute bottom-4 left-4 bg-charcoal/95 backdrop-blur-md border border-white/10 px-3 py-1.5 z-10 flex items-center gap-2 rounded-sm shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300">
         <a 
           href={info.embedUrl} 
           target="_blank" 
           rel="noopener noreferrer" 
           className="text-[9px] uppercase tracking-widest font-mono text-brick-copper hover:text-white flex items-center gap-1.5 font-bold transition-colors"
         >
           Open Tour in New Tab <ExternalLink size={10} />
         </a>
      </div>

      <iframe 
        src={info.embedUrl || undefined} 
        width="100%" 
        height={height} 
        frameBorder="0" 
        allow="xr-spatial-tracking; vr; gyroscope; accelerometer; fullscreen; autoplay; clipboard-write"
        allowFullScreen 
        className="w-full relative z-0"
        title={info.displayName}
      />
    </div>
  );
};
