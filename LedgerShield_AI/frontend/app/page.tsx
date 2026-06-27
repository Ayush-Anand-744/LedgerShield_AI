import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center">
      <div className="max-w-2xl rounded-2xl border border-[#1E2D4A] bg-[#0A0F1E] p-10 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-[#00D4AA]">Financial Defense Cockpit</p>
        <h1 className="mt-4 text-4xl font-bold text-white">LedgerShield_AI™</h1>
        <p className="mt-4 text-[#94A3B8]">
          AI-powered ledger protection, customer risk intelligence, anomaly monitoring, and DDoS simulation for banking-security workflows.
        </p>
        <Link href="/dashboard" className="mt-7 inline-flex rounded-xl bg-[#00D4AA] px-6 py-3 font-semibold text-[#04110E]">
          Open Command Center
        </Link>
      </div>
    </div>
  )
}
