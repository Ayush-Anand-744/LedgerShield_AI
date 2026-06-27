# LedgerShield_AI™

**Owner:** Ayush Anand  
**Copyright:** © 2026 Ayush Anand. All rights reserved.

LedgerShield_AI is a financial risk-intelligence and banking-security dashboard that combines credit-risk analytics, suspicious ledger activity surfacing, DDoS simulation, customer risk profiling, and portfolio-level monitoring into one polished AI cockpit.

This repository is published for portfolio demonstration, academic review, and professional evaluation only. Rebranding, redistribution, republication, or submission under another identity is not permitted.

## What this project contains

- **FastAPI backend** for credit-risk prediction, DDoS simulation, model metrics, customer intelligence, analytics, and Server-Sent Events traffic streams.
- **Next.js frontend** for the dashboard, risk analytics, customer intelligence, DDoS command view, model intelligence, workflow demo, and reporting-oriented command center.
- **Synthetic Indian banking dataset generation** for CIBIL-style customer risk, spending behavior, EMI exposure, and credit-risk explanation flows.
- **Deployment-ready configuration** for Render frontend and backend services.

## Correct deployment architecture

LedgerShield_AI is a full-stack project, so the real live app should be deployed on **Render**, not GitHub Pages.

```text
GitHub = source code
GitHub Pages = optional landing/redirect page
Render backend = FastAPI API service
Render frontend = Next.js live application
MongoDB = not required for the current version
Google OAuth = not required for the current version
```

## Render deployment summary

### Backend service

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Environment Variable:
CORS_ORIGINS = https://your-frontend-render-url.onrender.com
```

### Frontend service

```text
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm start
Environment Variable:
NEXT_PUBLIC_API_URL = https://your-backend-render-url.onrender.com
```

Full deployment instructions are available in [`RENDER_DEPLOYMENT_GUIDE.md`](RENDER_DEPLOYMENT_GUIDE.md).

## Local development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend docs:

```text
http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

## Ownership

This project, its source code, documentation, identity, interface, deployment setup, and generated assets belong to **Ayush Anand**.
