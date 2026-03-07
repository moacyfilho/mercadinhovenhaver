'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/status-badge'
import { Edit, Trash2, Search, AlertTriangle } from 'lucide-react'
import type { Product, Category, Brand } from '@/types/database'

interface Props {
  products: Product[]
  categories: Category[]
  brands: Brand[]
}

export function ProductTable({ products, categories, brands }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || p.category_id === categoryFilter
    return matchSearch && matchCategory
  })

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deseja desativar o produto "${name}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ active: false }).eq('id', id)
    if (error) toast.error('Erro ao desativar produto')
    else {
      toast.success('Produto desativado')
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Filtros */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, código ou barras..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todas as categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Custo</th>
              <th className="px-4 py-3 text-right">Venda</th>
              <th className="px-4 py-3 text-right">Margem</th>
              <th className="px-4 py-3 text-right">Estoque</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-400">
                  Nenhum produto encontrado
                </td>
              </tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.low_stock && (
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" title="Estoque baixo" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      {p.brand_name && <p className="text-xs text-gray-400">{p.brand_name}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {p.barcode ?? p.sku ?? '-'}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category_name ?? '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(p.cost_price)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(p.sale_price)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${(p.margin_percent ?? 0) >= 20 ? 'text-green-600' : 'text-amber-600'}`}>
                    {(p.margin_percent ?? 0).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={p.low_stock ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {p.stock_qty} {p.unit}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.active ? 'ativo' : 'inativo'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      href={`/produtos/${p.id}`}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    >
                      <Edit size={15} />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        {filtered.length} de {products.length} produtos
      </div>
    </div>
  )
}
