'use client'

import { useState, useEffect } from 'react'
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
  const [collapsed, setCollapsed] = useState(false)

  // Persistir estado no localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  function handleToggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
    window.dispatchEvent(new CustomEvent('sidebar-collapse', { detail: next }))
  }

  const sidebarWidth = collapsed ? 'lg:pl-14' : 'lg:pl-64'

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        lowStockCount={lowStockCount}
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarWidth}`}>
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
