# LedgerShield_AI - API Integration Reference

## Overview

The frontend communicates with the backend API (running on `http://localhost:8000`) through TypeScript clients defined in `lib/api.ts`. All endpoints are properly typed and handle errors with fallback mock data.

---

## API Client Structure

The API client is organized into logical modules:

```typescript
import { training, risk, attack, performance, dashboard, workflow } from '@/lib/api'
```

### Available Modules
- `training` - Model training operations
- `risk` - Credit risk assessment
- `attack` - DDoS attack simulation
- `performance` - Model performance metrics
- `dashboard` - Dashboard data
- `workflow` - Complete workflow operations

---

## Training Module

### generateData()
Generate synthetic training data for models.

```typescript
const result = await training.generateData()
// Returns: { data_samples: [...] }
```

**Used in**: Workflow Demo (Step 1)

---

### trainModels()
Train credit risk and DDoS detection models.

```typescript
const result = await training.trainModels()
// Returns: { metrics: [...], training_time: number }
```

**Used in**: Workflow Demo (Step 2)

---

### getTrainingProgress()
Get current training progress.

```typescript
const result = await training.getTrainingProgress()
// Returns: { progress: number, status: string }
```

---

## Risk Module

### assessCreditRisk(payload)
Evaluate credit risk for a customer.

**Parameters:**
```typescript
{
  age: number              // Customer age
  income: number           // Annual income in dollars
  credit_score: number     // Credit score (300-850)
  debt_ratio: number       // Debt-to-income ratio (0-1)
  employment_years: number // Years of employment
}
```

**Response:**
```typescript
{
  risk_score: number       // 0-100 risk score
  risk_level: string       // "Low" | "Medium" | "High"
  features: Array<{
    name: string
    importance: number
  }>
}
```

**Example:**
```typescript
const assessment = await risk.assessCreditRisk({
  age: 35,
  income: 75000,
  credit_score: 720,
  debt_ratio: 0.3,
  employment_years: 5,
})

console.log(assessment.risk_score)  // 45
console.log(assessment.risk_level)  // "Medium"
```

**Used in**: Credit Risk page

---

### getRiskExplanation(payload)
Get SHAP-style feature importance for risk assessment.

**Parameters:** Same as `assessCreditRisk`

**Response:**
```typescript
{
  explanation: {
    features: Array<{
      name: string
      importance: number        // 0-1
      direction: "positive" | "negative"
    }>
  }
}
```

**Used in**: Credit Risk page (Feature Importance Chart)

---

## Attack Module

### simulateAttack(attackType)
Start a DDoS attack simulation.

**Parameters:**
```typescript
attackType: "volumetric" | "protocol" | "application"
```

**Response:**
```typescript
{
  simulation_id: string
  status: string
  started_at: string
}
```

**Example:**
```typescript
const result = await attack.simulateAttack('volumetric')
```

**Used in**: DDoS Detection page, Workflow Demo (Step 3)

---

### getAttackResults()
Retrieve results from completed attack simulation.

**Response:**
```typescript
{
  results: {
    detected: number      // Attacks successfully detected
    missed: number        // Attacks not detected
    accuracy: number      // Overall accuracy percentage
    detectionRate: number // Detection rate percentage
  }
}
```

**Used in**: DDoS Detection page

---

### getTrafficData()
Get historical traffic data.

**Response:**
```typescript
{
  traffic: Array<{
    timestamp: string
    requests: number
    attacks: number
  }>
}
```

---

### streamTrafficData(onData, onError?)
Subscribe to real-time traffic updates via Server-Sent Events (SSE).

**Parameters:**
```typescript
onData: (data: { timestamp: string; requests: number; attacks: number }) => void
onError?: (error: any) => void
```

**Returns:** EventSource object

