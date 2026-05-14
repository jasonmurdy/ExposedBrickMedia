/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { BrandHeader, Navbar, HeroVisual, MobileNavbar } from './components/Hero';
import { Portfolio, Services } from './components/PortfolioSections';
import { BookingForm, FooterContent } from './components/BookingAndFooter';
import { ProjectDetailView } from './components/ProjectDetailView';
import { PartnerProfile } from './components/PartnerProfile';
import { TeamProfile } from './components/TeamProfile';
import { ChatWidget } from './components/ChatWidget';
import { ClientDashboard } from './components/ClientDashboard';
import AboutPage from './pages/About';
import ServicesPage from './pages/Services';
import InquiryPage from './pages/Inquiry';
import FloorPlansPage from './pages/services/FloorPlans';
import InteriorPhotographyPage from './pages/services/InteriorPhotography';
import AerialPhotographyPage from './pages/services/AerialPhotography';
import VirtualToursPage from './pages/services/VirtualTours';
// Lazy load the AdminDashboard to reduce initial bundle size
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PuckEditor = lazy(() => import('./components/PuckEditor').then(m => ({ default: m.PuckEditor })));
import { Shield, Loader2 } from 'lucide-react';

import { SiteContentProvider, useSiteContent } from './lib/SiteContentContext';
import { BrowserRouter, Routes, Route, useParams, useLocation, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Render } from "@measured/puck";
import { createConfig } from "./lib/puck.config";
import { Helmet } from 'react-helmet-async';
import { trackPageView } from './lib/analytics';

function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Send tracking after a short delay to allow Helmet to update document.title
    const timer = setTimeout(() => {
      trackPageView(location.pathname + location.search, document.title);
    }, 100);
    return () => clearTimeout(timer);
  }, [location]);
}

function MainLayout() {
  usePageTracking();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPuck, setShowPuck] = useState(false);
  const { isAdmin, settings, isEditMode, setIsEditMode, pages, isLight, setIsLight, loading } = useSiteContent();

  const location = useLocation();
  const isPortal = location.pathname.startsWith('/portal');

  const slugFromPath = location.pathname.startsWith('/p/') ? location.pathname.split('/p/')[1] : null;
  const currentPage = slugFromPath ? pages.find(p => p.slug === slugFromPath) : null;

  // Check if we are on a page that uses a Puck layout
  const hasPuckLayout = (location.pathname === '/' && settings.layout && (settings.layout.content?.length > 0 || settings.layout.zones)) || 
                       (currentPage?.layout && (currentPage.layout.content?.length > 0 || currentPage.layout.zones));

  // Hidden keyboard shortcut to open admin: Ctrl + Shift + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdmin(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle deep linking to admin dashboard
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('admin') === 'true' && isAdmin) {
      setShowAdmin(true);
      // Optional: Clean up the URL
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, isAdmin, location.pathname]);

  useEffect(() => {
    // Attempt to scroll main area to top on route change
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-[200]">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="text-brick-copper animate-spin" size={48} strokeWidth={1} />
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.5em] font-black text-brick-copper">EB MEDIA</span>
            <span className="text-[8px] uppercase tracking-widest text-text-primary/30">System Initialization</span>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomeView />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/floor-plans" element={<FloorPlansPage />} />
          <Route path="/services/interior" element={<InteriorPhotographyPage />} />
          <Route path="/services/aerial" element={<AerialPhotographyPage />} />
          <Route path="/services/virtual-tours" element={<VirtualToursPage />} />
          <Route path="/inquiry" element={<InquiryPage />} />
          <Route path="/p/:slug" element={<DynamicPageView />} />
          <Route path="/listing/:id" element={<ProjectDetailView />} />
          <Route path="/partners/:partnerId" element={<PartnerProfile />} />
          <Route path="/teams/:teamId" element={<TeamProfile />} />
          <Route path="/portal" element={<ClientDashboard />} />
        </Routes>
      </AnimatePresence>
    );
  };

  if (isPortal) {
    return (
      <div className={`min-h-screen bg-bg-primary text-text-primary transition-colors duration-500 ${isLight ? 'light' : ''}`}>
        {renderContent()}
        <ChatWidget />
      </div>
    );
  }

  return (
    <div className={`${hasPuckLayout ? 'min-h-screen overflow-x-hidden' : 'flex flex-col lg:flex-row min-h-screen lg:h-screen w-screen overflow-x-hidden lg:overflow-hidden'} bg-bg-primary text-text-primary selection:bg-brick-copper selection:text-charcoal relative transition-colors duration-500 ${isLight ? 'light' : ''}`}>
      <Navbar theme={isLight ? 'light' : 'dark'} onThemeToggle={() => setIsLight(!isLight)} />
      <MobileNavbar theme={isLight ? 'light' : 'dark'} onThemeToggle={() => setIsLight(!isLight)} />
      
      <Suspense fallback={null}>
        {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
        {showPuck && <PuckEditor pageId={currentPage?.id || undefined} onClose={() => setShowPuck(false)} />}
      </Suspense>

      {/* Admin Quick Access Trigger (Hidden but accessible) */}
      <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-4">
        {isAdmin && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.2, scale: 1 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            onClick={() => {
              setIsEditMode(!isEditMode);
              if (!isEditMode && (hasPuckLayout || location.pathname.startsWith('/p/'))) {
                 setShowPuck(true);
              }
            }}
            className={`p-4 rounded-full border border-brick-copper shadow-lg transition-all flex items-center gap-2 group overflow-hidden ${isEditMode ? 'bg-brick-copper text-charcoal' : 'bg-charcoal text-brick-copper'}`}
          >
            <Shield size={20} />
            <span className="text-[10px] uppercase tracking-widest font-bold max-w-0 group-hover:max-w-[150px] transition-all duration-500 whitespace-nowrap overflow-hidden">
              {isEditMode ? 'Exit Visual Editor' : 'Visual Edit Mode'}
            </span>
          </motion.button>
        )}
        <button 
          onClick={() => setShowAdmin(true)}
          className="p-4 bg-charcoal text-brick-copper rounded-full border border-brick-copper shadow-lg opacity-10 hover:opacity-100 transition-all"
        >
          <Shield size={20} />
        </button>
      </div>

      {hasPuckLayout ? (
        <div className="w-full">
          {renderContent()}
        </div>
      ) : (
        <>
          {/* LEFT COLUMN: BRAND & SERVICES */}
          <aside className="hidden lg:flex w-1/3 border-r border-border-subtle flex-col p-8 md:p-12 lg:p-16 pt-20 lg:pt-12 lg:overflow-y-auto no-scrollbar">
            <BrandHeader theme={isLight ? 'light' : 'dark'} />
            <div className="pt-12 space-y-16">
              <Services />
              <BookingForm />
            </div>
          </aside>

          {/* RIGHT AREA: HERO, PORTFOLIO & BOOKING */}
          <main className="w-full lg:w-2/3 flex flex-col lg:overflow-y-auto no-scrollbar scroll-smooth pt-20 lg:pt-0">
            {renderContent()}

            {/* BOTTOM: BOOKING & FOOTER */}
            <section className="mt-auto p-8 md:p-12 lg:p-16 border-t border-border-subtle bg-text-primary/[0.01]">
              <FooterContent />
            </section>
          </main>
        </>
      )}
      
      <ChatWidget />
    </div>
  );
}

