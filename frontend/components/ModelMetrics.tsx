'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'

export interface MetricItem {
  name: string
  value: number | string
  unit?: string
  color?: 'teal' | 'blue' | 'amber' | 'red'
}

interface ModelMetricsProps {
  title: string
  metrics: MetricItem[]
  loading?: boolean
}

export default function ModelMetrics({
  title,
  metrics,
  loading = false,
}: ModelMetricsProps) {
  const colorMap = {
    teal: 'text-brand-teal',
    blue: 'text-brand-blue',
    amber: 'text-brand-amber',
    red: 'text-brand-red',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-dark-card border border-dark-border rounded-lg p-6"
    >
      <h3 className="text-lg font-semibold text-text-primary mb-6">{title}</h3>

      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: metrics.length }).map((_, i) => (
            <div key={i} className="p-4 bg-dark-bg/50 rounded-lg">
              <div className="h-4 w-20 bg-animate-shimmer rounded animate-shimmer mb-2" />
              <div className="h-6 w-16 bg-animate-shimmer rounded animate-shimmer" />
            </div>
          ))
        ) : (
          metrics.map((metric, index) => (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-dark-bg/50 rounded-lg border border-dark-border/50 hover:border-dark-border transition-colors"
            >
              <p className="text-xs text-text-secondary font-medium mb-2 uppercase">
                {metric.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={clsx(
                  'text-2xl font-bold',
                  metric.color ? colorMap[metric.color] : 'text-text-primary'
                )}>
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="text-sm text-text-secondary">{metric.unit}</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
