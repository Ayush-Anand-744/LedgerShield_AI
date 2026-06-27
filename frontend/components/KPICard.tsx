'use client'

import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown } from 'lucide-react'
import clsx from 'clsx'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  trend?: number
  color: 'teal' | 'blue' | 'amber' | 'red'
  icon?: React.ReactNode
  loading?: boolean
}

export default function KPICard({
  title,
  value,
  unit,
  trend,
  color,
  icon,
  loading = false,
}: KPICardProps) {
  const colorMap = {
    teal: { bg: 'bg-brand-teal/10', text: 'text-brand-teal', border: 'border-brand-teal/30' },
    blue: { bg: 'bg-brand-blue/10', text: 'text-brand-blue', border: 'border-brand-blue/30' },
    amber: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', border: 'border-brand-amber/30' },
    red: { bg: 'bg-brand-red/10', text: 'text-brand-red', border: 'border-brand-red/30' },
  }

  const colorStyle = colorMap[color]
  const isPositive = trend && trend > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ translateY: -4, transition: { duration: 0.2 } }}
      className={clsx(
        'bg-dark-card border rounded-lg p-6 transition-all duration-200',
        colorStyle.border
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-text-secondary text-sm font-medium mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-32 bg-animate-shimmer rounded animate-shimmer" />
          ) : (
            <div className="flex items-baseline gap-2">
              <h3 className={clsx('text-3xl font-bold', colorStyle.text)}>
                {value}
              </h3>
              {unit && <span className="text-text-secondary text-sm">{unit}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-lg', colorStyle.bg)}>
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1"
        >
          {isPositive ? (
            <ArrowUp className="w-4 h-4 text-brand-teal" />
          ) : (
            <ArrowDown className="w-4 h-4 text-brand-red" />
          )}
          <span className={clsx(
            'text-xs font-semibold',
            isPositive ? 'text-brand-teal' : 'text-brand-red'
          )}>
            {Math.abs(trend)}% vs last period
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}