**Example:**
```typescript
const eventSource = attack.streamTrafficData(
  (data) => {
    console.log('New traffic point:', data)
    setTrafficData(prev => [...prev, data])
  },
  (error) => {
    console.error('Stream error:', error)
  }
)

// Later: stop listening
eventSource.close()
```

**Used in**: DDoS Detection page (Live Traffic Chart)

---

## Performance Module

### getModelMetrics()
Get performance metrics for all models.

**Response:**
```typescript
{
  credit_risk: Array<{
    name: string
    value: string | number
    unit?: string
    color?: string
  }>,
  ddos_detection: Array<{
    name: string
    value: string | number
    unit?: string
    color?: string
  }>
}
```

**Typical Values:**
- Credit Risk: Precision, Recall, F1-Score, AUC-ROC
- DDoS Detection: Sensitivity, Specificity, Accuracy, F1-Score

**Used in**: Performance page

---

### getROCCurves()
Get ROC curve data for model evaluation.

**Response:**
```typescript
{
  roc_curve: Array<{
    fpr: number  // False Positive Rate (0-1)
    tpr: number  // True Positive Rate (0-1)
  }>
}
```

**Used in**: Performance page (ROC Curve Analysis)

---

### getConfusionMatrices()
Get confusion matrix data for both models.

**Response:**
```typescript
{
  credit_risk: {
    true_negatives: number
    false_positives: number
    false_negatives: number
    true_positives: number
  },
  ddos_detection: {
    true_negatives: number
    false_positives: number
    false_negatives: number
    true_positives: number
  }
}
```

**Used in**: Performance page

---

### getTrainingHistory()
Get training metrics over epochs.

**Response:**
```typescript
{
  training_history: Array<{
    epoch: number
    loss: number
    accuracy: number
  }>
}
```

**Used in**: Performance page (Training History Chart)

---

## Dashboard Module

### getOverview()
Get dashboard overview data.

**Response:**
```typescript
{
  traffic: Array<{
    time: string
    requests: number
    attacks: number
  }>,
  risk_trend: Array<{
    date: string
    riskScore: number
  }>
}
```

**Used in**: Dashboard page

---

### getAlerts()
Get recent alerts.

**Response:**
```typescript
{
  alerts: Array<{
    id: string
    type: "danger" | "warning" | "success"
    title: string
    description: string
    timestamp: string
    severity: "critical" | "high" | "medium" | "low"
  }>
}
```

**Used in**: Dashboard page (Alerts Table)

---

### getKPIs()
Get key performance indicators.

**Response:**
```typescript
{
  risk_score: number
  detection_rate: number
  models_active: number
  alerts_today: number
}
```

**Used in**: Dashboard page (KPI Cards)

---

## Workflow Module

### generateTrainingData()
Generate training data for workflow.

**Response:**
```typescript
{
  data_samples: Array<{
    [key: string]: any
  }>
}
```

**Used in**: Workflow Demo (Step 1)

---

### trainAllModels()
Train all models in workflow.

**Response:**
```typescript
{
  metrics: Array<{
    name: string
    value: string | number
  }>
}
```

**Used in**: Workflow Demo (Step 2)

---

### runAttackSimulation(attackType)
Run attack simulation in workflow.

**Parameters:**
```typescript
attackType: "volumetric" | "protocol" | "application"
```

**Response:**
```typescript
{
  traffic_data: Array<{
    timestamp: string
    requests: number
    attacks: number
  }>
}
```

**Used in**: Workflow Demo (Step 3)

---

### getWorkflowResults()
Get final results from workflow.

**Response:**
```typescript
{
  results: Array<{
    name: string
    value: string | number
  }>
}
```

**Used in**: Workflow Demo (Step 4)

---

## Error Handling

All API functions include error handling with fallback mock data:

```typescript
try {
  const data = await dashboard.getKPIs()
  setKPIs(data)
} catch (error) {
  console.error('API error:', error)
  // Fallback to mock data
  setKPIs(mockKPIs)
}
```

The frontend gracefully degrades to mock data if the API is unavailable, allowing the UI to work standalone.

