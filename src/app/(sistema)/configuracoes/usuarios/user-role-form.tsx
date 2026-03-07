'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { roleLabel } from '@/lib/utils'
import type { Profile, UserRole } from '@/types/database'

const ROLES: UserRole[] = ['administrador', 'gerente', 'caixa', 'estoquista']

export function UserRoleForm({ profiles }: { profiles: Profile[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<UserRole>('caixa')
  const [active, setActive] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return toast.error('Selecione um usuário')

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ role, active })
      .eq('id', userId)

    if (error) toast.error(error.message)
    else {
      toast.success('Perfil atualizado!')
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Alterar Perfil</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Usuário</label>
          <select value={userId} onChange={e => setUserId(e.target.value)} className="input-field w-full" required>
            <option value="">Selecionar...</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({roleLabel(p.role)})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Novo perfil</label>
          <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="input-field w-full">
            {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="user-active"
            checked={active}
            onChange={e => setActive(e.target.checked)}
            className="w-4 h-4 accent-green-600"
          />
          <label htmlFor="user-active" className="text-sm text-gray-600">Usuário ativo</label>
        </div>
        <button
          type="submit"
          disabled={isPending || !userId}
          className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Salvar Perfil'}
        </button>
      </form>
    </div>
  )
}
