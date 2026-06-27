# LedgerShield_AI Render Deployment Guide

LedgerShield_AI uses a FastAPI backend and a Next.js frontend. Deploy them as two separate Render Web Services.

## 1. Backend Service

Create a new Render Web Service from the GitHub repository.

```text
Name: ledgershield-ai-backend
Language: Python
Branch: main
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Backend environment variables

Use this first while testing:

```text
CORS_ORIGINS=*
```

After the frontend is deployed, replace `*` with the frontend URL:

```text
CORS_ORIGINS=https://ledgershield-ai.onrender.com
```

The backend API docs should be available at:

```text
https://ledgershield-ai-backend.onrender.com/docs
```

## 2. Frontend Service

Create another Render Web Service from the same GitHub repository.

```text
Name: ledgershield-ai
Language: Node
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm start
```

### Frontend environment variables

```text
NODE_VERSION=20
NEXT_PUBLIC_API_URL=https://ledgershield-ai-backend.onrender.com
```

Use the actual backend URL given by Render if it is different.

## 3. Final Live Link

Use the frontend Render URL as the real live app link:

```text
https://ledgershield-ai.onrender.com
```

## 4. GitHub Pages

GitHub Pages cannot run the backend. Use it only as a landing page or redirect page. To redirect GitHub Pages to Render, replace the root `index.html` URL with your final Render frontend URL.

## 5. Extra services

The current version does not require MongoDB Atlas or Google OAuth.
