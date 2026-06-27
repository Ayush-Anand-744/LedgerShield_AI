'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrafficPoint {
  t: string
  normal: number
  attack: number
  blocked: number
}

interface MitigationPhase {
  time: number
  action: string
  effectiveness: number
  status: 'pending' | 'active' | 'done'
}

interface SimResult {
  attackType: string
  peakPps: number
  detectionMs: number
  mitigationMs: number
  blockedIPs: number
  totalPackets: number
  effectivenessPercent: number
}

// ─── Attack Config ─────────────────────────────────────────────────────────────

const ATTACKS = [
  {
    id: 'syn_flood',
    name: 'SYN Flood',
    icon: '🌊',
    description: 'Exploits TCP handshake — sends massive SYN packets exhausting server state tables',
    severity: 'CRITICAL',
    peakPps: 850000,
    layer: 'Layer 3/4',
    signatures: ['Half-open TCP >10K/s', 'SYN ratio >95%', 'Randomized source IPs'],
  },
  {
    id: 'udp_flood',
    name: 'UDP Flood',
    icon: '💥',
    description: 'Volumetric attack using UDP datagrams — saturates bandwidth and overwhelms network',
    severity: 'HIGH',
    peakPps: 1200000,
    layer: 'Layer 3/4',
    signatures: ['UDP traffic >80%', 'Random dest ports', 'Packet size 1400+ bytes'],
  },
  {
    id: 'http_flood',
    name: 'HTTP/HTTPS Flood',
    icon: '🔄',
    description: 'Application-layer L7 attack — exhausts web server resources with valid HTTP requests',
    severity: 'HIGH',
    peakPps: 50000,
    layer: 'Layer 7',
    signatures: ['GET/POST rate >5K/s', 'Session reuse pattern', 'User-agent spoofing'],
  },
  {
    id: 'slowloris',
    name: 'Slowloris',
    icon: '🐌',
    description: 'Keeps HTTP connections open indefinitely — low bandwidth, high server damage',
    severity: 'MEDIUM',
    peakPps: 500,
    layer: 'Layer 7',
    signatures: ['Slow header completion', 'High concurrent conns', 'Minimal bandwidth'],
  },
]

const MITIGATION_STEPS: Record<string, MitigationPhase[]> = {
  syn_flood: [
    { time: 0, action: '🔍 MLP Neural Net detecting anomaly (256→128→64→32)', effectiveness: 0, status: 'pending' },
    { time: 2, action: '🚨 SYN Flood CONFIRMED — confidence 98.7%', effectiveness: 15, status: 'pending' },
    { time: 4, action: '🛡️ SYN Cookies enabled on all network interfaces', effectiveness: 40, status: 'pending' },
    { time: 7, action: '🚫 Rate limiting: max 100 SYN/s per source IP', effectiveness: 65, status: 'pending' },
    { time: 10, action: '🌐 BGP Blackhole routing activated upstream', effectiveness: 80, status: 'pending' },
    { time: 13, action: '✅ Traffic normalized — 847 IPs blocked permanently', effectiveness: 97, status: 'pending' },
  ],
  udp_flood: [
    { time: 0, action: '🔍 Anomaly: packet rate 12σ above baseline', effectiveness: 0, status: 'pending' },
    { time: 2, action: '🚨 UDP Flood CONFIRMED — 1.2M pkt/s detected', effectiveness: 10, status: 'pending' },
    { time: 5, action: '📦 UDP rate limiting: 10K pkt/s per source IP', effectiveness: 45, status: 'pending' },
    { time: 8, action: '🔥 Traffic scrubbing center activated (Cloudflare Magic)', effectiveness: 70, status: 'pending' },
    { time: 11, action: '🌐 Upstream null routing — carrier notified via API', effectiveness: 88, status: 'pending' },
    { time: 14, action: '✅ Attack mitigated — 1,243 IPs blocked across 34 ASNs', effectiveness: 96, status: 'pending' },
  ],
  http_flood: [
    { time: 0, action: '🔍 WAF detecting suspicious request velocity', effectiveness: 0, status: 'pending' },
    { time: 3, action: '🚨 HTTP Flood CONFIRMED — 48K req/s from botnet', effectiveness: 12, status: 'pending' },
    { time: 5, action: '🤖 CAPTCHA challenge deployed for new sessions', effectiveness: 35, status: 'pending' },
    { time: 8, action: '🚫 Bot fingerprint blocking: 2,847 unique signatures', effectiveness: 62, status: 'pending' },
    { time: 11, action: '☁️ CDN absorbing 89% of traffic at edge nodes', effectiveness: 82, status: 'pending' },
    { time: 14, action: '✅ Application secured — 567 IPs permanently banned', effectiveness: 94, status: 'pending' },
  ],
  slowloris: [
    { time: 0, action: '🔍 IDS detecting slow connection establishment pattern', effectiveness: 0, status: 'pending' },
    { time: 4, action: '🚨 Slowloris CONFIRMED — 8,432 open connections', effectiveness: 8, status: 'pending' },
    { time: 6, action: '⏱️ Connection timeout reduced: 120s → 15s', effectiveness: 40, status: 'pending' },
    { time: 9, action: '🔢 Max connections per IP limited to 50', effectiveness: 70, status: 'pending' },
    { time: 12, action: '🔄 Reverse proxy absorbing incomplete HTTP requests', effectiveness: 88, status: 'pending' },
    { time: 15, action: '✅ Attack neutralized — 234 IPs blocked', effectiveness: 98, status: 'pending' },
  ],
}

