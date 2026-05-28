import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ADMIN_EMAILS } from '../constants';

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
  navigationItems?: { id: string; label: string; url: string; order: number; hidden?: boolean; isPage?: boolean }[];
  socialLinks?: { id: string; platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook'; url: string }[];
  contactInfo?: { email: string; phone: string; address: string };
  fontTitle?: 'Prata' | 'Montserrat' | 'Inter' | 'Playfair Display';
  fontBody?: 'Montserrat' | 'Inter' | 'Open Sans';
  layout?: any;
  updatedAt?: any;
  propertiesPerPage?: number;
  chatbotEnabled?: boolean;
  chatbotPersona?: string;
  chatbotPricing?: {
    flambient_base: number;
    drone_addon: number;
    turnaround_time: string;
  };
  portalTitle?: string;
  portalDescription?: string;
  portalImg?: string;
  portalSupportEmail?: string;
  portalNotifyEmail?: string;
  portalSupportName?: string;
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

export interface CustomPopup {
  id: string;
  title: string;
  type: 'promotion' | 'lead-gen' | 'news';
  headline: string;
  content: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: any;
  isActive: boolean;
  trigger: 'onclick_only' | 'on_load' | 'exit_intent' | 'time_delay';
  delaySeconds?: number;
  targetPage?: string;
  createdAt?: any;
}

interface SiteContentContextType {
  settings: SiteSettings;
  pages: CustomPage[];
  services: ServiceItem[];
  portfolioItems: any[];
  partners: any[];
  teams: any[];
  brandResources: any[];
  popups: CustomPopup[];
  loading: boolean;
  isAdmin: boolean;
  user: any | null;
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  isLight: boolean;
  setIsLight: (val: boolean) => void;
}

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: '',
  logoText: '',
  logoLight: '',
  logoDark: '',
  tagline: '',
  heroTitlePart1: '',
  heroTitlePart2: '',
  heroTitleAccent: '',
  heroImage: '',
  heroAlignment: 'left',
  accentColor: '#A47149',
  footerQuote: '',
  inquiryTitle: '',
  servicesTitle: '',
  servicesSubtitle: '',
  homeSectionsOrder: ['portfolio'],
  navigationItems: [],
  socialLinks: [],
  contactInfo: {
    email: '',
    phone: '',
    address: ''
  },
  fontTitle: 'Prata',
  fontBody: 'Montserrat',
  propertiesPerPage: 6,
  chatbotEnabled: false,
  chatbotPersona: 'You are the Exposed Brick Media assistant.',
  chatbotPricing: {
    flambient_base: 0,
    drone_addon: 0,
    turnaround_time: ""
  },
  portalTitle: '',
  portalDescription: '',
  portalImg: '',
  portalSupportEmail: '',
  portalNotifyEmail: ''
};

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [brandResources, setBrandResources] = useState<any[]>([]);
  const [popups, setPopups] = useState<CustomPopup[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [portfolioLoaded, setPortfolioLoaded] = useState(false);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [partnersLoaded, setPartnersLoaded] = useState(false);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [brandResourcesLoaded, setBrandResourcesLoaded] = useState(false);
  const [popupsLoaded, setPopupsLoaded] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLight, setIsLight] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'light';
    }
    return false;
  });

  const loading = (!settingsLoaded || !portfolioLoaded || !pagesLoaded || !servicesLoaded || !partnersLoaded || !teamsLoaded || !brandResourcesLoaded || !popupsLoaded || !authLoaded) && !timedOut;

  useEffect(() => {
    // Safety timeout: if stuff hasn't loaded in 6 seconds, force show the app
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (isLight) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isLight]);

  useEffect(() => {
    let currentIsAdmin = false;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user?.email) {
        if (ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
          currentIsAdmin = true;
          setAuthLoaded(true);
          return;
        }

        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.email));
          const isAdminUser = adminDoc.exists();
          setIsAdmin(isAdminUser);
          currentIsAdmin = isAdminUser;
        } catch (err) {
          console.error("Admin check failed:", err);
        }
      } else {
        setIsAdmin(false);
        currentIsAdmin = false;
      }
      setAuthLoaded(true);
    });

    const settingsRef = doc(db, 'settings', 'site');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() } as SiteSettings);
      } else if (currentIsAdmin) {
        setDoc(settingsRef, {
          ...DEFAULT_SETTINGS,
          updatedAt: serverTimestamp()
        }).catch(err => console.error("Settings init failed:", err));
      }
      setSettingsLoaded(true);
    }, (err) => {
      console.error("Settings listener failed:", err);
      setSettingsLoaded(true);
    });

    const qPages = query(collection(db, 'pages'), orderBy('order', 'asc'));
    const unsubPages = onSnapshot(qPages, (snap) => {
      setPages(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomPage)));
      setPagesLoaded(true);
    }, (err) => {
      console.error("Pages listener failed:", err);
      setPagesLoaded(true);
    });

    const qServices = query(collection(db, 'services'), orderBy('order', 'asc'));
    const unsubServices = onSnapshot(qServices, (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceItem)));
      setServicesLoaded(true);
    }, (err) => {
      console.error("Services listener failed:", err);
      setServicesLoaded(true);
    });

    const qPortfolio = query(collection(db, 'portfolio_items'), orderBy('order', 'asc'));
    const unsubPortfolio = onSnapshot(qPortfolio, (snap) => {
      setPortfolioItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPortfolioLoaded(true);
    }, (err) => {
      console.error("Portfolio listener failed:", err);
      setPortfolioLoaded(true);
    });

    const fetchUnifiedPartners = async () => {
      try {
        const res = await fetch('/api/admin/clients');
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter((u: any) => u.role === 'partner' || u.role === 'preferred');
          setPartners(filtered);
        }
      } catch (err) {
        console.warn("Failover partners fetch failed:", err);
      }
    };

    const qPartners = query(collection(db, 'users'), where('role', 'in', ['partner', 'preferred']));
    const unsubPartners = onSnapshot(qPartners, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (items.length > 0) {
        setPartners(items);
      } else {
        fetchUnifiedPartners();
      }
      setPartnersLoaded(true);
    }, (err) => {
      console.warn("Partners listener failed, using fallback:", err);
      fetchUnifiedPartners();
      setPartnersLoaded(true);
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTeamsLoaded(true);
    }, (err) => {
      console.error("Teams listener failed:", err);
      setTeamsLoaded(true);
    });

    const unsubResources = onSnapshot(collection(db, 'brand_resources'), (snap) => {
      setBrandResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setBrandResourcesLoaded(true);
    }, (err) => {
      console.error("Brand Resources listener failed:", err);
      setBrandResourcesLoaded(true);
    });

    const unsubPopups = onSnapshot(collection(db, 'popups'), (snap) => {
      setPopups(snap.docs.map(d => ({ id: d.id, ...d.data() }) as CustomPopup));
      setPopupsLoaded(true);
    }, (err) => {
      console.error("Popups listener failed:", err);
      setPopupsLoaded(true);
    });

    return () => {
      unsubAuth();
      unsubSettings();
      unsubPages();
      unsubServices();
      unsubPortfolio();
      unsubPartners();
      unsubTeams();
      unsubResources();
      unsubPopups();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin || !pagesLoaded) return;

    const seedRequiredPages = async () => {
      const requiredPages = [
        {
          id: 'floor-plans',
          title: 'Floor Plans',
          slug: 'floor-plans',
          description: 'Professional 2D and 3D schematic floor plans for real estate marketing.',
          content: '# Floor Plans\n\nHigh-resolution, precise 2D and 3D floor plan schematic layouts designed for real estate listings and architectural presentations.',
          showInNav: true,
          order: 2
        },
        {
          id: 'interior',
          title: 'Interior Photography',
          slug: 'interior',
          description: 'Editorial-grade interior photography for luxury real estate.',
          content: '# Interior Photography\n\nEditorial-grade interior capture utilizing ambient light mastery and exposure blending for flawless, balanced interior scenes.',
          showInNav: true,
          order: 3
        },
        {
          id: 'aerial',
          title: 'Aerial Photography',
          slug: 'aerial',
          description: 'Cinematic aerial drone photography and videography for real estate.',
          content: '# Aerial Photography\n\nHigh-resolution aerial vistas and cinematic drone flyovers capturing waterfront estate context and surrounding terrains.',
          showInNav: true,
          order: 4
        },
        {
          id: 'virtual-tours',
          title: '3D Virtual Tours',
          slug: 'virtual-tours',
          description: 'High-fidelity 3D Matterport tours and digital twins for architectural spaces.',
          content: '# 3D Virtual Tours\n\nImmersive 3D Matterport captures allowing interactive navigation and responsive dollhouse perspective tours on any device.',
          showInNav: true,
          order: 5
        }
      ];

      for (const rp of requiredPages) {
        const exists = pages.some(p => p.slug === rp.slug);
        if (!exists) {
          console.log(`Auto-seeding page: ${rp.title}`);
          const docRef = doc(db, 'pages', rp.id);
          try {
            await setDoc(docRef, {
              title: rp.title,
              slug: rp.slug,
              description: rp.description,
              content: rp.content,
              showInNav: rp.showInNav,
              order: rp.order,
              layout: { content: [], root: { props: { title: rp.title } } },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            console.error(`Failed to auto-seed page ${rp.title}:`, err);
          }
        }
      }
    };

    seedRequiredPages();
  }, [isAdmin, pagesLoaded, pages]);

  return (
    <SiteContentContext.Provider value={{ settings, pages, services, portfolioItems, partners, teams, brandResources, popups, loading, isAdmin, user, isEditMode, setIsEditMode, isLight, setIsLight }}>
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error('useSiteContent must be used within SiteContentProvider');
  return context;
};
