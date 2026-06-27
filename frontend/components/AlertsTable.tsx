'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

export interface Alert {
  id: string
  type: 'danger' | 'warning' | 'success'
  title: string
  description: string
  timestamp: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

interface AlertsTableProps {
  alerts: Alert[]
  loading?: boolean
}

export default function AlertsTable({ alerts, loading = false }: AlertsTableProps) {
  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-brand-red" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-brand-amber" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-brand-teal" />
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-brand-red bg-brand-red/10'
      case 'high':
        return 'text-brand-amber bg-brand-amber/10'
      case 'medium':
        return 'text-brand-blue bg-brand-blue/10'
      case 'low':
        return 'text-brand-teal bg-brand-teal/10'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-dark-card border border-dark-border rounded-lg overflow-hidden"
    >
      <div className="p-6 border-b border-dark-border">
        <h3 className="text-lg font-semibold text-text-primary">Recent Alerts</h3>
        <p className="text-sm text-text-secondary mt-1">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''} detected
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-dark-border/50">
                  <td colSpan={4} className="px-6 py-4">
                    <div className="h-4 bg-animate-shimmer rounded animate-shimmer" />
                  </td>
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                  No alerts detected. System is secure.
                </td>
              </tr>
            ) : (
              alerts.map((alert, index) => (
                <motion.tr
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-dark-border/50 hover:bg-dark-border/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getIcon(alert.type)}
                      <span className="text-sm font-medium text-text-primary capitalize">
                        {alert.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                      <p className="text-xs text-text-secondary mt-1">{alert.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      'text-xs font-semibold px-2 py-1 rounded-full capitalize',
                      getSeverityColor(alert.severity)
                    )}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-secondary">{alert.timestamp}</span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
