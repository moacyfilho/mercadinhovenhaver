import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { MovimentacaoForm } from './movimentacao-form'

const typeLabels: Record<string, { label: string; color: string }> = {
  entrada: { label: 'Entrada', color: 'text-green-600' },
  saida: { label: 'Saída', color: 'text-red-600' },
  ajuste_positivo: { label: 'Ajuste +', color: 'text-blue-600' },
  ajuste_negativo: { label: 'Ajuste -', color: 'text-amber-600' },
  inventario: { label: 'Inventário', color: 'text-purple-600' },
}

export default async function MovimentacoesPage() {
  const supabase = await createClient()

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('*, product:products(name, unit), user:profiles(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: products } = await supabase
    .from('products')
    .select('id, name, unit, stock_qty')
    .eq('active', true)
    .order('name')

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, trade_name')
    .eq('active', true)
    .order('trade_name')

  return (
    <div>
      <PageHeader title="Movimentações de Estoque" description="Histórico de entradas e saídas" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Qtd</th>
                    <th className="px-4 py-3 text-right">Antes</th>
                    <th className="px-4 py-3 text-right">Depois</th>
                    <th className="px-4 py-3">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(movements ?? []).map(m => {
                    const typeInfo = typeLabels[m.type] ?? { label: m.type, color: 'text-gray-600' }
                    return (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatDateTime(m.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{(m.product as any)?.name}</p>
                          <p className="text-xs text-gray-400">{(m.user as any)?.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {['saida', 'ajuste_negativo'].includes(m.type) ? '-' : '+'}{m.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{m.quantity_before}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700">{m.quantity_after}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">
                          {m.reason ?? '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Form nova movimentação */}
        <div>
          <MovimentacaoForm products={products ?? []} suppliers={suppliers ?? []} />
        </div>
      </div>
    </div>
  )
}
