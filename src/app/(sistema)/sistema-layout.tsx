'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import type { Profile } from '@/types/database'

export function SistemaLayout({
  children,
  profile,
  lowStockCount = 0,
}: {
  children: React.ReactNode
  profile: Profile | null
  lowStockCount?: number
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        lowStockCount={lowStockCount}
      />
      {/* lg:pl-64 dá espaço para o sidebar fixo no desktop */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Navbar
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
          lowStockCount={lowStockCount}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
