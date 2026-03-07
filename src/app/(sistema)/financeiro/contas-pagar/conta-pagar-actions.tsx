'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

export function ContaPagarActions({ account }: { account: { id: string; status: string } }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (account.status === 'pago') {
    return <span className="text-xs text-gray-400">Pago ✓</span>
  }

  async function handlePay() {
    if (!confirm('Confirmar pagamento desta conta?')) return
    const supabase = createClient()
    const { error } = await supabase
      .from('accounts_payable')
      .update({
        status: 'pago',
        paid_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', account.id)

    if (error) toast.error('Erro ao registrar pagamento')
    else {
      toast.success('Pagamento registrado!')
      startTransition(() => router.refresh())
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={isPending}
      className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
    >
      <Check size={12} /> Pagar
    </button>
  )
}
