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
