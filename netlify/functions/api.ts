import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';

// Import route handlers
import sportsRoutes from '../../src/server/routes/sportsRoutes.js';
import quizRoutes from '../../src/server/routes/quizRoutes.js';
import userRoutes from '../../src/server/routes/userRoutes.js';
import tipsRoutes from '../../src/server/routes/tipsRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/sports", sportsRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tips", tipsRoutes);

export const handler = serverless(app);
