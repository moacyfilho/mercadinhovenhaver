'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime, paymentLabel } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/status-badge'
import { Lock, BarChart2, X, ShoppingCart, TrendingDown } from 'lucide-react'

interface Register {
  id: string
  status: string
  opened_at: string
  closed_at: string | null
  initial_balance: number
  total_sales: number
  cash_sales: number
  pix_sales: number
  debit_sales: number
  credit_sales: number
  user: { name: string | null } | null
}

interface SaleDetail {
  payment_method: string
  count: number
  total: number
}

interface ProductDetail {
  product_name: string
  qty: number
  subtotal: number
}

export function CaixaClient({ registers }: { registers: Register[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [detail, setDetail] = useState<{
    register: Register
    sales: SaleDetail[]
    products: ProductDetail[]
    qtdVendas: number
  } | null>(null)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)

  async function handleClose(reg: Register) {
    if (!confirm('Confirmar fechamento do caixa?')) return
    const supabase = createClient()
    const { error } = await supabase
      .from('cash_registers')
      .update({ status: 'fechado', closed_at: new Date().toISOString() })
      .eq('id', reg.id)
    if (error) toast.error('Erro ao fechar caixa')
    else { toast.success('Caixa fechado!'); startTransition(() => router.refresh()) }
  }

  async function handleViewSales(reg: Register) {
    setLoadingDetail(reg.id)
    const supabase = createClient()

    const [{ data: salesRaw }, { data: itemsRaw }] = await Promise.all([
      supabase
        .from('sales')
        .select('payment_method, total')
        .eq('cash_register_id', reg.id)
        .eq('status', 'finalizada'),
      supabase
        .from('sale_items')
        .select('product_name, quantity, subtotal, sale:sales!inner(cash_register_id)')
        .eq('sale.cash_register_id', reg.id),
    ])

    // Agrupar por forma de pagamento
    const payMap: Record<string, { count: number; total: number }> = {}
    for (const s of salesRaw ?? []) {
      if (!payMap[s.payment_method]) payMap[s.payment_method] = { count: 0, total: 0 }
      payMap[s.payment_method].count++
      payMap[s.payment_method].total += s.total
    }
    const sales: SaleDetail[] = Object.entries(payMap).map(([payment_method, v]) => ({
      payment_method, ...v,
    }))

    // Agrupar por produto
    const prodMap: Record<string, { qty: number; subtotal: number }> = {}
    for (const it of itemsRaw ?? []) {
      if (!prodMap[it.product_name]) prodMap[it.product_name] = { qty: 0, subtotal: 0 }
      prodMap[it.product_name].qty += it.quantity
      prodMap[it.product_name].subtotal += it.subtotal
    }
    const products: ProductDetail[] = Object.entries(prodMap)
      .map(([product_name, v]) => ({ product_name, ...v }))
      .sort((a, b) => b.subtotal - a.subtotal)

    setDetail({ register: reg, sales, products, qtdVendas: salesRaw?.length ?? 0 })
    setLoadingDetail(null)
  }

  const open = registers.filter(r => r.status === 'aberto')

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Caixas abertos agora</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{open.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Vendas hoje (todos)</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(
              registers
                .filter(r => r.closed_at
                  ? new Date(r.closed_at).toDateString() === new Date().toDateString()
                  : r.status === 'aberto')
                .reduce((s, r) => s + r.total_sales, 0)
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-3 py-2 sm:px-4 sm:py-3">Operador</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Abertura</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Fechamento</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Fundo</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Dinheiro</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">PIX</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Cartão</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Total Vendas</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Status</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {registers.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-gray-800">{r.user?.name ?? '-'}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(r.opened_at)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs text-gray-500 whitespace-nowrap">{r.closed_at ? formatDateTime(r.closed_at) : '-'}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right text-gray-600">{formatCurrency(r.initial_balance)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right text-green-600 font-medium">{formatCurrency(r.cash_sales)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right text-blue-600 font-medium">{formatCurrency(r.pix_sales)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right text-purple-600 font-medium">{formatCurrency(r.debit_sales + r.credit_sales)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right font-bold text-gray-800">{formatCurrency(r.total_sales)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewSales(r)}
                        disabled={loadingDetail === r.id}
                        className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                      >
                        <BarChart2 size={12} />
                        {loadingDetail === r.id ? '...' : 'Vendas'}
                      </button>
                      {r.status === 'aberto' && (
                        <button
                          onClick={() => handleClose(r)}
                          disabled={isPending}
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                        >
                          <Lock size={12} /> Fechar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {registers.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-400">
                    Nenhum registro de caixa. Abra o caixa no PDV para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalhe do caixa */}
      {detail && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Relatório do Caixa</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {detail.register.user?.name ?? '-'} • Aberto em {formatDateTime(detail.register.opened_at)}
                  {detail.register.closed_at && ` • Fechado em ${formatDateTime(detail.register.closed_at)}`}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-600 mb-1">Total Vendas</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(detail.register.total_sales)}</p>
                  <p className="text-xs text-green-500">{detail.qtdVendas} venda(s)</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-600 mb-1">Fundo de Caixa</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(detail.register.initial_balance)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Total em Caixa</p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatCurrency(detail.register.initial_balance + detail.register.cash_sales)}
                  </p>
                  <p className="text-xs text-gray-400">fundo + dinheiro</p>
                </div>
              </div>

              {/* Por forma de pagamento */}
              {detail.sales.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                    <TrendingDown size={15} className="text-green-600" /> Por Forma de Pagamento
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {detail.sales.map(s => (
                      <div key={s.payment_method} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">{paymentLabel(s.payment_method)}</p>
                        <p className="font-bold text-gray-800">{formatCurrency(s.total)}</p>
                        <p className="text-xs text-gray-400">{s.count} venda(s)</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relação de produtos */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                  <ShoppingCart size={15} className="text-blue-600" /> Produtos Vendidos
                </h3>
                {detail.products.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Nenhuma venda registrada</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                          <th className="px-4 py-2 text-left">Produto</th>
                          <th className="px-4 py-2 text-right">Qtd</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {detail.products.map(p => (
                          <tr key={p.product_name} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-800">{p.product_name}</td>
                            <td className="px-4 py-2 text-right text-gray-500">
                              {p.qty % 1 === 0 ? p.qty.toFixed(0) : p.qty.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-gray-800">{formatCurrency(p.subtotal)}</td>
                          </tr>
                        ))}
                        <tr className="bg-green-50 font-semibold">
                          <td className="px-4 py-2 text-green-800">Total</td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2 text-right text-green-700">
                            {formatCurrency(detail.products.reduce((s, p) => s + p.subtotal, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
