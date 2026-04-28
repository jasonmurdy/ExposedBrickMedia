import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface SiteSettings {
  brandName: string;
  logoText: string;
  logoLight?: string;
  logoDark?: string;
  tagline: string;
  heroTitlePart1: string;
  heroTitlePart2: string;
  heroTitleAccent: string;
  heroImage?: string;
  heroAlignment?: 'left' | 'center';
  accentColor?: string;
  footerQuote: string;
  inquiryTitle?: string;
  servicesTitle?: string;
  servicesSubtitle?: string;
  homeSectionsOrder?: string[]; 
  navigationItems?: { id: string; label: string; url: string; order: number }[];
  socialLinks?: { id: string; platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook'; url: string }[];
  contactInfo?: { email: string; phone: string; address: string };
  fontTitle?: 'Prata' | 'Montserrat' | 'Inter' | 'Playfair Display';
  fontBody?: 'Montserrat' | 'Inter' | 'Open Sans';
  layout?: any;
  updatedAt?: any;
}

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  description?: string; // SEO meta
  showInNav: boolean;
  order: number;
  layout?: any;
}

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  url?: string;
  order: number;
}

interface SiteContentContextType {
  settings: SiteSettings;
  pages: CustomPage[];
  services: ServiceItem[];
  portfolioItems: any[];
  loading: boolean;
  isAdmin: boolean;
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
}

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: 'The Exposed Brick',
  logoText: 'EB',
  logoLight: '',
  logoDark: '',
  tagline: 'Defined by Light',
  heroTitlePart1: 'The',
  heroTitlePart2: 'Exposed',
  heroTitleAccent: 'Brick',
  heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
  heroAlignment: 'left',
  accentColor: '#A47149',
  footerQuote: 'Every structure has a narrative; we simply provide the lighting.',
  inquiryTitle: 'Inquiry',
  servicesTitle: 'Service Tiers',
  servicesSubtitle: 'Refined media solutions for high-fidelity architectural narratives.',
  homeSectionsOrder: ['portfolio'],
  navigationItems: [],
  socialLinks: [
    { id: '1', platform: 'instagram', url: 'https://instagram.com' },
    { id: '2', platform: 'linkedin', url: 'https://linkedin.com' }
  ],
  contactInfo: {
    email: 'contact@exposedbrick.com',
    phone: '+1 (555) BRICK-01',
    address: '123 Archive St, Industrial District'
  },
  fontTitle: 'Prata',
  fontBody: 'Montserrat'
};

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

const ADMIN_EMAILS = ['jasonmurdy@gmail.com', 'sherwin.131986@gmail.com'];

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    let currentIsAdmin = false;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        if (ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
          currentIsAdmin = true;
          return;
        }

        // Also check Firestore admins collection
        const adminDoc = await getDoc(doc(db, 'admins', user.email));
        const isAdminUser = adminDoc.exists();
        setIsAdmin(isAdminUser);
        currentIsAdmin = isAdminUser;
      } else {
        setIsAdmin(false);
        currentIsAdmin = false;
      }
    });

    const settingsRef = doc(db, 'settings', 'site');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() } as SiteSettings);
      } else if (currentIsAdmin) {
        // Only attempt initialization if the user has admin rights
        setDoc(settingsRef, {
          ...DEFAULT_SETTINGS,
          updatedAt: serverTimestamp()
        }).catch(err => console.error("Settings init failed:", err));
      }
    });

    const qPages = query(collection(db, 'pages'), orderBy('order', 'asc'));
    const unsubPages = onSnapshot(qPages, (snap) => {
      setPages(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomPage)));
    }, (err) => {
      console.error("Pages listener failed:", err);
    });

    const qServices = query(collection(db, 'services'), orderBy('order', 'asc'));
    const unsubServices = onSnapshot(qServices, (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceItem)));
    }, (err) => {
      console.error("Services listener failed:", err);
    });

    const qPortfolio = query(collection(db, 'portfolio_items'), orderBy('order', 'asc'));
    const unsubPortfolio = onSnapshot(qPortfolio, (snap) => {
      setPortfolioItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Portfolio listener failed:", err);
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubSettings();
      unsubPages();
      unsubServices();
      unsubPortfolio();
    };
  }, []);

  return (
    <SiteContentContext.Provider value={{ settings, pages, services, portfolioItems, loading, isAdmin, isEditMode, setIsEditMode }}>
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error('useSiteContent must be used within SiteContentProvider');
  return context;
};
