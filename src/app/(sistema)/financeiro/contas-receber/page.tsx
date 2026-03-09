import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ContaReceberActions } from './conta-receber-actions'

export default async function ContasReceberPage() {
  const supabase = await createClient()

  const { data: accounts } = await supabase
    .from('accounts_receivable')
    .select('*, customer:customers(name)')
    .order('due_date')

  const pending = accounts?.filter(a => a.status === 'pendente') ?? []
  const totalPending = pending.reduce((sum, a) => sum + (a.amount - a.paid_amount), 0)
  const overdue = accounts?.filter(a => a.status === 'vencido') ?? []
  const totalOverdue = overdue.reduce((sum, a) => sum + (a.amount - a.paid_amount), 0)

  return (
    <div>
      <PageHeader title="Contas a Receber" description="Controle de recebimentos e fiado" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">A Receber</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-gray-400">{pending.length} conta(s) pendente(s)</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 shadow-sm p-4">
          <p className="text-sm text-red-500">Vencidas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-red-400">{overdue.length} conta(s)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total pendente</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalPending + totalOverdue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-3 py-2 sm:px-4 sm:py-3">Descrição</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Cliente</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Valor</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Pago</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Saldo</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Vencimento</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Status</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(accounts ?? []).map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-gray-800">{a.description}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-500 text-xs">{(a.customer as any)?.name ?? '-'}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right text-gray-600">{formatCurrency(a.amount)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right text-green-600 font-medium">{formatCurrency(a.paid_amount)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right font-bold text-gray-800">
                    {formatCurrency(a.amount - a.paid_amount)}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs text-gray-500">{formatDate(a.due_date)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3"><ContaReceberActions account={a as any} /></td>
                </tr>
              ))}
              {(accounts ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    Nenhuma conta a receber
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
