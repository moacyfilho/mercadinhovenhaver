'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Product, Supplier } from '@/types/database'

interface Props {
  products: Array<Pick<Product, 'id' | 'name' | 'unit' | 'stock_qty'>>
  suppliers: Array<Pick<Supplier, 'id' | 'trade_name'>>
}

const MOVEMENT_TYPES = [
  { value: 'entrada', label: 'Entrada de Mercadoria' },
  { value: 'ajuste_positivo', label: 'Ajuste + (acréscimo)' },
  { value: 'ajuste_negativo', label: 'Ajuste - (redução)' },
  { value: 'inventario', label: 'Inventário' },
]

export function MovimentacaoForm({ products, suppliers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    product_id: '',
    type: 'entrada',
    quantity: '',
    unit_cost: '',
    supplier_id: '',
    reason: '',
    notes: '',
  })

  const selected = products.find(p => p.id === form.product_id)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.product_id || !form.quantity) return toast.error('Preencha produto e quantidade')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const qty = parseFloat(form.quantity)
    const product = products.find(p => p.id === form.product_id)!
    const qtyBefore = product.stock_qty
    const qtyAfter = form.type === 'ajuste_negativo'
      ? qtyBefore - qty
      : qtyBefore + qty

    if (qtyAfter < 0) return toast.error('Estoque não pode ficar negativo')

    const { error } = await supabase.from('stock_movements').insert({
      product_id: form.product_id,
      user_id: user!.id,
      type: form.type as any,
      quantity: qty,
      quantity_before: qtyBefore,
      quantity_after: qtyAfter,
      unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null,
      total_cost: form.unit_cost ? qty * parseFloat(form.unit_cost) : null,
      supplier_id: form.supplier_id || null,
      reason: form.reason || null,
      notes: form.notes || null,
    })

    if (error) return toast.error(error.message)

    // Atualizar estoque do produto
    await supabase.from('products').update({ stock_qty: qtyAfter }).eq('id', form.product_id)

    toast.success('Movimentação registrada!')
    setForm({ product_id: '', type: 'entrada', quantity: '', unit_cost: '', supplier_id: '', reason: '', notes: '' })
    startTransition(() => router.refresh())
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Nova Movimentação</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Produto *</label>
          <select value={form.product_id} onChange={e => set('product_id', e.target.value)} required className="input-field w-full">
            <option value="">Selecionar...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (atual: {p.stock_qty} {p.unit})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo *</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className="input-field w-full">
            {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Quantidade * {selected && `(${selected.unit})`}
          </label>
          <input type="number" min="0.001" step="0.001" value={form.quantity}
            onChange={e => set('quantity', e.target.value)} required className="input-field w-full" />
        </div>

        {form.type === 'entrada' && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Custo unitário (R$)</label>
              <input type="number" min="0" step="0.01" value={form.unit_cost}
                onChange={e => set('unit_cost', e.target.value)} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Fornecedor</label>
              <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} className="input-field w-full">
                <option value="">Selecionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.trade_name}</option>)}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Motivo</label>
          <input value={form.reason} onChange={e => set('reason', e.target.value)}
            placeholder="Ex: Compra NF 1234" className="input-field w-full" />
        </div>

        <button type="submit" disabled={isPending}
          className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60">
          {isPending ? 'Salvando...' : 'Registrar Movimentação'}
        </button>
      </form>
    </div>
  )
}
