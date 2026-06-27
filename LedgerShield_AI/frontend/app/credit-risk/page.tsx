'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { trainCredit, predictCredit, getMetrics } from '@/lib/api'
import type { ModelMetrics, CreditPredictRequest } from '@/lib/api'

const FEATURE_IMPORTANCE = [
  { name: 'credit_utilization', value: 0.23 },
  { name: 'num_late_payments', value: 0.19 },
  { name: 'credit_score', value: 0.17 },
  { name: 'monthly_debt', value: 0.15 },
  { name: 'payment_history', value: 0.12 },
]

const SAMPLE_CUSTOMERS = [
  { id: 1, name: 'John Smith', risk_score: 28, category: 'Low Risk' },
  { id: 2, name: 'Sarah Johnson', risk_score: 55, category: 'Medium Risk' },
  { id: 3, name: 'Michael Chen', risk_score: 72, category: 'High Risk' },
  { id: 4, name: 'Emma Davis', risk_score: 18, category: 'Low Risk' },
  { id: 5, name: 'Robert Wilson', risk_score: 89, category: 'Critical Risk' },
  { id: 6, name: 'Lisa Anderson', risk_score: 42, category: 'Medium Risk' },
  { id: 7, name: 'James Taylor', risk_score: 95, category: 'Critical Risk' },
  { id: 8, name: 'Jennifer White', risk_score: 35, category: 'Low Risk' },
]

