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
app.use("/api/storage", storageRoutes);
app.use("/api/h2h", h2hRoutes);

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
      if (matchId) {
        registerMatchSocket(matchId, ws);
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
