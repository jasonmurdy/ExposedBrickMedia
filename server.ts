import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import compression from "compression";
import * as sib from "@getbrevo/brevo";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// ES Module path helper (only used for ES environment reference if needed)
let localFilename = "";
let localDirname = "";
try {
  localFilename = fileURLToPath(import.meta.url);
  localDirname = path.dirname(localFilename);
} catch (e) {
  // CommonJS context - __filename and __dirname are globally provided
}

// In-memory system logs for admin oversight
const systemLogs: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" ? new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  app.use(express.json());

  app.post("/api/ai/generate-layout", async (req, res) => {
    const { prompt } = req.body;
    
    if (!genAI) {
      return res.status(503).json({ error: "Gemini API key is not configured. Please add your valid GEMINI_API_KEY in the Secrets panel." });
    }

    try {
      const systemInstruction = `You are an expert web page layout generator for a high-end real estate media agency website named "Exposed Brick Media".
You generate layouts for the Puck visual drag-and-drop editor.
You must return a strict JSON object that exactly matches the Puck visual builder Data schema.

The JSON MUST have this precise shape:
{
  "content": [],
  "root": {
    "props": {
      "title": "Page Title",
      "description": "Page description for SEO",
      "layoutMode": "one-panel",
      "main": [],
      "side": []
    }
  }
}

Rules:
1. Set "layoutMode" to either "one-panel" (full width, standard for subpages) or "two-panel" (classic split: narrow left side column, wide right content area).
- If "layoutMode" is "two-panel", put elements like brand TextContent, Services lists, and Contact booking forms in the "side" slot array, and Hero banner, Portfolio, testimonials in the "main" slot array.
- If "layoutMode" is "one-panel", place all layout components sequentially inside the "main" slot array ("side" should be an empty list []).

Available Puck components (use their exact string types in lowercase/PascalCase as shown):

1. Hero
   Props:
   - "id": unique string ID
   - "imageUrl": custom cover image URL (optional)
   - "height": "short" | "medium" | "tall"
   - "width": "full" | "half"

2. CinematicHero
   Props:
   - "id": unique string ID
   - "title": uppercase bold text heading
   - "subtitle": narrative description tagline
   - "mediaUrl": string URL for video or background image
   - "mediaType": "video" | "image"
   - "ctaText": Button action label (optional)
   - "ctaUrl": Destination path (optional)

3. TextContent
   Props:
   - "id": unique string ID
   - "showLogo": boolean (true/false)
   - "title1": main title word 1 (e.g., "EXPOSED")
   - "title2": main title word 2 (e.g., "BRICK")
   - "accent": accent suffix word (e.g., "MEDIA")
   - "tagline": bold tracking tagline text
   - "width": "full" | "half"

4. Services
   Props:
   - "id": unique string ID
   - "title": main heading (e.g., "SERVICES")
   - "subtitle": descriptive subtext
   - "width": "full" | "half"

5. Portfolio
   Props:
   - "id": unique string ID
   - "variant": "grid" | "gallery"
   - "panel": "main" | "side" (matches where it is placed)
   - "limit": number of items to show
   - "showFilter": boolean

6. Contact (This is the Booking Form)
   Props:
   - "id": unique string ID
   - "title": booking call to action title (e.g. "BOOK A SESSION")
   - "description": description subtext

7. Columns (Two column container element)
   Props:
   - "id": unique string ID
   - "leftColumnWidth": number (10 to 90, default 50)
   - "gap": gap size in pixels
   - "left": array of components to wrap inside the left slot
   - "right": array of components to wrap inside the right slot

8. Section (Row level wrapper card)
   Props:
   - "id": unique string ID
   - "background": "bg-transparent" | "bg-bg-primary" | "bg-bg-secondary" | "bg-charcoal text-white"
   - "layout": "boxed" | "full"
   - "padding": "py-8" | "py-16" | "py-32"
   - "columns": "max-w-4xl mx-auto" | "grid grid-cols-1 lg:grid-cols-2 gap-16" | "w-full"
   - "children": slot array of child components wrapped inside the section container

9. Heading
   Props:
   - "id": unique string ID
   - "text": headline text
   - "level": 1 | 2 | 3 | 4
   - "align": "left" | "center" | "right"
   - "accent": boolean (highlight color accent)

10. RichText
    Props:
    - "id": unique string ID
    - "content": markdown HTML paragraph content string
    - "size": "sm" | "base" | "lg"

11. Testimonials
    Props:
    - "id": unique string ID
    - "maxItems": number

12. Spacer
    Props:
    - "id": unique string ID
    - "size": height height offset in pixels (0-200)

13. Footer
    Props:
    - "id": unique string ID
    - "quote": aesthetic signature string

Make sure every component in the returned JSON has a unique "id" string generated via random alphanumeric keys (e.g. "hero-9828"). Ensure the JSON matches this structural output perfectly. Avoid code comments or formatting wrappers inside the JSON raw text. Only return the parsed JSON.`;

      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("No text generated");
      
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      
      const parsed = JSON.parse(cleanedText);
      res.json(parsed);
    } catch (error: any) {
      console.error("AI Generate Layout Error:", error);
      let errorMessage = "Failed to generate layout";
      if (error.status === 400 || error.message?.includes("API key")) {
         errorMessage = "API key not valid. Please configure a valid GEMINI_API_KEY in your Secrets panel.";
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  
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
  app.post("/api/ai/chat", async (req, res) => {
    const { prompt, history, systemInstruction, context } = req.body;
    
    if (!genAI) {
      return res.status(503).json({ error: "Gemini API key is not configured. Please add your valid GEMINI_API_KEY in the Secrets panel." });
    }

    try {
      const chatHistory = Array.isArray(history) ? history.map((h: any) => ({
        role: h.role,
        parts: h.parts.map((p: any) => ({ text: p.text }))
      })) : [];

      const finalPrompt = context ? `${prompt}\n\nContext: ${context}` : prompt;

      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: finalPrompt }] }
        ],
        config: {
          systemInstruction: systemInstruction || "You are a helpful assistant.",
        }
      });
      
      res.json({ text: response.text || "No response received." });
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
