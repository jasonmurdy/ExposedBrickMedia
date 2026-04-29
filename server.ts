import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import compression from "compression";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory system logs for admin oversight
const systemLogs: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // 1. Gzip compression for faster payload delivery
  app.use(compression());

  // 2. Security & Trust Headers (SEO boost)
  app.use((req, res, next) => {
    // Canonical Domain Redirect (Ensures exposedbrickmedia.ca is the primary URL)
    const host = req.get("host") || "";
    const forwardedHost = req.get("x-forwarded-host") || "";
    const isRunApp = host.includes(".run.app") || forwardedHost.includes(".run.app");
    
    if (process.env.NODE_ENV === "production" && isRunApp && !req.path.startsWith("/api/health")) {
      return res.redirect(301, `https://exposedbrickmedia.ca${req.originalUrl}`);
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });

  // API Route: System Logging
  app.post("/api/admin/logs", async (req, res) => {
    const { action, details, user } = req.body;
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      user
    };
    systemLogs.push(logEntry);
    if (systemLogs.length > 100) systemLogs.shift(); // Keep last 100 logs
    res.json({ success: true });
  });

  app.get("/api/admin/logs", (req, res) => {
    // Simple protection - in a real app check auth headers
    res.json(systemLogs.slice().reverse());
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- DDF Token Caching ---
  let cachedDdfToken: string | null = null;
  let ddfTokenExpirationTime: number = 0;

  // DDF MLS Lookup Endpoint
  app.post("/api/ddf/lookup", async (req, res) => {
    try {
      const { mlsNumber } = req.body;
      if (!mlsNumber) {
        return res.status(400).json({ error: "MLS Number is required" });
      }

      const clientId = process.env.DDF_CLIENT_ID || "jsO4iysHFBpmMamciyq3v3bs";
      const clientSecret = process.env.DDF_CLIENT_SECRET || "DJyn2N83zaU8TWiNtSAuotKn";

      const now = Date.now();

      // 1. Check if we need a new token (if it doesn't exist or has expired)
      if (!cachedDdfToken || now >= ddfTokenExpirationTime) {
        console.log("Fetching new DDF token...");
        // Fetch a new token
        const tokenRes = await fetch("https://identity.crea.ca/connect/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            scope: "DDFApi_Read"
          }).toString()
        });

        if (!tokenRes.ok) {
          throw new Error(`Failed to get CREA token: ${tokenRes.statusText}`);
        }

        const tokenData = await tokenRes.json();
        cachedDdfToken = tokenData.access_token;

        // Calculate expiration: use provided expires_in (usually 3600s), default to 1hr if missing
        // Subtract 60 seconds (60000ms) as a safety buffer
        const expiresInMs = (tokenData.expires_in || 3600) * 1000;
        ddfTokenExpirationTime = now + expiresInMs - 60000;
      }

      // 2. Query Listing using the cached (or newly generated) token
      const listingUrl = `https://ddfapi.realtor.ca/odata/v1/property?$filter=ListingID eq '${mlsNumber}'`;
      const listingRes = await fetch(listingUrl, {
        headers: {
          Authorization: `Bearer ${cachedDdfToken}`, // Use the cached token here
        }
      });

      if (!listingRes.ok) {
        // Optional: If you get a 401 Unauthorized, it might mean the cache got out of sync.
        if (listingRes.status === 401) {
          cachedDdfToken = null; // force refresh on next try
        }
        throw new Error(`Failed to fetch listing: ${listingRes.statusText}`);
      }

      const listingData = await listingRes.json();
      
      if (!listingData.value || listingData.value.length === 0) {
        return res.status(404).json({ error: "Listing not found" });
      }

      res.json(listingData.value[0]);
    } catch (error: any) {
      console.error("MLS Lookup error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch MLS listing" });
    }
  });

  // Local Caching for Performance (Behold.so API)
  let cachedSocialFeed: any = null;
  let lastFetchTime = 0;
  const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

  app.get("/api/social-feed", async (req, res) => {
    const now = Date.now();
    if (cachedSocialFeed && (now - lastFetchTime < CACHE_DURATION)) {
      return res.json(cachedSocialFeed);
    }
    try {
      const beholdUrl = process.env.BEHOLD_SERVER_URL;
      if (!beholdUrl) {
        // Return 404 instead of throwing error to avoid "Social feed error" logs
        return res.status(404).json({ error: "BEHOLD_SERVER_URL not configured" });
      }
      
      const response = await fetch(beholdUrl);
      if (!response.ok) throw new Error(`Behold API returned ${response.status}`);
      
      const data = await response.json();
      cachedSocialFeed = data;
      lastFetchTime = now;
      res.json(data);
    } catch (error) {
      if (cachedSocialFeed) {
        return res.json(cachedSocialFeed);
      }
      res.status(503).json({ error: "Social feed temporarily unavailable" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Aggressively cache static assets (JS, CSS, images) for 1 year
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true
    }));

    // Standard static serving for the rest
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
