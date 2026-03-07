import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ContaPagarForm } from './conta-pagar-form'
import { ContaPagarActions } from './conta-pagar-actions'

export default async function ContasPagarPage() {
  const supabase = await createClient()

  const { data: accounts } = await supabase
    .from('accounts_payable')
    .select('*, supplier:suppliers(trade_name)')
    .order('due_date')

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, trade_name')
    .eq('active', true)
    .order('trade_name')

  const pending = accounts?.filter(a => a.status === 'pendente') ?? []
  const overdue = accounts?.filter(a => a.status === 'vencido') ?? []
  const totalPending = pending.reduce((sum, a) => sum + a.amount, 0)
  const totalOverdue = overdue.reduce((sum, a) => sum + a.amount, 0)

  return (
    <div>
      <PageHeader title="Contas a Pagar" description="Controle de despesas e obrigações" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Pendentes</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-gray-400">{pending.length} conta(s)</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 shadow-sm p-4">
          <p className="text-sm text-red-500">Vencidas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-red-400">{overdue.length} conta(s)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total a pagar</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalPending + totalOverdue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Fornecedor</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3">Vencimento</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(accounts ?? []).map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{a.description}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{a.category}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{(a.supplier as any)?.trade_name ?? '-'}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(a.amount)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{formatDate(a.due_date)}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3"><ContaPagarActions account={a} /></td>
                    </tr>
                  ))}
                  {(accounts ?? []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">Nenhuma conta cadastrada</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <ContaPagarForm suppliers={suppliers ?? []} />
      </div>
    </div>
  )
}
