import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Compass, Home as HomeIcon, Globe, Eye, HelpCircle, ExternalLink, Bed, Bath, Maximize2 } from 'lucide-react';

export const PropertyHighlight = ({ 
  mediaUrl, 
  mediaType, 
  autoPlay = true,
  daysOnMarket, 
  salePrice, 
  listPrice, 
  packageUsed,
  title = "Project Economics",
  beds,
  baths,
  sqft,
  linkUrl,
  linkLabel = "View Showcase",
  status
}: { 
  mediaUrl: string, 
  mediaType: 'image' | 'video', 
  autoPlay?: boolean,
  daysOnMarket?: number, 
  salePrice?: string, 
  listPrice?: string, 
  packageUsed?: string,
  title?: string,
  beds?: string | number,
  baths?: string | number,
  sqft?: string | number,
  linkUrl?: string,
  linkLabel?: string,
  status?: string
}) => {
  const hasListingDetails = beds || baths || sqft || linkUrl;

  const getStatusLabel = () => {
    if (status) return status.toUpperCase();
    if (hasListingDetails) return "FEATURED LISTING";
    return "PROJECT PROFILE";
  };

  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'sold':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'active':
      default:
        return 'bg-brick-copper/10 text-brick-copper border-brick-copper/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-white/10 overflow-hidden bg-charcoal group">
      {/* Media Column (6 cols on lg) */}
      <div className="relative lg:col-span-6 aspect-video lg:aspect-auto lg:h-full min-h-[380px] overflow-hidden bg-white/5">
        {mediaType === 'video' ? (
          mediaUrl ? (
            <video 
              src={mediaUrl} 
              autoPlay={autoPlay} 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover scale-[1.01] group-hover:scale-105 transition-transform duration-1000" 
            />
          ) : null
        ) : (
          mediaUrl ? (
            <img 
              src={mediaUrl} 
              className="w-full h-full object-cover scale-[1.01] group-hover:scale-105 transition-transform duration-1000" 
              alt="Highlight" 
              referrerPolicy="no-referrer"
            />
          ) : null
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Info Column (6 cols on lg) */}
      <div className="lg:col-span-6 p-8 md:p-14 lg:p-16 flex flex-col justify-center relative">
        <div className="absolute top-8 left-8 md:top-12 md:left-14 lg:top-16 lg:left-16">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[8px] font-mono tracking-[0.2em] uppercase border ${getStatusColor()}`}>
            {getStatusLabel()}
          </span>
        </div>

        <div className="mt-8">
          <h3 className="font-display italic text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-8">
            {title}
          </h3>
          
          {hasListingDetails ? (
            <div className="space-y-10">
              {/* Premium Designed Cards/Grid of Beds/Baths/SQFT */}
              <div className="grid grid-cols-3 gap-3">
                {beds && (
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xs hover:bg-white/[0.04] transition-colors group/item">
                    <div className="flex items-center gap-2 mb-2">
                      <Bed size={14} className="text-brick-copper" />
                      <span className="text-[8px] uppercase tracking-[0.25em] text-white/40 font-mono">Beds</span>
                    </div>
                    <span className="font-mono text-lg sm:text-xl text-white font-medium">{beds} BD</span>
                  </div>
                )}
                {baths && (
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xs hover:bg-white/[0.04] transition-colors group/item">
                    <div className="flex items-center gap-2 mb-2">
                      <Bath size={14} className="text-brick-copper" />
                      <span className="text-[8px] uppercase tracking-[0.25em] text-white/40 font-mono">Baths</span>
                    </div>
                    <span className="font-mono text-lg sm:text-xl text-white font-medium">{baths} BA</span>
                  </div>
                )}
                {sqft && (
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xs hover:bg-white/[0.04] transition-colors group/item">
                    <div className="flex items-center gap-2 mb-2">
                      <Maximize2 size={13} className="text-brick-copper" />
                      <span className="text-[8px] uppercase tracking-[0.25em] text-white/40 font-mono">Sq Ft</span>
                    </div>
                    <span className="font-mono text-lg sm:text-xl text-white font-medium">
                      {typeof sqft === 'number' ? sqft.toLocaleString() : sqft}
                    </span>
                  </div>
                )}
              </div>

              {/* Sophisticated Price Row */}
              {(listPrice || salePrice) && (
                <div className="pt-2 border-t border-white/10">
                  <span className="block text-[8px] uppercase tracking-[0.3em] text-brick-copper mb-1.5">Value Assessment</span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-2xl sm:text-3xl text-white font-bold tracking-tight">
                      {listPrice || salePrice}
                    </span>
                    {salePrice && listPrice && salePrice !== listPrice && (
                      <span className="font-mono text-xs sm:text-sm text-white/30 line-through">
                        {listPrice}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action / CTA Button with premium architectural hover */}
              {linkUrl && (
                <div className="pt-4 flex">
                  <Link 
                    to={linkUrl} 
                    className="group/btn inline-flex items-center justify-between gap-6 bg-brick-copper hover:bg-white text-charcoal text-[9px] uppercase font-black tracking-[0.25em] transition-all duration-300 pl-8 pr-6 py-4 rounded-xs animate-pulse hover:animate-none"
                  >
                    <span>{linkLabel}</span>
                    <ExternalLink size={12} className="shrink-0 transform group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="border-b border-white/10 pb-4">
                <span className="block text-[9px] uppercase tracking-[0.3em] text-brick-copper mb-2">Days on Market</span>
                <span className="font-mono text-2xl text-white font-medium">{daysOnMarket}</span>
              </div>
              <div className="border-b border-white/10 pb-4">
                <span className="block text-[9px] uppercase tracking-[0.3em] text-brick-copper mb-2">Sale vs List Price</span>
                <div className="flex gap-4 items-baseline">
                  <span className="font-mono text-2xl text-white font-medium">{salePrice}</span>
                  <span className="font-mono text-xs text-white/40 line-through">{listPrice}</span>
                </div>
              </div>
              <div className="pt-4">
                <span className="block text-[9px] uppercase tracking-[0.3em] text-brick-copper mb-2">Media Package Utilized</span>
                <span className="text-sm font-semibold uppercase tracking-widest text-white">{packageUsed}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 pt-4 border-t border-white/5 text-[9px] text-white/35 italic flex items-center justify-between">
          <span className="font-mono">MLS® INTEGRATED DATA</span>
          <span>Powered by REALTOR.ca</span>
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
