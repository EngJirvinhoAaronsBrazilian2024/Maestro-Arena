import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';

// Import route handlers
import matchRoutes from '../../src/server/routes/matchRoutes.js';
import sportsRoutes from '../../src/server/routes/sportsRoutes.js';
import quizRoutes from '../../src/server/routes/quizRoutes.js';
import userRoutes from '../../src/server/routes/userRoutes.js';
import tipsRoutes from '../../src/server/routes/tipsRoutes.js';
import adminRoutes from '../../src/server/routes/adminRoutes.js';
import storageRoutes from '../../src/server/routes/storageRoutes.js';
import h2hRoutes from '../../src/server/routes/h2hRoutes.js';
import scorebatRoutes from '../../src/server/routes/scorebatRoutes.js';
import fotmobRoutes from '../../src/server/routes/fotmobRoutes.js';
import besoccerRoutes from '../../src/server/routes/besoccerRoutes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Normalize incoming request path for Netlify (Netlify :splat strips /api/)
app.use((req, res, next) => {
  if (req.url.startsWith("/api/")) {
    // Already prefixed
  } else if (req.url === "/api") {
    req.url = "/api/";
  } else if (!req.url.startsWith("/_next") && !req.url.startsWith("/image_resources")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});

// API Routes
app.use("/api/matches", matchRoutes);
app.use("/api/football-data/matches", matchRoutes);
app.use("/api/sports", sportsRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tips", tipsRoutes);
app.use("/api/admin", adminRoutes);

// Activity logs log endpoint
app.post("/api/activity/log", (req, res, next) => {
  req.url = "/activity-logs";
  adminRoutes(req, res, next);
});

// Articles / News public and admin API proxy
app.all("/api/articles", (req, res, next) => {
  req.url = "/articles";
  adminRoutes(req, res, next);
});
app.all("/api/articles/:id", (req, res, next) => {
  req.url = `/articles/${req.params.id}`;
  adminRoutes(req, res, next);
});
app.all("/api/news/articles", (req, res, next) => {
  req.url = "/articles";
  adminRoutes(req, res, next);
});
app.all("/api/news/articles/:id", (req, res, next) => {
  req.url = `/articles/${req.params.id}`;
  adminRoutes(req, res, next);
});
app.all("/api/news/auto-sync", (req, res, next) => {
  req.url = "/news/auto-sync";
  adminRoutes(req, res, next);
});
app.use("/api/feedback", (req, res, next) => {
  req.url = '/feedback' + (req.url === '/' ? '' : req.url);
  adminRoutes(req, res, next);
});

app.use("/api/storage", storageRoutes);
app.use("/api/h2h", h2hRoutes);
app.use("/api/scorebat", scorebatRoutes);
app.use("/api/fotmob", fotmobRoutes);
app.use("/api/besoccer", besoccerRoutes);

// Proxy FotMob dynamic data & API endpoints
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
  } catch {
    return next();
  }
});

export const handler = serverless(app);
