'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  Brain,
  TrendingUp,
  Zap,
  Activity,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStatus, SystemStatus } from '@/lib/api'

const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { href: '/customers', label: 'Customer Intel', icon: Users },
      { href: '/analytics', label: 'Risk Analytics', icon: BarChart3 },
      { href: '/models', label: 'Model Intelligence', icon: Brain },
    ],
  },
  {
    label: 'SECURITY',
    items: [
      { href: '/ddos', label: 'DDoS Command', icon: Shield },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { href: '/credit-risk', label: 'Risk Predictor', icon: TrendingUp },
      { href: '/performance', label: 'Performance', icon: Activity },
      { href: '/workflow', label: 'Workflow Demo', icon: Zap },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [uptime, setUptime] = useState('00:00:00')
  const [startTime] = useState(Date.now())

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getStatus()
        setStatus(data)
      } catch {}
    }
    fetchStatus()
    const iv = setInterval(fetchStatus, 10000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const tick = () => {
      const total = Math.floor((Date.now() - startTime) / 1000) + (status?.uptime_seconds ?? 0)
      const h = Math.floor(total / 3600)
      const m = Math.floor((total % 3600) / 60)
      const s = total % 60
      setUptime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [status, startTime])

  return (
    <aside className="w-60 bg-[#0A0F1E] border-r border-[#1E2D4A] flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-[#1E2D4A]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#00D4AA] to-[#3B82F6] rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">LedgerShield_AI</div>
            <div className="text-xs text-[#64748B]">Risk Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div className="text-xs font-semibold text-[#475569] px-3 mb-1.5 tracking-widest">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                      active
                        ? 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/25'
                        : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1E2D4A]/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 bg-[#00D4AA] rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer status */}
      <div className="p-3 border-t border-[#1E2D4A]">
        <div className="bg-[#060B18] rounded-xl p-3 border border-[#1E2D4A] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#475569]">System</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse" />
              <span className="text-xs text-[#00D4AA] font-semibold">Online</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            {[
              { label: 'Credit Model', active: status?.credit_model_trained ?? false },
              { label: 'DDoS Model', active: status?.ddos_model_trained ?? false },
              { label: 'API Backend', active: true },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-[#00D4AA]' : 'bg-[#475569]'}`} />
                  <span className="text-[#475569]">{s.label}</span>
                </div>
                <span className={`font-medium ${s.active ? 'text-[#00D4AA]' : 'text-[#475569]'}`}>
                  {s.active ? 'Active' : 'Idle'}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#1E2D4A] flex items-center justify-between text-xs">
            <span className="text-[#475569]">Uptime</span>
            <span className="font-mono text-[#00D4AA]">{uptime}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
