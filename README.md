# Maestro Arena - Netlify Deployment Guide

This is a production-ready sports application designed for high-performance deployment on Netlify.

## Tech Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Express Serverless API wrapped with `serverless-http`
- Database & Auth: InsForge (PostgreSQL BaaS)
- External APIs: API-Sports, Gemini AI

## 1. Running Locally
1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Configure Environment Variables**
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your API keys (InsForge, Gemini, and API-Sports).
3. **Start Development Server**
   ```bash
   npm run dev
   ```

## 2. Production Build (Local Verification)
1. **Build the Application**
   ```bash
   npm run build
   ```
   This compiles the React frontend into the `dist/` directory using Vite.
2. **Type Check**
   ```bash
   npm run lint
   ```

## 3. GitHub Preparation
1. Make sure your `.gitignore` is intact and does not commit your `.env`, `.env.local`, or `.env.production` files.
2. Push your project to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure for Netlify Deployment"
   git push origin main
   ```

## 4. Deploying to Netlify
This project uses `netlify.toml` and a custom `netlify/functions/api.ts` file to wrap the Express backend correctly, bypassing complex and error-prone module bundlers.

1. Go to [Netlify](https://www.netlify.com/) and log in with GitHub.
2. Click **Add new site** -> **Import an existing project**.
3. Select your GitHub repository.
4. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Functions**: Handled via `netlify/functions/api.ts`

### 5. Environment Variables
Before clicking Deploy, click **Environment variables** (or **Show Advanced**) and add the exact variables from `.env.example`.

**Frontend-Safe Variables** (publicly exposed to browser):
- `VITE_INSFORGE_URL`
- `VITE_INSFORGE_ANON_KEY`

**Server-Only Variables** (PRIVATE, DO NOT expose with `VITE_`):
- `SPORTS_API_KEY` (Your API-Sports API key)
- `SPORTS_API_URL` (Set to `https://v3.football.api-sports.io`)
- `GEMINI_API_KEY` (Your Google Gemini AI API key)
- `INSFORGE_API_KEY` (Your InsForge service_role/admin key)

### 6. Redeploying
If you update environment variables in the Netlify dashboard after the initial deployment, you must trigger a manual redeploy for them to take effect.
Go to **Deploys** -> **Trigger deploy** -> **Deploy site**.

### 7. Troubleshooting Live Scores API Failures
If Live Scores fail to load in production:
1. Open the Network tab in your browser's Developer Tools.
2. Check the response for `/api/sports/live`.
3. If it returns an empty array `[]`, there are simply no live matches occurring right now.
4. If it returns an error related to rate limits, verify your API-Sports quota. The Netlify Function securely proxies your request and attaches your `SPORTS_API_KEY` on the backend, preventing quota abuse or key leakage.
