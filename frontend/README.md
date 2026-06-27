# LedgerShield_AI - Banking Risk Intelligence Platform

A modern, AI-powered banking risk intelligence platform built with Next.js 14, TypeScript, and Tailwind CSS.

## Overview

LedgerShield_AI is a comprehensive frontend for detecting and analyzing financial risks including:
- **Credit Risk Assessment**: ML-powered customer risk evaluation with SHAP feature importance
- **DDoS Attack Detection**: Real-time network traffic analysis and attack mitigation
- **Performance Monitoring**: Model metrics, ROC curves, and training history
- **Workflow Demo**: Complete pipeline demonstration from data generation to results

## Features

- **Dark Banking Theme**: Professional dark UI with teal, blue, amber, and red accent colors
- **Real-time Dashboards**: Live traffic monitoring and KPI tracking
- **Interactive Charts**: Recharts-based visualizations with Tailwind styling
- **Smooth Animations**: Framer Motion for fluid page transitions and interactions
- **Responsive Design**: Mobile-friendly grid layouts
- **TypeScript**: Full type safety across the application
- **API Integration**: Ready-to-use API client with endpoints for all features

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout with sidebar
│   ├── page.tsx                   # Home landing
│   ├── globals.css                # Tailwind + custom styles
│   ├── dashboard/                 # Overview & KPIs
│   ├── credit-risk/               # Risk assessment form & gauge
│   ├── ddos/                      # Attack simulation & detection
│   ├── performance/               # Model metrics & ROC curves
│   └── workflow/                  # Complete pipeline demo
├── components/
│   ├── Sidebar.tsx                # Navigation sidebar
│   ├── KPICard.tsx                # Metric card component
│   ├── RiskGauge.tsx              # Semicircular risk gauge
│   ├── LiveTrafficChart.tsx       # Real-time line chart
│   ├── AlertsTable.tsx            # Alert display table
│   └── ModelMetrics.tsx           # Metrics grid component
├── lib/
│   └── api.ts                     # API client (base: http://localhost:8000)
├── tailwind.config.ts             # Tailwind theme configuration
├── tsconfig.json                  # TypeScript configuration
├── next.config.mjs                 # Next.js configuration
└── package.json                   # Dependencies

```

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Recharts**: React charting library
- **Lucide React**: Icon library
- **Axios**: HTTP client
- **clsx**: Classname utility

## Getting Started

### Prerequisites

- Node.js 18+ (or higher)
- npm or yarn
- Backend API running on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install

# Or with pnpm
pnpm install
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Pages Overview

### Dashboard (`/dashboard`)
- 4 KPI cards with trend indicators
- Risk score trend chart (7-day moving average)
- 24-hour traffic & attack breakdown
- Real-time alerts table with severity levels

### Credit Risk (`/credit-risk`)
- Customer profile form with 5 input parameters
- Animated risk gauge (0-100 scale)
- SHAP-style feature importance bar chart
- Risk explanation display

### DDoS Detection (`/ddos`)
- Attack type selection (volumetric, protocol, application)
- Live traffic line chart with streaming data
- Simulation controls (start/stop)
- Real-time detection metrics
- Attack results summary

### Performance (`/performance`)
- Credit Risk model metrics (Precision, Recall, F1, AUC-ROC)
- DDoS Detection metrics (Sensitivity, Specificity, Accuracy, F1)
- Training history with loss and accuracy curves
- ROC curve analysis with AUC-ROC visualization
- Confusion matrices for both models

### Workflow Demo (`/workflow`)
- 4-step animated pipeline:
  1. **Generate Data**: Synthetic dataset creation
  2. **Train Models**: ML model training with progress
  3. **Simulate Attack**: DDoS attack simulation
  4. **View Results**: Performance metrics display
- Attack type selection
- Detailed output for each step
- Real API integration

## Color Scheme

```css
Background:   #0A0E1A (dark-bg)
Cards:        #0F1629 (dark-card)
Borders:      #1E2D4A (dark-border)

Accent Colors:
- Teal:       #00D4AA (safe/success)
- Blue:       #3B82F6 (info)
- Amber:      #F59E0B (warning)
- Red:        #EF4444 (danger/error)

Text:
- Primary:    #E8EAED
- Secondary:  #9FA3A8
```

## API Configuration

The frontend connects to the backend API at `http://localhost:8000`. To configure a different URL, edit `/lib/api.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

## API Endpoints Used

### Training
- `POST /api/training/generate-data`
- `POST /api/training/train-models`
- `GET /api/training/progress`

### Risk Assessment
- `POST /api/risk/credit-assessment`
- `POST /api/risk/risk-explanation`

### Attack Simulation
- `POST /api/attack/simulate`
- `GET /api/attack/results`
- `GET /api/attack/traffic`
- `GET /api/attack/traffic-stream` (SSE)

### Performance
- `GET /api/performance/metrics`
- `GET /api/performance/roc-curves`
- `GET /api/performance/confusion-matrices`
- `GET /api/performance/training-history`

### Dashboard
- `GET /api/dashboard/overview`
- `GET /api/dashboard/alerts`
- `GET /api/dashboard/kpis`

### Workflow
- `POST /api/workflow/generate-data`
- `POST /api/workflow/train-models`
- `POST /api/workflow/simulate-attack`
- `GET /api/workflow/results`

## Customization

### Adding New Pages

1. Create a directory under `app/`
2. Add a `page.tsx` file
3. Add navigation link in `components/Sidebar.tsx`

### Modifying Colors

Edit `tailwind.config.ts` to change the dark theme colors:

```typescript
colors: {
  'dark-bg': '#0A0E1A',
  'dark-card': '#0F1629',
  // ... update colors
}
```

### Adding Components

Create new components in `components/` following the established pattern:
- Use `'use client'` directive for interactive components
- Implement Framer Motion animations
- Follow Tailwind utility classes
- Add TypeScript interfaces

## Performance

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Built-in Next.js image optimization
- **CSS**: Tailwind purges unused styles in production
- **Bundle Size**: ~150KB gzipped with all dependencies

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Demo Mode

All pages include fallback mock data for demonstration when the API is unavailable. This allows the UI to work standalone for presentations.

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## License

MIT

## Support

For issues or questions, please check the backend API documentation and ensure it's running on the expected port.
