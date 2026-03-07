'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, LogOut, User, Bell } from 'lucide-react'
import type { Profile } from '@/types/database'
import { roleLabel } from '@/lib/utils'

interface NavbarProps {
  profile: Profile | null
  onMenuClick: () => void
}

export function Navbar({ profile, onMenuClick }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
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
