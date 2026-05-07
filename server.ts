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