---

## Request/Response Examples

### Credit Risk Assessment Flow

```typescript
// 1. Get risk assessment
const assessment = await risk.assessCreditRisk({
  age: 35,
  income: 75000,
  credit_score: 720,
  debt_ratio: 0.3,
  employment_years: 5,
})

// Response:
// {
//   risk_score: 45,
//   risk_level: "Medium",
//   features: [...]
// }

// 2. Get explanation
const explanation = await risk.getRiskExplanation({
  age: 35,
  income: 75000,
  credit_score: 720,
  debt_ratio: 0.3,
  employment_years: 5,
})

// Response:
// {
//   explanation: {
//     features: [
//       { name: "Credit Score", importance: 0.25, direction: "positive" },
//       { name: "Debt Ratio", importance: 0.20, direction: "negative" },
//       ...
//     ]
//   }
// }
```

### DDoS Detection Flow

```typescript
// 1. Start simulation
const result = await attack.simulateAttack('volumetric')

// 2. Subscribe to live traffic
const eventSource = attack.streamTrafficData((data) => {
  console.log('Traffic:', data)
  // { timestamp: "12:34:56", requests: 2500, attacks: 25 }
})

// 3. After simulation ends
const results = await attack.getAttackResults()
// {
//   results: {
//     detected: 245,
//     missed: 8,
//     accuracy: 96.85,
//     detectionRate: 96.85
//   }
// }

// 4. Close stream
eventSource.close()
```

### Complete Workflow Flow

```typescript
// Step 1: Generate Data
const generated = await workflow.generateTrainingData()
// Contains: data_samples with customer/transaction records

// Step 2: Train Models
const trained = await workflow.trainAllModels()
// Contains: metrics for both models

// Step 3: Simulate Attack
const simulated = await workflow.runAttackSimulation('volumetric')
// Contains: traffic_data array with requests/attacks

// Step 4: Get Results
const finalResults = await workflow.getWorkflowResults()
// Contains: final performance metrics
```

---

## Backend Expected API Responses

All endpoints should return JSON with consistent error handling:

### Success Response
```json
{
  "status": "success",
  "data": { /* ... */ }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

---

## Testing the API

### Check Backend Connectivity
```bash
curl http://localhost:8000/api/health
```

### Test Credit Risk Endpoint
```bash
curl -X POST http://localhost:8000/api/risk/credit-assessment \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "income": 75000,
    "credit_score": 720,
    "debt_ratio": 0.3,
    "employment_years": 5
  }'
```

### Test DDoS Attack Simulation
```bash
curl -X POST http://localhost:8000/api/attack/simulate \
  -H "Content-Type: application/json" \
  -d '{"attack_type": "volumetric"}'
```

---

## Performance Considerations

1. **Polling vs Streaming**: DDoS traffic uses SSE for real-time updates (more efficient than polling)
2. **Data Caching**: Consider implementing SWR for frequently accessed endpoints
3. **Rate Limiting**: Be mindful of API rate limits when developing
4. **Timeout Handling**: SSE connections may drop; implement reconnection logic if needed

---

## Extending the API Client

To add a new endpoint:

```typescript
// lib/api.ts
export const newModule = {
  someFunction: async (params: any) => {
    const response = await apiClient.post('/api/new-module/endpoint', params)
    return response.data
  },
}

// Usage in component:
import { newModule } from '@/lib/api'
const result = await newModule.someFunction(params)
```

---

## Environment Variables

For production deployments, use environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://ledgershield-ai-backend.onrender.com
```

Then update `lib/api.ts`:

```typescript
const API_BASE = 
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

---

## Support

For API-related issues:
1. Check backend logs for errors
2. Verify endpoint paths match backend implementation
3. Use browser DevTools Network tab to inspect requests
4. Check browser console for TypeScript/JavaScript errors
5. Ensure CORS is properly configured on backend
