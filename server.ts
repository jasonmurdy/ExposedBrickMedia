import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import compression from "compression";
import * as sib from "@getbrevo/brevo";
import { GoogleGenAI } from "@google/genai";

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
    
    /* 
    // Commented out to prevent breaking AI Studio preview. 
    // Cloud Run sets NODE_ENV=production by default, which triggers this redirect in the preview.
    if (process.env.NODE_ENV === "production" && isRunApp && !req.path.startsWith("/api/")) {
      return res.redirect(301, `https://exposedbrickmedia.ca${req.originalUrl}`);
    }
    */

    res.setHeader("X-Content-Type-Options", "nosniff");
    // res.setHeader("X-Frame-Options", "DENY"); // Breaks preview in AI Studio
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

  // Brevo Email Integration
  const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn("BREVO_API_KEY not configured. Email not sent.");
      return { success: false, error: "BREVO_API_KEY missing" };
    }

    try {
      const brevo = new sib.BrevoClient({
        apiKey: apiKey,
      });

      const data = await brevo.transactionalEmails.sendTransacEmail({
        subject: subject,
        htmlContent: htmlContent,
        sender: { name: "Exposed Brick Media", email: "info@exposedbrickmedia.ca" },
        to: [{ email: to }]
      });

      console.log('Email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };

  app.post("/api/send-email", async (req, res) => {
    const { to, subject, body, type } = req.body;
    
    // Construct HTML content based on type or just use body
    let htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #c43b2a;">Exposed Brick Media</h2>
        <div style="margin-top: 20px; line-height: 1.6;">
          ${body}
        </div>
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #888;">
          This is an automated notification from Exposed Brick Media.
        </div>
      </div>
    `;

    const result = await sendEmail(to || "jasonmurdy@gmail.com", subject, htmlContent);
    res.json(result);
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

  // 5. AI Suggestions Proxy (Gemini)
  const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

  app.post("/api/ai/chat", async (req, res) => {
    const { prompt, history, systemInstruction, context } = req.body;
    
    if (!genAI) {
      return res.status(503).json({ error: "AI services not configured" });
    }

    try {
      const chatHistory = Array.isArray(history) ? history.map((h: any) => ({
        role: h.role,
        parts: h.parts.map((p: any) => ({ text: p.text }))
      })) : [];

      const finalPrompt = context ? `${prompt}\n\nContext: ${context}` : prompt;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: finalPrompt }] }
        ],
        config: {
          systemInstruction: systemInstruction || "You are a helpful assistant.",
        }
      });
      
      res.json({ text: response.candidates?.[0]?.content?.parts?.[0]?.text || "No response received." });
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  // 6. PDF Proxy (To bypass CORS for remote assets)
  app.get("/api/pdf-proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).send("URL required");
    
    try {
      console.log(`[PDF Proxy] Fetching: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/pdf, */*",
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PDF Proxy] Upstream Error (${response.status}): ${errorText.substring(0, 500)}`);
        return res.status(response.status).send(`Upstream Error: ${response.statusText}`);
      }
      
      const contentType = response.headers.get("content-type");
      console.log(`[PDF Proxy] Source Content-Type: ${contentType}`);
      
      if (contentType) res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Content-Disposition", "inline");
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`[PDF Proxy] Sending ${buffer.length} bytes`);
      res.send(buffer);
    } catch (error) {
      console.error("[PDF Proxy] Fatal Error:", error);
      res.status(500).send("Error retrieving document during archival retrieval.");
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
