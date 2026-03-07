import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatQuantity } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle, TrendingDown, Package } from 'lucide-react'

export default async function EstoquePage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products_with_margin')
    .select('*')
    .eq('active', true)
    .order('name')

  const lowStock = products?.filter(p => p.low_stock) ?? []
  const totalValue = products?.reduce((sum, p) => sum + p.cost_price * p.stock_qty, 0) ?? 0

  return (
    <div>
      <PageHeader
        title="Controle de Estoque"
        description="Visão geral do estoque"
        action={
          <Link href="/estoque/movimentacoes"
            className="text-sm text-blue-600 hover:underline font-medium">
            Ver movimentações →
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total de produtos</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{products?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Valor em estoque</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm p-4">
          <p className="text-sm text-amber-600 flex items-center gap-1">
            <AlertTriangle size={14} /> Estoque baixo
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{lowStock.length}</p>
        </div>
      </div>

      {/* Alerta estoque baixo */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
            <AlertTriangle size={14} /> Produtos com estoque abaixo do mínimo
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-lg">
                {p.name} ({p.stock_qty} {p.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Estoque</th>
                <th className="px-4 py-3 text-right">Mínimo</th>
                <th className="px-4 py-3 text-right">Custo Unit.</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(products ?? []).map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.low_stock && <AlertTriangle size={14} className="text-amber-500" />}
                      <div>
                        <p className="font-medium text-gray-800">{p.name}</p>
                        {p.barcode && <p className="text-xs text-gray-400 font-mono">{p.barcode}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category_name ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={p.low_stock ? 'text-red-600 font-bold' : 'text-gray-700'}>
                      {p.stock_qty} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.min_stock} {p.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(p.cost_price)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {formatCurrency(p.cost_price * p.stock_qty)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.low_stock ? 'vencido' : 'ativo'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
