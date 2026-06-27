'use client'

import { useEffect, useState, useRef } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  SystemStatus, ModelMetrics, OverviewAnalytics
} from '@/lib/api'
import { cachedStatus, cachedMetrics, cachedOverview } from '@/lib/cache'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null) { return (n ?? 0).toLocaleString('en-IN') }
function fmtCr(n: number | undefined | null) { return `₹${((n ?? 0) / 1e7).toFixed(1)}Cr` }

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-[#1A2340] animate-pulse rounded ${className}`} />
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  { label: 'SBI NIFTY 50', value: '22,417.20', change: '+0.73%', up: true },
  { label: 'HDFC Bank', value: '₹1,642', change: '+1.2%', up: true },
  { label: 'ICICI Bank', value: '₹1,087', change: '-0.4%', up: false },
  { label: 'CIBIL Avg', value: '723', change: '+2pts', up: true },
  { label: 'NPA Rate', value: '3.8%', change: '-0.2%', up: true },
  { label: 'RBI Repo', value: '6.50%', change: '0%', up: true },
  { label: 'Fraud Alerts', value: '42', change: '+8', up: false },
  { label: 'Active Loans', value: '2,847', change: '+34', up: true },
]

function LiveTicker() {
  const [offset, setOffset] = useState(0)
  const rafRef = useRef<number>(0)
  const width = TICKER_ITEMS.length * 220

  useEffect(() => {
    let pos = 0
    const animate = () => {
      pos = (pos + 0.5) % width
      setOffset(pos)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [width])

  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="bg-[#0A0F1E] border-y border-[#1E2D4A] overflow-hidden py-2 mb-8">
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-[#00D4AA] text-black text-xs font-bold rounded ml-3 flex-shrink-0">LIVE</span>
        <div className="overflow-hidden flex-1">
          <div
            className="flex gap-0 transition-none"
            style={{ transform: `translateX(-${offset}px)`, whiteSpace: 'nowrap' }}
          >
            {items.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 text-sm border-r border-[#1E2D4A]" style={{ minWidth: 220 }}>
                <span className="text-[#94A3B8]">{item.label}</span>
                <span className="font-semibold text-white">{item.value}</span>
                <span className={item.up ? 'text-[#00D4AA]' : 'text-[#EF4444]'}>{item.change}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPIProps {
  icon: string
  label: string
  value: string
  sub?: string
  trend?: { val: string; up: boolean }
  color: string
  loading?: boolean
}

function KPICard({ icon, label, value, sub, trend, color, loading }: KPIProps) {
  if (loading) return (
    <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-5">
      <Skeleton className="w-10 h-10 mb-3" />
      <Skeleton className="w-28 h-8 mb-2" />
      <Skeleton className="w-20 h-4" />
    </div>
  )
  return (
    <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-5 hover:border-[#2A3A5C] transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${color}`}>{icon}</div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.up ? 'bg-[#00D4AA]/10 text-[#00D4AA]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
            {trend.up ? '↑' : '↓'} {trend.val}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-[#94A3B8]">{label}</div>
      {sub && <div className="text-xs text-[#64748B] mt-1">{sub}</div>}
    </div>
  )
}

// ─── Risk Donut ───────────────────────────────────────────────────────────────

const RISK_COLORS = {
  'Low Risk': '#00D4AA',
  'Medium Risk': '#F59E0B',
  'High Risk': '#F97316',
  'Critical Risk': '#EF4444',
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

const ALERTS = [
  { sev: 'CRITICAL', time: '14:47', msg: 'Account #IND-0847 — 3 late EMIs, CIBIL dropped to 541', icon: '🔴' },
  { sev: 'HIGH', time: '14:35', msg: 'DDoS SYN Flood detected — 120K pkt/s from AS64512', icon: '🟠' },
  { sev: 'HIGH', time: '14:12', msg: 'Customer Priya Sharma — delinquency prob 82%, Business-Owner', icon: '🟠' },
  { sev: 'MEDIUM', time: '13:58', msg: 'NPA threshold breached — Maharashtra zone +0.4% this week', icon: '🟡' },
  { sev: 'MEDIUM', time: '13:33', msg: 'Model drift detected — retraining initiated (2,500 new samples)', icon: '🟡' },
  { sev: 'LOW', time: '13:05', msg: 'Feature pipeline completed — SHAP recalculated for 500 customers', icon: '🟢' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState('')
  const [trafficData, setTrafficData] = useState<{ t: string; normal: number; attack: number }[]>([])

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    // Generate demo traffic with attack spike
    const pts = Array.from({ length: 60 }, (_, i) => {
      const isAttack = i >= 35 && i <= 45
      return {
        t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
        normal: Math.floor(Math.random() * 40000) + 80000,
        attack: isAttack ? Math.floor(Math.random() * 800000) + 500000 : 0,
      }
    })
    setTrafficData(pts)
  }, [])

  useEffect(() => {
    // Immediately show stale cached data (no spinner if we have anything)
    cachedStatus().then(s => { setStatus(s); setLoading(false) }).catch(() => setLoading(false))
    cachedMetrics().then(m => setMetrics(m)).catch(() => {})
    cachedOverview().then(ov => setOverview(ov)).catch(() => {})

    // Background refresh every 30s
    const iv = setInterval(() => {
      cachedStatus().then(s => setStatus(s)).catch(() => {})
      cachedMetrics().then(m => setMetrics(m)).catch(() => {})
      cachedOverview().then(ov => setOverview(ov)).catch(() => {})
    }, 30000)
    return () => clearInterval(iv)
  }, [])

  // KPI values
  const totalCustomers = overview?.total_customers ?? 500
  const highRisk = (overview?.high_risk_count ?? 0) + (overview?.critical_risk_count ?? 0)
  const avgCibil = overview?.avg_cibil_score?.toFixed(0) ?? '718'
  const portfolio = overview?.total_loan_portfolio ? fmtCr(overview.total_loan_portfolio) : '₹42.8Cr'
  const delinquencyRate = overview?.avg_delinquency_rate
    ? `${(overview.avg_delinquency_rate * 100).toFixed(1)}%` : '18.2%'
  const creditAcc = metrics?.credit_metrics?.accuracy
    ? `${(metrics.credit_metrics.accuracy * 100).toFixed(1)}%` : '94.3%'

  // Occupation bar chart
  const occupationData = overview?.risk_by_occupation
    ? Object.entries(overview.risk_by_occupation).map(([k, v]) => ({
        name: k.replace('Salaried-', 'Sal-').replace('Business-Owner', 'Biz-Owner').replace('Government-Employee', 'Gov-Emp').replace('Self-Employed', 'Self-Emp'),
        risk: Math.round((v as number) * 100),
      }))
    : [
        { name: 'Sal-IT', risk: 12 },
        { name: 'Sal-NonIT', risk: 22 },
        { name: 'Biz-Owner', risk: 35 },
        { name: 'Gov-Emp', risk: 8 },
        { name: 'Farmer', risk: 48 },
        { name: 'Student', risk: 28 },
        { name: 'Self-Emp', risk: 31 },
        { name: 'Retired', risk: 18 },
      ]

  // Risk distribution pie
  const riskPie = overview
    ? [
        { name: 'Low Risk', value: overview.low_risk_count },
        { name: 'Medium Risk', value: overview.medium_risk_count },
        { name: 'High Risk', value: overview.high_risk_count },
        { name: 'Critical Risk', value: overview.critical_risk_count },
      ]
    : [
        { name: 'Low Risk', value: 210 },
        { name: 'Medium Risk', value: 165 },
        { name: 'High Risk', value: 85 },
        { name: 'Critical Risk', value: 40 },
      ]

  return (
    <div className="min-h-screen bg-[#060B18]">
      {/* Live Ticker */}
      <LiveTicker />

      <div className="px-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">LedgerShield_AI — Command Center</h1>
            <p className="text-[#94A3B8] mt-1 text-sm">
              AI-powered Pre-Delinquency Detection &amp; DDoS Threat Intelligence
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#0F1629] border border-[#1E2D4A] rounded-lg px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-[#00D4AA] animate-pulse" />
              <span className="text-[#00D4AA] font-mono text-sm">{time}</span>
            </div>
            <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-lg px-4 py-2 text-sm text-[#94A3B8]">
              IST • India Portfolio
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <KPICard icon="👥" label="Total Customers" value={fmt(totalCustomers)}
            sub="Across 20 cities" trend={{ val: '2.3%', up: true }} color="bg-[#3B82F6]/10 text-[#3B82F6]" loading={loading} />
          <KPICard icon="⚠️" label="High / Critical Risk" value={fmt(highRisk)}
            sub="Needs intervention" trend={{ val: '5.1%', up: false }} color="bg-[#EF4444]/10 text-[#EF4444]" loading={loading} />
          <KPICard icon="💳" label="Avg CIBIL Score" value={avgCibil}
            sub="Target: >750" trend={{ val: '4pts', up: true }} color="bg-[#F59E0B]/10 text-[#F59E0B]" loading={loading} />
          <KPICard icon="💰" label="Loan Portfolio" value={portfolio}
            sub="Active disbursals" trend={{ val: '8.2%', up: true }} color="bg-[#00D4AA]/10 text-[#00D4AA]" loading={loading} />
          <KPICard icon="📉" label="Delinquency Rate" value={delinquencyRate}
            sub="30+ DPD customers" trend={{ val: '1.2%', up: false }} color="bg-[#8B5CF6]/10 text-[#8B5CF6]" loading={loading} />
          <KPICard icon="🤖" label="Model Accuracy" value={creditAcc}
            sub="LightGBM ensemble" trend={{ val: '0.8%', up: true }} color="bg-[#06B6D4]/10 text-[#06B6D4]" loading={loading} />
        </div>

        {/* Row 2: Charts */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Network Traffic */}
          <div className="col-span-2 bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Network Traffic Monitor</h2>
                <p className="text-xs text-[#64748B]">Live packet rate — attack spike detected at 17:35</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-1 bg-[#00D4AA] inline-block rounded" /> Normal</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1 bg-[#EF4444] inline-block rounded" /> Attack</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trafficData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAttack" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis dataKey="t" stroke="#475569" tick={{ fontSize: 10 }} interval={9} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#E2E8F0' }}
                  formatter={(v: any) => [`${(v/1000).toFixed(1)}K pkt/s`, '']}
                />
                <Area type="monotone" dataKey="normal" stroke="#00D4AA" fill="url(#gNormal)" strokeWidth={2} />
                <Area type="monotone" dataKey="attack" stroke="#EF4444" fill="url(#gAttack)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution Donut */}
          <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Risk Distribution</h2>
            <p className="text-xs text-[#64748B] mb-4">Customer portfolio breakdown</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={riskPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value">
                  {riskPie.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {riskPie.map(r => (
                <div key={r.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RISK_COLORS[r.name as keyof typeof RISK_COLORS] }} />
                  <span className="text-xs text-[#94A3B8] truncate">{r.name}</span>
                  <span className="text-xs font-semibold text-white ml-auto">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Occupation Risk + Alerts */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          {/* Occupation Risk */}
          <div className="col-span-2 bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Delinquency Risk by Occupation</h2>
            <p className="text-xs text-[#64748B] mb-4">% of customers at risk per segment</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={occupationData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" horizontal={false} />
                <XAxis type="number" domain={[0, 60]} stroke="#475569" tick={{ fontSize: 10 }}
                  tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} width={64} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [`${v}%`, 'Risk Rate']}
                />
                <Bar dataKey="risk" radius={[0, 4, 4, 0]}>
                  {occupationData.map((entry, i) => (
                    <Cell key={i} fill={entry.risk > 35 ? '#EF4444' : entry.risk > 20 ? '#F59E0B' : '#00D4AA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alerts */}
          <div className="col-span-3 bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Live Alert Feed</h2>
              <span className="text-xs bg-[#EF4444]/10 text-[#EF4444] px-2 py-1 rounded-full font-semibold">
                {ALERTS.filter(a => a.sev === 'CRITICAL' || a.sev === 'HIGH').length} Active
              </span>
            </div>
            <div className="space-y-2">
              {ALERTS.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#060B18] border border-[#1E2D4A] hover:border-[#2A3A5C] transition-colors">
                  <span className="text-base flex-shrink-0 mt-0.5">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        a.sev === 'CRITICAL' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                        a.sev === 'HIGH' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                        a.sev === 'MEDIUM' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' :
                        'bg-[#00D4AA]/20 text-[#00D4AA]'
                      }`}>{a.sev}</span>
                      <span className="text-xs text-[#64748B]">{a.time}</span>
                    </div>
                    <p className="text-sm text-[#94A3B8] truncate">{a.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Model Status */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Credit Risk Model',
              icon: '🏦',
              trained: metrics?.credit_model_trained ?? false,
              detail: metrics?.credit_metrics ? `AUC: ${metrics.credit_metrics.auc_roc?.toFixed(3)} | F1: ${metrics.credit_metrics.f1?.toFixed(3)}` : 'LightGBM + GB + RF Ensemble',
              algo: 'LightGBM Ensemble',
            },
            {
              label: 'DDoS Detection Model',
              icon: '🛡️',
              trained: metrics?.ddos_model_trained ?? false,
              detail: metrics?.ddos_metrics ? `RF: ${(metrics.ddos_metrics.random_forest_accuracy * 100).toFixed(1)}% | GB: ${(metrics.ddos_metrics.gradient_boosting_accuracy * 100).toFixed(1)}%` : 'MLP + RF + GB ensemble',
              algo: 'Neural Net + Ensemble',
            },
            {
              label: 'Correlation Engine',
              icon: '🔗',
              trained: true,
              detail: 'Cross-domain risk fusion',
              algo: 'Custom weighted scoring',
            },
            {
              label: 'SHAP Explainer',
              icon: '🔍',
              trained: true,
              detail: 'Feature attribution ready',
              algo: 'Shapley values',
            },
          ].map((m, i) => (
            <div key={i} className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{m.icon}</span>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
                  m.trained ? 'bg-[#00D4AA]/10 text-[#00D4AA]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${m.trained ? 'bg-[#00D4AA] animate-pulse' : 'bg-[#F59E0B]'}`} />
                  {m.trained ? 'Active' : 'Pending'}
                </div>
              </div>
              <div className="text-sm font-semibold text-white mb-1">{m.label}</div>
              <div className="text-xs text-[#64748B] mb-2">{m.algo}</div>
              <div className="text-xs text-[#94A3B8]">{m.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
