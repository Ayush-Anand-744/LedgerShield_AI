import type { Metadata, Viewport } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'LedgerShield_AI - Banking Risk Intelligence',
  description: 'AI-powered financial risk, ledger anomaly, and DDoS intelligence platform.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://rsms.me/inter/inter.css" rel="stylesheet" />
      </head>
      <body style={{ backgroundColor: '#060B18', color: '#E2E8F0' }}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              {children}
              <footer className="mt-10 border-t border-[#1E2D4A] pt-5 text-center text-xs text-[#64748B]">
                © 2026 Ayush Anand · LedgerShield_AI™ · All rights reserved.
              </footer>
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
