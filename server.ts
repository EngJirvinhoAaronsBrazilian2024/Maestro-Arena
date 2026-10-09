import express from "express";
import path from "path";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import sportsRoutes from "./src/server/routes/sportsRoutes.js";
import quizRoutes from "./src/server/routes/quizRoutes.js";
import userRoutes from "./src/server/routes/userRoutes.js";
import tipsRoutes from "./src/server/routes/tipsRoutes.js";
import adminRoutes from "./src/server/routes/adminRoutes.js";
import storageRoutes from "./src/server/routes/storageRoutes.js";
import h2hRoutes from "./src/server/routes/h2hRoutes.js";
import scorebatRoutes from "./src/server/routes/scorebatRoutes.js";
import fotmobRoutes from "./src/server/routes/fotmobRoutes.js";
import besoccerRoutes from "./src/server/routes/besoccerRoutes.js";
import { registerMatchSocket } from "./src/server/services/h2hManager.js";

// Clean up tsx injected relative globals which break Vite ESM plugins (like vite-plugin-pwa)
if (typeof (globalThis as any).__dirname !== "undefined") {
  delete (globalThis as any).__dirname;
}
if (typeof (globalThis as any).__filename !== "undefined") {
  delete (globalThis as any).__filename;
}

// Prevent unhandled WebSocket port conflict exceptions from crashing the process
process.on("uncaughtException", (err: any) => {
  if (err?.code === "EADDRINUSE" && (err?.port === 24678 || String(err?.message || "").includes("24678"))) {
    console.warn("Handled HMR port 24678 notice (non-fatal):", err?.message || err);
    return;
  }
  console.error("Uncaught exception in server process:", err);
});

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API Routes
app.use("/api/sports", sportsRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tips", tipsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", (req, res, next) => {
  req.url = '/feedback' + (req.url === '/' ? '' : req.url);
  adminRoutes(req, res, next);
});
app.use("/api/storage", storageRoutes);
app.use("/api/h2h", h2hRoutes);
app.use("/api/scorebat", scorebatRoutes);
app.use("/api/fotmob", fotmobRoutes);
app.use("/api/besoccer", besoccerRoutes);

// Proxy FotMob dynamic data & API endpoints (translationmapping, data, leagues, matches, search, player, etc.)
// so all league tabs, tables, fixtures and matches load client-side with zero issues
app.use("/api", async (req, res, next) => {
  try {
    const targetUrl = `https://www.fotmob.com/api${req.url}`;
    const resp = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: resp.statusText });
    }
    const contentType = resp.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=60");
    const data = await resp.text();
    return res.send(data);
  } catch (err: any) {
    return next();
  }
});

// Forward FotMob Next.js static assets and image resources so client-side hydration always succeeds
const fotmobAssetCache = new Map<string, { buffer: Buffer; contentType: string }>();

app.use("/_next", async (req, res, next) => {
  try {
    const assetUrl = `https://www.fotmob.com/_next${req.url}`;
    const cached = fotmobAssetCache.get(assetUrl);
    if (cached) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
      return res.send(cached.buffer);
    }

    const resp = await fetch(assetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*"
      }
    });

    if (!resp.ok) {
      return next();
    }

    const contentType =
      resp.headers.get("content-type") ||
      (req.url.endsWith(".js")
        ? "application/javascript"
        : req.url.endsWith(".css")
        ? "text/css"
        : "application/octet-stream");

    const arrayBuf = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (fotmobAssetCache.size < 600) {
      fotmobAssetCache.set(assetUrl, { buffer, contentType });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(buffer);
  } catch {
    return next();
  }
});

app.get("/theme.js", async (req, res, next) => {
  try {
    const resp = await fetch("https://www.fotmob.com/theme.js", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });
    if (!resp.ok) return next();
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    const text = await resp.text();
    return res.send(text);
  } catch {
    return next();
  }
});

app.use("/image_resources", async (req, res, next) => {
  try {
    const targetUrl = `https://images.fotmob.com/image_resources${req.url}`;
    const cached = fotmobAssetCache.get(targetUrl);
    if (cached) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
      return res.send(cached.buffer);
    }

    const resp = await fetch(targetUrl);
    if (!resp.ok) return next();

    const contentType = resp.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await resp.arrayBuffer());

    if (fotmobAssetCache.size < 600) {
      fotmobAssetCache.set(targetUrl, { buffer: buf, contentType });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(buf);
  } catch {
    return next();
  }
});

// In-app FotMob routing so clicking internal links/tabs inside FotMob stays inside the proxy
app.use(["/leagues", "/matches", "/teams", "/players"], (req, res, next) => {
  if (req.headers.accept?.includes("text/html")) {
    return res.redirect(`/api/fotmob/proxy?path=${encodeURIComponent(req.originalUrl)}`);
  }
  return next();
});

async function startServer() {
  let PORT = 3000;
  const portArgIdx = process.argv.indexOf("--port");
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    PORT = parseInt(process.argv[portArgIdx + 1], 10);
  } else if (process.env.DEFAULT_APP_PORT) {
    PORT = parseInt(process.env.DEFAULT_APP_PORT, 10);
  } else if (process.env.PORT && process.env.PORT !== "8080") {
    PORT = parseInt(process.env.PORT, 10);
  } else if (process.env.NODE_ENV === "production" && process.env.PORT) {
    PORT = parseInt(process.env.PORT, 10);
  }

  const server = http.createServer(app);

  // WebSocket Server for Head-to-Head real-time synchronization
  const wss = new WebSocketServer({ server, path: "/ws/h2h" });
  wss.on("error", (err: any) => {
    console.warn("WebSocketServer error (handled):", err?.message || err);
  });
  wss.on("connection", (ws, req) => {
    try {
      const url = new URL(req.url || "", `http://${req.headers.host || 'localhost'}`);
      const matchId = url.searchParams.get("matchId");
      const userId = url.searchParams.get("userId") || undefined;
      if (matchId) {
        registerMatchSocket(matchId, ws, userId);
      }
    } catch (e) {
      console.warn("WebSocket connection parse notice:", e);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { server }
      },
      appType: "spa",
    });
    if (vite.ws) {
      vite.ws.on("error", (err: any) => {
        console.warn("Vite WebSocket notice (handled):", err?.message || err);
      });
    }
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (HTTP & WebSocket)`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${PORT} is already in use.`);
    } else {
      console.error("Server error:", err);
    }
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

export default app;
