'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Plus, Trash2, CheckCircle, FileText, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, X, Package } from 'lucide-react'
import type { Product, Supplier } from '@/types/database'

type MovType = 'entrada' | 'saida' | 'ajuste'

interface NoteItem {
  product_id: string
  product_name: string
  unit: string
  stock_qty: number
  quantity: string
  unit_cost: string
}

interface Props {
  products: Array<Pick<Product, 'id' | 'name' | 'unit' | 'stock_qty' | 'cost_price'>>
  suppliers: Array<Pick<Supplier, 'id' | 'trade_name'>>
  pendingNotes: any[]
  recentMovements: any[]
}

const typeConfig: Record<MovType, { label: string; icon: typeof ArrowDownCircle; color: string; bg: string }> = {
  entrada: { label: 'Entrada no Estoque (Adicionar)', icon: ArrowDownCircle, color: 'text-green-700', bg: 'bg-green-700' },
  saida: { label: 'Saída no Estoque (Diminuir)', icon: ArrowUpCircle, color: 'text-red-700', bg: 'bg-red-700' },
  ajuste: { label: 'Ajuste de Estoque (Alterar)', icon: SlidersHorizontal, color: 'text-blue-700', bg: 'bg-blue-700' },
}

const typeLabels: Record<string, { label: string; color: string }> = {
  entrada: { label: 'Entrada', color: 'text-green-600 bg-green-50' },
  saida: { label: 'Saída', color: 'text-red-600 bg-red-50' },
  ajuste_positivo: { label: 'Ajuste +', color: 'text-blue-600 bg-blue-50' },
  ajuste_negativo: { label: 'Ajuste -', color: 'text-amber-600 bg-amber-50' },
  ajuste: { label: 'Ajuste', color: 'text-blue-600 bg-blue-50' },
  inventario: { label: 'Inventário', color: 'text-purple-600 bg-purple-50' },
}

