'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, Pencil, Trash2, X } from 'lucide-react'

interface Account {
  id: string
  status: string
  description: string
  amount: number
  paid_amount: number
  due_date: string
  customer_id: string | null
}

export function ContaReceberActions({ account }: { account: Account }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showInput, setShowInput] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState({
    description: account.description,
    amount: String(account.amount),
    due_date: account.due_date,
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const remaining = account.amount - account.paid_amount

  async function handleReceive() {
    const value = parseFloat(payAmount) || remaining
    if (value <= 0 || value > remaining) return toast.error('Valor inválido')

    const supabase = createClient()
    const newPaid = account.paid_amount + value
    const isFullyPaid = newPaid >= account.amount

    const { error } = await supabase
      .from('accounts_receivable')
      .update({
        paid_amount: newPaid,
        status: isFullyPaid ? 'pago' : 'pendente',
        received_date: isFullyPaid ? new Date().toISOString().split('T')[0] : null,
      })
      .eq('id', account.id)

    if (error) return toast.error('Erro ao registrar recebimento')

    if (account.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('current_debt')
        .eq('id', account.customer_id)
        .single()
      if (customer) {
        await supabase
          .from('customers')
          .update({ current_debt: Math.max(0, (customer as any).current_debt - value) })
          .eq('id', account.customer_id)
      }
    }

    toast.success(isFullyPaid ? 'Conta recebida!' : `Abatimento de R$ ${value.toFixed(2)} registrado`)
    setShowInput(false)
    setPayAmount('')
    startTransition(() => router.refresh())
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { error } = await supabase
      .from('accounts_receivable')
      .update({
        description: form.description,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
      })
      .eq('id', account.id)
    if (error) toast.error('Erro ao editar conta')
    else { toast.success('Conta atualizada!'); setShowEdit(false); startTransition(() => router.refresh()) }
  }

  async function handleDelete() {
    if (!confirm('Excluir esta conta? Esta ação não pode ser desfeita.')) return
    const supabase = createClient()
    const { error } = await supabase.from('accounts_receivable').delete().eq('id', account.id)
    if (error) toast.error('Erro ao excluir conta')
    else { toast.success('Conta excluída!'); startTransition(() => router.refresh()) }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {account.status === 'pago' ? (
          <span className="text-xs text-gray-400 px-1">Recebido ✓</span>
        ) : showInput ? (
          <>
            <input
              type="number" min="0.01" step="0.01" max={remaining}
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              placeholder={remaining.toFixed(2)}
              className="w-24 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
              autoFocus
            />
            <button
              onClick={handleReceive}
              disabled={isPending}
              className="bg-green-600 text-white px-2 py-1 rounded text-xs disabled:opacity-60"
            >
              OK
            </button>
            <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-gray-600 text-xs px-1">
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
          >
            <Check size={12} /> Receber
          </button>
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
              <h3 className="font-semibold text-gray-800">Editar Conta a Receber</h3>
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
