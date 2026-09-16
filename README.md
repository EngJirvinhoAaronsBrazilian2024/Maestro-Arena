# Maestro Arena - Vercel Deployment Guide

This is a production-ready sports application designed for high-performance deployment on Vercel.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Express Serverless API
- Database & Auth: InsForge (PostgreSQL BaaS)
- External APIs: API-Sports, Gemini AI

## Running Locally

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

4. **Production Build (Local Verification)**
   ```bash
   npm run build
   npm start
   ```

## Deploying to Vercel

This project is configured out-of-the-box for zero-downtime deployment on Vercel. 
The `vercel.json` and `api/index.ts` files automatically proxy API calls to the serverless Express backend.

### Step 1: Connect your GitHub Repository
1. Push this code to a GitHub repository.
2. Log into your [Vercel Dashboard](https://vercel.com/).
3. Click **Add New...** -> **Project**.
4. Import your GitHub repository.

### Step 2: Configure Build Settings
Vercel should automatically detect the framework as **Vite**.
Leave the defaults as they are:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Add Environment Variables
In the Vercel deployment screen, expand the **Environment Variables** section and add the required keys exactly as they appear in `.env.example`:

- `GEMINI_API_KEY` (Your Google Gemini AI API key)
- `SPORTS_API_KEY` (Your API-Sports API key)
- `SPORTS_API_URL` (Set to `https://v3.football.api-sports.io`)
- `VITE_INSFORGE_URL` (Your InsForge project URL)
- `VITE_INSFORGE_ANON_KEY` (Your InsForge anon/public key)
- `INSFORGE_API_KEY` (Your InsForge service_role/admin key)

*Note: Ensure the `INSFORGE_API_KEY` (service role) is **not** prefixed with `VITE_`, as it is kept secure on the backend.*

### Step 4: Deploy
Click **Deploy**. Vercel will build the static frontend into `dist/` and automatically deploy `api/index.ts` as a serverless Node.js function.

### Troubleshooting
- **404 on page refresh**: This is automatically resolved by the `vercel.json` rewrites rules.
- **Failed API Calls**: Double-check that your `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY` variables are deployed. Remember that Vercel requires a re-deploy if you add environment variables after the build.
- **Database Access Errors**: Make sure your InsForge row-level security (RLS) policies are correctly configured.

## Architecture & Security
- **Secure Backend Integration:** API routes (`/api/*`) are heavily utilized to keep secret keys out of client-side bundles.
- **Serverless Scaling:** Handled natively through Vercel's Edge/Serverless functions mechanism pointing to `api/index.ts`.