export function MovimentacoesClient({ products, suppliers, pendingNotes, recentMovements }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const [movType, setMovType] = useState<MovType>('entrada')
  const [supplierId, setSupplierId] = useState('')
  const [noteNumber, setNoteNumber] = useState('')
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0])
  const [observations, setObservations] = useState('')
  const [items, setItems] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(false)

  // Item being added
  const [addProductId, setAddProductId] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addCost, setAddCost] = useState('')

  // Expanded pending note
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [noteItems, setNoteItems] = useState<any[]>([])

  function addItem() {
    if (!addProductId || !addQty) return toast.error('Selecione o produto e informe a quantidade')
    const product = products.find(p => p.id === addProductId)
    if (!product) return
    if (items.find(i => i.product_id === addProductId)) return toast.error('Produto já adicionado — altere a linha existente')

    setItems(prev => [...prev, {
      product_id: addProductId,
      product_name: product.name,
      unit: product.unit,
      stock_qty: product.stock_qty,
      quantity: addQty,
      unit_cost: addCost || String(product.cost_price ?? 0),
    }])
    setAddProductId('')
    setAddQty('')
    setAddCost('')
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }

  function updateItem(productId: string, field: 'quantity' | 'unit_cost', value: string) {
    setItems(prev => prev.map(i => i.product_id === productId ? { ...i, [field]: value } : i))
  }

  async function handleFinalize() {
    if (items.length === 0) return toast.error('Adicione pelo menos um produto')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    // Criar nota
    const { data: note, error: noteError } = await (supabase as any).from('stock_notes').insert({
      type: movType,
      supplier_id: supplierId || null,
      note_number: noteNumber || null,
      note_date: noteDate,
      observations: observations || null,
      status: 'finalizado',
      user_id: user?.id,
      total_items: items.length,
      finalized_at: new Date().toISOString(),
    }).select().single()

    if (noteError) { toast.error('Erro ao criar nota'); setLoading(false); return }

    // Inserir itens da nota
    await (supabase as any).from('stock_note_items').insert(
      items.map(i => ({
        note_id: note.id,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: parseFloat(i.quantity),
        unit_cost: parseFloat(i.unit_cost) || 0,
      }))
    )

    // Atualizar estoque e criar movimentações
    for (const item of items) {
      const qty = parseFloat(item.quantity)
      const product = products.find(p => p.id === item.product_id)!
      const qtyBefore = product.stock_qty
      let qtyAfter: number

      if (movType === 'entrada') qtyAfter = qtyBefore + qty
      else if (movType === 'saida') qtyAfter = Math.max(0, qtyBefore - qty)
      else qtyAfter = qty // ajuste: define o valor exato

      await supabase.from('stock_movements').insert({
        product_id: item.product_id,
        user_id: user?.id,
        type: movType === 'ajuste' ? (qty >= qtyBefore ? 'ajuste_positivo' : 'ajuste_negativo') : movType,
        quantity: movType === 'ajuste' ? Math.abs(qty - qtyBefore) : qty,
        quantity_before: qtyBefore,
        quantity_after: qtyAfter,
        unit_cost: parseFloat(item.unit_cost) || null,
        total_cost: parseFloat(item.unit_cost) ? qty * parseFloat(item.unit_cost) : null,
        supplier_id: supplierId || null,
        reason: noteNumber ? `Nota ${noteNumber}` : null,
      } as any)

      await (supabase as any).from('products').update({ stock_qty: qtyAfter }).eq('id', item.product_id)
    }

    toast.success(`${items.length} produto(s) ${movType === 'entrada' ? 'adicionados' : movType === 'saida' ? 'baixados' : 'ajustados'} com sucesso!`)
    setItems([])
    setSupplierId('')
    setNoteNumber('')
    setObservations('')
    setLoading(false)
    startTransition(() => router.refresh())
  }

  async function loadNoteItems(noteId: string) {
    if (expandedNote === noteId) { setExpandedNote(null); return }
    const { data } = await (supabase as any).from('stock_note_items').select('*, product:products(name, unit)').eq('note_id', noteId)
    setNoteItems(data ?? [])
    setExpandedNote(noteId)
  }

  async function cancelNote(noteId: string) {
    if (!confirm('Cancelar esta nota em andamento?')) return
    await (supabase as any).from('stock_notes').update({ status: 'cancelado' }).eq('id', noteId)
    toast.success('Nota cancelada')
    startTransition(() => router.refresh())
  }

  const selectedProduct = products.find(p => p.id === addProductId)

  return (
    <div className="space-y-6">
      {/* ── Seletor de tipo ── */}
      <div className="bg-red-700 rounded-xl p-1 flex gap-1">
        {(Object.entries(typeConfig) as [MovType, typeof typeConfig[MovType]][]).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => setMovType(type)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              movType === type ? 'bg-white text-gray-800 shadow-sm' : 'text-red-100 hover:bg-red-600'
            }`}
          >
            <cfg.icon size={16} />
            <span className="hidden sm:inline">{cfg.label}</span>
            <span className="sm:hidden">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Formulário da nota ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Cabeçalho da nota */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-gray-500" />
              Dados da Nota
              <span className="text-xs text-gray-400 font-normal">(Nota sem XML)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {movType === 'entrada' && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Fornecedor</label>
                  <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="input-field w-full">
                    <option value="">Selecionar...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.trade_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nº da Nota</label>
                <input value={noteNumber} onChange={e => setNoteNumber(e.target.value)}
                  placeholder="Ex: 001234" className="input-field w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data</label>
                <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)} className="input-field w-full" />
              </div>
              <div className={movType === 'entrada' ? 'sm:col-span-2 lg:col-span-4' : 'sm:col-span-2 lg:col-span-2'}>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Observações</label>
                <input value={observations} onChange={e => setObservations(e.target.value)}
                  placeholder="Opcional" className="input-field w-full" />
              </div>
            </div>
          </div>

          {/* Adicionar produto */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={16} className="text-gray-500" />
              Adicionar Produto
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Produto *</label>
                <select value={addProductId} onChange={e => {
                  setAddProductId(e.target.value)
                  const p = products.find(pr => pr.id === e.target.value)
                  if (p) setAddCost(String(p.cost_price ?? 0))
                }} className="input-field w-full">
                  <option value="">Selecionar...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — estoque: {p.stock_qty} {p.unit}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Qtd {selectedProduct && `(${selectedProduct.unit})`}
                  {movType === 'ajuste' && <span className="text-blue-600"> = novo valor</span>}
                </label>
                <input type="number" min="0.001" step="0.001" value={addQty}
                  onChange={e => setAddQty(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  className="input-field w-full" />
              </div>
              {movType === 'entrada' && (
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Custo Unit. (R$)</label>
                  <input type="number" min="0" step="0.01" value={addCost}
                    onChange={e => setAddCost(e.target.value)}
                    className="input-field w-full" />
                </div>
              )}
              <div className={`${movType === 'entrada' ? 'sm:col-span-2' : 'sm:col-span-3'}`}>
                <button onClick={addItem}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1">
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de itens */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{items.length} produto(s) adicionado(s)</h3>
                {movType === 'entrada' && (
                  <p className="text-sm text-gray-500">
                    Total: <strong className="text-gray-800">
                      {formatCurrency(items.reduce((s, i) => s + parseFloat(i.quantity || '0') * parseFloat(i.unit_cost || '0'), 0))}
                    </strong>
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Produto</th>
                      <th className="px-4 py-2 text-right">Estoque Atual</th>
                      <th className="px-4 py-2 text-right w-28">
                        {movType === 'ajuste' ? 'Novo Estoque' : 'Quantidade'}
                      </th>
                      {movType === 'entrada' && <th className="px-4 py-2 text-right w-32">Custo Unit.</th>}
                      {movType === 'entrada' && <th className="px-4 py-2 text-right">Subtotal</th>}
                      <th className="px-2 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map(item => (
                      <tr key={item.product_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800">{item.product_name}</p>
                          <p className="text-xs text-gray-400">{item.unit}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{item.stock_qty} {item.unit}</td>
                        <td className="px-4 py-2.5 text-right">
                          <input type="number" min="0.001" step="0.001" value={item.quantity}
                            onChange={e => updateItem(item.product_id, 'quantity', e.target.value)}
                            className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" />
                        </td>
                        {movType === 'entrada' && (
                          <td className="px-4 py-2.5 text-right">
                            <input type="number" min="0" step="0.01" value={item.unit_cost}
                              onChange={e => updateItem(item.product_id, 'unit_cost', e.target.value)}
                              className="w-28 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" />
                          </td>
                        )}
                        {movType === 'entrada' && (
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-700">
                            {formatCurrency(parseFloat(item.quantity || '0') * parseFloat(item.unit_cost || '0'))}
                          </td>
                        )}
                        <td className="px-2 py-2.5">
                          <button onClick={() => removeItem(item.product_id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <X size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={handleFinalize}
                  disabled={loading || isPending}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold transition-colors disabled:opacity-60 ${typeConfig[movType].bg} hover:opacity-90`}
                >
                  <CheckCircle size={18} />
                  {loading ? 'Confirmando...' : `Confirmar ${typeConfig[movType].label.split('(')[0].trim()}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Coluna direita ── */}
        <div className="space-y-4">

          {/* Notas em Andamento */}
          {pendingNotes.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
                <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                  <FileText size={15} />
                  Notas em Andamento ({pendingNotes.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {pendingNotes.map((note: any) => (
                  <div key={note.id}>
                    <div className="px-4 py-3 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${typeLabels[note.type]?.color ?? 'text-gray-600 bg-gray-50'}`}>
                            {typeLabels[note.type]?.label ?? note.type}
                          </span>
                          {note.note_number && <span className="text-xs text-gray-500 font-mono">#{note.note_number}</span>}
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5 truncate">
                          {note.supplier?.trade_name ?? 'Sem fornecedor'}
                        </p>
                        <p className="text-xs text-gray-400">{note.total_items ?? 0} item(s)</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => loadNoteItems(note.id)}
                          className="text-xs text-blue-600 hover:underline px-2 py-1 hover:bg-blue-50 rounded">
                          {expandedNote === note.id ? 'Fechar' : 'Ver'}
                        </button>
                        <button onClick={() => cancelNote(note.id)}
                          className="text-xs text-red-500 hover:underline px-2 py-1 hover:bg-red-50 rounded">
                          Cancelar
                        </button>
                      </div>
                    </div>
                    {expandedNote === note.id && noteItems.length > 0 && (
                      <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                        {noteItems.map((ni: any) => (
                          <div key={ni.id} className="flex justify-between text-xs py-1">
                            <span className="text-gray-700">{ni.product?.name ?? ni.product_name}</span>
                            <span className="font-semibold">{ni.quantity} {ni.product?.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico recente */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-800 text-sm">Últimas Movimentações</h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {recentMovements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhuma movimentação</p>
              ) : recentMovements.map((m: any) => {
                const typeInfo = typeLabels[m.type] ?? { label: m.type, color: 'text-gray-600 bg-gray-50' }
                const isPositive = ['entrada', 'ajuste_positivo'].includes(m.type)
                return (
                  <div key={m.id} className="px-4 py-2.5 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{m.product?.name ?? '-'}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(m.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : '-'}{m.quantity} {m.product?.unit}
                        </span>
                        <div>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${typeInfo.color}`}>{typeInfo.label}</span>
                        </div>
                      </div>
                    </div>
                    {m.reason && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.reason}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
