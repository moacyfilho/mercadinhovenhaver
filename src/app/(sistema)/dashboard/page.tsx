import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { PageHeader } from '@/components/shared/page-header'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, DollarSign, TrendingUp, Package, Users, CreditCard } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = new Date()
  const todayStart = startOfDay(today).toISOString()
  const todayEnd = endOfDay(today).toISOString()

  // Vendas do dia
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total, payment_method')
    .eq('status', 'finalizada')
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd)

  const totalHoje = todaySales?.reduce((sum, s) => sum + s.total, 0) ?? 0
  const countHoje = todaySales?.length ?? 0

  // Vendas do mês
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const { data: monthSales } = await supabase
    .from('sales')
    .select('total, subtotal, discount')
    .eq('status', 'finalizada')
    .gte('created_at', startOfMonth)

  const totalMes = monthSales?.reduce((sum, s) => sum + s.total, 0) ?? 0

  // Produtos com estoque baixo
  const { data: lowStock } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .lt('stock_qty', supabase.rpc as any)
    .order('stock_qty')
    .limit(20)

  // Query manual para low_stock
  const { data: lowStockProducts } = await supabase
    .from('products_with_margin')
    .select('*')
    .eq('low_stock', true)
    .eq('active', true)
    .order('stock_qty')
    .limit(10)

  // Contas a pagar vencendo em 7 dias
  const in7Days = new Date(today)
  in7Days.setDate(in7Days.getDate() + 7)
  const { data: dueSoonAccounts } = await supabase
    .from('accounts_payable')
    .select('*')
    .eq('status', 'pendente')
    .lte('due_date', in7Days.toISOString().split('T')[0])
    .order('due_date')

  // Contas a receber pendentes
  const { data: pendingReceivables } = await supabase
    .from('accounts_receivable')
    .select('amount')
    .eq('status', 'pendente')

  const totalReceber = pendingReceivables?.reduce((sum, a) => sum + a.amount, 0) ?? 0

  // Total clientes
  const { count: totalClientes } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  // Gráfico - últimos 7 dias
  const chartData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i)
      return supabase
        .from('sales')
        .select('total')
        .eq('status', 'finalizada')
        .gte('created_at', startOfDay(day).toISOString())
        .lte('created_at', endOfDay(day).toISOString())
        .then(({ data }) => ({
          label: format(day, 'EEE', { locale: ptBR }),
          total: data?.reduce((sum, s) => sum + s.total, 0) ?? 0,
        }))
    })
  )

  // Top produtos
  const { data: topItems } = await supabase
    .from('sale_items')
    .select('product_name, quantity')
    .gte('created_at', startOfMonth)
    .order('quantity', { ascending: false })
    .limit(100)

  const topProducts = Object.entries(
    (topItems ?? []).reduce((acc, item) => {
      acc[item.product_name] = (acc[item.product_name] ?? 0) + item.quantity
      return acc
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Vendas Hoje"
          value={formatCurrency(totalHoje)}
          subtitle={`${countHoje} venda${countHoje !== 1 ? 's' : ''}`}
          icon={ShoppingCart}
          color="green"
        />
        <KpiCard
          title="Faturamento Mês"
          value={formatCurrency(totalMes)}
          subtitle="mês atual"
          icon={DollarSign}
          color="blue"
        />
        <KpiCard
          title="A Receber"
          value={formatCurrency(totalReceber)}
          subtitle="valores pendentes"
          icon={TrendingUp}
          color="amber"
        />
        <KpiCard
          title="Clientes"
          value={String(totalClientes ?? 0)}
          subtitle="cadastrados ativos"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Gráfico + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <SalesChart data={chartData} />
        </div>
        <AlertsPanel
          lowStockProducts={lowStockProducts ?? []}
          dueSoonAccounts={dueSoonAccounts ?? []}
        />
      </div>

      {/* Top Produtos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Top Produtos do Mês</h3>
        {topProducts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Sem vendas registradas este mês.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map(([name, qty], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{name}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                    <div
                      className="h-1.5 bg-green-500 rounded-full"
                      style={{ width: `${Math.min(100, (qty / topProducts[0][1]) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600 ml-2">{qty.toFixed(0)} un</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
