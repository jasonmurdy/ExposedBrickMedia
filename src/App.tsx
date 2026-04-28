/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { BrandHeader, Navbar, HeroVisual, MobileNavbar } from './components/Hero';
import { Portfolio, Services } from './components/PortfolioSections';
import { BookingForm, FooterContent } from './components/BookingAndFooter';
import { ProjectDetailView } from './components/ProjectDetailView';
import AboutPage from './pages/About';
// Lazy load the AdminDashboard to reduce initial bundle size
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
import { Shield, Loader2 } from 'lucide-react';

import { SiteContentProvider, useSiteContent } from './lib/SiteContentContext';
import { BrowserRouter, Routes, Route, useParams, useLocation, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Render } from "@measured/puck";
import { createConfig } from "./lib/puck.config";
import { Helmet } from 'react-helmet-async';

function MainLayout() {
  const [showAdmin, setShowAdmin] = useState(false);
  const { isAdmin, settings, isEditMode, setIsEditMode, pages } = useSiteContent();
  const [isLight, setIsLight] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'light';
    }
    return false;
  });

  const location = useLocation();
  const slugFromPath = location.pathname.startsWith('/p/') ? location.pathname.split('/p/')[1] : null;
  const currentPage = slugFromPath ? pages.find(p => p.slug === slugFromPath) : null;
  
  // Check if we are on a page that uses a Puck layout
  const hasPuckLayout = (location.pathname === '/' && settings.layout && (settings.layout.content?.length > 0 || settings.layout.zones)) || 
                       (currentPage?.layout && (currentPage.layout.content?.length > 0 || currentPage.layout.zones));

  useEffect(() => {
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (isLight) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isLight]);

  // Apply accent color and fonts
  useEffect(() => {
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--color-accent', settings.accentColor);
    }
    if (settings.fontTitle) {
      document.documentElement.style.setProperty('--font-display-custom', `"${settings.fontTitle}", serif`);
    }
    if (settings.fontBody) {
      document.documentElement.style.setProperty('--font-body-custom', `"${settings.fontBody}", sans-serif`);
    }
  }, [settings.accentColor, settings.fontTitle, settings.fontBody]);

  // Hidden keyboard shortcut to open admin: Shift + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'A') {
        setShowAdmin(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Attempt to scroll main area to top on route change
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomeView />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/p/:slug" element={<DynamicPageView />} />
          <Route path="/listing/:id" element={<ProjectDetailView />} />
        </Routes>
      </AnimatePresence>
    );
  };

  // If using Puck layout, we rely on Puck's root component for the shell
  if (hasPuckLayout) {
    return (
      <div className={`min-h-screen bg-bg-primary text-text-primary transition-colors duration-500 ${isLight ? 'light' : ''}`}>
        <Navbar theme={isLight ? 'light' : 'dark'} onThemeToggle={() => setIsLight(!isLight)} />
        <MobileNavbar theme={isLight ? 'light' : 'dark'} onThemeToggle={() => setIsLight(!isLight)} />
        
        <Suspense fallback={null}>
          {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
        </Suspense>

        <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-4">
          {isAdmin && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.2, scale: 1 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              onClick={() => setIsEditMode(!isEditMode)}
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

        {renderContent()}
      </div>
    );
  }

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen lg:h-screen w-screen overflow-x-hidden lg:overflow-hidden bg-bg-primary text-text-primary selection:bg-brick-copper selection:text-charcoal relative transition-colors duration-500 ${isLight ? 'light' : ''}`}>
      <Navbar theme={isLight ? 'light' : 'dark'} onThemeToggle={() => setIsLight(!isLight)} />
      <MobileNavbar theme={isLight ? 'light' : 'dark'} onThemeToggle={() => setIsLight(!isLight)} />
      
      <Suspense fallback={null}>
        {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
      </Suspense>

      {/* Admin Quick Access Trigger (Hidden but accessible) */}
      <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-4">
        {isAdmin && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.2, scale: 1 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            onClick={() => setIsEditMode(!isEditMode)}
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

      {/* LEFT COLUMN: BRAND & SERVICES */}
      <aside className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-border-subtle flex flex-col p-8 md:p-12 lg:p-16 pt-20 lg:pt-12 lg:overflow-y-auto no-scrollbar">
        <BrandHeader theme={isLight ? 'light' : 'dark'} />
        <div className="pt-12 space-y-16 hidden lg:block">
          <Services />
          <BookingForm />
        </div>
      </aside>

      {/* RIGHT AREA: HERO, PORTFOLIO & BOOKING */}
      <main className="w-full lg:w-2/3 flex flex-col lg:overflow-y-auto no-scrollbar scroll-smooth pt-8 lg:pt-0">
        {renderContent()}

        {/* Mobile-only sections for better flow */}
        <div className="lg:hidden p-8 space-y-16 bg-bg-primary">
          <Services />
          <BookingForm />
        </div>

        {/* BOTTOM: BOOKING & FOOTER */}
        <section className="mt-auto p-8 md:p-12 lg:p-16 border-t border-border-subtle bg-text-primary/[0.01]">
          <FooterContent />
        </section>
      </main>
    </div>
  );
}

function HomeView() {
  const { settings, pages } = useSiteContent();
  
  if (settings.layout && (settings.layout.content?.length > 0 || settings.layout.zones)) {
    return <Render config={createConfig(pages)} data={settings.layout} />;
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
  const { pages } = useSiteContent();
  const page = pages.find(p => p.slug === slug);

  if (!page) return <div className="p-16 text-center">Narrative not found.</div>;

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
        {page.layout && (page.layout.content?.length > 0 || page.layout.zones) ? (
          <Render config={createConfig(pages)} data={page.layout} />
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
