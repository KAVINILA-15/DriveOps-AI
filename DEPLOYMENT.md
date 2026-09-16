# DriveOps-AI Deployment Guide

This guide details how to deploy DriveOps-AI with both the **Frontend** and the **Backend Workflow (SNS Agent Workbench + Supabase Cloud)** fully connected.

---

## 1. Connected Architecture

DriveOps-AI is designed with cloud-native integrations:
- **Frontend SPA**: React 19 + Vite + TailwindCSS v4 + Wouter
- **AI Intelligence Backend**: SNS Agent Workbench Workflow (`https://api.agents.snsihub.ai/webhook/smart-manufacturing`)
  - Evaluates individual machine telemetry
  - Returns standardized manufacturing analysis JSON
  - Delivers real-time Telegram alerts
- **Auth & Database Backend**: Supabase Cloud (`https://csbwlzgmxjdshofhcjkc.supabase.co`)
  - User authentication & session management
  - Machine telemetry & alert persistence

Both backends are fully hosted, active, and accessible over HTTPS.

---

## 2. Deploy to Vercel (Recommended)

### Option A: Via GitHub (Continuous Deployment)
1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete DriveOps-AI with SNS Workbench and Supabase integration"
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
   | `VITE_SNS_WEBHOOK_URL` | `https://api.agents.snsihub.ai/webhook/smart-manufacturing` |
5. Click **Deploy**. Vercel will provision an instant live HTTPS link.

### Option B: Via Vercel CLI
1. Open PowerShell or Terminal in this folder and run:
   ```bash
   npx vercel login
   ```
   (Follow the prompt to authenticate in your browser)
2. Deploy to production:
   ```bash
   npx vercel --prod
   ```

---

## 3. Alternative: Netlify Drop (Instant Drag & Drop)

If you need a live production link in under 30 seconds without CLI setup:
1. Build the production package locally:
   ```bash
   npx pnpm --filter @workspace/driveops-ai build
   ```
2. Open [app.netlify.com/drop](https://app.netlify.com/drop) in your browser.
3. Drag and drop the folder:
   `artifacts/driveops-ai/dist/public`
4. Netlify will generate a live HTTPS URL immediately with client-side SPA routing already configured.

---

## 4. Local Production Preview
To verify the compiled production bundle locally:
```bash
$env:PORT="4173"; npx pnpm --filter @workspace/driveops-ai serve
```
Open: `http://localhost:4173`
