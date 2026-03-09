'use client'

import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, paymentLabel } from '@/lib/utils'
import {
  BarChart3, TrendingUp, DollarSign, Users, Printer,
  AlertTriangle, Package, ShoppingCart, TrendingDown,
  CreditCard, Calendar,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface VendasData {
  salesByDay: { date: string; count: number; total: number; dinheiro: number; pix: number; debito: number; credito: number; fiado: number; desconto: number }[]
  totalMes: number
  qtdVendas: number
  ticketMedio: number
  lucroEstimado: number
  margemPct: number
  totalDesconto: number
  byPayment: Record<string, number>
  topProducts: [string, { qty: number; revenue: number; cost: number }][]
}

interface FinanceiroData {
  pagar: any[]
  receber: any[]
  pagarPendente: number
  pagarVencido: number
  receberPendente: number
  receberVencido: number
}

interface EstoqueData {
  products: any[]
  totalValue: number
  lowStockCount: number
  zeroStockCount: number
}

interface Props {
  tipo: string
  de: string
  ate: string
  vendasData: VendasData | null
  financeiroData: FinanceiroData | null
  estoqueData: EstoqueData | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'vendas',     label: 'Vendas',     icon: ShoppingCart },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'estoque',    label: 'Estoque',    icon: Package },
]

const paymentColors: Record<string, string> = {
  dinheiro: 'bg-green-100 text-green-800 border-green-200',
  pix:      'bg-blue-100 text-blue-800 border-blue-200',
  debito:   'bg-purple-100 text-purple-800 border-purple-200',
  credito:  'bg-pink-100 text-pink-800 border-pink-200',
  fiado:    'bg-red-100 text-red-800 border-red-200',
}

