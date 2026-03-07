'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

interface Account {
  id: string
  status: string
  amount: number
  paid_amount: number
  customer_id: string | null
}

export function ContaReceberActions({ account }: { account: Account }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showInput, setShowInput] = useState(false)
  const [payAmount, setPayAmount] = useState('')

  if (account.status === 'pago') {
    return <span className="text-xs text-gray-400">Recebido ✓</span>
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

    // Abater dívida do cliente
    if (account.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('current_debt')
        .eq('id', account.customer_id)
        .single()

      if (customer) {
        await supabase
          .from('customers')
          .update({ current_debt: Math.max(0, customer.current_debt - value) })
          .eq('id', account.customer_id)
      }
    }

    toast.success(isFullyPaid ? 'Conta recebida!' : `Abatimento de R$ ${value.toFixed(2)} registrado`)
    setShowInput(false)
    setPayAmount('')
    startTransition(() => router.refresh())
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-1">
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
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
    >
      <Check size={12} /> Receber
    </button>
  )
}
