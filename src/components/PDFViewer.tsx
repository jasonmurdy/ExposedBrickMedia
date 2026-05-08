/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, Loader2, FileText } from 'lucide-react';

// Better worker configuration for Vite using the local package
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PDFViewerProps {
  fileUrl: string;
  title?: string;
  width?: number;
}

export const PDFViewer = ({ fileUrl, title, width: initialWidth }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState<number>(initialWidth || 800);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive proxy URL if needed
  const processedUrl = React.useMemo(() => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http') && !fileUrl.includes(window.location.origin)) {
      return `/api/pdf-proxy?url=${encodeURIComponent(fileUrl)}`;
    }
    return fileUrl;
  }, [fileUrl]);

  useEffect(() => {
    // Reset state when fileUrl changes
    setNumPages(null);
    setPageNumber(1);
    setError(null);
    setLoading(true);

    if (!fileUrl) {
      setError('No document path provided.');
      setLoading(false);
      return;
    }

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 32); // Subtract padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [fileUrl]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
    setLoading(false);
  }

  function onDocumentLoadError(err: Error) {
    console.error("PDF Load Error:", err);
    setLoading(false);
    
    // Check if the error returned from proxy was actually an error message string
    if (err.message.includes('structure')) {
      setError('Invalid Document Structure: The file retrieved does not appear to be a valid PDF. It may be corrupted or an access error occurred.');
    } else if (err.message.includes('fetch')) {
      setError('Connection Failure: Could not establish a secure link to the archival server.');
    } else {
      setError(err.message);
    }
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const next = prevPageNumber + offset;
      if (next < 1) return 1;
      if (numPages && next > numPages) return numPages;
      return next;
    });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col bg-charcoal border border-white/5 overflow-hidden transition-all duration-500 ${isFullScreen ? 'h-screen w-screen' : 'w-full'}`}
    >
      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 z-10">
        <div className="flex items-center gap-4">
          <FileText className="text-brick-copper" size={18} />
          <h3 className="text-[10px] uppercase tracking-widest font-black text-white/80 truncate max-w-[200px]">
            {title || 'Document Preview'}
          </h3>
        </div>

        <div className="flex items-center gap-6">
          {/* Pagination */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-brick-copper disabled:opacity-20 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-mono text-white/60">
              {pageNumber} <span className="opacity-30">/</span> {numPages || '--'}
            </span>
            <button 
              onClick={() => changePage(1)}
              disabled={numPages ? pageNumber >= numPages : true}
              className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-brick-copper disabled:opacity-20 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={fileUrl} 
              download 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-brick-copper text-white/60 hover:text-white transition-all"
              title="Download PDF"
            >
              <Download size={16} />
            </a>
            <button 
              onClick={toggleFullScreen}
              className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-brick-copper text-white/60 hover:text-white transition-all"
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* PDF VIEWER SURFACE */}
      <div className={`flex justify-center p-4 md:p-8 overflow-y-auto overflow-x-hidden no-scrollbar ${isFullScreen ? 'flex-1' : 'min-h-[400px] max-h-[800px]'}`}>
        <div className="shadow-2xl shadow-black/80">
          <Document
            file={processedUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-brick-copper" size={32} />
                <p className="text-[10px] uppercase tracking-widest text-white/20 italic">Deciphering Narrative Assets...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center py-20 text-red-500/60 gap-4">
                <FileText size={48} />
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest mb-2">Failed to load encryption key.</p>
                  {error && <p className="text-[8px] text-red-500/40 font-mono break-all max-w-[250px]">{error}</p>}
                </div>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              width={containerWidth}
              className="max-w-full"
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        </div>
      </div>

      {/* FOOTER STATUS */}
      {numPages && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
           <p className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold whitespace-nowrap">
             Page {pageNumber} of {numPages} — Technical Archive v1.0
           </p>
        </div>
      )}
    </div>
  );
};
