'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, Legend,
} from 'recharts'
import { getOverviewAnalytics, getSpendingAnalytics, OverviewAnalytics, SpendingAnalytics } from '@/lib/api'

// ─── Static demo data ─────────────────────────────────────────────────────────

const CITY_RISK = [
  { city: 'Mumbai', risk: 18, customers: 62, loans: 48.2 },
  { city: 'Delhi', risk: 22, customers: 58, loans: 38.1 },
  { city: 'Bangalore', risk: 14, customers: 71, loans: 52.3 },
  { city: 'Chennai', risk: 20, customers: 45, loans: 29.8 },
  { city: 'Pune', risk: 16, customers: 39, loans: 31.2 },
  { city: 'Hyderabad', risk: 19, customers: 43, loans: 35.6 },
  { city: 'Kolkata', risk: 27, customers: 38, loans: 22.4 },
  { city: 'Ahmedabad', risk: 21, customers: 35, loans: 24.1 },
  { city: 'Jaipur', risk: 31, customers: 28, loans: 18.3 },
  { city: 'Lucknow', risk: 36, customers: 24, loans: 14.7 },
]

const OCC_RISK = [
  { occupation: 'Salaried-IT', delinquency: 12, avgCibil: 748, avgIncome: 920000, customers: 80 },
  { occupation: 'Salaried-NonIT', delinquency: 22, avgCibil: 703, avgIncome: 620000, customers: 75 },
  { occupation: 'Business-Owner', delinquency: 35, avgCibil: 681, avgIncome: 1150000, customers: 65 },
  { occupation: 'Government-Employee', delinquency: 8, avgCibil: 762, avgIncome: 580000, customers: 60 },
  { occupation: 'Farmer', delinquency: 48, avgCibil: 612, avgIncome: 280000, customers: 55 },
  { occupation: 'Student', delinquency: 28, avgCibil: 641, avgIncome: 180000, customers: 50 },
  { occupation: 'Self-Employed', delinquency: 31, avgCibil: 668, avgIncome: 780000, customers: 70 },
  { occupation: 'Retired', delinquency: 18, avgCibil: 724, avgIncome: 240000, customers: 45 },
]

const CIBIL_DIST = [
  { band: '<600 Bad', count: 42, color: '#EF4444' },
  { band: '600-649 Poor', count: 67, color: '#F97316' },
  { band: '650-699 Fair', count: 98, color: '#F59E0B' },
  { band: '700-749 Good', count: 134, color: '#3B82F6' },
  { band: '750+ Excellent', count: 159, color: '#00D4AA' },
]

const SPEND_CATS = ['Food', 'Shopping', 'Travel', 'Entertainment', 'Utilities', 'EMI']
const SPEND_COLORS = ['#00D4AA', '#3B82F6', '#F59E0B', '#8B5CF6', '#F97316', '#EF4444']

const SPEND_BY_OCC_DEMO: Record<string, number[]> = {
  'Salaried-IT': [6200, 8400, 5600, 3200, 4800, 22000],
  'Business-Owner': [8500, 12000, 9800, 5400, 5200, 35000],
  'Government-Emp': [4800, 5200, 2800, 1800, 4200, 16000],
  'Farmer': [5500, 2400, 1200, 800, 3800, 8000],
  'Student': [3200, 4800, 3400, 2800, 2400, 5000],
  'Self-Employed': [7200, 7800, 4800, 2800, 4600, 24000],
}

