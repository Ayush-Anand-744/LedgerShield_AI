'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'

interface RiskGaugeProps {
  value: number // 0-100
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

export default function RiskGauge({
  value,
  label = 'Risk Score',
  size = 'md',
  showValue = true,
}: RiskGaugeProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100)
  const percentage = clampedValue / 100

  const getRiskColor = (val: number) => {
    if (val < 30) return '#00D4AA' // Teal - Safe
    if (val < 60) return '#F59E0B' // Amber - Warning
    return '#EF4444' // Red - Danger
  }

  const getRiskLabel = (val: number) => {
    if (val < 30) return 'Low Risk'
    if (val < 60) return 'Medium Risk'
    return 'High Risk'
  }

  const sizeMap = {
    sm: { width: 120, height: 120, radius: 60 },
    md: { width: 200, height: 200, radius: 100 },
    lg: { width: 280, height: 280, radius: 140 },
  }

  const dimensions = sizeMap[size]
  const circumference = Math.PI * dimensions.radius

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center"
    >
      <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="transform -rotate-90"
        >
          {/* Background arc */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r={dimensions.radius}
            fill="none"
            stroke="#1E2D4A"
            strokeWidth="8"
          />

          {/* Animated arc */}
          <motion.circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r={dimensions.radius}
            fill="none"
            stroke={getRiskColor(clampedValue)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - percentage) }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            filter="drop-shadow(0 0 10px rgba(0, 212, 170, 0.4))"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-text-primary">
                {clampedValue}
              </div>
              <div className="text-xs text-text-secondary">%</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Labels */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-6"
      >
        <p className="text-sm text-text-secondary mb-2">{label}</p>
        <p className={clsx(
          'text-sm font-semibold',
          {
            'text-brand-teal': clampedValue < 30,
            'text-brand-amber': clampedValue >= 30 && clampedValue < 60,
            'text-brand-red': clampedValue >= 60,
          }
        )}>
          {getRiskLabel(clampedValue)}
        </p>
      </motion.div>
    </motion.div>
  )
}
