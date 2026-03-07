import Link from 'next/link'
import { AlertTriangle, Package, CreditCard, TrendingDown } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Product, AccountPayable } from '@/types/database'

interface AlertsPanelProps {
  lowStockProducts: Product[]
  dueSoonAccounts: AccountPayable[]
}

export function AlertsPanel({ lowStockProducts, dueSoonAccounts }: AlertsPanelProps) {
  const total = lowStockProducts.length + dueSoonAccounts.length

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Alertas</h3>
        {total > 0 && (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {total}
          </span>
        )}
      </div>

      {total === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">Nenhum alerta. Tudo em ordem! ✅</p>
      )}

      {/* Estoque baixo */}
      {lowStockProducts.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Package size={12} /> Estoque Baixo
          </p>
          <div className="space-y-2">
            {lowStockProducts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate max-w-[180px]">{p.name}</span>
                <span className="text-amber-600 font-medium ml-2 whitespace-nowrap">
                  {p.stock_qty} {p.unit}
                </span>
              </div>
            ))}
            {lowStockProducts.length > 5 && (
              <Link href="/estoque" className="text-xs text-blue-600 hover:underline">
                + {lowStockProducts.length - 5} produtos
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Contas vencendo */}
      {dueSoonAccounts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <TrendingDown size={12} /> Contas a Vencer
          </p>
          <div className="space-y-2">
            {dueSoonAccounts.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate max-w-[160px]">{a.description}</span>
                <div className="text-right ml-2">
                  <p className="text-red-600 font-medium">{formatCurrency(a.amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(a.due_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
