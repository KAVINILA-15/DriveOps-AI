# DriveOps-AI — Smart Car Manufacturing & Production Intelligence

AI-powered manufacturing command center that ingests machine telemetry, analyzes operating parameters through a dedicated intelligence engine, and delivers real-time plant alerts.

**Live demo:** [https://driveops-ai.vercel.app](https://drive-ops-ai-driveops-ai-iw9i.vercel.app/)

---

## Overview

DriveOps-AI is a high-reliability smart manufacturing operations platform. Operators can upload or stream machine telemetry (JSON or CSV), have each record evaluated by the built-in AI Analysis Engine across Machine Health, Production Performance, and Quality Control, and monitor real-time machine status, line throughput, and alerts.

The architecture connects the frontend directly to the dedicated **DriveOps-AI Backend**:

- **DriveOps-AI Backend** (`/api`) — Node.js & Express service with modular Machine, Production, Quality, and Overall Manufacturing Intelligence engines, automated alert generation, and AI LLM reasoning.
- **Database Layer** — Supabase Cloud / PostgreSQL persistence for user authentication, machine telemetry, and alert status tracking with resilient in-memory fallback.
- **Automated Alerts** — Real-time anomaly detection for thermal spikes, excessive vibration, hydraulic pressure drift, and quality excursions.

## Features

- **Command Center** — fleet-wide dashboard with live metrics, trends, and line readiness
- **Data Intake** — upload machine telemetry as CSV or stream JSON records for AI evaluation
- **Machine Health** — evaluate temperature, vibration, hydraulic pressure, and power consumption
- **Production Analysis** — monitor target attainment, takt time gaps, and line bottlenecks
- **Quality Intelligence** — defect tracking, first-pass yield, and severity categorization
- **Alert Queue** — alert generation, severity tagging (Critical, High, Medium, Low), and acknowledgement
- **Insights & Reports** — AI-generated root cause analysis with recommended actions and CSV export
- **Auth** — Supabase-powered sign-in / sign-up with route protection
- **Resilience** — graceful fallback to local seed data if external databases are offline

## Tech Stack

- **Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS v4, Wouter
- **State/Data:** TanStack Query, React Hook Form, Recharts
- **Backend:** Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL / Supabase
- **Validation:** Zod
- **AI Engine:** Modular AI Reasoning Service (Google Gemini / OpenAI / Deterministic Engineering Engine)

## Architecture

```
DriveOps-AI Frontend (React SPA)
       │
       ▼
DriveOps-AI Backend (/api)
       ├── Machine Intelligence Engine (Thermal, Vibration, Pressure, Power)
       ├── Production Intelligence Engine (Target vs Actual, Pace, Gaps)
       ├── Quality Intelligence Engine (Quality Rate, Defect Clustering)
       ├── Overall Synthesis & AI Layer (Gemini LLM / Engineering Rules)
       └── Database Adapter (Supabase Cloud / PostgreSQL / Local Store)
               │
               ▼
       Live Fleet Dashboard / Alert Queue / Insights / Shift Reports
```

## Getting Started

### Prerequisites

- Node.js 20+ (Node 24/25 supported)
- pnpm 10+ or npm

### Install

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
# Backend Settings
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/driveops

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Optional Generative AI Reasoning
GEMINI_API_KEY=your-gemini-api-key

# Frontend Settings
VITE_BACKEND_URL=http://localhost:5000
```

### Run Locally

1. **Start the DriveOps-AI Backend (port 5000):**
```bash
npm run dev:backend
# or: node artifacts/api-server/build.mjs && node artifacts/api-server/dist/index.mjs
```

2. **Start the Frontend (port 5173):**
```bash
npm run dev:frontend
# or: pnpm --filter @workspace/driveops-ai run dev
```

Open `http://localhost:5173` in your browser. In development, Vite automatically proxies `/api` calls to the backend running on port 5000.

### Typecheck & Build

```bash
pnpm run typecheck   # Typecheck all packages
pnpm run build       # Build all packages
```

## Repository Layout

```
backend/                # DriveOps-AI Backend Service
  analysis/             # Machine, Production, Quality, & Overall Intelligence Engines
  controllers/          # API route controllers
  services/             # AI, Alerts, Data, Machine, Production, Quality, Report services
  database/             # Database client (Supabase / Postgres / Memory Store)
  models/               # Domain models and TypeScript types
  routes/               # REST API endpoints (/api/*)
  utils/                # CSV parser, logger
  server.ts             # Server entry point
artifacts/
  driveops-ai/          # React frontend (Vite SPA)
    src/
      pages/            # Dashboard, Upload, Production, Machines, Quality, Alerts, Insights, Reports
      services/         # backendService, supabaseService, authService
      contexts/         # AuthContext, ManufacturingContext
      components/       # UI + feature components
      lib/              # Supabase client, driveops seed service
  api-server/           # Backend bundle package for workspace & production deployment
lib/
  db/                   # Drizzle ORM schema & Postgres client
```
