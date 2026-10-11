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

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API Routes
app.use("/api/matches", matchRoutes);
app.use("/api/football-data/matches", matchRoutes);
app.use("/api/sports", sportsRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tips", tipsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/h2h", h2hRoutes);
app.use("/api/scorebat", scorebatRoutes);

export const handler = serverless(app);
