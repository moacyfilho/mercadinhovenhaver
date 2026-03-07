'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'

const CATEGORIES = ['Fornecedor', 'Aluguel', 'Energia', 'Água', 'Internet', 'Salário', 'Impostos', 'Manutenção', 'Outros']

interface Props {
  suppliers: Pick<Supplier, 'id' | 'trade_name'>[]
}

export function ContaPagarForm({ suppliers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    description: '',
    category: 'Fornecedor',
    supplier_id: '',
    amount: '',
    due_date: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount || !form.due_date) {
      return toast.error('Preencha descrição, valor e vencimento')
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('accounts_payable').insert({
      description: form.description,
      category: form.category,
      supplier_id: form.supplier_id || null,
      amount: parseFloat(form.amount),
      due_date: form.due_date,
      notes: form.notes || null,
      status: 'pendente',
      created_by: user!.id,
    })

    if (error) toast.error(error.message)
    else {
      toast.success('Conta cadastrada!')
      setForm({ description: '', category: 'Fornecedor', supplier_id: '', amount: '', due_date: '', notes: '' })
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Nova Conta a Pagar</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição *</label>
          <input value={form.description} onChange={e => set('description', e.target.value)} required
            className="input-field w-full" placeholder="Ex: Boleto energia" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Categoria</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field w-full">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Fornecedor</label>
          <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} className="input-field w-full">
            <option value="">Nenhum</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.trade_name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Valor (R$) *</label>
          <input type="number" min="0.01" step="0.01" value={form.amount}
            onChange={e => set('amount', e.target.value)} required className="input-field w-full" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Vencimento *</label>
          <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
            required className="input-field w-full" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Observações</label>
          <input value={form.notes} onChange={e => set('notes', e.target.value)}
            className="input-field w-full" placeholder="Opcional" />
        </div>
        <button type="submit" disabled={isPending}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60">
          {isPending ? 'Salvando...' : 'Cadastrar Conta'}
        </button>
      </form>
    </div>
  )
}