export default function CreditRiskPage() {
  const [isTraining, setIsTraining] = useState(false)
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [riskCategory, setRiskCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreditPredictRequest>({
    income: 65000,
    credit_score: 720,
    payment_history_months: 60,
    loan_amount: 250000,
    monthly_debt: 2000,
    employment_years: 5,
    num_credit_lines: 4,
    num_late_payments: 0,
    credit_utilization: 0.35,
    transaction_frequency: 45,
    avg_transaction_amount: 500,
    savings_balance: 25000,
    age: 35,
  })

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getMetrics()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      }
    }
    fetchMetrics()
  }, [])

  const handleTrain = async () => {
    setIsTraining(true)
    try {
      await trainCredit(3000)
      const data = await getMetrics()
      setMetrics(data)
    } catch (error) {
      console.error('Training failed:', error)
    } finally {
      setIsTraining(false)
    }
  }

  const handlePredict = async () => {
    setIsLoading(true)
    try {
      const result = await predictCredit(formData)
      setRiskScore(result.risk_percentage)
      setRiskCategory(result.risk_category)
    } catch (error) {
      console.error('Prediction failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score < 33) return '#00D4AA'
    if (score < 66) return '#F59E0B'
    if (score < 85) return '#EF4444'
    return '#DC2626'
  }

  const getRiskBadgeColor = (category: string) => {
    switch (category) {
      case 'Low Risk':
        return 'bg-teal-900 text-[#00D4AA]'
      case 'Medium Risk':
        return 'bg-amber-900 text-[#F59E0B]'
      case 'High Risk':
        return 'bg-red-900 text-[#EF4444]'
      case 'Critical Risk':
        return 'bg-red-950 text-red-300'
      default:
        return 'bg-[#1A2340] text-[#94A3B8]'
    }
  }

  const fillQuickProfile = (profile: 'high' | 'low') => {
    if (profile === 'high') {
      setFormData({
        income: 35000,
        credit_score: 580,
        payment_history_months: 24,
        loan_amount: 50000,
        monthly_debt: 3500,
        employment_years: 2,
        num_credit_lines: 8,
        num_late_payments: 3,
        credit_utilization: 0.85,
        transaction_frequency: 15,
        avg_transaction_amount: 200,
        savings_balance: 2000,
        age: 28,
      })
    } else {
      setFormData({
        income: 120000,
        credit_score: 780,
        payment_history_months: 120,
        loan_amount: 300000,
        monthly_debt: 1200,
        employment_years: 10,
        num_credit_lines: 5,
        num_late_payments: 0,
        credit_utilization: 0.15,
        transaction_frequency: 80,
        avg_transaction_amount: 800,
        savings_balance: 100000,
        age: 45,
      })
    }
  }

  const handleInputChange = (key: keyof CreditPredictRequest, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const SemiCircularGauge = ({ score }: { score: number }) => {
    const angle = (score / 100) * 180
    return (
      <div className="relative w-full h-64 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 400 220">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#00D4AA" />
              <stop offset="33%" stopColor="#F59E0B" />
              <stop offset="66%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          <path
            d="M 50 200 A 150 150 0 0 1 350 200"
            fill="none"
            stroke="#1E2D4A"
            strokeWidth="12"
          />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: score / 100 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            d="M 50 200 A 150 150 0 0 1 350 200"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <motion.line
            initial={{ rotate: -90 }}
            animate={{ rotate: angle - 90 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            x1="200"
            y1="200"
            x2="200"
            y2="60"
            stroke="#E2E8F0"
            strokeWidth="3"
            style={{ transformOrigin: '200px 200px' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <div className="text-5xl font-bold text-[#E2E8F0]">{Math.round(score)}%</div>
            <div className="text-sm text-[#94A3B8] mt-2">Risk Score</div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060B18] p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-[#E2E8F0]">Credit Risk Analysis</h1>
        <p className="text-[#94A3B8] mt-2">Pre-Delinquency AI Detection</p>
      </motion.div>

      {/* Train Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 flex gap-4 items-start"
      >
        <button
          onClick={handleTrain}
          disabled={isTraining}
          className="px-6 py-3 bg-[#3B82F6] hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          {isTraining ? 'Training...' : 'Train Model'}
        </button>

        {metrics?.credit_metrics && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F1629] border border-[#1E2D4A] rounded-lg p-4 flex-1"
          >
            <h3 className="text-[#E2E8F0] font-semibold mb-3">Model Metrics</h3>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <p className="text-[#94A3B8] text-sm">Accuracy</p>
                <p className="text-[#E2E8F0] font-bold text-lg">
                  {(metrics.credit_metrics.accuracy * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[#94A3B8] text-sm">Precision</p>
                <p className="text-[#E2E8F0] font-bold text-lg">
                  {(metrics.credit_metrics.precision * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[#94A3B8] text-sm">Recall</p>
                <p className="text-[#E2E8F0] font-bold text-lg">
                  {(metrics.credit_metrics.recall * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[#94A3B8] text-sm">F1</p>
                <p className="text-[#E2E8F0] font-bold text-lg">
                  {(metrics.credit_metrics.f1 * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[#94A3B8] text-sm">AUC-ROC</p>
                <p className="text-[#E2E8F0] font-bold text-lg">
                  {(metrics.credit_metrics.auc_roc * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        {/* LEFT: Input Form (60%) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-2"
        >
          <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#E2E8F0] mb-6">Customer Input</h2>

            {/* Quick Fill Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => fillQuickProfile('high')}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 text-[#EF4444] rounded-lg text-sm font-medium transition-colors"
              >
                Quick Fill: High Risk Profile
              </button>
              <button
                onClick={() => fillQuickProfile('low')}
                className="px-4 py-2 bg-teal-900 hover:bg-teal-800 text-[#00D4AA] rounded-lg text-sm font-medium transition-colors"
              >
                Quick Fill: Low Risk Profile
              </button>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <InputField
                label="Income"
                value={formData.income}
                onChange={(v) => handleInputChange('income', v)}
                type="number"
              />
              <InputField
                label="Credit Score"
                value={formData.credit_score}
                onChange={(v) => handleInputChange('credit_score', v)}
                type="number"
              />
              <InputField
                label="Payment History (mo)"
                value={formData.payment_history_months}
                onChange={(v) => handleInputChange('payment_history_months', v)}
                type="number"
              />
              <InputField
                label="Loan Amount"
                value={formData.loan_amount}
                onChange={(v) => handleInputChange('loan_amount', v)}
                type="number"
              />
              <InputField
                label="Monthly Debt"
                value={formData.monthly_debt}
                onChange={(v) => handleInputChange('monthly_debt', v)}
                type="number"
              />
              <InputField
                label="Employment Years"
                value={formData.employment_years}
                onChange={(v) => handleInputChange('employment_years', v)}
                type="number"
              />
              <InputField
                label="Credit Lines"
                value={formData.num_credit_lines}
                onChange={(v) => handleInputChange('num_credit_lines', v)}
                type="number"
              />
              <InputField
                label="Late Payments"
                value={formData.num_late_payments}
                onChange={(v) => handleInputChange('num_late_payments', v)}
                type="number"
              />
              <InputField
                label="Transaction Freq"
                value={formData.transaction_frequency}
                onChange={(v) => handleInputChange('transaction_frequency', v)}
                type="number"
              />
              <InputField
                label="Avg Transaction"
                value={formData.avg_transaction_amount}
                onChange={(v) => handleInputChange('avg_transaction_amount', v)}
                type="number"
              />
              <InputField
                label="Savings Balance"
                value={formData.savings_balance}
                onChange={(v) => handleInputChange('savings_balance', v)}
                type="number"
              />
              <InputField
                label="Age"
                value={formData.age}
                onChange={(v) => handleInputChange('age', v)}
                type="number"
              />
            </div>

            {/* Credit Utilization Slider */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-[#E2E8F0] text-sm font-medium">Credit Utilization</label>
                <span className="text-[#00D4AA] font-bold">{(formData.credit_utilization * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={formData.credit_utilization}
                onChange={(e) => handleInputChange('credit_utilization', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Assess Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePredict}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-[#00D4AA] to-[#00B899] hover:from-[#00E5BB] hover:to-[#00CAA3] disabled:opacity-50 text-[#060B18] font-bold rounded-lg transition-all"
            >
              {isLoading ? 'Assessing...' : 'Assess Risk'}
            </motion.button>
          </div>
        </motion.div>

        {/* RIGHT: Risk Score Display (40%) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#E2E8F0] mb-4">Risk Assessment</h2>

            {riskScore !== null ? (
              <>
                <SemiCircularGauge score={riskScore} />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-3 rounded-lg text-center font-bold ${getRiskBadgeColor(riskCategory)}`}
                >
                  {riskCategory}
                </motion.div>

                <div className="mt-6">
                  <h3 className="text-[#E2E8F0] font-semibold mb-4">Feature Importance</h3>
                  <div className="space-y-3">
                    {FEATURE_IMPORTANCE.map((feat, idx) => (
                      <motion.div
                        key={feat.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="text-[#94A3B8] text-sm">{feat.name}</span>
                          <span className="text-[#00D4AA] text-sm font-bold">
                            {(feat.value * 100).toFixed(0)}%
                          </span>
                        </div>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${feat.value * 100}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className="h-2 bg-gradient-to-r from-[#00D4AA] to-[#3B82F6] rounded-full"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-[#94A3B8]">
                Enter customer data and click "Assess Risk" to see results
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Demo Batch Table */}
      {metrics?.credit_model_trained && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0F1629] border border-[#1E2D4A] rounded-lg p-6"
        >
          <h2 className="text-xl font-semibold text-[#E2E8F0] mb-4">Batch Assessment Demo</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E2D4A]">
                  <th className="text-left text-[#94A3B8] font-medium py-3 px-4">Customer</th>
                  <th className="text-left text-[#94A3B8] font-medium py-3 px-4">Risk Score</th>
                  <th className="text-left text-[#94A3B8] font-medium py-3 px-4">Category</th>
                  <th className="text-left text-[#94A3B8] font-medium py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_CUSTOMERS.map((customer, idx) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-[#1A2340] hover:bg-[#1A2340] transition-colors"
                  >
                    <td className="py-3 px-4 text-[#E2E8F0]">{customer.name}</td>
                    <td className="py-3 px-4 font-bold text-[#E2E8F0]">{customer.risk_score}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskBadgeColor(
                          customer.category
                        )}`}
                      >
                        {customer.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className="w-24 h-2 bg-[#1A2340] rounded-full overflow-hidden"
                        style={{
                          background: `linear-gradient(to right, ${getRiskColor(customer.risk_score)}, transparent)`,
                        }}
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  type = 'number',
}: {
  label: string
  value: number
  onChange: (value: number) => void
  type?: string
}) {
  return (
    <div>
      <label className="block text-[#94A3B8] text-xs font-medium mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-[#1A2340] border border-[#1E2D4A] rounded px-3 py-2 text-[#E2E8F0] focus:border-[#00D4AA] focus:outline-none transition-colors"
      />
    </div>
  )
}