const IDS_LOG_LINES = [
  '[00:00.000] INFO  System monitoring active — ML baseline established',
  '[00:01.234] WARN  Packet rate increase: 125K pkt/s (baseline: 82K)',
  '[00:02.567] ALERT MLP classifier triggered — anomaly score: 0.94',
  '[00:03.123] CRIT  ATTACK DETECTED — confidence: 98.7% | ML ensemble vote: 3/3',
  '[00:04.456] INFO  Activating mitigation layer 1...',
  '[00:05.789] INFO  Rate limiting rules pushed to 24 edge nodes',
  '[00:07.012] INFO  BGP flowspec propagated — 2.3s convergence',
  '[00:08.345] WARN  Peak traffic: elevated — mitigation 45% effective',
  '[00:10.678] INFO  Traffic scrubbing center online — 3 PoPs active',
  '[00:11.901] INFO  Blocking 847 source IPs across 34 ASNs',
  '[00:13.234] INFO  Traffic normalizing — 78K pkt/s (within 5% of baseline)',
  '[00:15.567] OK    Attack fully mitigated — all systems nominal',
  '[00:16.890] INFO  Incident report generated: INC-2024-0847',
  '[00:17.123] INFO  Updating threat intelligence database...',
  '[00:18.456] INFO  Post-incident analysis queued for 00:30 UTC',
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DDoSPage() {
  const [selectedAttack, setSelectedAttack] = useState(ATTACKS[0])
  const [intensity, setIntensity] = useState(1.5)
  const [simRunning, setSimRunning] = useState(false)
  const [simDone, setSimDone] = useState(false)
  const [traffic, setTraffic] = useState<TrafficPoint[]>([])
  const [phases, setPhases] = useState<MitigationPhase[]>([])
  const [result, setResult] = useState<SimResult | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const startSim = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSimRunning(true)
    setSimDone(false)
    setTraffic([])
    setElapsedMs(0)
    setResult(null)
    const attackSteps = MITIGATION_STEPS[selectedAttack.id]
    setPhases(attackSteps.map(s => ({ ...s, status: 'pending' as const })))

    let tick = 0
    const baseNormal = 80000
    const peakAttack = selectedAttack.peakPps * intensity
    const detectionTick = 8
    const fullAttackTick = 18
    const mitigationStart = 22
    const mitigationEnd = 78

    timerRef.current = setInterval(() => {
      tick++
      const elapsed = tick * 100

      const attackProgress = Math.min(1, Math.max(0, (tick - detectionTick) / (fullAttackTick - detectionTick)))
      const mitigationProgress = Math.min(1, Math.max(0, (tick - mitigationStart) / (mitigationEnd - mitigationStart)))
      const currentAttack = attackProgress > 0 ? peakAttack * attackProgress * (1 - mitigationProgress * 0.95) : 0
      const blocked = mitigationProgress * currentAttack * 0.9
      const normal = baseNormal + (Math.random() - 0.5) * 5000

      setTraffic(prev => [
        ...prev.slice(-80),
        {
          t: `${(tick / 10).toFixed(1)}s`,
          normal: Math.round(normal),
          attack: Math.round(Math.max(0, currentAttack - blocked)),
          blocked: Math.round(blocked),
        }
      ])

      setPhases(attackSteps.map((p) => {
        const phaseTick = (p.time / 20) * 100
        if (tick >= phaseTick + 5) return { ...p, status: 'done' as const }
        if (tick >= phaseTick) return { ...p, status: 'active' as const }
        return { ...p, status: 'pending' as const }
      }))

      setElapsedMs(elapsed)

      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight
      }

      if (tick >= 100) {
        clearInterval(timerRef.current!)
        setSimRunning(false)
        setSimDone(true)
        setResult({
          attackType: selectedAttack.name,
          peakPps: Math.round(peakAttack),
          detectionMs: detectionTick * 100,
          mitigationMs: mitigationStart * 100,
          blockedIPs: Math.round(200 + Math.random() * 800),
          totalPackets: Math.round(peakAttack * 8),
          effectivenessPercent: 94 + Math.round(Math.random() * 5),
        })
      }
    }, 100)
  }, [selectedAttack, intensity])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const activePhase = phases.find(p => p.status === 'active')
  const effectiveness = simDone ? (result?.effectivenessPercent ?? 97) : (activePhase?.effectiveness ?? 0)
  const logLines = IDS_LOG_LINES.slice(0, simDone ? IDS_LOG_LINES.length : Math.min(IDS_LOG_LINES.length, Math.floor(elapsedMs / 700)))

  return (
    <div className="min-h-screen bg-[#060B18] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">DDoS Command Center</h1>
          <p className="text-[#94A3B8] text-sm">Live attack simulation with AI-powered IDS/IPS mitigation response</p>
        </div>
        <div className="flex gap-3">
          {simRunning && (
            <div className="flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl px-5 py-3">
              <div className="w-3 h-3 bg-[#EF4444] rounded-full animate-ping" />
              <span className="text-[#EF4444] font-bold text-sm">ATTACK IN PROGRESS</span>
              <span className="text-[#EF4444] font-mono text-sm">{(elapsedMs / 1000).toFixed(1)}s</span>
            </div>
          )}
          {simDone && !simRunning && (
            <div className="flex items-center gap-3 bg-[#00D4AA]/10 border border-[#00D4AA]/30 rounded-xl px-5 py-3">
              <div className="w-3 h-3 bg-[#00D4AA] rounded-full" />
              <span className="text-[#00D4AA] font-bold text-sm">ATTACK NEUTRALIZED ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Top: Attack selector + config */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {ATTACKS.map(a => (
          <button
            key={a.id}
            onClick={() => {
              if (!simRunning) {
                setSelectedAttack(a)
                setSimDone(false)
                setTraffic([])
                setPhases([])
                setResult(null)
              }
            }}
            disabled={simRunning}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedAttack.id === a.id
                ? 'border-[#EF4444]/50 bg-[#EF4444]/10'
                : 'border-[#1E2D4A] bg-[#0F1629] hover:border-[#2A3A5C] disabled:opacity-50'
            }`}
          >
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="text-sm font-semibold text-white mb-1">{a.name}</div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                a.severity === 'CRITICAL' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                a.severity === 'HIGH' ? 'bg-[#F97316]/20 text-[#F97316]' :
                'bg-[#8B5CF6]/20 text-[#8B5CF6]'
              }`}>{a.severity}</span>
              <span className="text-xs text-[#64748B]">{a.layer}</span>
            </div>
            <div className="text-xs text-[#64748B]">{(a.peakPps / 1000).toFixed(0)}K pkt/s peak</div>
          </button>
        ))}
      </div>

      {/* Attack description */}
      <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-4 mb-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{selectedAttack.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-base font-semibold text-white">{selectedAttack.name}</h3>
              <span className="text-xs text-[#64748B]">{selectedAttack.layer} Attack</span>
            </div>
            <p className="text-sm text-[#94A3B8] mb-3">{selectedAttack.description}</p>
            <div className="flex gap-2 flex-wrap">
              {selectedAttack.signatures.map((s, i) => (
                <span key={i} className="text-xs bg-[#1A2340] text-[#94A3B8] px-2 py-1 rounded">{s}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#94A3B8]">Intensity: <strong className="text-[#EF4444]">{intensity.toFixed(1)}x</strong></span>
              <input
                type="range" min={0.5} max={3} step={0.5}
                value={intensity}
                onChange={e => setIntensity(Number(e.target.value))}
                disabled={simRunning}
                className="w-24 accent-[#EF4444]"
              />
            </div>
            <button
              onClick={simRunning ? undefined : startSim}
              disabled={simRunning}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                simRunning
                  ? 'bg-[#EF4444]/20 text-[#EF4444] cursor-not-allowed border border-[#EF4444]/30'
                  : 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:scale-95'
              }`}
            >
              {simRunning ? '⚡ Simulating...' : '🚀 Launch Simulation'}
            </button>
          </div>
        </div>
      </div>

      {/* Main: Traffic Chart + Gauge */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Traffic */}
        <div className="col-span-2 bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Live Traffic Monitor</h3>
              <p className="text-xs text-[#64748B]">Packet rate: normal vs attack vs ML-blocked traffic</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#00D4AA] inline-block rounded" />Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#EF4444] inline-block rounded" />Attack</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#F59E0B] inline-block rounded" />Blocked</span>
            </div>
          </div>

          {traffic.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-[#475569]">
              <div className="text-4xl mb-3">🛡️</div>
              <span className="text-sm">All systems nominal — launch a simulation to begin</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={traffic} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis dataKey="t" stroke="#475569" tick={{ fontSize: 10 }} interval={14} />
                <YAxis
                  stroke="#475569"
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1629', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: any, name: string) => [
                    `${v >= 1000000 ? (v / 1000000).toFixed(2) + 'M' : (v / 1000).toFixed(1) + 'K'} pkt/s`,
                    name
                  ]}
                />
                <Area type="monotone" dataKey="normal" stroke="#00D4AA" fill="url(#gN)" strokeWidth={2} name="Normal" />
                <Area type="monotone" dataKey="attack" stroke="#EF4444" fill="url(#gA)" strokeWidth={2} name="Attack" />
                <Area type="monotone" dataKey="blocked" stroke="#F59E0B" fill="url(#gB)" strokeWidth={2} name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gauge + Stats */}
        <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6 flex flex-col">
          <h3 className="text-base font-semibold text-white mb-1">IDS/IPS Effectiveness</h3>
          <p className="text-xs text-[#64748B] mb-4">Real-time mitigation response</p>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1E2D4A" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={effectiveness > 80 ? '#00D4AA' : effectiveness > 50 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="8"
                  strokeDasharray={`${effectiveness * 2.51} 251`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{effectiveness}%</span>
                <span className="text-xs text-[#64748B]">Blocked</span>
              </div>
            </div>

            {result ? (
              <div className="w-full space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#1E2D4A]">
                  <span className="text-[#64748B]">Detection Time</span>
                  <span className="text-[#00D4AA] font-mono font-bold">{result.detectionMs}ms</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1E2D4A]">
                  <span className="text-[#64748B]">Full Mitigation</span>
                  <span className="text-[#00D4AA] font-mono font-bold">{result.mitigationMs}ms</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1E2D4A]">
                  <span className="text-[#64748B]">IPs Blocked</span>
                  <span className="text-white font-bold">{result.blockedIPs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1E2D4A]">
                  <span className="text-[#64748B]">Peak PPS</span>
                  <span className="text-[#EF4444] font-bold">{(result.peakPps / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#64748B]">Total Packets</span>
                  <span className="text-white font-bold">{(result.totalPackets / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#475569] text-center">
                {simRunning ? 'Attack in progress...' : 'Run simulation to see stats'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Timeline + IDS Log */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Mitigation Timeline */}
        <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">AI Mitigation Timeline</h3>
          {phases.length === 0 ? (
            <div className="text-[#475569] text-sm text-center py-8">Run a simulation to see mitigation steps</div>
          ) : (
            <div className="space-y-2">
              {phases.map((p, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  p.status === 'active' ? 'bg-[#00D4AA]/10 border border-[#00D4AA]/30' :
                  p.status === 'done' ? 'bg-[#1A2340]/70' :
                  'bg-[#060B18] opacity-40'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    p.status === 'done' ? 'bg-[#00D4AA]/20 text-[#00D4AA]' :
                    p.status === 'active' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                    'bg-[#1E2D4A] text-[#475569]'
                  }`}>
                    {p.status === 'done' ? '✓' : p.status === 'active' ? '▶' : i + 1}
                  </div>
                  <div className="flex-1">
                    <span className={`text-xs ${p.status === 'pending' ? 'text-[#475569]' : 'text-[#E2E8F0]'}`}>
                      {p.action}
                    </span>
                  </div>
                  {p.effectiveness > 0 && (
                    <span className={`text-xs font-bold flex-shrink-0 ${p.status === 'pending' ? 'text-[#475569]' : 'text-[#00D4AA]'}`}>
                      {p.effectiveness}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IDS Log */}
        <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">IDS System Log</h3>
            {(simRunning || simDone) && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded ${
                simRunning ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#00D4AA]/10 text-[#00D4AA]'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${simRunning ? 'bg-[#EF4444] animate-ping' : 'bg-[#00D4AA]'}`} />
                {simRunning ? 'LIVE' : 'RESOLVED'}
              </div>
            )}
          </div>
          <div
            ref={logRef}
            className="bg-[#060B18] rounded-lg p-4 h-60 overflow-y-auto font-mono text-xs space-y-1"
          >
            {(!simRunning && !simDone) ? (
              <span className="text-[#475569]">Waiting for simulation to start...</span>
            ) : (
              logLines.map((line, i) => (
                <div key={i} className={`leading-5 ${
                  line.includes('CRIT') ? 'text-[#EF4444]' :
                  line.includes('ALERT') || line.includes('WARN') ? 'text-[#F59E0B]' :
                  line.includes('OK') ? 'text-[#00D4AA]' :
                  line.includes('INFO') ? 'text-[#64748B]' :
                  'text-[#94A3B8]'
                }`}>{line.replace('ATTACK DETECTED', `${selectedAttack.name} DETECTED`)}</div>
              ))
            )}
            {simRunning && <div className="text-[#00D4AA] animate-pulse">▋</div>}
          </div>
        </div>
      </div>

      {/* Model Performance */}
      <div className="bg-[#0F1629] border border-[#1E2D4A] rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">Detection Model Performance — Training Results</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              name: 'MLP Neural Network',
              detail: '4-layer: 256→128→64→32 neurons, ReLU activation',
              acc: 97.3, prec: 96.8, rec: 97.1, f1: 96.9,
              color: '#00D4AA',
              desc: 'Primary detector — fastest inference, best for SYN & UDP floods',
            },
            {
              name: 'Random Forest',
              detail: '100 estimators, max_depth=15, n_features=sqrt',
              acc: 95.8, prec: 95.2, rec: 95.6, f1: 95.4,
              color: '#3B82F6',
              desc: 'Ensemble detector — high interpretability, strong on HTTP floods',
            },
            {
              name: 'Gradient Boosting',
              detail: '200 estimators, learning_rate=0.1, max_depth=6',
              acc: 96.4, prec: 96.0, rec: 96.2, f1: 96.1,
              color: '#8B5CF6',
              desc: 'Meta-learner — handles edge cases, excellent on Slowloris',
            },
          ].map((m) => (
            <div key={m.name} className="bg-[#060B18] rounded-xl p-4 border border-[#1E2D4A]">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-1.5 h-12 rounded flex-shrink-0 mt-1" style={{ backgroundColor: m.color }} />
                <div>
                  <div className="text-sm font-bold text-white">{m.name}</div>
                  <div className="text-xs text-[#64748B] mt-0.5">{m.detail}</div>
                </div>
              </div>
              <p className="text-xs text-[#94A3B8] mb-3">{m.desc}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[['Accuracy', m.acc], ['Precision', m.prec], ['Recall', m.rec], ['F1 Score', m.f1]].map(([k, v]) => (
                  <div key={k as string}>
                    <div className="text-xs text-[#475569] mb-0.5">{k}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#1E2D4A] rounded-full h-1">
                        <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: m.color }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: m.color }}>{(v as number).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
