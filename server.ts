import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory system logs for admin oversight
const systemLogs: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // DDF MLS Lookup Endpoint
  app.post("/api/ddf/lookup", async (req, res) => {
    try {
      const { mlsNumber } = req.body;
      if (!mlsNumber) {
        return res.status(400).json({ error: "MLS Number is required" });
      }

      const clientId = process.env.DDF_CLIENT_ID || "jsO4iysHFBpmMamciyq3v3bs";
      const clientSecret = process.env.DDF_CLIENT_SECRET || "DJyn2N83zaU8TWiNtSAuotKn";

      // 1. Get OAuth Token
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
      const accessToken = tokenData.access_token;

      // 2. Query Listing
      const listingUrl = `https://ddfapi.realtor.ca/odata/v1/property?$filter=ListingID eq '${mlsNumber}'`;
      const listingRes = await fetch(listingUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });

      if (!listingRes.ok) {
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

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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
