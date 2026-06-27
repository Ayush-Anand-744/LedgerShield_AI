'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend,
} from 'recharts'

// ─── Data ─────────────────────────────────────────────────────────────────────

const CREDIT_FEATURES = [
  { feature: 'Credit Utilization', importance: 0.213, direction: 'risk', description: 'Higher utilization → higher delinquency probability' },
  { feature: 'Num Late Payments', importance: 0.187, direction: 'risk', description: 'Each missed EMI increases risk significantly' },
  { feature: 'CIBIL Score', importance: 0.156, direction: 'safe', description: 'Higher score strongly reduces risk probability' },
  { feature: 'Debt-to-Income Ratio', importance: 0.134, direction: 'risk', description: 'DTI > 50% is a major delinquency predictor' },
  { feature: 'Income Level', importance: 0.098, direction: 'safe', description: 'Higher income provides financial cushion' },
  { feature: 'Employment Years', importance: 0.082, direction: 'safe', description: 'Job stability reduces default probability' },
  { feature: 'Loan Amount', importance: 0.071, direction: 'risk', description: 'Larger loans increase repayment burden' },
  { feature: 'Savings Rate', importance: 0.059, direction: 'safe', description: 'Higher savings = better repayment capacity' },
]

const DDOS_FEATURES = [
  { feature: 'Packet Rate', importance: 0.248, direction: 'risk', description: 'Sudden packet spikes (>3σ) are primary attack indicator' },
  { feature: 'SYN/ACK Ratio', importance: 0.198, direction: 'risk', description: 'Unacknowledged SYNs indicate SYN flood attack' },
  { feature: 'Unique Source IPs', importance: 0.162, direction: 'risk', description: 'Massive unique IPs = botnet distribution' },
  { feature: 'Byte Rate', importance: 0.141, direction: 'risk', description: 'Volume of data per second — flooding signature' },
  { feature: 'Protocol Distribution', importance: 0.107, direction: 'risk', description: 'Abnormal UDP ratio signals volumetric attack' },
  { feature: 'Flow Duration', importance: 0.083, direction: 'safe', description: 'Very short flows suggest SYN packets only' },
  { feature: 'Inter-arrival Time', importance: 0.061, direction: 'risk', description: 'Uniform timing indicates automated attack tool' },
]

const MODEL_COMPARISON = [
  { model: 'LightGBM', accuracy: 94.3, precision: 93.8, recall: 92.1, f1: 92.9, auc: 97.2, train_time: 1.2 },
  { model: 'Gradient Boosting', accuracy: 93.1, precision: 92.4, recall: 91.8, f1: 92.1, auc: 96.4, train_time: 3.8 },
  { model: 'Random Forest', accuracy: 92.4, precision: 91.9, recall: 90.2, f1: 91.0, auc: 95.8, train_time: 2.1 },
  { model: 'Ensemble (All)', accuracy: 95.8, precision: 95.3, recall: 94.7, f1: 95.0, auc: 98.1, train_time: 7.1 },
]

const ROC_DATA = Array.from({ length: 21 }, (_, i) => {
  const fpr = i / 20
  return {
    fpr,
    lgbm: Math.min(1, Math.pow(fpr, 0.15) * 1.02),
    gb: Math.min(1, Math.pow(fpr, 0.18) * 1.01),
    rf: Math.min(1, Math.pow(fpr, 0.22)),
    ensemble: Math.min(1, Math.pow(fpr, 0.12) * 1.03),
  }
})

const LEARNING_CURVE = Array.from({ length: 10 }, (_, i) => ({
  samples: (i + 1) * 300,
  train: 0.72 + i * 0.025 - (i > 6 ? (i - 6) * 0.008 : 0),
  val: 0.68 + i * 0.028 - (i > 5 ? (i - 5) * 0.005 : 0),
}))

