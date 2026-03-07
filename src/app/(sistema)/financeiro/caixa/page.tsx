import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default async function CaixaPage() {
  const supabase = await createClient()

  const { data: registers } = await supabase
    .from('cash_registers')
    .select('*, user:profiles(name)')
    .order('opened_at', { ascending: false })
    .limit(30)

  const open = registers?.filter(r => r.status === 'aberto') ?? []

  return (
    <div>
      <PageHeader
        title="Controle de Caixa"
        description="Histórico de abertura e fechamento de caixas"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Caixas abertos agora</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{open.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Vendas hoje (todos)</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(
              (registers ?? [])
                .filter(r => r.closed_at && new Date(r.closed_at).toDateString() === new Date().toDateString())
                .reduce((s, r) => s + r.total_sales, 0) +
              open.reduce((s, r) => s + r.total_sales, 0)
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-3">Operador</th>
                <th className="px-4 py-3">Abertura</th>
                <th className="px-4 py-3">Fechamento</th>
                <th className="px-4 py-3 text-right">Fundo</th>
                <th className="px-4 py-3 text-right">Dinheiro</th>
                <th className="px-4 py-3 text-right">PIX</th>
                <th className="px-4 py-3 text-right">Cartão</th>
                <th className="px-4 py-3 text-right">Total Vendas</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(registers ?? []).map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{(r.user as any)?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(r.opened_at)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{r.closed_at ? formatDateTime(r.closed_at) : '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(r.initial_balance)}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(r.cash_sales)}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{formatCurrency(r.pix_sales)}</td>
                  <td className="px-4 py-3 text-right text-purple-600 font-medium">{formatCurrency(r.debit_sales + r.credit_sales)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(r.total_sales)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {(registers ?? []).length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    Nenhum registro de caixa. Abra o caixa no PDV para começar.
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
