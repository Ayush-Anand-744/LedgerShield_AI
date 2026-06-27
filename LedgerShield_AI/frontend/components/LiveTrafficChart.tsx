'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'

interface DataPoint {
  timestamp: string
  requests: number
  attacks: number
}

interface LiveTrafficChartProps {
  data?: DataPoint[]
  isLive?: boolean
}

export default function LiveTrafficChart({
  data = [],
  isLive = false,
}: LiveTrafficChartProps) {
  const [chartData, setChartData] = useState<DataPoint[]>(data)

  useEffect(() => {
    if (!isLive || data.length === 0) {
      setChartData(data)
      return
    }

    // Simulate live updates
    const interval = setInterval(() => {
      setChartData((prev) => {
        const newData = [...prev]
        if (newData.length > 30) {
          newData.shift()
        }

        const lastPoint = newData[newData.length - 1] || { requests: 0, attacks: 0 }
        const newPoint: DataPoint = {
          timestamp: new Date().toLocaleTimeString(),
          requests: lastPoint.requests + Math.floor(Math.random() * 100),
          attacks: lastPoint.attacks + Math.floor(Math.random() * 10),
        }

        newData.push(newPoint)
        return newData
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isLive, data])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-dark-card border border-dark-border rounded-lg p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Traffic Analysis</h3>
        <p className="text-sm text-text-secondary">Real-time network requests vs detected attacks</p>
      </div>

      {chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-text-secondary">
          <p>No data available. Start a simulation to see live traffic.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E2D4A"
              verticalPoints={[]}
            />
            <XAxis
              dataKey="timestamp"
              stroke="#9FA3A8"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#9FA3A8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F1629',
                border: '1px solid #1E2D4A',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(0, 212, 170, 0.1)',
              }}
              labelStyle={{ color: '#E8EAED' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="requests"
              stroke="#00D4AA"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={300}
              name="Requests"
            />
            <Line
              type="monotone"
              dataKey="attacks"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={300}
              name="Attacks Detected"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
