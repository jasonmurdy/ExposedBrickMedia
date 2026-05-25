/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X, Maximize2, Compass } from "lucide-react";

interface SelectedMedia {
  url: string;
  portfolioId: string;
  portfolioTitle: string;
  category?: string;
}

interface DynamicCuratedGalleryProps {
  title?: string;
  subtitle?: string;
  images: SelectedMedia[];
  layout: "masonry" | "grid" | "bento" | "carousel";
  columns: number;
  aspectRatio: "16/9" | "4/3" | "1/1" | "portrait" | "auto";
  grayscaleEffect: "none" | "hover-color" | "always-grayscale";
  lightbox: boolean;
}

export const DynamicCuratedGallery: React.FC<DynamicCuratedGalleryProps> = ({
  title = "Curated Visual Collection",
  subtitle = "Interactive narrative showcases handpicked from our architectural archives.",
  images = [],
  layout = "grid",
  columns = 3,
  aspectRatio = "16/9",
  grayscaleEffect = "hover-color",
  lightbox = true
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, images]);

  // Carousel scroll math
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.75;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const getAspectClass = (ratio: string) => {
    switch (ratio) {
      case "16/9": return "aspect-video";
      case "4/3": return "aspect-[4/3]";
      case "1/1": return "aspect-square";
      case "portrait": return "aspect-[3/4]";
      case "auto":
      default: return "aspect-auto";
    }
  };

  const getBentoSpan = (index: number) => {
    const patterns = [
      "md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto", // Big keyframe
      "md:col-span-1 md:row-span-2 aspect-[3/4] md:aspect-auto",  // Tall column
      "md:col-span-1 md:row-span-1 aspect-square",
      "md:col-span-2 md:row-span-1 aspect-[16/9] md:aspect-auto", // Wide banner
      "md:col-span-1 md:row-span-1 aspect-square"
    ];
    return patterns[index % patterns.length];
  };

  const getGrayscaleClass = (effect: string) => {
    switch (effect) {
      case "always-grayscale": return "grayscale";
      case "hover-color": return "grayscale hover:grayscale-0 transition-all duration-700";
      case "none":
      default: return "grayscale-0";
    }
  };

  const getGridColsClass = (cols: number) => {
    switch (cols) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 sm:grid-cols-2";
      case 4: return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      case 3:
      default: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full px-8 md:px-12 py-16 bg-white/5 border border-dashed border-white/10 rounded-sm text-center flex flex-col items-center justify-center">
        <Compass className="w-8 h-8 text-brick-copper mb-4 animate-pulse" />
        <h3 className="font-display text-lg italic text-white mb-2">Dynamic Curator Gallery</h3>
        <p className="text-xs text-white/40 max-w-sm">No media selected. Click dynamic parameters on the right to select property items and populate details.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-8 md:px-12 lg:px-16" id="curated-media-gallery">
      {/* Header section */}
      {(title || subtitle) && (
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-white/5 pb-8 gap-4">
          <div className="max-w-2xl">
            {title && (
              <h2 className="font-display text-3xl md:text-5xl italic text-white tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2.5 text-xs text-white/40 uppercase tracking-widest leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {layout === "carousel" && (
            <div className="flex gap-2">
              <button
                onClick={() => scrollCarousel('left')}
                className="w-10 h-10 border border-white/10 bg-charcoal hover:border-brick-copper hover:text-brick-copper flex items-center justify-center transition-colors text-white"
                aria-label="Scroll Left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="w-10 h-10 border border-white/10 bg-charcoal hover:border-brick-copper hover:text-brick-copper flex items-center justify-center transition-colors text-white"
                aria-label="Scroll Right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid rendering options */}
      {layout === "grid" && (
        <div className={`grid ${getGridColsClass(columns)} gap-6 lg:gap-8`}>
          {images.map((img, index) => (
            <motion.div
              key={`${img.url}-${index}`}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`group relative overflow-hidden bg-[#101010] border border-white/5 cursor-pointer ${getAspectClass(aspectRatio)}`}
              onClick={() => lightbox && setLightboxIndex(index)}
            >
              <img
                src={img.url}
                className={`w-full h-full object-cover select-none ${getGrayscaleClass(grayscaleEffect)}`}
                alt={img.portfolioTitle}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                {lightbox && (
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-95 group-hover:scale-100 transition-transform duration-300">
                    <Maximize2 size={16} />
                  </div>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-[8px] uppercase tracking-widest text-brick-copper block font-black mb-0.5">
                  {img.category || "Property Asset"}
                </span>
                <span className="font-display text-sm italic text-white line-clamp-1 block">
                  {img.portfolioTitle}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Masonry Layout (utilizing column layout) */}
      {layout === "masonry" && (
        <div className={`columns-1 sm:columns-2 lg:columns-${columns} gap-6 space-y-6`}>
          {images.map((img, index) => (
            <motion.div
              key={`${img.url}-${index}`}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="break-inside-avoid w-full block bg-[#101010] border border-white/5 group relative overflow-hidden cursor-pointer"
              onClick={() => lightbox && setLightboxIndex(index)}
            >
              <img
                src={img.url}
                className={`w-full h-auto block select-none ${getGrayscaleClass(grayscaleEffect)}`}
                alt={img.portfolioTitle}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                {lightbox && (
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-95 group-hover:scale-100 transition-transform duration-300">
                    <Maximize2 size={16} />
                  </div>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-[8px] uppercase tracking-widest text-brick-copper block font-black mb-0.5">
                  {img.category || "Property Asset"}
                </span>
                <span className="font-display text-sm italic text-white line-clamp-1 block">
                  {img.portfolioTitle}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bento Showcase Grid */}
      {layout === "bento" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 auto-rows-[220px] sm:auto-rows-[250px] md:auto-rows-[280px]">
          {images.map((img, index) => (
            <motion.div
              key={`${img.url}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`${getBentoSpan(index)} group relative overflow-hidden bg-[#101010] border border-white/5 cursor-pointer`}
              onClick={() => lightbox && setLightboxIndex(index)}
            >
              <img
                src={img.url}
                className={`w-full h-full object-cover select-none ${getGrayscaleClass(grayscaleEffect)}`}
                alt={img.portfolioTitle}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                {lightbox && (
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-95 group-hover:scale-100 transition-transform duration-300">
                    <Maximize2 size={16} />
                  </div>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-[8px] uppercase tracking-widest text-brick-copper block font-black mb-0.5">
                  {img.category || "Property Asset"}
                </span>
                <span className="font-display text-sm md:text-base italic text-white line-clamp-1 block">
                  {img.portfolioTitle}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Carousel Scrollstrip */}
      {layout === "carousel" && (
        <div 
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4"
        >
          {images.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              className="flex-shrink-0 w-[85vw] sm:w-[50vw] md:w-[35vw] snap-start"
            >
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`group relative overflow-hidden bg-[#101010] border border-white/5 cursor-pointer ${getAspectClass(aspectRatio)}`}
                onClick={() => lightbox && setLightboxIndex(index)}
              >
                <img
                  src={img.url}
                  className={`w-full h-full object-cover select-none ${getGrayscaleClass(grayscaleEffect)}`}
                  alt={img.portfolioTitle}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  {lightbox && (
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-95 group-hover:scale-100 transition-transform duration-300">
                      <Maximize2 size={16} />
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[8px] uppercase tracking-widest text-brick-copper block font-black mb-0.5">
                    {img.category || "Property Asset"}
                  </span>
                  <span className="font-display text-sm italic text-white line-clamp-1 block">
                    {img.portfolioTitle}
                  </span>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Animated Lightbox Overlay */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/95 flex flex-col justify-between"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-50">
              <div className="flex flex-col">
                <span className="text-[10px] text-brick-copper uppercase tracking-[0.3em] font-black">
                  {images[lightboxIndex].category || "Property Media"}
                </span>
                <span className="font-display text-lg italic text-white mt-0.5">
                  {images[lightboxIndex].portfolioTitle}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(null);
                }}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Picture Canvas Stage */}
            <div className="flex-1 min-h-0 flex items-center justify-between relative px-4 md:px-12">
              {/* Prev Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
                }}
                className="absolute left-6 cursor-pointer md:left-12 w-12 h-12 rounded-full border border-white/10 bg-black/40 text-white hover:text-brick-copper hover:border-brick-copper flex items-center justify-center trend-transition hover:bg-charcoal/80 z-50"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Slider image holder */}
              <div 
                className="w-full h-full flex items-center justify-center p-4 md:p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={lightboxIndex}
                    src={images[lightboxIndex].url}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    className="max-w-full max-h-full object-contain pointer-events-none select-none shadow-2xl border border-white/5 bg-charcoal/30"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
              </div>

              {/* Next Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-6 cursor-pointer md:right-12 w-12 h-12 rounded-full border border-white/10 bg-black/40 text-white hover:text-brick-copper hover:border-brick-copper flex items-center justify-center trend-transition hover:bg-charcoal/80 z-50"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Bottom Counter Footer */}
            <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center text-xs text-white/40 tracking-[0.2em] font-mono select-none z-50">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
