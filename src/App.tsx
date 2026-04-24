/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { BrandHeader, Navbar, HeroVisual, MobileNavbar } from './components/Hero';
import { Portfolio, Services } from './components/PortfolioSections';
import { BookingForm, FooterContent } from './components/BookingAndFooter';
// Lazy load the AdminDashboard to reduce initial bundle size
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
import { Shield, Loader2 } from 'lucide-react';

import { SiteContentProvider, useSiteContent } from './lib/SiteContentContext';
import { BrowserRouter, Routes, Route, useParams, useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Render } from "@measured/puck";
import { config } from "./lib/puck.config";

function MainLayout() {
  const [showAdmin, setShowAdmin] = useState(false);
  const { isAdmin, settings, isEditMode, setIsEditMode } = useSiteContent();
  const [isLight, setIsLight] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'light';
    }
    return false;
  });

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

  const location = useLocation();

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
      <aside className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-border-subtle flex flex-col p-8 md:p-12 lg:p-16 pt-32 lg:pt-12 overflow-y-auto no-scrollbar">
        <BrandHeader theme={isLight ? 'light' : 'dark'} />
        <div className="flex-grow flex flex-col justify-end pt-12">
          <Services />
        </div>
      </aside>

      {/* RIGHT AREA: HERO, PORTFOLIO & BOOKING */}
      <main className="w-full lg:w-2/3 flex flex-col overflow-y-auto no-scrollbar scroll-smooth pt-8 lg:pt-0">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomeView />} />
            <Route path="/p/:slug" element={<DynamicPageView />} />
          </Routes>
        </AnimatePresence>

        {/* BOTTOM: BOOKING & FOOTER */}
        <section className="mt-auto p-8 md:p-12 lg:p-16 border-t border-border-subtle flex flex-col lg:flex-row gap-12 bg-text-primary/[0.01]">
          <BookingForm />
          <FooterContent />
        </section>
      </main>
    </div>
  );
}

function HomeView() {
  const { settings } = useSiteContent();
  
  if (settings.layout && settings.layout.content && settings.layout.content.length > 0) {
    return <Render config={config} data={settings.layout} />;
  }

  const sections = settings.homeSectionsOrder || ['portfolio'];
  
  return (
    <section className="flex flex-col">
      <HeroVisual />
      <div className="bg-bg-primary/50">
        {sections.map(section => {
          if (section === 'portfolio') return <Portfolio key="portfolio" />;
          return null;
        })}
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