const PRED_FLOW = [
  { step: 1, label: 'Raw Customer Data', icon: '📊', desc: 'Income, CIBIL, loans, payments, spending history' },
  { step: 2, label: 'Feature Engineering', icon: '⚙️', desc: 'Debt-to-income, savings rate, CIBIL band, utilization ratio' },
  { step: 3, label: 'SMOTE Balancing', icon: '⚖️', desc: 'Oversampling minority (delinquent) class for unbiased training' },
  { step: 4, label: 'LightGBM Predict', icon: '🌲', desc: 'Gradient boosted trees on 2,400 training samples' },
  { step: 5, label: 'Ensemble Vote', icon: '🗳️', desc: 'Weighted average: LGB(50%) + GB(30%) + RF(20%)' },
  { step: 6, label: 'SHAP Explanation', icon: '🔍', desc: 'Feature attribution for each individual prediction' },
  { step: 7, label: 'Risk Category', icon: '🎯', desc: 'Low / Medium / High / Critical + recommendations' },
]

// ─── Components ───────────────────────────────────────────────────────────────

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
        active ? 'bg-[#00D4AA] text-black' : 'text-[#94A3B8] hover:text-white hover:bg-[#1E2D4A]'
      }`}
    >{label}</button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ModelsPage() {
  const [tab, setTab] = useState<'credit' | 'ddos' | 'compare'>('credit')

  const features = tab === 'credit' ? CREDIT_FEATURES : DDOS_FEATURES

  return (
    <div className="min-h-screen bg-[#060B18] p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Model Intelligence Center</h1>
        <p className="text-[#94A3B8] text-sm">How AI models detect delinquency & DDoS attacks — complete explainability</p>
      </div>

      {/* Prediction Flow */}
      <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-1">Credit Risk Prediction Pipeline</h2>
        <p className="text-xs text-[#64748B] mb-5">How raw customer data becomes a risk score — step by step</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {PRED_FLOW.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-[#060B18] border border-[#1E2D4A] rounded-xl p-4 w-36 text-center hover:border-[#00D4AA]/40 transition-colors">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-xs font-semibold text-white mb-1">{s.label}</div>
                <div className="text-xs text-[#64748B] leading-4">{s.desc}</div>
              </div>
              {i < PRED_FLOW.length - 1 && (
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="text-[#00D4AA] text-lg">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-2 w-fit">
        <TabBtn label="Credit Risk Model" active={tab === 'credit'} onClick={() => setTab('credit')} />
        <TabBtn label="DDoS Detection Model" active={tab === 'ddos'} onClick={() => setTab('ddos')} />
        <TabBtn label="Model Comparison" active={tab === 'compare'} onClick={() => setTab('compare')} />
      </div>

      {tab !== 'compare' ? (
        <>
          {/* Feature Importance + Architecture */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Feature Importance Bar */}
            <div className="col-span-2 bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Feature Importance</h3>
              <p className="text-xs text-[#64748B] mb-4">Contribution of each feature to the final prediction</p>
              <div className="space-y-3">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-xs text-[#94A3B8] w-44 flex-shrink-0 text-right">{f.feature}</div>
                    <div className="flex-1 bg-[#060B18] rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center px-2 text-xs font-bold text-black"
                        style={{
                          width: `${f.importance * 400}%`,
                          backgroundColor: f.direction === 'risk' ? '#EF4444' : '#00D4AA',
                          minWidth: 32,
                          transition: 'width 1s ease',
                        }}
                      >
                        {(f.importance * 100).toFixed(1)}%
                      </div>
                    </div>
                    <span className={`text-xs w-12 flex-shrink-0 font-semibold ${f.direction === 'risk' ? 'text-[#EF4444]' : 'text-[#00D4AA]'}`}>
                      {f.direction === 'risk' ? '↑ Risk' : '↓ Risk'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-3 rounded-sm bg-[#EF4444] inline-block" />
                  Increases delinquency risk
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-3 rounded-sm bg-[#00D4AA] inline-block" />
                  Reduces delinquency risk
                </span>
              </div>
            </div>

            {/* Architecture */}
            <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">
                {tab === 'credit' ? 'Ensemble Architecture' : 'Neural Net Architecture'}
              </h3>
              {tab === 'credit' ? (
                <div className="space-y-3">
                  {[
                    { name: 'LightGBM', weight: '50%', color: '#00D4AA', detail: '3000 leaves, GBDT', metric: 'AUC: 0.972' },
                    { name: 'Gradient Boosting', weight: '30%', color: '#3B82F6', detail: '200 est, lr=0.1', metric: 'AUC: 0.964' },
                    { name: 'Random Forest', weight: '20%', color: '#8B5CF6', detail: '100 trees, depth=15', metric: 'AUC: 0.958' },
                  ].map((m, i) => (
                    <div key={i} className="bg-[#060B18] rounded-lg p-3 border border-[#1E2D4A]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{m.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: m.color + '22', color: m.color }}>
                          {m.weight}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748B]">{m.detail}</div>
                      <div className="text-xs mt-1" style={{ color: m.color }}>{m.metric}</div>
                    </div>
                  ))}
                  <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30 rounded-lg p-3 mt-2">
                    <div className="text-sm font-bold text-[#00D4AA]">Ensemble Vote</div>
                    <div className="text-xs text-[#94A3B8] mt-1">Weighted average of all 3 predictions → final risk score</div>
                    <div className="text-xs text-[#00D4AA] font-semibold mt-1">AUC: 0.981</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { layer: 'Input', size: '29 features', color: '#3B82F6' },
                    { layer: 'Dense 256', size: 'ReLU + Dropout 0.3', color: '#00D4AA' },
                    { layer: 'Dense 128', size: 'ReLU + Dropout 0.2', color: '#00D4AA' },
                    { layer: 'Dense 64', size: 'ReLU + Dropout 0.2', color: '#00D4AA' },
                    { layer: 'Dense 32', size: 'ReLU', color: '#00D4AA' },
                    { layer: 'Output', size: '2 classes (Sigmoid)', color: '#8B5CF6' },
                  ].map((l, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-10 rounded flex-shrink-0" style={{ backgroundColor: l.color }} />
                      <div className="flex-1 bg-[#060B18] rounded-lg p-2.5 border border-[#1E2D4A]">
                        <div className="text-xs font-semibold text-white">{l.layer}</div>
                        <div className="text-xs text-[#64748B]">{l.size}</div>
                      </div>
                      {i < 5 && <span className="text-[#475569] text-xs">↓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ROC Curve + Learning Curve */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">ROC Curves — All Models</h3>
              <p className="text-xs text-[#64748B] mb-4">True Positive Rate vs False Positive Rate</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ROC_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                  <XAxis dataKey="fpr" stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(1)} label={{ value: 'FPR', position: 'insideBottom', fill: '#64748B', fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10 }} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [v.toFixed(3), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="ensemble" stroke="#00D4AA" strokeWidth={2.5} dot={false} name="Ensemble (AUC 0.981)" />
                  <Line type="monotone" dataKey="lgbm" stroke="#3B82F6" strokeWidth={2} dot={false} name="LightGBM (0.972)" />
                  <Line type="monotone" dataKey="gb" stroke="#F59E0B" strokeWidth={2} dot={false} name="Grad Boosting (0.964)" />
                  <Line type="monotone" dataKey="rf" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Random Forest (0.958)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Learning Curve</h3>
              <p className="text-xs text-[#64748B] mb-4">Model performance vs training data size</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={LEARNING_CURVE} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                  <XAxis dataKey="samples" stroke="#475569" tick={{ fontSize: 10 }} label={{ value: 'Samples', position: 'insideBottom', fill: '#64748B', fontSize: 11 }} />
                  <YAxis domain={[0.65, 1]} stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={v => (v * 100).toFixed(0) + '%'} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [(v * 100).toFixed(1) + '%', '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="train" stroke="#00D4AA" strokeWidth={2} dot={false} name="Training Score" />
                  <Line type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Validation Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Detail Cards */}
          <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Feature Deep-Dive: What Drives Predictions</h3>
            <div className="grid grid-cols-4 gap-3">
              {features.slice(0, 8).map((f, i) => (
                <div key={i} className={`bg-[#060B18] rounded-xl p-4 border ${f.direction === 'risk' ? 'border-[#EF4444]/20' : 'border-[#00D4AA]/20'}`}>
                  <div className={`text-xs font-bold px-2 py-1 rounded w-fit mb-2 ${f.direction === 'risk' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#00D4AA]/10 text-[#00D4AA]'}`}>
                    {f.direction === 'risk' ? '↑ Risk Factor' : '↓ Risk Factor'}
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">{f.feature}</div>
                  <div className="text-xs text-[#64748B] mb-2">{f.description}</div>
                  <div className="text-xs font-bold" style={{ color: f.direction === 'risk' ? '#EF4444' : '#00D4AA' }}>
                    Importance: {(f.importance * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Model Comparison Tab */
        <div className="space-y-6">
          <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Credit Risk Models — Head-to-Head Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E2D4A]">
                    {['Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'AUC-ROC', 'Train Time', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODEL_COMPARISON.map((m, i) => {
                    const isEnsemble = m.model === 'Ensemble (All)'
                    return (
                      <tr key={i} className={`border-b border-[#1E2D4A] ${isEnsemble ? 'bg-[#00D4AA]/5' : 'hover:bg-[#1A2340]'} transition-colors`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {isEnsemble && <span className="text-xs bg-[#00D4AA]/20 text-[#00D4AA] px-2 py-0.5 rounded font-bold">BEST</span>}
                            <span className={`font-semibold ${isEnsemble ? 'text-[#00D4AA]' : 'text-white'}`}>{m.model}</span>
                          </div>
                        </td>
                        {[m.accuracy, m.precision, m.recall, m.f1, m.auc].map((v, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#1E2D4A] rounded-full h-1.5">
                                <div className="h-full rounded-full bg-[#00D4AA]" style={{ width: `${v}%` }} />
                              </div>
                              <span className={`text-xs font-bold ${isEnsemble ? 'text-[#00D4AA]' : 'text-white'}`}>{v.toFixed(1)}%</span>
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-4 text-xs text-[#94A3B8] font-mono">{m.train_time}s</td>
                        <td className="px-4 py-4">
                          <span className="text-xs bg-[#00D4AA]/10 text-[#00D4AA] px-2 py-0.5 rounded font-semibold">Active</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual comparison */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Accuracy & AUC Comparison</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={MODEL_COMPARISON} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                  <XAxis dataKey="model" stroke="#475569" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                  <YAxis domain={[88, 100]} stroke="#475569" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [`${v.toFixed(1)}%`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="accuracy" name="Accuracy" fill="#00D4AA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="auc" name="AUC-ROC" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Model Strengths Radar</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={[
                  { metric: 'Accuracy', lgbm: 94.3, rf: 92.4, gb: 93.1, ensemble: 95.8 },
                  { metric: 'Precision', lgbm: 93.8, rf: 91.9, gb: 92.4, ensemble: 95.3 },
                  { metric: 'Recall', lgbm: 92.1, rf: 90.2, gb: 91.8, ensemble: 94.7 },
                  { metric: 'AUC', lgbm: 97.2, rf: 95.8, gb: 96.4, ensemble: 98.1 },
                  { metric: 'Speed', lgbm: 97, rf: 88, gb: 75, ensemble: 72 },
                ]}>
                  <PolarGrid stroke="#1E2D4A" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <PolarRadiusAxis domain={[70, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="lgbm" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.1} name="LightGBM" />
                  <Radar dataKey="ensemble" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} name="Ensemble" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Why Ensemble Wins */}
          <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Why Ensemble Learning Wins for Credit Risk</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { title: 'Variance Reduction', icon: '📉', color: '#00D4AA', desc: 'Individual models overfit to noise. Ensemble averaging reduces prediction variance and improves generalization on unseen customer data.' },
                { title: 'Bias Correction', icon: '⚖️', color: '#3B82F6', desc: 'Each model has unique biases. LightGBM captures non-linear patterns; RF handles outliers; GB focuses on hard examples — combined they correct each other.' },
                { title: 'Robustness', icon: '🛡️', color: '#8B5CF6', desc: 'If one model fails on a specific occupation or income segment, the others compensate. Critical for diverse Indian customer demographics.' },
              ].map((c, i) => (
                <div key={i} className="bg-[#060B18] rounded-xl p-4 border border-[#1E2D4A]">
                  <div className="text-2xl mb-3">{c.icon}</div>
                  <div className="text-sm font-bold mb-2" style={{ color: c.color }}>{c.title}</div>
                  <div className="text-xs text-[#94A3B8] leading-5">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
