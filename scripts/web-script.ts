import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const INITIAL_PARTNERS = [
  {
    email: "candice.laframboise@century21.ca",
    displayName: "Candice Laframboise",
    phone: "+16135382885",
    headshotUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    logoUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d",
    bio: "Candice Laframboise is an elite real estate professional representing Century 21. Utilizing high-fidelity real estate media and Matterport 3D tours, Candice secures phenomenal results for modern home buyers and sellers.",
    role: "partner"
  },
  {
    email: "aurora@heartofkingston.com",
    displayName: "Aurora Dokken",
    phone: "+16134536323",
    headshotUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
    logoUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6",
    bio: "Aurora Dokken represents Heart of Kingston, specializing in local residential properties and premier boutique listings with advanced media narratives.",
    role: "partner"
  },
  {
    email: "sheri@sherigodfrey.ca",
    displayName: "Sheri Godfrey",
    phone: "+16139295356",
    headshotUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956",
    logoUrl: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833",
    bio: "Sheri Godfrey is an experienced property agent at Senior Transitions, bringing exceptional care, customized relocation support, and premium property visualization to every listing.",
    role: "partner"
  },
  {
    email: "charlyrowsell@kw.com",
    displayName: "Charly Rowsell",
    phone: "+16137705580",
    headshotUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604",
    logoUrl: "https://images.unsplash.com/photo-1543286386-7a39e65fecab",
    bio: "Charly Rowsell is a premier real estate marketing wizard with Keller Williams Inspire Realty, using cinematic video walks to command high-value views for residential sales.",
    role: "partner"
  },
  {
    email: "andreabarkley@live.com",
    displayName: "Andrea Barkley",
    phone: "+16139299350",
    headshotUrl: "https://images.unsplash.com/photo-1594744803329-e58b31de215f",
    logoUrl: "https://images.unsplash.com/photo-1543286386-7a39e65fecab",
    bio: "Andrea Barkley represents Keller Williams Inspire Realty with a dedicated approach to client service and stunning, professional real estate media systems.",
    role: "partner"
  },
  {
    email: "bulsen@cityscapeone.com",
    displayName: "Kadir Bulsen",
    phone: "",
    headshotUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
    logoUrl: "",
    bio: "Kadir Bulsen specializes in modern urban lofts.",
    role: "partner"
  }
];

const seedPresets = [
    {
      name: "Services / Interior Photography Landing Page",
      category: "Media Showcase",
      description: "Premium landing page for Interior Photography utilizing custom asymmetric split layouts via Columns, explicit Image configurations, and interactive portfolios.",
      previewImage: "slate",
      puckData: {
        content: [
          {
            type: "Section",
            props: {
              padding: "py-32",
              background: "bg-transparent",
              layout: "full",
              spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" }
            },
            children: [
              {
                type: "Columns",
                props: {
                  leftColumnWidth: 45,
                  gap: 48,
                  spacing: { "pt": "0", "pb": "0", "mt": "0", "mb": "0" }
                },
                children: [
                  {
                    type: "FlexBox",
                    props: {
                      direction: "flex-col",
                      align: "items-start",
                      justify: "justify-center",
                      gap: 16
                    },
                    children: [
                      {
                        type: "Heading",
                        props: {
                          text: "THE ART OF THE INTERIOR",
                          level: 1,
                          sizeDesktop: "md:text-5xl",
                          sizeMobile: "text-3xl",
                          accent: true
                        }
                      },
                      {
                        type: "RichText",
                        props: {
                          content: "<p>Capturing architectural spaces through intentional balance, light, and symmetry. We deploy specialized multi-flash flambient methodologies to ensure spatial realities match raw aesthetic luxury.</p>",
                          size: "base"
                        }
                      }
                    ]
                  },
                  {
                     type: "Image",
                     props: {
                       url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
                       alt: "Luxury Interior Setup",
                       aspectRatio: "aspect-[4/5]",
                       objectFit: "object-cover",
                       rounded: "rounded-none"
                     }
                  }
                ]
              }
            ]
          }
        ],
        root: {
            props: { className: "" }
        }
      }
    }
];

async function run() {
  for (const partner of INITIAL_PARTNERS) {
    const docId = partner.email.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    console.log("Setting partner", docId);
    await setDoc(doc(db, "users", docId), {
      ...partner,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  for (const preset of seedPresets) {
    const docId = preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    console.log("Setting template", docId);
    await setDoc(doc(db, "puck_templates", docId), { 
      ...preset, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString() 
    });
  }

  console.log("Done");
  process.exit(0);
}

run();
