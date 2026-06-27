/**
 * LedgerShield_AI
 * Copyright © 2026 Ayush Anand. All rights reserved.
 * Unauthorized rebranding, redistribution, or republication is prohibited.
 */
/**
 * LedgerShield_AI — API Client
 * Uses NEXT_PUBLIC_API_URL for deployed Render backends and localhost for development.
 */

import axios from 'axios'

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
})

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface SystemStatus {
  credit_model_trained: boolean
  ddos_model_trained: boolean
  uptime_seconds: number
  timestamp: string
}

export interface ModelMetrics {
  credit_model_trained: boolean
  credit_metrics: {
    accuracy: number
    precision: number
    recall: number
    f1: number
    auc_roc: number
    train_samples: number
    test_samples: number
  } | null
  ddos_model_trained: boolean
  ddos_metrics: {
    cnn_lstm_accuracy: number
    random_forest_accuracy: number
    gradient_boosting_accuracy: number
    training_time_seconds: number
    train_samples: number
    test_samples: number
  } | null
}

export interface TrainResult {
  status: string
  message: string
  training_time_seconds: number
  train_samples: number
  test_samples: number
  metrics: Record<string, number>
}

export interface CreditPredictRequest {
  income: number
  credit_score: number
  payment_history_months: number
  loan_amount: number
  monthly_debt: number
  employment_years: number
  num_credit_lines: number
  num_late_payments: number
  credit_utilization: number
  transaction_frequency: number
  avg_transaction_amount: number
  savings_balance: number
  age: number
}

export interface CreditPredictResult {
  risk_score: number
  risk_category: string
  risk_percentage: number
}

export interface AttackSimResult {
  attack_type: string
  duration_seconds: number
  intensity: number
  num_flows_generated: number
  detection_results: {
    num_attacks_detected: number
    attack_percentage: number
    avg_confidence: number
  }
  traffic_stats: Record<string, any>
  timestamp: string
}

export interface SampleData {
  credit_data: Record<string, any>[]
  network_data: Record<string, any>[]
}

export interface TrafficPoint {
  timestamp: string
  packet_rate: number
  byte_rate: number
  is_anomaly: boolean
}

// ─── Indian Customer Types ─────────────────────────────────────────────────────

export interface IndianCustomer {
  customer_id: string
  name: string
  age: number
  city: string
  occupation: string
  income: number
  cibil_score: number
  loan_amount: number
  loan_tenure_months: number
  monthly_emi: number
  credit_utilization: number
  num_late_payments: number
  employment_years: number
  num_credit_lines: number
  is_delinquent: number
  risk_score: number
  risk_category: string
  spend_food: number
  spend_shopping: number
  spend_travel: number
  spend_entertainment: number
  spend_utilities: number
  spend_emi_payments: number
  debt_to_income: number
  savings_rate: number
  credit_score_band: string
}

export interface CustomerDetail extends IndianCustomer {
  risk_factors: string[]
  recommendations: string[]
  spending_insights: string[]
  feature_importances: Record<string, number>
  shap_values: Record<string, number>
  monthly_spending: number
}

