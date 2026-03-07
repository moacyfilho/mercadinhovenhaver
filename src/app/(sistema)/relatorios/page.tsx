import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { formatCurrency, paymentLabel } from '@/lib/utils'
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const today = new Date()
  const monthStart = startOfMonth(today).toISOString()
  const monthEnd = endOfMonth(today).toISOString()

  // Vendas do mês por forma de pagamento
  const { data: salesByPayment } = await supabase
    .from('sales')
    .select('payment_method, total, subtotal, discount')
    .eq('status', 'finalizada')
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd)

  const byPayment = (salesByPayment ?? []).reduce((acc, s) => {
    acc[s.payment_method] = (acc[s.payment_method] ?? 0) + s.total
    return acc
  }, {} as Record<string, number>)

  const totalMes = Object.values(byPayment).reduce((sum, v) => sum + v, 0)
  const totalDesconto = (salesByPayment ?? []).reduce((sum, s) => sum + s.discount, 0)

  // Top produtos do mês
  const { data: topItems } = await supabase
    .from('sale_items')
    .select('product_name, quantity, subtotal, cost_price')
    .gte('created_at', monthStart)

  const productMap = (topItems ?? []).reduce((acc, item) => {
    if (!acc[item.product_name]) acc[item.product_name] = { qty: 0, revenue: 0, cost: 0 }
    acc[item.product_name].qty += item.quantity
    acc[item.product_name].revenue += item.subtotal
    acc[item.product_name].cost += item.cost_price * item.quantity
    return acc
  }, {} as Record<string, { qty: number; revenue: number; cost: number }>)

  const topProducts = Object.entries(productMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)

  // Lucro estimado
  const lucroEstimado = Object.values(productMap).reduce((sum, p) => sum + (p.revenue - p.cost), 0)

  // Clientes inadimplentes
  const { data: debtors } = await supabase
    .from('customers')
    .select('name, current_debt, credit_limit, phone')
    .gt('current_debt', 0)
    .order('current_debt', { ascending: false })
    .limit(10)

  const totalInadimplente = (debtors ?? []).reduce((sum, c) => sum + c.current_debt, 0)

  // Estoque baixo
  const { data: lowStock } = await supabase
    .from('products_with_margin')
    .select('name, stock_qty, min_stock, unit, cost_price')
    .eq('low_stock', true)
    .eq('active', true)
    .order('stock_qty')

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description={`Período: ${format(today, 'MMMM yyyy', { locale: ptBR })}`}
      />

      {/* KPIs do mês */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-green-600" />
            <p className="text-sm text-gray-500">Faturamento Mês</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalMes)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-blue-600" />
            <p className="text-sm text-gray-500">Lucro Estimado</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(lucroEstimado)}</p>
          <p className="text-xs text-gray-400">
            {totalMes > 0 ? ((lucroEstimado / totalMes) * 100).toFixed(1) : 0}% de margem
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-red-500" />
            <p className="text-sm text-gray-500">Fiado em Aberto</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalInadimplente)}</p>
          <p className="text-xs text-gray-400">{(debtors ?? []).length} cliente(s)</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-amber-600" />
            <p className="text-sm text-amber-600">Estoque Baixo</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{(lowStock ?? []).length}</p>
          <p className="text-xs text-amber-500">produto(s)</p>
        </div>
      </div>

      {/* Vendas por forma de pagamento */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
        <h3 className="font-semibold text-gray-800 mb-4">Faturamento por Forma de Pagamento</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {['dinheiro', 'pix', 'debito', 'credito', 'fiado'].map(method => {
            const value = byPayment[method] ?? 0
            const pct = totalMes > 0 ? (value / totalMes) * 100 : 0
            return (
              <div key={method} className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">{paymentLabel(method)}</p>
                <p className="font-bold text-gray-800">{formatCurrency(value)}</p>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                  <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}%</p>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Descontos concedidos: <span className="font-semibold text-red-500">{formatCurrency(totalDesconto)}</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500 mr-2">Total faturado:</span>
            <span className="text-xl font-bold text-green-700">{formatCurrency(totalMes)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Produtos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-600" />
            Top 10 Produtos — Receita do Mês
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Sem vendas no período</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map(([name, data], i) => {
                const pct = (data.revenue / topProducts[0][1].revenue) * 100
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 truncate">{name}</span>
                        <span className="font-bold text-gray-800 ml-2 flex-shrink-0">{formatCurrency(data.revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{data.qty.toFixed(0)} un • lucro: {formatCurrency(data.revenue - data.cost)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Clientes com Fiado */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-red-500" />
              Clientes com Fiado em Aberto
            </h3>
            {(debtors ?? []).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum cliente inadimplente ✅</p>
            ) : (
              <div className="space-y-2">
                {(debtors ?? []).map(c => (
                  <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{c.name}</p>
                        {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-sm">{formatCurrency(c.current_debt)}</p>
                      <p className="text-xs text-gray-400">limite: {formatCurrency(c.credit_limit)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estoque Baixo */}
          {(lowStock ?? []).length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
              <h3 className="font-semibold text-amber-700 mb-3 text-sm">Produtos com Estoque Baixo</h3>
              <div className="space-y-1.5">
                {(lowStock ?? []).slice(0, 8).map(p => (
                  <div key={p.name} className="flex justify-between text-xs">
                    <span className="text-gray-700 truncate max-w-[160px]">{p.name}</span>
                    <span className="text-amber-700 font-semibold ml-2">
                      {p.stock_qty} / {p.min_stock} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
