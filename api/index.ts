import express from "express";
import cors from "cors";

// Import route handlers directly, bypassing server.ts and Vite
import sportsRoutes from "../src/server/routes/sportsRoutes.js";
import quizRoutes from "../src/server/routes/quizRoutes.js";
import userRoutes from "../src/server/routes/userRoutes.js";
import tipsRoutes from "../src/server/routes/tipsRoutes.js";
import adminRoutes from "../src/server/routes/adminRoutes.js";
import storageRoutes from "../src/server/routes/storageRoutes.js";
import h2hRoutes from "../src/server/routes/h2hRoutes.js";
import scorebatRoutes from "../src/server/routes/scorebatRoutes.js";
import fotmobRoutes from "../src/server/routes/fotmobRoutes.js";
import besoccerRoutes from "../src/server/routes/besoccerRoutes.js";

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
app.use("/api/scorebat", scorebatRoutes);
app.use("/api/fotmob", fotmobRoutes);
app.use("/api/besoccer", besoccerRoutes);

app.use("/_next", async (req, res, next) => {
  try {
    const assetUrl = `https://www.fotmob.com/_next${req.url}`;
    const resp = await fetch(assetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*"
      }
    });
    if (!resp.ok) return next();
    const contentType =
      resp.headers.get("content-type") ||
      (req.url.endsWith(".js")
        ? "application/javascript"
        : req.url.endsWith(".css")
        ? "text/css"
        : "application/octet-stream");
    const arrayBuf = await resp.arrayBuffer();
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(Buffer.from(arrayBuf));
  } catch {
    return next();
  }
});

app.use("/image_resources", async (req, res, next) => {
  try {
    const targetUrl = `https://images.fotmob.com/image_resources${req.url}`;
    const resp = await fetch(targetUrl);
    if (!resp.ok) return next();
    const contentType = resp.headers.get("content-type") || "image/png";
    const arrayBuf = await resp.arrayBuffer();
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(Buffer.from(arrayBuf));
  } catch {
    return next();
  }
});

// Export for Vercel Serverless
export default app;