export interface CustomersResponse {
  customers: IndianCustomer[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface OverviewAnalytics {
  total_customers: number
  high_risk_count: number
  critical_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  avg_cibil_score: number
  avg_delinquency_rate: number
  total_loan_portfolio: number
  occupation_breakdown: Record<string, number>
  city_risk: Record<string, any>
  risk_by_occupation: Record<string, number>
  cibil_distribution: Record<string, number>
}

export interface SpendingAnalytics {
  occupation_spending: Record<string, Record<string, number>>
  avg_spending_by_category: Record<string, number>
  high_risk_spending: Record<string, number>
  low_risk_spending: Record<string, number>
}

export interface DDoSSimResult {
  attack_type: string
  intensity: number
  duration: number
  packets_per_second: Record<string, number>
  mitigation_phases: Array<{
    time: number
    action: string
    effectiveness: number
  }>
  detection_time_ms: number
  mitigation_time_ms: number
  blocked_ips: number
  total_packets: number
  attack_traffic: number[]
  normal_traffic: number[]
  time_labels: string[]
}

// ─── API Calls ─────────────────────────────────────────────────────────────────

export const getHealth = () => api.get('/health').then(r => r.data)

export const getStatus = (): Promise<SystemStatus> =>
  api.get('/api/status').then(r => r.data)

export const getMetrics = (): Promise<ModelMetrics> =>
  api.get('/api/metrics').then(r => r.data)

export const trainCredit = (n_samples = 3000): Promise<TrainResult> =>
  api.post('/api/train/credit', { n_samples }).then(r => r.data)

export const trainDDoS = (n_samples = 5000): Promise<TrainResult> =>
  api.post('/api/train/ddos', { n_samples }).then(r => r.data)

export const predictCredit = (data: CreditPredictRequest): Promise<CreditPredictResult> =>
  api.post('/api/predict/credit', data).then(r => r.data)

export const simulateAttack = (
  attack_type: string,
  duration_seconds = 15,
  intensity = 1.5
): Promise<AttackSimResult> =>
  api.post('/api/simulate/attack', { attack_type, duration_seconds, intensity }).then(r => r.data)

export const getSampleData = (): Promise<SampleData> =>
  api.get('/api/data/sample').then(r => r.data)

// ─── Indian Customer API ───────────────────────────────────────────────────────

export const getCustomers = (
  page = 1,
  per_page = 25,
  risk_filter?: string,
  occupation_filter?: string,
  search?: string
): Promise<CustomersResponse> => {
  const params: Record<string, any> = { page, per_page }
  if (risk_filter) params.risk_filter = risk_filter
  if (occupation_filter) params.occupation_filter = occupation_filter
  if (search) params.search = search
  return api.get('/api/customers', { params }).then(r => r.data)
}

export const getCustomerDetail = (customerId: string): Promise<CustomerDetail> =>
  api.get(`/api/customer/${customerId}`).then(r => r.data)

export const explainCustomer = (customerId: string): Promise<any> =>
  api.get(`/api/explain/${customerId}`).then(r => r.data)

export const getOverviewAnalytics = (): Promise<OverviewAnalytics> =>
  api.get('/api/analytics/overview').then(r => r.data)

export const getSpendingAnalytics = (): Promise<SpendingAnalytics> =>
  api.get('/api/analytics/spending').then(r => r.data)

export const simulateDDoS = (
  attack_type: string,
  intensity = 1.5,
  duration = 30
): Promise<DDoSSimResult> =>
  api.post('/api/ddos/simulate', { attack_type, intensity, duration }).then(r => r.data)

/**
 * SSE stream for live traffic — call .close() to stop
 */
export const streamTraffic = (
  onData: (point: TrafficPoint) => void,
  onDone?: () => void,
  onError?: (e: Event) => void
): EventSource => {
  const es = new EventSource(`${API_BASE}/api/simulate/traffic`)
  es.onmessage = (e) => {
    try { onData(JSON.parse(e.data)) } catch {}
  }
  es.addEventListener('done', () => { es.close(); onDone?.() })
  es.onerror = (e) => { onError?.(e); es.close() }
  return es
}

/**
 * SSE stream for live DDoS attack simulation
 */
export const streamDDoSAttack = (
  attack_type: string,
  intensity: number,
  onData: (data: any) => void,
  onDone?: () => void,
  onError?: (e: Event) => void
): EventSource => {
  const es = new EventSource(
    `${API_BASE}/api/ddos/live-stream?attack_type=${attack_type}&intensity=${intensity}`
  )
  es.onmessage = (e) => {
    try { onData(JSON.parse(e.data)) } catch {}
  }
  es.addEventListener('done', () => { es.close(); onDone?.() })
  es.onerror = (e) => { onError?.(e); es.close() }
  return es
}

export default api
