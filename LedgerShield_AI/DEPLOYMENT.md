# LedgerShield_AI Deployment

LedgerShield_AI is a full-stack project with a FastAPI backend and a Next.js frontend. The real live app should be deployed on Render as two Web Services. GitHub Pages should be used only as a static landing or redirect page.

## Backend on Render

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Environment Variable:
CORS_ORIGINS = https://your-frontend-render-url.onrender.com
```

## Frontend on Render

```text
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm start
Environment Variable:
NEXT_PUBLIC_API_URL = https://your-backend-render-url.onrender.com
```

## Not required

The current version does not require MongoDB Atlas or Google OAuth.

## GitHub Pages

GitHub Pages cannot run the FastAPI backend. Use the root `index.html` as a landing page or replace it with a redirect to the Render frontend URL after deployment.
