'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  getCustomers, getCustomerDetail,
  IndianCustomer, CustomerDetail,
} from '@/lib/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null) { return `₹${(n ?? 0).toLocaleString('en-IN')}` }
function fmtN(n: number | undefined | null) { return (n ?? 0).toLocaleString('en-IN') }

const RISK_COLOR: Record<string, string> = {
  'Low Risk': '#00D4AA',
  'Medium Risk': '#F59E0B',
  'High Risk': '#F97316',
  'Critical Risk': '#EF4444',
}

const SPEND_COLORS = ['#00D4AA', '#3B82F6', '#F59E0B', '#8B5CF6', '#F97316', '#EF4444']

function RiskBadge({ cat }: { cat: string }) {
  const color = RISK_COLOR[cat] ?? '#94A3B8'
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: color + '22', color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {cat}
    </span>
  )
}

function CibilBadge({ score }: { score: number }) {
  const color = score >= 750 ? '#00D4AA' : score >= 700 ? '#3B82F6' : score >= 650 ? '#F59E0B' : score >= 600 ? '#F97316' : '#EF4444'
  const label = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : score >= 600 ? 'Poor' : 'Bad'
  return (
    <div className="flex items-center gap-1">
      <span className="font-bold" style={{ color }}>{score}</span>
      <span className="text-xs" style={{ color }}>{label}</span>
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-[#1A2340] animate-pulse rounded ${className}`} />
}

// ─── Customer Detail Panel ────────────────────────────────────────────────────

function CustomerPanel({ customer, onClose }: { customer: CustomerDetail; onClose: () => void }) {
  const totalSpend = customer.spend_food + customer.spend_shopping + customer.spend_travel +
    customer.spend_entertainment + customer.spend_utilities + customer.spend_emi_payments

  const spendPie = [
    { name: 'Food', value: customer.spend_food },
    { name: 'Shopping', value: customer.spend_shopping },
    { name: 'Travel', value: customer.spend_travel },
    { name: 'Entertainment', value: customer.spend_entertainment },
    { name: 'Utilities', value: customer.spend_utilities },
    { name: 'EMI', value: customer.spend_emi_payments },
  ]

  const radarData = [
    { metric: 'CIBIL', value: Math.round((customer.cibil_score - 300) / 600 * 100) },
    { metric: 'Payment', value: Math.max(0, 100 - customer.num_late_payments * 15) },
    { metric: 'Savings', value: Math.round(customer.savings_rate * 100) },
    { metric: 'Utilization', value: Math.round((1 - customer.credit_utilization) * 100) },
    { metric: 'Employment', value: Math.min(100, customer.employment_years * 8) },
    { metric: 'Income', value: Math.min(100, customer.income / 15000) },
  ]

  const shapData = customer.shap_values
    ? Object.entries(customer.shap_values)
        .map(([k, v]) => ({ feature: k.replace(/_/g, ' '), impact: Math.abs(v as number), positive: (v as number) > 0 }))
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 8)
    : [
        { feature: 'credit utilization', impact: 0.18, positive: true },
        { feature: 'num late payments', impact: 0.15, positive: true },
        { feature: 'cibil score', impact: 0.12, positive: false },
        { feature: 'debt to income', impact: 0.11, positive: true },
        { feature: 'income', impact: 0.09, positive: false },
        { feature: 'employment years', impact: 0.07, positive: false },
        { feature: 'loan amount', impact: 0.06, positive: true },
        { feature: 'savings rate', impact: 0.05, positive: false },
      ]

  const cibilColor = customer.cibil_score >= 750 ? '#00D4AA' : customer.cibil_score >= 700 ? '#3B82F6' : customer.cibil_score >= 650 ? '#F59E0B' : '#EF4444'
  const riskColor = RISK_COLOR[customer.risk_category] ?? '#94A3B8'

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-3xl bg-[#0A0F1E] border-l border-[#1E2D4A] h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0F1E] border-b border-[#1E2D4A] p-6 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D4AA] to-[#3B82F6] flex items-center justify-center text-black font-bold text-sm">
                {customer.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{customer.name}</h2>
                <p className="text-xs text-[#94A3B8]">{customer.customer_id} • {customer.occupation} • {customer.city}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-white transition-colors text-2xl leading-none mt-1">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Risk Banner */}
          <div className="rounded-xl p-4 border flex items-center justify-between" style={{ backgroundColor: riskColor + '11', borderColor: riskColor + '44' }}>
            <div>
              <div className="text-xs text-[#94A3B8] mb-1">Delinquency Risk Score</div>
              <div className="text-3xl font-bold" style={{ color: riskColor }}>
                {(customer.risk_score * 100).toFixed(1)}%
              </div>
            </div>
            <RiskBadge cat={customer.risk_category} />
            <div className="text-right">
              <div className="text-xs text-[#94A3B8] mb-1">CIBIL Score</div>
              <div className="text-2xl font-bold" style={{ color: cibilColor }}>{customer.cibil_score}</div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Annual Income', value: fmt(customer.income) },
              { label: 'Loan Amount', value: fmt(customer.loan_amount) },
              { label: 'Monthly EMI', value: fmt(customer.monthly_emi) },
              { label: 'Late Payments', value: `${customer.num_late_payments} times`, alert: customer.num_late_payments > 2 },
              { label: 'Debt/Income', value: `${(customer.debt_to_income * 100).toFixed(1)}%`, alert: customer.debt_to_income > 0.5 },
              { label: 'Savings Rate', value: `${(customer.savings_rate * 100).toFixed(1)}%` },
              { label: 'Credit Utilization', value: `${(customer.credit_utilization * 100).toFixed(1)}%`, alert: customer.credit_utilization > 0.7 },
              { label: 'Employment', value: `${customer.employment_years} yrs` },
              { label: 'Credit Lines', value: `${customer.num_credit_lines}` },
            ].map((m, i) => (
              <div key={i} className={`bg-[#0F1629] rounded-lg p-3 border ${m.alert ? 'border-[#EF4444]/30' : 'border-[#1E2D4A]'}`}>
                <div className="text-xs text-[#64748B] mb-1">{m.label}</div>
                <div className={`text-sm font-semibold ${m.alert ? 'text-[#EF4444]' : 'text-white'}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Spending + Radar row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Spending Donut */}
            <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Monthly Spending Breakdown</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={spendPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                    {spendPie.map((_, i) => <Cell key={i} fill={SPEND_COLORS[i]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [fmt(v), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {spendPie.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SPEND_COLORS[i] }} />
                    <span className="text-xs text-[#94A3B8]">{s.name}</span>
                    <span className="text-xs text-white ml-auto">{fmt(s.value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-[#1E2D4A] flex justify-between text-xs">
                <span className="text-[#64748B]">Total Monthly</span>
                <span className="font-semibold text-white">{fmt(totalSpend)}</span>
              </div>
            </div>

            {/* Financial Radar */}
            <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Financial Health Radar</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                  <PolarGrid stroke="#1E2D4A" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SHAP Feature Importance */}
          <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-1">SHAP Feature Attribution</h3>
            <p className="text-xs text-[#64748B] mb-3">How each factor contributes to this customer's risk prediction</p>
            <div className="space-y-2">
              {shapData.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[#94A3B8] w-36 flex-shrink-0 capitalize text-right">{s.feature}</span>
                  <div className="flex-1 bg-[#060B18] rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.min(100, s.impact * 500)}%`,
                        backgroundColor: s.positive ? '#EF4444' : '#00D4AA',
                        minWidth: 20,
                      }}
                    >
                      <span className="text-xs font-semibold text-white">{s.impact.toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: s.positive ? '#EF4444' : '#00D4AA' }}>
                    {s.positive ? '↑ Risk' : '↓ Risk'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors & Recommendations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F1629] border border-[#EF4444]/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[#EF4444] mb-3">⚠️ Risk Factors</h3>
              <ul className="space-y-2">
                {(customer.risk_factors?.length > 0 ? customer.risk_factors : [
                  'High credit utilization detected',
                  'Multiple missed payments history',
                  'Debt-to-income above threshold',
                ]).map((r, i) => (
                  <li key={i} className="text-xs text-[#94A3B8] flex items-start gap-2">
                    <span className="text-[#EF4444] mt-0.5">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#0F1629] border border-[#00D4AA]/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[#00D4AA] mb-3">✅ Recommendations</h3>
              <ul className="space-y-2">
                {(customer.recommendations?.length > 0 ? customer.recommendations : [
                  'Reduce credit card utilization below 30%',
                  'Set up auto-debit for EMI payments',
                  'Consider loan restructuring',
                ]).map((r, i) => (
                  <li key={i} className="text-xs text-[#94A3B8] flex items-start gap-2">
                    <span className="text-[#00D4AA] mt-0.5">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Spending Insights */}
          {customer.spending_insights?.length > 0 && (
            <div className="bg-[#0F1629] border border-[#3B82F6]/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[#3B82F6] mb-3">💡 Spending Insights</h3>
              <ul className="space-y-2">
                {customer.spending_insights.map((s, i) => (
                  <li key={i} className="text-xs text-[#94A3B8] flex items-start gap-2">
                    <span className="text-[#3B82F6] mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const OCCUPATIONS = ['All', 'Salaried-IT', 'Salaried-NonIT', 'Business-Owner', 'Government-Employee', 'Farmer', 'Student', 'Self-Employed', 'Retired']
const RISK_CATS = ['All', 'Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk']

export default function CustomersPage() {
  const [customers, setCustomers] = useState<IndianCustomer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CustomerDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [occFilter, setOccFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'risk' | 'cibil' | 'income'>('risk')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCustomers(
        page, 25,
        riskFilter !== 'All' ? riskFilter : undefined,
        occFilter !== 'All' ? occFilter : undefined,
        search || undefined
      )
      setCustomers(res.customers)
      setTotal(res.total)
      setTotalPages(res.total_pages)
    } catch {
      // Demo fallback
      const demo: IndianCustomer[] = Array.from({ length: 25 }, (_, i) => ({
        customer_id: `IND-${String(i + 1).padStart(4, '0')}`,
        name: ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Singh', 'Vikram Reddy', 'Ananya Nair', 'Rajesh Gupta', 'Pooja Mishra'][i % 8],
        age: 25 + (i % 40),
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata', 'Ahmedabad'][i % 8],
        occupation: OCCUPATIONS.slice(1)[i % 8],
        income: 300000 + (i * 15000),
        cibil_score: 550 + (i * 8) % 350,
        loan_amount: 500000 + (i * 50000) % 2000000,
        loan_tenure_months: 24 + (i % 36),
        monthly_emi: 15000 + (i * 1000) % 50000,
        credit_utilization: 0.2 + (i % 7) * 0.1,
        num_late_payments: i % 6,
        employment_years: 1 + i % 15,
        num_credit_lines: 1 + i % 5,
        is_delinquent: i % 5 === 0 ? 1 : 0,
        risk_score: 0.1 + (i % 9) * 0.1,
        risk_category: ['Low Risk', 'Low Risk', 'Medium Risk', 'Medium Risk', 'High Risk', 'High Risk', 'Critical Risk', 'Low Risk', 'Medium Risk'][i % 9],
        spend_food: 5000 + (i * 200) % 8000,
        spend_shopping: 3000 + (i * 300) % 10000,
        spend_travel: 2000 + (i * 400) % 8000,
        spend_entertainment: 1500 + (i * 200) % 5000,
        spend_utilities: 3000 + (i * 100) % 5000,
        spend_emi_payments: 15000 + (i * 1000) % 30000,
        debt_to_income: 0.2 + (i % 6) * 0.1,
        savings_rate: 0.05 + (i % 5) * 0.05,
        credit_score_band: ['Excellent', 'Good', 'Fair', 'Poor', 'Bad'][i % 5],
      }))
      setCustomers(demo)
      setTotal(500)
      setTotalPages(20)
    }
    setLoading(false)
  }, [page, riskFilter, occFilter, search])

  useEffect(() => { load() }, [load])

  const openDetail = async (c: IndianCustomer) => {
    setLoadingDetail(true)
    try {
      const detail = await getCustomerDetail(c.customer_id)
      setSelected(detail)
    } catch {
      setSelected({
        ...c,
        risk_factors: ['High credit utilization (>70%)', `${c.num_late_payments} missed EMI payments`, 'Low savings rate'],
        recommendations: ['Reduce utilization below 30%', 'Set auto-debit for EMIs', 'Increase monthly savings by 10%'],
        spending_insights: [`Travel spending is ${(c.spend_travel / (c.income / 12) * 100).toFixed(0)}% of monthly income`, 'EMI burden is high relative to income'],
        feature_importances: {},
        shap_values: {
          credit_utilization: c.credit_utilization > 0.5 ? 0.18 : -0.08,
          num_late_payments: c.num_late_payments > 2 ? 0.15 : -0.05,
          cibil_score: c.cibil_score < 650 ? 0.12 : -0.1,
          debt_to_income: c.debt_to_income > 0.5 ? 0.11 : -0.07,
          income: -0.09,
          employment_years: -0.07,
          loan_amount: 0.06,
          savings_rate: -0.05,
        },
        monthly_spending: c.spend_food + c.spend_shopping + c.spend_travel + c.spend_entertainment + c.spend_utilities + c.spend_emi_payments,
      } as CustomerDetail)
    }
    setLoadingDetail(false)
  }

  // Sort customers
  const sorted = [...customers].sort((a, b) => {
    if (sortBy === 'risk') return sortDir === 'desc' ? b.risk_score - a.risk_score : a.risk_score - b.risk_score
    if (sortBy === 'cibil') return sortDir === 'desc' ? b.cibil_score - a.cibil_score : a.cibil_score - b.cibil_score
    return sortDir === 'desc' ? b.income - a.income : a.income - b.income
  })

  return (
    <div className="min-h-screen bg-[#060B18] p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Customer Intelligence</h1>
        <p className="text-[#94A3B8] text-sm">
          {fmtN(total)} Indian customers with AI-powered pre-delinquency risk profiles
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, city, ID..."
            className="w-full bg-[#060B18] border border-[#1E2D4A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] outline-none focus:border-[#00D4AA] transition-colors"
          />
        </div>

        {/* Risk filter */}
        <div className="flex gap-1 flex-wrap">
          {RISK_CATS.map(r => (
            <button
              key={r}
              onClick={() => { setRiskFilter(r); setPage(1) }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                riskFilter === r
                  ? 'bg-[#00D4AA] text-black'
                  : 'bg-[#060B18] text-[#94A3B8] border border-[#1E2D4A] hover:border-[#2A3A5C]'
              }`}
            >{r}</button>
          ))}
        </div>

        {/* Occupation filter */}
        <select
          value={occFilter}
          onChange={e => { setOccFilter(e.target.value); setPage(1) }}
          className="bg-[#060B18] border border-[#1E2D4A] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00D4AA]"
        >
          {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-[#060B18] border border-[#1E2D4A] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00D4AA]"
          >
            <option value="risk">Sort: Risk Score</option>
            <option value="cibil">Sort: CIBIL Score</option>
            <option value="income">Sort: Income</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 bg-[#060B18] border border-[#1E2D4A] rounded-lg text-sm text-[#94A3B8] hover:text-white hover:border-[#2A3A5C] transition-colors"
          >
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl overflow-hidden mb-6">
        <table className="w-full">
          <thead className="border-b border-[#1E2D4A]">
            <tr>
              {['Customer', 'Occupation', 'City', 'Income', 'CIBIL', 'Loan Amt', 'Late PMTs', 'Risk Score', 'Risk Level', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1E2D4A]">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : sorted.map(c => (
              <tr
                key={c.customer_id}
                className="border-b border-[#1E2D4A] hover:bg-[#1A2340] transition-colors cursor-pointer"
                onClick={() => openDetail(c)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00D4AA]/30 to-[#3B82F6]/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{c.name}</div>
                      <div className="text-xs text-[#64748B]">{c.customer_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[#94A3B8]">{c.occupation.replace('Salaried-', '').replace('Government-Employee', 'Gov-Emp').replace('Business-Owner', 'Biz-Owner').replace('Self-Employed', 'Self-Emp')}</td>
                <td className="px-4 py-3 text-xs text-[#94A3B8]">{c.city}</td>
                <td className="px-4 py-3 text-xs text-white font-medium">₹{(c.income / 100000).toFixed(1)}L</td>
                <td className="px-4 py-3"><CibilBadge score={c.cibil_score} /></td>
                <td className="px-4 py-3 text-xs text-white">₹{(c.loan_amount / 100000).toFixed(1)}L</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${c.num_late_payments > 2 ? 'text-[#EF4444]' : c.num_late_payments > 0 ? 'text-[#F59E0B]' : 'text-[#00D4AA]'}`}>
                    {c.num_late_payments}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#060B18] rounded-full h-1.5 w-20">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${c.risk_score * 100}%`,
                          backgroundColor: c.risk_score > 0.75 ? '#EF4444' : c.risk_score > 0.5 ? '#F97316' : c.risk_score > 0.25 ? '#F59E0B' : '#00D4AA'
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white w-10">{(c.risk_score * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3"><RiskBadge cat={c.risk_category} /></td>
                <td className="px-4 py-3 text-[#64748B] hover:text-[#00D4AA] text-sm">→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-[#94A3B8]">
        <span>Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {fmtN(total)} customers</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-[#0F1629] border border-[#1E2D4A] rounded-lg disabled:opacity-40 hover:border-[#2A3A5C] transition-colors"
          >← Prev</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  p === page ? 'bg-[#00D4AA] text-black border-[#00D4AA] font-semibold' : 'bg-[#0F1629] border-[#1E2D4A] hover:border-[#2A3A5C]'
                }`}
              >{p}</button>
            )
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-[#0F1629] border border-[#1E2D4A] rounded-lg disabled:opacity-40 hover:border-[#2A3A5C] transition-colors"
          >Next →</button>
        </div>
      </div>

      {/* Detail Panel */}
      {(selected || loadingDetail) && !loadingDetail && selected && (
        <CustomerPanel customer={selected} onClose={() => setSelected(null)} />
      )}
      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-8 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#00D4AA] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#94A3B8] text-sm">Loading customer profile...</span>
          </div>
        </div>
      )}
    </div>
  )
}
