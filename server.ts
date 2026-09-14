import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import sportsRoutes from "./src/server/routes/sportsRoutes.js";
import quizRoutes from "./src/server/routes/quizRoutes.js";
import userRoutes from "./src/server/routes/userRoutes.js";
import tipsRoutes from "./src/server/routes/tipsRoutes.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use("/api/sports", sportsRoutes);
  app.use("/api/quiz", quizRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/tips", tipsRoutes);

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
