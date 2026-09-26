import express from "express";
import cors from "cors";

// Import route handlers directly, bypassing server.ts and Vite
import sportsRoutes from "../src/server/routes/sportsRoutes.js";
import quizRoutes from "../src/server/routes/quizRoutes.js";
import userRoutes from "../src/server/routes/userRoutes.js";
import tipsRoutes from "../src/server/routes/tipsRoutes.js";
import adminRoutes from "../src/server/routes/adminRoutes.js";
import storageRoutes from "../src/server/routes/storageRoutes.js";

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

// Export for Vercel Serverless
export default app;
