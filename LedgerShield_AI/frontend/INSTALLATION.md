# LedgerShield_AI Frontend - Installation Guide

## Quick Start (5 minutes)

### 1. Prerequisites
Ensure you have Node.js 18+ installed:
```bash
node --version  # Should be v18.0.0 or higher
npm --version
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

**Important**: Make sure your backend API is running on http://localhost:8000

---

## Detailed Setup

### Step 1: Project Structure Check
Verify these files exist:
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── dashboard/page.tsx
│   ├── credit-risk/page.tsx
│   ├── ddos/page.tsx
│   ├── performance/page.tsx
│   └── workflow/page.tsx
├── components/
│   ├── Sidebar.tsx
│   ├── KPICard.tsx
│   ├── RiskGauge.tsx
│   ├── LiveTrafficChart.tsx
│   ├── AlertsTable.tsx
│   └── ModelMetrics.tsx
├── lib/
│   └── api.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── postcss.config.mjs
└── README.md
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- next@14.1.0
- react@18.3.1
- typescript@5.3.3
- tailwindcss@3.4.1
- recharts@2.10.3
- framer-motion@10.16.16
- lucide-react@0.344.0
- axios@1.6.2
- clsx@2.0.0

### Step 3: Verify Configuration Files

#### tailwind.config.ts
✓ Defines dark theme colors
✓ Custom animations (pulse-glow, slide-in, fade-in, bounce-in)
✓ Glow shadow utilities

#### tsconfig.json
✓ Strict mode enabled
✓ ES2017 target
✓ Path aliases configured

#### next.config.mjs
✓ React strict mode
✓ SWC minification enabled

#### postcss.config.mjs
✓ Tailwind CSS plugin
✓ Autoprefixer plugin

---

## Running the Application

### Development Mode
```bash
npm run dev
```
- Hot-reload on file changes
- TypeScript checking
- Available on http://localhost:3000

### Production Build
```bash
npm run build
npm start
```
- Optimized bundle
- Ready for deployment

### Linting
```bash
npm run lint
```

---

## Backend API Configuration

### Default Configuration
The frontend is configured to connect to:
```
http://localhost:8000
```

### Custom API URL
To use a different backend URL, edit `lib/api.ts`:

```typescript
const API_BASE = 'http://your-api-url:port'
```

Or use an environment variable:

1. Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://your-api-url:8000
```

2. Update `lib/api.ts`:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

---

## Feature Verification

Test each section after startup:

### 1. Dashboard (http://localhost:3000/dashboard)
- [ ] KPI cards display
- [ ] Charts render
- [ ] Mock alerts appear
- [ ] Navigation sidebar works

### 2. Credit Risk (http://localhost:3000/credit-risk)
- [ ] Form inputs respond
- [ ] Risk gauge updates
- [ ] Feature chart displays
- [ ] Assessment button works

### 3. DDoS Detection (http://localhost:3000/ddos)
- [ ] Attack type selection
- [ ] Simulation controls visible
- [ ] Traffic chart appears
- [ ] Results display after simulation

### 4. Performance (http://localhost:3000/performance)
- [ ] Model metrics display
- [ ] Training history chart visible
- [ ] ROC curve renders
- [ ] Confusion matrices show

### 5. Workflow Demo (http://localhost:3000/workflow)
- [ ] Attack type selector works
- [ ] Start/Reset buttons visible
- [ ] Step indicators display
- [ ] Progress bars animate
- [ ] Results populate after completion

---

## Troubleshooting

### Port 3000 Already in Use
```bash
# On Linux/Mac:
lsof -i :3000
kill -9 <PID>

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Backend API Not Responding
1. Verify backend is running on http://localhost:8000
2. Check CORS configuration on backend
3. Use browser DevTools Network tab to inspect requests

### TypeScript Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Styling Issues
```bash
# Rebuild Tailwind CSS
npm run dev
# The CSS should rebuild automatically
```

### Out of Memory During Build
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## Development Tips

### Add a New Page
1. Create `app/new-page/page.tsx`
2. Add navigation in `components/Sidebar.tsx`
3. Use existing components as templates

### Customize Colors
Edit `tailwind.config.ts` to change the theme:
```typescript
colors: {
  'dark-bg': '#0A0E1A',
  'brand-teal': '#00D4AA',
  // ...
}
```

### Add Animations
Use Framer Motion in your components:
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Create New Charts
Use Recharts with dark theme:
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid stroke="#1E2D4A" />
    <XAxis stroke="#9FA3A8" />
    <YAxis stroke="#9FA3A8" />
    <Line stroke="#00D4AA" />
  </LineChart>
</ResponsiveContainer>
```

---

## Deployment Options

### Vercel (Recommended for Next.js)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Traditional Server
```bash
npm run build
npm start
```

---

## Performance Optimization

### Bundle Size
Current estimated bundle size: ~150KB gzipped

### Optimization Techniques
1. **Code Splitting**: Automatic with Next.js App Router
2. **CSS Purging**: Tailwind removes unused styles
3. **Image Optimization**: Use Next.js Image component
4. **Dynamic Imports**: For optional features
5. **API Caching**: Consider implementing with SWR

### Monitoring
```bash
npm install --save-dev @next/bundle-analyzer
```

---

## Security Notes

1. **API Credentials**: Never commit `.env` files
2. **CORS**: Ensure backend has proper CORS configuration
3. **Input Validation**: Always validate API responses
4. **XSS Protection**: Tailwind/Next.js provides default protections

---

## Support & Documentation

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Recharts**: https://recharts.org/
- **Framer Motion**: https://www.framer.com/motion/
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## Next Steps

1. Ensure backend API is running
2. Start the development server: `npm run dev`
3. Open http://localhost:3000
4. Navigate through all pages to verify functionality
5. Check browser console for any errors
6. Review backend logs for API interactions

Enjoy the LedgerShield_AI platform!
