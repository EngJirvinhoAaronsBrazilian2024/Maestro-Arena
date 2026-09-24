import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import sportsRoutes from "./src/server/routes/sportsRoutes.js";
import quizRoutes from "./src/server/routes/quizRoutes.js";
import userRoutes from "./src/server/routes/userRoutes.js";
import tipsRoutes from "./src/server/routes/tipsRoutes.js";
import adminRoutes from "./src/server/routes/adminRoutes.js";
import storageRoutes from "./src/server/routes/storageRoutes.js";

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
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