function StatusBadgeInline({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    pago: 'bg-green-100 text-green-700',
    vencido: 'bg-red-100 text-red-700',
  }
  const label: Record<string, string> = {
    pendente: 'Pendente', pago: 'Pago', vencido: 'Vencido',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label[status] ?? status}
    </span>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function RelatoriosClient({ tipo, de, ate, vendasData, financeiroData, estoqueData }: Props) {
  const router = useRouter()

  const goTo = (params: Record<string, string>) => {
    const p = new URLSearchParams({ tipo, de, ate, ...params })
    router.push(`/relatorios?${p.toString()}`)
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 print:mb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Relatórios</h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors print:hidden"
        >
          <Printer size={14} /> <span className="hidden sm:inline">Exportar</span> PDF
        </button>
      </div>

      {/* ── Abas ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4 print:hidden">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => goTo({ tipo: tab.id })}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                tipo === tab.id
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Aba Vendas ── */}
      {tipo === 'vendas' && vendasData && (
        <AbaVendas data={vendasData} de={de} ate={ate} goTo={goTo} />
      )}

      {/* ── Aba Financeiro ── */}
      {tipo === 'financeiro' && financeiroData && (
        <AbaFinanceiro data={financeiroData} de={de} ate={ate} goTo={goTo} />
      )}

      {/* ── Aba Estoque ── */}
      {tipo === 'estoque' && estoqueData && (
        <AbaEstoque data={estoqueData} />
      )}
    </div>
  )
}

// ─── Aba Vendas ───────────────────────────────────────────────────────────────

function AbaVendas({ data, de, ate, goTo }: { data: VendasData; de: string; ate: string; goTo: (p: Record<string, string>) => void }) {
  const { salesByDay, totalMes, qtdVendas, ticketMedio, lucroEstimado, margemPct, totalDesconto, byPayment, topProducts } = data

  const chartData = salesByDay.map(d => ({
    label: format(parseISO(d.date), 'dd/MM'),
    total: d.total,
  }))

  return (
    <div>
      {/* Filtro de data */}
      <div className="flex flex-wrap items-center gap-3 mb-5 print:hidden">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">De</span>
          <input
            type="date"
            value={de}
            onChange={e => goTo({ de: e.target.value })}
            className="text-sm font-medium text-gray-700 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Até</span>
          <input
            type="date"
            value={ate}
            onChange={e => goTo({ ate: e.target.value })}
            className="text-sm font-medium text-gray-700 outline-none"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Faturamento', value: formatCurrency(totalMes), sub: `${qtdVendas} venda${qtdVendas !== 1 ? 's' : ''}`, color: 'text-green-700', icon: DollarSign, bg: 'bg-green-100' },
          { label: 'Lucro Estimado', value: formatCurrency(lucroEstimado), sub: `margem ${margemPct.toFixed(1)}%`, color: 'text-blue-700', icon: TrendingUp, bg: 'bg-blue-100' },
          { label: 'Ticket Médio', value: formatCurrency(ticketMedio), sub: 'por venda', color: 'text-purple-700', icon: CreditCard, bg: 'bg-purple-100' },
          { label: 'Descontos', value: formatCurrency(totalDesconto), sub: 'total concedido', color: 'text-red-600', icon: TrendingDown, bg: 'bg-red-100' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon size={15} className={k.color} />
              </div>
              <p className="text-sm text-gray-500">{k.label}</p>
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico + Tabela por dia */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        {/* Gráfico */}
        {chartData.length > 0 && (
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={17} className="text-green-600" /> Vendas por Dia
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 2, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `R$${v}`} width={58} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Vendas']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Formas de pagamento */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Forma de Pagamento</h3>
          <div className="space-y-3">
            {(['dinheiro', 'pix', 'debito', 'credito', 'fiado'] as const).map(m => {
              const v = byPayment[m] ?? 0
              const pct = totalMes > 0 ? (v / totalMes) * 100 : 0
              return (
                <div key={m}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{paymentLabel(m)}</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(v)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}%</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabela por dia */}
      {salesByDay.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Detalhamento por Dia</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2 text-center">Vendas</th>
                  <th className="px-4 py-2 text-right">Dinheiro</th>
                  <th className="px-4 py-2 text-right">PIX</th>
                  <th className="px-4 py-2 text-right">Cartão</th>
                  <th className="px-4 py-2 text-right">Fiado</th>
                  <th className="px-4 py-2 text-right">Desconto</th>
                  <th className="px-4 py-2 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salesByDay.map(d => (
                  <tr key={d.date} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-700">
                      {format(parseISO(d.date), "dd/MM/yyyy (EEE)", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-500">{d.count}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(d.dinheiro)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(d.pix)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(d.debito + d.credito)}</td>
                    <td className="px-4 py-2.5 text-right text-red-500">{formatCurrency(d.fiado)}</td>
                    <td className="px-4 py-2.5 text-right text-red-400">-{formatCurrency(d.desconto)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-green-700">{formatCurrency(d.total)}</td>
                  </tr>
                ))}
                {/* Total geral */}
                <tr className="bg-green-50 font-semibold">
                  <td className="px-4 py-2.5 text-green-800">Total</td>
                  <td className="px-4 py-2.5 text-center text-green-700">{qtdVendas}</td>
                  <td className="px-4 py-2.5 text-right text-green-700">{formatCurrency(byPayment.dinheiro ?? 0)}</td>
                  <td className="px-4 py-2.5 text-right text-green-700">{formatCurrency(byPayment.pix ?? 0)}</td>
                  <td className="px-4 py-2.5 text-right text-green-700">{formatCurrency((byPayment.debito ?? 0) + (byPayment.credito ?? 0))}</td>
                  <td className="px-4 py-2.5 text-right text-red-600">{formatCurrency(byPayment.fiado ?? 0)}</td>
                  <td className="px-4 py-2.5 text-right text-red-500">-{formatCurrency(totalDesconto)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-green-800">{formatCurrency(totalMes)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top produtos */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={17} className="text-blue-600" /> Top Produtos
          </h3>
          <div className="space-y-3">
            {topProducts.map(([name, d], i) => {
              const pct = topProducts[0][1].revenue > 0 ? (d.revenue / topProducts[0][1].revenue) * 100 : 0
              const lucro = d.revenue - d.cost
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="font-medium text-gray-700 truncate">{name}</span>
                      <span className="font-bold text-gray-800 ml-2 flex-shrink-0">{formatCurrency(d.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.qty % 1 === 0 ? d.qty.toFixed(0) : d.qty.toFixed(2)} un &bull;{' '}
                      lucro: <span className={lucro >= 0 ? 'text-green-600' : 'text-red-500'}>{formatCurrency(lucro)}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {salesByDay.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          Nenhuma venda no período selecionado.
        </div>
      )}
    </div>
  )
}

// ─── Aba Financeiro ───────────────────────────────────────────────────────────

function AbaFinanceiro({ data, de, ate, goTo }: { data: FinanceiroData; de: string; ate: string; goTo: (p: Record<string, string>) => void }) {
  const { pagar, receber, pagarPendente, pagarVencido, receberPendente, receberVencido } = data

  return (
    <div>
      {/* Filtro de data (vencimento) */}
      <div className="flex flex-wrap items-center gap-3 mb-5 print:hidden">
        <p className="text-sm text-gray-500 font-medium">Vencimento entre:</p>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">De</span>
          <input
            type="date"
            value={de}
            onChange={e => goTo({ de: e.target.value })}
            className="text-sm font-medium text-gray-700 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Até</span>
          <input
            type="date"
            value={ate}
            onChange={e => goTo({ ate: e.target.value })}
            className="text-sm font-medium text-gray-700 outline-none"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingDown size={15} className="text-amber-700" />
            </div>
            <p className="text-sm text-amber-600">A Pagar</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(pagarPendente)}</p>
          <p className="text-xs text-amber-500 mt-0.5">{pagar.filter(a => a.status === 'pendente').length} conta(s) pendente(s)</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle size={15} className="text-red-600" />
            </div>
            <p className="text-sm text-red-500">Vencido (Pagar)</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(pagarVencido)}</p>
          <p className="text-xs text-red-400 mt-0.5">{pagar.filter(a => a.status === 'vencido').length} conta(s)</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={15} className="text-green-700" />
            </div>
            <p className="text-sm text-green-600">A Receber</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(receberPendente)}</p>
          <p className="text-xs text-green-500 mt-0.5">{receber.filter(a => a.status === 'pendente').length} conta(s) pendente(s)</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle size={15} className="text-red-600" />
            </div>
            <p className="text-sm text-red-500">Vencido (Receber)</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(receberVencido)}</p>
          <p className="text-xs text-red-400 mt-0.5">{receber.filter(a => a.status === 'vencido').length} conta(s)</p>
        </div>
      </div>

      {/* Contas a Pagar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <TrendingDown size={16} className="text-amber-500" />
          <h3 className="font-semibold text-gray-800">Contas a Pagar</h3>
          <span className="ml-auto text-sm text-gray-400">{pagar.length} registro(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Categoria</th>
                <th className="px-4 py-2">Fornecedor</th>
                <th className="px-4 py-2">Vencimento</th>
                <th className="px-4 py-2 text-right">Valor</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagar.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhuma conta cadastrada</td></tr>
              ) : pagar.map((a, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${a.status === 'vencido' ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[180px] truncate">{a.description}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{a.category ?? '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{a.supplier?.trade_name ?? '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{formatDate(a.due_date)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-800">{formatCurrency(a.amount)}</td>
                  <td className="px-4 py-2.5"><StatusBadgeInline status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contas a Receber */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-500" />
          <h3 className="font-semibold text-gray-800">Contas a Receber</h3>
          <span className="ml-auto text-sm text-gray-400">{receber.length} registro(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Vencimento</th>
                <th className="px-4 py-2 text-right">Valor</th>
                <th className="px-4 py-2 text-right">Pago</th>
                <th className="px-4 py-2 text-right">Saldo</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {receber.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma conta a receber</td></tr>
              ) : receber.map((a, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${a.status === 'vencido' ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{a.description}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{a.customer?.name ?? '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{formatDate(a.due_date)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(a.amount)}</td>
                  <td className="px-4 py-2.5 text-right text-green-600 font-medium">{formatCurrency(a.paid_amount)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-800">{formatCurrency(a.amount - a.paid_amount)}</td>
                  <td className="px-4 py-2.5"><StatusBadgeInline status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Aba Estoque ──────────────────────────────────────────────────────────────

function AbaEstoque({ data }: { data: EstoqueData }) {
  const { products, totalValue, lowStockCount, zeroStockCount } = data

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Package size={15} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">Produtos</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{products.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">itens ativos</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign size={15} className="text-blue-700" />
            </div>
            <p className="text-sm text-blue-600">Valor em Estoque</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-blue-400 mt-0.5">preço de custo</p>
        </div>
        <div className={`rounded-xl border shadow-sm p-4 ${lowStockCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <AlertTriangle size={15} className={lowStockCount > 0 ? 'text-amber-700' : 'text-gray-500'} />
            </div>
            <p className={`text-sm ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-500'}`}>Estoque Baixo</p>
          </div>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-700' : 'text-gray-800'}`}>{lowStockCount}</p>
          <p className={`text-xs mt-0.5 ${lowStockCount > 0 ? 'text-amber-500' : 'text-gray-400'}`}>abaixo do mínimo</p>
        </div>
        <div className={`rounded-xl border shadow-sm p-4 ${zeroStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${zeroStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <Package size={15} className={zeroStockCount > 0 ? 'text-red-600' : 'text-gray-500'} />
            </div>
            <p className={`text-sm ${zeroStockCount > 0 ? 'text-red-500' : 'text-gray-500'}`}>Sem Estoque</p>
          </div>
          <p className={`text-2xl font-bold ${zeroStockCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>{zeroStockCount}</p>
          <p className={`text-xs mt-0.5 ${zeroStockCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>produtos zerados</p>
        </div>
      </div>

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
                <th className="px-4 py-3 text-right">Custo Un.</th>
                <th className="px-4 py-3 text-right">Venda Un.</th>
                <th className="px-4 py-3 text-right">Margem</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p, i) => {
                const isLow = p.low_stock
                const isZero = p.stock_qty <= 0
                return (
                  <tr key={i} className={`hover:bg-gray-50 ${isZero ? 'bg-red-50/40' : isLow ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isLow && <AlertTriangle size={13} className={isZero ? 'text-red-500' : 'text-amber-500'} />}
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </div>
                      {p.barcode && <p className="text-xs text-gray-400 font-mono">{p.barcode}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{p.category_name ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-semibold ${isZero ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700'}`}>
                        {p.stock_qty} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{p.min_stock} {p.unit}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(p.cost_price)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{formatCurrency(p.sale_price)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-xs font-semibold text-blue-600">
                        {p.margin_percent != null ? `${Number(p.margin_percent).toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                      {formatCurrency(p.cost_price * p.stock_qty)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {isZero ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Zerado</span>
                      ) : isLow ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Baixo</span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">OK</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Rodapé */}
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={7} className="px-4 py-2.5 text-gray-600">Total em estoque (custo)</td>
                <td className="px-4 py-2.5 text-right font-bold text-blue-700">{formatCurrency(totalValue)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
