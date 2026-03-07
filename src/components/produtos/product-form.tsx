'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency, calcMargin } from '@/lib/utils'
import type { Product, Category, Brand } from '@/types/database'

const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'dz'] as const

interface Props {
  product?: Product | null
  categories: Category[]
  brands: Brand[]
}

export function ProductForm({ product, categories, brands }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isNew = !product

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    category_id: product?.category_id ?? '',
    brand_id: product?.brand_id ?? '',
    unit: product?.unit ?? 'un',
    cost_price: product?.cost_price ?? 0,
    sale_price: product?.sale_price ?? 0,
    stock_qty: product?.stock_qty ?? 0,
    min_stock: product?.min_stock ?? 5,
    expiry_date: product?.expiry_date ?? '',
    description: product?.description ?? '',
    active: product?.active ?? true,
  })

  const margin = calcMargin(form.cost_price, form.sale_price)

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Nome é obrigatório')
    if (form.sale_price <= 0) return toast.error('Preço de venda inválido')

    setLoading(true)

    const data = {
      ...form,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      sku: form.sku || null,
      barcode: form.barcode || null,
      expiry_date: form.expiry_date || null,
    }

    const { error } = isNew
      ? await supabase.from('products').insert(data)
      : await supabase.from('products').update(data).eq('id', product.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(isNew ? 'Produto cadastrado!' : 'Produto atualizado!')
      router.push('/produtos')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Informações básicas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Informações Básicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do produto *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              className="input-field w-full"
              placeholder="Ex: Arroz Tipo 1 5kg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras</label>
            <input value={form.barcode} onChange={e => set('barcode', e.target.value)} className="input-field w-full" placeholder="EAN-13" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código interno (SKU)</label>
            <input value={form.sku} onChange={e => set('sku', e.target.value)} className="input-field w-full" placeholder="Código interno" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="input-field w-full">
              <option value="">Selecionar...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <select value={form.brand_id} onChange={e => set('brand_id', e.target.value)} className="input-field w-full">
              <option value="">Selecionar...</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
            <select value={form.unit} onChange={e => set('unit', e.target.value)} className="input-field w-full">
              {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
            <input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} className="input-field w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="input-field w-full resize-none" placeholder="Descrição opcional" />
          </div>
        </div>
      </div>

      {/* Preços */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Preços</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço de custo (R$)</label>
            <input
              type="number" step="0.01" min="0"
              value={form.cost_price}
              onChange={e => set('cost_price', parseFloat(e.target.value) || 0)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço de venda (R$) *</label>
            <input
              type="number" step="0.01" min="0"
              value={form.sale_price}
              onChange={e => set('sale_price', parseFloat(e.target.value) || 0)}
              required
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Margem de lucro</label>
            <div className={`input-field w-full font-semibold ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
              {margin.toFixed(2)}% ({formatCurrency(form.sale_price - form.cost_price)})
            </div>
          </div>
        </div>
      </div>

      {/* Estoque */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Estoque</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estoque atual</label>
            <input
              type="number" step="0.001" min="0"
              value={form.stock_qty}
              onChange={e => set('stock_qty', parseFloat(e.target.value) || 0)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estoque mínimo (alerta)</label>
            <input
              type="number" step="0.001" min="0"
              value={form.min_stock}
              onChange={e => set('min_stock', parseFloat(e.target.value) || 0)}
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60">
          {loading ? 'Salvando...' : isNew ? 'Cadastrar Produto' : 'Salvar Alterações'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors">
          Cancelar
        </button>
        {!isNew && (
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-600">Ativo</label>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-green-600" />
          </div>
        )}
      </div>
    </form>
  )
}
