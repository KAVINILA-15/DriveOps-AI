# DriveOps-AI

AI-powered manufacturing command center that ingests machine telemetry, evaluates it with an AI agent, and delivers real-time alerts.

**Live demo:** [https://driveops-ai.vercel.app](https://drive-ops-ai-driveops-ai-iw9i.vercel.app/)

---

## Overview

DriveOps-AI is a React single-page application for smart manufacturing operations. Operators can upload or stream machine telemetry (CSV or manual records), have each record evaluated by an AI workflow, and monitor live machine status, production, quality, and alerts across a fleet of stations.

The system is fully connected to cloud backends:

- **SNS Agent Workbench workflow** — evaluates individual machine telemetry and returns a standardized manufacturing analysis JSON (`https://api.agents.snsihub.ai/webhook/smart-manufacturing`)
- **Supabase Cloud** — user authentication, session management, and machine telemetry / alert persistence
- **Telegram alerts** — real-time notifications triggered by the AI workflow when anomalies are detected

## Features

- **Command Center** — fleet-wide dashboard with live metrics, trends, and statuses
- **Data Intake** — upload machine telemetry as CSV or enter records manually for AI evaluation
- **Production & Machines** — track lines, stations, cycle quality, and health
- **Quality & Alerts** — defect tracking, severity-based alerting, and alert acknowledgment
- **Insights & Reports** — AI-generated analysis with recommended actions
- **Auth** — Supabase-powered sign-in / sign-up with route protection
- **Fallback resilience** — the app keeps working locally with seed data if Supabase or the AI webhook are unreachable

## Tech Stack

- **Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS v4, Wouter
- **State/Data:** TanStack Query, React Hook Form, Recharts
- **Backend:** SNS Agent Workbench (AI webhook) + Supabase Cloud
- **Validation:** Zod
- **Deployment:** Vercel (`vercel.json` build preset)

## Architecture

```
Browser (React SPA)
   ├── Supabase Auth ───────────────► Supabase Cloud (auth, alerts, telemetry)
   └── Upload/Telemetry ────────────► SNS Agent Workbench webhook
                                          │  analysis JSON + Telegram alerts
                                          ▼
                                  Dashboard / Alerts / Insights
```

The [DEPLOYMENT.md](./DEPLOYMENT.md) guide describes the connected architecture in detail.

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+

### Install

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` (in `artifacts/driveops-ai/`):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SNS_WEBHOOK_URL=https://api.agents.snsihub.ai/webhook/smart-manufacturing
```

### Run locally

```bash
pnpm --filter @workspace/driveops-ai run dev
```

The app runs at `http://localhost:5173`.

### Typecheck & build

```bash
pnpm run typecheck   # typecheck all packages
pnpm run build       # typecheck + build
```

## Deploying

The project ships with Vercel and Netlify configuration. See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions (GitHub + Vercel, Vercel CLI, or Netlify Drop).

## Repository Layout

```
artifacts/
  driveops-ai/          # React frontend (Vite SPA)
    src/
      pages/            # Auth, Upload, Settings, 404
      services/         # snsService, supabaseService, authService
      contexts/         # AuthContext, ManufacturingContext
      components/       # UI + feature components
      lib/              # Supabase client, driveops seed service
  api-server/           # Express API server (workspace package)
  mockup-sandbox/       # Design/experimental sandbox
scripts/                # Shared scripts
```