const RISK_SCATTER = OCC_RISK.map(o => ({
  x: o.avgCibil,
  y: o.delinquency,
  z: o.avgIncome / 100000,
  name: o.occupation.replace('Salaried-', '').replace('Government-Employee', 'Gov-Emp').replace('Business-Owner', 'Biz').replace('Self-Employed', 'Self-Emp'),
}))

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-[#1A2340] animate-pulse rounded ${className}`} />
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null)
  const [spending, setSpending] = useState<SpendingAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOcc, setSelectedOcc] = useState('Salaried-IT')

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, sp] = await Promise.all([getOverviewAnalytics(), getSpendingAnalytics()])
        setOverview(ov)
        setSpending(sp)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const spendData = spending?.occupation_spending?.[selectedOcc]
    ? SPEND_CATS.map((cat, i) => ({
        name: cat,
        amount: spending.occupation_spending[selectedOcc][cat.toLowerCase()] ?? 0,
      }))
    : SPEND_CATS.map((cat, i) => ({
        name: cat,
        amount: (SPEND_BY_OCC_DEMO[selectedOcc] ?? SPEND_BY_OCC_DEMO['Salaried-IT'])[i],
      }))

  const totalSpend = spendData.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="min-h-screen bg-[#060B18] p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Risk Analytics</h1>
        <p className="text-[#94A3B8] text-sm">Occupation, city, CIBIL, and spending behaviour analysis across 500 Indian customers</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Portfolio', value: loading ? '—' : `₹${((overview?.total_loan_portfolio ?? 4280000000) / 1e7).toFixed(1)}Cr`, color: '#00D4AA', icon: '💰' },
          { label: 'Avg CIBIL', value: loading ? '—' : (overview?.avg_cibil_score?.toFixed(0) ?? '718'), color: '#3B82F6', icon: '📊' },
          { label: 'Delinquency Rate', value: loading ? '—' : `${((overview?.avg_delinquency_rate ?? 0.182) * 100).toFixed(1)}%`, color: '#EF4444', icon: '⚠️' },
          { label: 'High Risk', value: loading ? '—' : String((overview?.high_risk_count ?? 0) + (overview?.critical_risk_count ?? 0)), color: '#F97316', icon: '🔴' },
          { label: 'Safe Customers', value: loading ? '—' : String(overview?.low_risk_count ?? 210), color: '#00D4AA', icon: '✅' },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl">{k.icon}</span>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: k.color }} />
            </div>
            {loading ? <Skeleton className="h-7 w-20 mb-1" /> : (
              <div className="text-2xl font-bold text-white mb-1">{k.value}</div>
            )}
            <div className="text-xs text-[#64748B]">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Occupation Risk + CIBIL Distribution */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        {/* Occupation risk heatmap */}
        <div className="col-span-3 bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-1">Delinquency Risk by Occupation</h3>
          <p className="text-xs text-[#64748B] mb-4">Avg CIBIL, delinquency %, and income by occupation type</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1E2D4A]">
                  <th className="text-left py-2 text-[#64748B] font-medium px-3">Occupation</th>
                  <th className="text-right py-2 text-[#64748B] font-medium px-3">Customers</th>
                  <th className="text-right py-2 text-[#64748B] font-medium px-3">Avg CIBIL</th>
                  <th className="text-right py-2 text-[#64748B] font-medium px-3">Avg Income</th>
                  <th className="text-left py-2 text-[#64748B] font-medium px-3">Delinquency Rate</th>
                </tr>
              </thead>
              <tbody>
                {OCC_RISK.sort((a, b) => b.delinquency - a.delinquency).map((o, i) => {
                  const riskColor = o.delinquency > 35 ? '#EF4444' : o.delinquency > 25 ? '#F97316' : o.delinquency > 15 ? '#F59E0B' : '#00D4AA'
                  return (
                    <tr key={i} className="border-b border-[#1E2D4A] hover:bg-[#1A2340] transition-colors">
                      <td className="py-2.5 px-3 text-white font-medium">{o.occupation}</td>
                      <td className="py-2.5 px-3 text-right text-[#94A3B8]">{o.customers}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span style={{ color: o.avgCibil >= 750 ? '#00D4AA' : o.avgCibil >= 700 ? '#3B82F6' : o.avgCibil >= 650 ? '#F59E0B' : '#EF4444' }}>
                          {o.avgCibil}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#94A3B8]">₹{(o.avgIncome / 100000).toFixed(1)}L</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#060B18] rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full rounded-full flex items-center px-1.5 transition-all"
                              style={{ width: `${o.delinquency * 1.8}%`, backgroundColor: riskColor }}
                            >
                              <span className="text-xs font-bold text-black">{o.delinquency}%</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CIBIL Distribution */}
        <div className="col-span-2 bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-1">CIBIL Score Distribution</h3>
          <p className="text-xs text-[#64748B] mb-4">Portfolio breakdown by credit score band</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CIBIL_DIST} margin={{ bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="band" stroke="#475569" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={45} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
              />
              <Bar dataKey="count" name="Customers" radius={[4, 4, 0, 0]}>
                {CIBIL_DIST.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {CIBIL_DIST.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="text-[#94A3B8]">{b.band}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{b.count}</span>
                  <span className="text-[#64748B]">({(b.count / 500 * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Spending by Occupation + City Risk */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Spending Analysis */}
        <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Spending Pattern by Occupation</h3>
              <p className="text-xs text-[#64748B]">Monthly avg spending across categories</p>
            </div>
            <select
              value={selectedOcc}
              onChange={e => setSelectedOcc(e.target.value)}
              className="bg-[#060B18] border border-[#1E2D4A] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#00D4AA]"
            >
              {Object.keys(SPEND_BY_OCC_DEMO).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={spendData} margin={{ bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => [`₹${(v as number).toLocaleString('en-IN')}`, 'Monthly Avg']}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {spendData.map((_, i) => <Cell key={i} fill={SPEND_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            {spendData.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: SPEND_COLORS[i] }} />
                <span className="text-[#94A3B8]">{s.name}</span>
                <span className="text-white ml-auto font-medium">₹{(s.amount / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-[#1E2D4A] flex justify-between text-xs">
            <span className="text-[#64748B]">Total Monthly Spend</span>
            <span className="font-bold text-white">₹{totalSpend.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* City Risk */}
        <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-1">Geographic Risk Map</h3>
          <p className="text-xs text-[#64748B] mb-4">Delinquency rate vs loan portfolio by city</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CITY_RISK} layout="vertical" margin={{ left: 0, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" horizontal={false} />
              <XAxis type="number" domain={[0, 45]} stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="city" stroke="#475569" tick={{ fontSize: 10 }} width={68} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => [`${v}%`, 'Delinquency Rate']}
              />
              <Bar dataKey="risk" radius={[0, 4, 4, 0]} name="Delinquency Rate">
                {CITY_RISK.map((c, i) => (
                  <Cell key={i} fill={c.risk > 30 ? '#EF4444' : c.risk > 22 ? '#F97316' : c.risk > 16 ? '#F59E0B' : '#00D4AA'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: CIBIL vs Delinquency scatter + spending insights */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-1">CIBIL Score vs Delinquency Risk (by Occupation)</h3>
          <p className="text-xs text-[#64748B] mb-4">Bubble size = Average income. Confirms CIBIL is strong predictor.</p>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis type="number" dataKey="x" domain={[580, 780]} stroke="#475569" tick={{ fontSize: 10 }}
                label={{ value: 'CIBIL Score', position: 'insideBottom', fill: '#64748B', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" domain={[0, 60]} stroke="#475569" tick={{ fontSize: 10 }}
                label={{ value: 'Delinquency %', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }} />
              <ZAxis type="number" dataKey="z" range={[100, 600]} />
              <Tooltip
                content={({ payload }: any) => {
                  if (!payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-lg p-3 text-xs">
                      <div className="font-bold text-white mb-1">{d?.name}</div>
                      <div className="text-[#94A3B8]">CIBIL: <span className="text-white">{d?.x}</span></div>
                      <div className="text-[#94A3B8]">Risk: <span className="text-[#EF4444]">{d?.y}%</span></div>
                      <div className="text-[#94A3B8]">Avg Income: <span className="text-white">₹{(d?.z * 1).toFixed(1)}L</span></div>
                    </div>
                  )
                }}
              />
              <Scatter data={RISK_SCATTER} fill="#00D4AA" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Key Behavioural Insights</h3>
          <div className="space-y-3">
            {[
              { icon: '🌾', title: 'Farmers at Highest Risk', desc: '48% delinquency — seasonal income, low CIBIL (612). Need monsoon-linked EMI restructuring.', color: '#EF4444' },
              { icon: '💻', title: 'IT Sector Safest', desc: 'Only 12% risk — stable income, high CIBIL (748). Prime candidates for premium credit products.', color: '#00D4AA' },
              { icon: '🏢', title: 'Business Owners Volatile', desc: '35% risk despite high income (₹11.5L). Irregular cash flows despite good earnings.', color: '#F97316' },
              { icon: '🏛️', title: 'Govt. Employees Most Stable', desc: '8% risk — job security, pension guarantees. Best CIBIL average (762).', color: '#3B82F6' },
              { icon: '🎓', title: 'Students — Future Risk', desc: '28% risk — thin credit history, high utilization. Early intervention key.', color: '#F59E0B' },
              { icon: '🗺️', title: 'Tier 2 Cities Higher Risk', desc: 'Jaipur (31%), Lucknow (36%) vs Mumbai (18%). Regional economic disparities visible.', color: '#8B5CF6' },
            ].map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#060B18] border border-[#1E2D4A]">
                <span className="text-xl flex-shrink-0">{insight.icon}</span>
                <div>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: insight.color }}>{insight.title}</div>
                  <div className="text-xs text-[#94A3B8] leading-4">{insight.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spending Comparison: High Risk vs Low Risk */}
      <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-1">High-Risk vs Low-Risk Customer Spending Comparison</h3>
        <p className="text-xs text-[#64748B] mb-4">Average monthly spending by category — delinquent vs safe customers</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={SPEND_CATS.map((cat, i) => ({
              category: cat,
              high_risk: [9200, 12800, 7600, 4800, 4200, 28000][i],
              low_risk: [4800, 5200, 3200, 2100, 4600, 14000][i],
            }))}
            margin={{ bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
            <XAxis dataKey="category" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
              formatter={(v: any) => [`₹${(v as number).toLocaleString('en-IN')}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="high_risk" name="High-Risk Customers" fill="#EF4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="low_risk" name="Low-Risk Customers" fill="#00D4AA" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          {[
            { label: 'Shopping Overspend', val: '+146%', desc: 'High-risk customers spend 2.5x more on shopping', color: '#EF4444' },
            { label: 'EMI Burden', val: '+100%', desc: 'Double EMI load relative to safe customers', color: '#F97316' },
            { label: 'Travel Spend', val: '+138%', desc: 'Aspirational spending despite financial stress', color: '#F59E0B' },
          ].map((i, idx) => (
            <div key={idx} className="bg-[#060B18] rounded-lg p-3 border border-[#1E2D4A]">
              <div className="font-bold text-lg mb-1" style={{ color: i.color }}>{i.val}</div>
              <div className="text-[#94A3B8] font-medium mb-0.5">{i.label}</div>
              <div className="text-[#64748B] text-xs">{i.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
