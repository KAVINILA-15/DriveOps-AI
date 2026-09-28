# DriveOps-AI Deployment Guide

This guide details how to deploy DriveOps-AI with both the **Frontend** and the **DriveOps-AI Intelligence Backend** fully connected.

---

## 1. Connected Architecture

DriveOps-AI operates as a cohesive manufacturing intelligence solution:
- **Frontend SPA**: React 19 + Vite + TailwindCSS v4 + Wouter
- **AI Intelligence Backend**: DriveOps-AI Express Backend (`/api`)
  - Evaluates individual machine telemetry across Machine, Production, and Quality vectors
  - Returns standardized manufacturing analysis JSON
  - Generates and stores alerts with automated severity classification
  - Modular AI LLM integration (Google Gemini / OpenAI)
- **Auth & Database Backend**: Supabase Cloud (`https://csbwlzgmxjdshofhcjkc.supabase.co`) / PostgreSQL
  - User authentication & session management
  - Machine telemetry & alert persistence
  - Resilient local fallback when offline

---

## 2. Deploy Frontend to Vercel

### Option A: Via GitHub (Continuous Deployment)
1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete DriveOps-AI backend migration and frontend connection"
   git push origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Configure the build settings (already preset via `vercel.json`):
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or `artifacts/driveops-ai`)
   - **Build Command**: `pnpm --filter @workspace/driveops-ai build`
   - **Output Directory**: `artifacts/driveops-ai/dist/public`
4. Add the following **Environment Variables**:
   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://csbwlzgmxjdshofhcjkc.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `sb_publishable_1Ri7HFtIGynLCPkAQtVB2Q_FjLVLiCx` |
   | `VITE_BACKEND_URL` | `https://your-driveops-backend-domain.com` |
5. Click **Deploy**. Vercel will provision an instant live HTTPS link.

---

## 3. Deploy Backend (Node.js / Docker / Cloud Run / Railway / Render)

The backend is packaged under `backend/` and `artifacts/api-server`.

### Running with Node.js
```bash
# Set environment
export PORT=5000
export NODE_ENV=production
export DATABASE_URL="your-postgresql-connection-string"
export GEMINI_API_KEY="your-gemini-api-key"

# Build and start
npm run dev:backend
# Or: node artifacts/api-server/dist/index.mjs
```

---

## 4. Local Production Preview

To verify the compiled production bundle locally:
1. Build both frontend and backend:
   ```bash
   node artifacts/api-server/build.mjs
   pnpm --filter @workspace/driveops-ai build
   ```
2. Run backend:
   ```bash
   $env:PORT="5000"; node artifacts/api-server/dist/index.mjs
   ```
3. Run frontend preview:
   ```bash
   $env:PORT="4173"; npx pnpm --filter @workspace/driveops-ai serve
   ```
   Open `http://localhost:4173`.
