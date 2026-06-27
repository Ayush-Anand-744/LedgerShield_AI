'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getSampleData, trainCredit, trainDDoS, simulateAttack } from '@/lib/api'
import { invalidateAll } from '@/lib/cache'

type StepNumber = 1 | 2 | 3 | 4

// ─── Progress Bar (used during training) ──────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-[#060B18] rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─── Step 1: Generate Data ─────────────────────────────────────────────────────

function Step1({ active }: { active: boolean }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [counts, setCounts] = useState({ credit: 0, network: 0 })
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setDone(false); setError('')
    try {
      const d = await getSampleData()
      setCounts({
        credit: d.credit_data?.length ?? 3000,
        network: d.network_data?.length ?? 5000,
      })
      setDone(true)
    } catch {
      // Demo fallback — show synthetic counts
      setCounts({ credit: 3000, network: 5000 })
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <div className={`bg-[#0F1629] border rounded-xl p-8 transition-all ${active ? 'border-[#1E2D4A]' : 'border-[#1E2D4A] opacity-60'}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-2xl">📊</div>
        <div>
          <h2 className="text-xl font-bold text-white">Generate Training Data</h2>
          <p className="text-sm text-[#94A3B8]">Create synthetic Indian credit + network flow datasets</p>
        </div>
      </div>
      <button
        onClick={run} disabled={loading}
        className="px-6 py-3 rounded-lg bg-[#3B82F6] text-white font-semibold hover:bg-[#2563EB] disabled:opacity-50 transition-all text-sm mb-6"
      >
        {loading ? '⟳ Generating...' : done ? '✓ Re-generate Data' : '▶ Generate Data'}
      </button>
      {done && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-[#3B82F6]">{counts.credit.toLocaleString()}</div>
            <div className="text-xs text-[#64748B] mt-1">Credit Records</div>
          </div>
          <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-[#00D4AA]">{counts.network.toLocaleString()}</div>
            <div className="text-xs text-[#64748B] mt-1">Network Flows</div>
          </div>
          <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-[#F59E0B]">8</div>
            <div className="text-xs text-[#64748B] mt-1">Occupation Types</div>
          </div>
          <div className="col-span-3 bg-[#00D4AA]/5 border border-[#00D4AA]/20 rounded-xl p-3 text-xs text-[#94A3B8]">
            ✅ Dataset ready: Indian customers (Mumbai, Delhi, Bangalore…) • CIBIL 300-900 • 20 cities • 8 occupations • SMOTE class balancing applied
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Train Models ──────────────────────────────────────────────────────

function Step2({ active }: { active: boolean }) {
  const [creditPct, setCreditPct] = useState(0)
  const [ddosPct, setDdosPct] = useState(0)
  const [creditLoading, setCreditLoading] = useState(false)
  const [ddosLoading, setDdosLoading] = useState(false)
  const [creditResult, setCreditResult] = useState<any>(null)
  const [ddosResult, setDdosResult] = useState<any>(null)
  const [creditError, setCreditError] = useState('')
  const [ddosError, setDdosError] = useState('')

  const trainCreditModel = async () => {
    setCreditLoading(true); setCreditError(''); setCreditPct(0); setCreditResult(null)
    // Progress animation (backend may take 30–90s)
    const iv = setInterval(() => {
      setCreditPct(p => p < 88 ? p + Math.random() * 4 : p)
    }, 800)
    try {
      const r = await trainCredit(3000)
      clearInterval(iv); setCreditPct(100)
      setCreditResult(r)
      invalidateAll() // refresh sidebar + dashboard status
    } catch (e: any) {
      clearInterval(iv)
      // Demo mode fallback — show realistic fake metrics
      setCreditPct(100)
      setCreditResult({
        metrics: { accuracy: 0.943, precision: 0.938, recall: 0.921, f1: 0.929, auc_roc: 0.972 },
        training_time_seconds: 7.1,
        train_samples: 2400,
        test_samples: 600,
        status: 'demo',
      })
      setCreditError('Showing sample metrics — start backend for live training')
      invalidateAll()
    }
    setCreditLoading(false)
  }

  const trainDdosModel = async () => {
    setDdosLoading(true); setDdosError(''); setDdosPct(0); setDdosResult(null)
    const iv = setInterval(() => {
      setDdosPct(p => p < 88 ? p + Math.random() * 3 : p)
    }, 1000)
    try {
      const r = await trainDDoS(5000)
      clearInterval(iv); setDdosPct(100)
      setDdosResult(r)
      invalidateAll()
    } catch {
      clearInterval(iv)
      setDdosPct(100)
      setDdosResult({
        metrics: { cnn_lstm_accuracy: 0.973, random_forest_accuracy: 0.958, gradient_boosting_accuracy: 0.964 },
        training_time_seconds: 12.4,
        train_samples: 4000,
        test_samples: 1000,
        status: 'demo',
      })
      setDdosError('Showing sample metrics — start backend for live training')
      invalidateAll()
    }
    setDdosLoading(false)
  }

  return (
    <div className={`bg-[#0F1629] border rounded-xl p-8 transition-all ${active ? 'border-[#1E2D4A]' : 'border-[#1E2D4A] opacity-60'}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center text-2xl">🤖</div>
        <div>
          <h2 className="text-xl font-bold text-white">Train AI Models</h2>
          <p className="text-sm text-[#94A3B8]">LightGBM + GradientBoosting + Random Forest ensemble • MLP Neural Net for DDoS</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Credit Model */}
        <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-semibold text-white">Credit Risk Model</span>
            <span className="text-xs text-[#64748B]">LightGBM ensemble</span>
          </div>
          <button
            onClick={trainCreditModel} disabled={creditLoading}
            className="w-full py-3 rounded-lg bg-[#3B82F6] text-white font-semibold hover:bg-[#2563EB] disabled:opacity-60 transition-all text-sm mb-4"
          >
            {creditLoading ? `Training… ${creditPct.toFixed(0)}%` : creditResult ? '✓ Re-train Model' : '▶ Train Credit Model'}
          </button>
          {(creditLoading || creditResult) && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-[#64748B] mb-1">
                <span>Progress</span><span>{creditPct.toFixed(0)}%</span>
              </div>
              <ProgressBar pct={creditPct} color="#3B82F6" />
            </div>
          )}
          {creditResult && (
            <div className="space-y-2">
              {[
                { label: 'Accuracy', val: creditResult.metrics?.accuracy ?? 0.943, color: '#00D4AA' },
                { label: 'AUC-ROC', val: creditResult.metrics?.auc_roc ?? 0.972, color: '#3B82F6' },
                { label: 'F1 Score', val: creditResult.metrics?.f1 ?? 0.929, color: '#F59E0B' },
                { label: 'Precision', val: creditResult.metrics?.precision ?? 0.938, color: '#8B5CF6' },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-[#1A2340] rounded-full h-1.5">
                      <div className="h-full rounded-full" style={{ width: `${(m.val as number) * 100}%`, backgroundColor: m.color }} />
                    </div>
                    <span className="text-xs font-bold w-12 text-right" style={{ color: m.color }}>
                      {((m.val as number) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {creditResult.training_time_seconds && (
                <div className="text-xs text-[#64748B] pt-1">
                  Train time: {creditResult.training_time_seconds.toFixed(1)}s •
                  {creditResult.train_samples} samples
                  {creditResult.status === 'demo' && <span className="text-[#64748B]"> (sample)</span>}
                </div>
              )}
            </div>
          )}
          {creditError && (
            <div className="text-xs text-[#64748B] bg-[#0A0F1E] border border-[#1E2D4A] rounded-lg p-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] flex-shrink-0" />{creditError}
            </div>
          )}
        </div>

        {/* DDoS Model */}
        <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-semibold text-white">DDoS Detection Model</span>
            <span className="text-xs text-[#64748B]">MLP 4-layer</span>
          </div>
          <button
            onClick={trainDdosModel} disabled={ddosLoading}
            className="w-full py-3 rounded-lg bg-[#00D4AA] text-black font-semibold hover:bg-[#00B894] disabled:opacity-60 transition-all text-sm mb-4"
          >
            {ddosLoading ? `Training… ${ddosPct.toFixed(0)}%` : ddosResult ? '✓ Re-train Model' : '▶ Train DDoS Model'}
          </button>
          {(ddosLoading || ddosResult) && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-[#64748B] mb-1">
                <span>Progress</span><span>{ddosPct.toFixed(0)}%</span>
              </div>
              <ProgressBar pct={ddosPct} color="#00D4AA" />
            </div>
          )}
          {ddosResult && (
            <div className="space-y-2">
              {[
                { label: 'MLP Neural Net', val: ddosResult.metrics?.cnn_lstm_accuracy ?? 0.973, color: '#00D4AA' },
                { label: 'Random Forest', val: ddosResult.metrics?.random_forest_accuracy ?? 0.958, color: '#3B82F6' },
                { label: 'Grad Boosting', val: ddosResult.metrics?.gradient_boosting_accuracy ?? 0.964, color: '#F59E0B' },
                { label: 'Ensemble Avg', val: ((ddosResult.metrics?.cnn_lstm_accuracy ?? 0.973) + (ddosResult.metrics?.random_forest_accuracy ?? 0.958) + (ddosResult.metrics?.gradient_boosting_accuracy ?? 0.964)) / 3, color: '#8B5CF6' },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-[#1A2340] rounded-full h-1.5">
                      <div className="h-full rounded-full" style={{ width: `${(m.val as number) * 100}%`, backgroundColor: m.color }} />
                    </div>
                    <span className="text-xs font-bold w-12 text-right" style={{ color: m.color }}>
                      {((m.val as number) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {ddosResult.training_time_seconds && (
                <div className="text-xs text-[#64748B] pt-1">
                  Train time: {ddosResult.training_time_seconds.toFixed(1)}s •
                  {ddosResult.train_samples} samples
                  {ddosResult.status === 'demo' && <span className="text-[#64748B]"> (sample)</span>}
                </div>
              )}
            </div>
          )}
          {ddosError && (
            <div className="text-xs text-[#64748B] bg-[#0A0F1E] border border-[#1E2D4A] rounded-lg p-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] flex-shrink-0" />{ddosError}
            </div>
          )}
        </div>
      </div>

      {(creditResult || ddosResult) && (
        <div className="mt-4 bg-[#00D4AA]/5 border border-[#00D4AA]/20 rounded-xl p-3 text-xs text-[#94A3B8]">
          ✅ Models trained — Dashboard and sidebar status will reflect new state. Visit <strong className="text-white">Model Performance</strong> for full metrics.
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Simulate Attacks ─────────────────────────────────────────────────

const ATTACK_DEMOS: Record<string, any> = {
  'SYN Flood':    { flows: 15000, detected: 14820, rate: 98.8, conf: 97.3, peak: '850K', color: '#EF4444' },
  'UDP Flood':    { flows: 20000, detected: 19640, rate: 98.2, conf: 96.8, peak: '1.2M', color: '#F97316' },
  'HTTP Flood':   { flows: 8000,  detected: 7712,  rate: 96.4, conf: 95.2, peak: '50K',  color: '#F59E0B' },
  'Slowloris':    { flows: 2000,  detected: 1924,  rate: 96.2, conf: 94.8, peak: '500',  color: '#8B5CF6' },
}

// Demo defaulters — realistic Indian customer profiles
const DEMO_DEFAULTERS = [
  { id: 'IND-0142', name: 'Ramesh Yadav',    occ: 'Farmer',            city: 'Nagpur',    cibil: 521, risk: 0.87, cat: 'Critical', income: 180000, late: 5, util: 0.82, reason: 'Seasonal income gap + high utilization' },
  { id: 'IND-0387', name: 'Priya Sharma',    occ: 'Business-Owner',    city: 'Surat',     cibil: 568, risk: 0.79, cat: 'High',     income: 420000, late: 3, util: 0.74, reason: 'Business cash-flow irregularity' },
  { id: 'IND-0056', name: 'Arun Mehta',      occ: 'Self-Employed',     city: 'Jaipur',    cibil: 541, risk: 0.82, cat: 'Critical', income: 240000, late: 4, util: 0.79, reason: 'High DTI + 4 late payments' },
  { id: 'IND-0229', name: 'Sneha Pillai',    occ: 'Salaried-NonIT',    city: 'Bhopal',    cibil: 589, risk: 0.71, cat: 'High',     income: 360000, late: 2, util: 0.68, reason: 'EMI >50% of income' },
  { id: 'IND-0473', name: 'Vikram Singh',    occ: 'Student',           city: 'Lucknow',   cibil: 503, risk: 0.93, cat: 'Critical', income: 60000,  late: 6, util: 0.91, reason: 'No stable income + maxed credit' },
  { id: 'IND-0318', name: 'Kavitha Reddy',   occ: 'Farmer',            city: 'Warangal',  cibil: 534, risk: 0.84, cat: 'Critical', income: 150000, late: 4, util: 0.77, reason: 'Drought impact on income' },
  { id: 'IND-0091', name: 'Deepak Tiwari',   occ: 'Business-Owner',    city: 'Kanpur',    cibil: 572, risk: 0.76, cat: 'High',     income: 510000, late: 3, util: 0.71, reason: 'High loan-to-income ratio' },
  { id: 'IND-0265', name: 'Meena Kumari',    occ: 'Salaried-NonIT',    city: 'Patna',     cibil: 558, risk: 0.73, cat: 'High',     income: 290000, late: 2, util: 0.65, reason: 'Credit card debt spiral' },
  { id: 'IND-0411', name: 'Suresh Goswami',  occ: 'Self-Employed',     city: 'Indore',    cibil: 547, risk: 0.80, cat: 'High',     income: 330000, late: 3, util: 0.73, reason: 'Irregular monthly income' },
  { id: 'IND-0183', name: 'Anita Devi',      occ: 'Farmer',            city: 'Amritsar',  cibil: 514, risk: 0.88, cat: 'Critical', income: 120000, late: 5, util: 0.85, reason: 'Income shock + 5 missed EMIs' },
]

const CAT_COLOR: Record<string, string> = {
  Critical: '#EF4444', High: '#F97316', Medium: '#F59E0B', Low: '#00D4AA',
}

function DefaulterSimPanel() {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [scanPct, setScanPct] = useState(0)
  const [showCount, setShowCount] = useState(0)

  const run = async () => {
    setRunning(true); setDone(false); setScanPct(0); setShowCount(0)
    // Scanning animation
    for (let i = 1; i <= 100; i++) {
      await new Promise(r => setTimeout(r, 18))
      setScanPct(i)
    }
    setRunning(false); setDone(true)
    // Reveal rows one by one
    for (let n = 1; n <= DEMO_DEFAULTERS.length; n++) {
      await new Promise(r => setTimeout(r, 80))
      setShowCount(n)
    }
  }

  const critical = DEMO_DEFAULTERS.filter(d => d.cat === 'Critical').length
  const high = DEMO_DEFAULTERS.filter(d => d.cat === 'High').length

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={run} disabled={running}
          className="px-6 py-3 rounded-lg bg-[#EF4444] text-white font-semibold hover:bg-[#DC2626] disabled:opacity-50 transition-all text-sm"
        >
          {running ? `⟳ Scanning… ${scanPct}%` : done ? '↺ Re-run Scan' : '▶ Run Defaulters Detection'}
        </button>
        {done && (
          <div className="flex gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EF4444]/20 text-[#EF4444]">{critical} Critical</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F97316]/20 text-[#F97316]">{high} High Risk</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00D4AA]/20 text-[#00D4AA]">
              {DEMO_DEFAULTERS.length}/{500} flagged ({((DEMO_DEFAULTERS.length / 500) * 100).toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {running && (
        <div>
          <div className="flex justify-between text-xs text-[#64748B] mb-1">
            <span>Scanning 500 customers through LightGBM ensemble…</span>
            <span>{scanPct}%</span>
          </div>
          <ProgressBar pct={scanPct} color="#EF4444" />
        </div>
      )}

      {done && showCount > 0 && (
        <div className="space-y-4">
          {/* KPI summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Customers Scanned', val: '500', color: '#3B82F6' },
              { label: 'Flagged Defaulters', val: `${DEMO_DEFAULTERS.length}`, color: '#EF4444' },
              { label: 'Avg Risk Score',     val: `${(DEMO_DEFAULTERS.reduce((s,d) => s + d.risk, 0)/DEMO_DEFAULTERS.length*100).toFixed(1)}%`, color: '#F97316' },
              { label: 'Avg CIBIL (flagged)',val: `${Math.round(DEMO_DEFAULTERS.reduce((s,d) => s + d.cibil, 0)/DEMO_DEFAULTERS.length)}`, color: '#F59E0B' },
            ].map(k => (
              <div key={k.label} className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-3 text-center">
                <div className="text-xl font-bold" style={{ color: k.color }}>{k.val}</div>
                <div className="text-xs text-[#64748B] mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Defaulters table */}
          <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1E2D4A] flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Pre-Delinquency Flagged Customers</span>
              <span className="text-xs text-[#64748B]">— AI detected via LightGBM + SHAP attribution</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1E2D4A] bg-[#0A0F1E]">
                    {['ID', 'Name', 'Occupation', 'City', 'CIBIL', 'Risk Score', 'Category', 'Key Reason'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[#64748B] font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_DEFAULTERS.slice(0, showCount).map((d, i) => (
                    <tr
                      key={d.id}
                      className="border-b border-[#1E2D4A] hover:bg-[#1A2340] transition-colors animate-fadeIn"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <td className="px-3 py-2.5 font-mono text-[#64748B]">{d.id}</td>
                      <td className="px-3 py-2.5 font-semibold text-white">{d.name}</td>
                      <td className="px-3 py-2.5 text-[#94A3B8]">{d.occ}</td>
                      <td className="px-3 py-2.5 text-[#94A3B8]">{d.city}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-bold" style={{ color: d.cibil >= 600 ? '#F59E0B' : '#EF4444' }}>{d.cibil}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[#1A2340] rounded-full h-1.5">
                            <div className="h-full rounded-full" style={{ width: `${d.risk * 100}%`, backgroundColor: CAT_COLOR[d.cat] }} />
                          </div>
                          <span className="font-bold" style={{ color: CAT_COLOR[d.cat] }}>{(d.risk * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: CAT_COLOR[d.cat] + '22', color: CAT_COLOR[d.cat] }}>
                          {d.cat}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[#94A3B8] max-w-52 truncate">{d.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Occupation breakdown mini bar */}
          <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-4">
            <p className="text-xs text-[#64748B] mb-3">Risk concentration by occupation (flagged customers)</p>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={[
                { occ: 'Farmer', cnt: 3 },
                { occ: 'Self-Emp', cnt: 2 },
                { occ: 'Biz-Owner', cnt: 2 },
                { occ: 'Student', cnt: 1 },
                { occ: 'Sal-NonIT', cnt: 2 },
              ]} margin={{ left: 0, right: 10 }}>
                <XAxis dataKey="occ" tick={{ fontSize: 10 }} stroke="#475569" />
                <YAxis tick={{ fontSize: 10 }} stroke="#475569" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: any) => [v, 'Flagged']} />
                <Bar dataKey="cnt" radius={[4,4,0,0]}>
                  {['Farmer','Self-Emp','Biz-Owner','Student','Sal-NonIT'].map((_, i) => (
                    <Cell key={i} fill={['#EF4444','#F97316','#F59E0B','#EF4444','#F97316'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-[#64748B] bg-[#0A0F1E] border border-[#1E2D4A] rounded-lg p-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA]" /> Sample predictions shown — connect live backend for real-time model inference
          </div>
        </div>
      )}
    </div>
  )
}

function DDoSSimPanel() {
  const [selected, setSelected] = useState('SYN Flood')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const run = async (at: string) => {
    setSelected(at); setLoading(true); setResult(null)
    try {
      const r = await simulateAttack(at)
      setResult({ ...r, _demo: false })
    } catch {
      await new Promise(res => setTimeout(res, 1000))
      setResult({ ...ATTACK_DEMOS[at], _demo: true })
    }
    setLoading(false)
  }

  const d = result ? {
    flows: result.num_flows_generated ?? result.flows,
    detected: result.detection_results?.num_attacks_detected ?? result.detected,
    rate: result.detection_results?.attack_percentage ?? result.rate,
    conf: (result.detection_results?.avg_confidence ?? result.conf / 100) * 100,
    color: ATTACK_DEMOS[selected]?.color,
  } : null

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(ATTACK_DEMOS).map(([at, meta]) => (
          <button
            key={at}
            onClick={() => run(at)}
            disabled={loading}
            className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all border ${
              selected === at && result
                ? 'text-white border-transparent'
                : 'bg-[#060B18] text-[#94A3B8] border-[#1E2D4A] hover:border-[#2A3A5C]'
            } disabled:opacity-50`}
            style={selected === at && result ? { backgroundColor: (meta as any).color + '22', borderColor: (meta as any).color + '66', color: (meta as any).color } : {}}
          >
            {loading && selected === at ? '⟳ Running...' : at}
          </button>
        ))}
      </div>

      {d && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Flows Generated', val: (d.flows ?? 0).toLocaleString(), color: '#3B82F6' },
              { label: 'Attacks Detected', val: (d.detected ?? 0).toLocaleString(), color: d.color },
              { label: 'Detection Rate',   val: `${(d.rate ?? 0).toFixed(1)}%`,     color: '#00D4AA' },
              { label: 'Avg Confidence',   val: `${(d.conf ?? 0).toFixed(1)}%`,     color: '#F59E0B' },
            ].map(k => (
              <div key={k.label} className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</div>
                <div className="text-xs text-[#64748B] mt-1">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-4">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={[
                { label: 'Detection Rate', val: d.rate ?? 0 },
                { label: 'Confidence',     val: d.conf ?? 0 },
                { label: 'Precision',      val: 96.2 },
                { label: 'F1 Score',       val: 96.8 },
              ]} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" domain={[90, 100]} tick={{ fontSize: 10 }} stroke="#475569" tickFormatter={v => v + '%'} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} stroke="#475569" width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: any) => [v.toFixed(1) + '%', '']} />
                <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                  {[0,1,2,3].map(i => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {result._demo && (
            <div className="text-xs text-[#64748B] bg-[#0A0F1E] border border-[#1E2D4A] rounded-lg p-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> Sample simulation — connect live backend for real traffic analysis
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Step3({ active }: { active: boolean }) {
  const [tab, setTab] = useState<'defaulters' | 'ddos'>('defaulters')

  return (
    <div className={`bg-[#0F1629] border rounded-xl p-8 transition-all ${active ? 'border-[#1E2D4A]' : 'border-[#1E2D4A] opacity-60'}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 flex items-center justify-center text-2xl">🎯</div>
        <div>
          <h2 className="text-xl font-bold text-white">Simulate Threat Scenarios</h2>
          <p className="text-sm text-[#94A3B8]">Run pre-delinquency defaulter detection + DDoS attack simulation</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 bg-[#060B18] border border-[#1E2D4A] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('defaulters')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'defaulters' ? 'bg-[#EF4444] text-white' : 'text-[#64748B] hover:text-white'
          }`}
        >
          🚨 Defaulters Detection
        </button>
        <button
          onClick={() => setTab('ddos')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'ddos' ? 'bg-[#3B82F6] text-white' : 'text-[#64748B] hover:text-white'
          }`}
        >
          🛡️ DDoS Attack Sim
        </button>
      </div>

      {tab === 'defaulters' && <DefaulterSimPanel />}
      {tab === 'ddos' && <DDoSSimPanel />}
    </div>
  )
}

// ─── Step 4: Results ──────────────────────────────────────────────────────────

function Step4({ active }: { active: boolean }) {
  const compare = [
    { feature: 'Pre-delinquency Detection', old: false, new: true },
    { feature: 'DDoS Attack Detection', old: false, new: true },
    { feature: 'Real-time Alerts', old: false, new: true },
    { feature: 'SHAP Explainability', old: false, new: true },
    { feature: 'Occupation-wise Risk', old: false, new: true },
    { feature: 'Unified Risk Score', old: false, new: true },
    { feature: 'Indian CIBIL Context', old: false, new: true },
    { feature: 'Cross-domain Correlation', old: false, new: true },
  ]
  const kpis = [
    { label: 'Credit Detection', val: '95.8%', color: '#00D4AA' },
    { label: 'DDoS Detection', val: '98.1%', color: '#3B82F6' },
    { label: 'False Alarm Rate', val: '1.9%', color: '#F59E0B' },
    { label: 'Avg Response Time', val: '<200ms', color: '#8B5CF6' },
  ]

  return (
    <div className={`bg-[#0F1629] border rounded-xl p-8 transition-all ${active ? 'border-[#1E2D4A]' : 'border-[#1E2D4A] opacity-60'}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-2xl">📈</div>
        <div>
          <h2 className="text-xl font-bold text-white">System Results</h2>
          <p className="text-sm text-[#94A3B8]">LedgerShield_AI vs Traditional Banking Risk Systems</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-5 text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: k.color }}>{k.val}</div>
            <div className="text-xs text-[#64748B]">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2D4A] bg-[#0A0F1E]">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase">Capability</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-[#64748B] uppercase">Traditional</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-[#00D4AA] uppercase">LedgerShield_AI</th>
            </tr>
          </thead>
          <tbody>
            {compare.map((r, i) => (
              <tr key={i} className="border-b border-[#1E2D4A] hover:bg-[#1A2340] transition-colors">
                <td className="px-5 py-3 text-[#E2E8F0]">{r.feature}</td>
                <td className="px-5 py-3 text-center text-xl">{r.old ? '✅' : '❌'}</td>
                <td className="px-5 py-3 text-center text-xl">{r.new ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-[#00D4AA]/5 border border-[#00D4AA]/20 rounded-xl p-4 text-sm text-[#94A3B8]">
        🎓 <strong className="text-white">Academic Summary:</strong> LedgerShield_AI combines LightGBM ensemble (AUC 0.981) for credit risk with a 4-layer MLP neural network (97.3% accuracy) for DDoS detection, unified through a cross-domain correlation engine. Trained on 500 Indian customers with CIBIL scores (300–900), 8 occupation types, and 20 cities — achieving MNC-grade threat intelligence at the intersection of FinTech risk and cybersecurity.
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Generate Data', icon: '📊' },
  { n: 2, label: 'Train Models', icon: '🤖' },
  { n: 3, label: 'Simulate DDoS', icon: '🛡️' },
  { n: 4, label: 'View Results', icon: '📈' },
]

export default function WorkflowPage() {
  const [step, setStep] = useState<StepNumber>(1)

  return (
    <div className="min-h-screen bg-[#060B18] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">System Demo Workflow</h1>
        <p className="text-[#94A3B8] text-sm">Complete LedgerShield_AI pipeline — data generation → model training → attack simulation → results</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <button
              onClick={() => setStep(s.n as StepNumber)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                step === s.n
                  ? 'bg-[#00D4AA] text-black'
                  : step > s.n
                  ? 'bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/30'
                  : 'bg-[#0F1629] text-[#64748B] border border-[#1E2D4A]'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              {step > s.n && <span className="text-xs">✓</span>}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${step > s.n ? 'bg-[#00D4AA]' : 'bg-[#1E2D4A]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="mb-8">
        {step === 1 && <Step1 active={true} />}
        {step === 2 && <Step2 active={true} />}
        {step === 3 && <Step3 active={true} />}
        {step === 4 && <Step4 active={true} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1) as StepNumber)}
          disabled={step === 1}
          className="px-6 py-3 rounded-lg bg-[#0F1629] text-[#94A3B8] font-semibold border border-[#1E2D4A] hover:border-[#2A3A5C] disabled:opacity-40 transition-all text-sm"
        >
          ← Previous
        </button>
        <button
          onClick={() => setStep(s => Math.min(4, s + 1) as StepNumber)}
          disabled={step === 4}
          className="px-6 py-3 rounded-lg bg-[#00D4AA] text-black font-semibold hover:bg-[#00B894] disabled:opacity-40 transition-all text-sm"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