function HomeView() {
  const { settings, pages, portfolioItems, partners, teams, brandResources } = useSiteContent();
  
  const config = useMemo(() => createConfig(pages, portfolioItems, partners, teams, brandResources), [pages, portfolioItems, partners, teams, brandResources]);
  
  const sanitizedLayout = useMemo(() => {
    if (!settings.layout) return null;
    try {
      return JSON.parse(JSON.stringify(settings.layout));
    } catch (e) {
      // If circular, return a pruned version
      const cache = new WeakSet();
      const prune = (val: any): any => {
        if (val === null || typeof val !== 'object') return val;
        if (cache.has(val)) return undefined;
        cache.add(val);
        if (Array.isArray(val)) return val.map(prune);
        const cleaned: any = {};
        for (const [k, v] of Object.entries(val)) {
          cleaned[k] = prune(v);
        }
        return cleaned;
      };
      return prune(settings.layout);
    }
  }, [settings.layout]);

  if (sanitizedLayout && (sanitizedLayout.content?.length > 0 || sanitizedLayout.zones)) {
    return <Render config={config} data={sanitizedLayout} />;
  }

  const sections = settings.homeSectionsOrder || ['portfolio', 'services'];
  
  return (
    <section className="flex flex-col">
      <Helmet>
        <title>Exposed Brick Media | Architectural Narratives & High-Fidelity Capture</title>
        <meta name="description" content="Premium real estate photography, cinematic videography, and digital marketing strategies for high-end properties in Kingston, Belleville, and Tyendinaga." />
        <meta property="og:title" content="Exposed Brick Media | Architectural Narratives" />
        <meta property="og:description" content="Premium real estate photography and cinematic videography." />
        <meta property="og:type" content="website" />
      </Helmet>
      <HeroVisual />
      <div className="bg-bg-primary/50">
        <Portfolio key="portfolio" />
      </div>
    </section>
  );
}

function DynamicPageView() {
  const { slug } = useParams();
  const { pages, portfolioItems, partners, teams, brandResources } = useSiteContent();
  const page = pages.find(p => p.slug === slug);

  if (!page) return <div className="p-16 text-center">Narrative not found.</div>;

  const config = useMemo(() => createConfig(pages, portfolioItems, partners, teams, brandResources), [pages, portfolioItems, partners, teams, brandResources]);

  const sanitizedLayout = useMemo(() => {
    if (!page.layout) return null;
    try {
      return JSON.parse(JSON.stringify(page.layout));
    } catch (e) {
      const cache = new WeakSet();
      const prune = (val: any): any => {
        if (val === null || typeof val !== 'object') return val;
        if (cache.has(val)) return undefined;
        cache.add(val);
        if (Array.isArray(val)) return val.map(prune);
        const cleaned: any = {};
        for (const [k, v] of Object.entries(val)) {
          cleaned[k] = prune(v);
        }
        return cleaned;
      };
      return prune(page.layout);
    }
  }, [page.layout]);

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Helmet>
        <title>{`${page.title} | Exposed Brick Media`}</title>
        <meta name="description" content={page.content?.substring(0, 160).replace(/[#*`]/g, '') || `Read about ${page.title} at Exposed Brick Media.`} />
        <meta property="og:title" content={`${page.title} | Exposed Brick Media`} />
      </Helmet>
      <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
        <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
        <span>/</span>
        <span className="text-text-primary">{page.title}</span>
      </div>
      <div className="flex-1">
        {sanitizedLayout && (sanitizedLayout.content?.length > 0 || sanitizedLayout.zones) ? (
          <Render config={config} data={sanitizedLayout} />
        ) : (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 md:p-16 lg:p-24"
          >
            <h2 className="font-display text-5xl mb-12">{page.title}</h2>
            <div className="prose prose-invert max-w-none prose-p:text-text-primary/70 prose-headings:text-text-primary">
              <Markdown>{page.content}</Markdown>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
export default function App() {
  return (
    <SiteContentProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </SiteContentProvider>
  );
}
