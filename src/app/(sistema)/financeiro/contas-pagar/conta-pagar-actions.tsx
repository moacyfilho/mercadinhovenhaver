'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, Pencil, Trash2, X } from 'lucide-react'

const CATEGORIES = ['Fornecedor', 'Aluguel', 'Energia', 'Água', 'Internet', 'Salário', 'Impostos', 'Manutenção', 'Outros']

interface Account {
  id: string
  status: string
  description: string
  category: string | null
  amount: number
  due_date: string
  notes: string | null
}

export function ContaPagarActions({ account }: { account: Account }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState({
    description: account.description,
    category: account.category ?? 'Outros',
    amount: String(account.amount),
    due_date: account.due_date,
    notes: account.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handlePay() {
    if (!confirm('Confirmar pagamento desta conta?')) return
    const supabase = createClient()
    const { error } = await supabase
      .from('accounts_payable')
      .update({ status: 'pago', paid_date: new Date().toISOString().split('T')[0] })
      .eq('id', account.id)
    if (error) toast.error('Erro ao registrar pagamento')
    else { toast.success('Pagamento registrado!'); startTransition(() => router.refresh()) }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { error } = await supabase
      .from('accounts_payable')
      .update({
        description: form.description,
        category: form.category,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        notes: form.notes || null,
      })
      .eq('id', account.id)
    if (error) toast.error('Erro ao editar conta')
    else { toast.success('Conta atualizada!'); setShowEdit(false); startTransition(() => router.refresh()) }
  }

  async function handleDelete() {
    if (!confirm('Excluir esta conta? Esta ação não pode ser desfeita.')) return
    const supabase = createClient()
    const { error } = await supabase.from('accounts_payable').delete().eq('id', account.id)
    if (error) toast.error('Erro ao excluir conta')
    else { toast.success('Conta excluída!'); startTransition(() => router.refresh()) }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {account.status !== 'pago' ? (
          <button
            onClick={handlePay}
            disabled={isPending}
            className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
          >
            <Check size={12} /> Pagar
          </button>
        ) : (
          <span className="text-xs text-gray-400 px-1">Pago ✓</span>
        )}
        <button
          onClick={() => setShowEdit(true)}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
          title="Editar"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-60"
          title="Excluir"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {showEdit && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowEdit(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Editar Conta a Pagar</h3>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição *</label>
                <input
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  required
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Categoria</label>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="input-field w-full"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Valor (R$) *</label>
                  <input
                    type="number" min="0.01" step="0.01"
                    value={form.amount}
                    onChange={e => set('amount', e.target.value)}
                    required
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Vencimento *</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => set('due_date', e.target.value)}
                    required
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Observações</label>
                <input
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  className="input-field w-full"
                  placeholder="Opcional"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
