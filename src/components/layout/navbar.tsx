'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, LogOut, AlertTriangle } from 'lucide-react'
import type { Profile } from '@/types/database'
import { roleLabel } from '@/lib/utils'

interface NavbarProps {
  profile: Profile | null
  onMenuClick: () => void
  lowStockCount?: number
}

export function Navbar({ profile, onMenuClick, lowStockCount = 0 }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10 print:hidden">
      {/* Hamburger — só em mobile */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 lg:hidden"
      >
        <Menu size={22} />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        {/* Badge estoque baixo */}
        {lowStockCount > 0 && (
          <Link
            href="/estoque"
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <AlertTriangle size={14} />
            <span className="hidden sm:inline">Estoque baixo</span>
            <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {lowStockCount}
            </span>
          </Link>
        )}

        {/* Usuário */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold">
            {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-medium text-gray-800 leading-tight">{profile?.name ?? 'Usuário'}</p>
            <p className="text-xs text-gray-500">{roleLabel(profile?.role ?? '')}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sair"
          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
