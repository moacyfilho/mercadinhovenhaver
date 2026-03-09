'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePdvStore } from '@/lib/stores/pdv-store'
import { PaymentModal } from '@/components/pdv/payment-modal'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Search, X, Minus, Plus, Trash2 } from 'lucide-react'
import type { CashRegister, Product, Category } from '@/types/database'

interface Props {
  cashRegister: CashRegister | null
  products: Product[]
  categories: Category[]
}

export function PdvClient({ cashRegister: initialCashRegister, products }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { setCashRegisterId, items, addItem, updateQty, removeItem, clearCart, total } = usePdvStore()

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cashRegister, setCashRegister] = useState(initialCashRegister)
  const [openCashModal, setOpenCashModal] = useState(false)
  const [initialBalance, setInitialBalance] = useState('0')
  const [loadingCash, setLoadingCash] = useState(false)

  // Busca por código/nome
  const [barcodeInput, setBarcodeInput] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedQty, setSelectedQty] = useState(1)
  const [now, setNow] = useState(new Date())

  // Edição de item
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')

  const barcodeRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cashRegister) setCashRegisterId(cashRegister.id)
  }, [cashRegister])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Atalhos de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F10') { e.preventDefault(); if (items.length > 0 && cashRegister) setPaymentOpen(true) }
      if (e.key === 'F11') { e.preventDefault(); if (items.length > 0 && confirm('Cancelar venda?')) clearCart() }
      if (e.key === 'F9') { e.preventDefault(); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100) }
      if (e.key === 'Escape') { setPaymentOpen(false); setSearchOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items, cashRegister])

  // Focus automático no input de código
  useEffect(() => {
    if (!paymentOpen && !searchOpen && !openCashModal) {
      setTimeout(() => barcodeRef.current?.focus(), 100)
    }
  }, [paymentOpen, searchOpen, openCashModal])

  function handleBarcodeEnter(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    const q = barcodeInput.trim()
    if (!q) return

    // Busca por barcode exato primeiro, depois por nome
    const byBarcode = products.find(p => p.barcode === q)
    if (byBarcode) {
      if (byBarcode.stock_qty <= 0) return toast.error('Produto sem estoque')
      addItemWithQty(byBarcode, selectedQty)
      setBarcodeInput('')
      setSelectedQty(1)
      return
    }

    // Busca parcial por nome
    const byName = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) && p.active)
    if (byName.length === 1) {
      if (byName[0].stock_qty <= 0) return toast.error('Produto sem estoque')
      addItemWithQty(byName[0], selectedQty)
      setBarcodeInput('')
      setSelectedQty(1)
    } else if (byName.length > 1) {
      setSearchQuery(q)
      setSearchOpen(true)
    } else {
      toast.error('Produto não encontrado')
    }
  }

  function addItemWithQty(product: Product, qty: number) {
    addItem(product, qty)
    setSelectedProduct(product)
    toast.success(`${product.name} adicionado`)
  }

  function handleSelectFromSearch(product: Product) {
    if (product.stock_qty <= 0) return toast.error('Produto sem estoque')
    addItemWithQty(product, 1)
    setSearchOpen(false)
    setSearchQuery('')
    setBarcodeInput('')
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }

  async function handleOpenCash() {
    setLoadingCash(true)
    const { data: user } = await supabase.auth.getUser()
    const { data, error } = await (supabase as any)
      .from('cash_registers')
      .insert({ user_id: user.user!.id, initial_balance: parseFloat(initialBalance) || 0, status: 'aberto' })
      .select().single()
    if (error) toast.error('Erro ao abrir caixa')
    else {
      setCashRegister(data); setCashRegisterId(data.id)
      setOpenCashModal(false); toast.success('Caixa aberto!')
    }
    setLoadingCash(false)
  }

  async function handleCloseCash() {
    if (!cashRegister || !confirm('Confirmar fechamento do caixa?')) return
    const { error } = await (supabase as any).from('cash_registers')
      .update({ status: 'fechado', closed_at: new Date().toISOString() }).eq('id', cashRegister.id)
    if (error) toast.error('Erro ao fechar caixa')
    else { setCashRegister(null); setCashRegisterId(null); toast.success('Caixa fechado!'); router.refresh() }
  }

  const filteredSearch = searchQuery
    ? products.filter(p => p.active && (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    : products.filter(p => p.active)

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  const nowStr = now.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="fixed inset-0 lg:left-64 top-0 bg-[#1a2744] flex flex-col overflow-hidden" style={{ zIndex: 10 }}>

      {/* ── Barra superior ── */}
      <div className="bg-[#0e1b35] text-white flex items-stretch text-xs shrink-0 border-b border-[#2a3a5c]">
        <div className="flex items-center px-3 py-1.5 border-r border-[#2a3a5c] gap-2">
          <span className="text-[10px] text-gray-400 uppercase">Fatura</span>
          <span className="font-bold text-cyan-400">Digital</span>
        </div>
        <div className="flex items-center px-3 py-1.5 border-r border-[#2a3a5c] gap-1.5">
          <span className="text-gray-400">Caixa</span>
          <span className="font-bold text-white">1</span>
        </div>
        <div className="flex items-center px-3 py-1.5 border-r border-[#2a3a5c] gap-1.5">
          <span className="text-gray-400">Operador:</span>
          <span className="font-semibold text-white">PDV Venha Ver</span>
        </div>
        <button
          onClick={() => {/* cliente */}}
          className="flex items-center px-3 py-1.5 border-r border-[#2a3a5c] gap-1.5 hover:bg-[#1a2744] transition-colors"
        >
          <span className="text-gray-400">Cliente</span>
          <span className="font-semibold text-white">BALCÃO</span>
          <span className="text-gray-500 text-[10px]">(F2)</span>
        </button>
        <div className="flex-1" />
        <div className="flex items-center px-3 py-1.5 border-l border-[#2a3a5c] text-gray-300">
          {nowStr}
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="bg-[#152038] text-white flex items-center px-3 py-1 text-xs shrink-0 border-b border-[#2a3a5c] gap-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${cashRegister ? 'bg-green-400' : 'bg-red-500'}`} />
          <span className={`font-semibold ${cashRegister ? 'text-green-300' : 'text-red-300'}`}>
            {cashRegister ? 'Caixa Aberto' : 'Caixa Fechado'}
          </span>
        </div>
        {cashRegister && (
          <span className="text-gray-400">Fundo: {formatCurrency(cashRegister.initial_balance)}</span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100) }}
          className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
        >
          <Search size={12} />
          <span>Pesquisar Produto</span>
          <span className="text-gray-500">(F9)</span>
        </button>
      </div>

      {/* ── Área principal ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Painel esquerdo: entrada ── */}
        <div className="w-52 lg:w-56 bg-[#1e2d4a] border-r border-[#2a3a5c] flex flex-col shrink-0 text-white text-xs">
          <div className="p-2 border-b border-[#2a3a5c]">
            <label className="text-gray-400 text-[11px] mb-1 block">Código de Barras ou Interno:</label>
            <input
              ref={barcodeRef}
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeEnter}
              className="w-full bg-white text-gray-900 px-2 py-1.5 rounded text-sm font-mono border border-gray-300 focus:outline-none focus:border-cyan-400"
              placeholder=""
              autoComplete="off"
            />
          </div>

          {/* Imagem do produto */}
          <div className="p-2 border-b border-[#2a3a5c]">
            <label className="text-gray-400 text-[11px] mb-1 block">Imagem Produto</label>
            <div className="w-full h-28 bg-[#152038] rounded border border-[#2a3a5c] flex items-center justify-center text-gray-600">
              {selectedProduct?.image_url ? (
                <img src={selectedProduct.image_url} alt="" className="w-full h-full object-contain rounded" />
              ) : (
                <div className="text-center">
                  <div className="text-3xl mb-1">📦</div>
                  <p className="text-[10px] text-gray-600">Sem imagem</p>
                </div>
              )}
            </div>
            {selectedProduct && (
              <p className="text-[10px] text-cyan-400 mt-1 truncate">{selectedProduct.name}</p>
            )}
          </div>

          {/* Quantidade */}
          <div className="p-2 border-b border-[#2a3a5c]">
            <label className="text-gray-400 text-[11px] mb-1 block">Quantidade:</label>
            <div className="flex items-center gap-1">
              <button onClick={() => setSelectedQty(q => Math.max(1, q - 1))}
                className="w-7 h-7 bg-[#2a3a5c] hover:bg-[#3a4a6c] rounded flex items-center justify-center transition-colors">
                <Minus size={12} />
              </button>
              <input
                type="number" min="1" step="0.001"
                value={selectedQty}
                onChange={e => setSelectedQty(parseFloat(e.target.value) || 1)}
                className="flex-1 bg-white text-gray-900 px-2 py-1 rounded text-center text-sm font-bold border border-gray-300 focus:outline-none"
              />
              <button onClick={() => setSelectedQty(q => q + 1)}
                className="w-7 h-7 bg-[#2a3a5c] hover:bg-[#3a4a6c] rounded flex items-center justify-center transition-colors">
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Preço unitário */}
          <div className="p-2 border-b border-[#2a3a5c]">
            <label className="text-gray-400 text-[11px] mb-1 block">R$ Valor Unitário:</label>
            <div className="bg-[#0e1b35] border border-[#2a3a5c] rounded px-2 py-1.5 text-right text-sm font-mono text-white">
              {selectedProduct ? formatCurrency(selectedProduct.sale_price) : '0,00'}
            </div>
          </div>

          {/* Total */}
          <div className="p-2">
            <label className="text-gray-400 text-[11px] mb-1 block">R$ Valor Total:</label>
            <div className="bg-[#0e1b35] border border-[#2a3a5c] rounded px-2 py-1.5 text-right text-sm font-mono text-cyan-400 font-bold">
              {selectedProduct ? formatCurrency(selectedProduct.sale_price * selectedQty) : '0,00'}
            </div>
          </div>

          <div className="flex-1" />

          {/* Botão adicionar */}
          {selectedProduct && (
            <div className="p-2 border-t border-[#2a3a5c]">
              <button
                onClick={() => { addItemWithQty(selectedProduct, selectedQty); setSelectedQty(1) }}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded text-xs font-bold transition-colors"
              >
                + Adicionar ao Carrinho
              </button>
            </div>
          )}
        </div>

        {/* ── Centro: Tabela de itens ── */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Cabeçalho da tabela */}
          <div className="bg-[#1a2744] text-white grid text-[11px] font-semibold uppercase shrink-0" style={{ gridTemplateColumns: '36px 60px 1fr 70px 90px 60px 70px 90px 40px' }}>
            <div className="px-1 py-2 text-center border-r border-[#2a3a5c]">Item</div>
            <div className="px-2 py-2 border-r border-[#2a3a5c]">Código</div>
            <div className="px-2 py-2 border-r border-[#2a3a5c]">Produto</div>
            <div className="px-2 py-2 text-right border-r border-[#2a3a5c]">Qtd</div>
            <div className="px-2 py-2 text-right border-r border-[#2a3a5c]">R$ Un.</div>
            <div className="px-2 py-2 text-right border-r border-[#2a3a5c]">% Desc</div>
            <div className="px-2 py-2 text-right border-r border-[#2a3a5c]">R$ Desc</div>
            <div className="px-2 py-2 text-right border-r border-[#2a3a5c]">R$ Total</div>
            <div className="px-1 py-2" />
          </div>

          {/* Linhas dos itens */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2">
                <span className="text-5xl">🛒</span>
                <p className="text-sm">Nenhum item na venda</p>
                <p className="text-xs text-gray-400">Digite o código de barras ou pressione F9 para buscar</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={item.product.id}
                  className={`grid text-xs border-b border-gray-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ gridTemplateColumns: '36px 60px 1fr 70px 90px 60px 70px 90px 40px' }}
                >
                  <div className="px-1 py-2 text-center text-gray-500 font-mono">{idx + 1}</div>
                  <div className="px-2 py-2 text-gray-500 font-mono truncate">
                    {item.product.barcode ?? item.product.sku ?? '-'}
                  </div>
                  <div className="px-2 py-2 font-medium text-gray-800 truncate">{item.product.name}</div>
                  <div className="px-2 py-2 text-right">
                    {editingItem === item.product.id ? (
                      <input
                        type="number" min="0.001" step="0.001"
                        value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        onBlur={() => {
                          const q = parseFloat(editQty)
                          if (q > 0) updateQty(item.product.id, q)
                          setEditingItem(null)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { const q = parseFloat(editQty); if (q > 0) updateQty(item.product.id, q); setEditingItem(null) }
                          if (e.key === 'Escape') setEditingItem(null)
                        }}
                        className="w-full bg-yellow-100 border border-yellow-400 rounded text-center font-bold focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => { setEditingItem(item.product.id); setEditQty(String(item.quantity)) }}
                        className="cursor-pointer font-bold text-gray-800 hover:text-blue-600 hover:underline"
                      >
                        {item.quantity} {item.product.unit}
                      </span>
                    )}
                  </div>
                  <div className="px-2 py-2 text-right text-gray-700 font-mono">{formatCurrency(item.unit_price)}</div>
                  <div className="px-2 py-2 text-right text-gray-500">
                    {item.discount > 0 ? `${((item.discount / (item.unit_price * item.quantity)) * 100).toFixed(1)}%` : '-'}
                  </div>
                  <div className="px-2 py-2 text-right text-red-500 font-mono">
                    {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                  </div>
                  <div className="px-2 py-2 text-right font-bold text-gray-900 font-mono">{formatCurrency(item.subtotal)}</div>
                  <div className="px-1 py-2 flex items-center justify-center">
                    <button onClick={() => removeItem(item.product.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Barra de ações (bottom) ── */}
      <div className="bg-[#0e1b35] border-t border-[#2a3a5c] shrink-0">
        {/* Linha 1: ações principais + totais */}
        <div className="flex items-stretch text-white text-xs">
          {/* Botões de ação */}
          <button
            onClick={() => cashRegister ? handleCloseCash() : setOpenCashModal(true)}
            className="flex flex-col items-center justify-center px-3 py-2 border-r border-[#2a3a5c] hover:bg-[#1a2744] transition-colors min-w-[80px]"
          >
            <span className="font-semibold">{cashRegister ? 'Fechar Caixa' : 'Abrir Caixa'}</span>
            <span className="text-gray-500 text-[10px]">{cashRegister ? '(Ctrl+X)' : ''}</span>
          </button>
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100) }}
            className="flex flex-col items-center justify-center px-3 py-2 border-r border-[#2a3a5c] hover:bg-[#1a2744] transition-colors min-w-[80px]"
          >
            <span className="font-semibold">Consultar</span>
            <span className="text-gray-500 text-[10px]">(F9)</span>
          </button>
          {items.length > 0 && (
            <button
              onClick={() => { if (confirm('Limpar todos os itens?')) clearCart() }}
              className="flex flex-col items-center justify-center px-3 py-2 border-r border-[#2a3a5c] hover:bg-red-900 transition-colors min-w-[80px]"
            >
              <Trash2 size={14} />
              <span className="font-semibold mt-0.5">Limpar</span>
            </button>
          )}

          {/* Totalizadores */}
          <div className="flex items-center border-r border-[#2a3a5c] px-4 gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-[10px] uppercase">Total Itens</p>
              <p className="font-bold text-white text-base">{items.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-[10px] uppercase">Total Qtd</p>
              <p className="font-bold text-white text-base">{totalItems.toFixed(totalItems % 1 !== 0 ? 3 : 0)}</p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center border-r border-[#2a3a5c] px-4">
            <div className="text-center">
              <p className="text-gray-400 text-[10px] uppercase">R$ Total</p>
              <p className="font-bold text-cyan-400 text-2xl font-mono">{formatCurrency(total())}</p>
            </div>
          </div>

          {/* Cancelar */}
          <button
            onClick={() => { if (items.length > 0 && confirm('Cancelar venda?')) clearCart() }}
            disabled={items.length === 0}
            className="flex flex-col items-center justify-center px-4 py-2 border-r border-[#2a3a5c] bg-red-900 hover:bg-red-800 transition-colors min-w-[110px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="font-bold text-sm">CANCELAR VENDA</span>
            <span className="text-red-300 text-[10px]">(F11)</span>
          </button>

          {/* Fechar venda */}
          <button
            onClick={() => { if (items.length > 0 && cashRegister) setPaymentOpen(true) }}
            disabled={items.length === 0 || !cashRegister}
            className="flex flex-col items-center justify-center px-6 py-2 bg-cyan-600 hover:bg-cyan-500 transition-colors min-w-[130px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="font-bold text-base">FECHAR VENDA</span>
            <span className="text-cyan-200 text-[10px]">(F10)</span>
          </button>
        </div>
      </div>

      {/* ── Modal pagamento ── */}
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} />

      {/* ── Modal busca de produto (F9) ── */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-16 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="flex items-center gap-3 p-4 border-b">
              <Search size={18} className="text-gray-400" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, código de barras ou SKU..."
                className="flex-1 outline-none text-gray-800 text-sm"
                autoFocus
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-[#1a2744] text-white text-xs sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2 text-left">Categoria</th>
                    <th className="px-3 py-2 text-right">Estoque</th>
                    <th className="px-3 py-2 text-right">Preço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSearch.slice(0, 50).map(p => (
                    <tr
                      key={p.id}
                      onClick={() => handleSelectFromSearch(p)}
                      className={`cursor-pointer transition-colors ${p.stock_qty <= 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50'}`}
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.barcode ?? p.sku ?? ''}</p>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{(p as any).category_name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-right">
                        {p.stock_qty <= 0
                          ? <span className="text-red-500 font-semibold text-xs">Sem estoque</span>
                          : <span className={p.low_stock ? 'text-amber-600 font-semibold' : 'text-gray-600'}>{p.stock_qty} {p.unit}</span>
                        }
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-green-700">{formatCurrency(p.sale_price)}</td>
                    </tr>
                  ))}
                  {filteredSearch.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhum produto encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-400 text-center">
              {filteredSearch.length} produto(s) encontrado(s) — Clique para adicionar • Esc para fechar
            </div>
          </div>
        </div>
      )}

      {/* ── Modal abrir caixa ── */}
      {openCashModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Abrir Caixa</h2>
              <button onClick={() => setOpenCashModal(false)} className="text-gray-400"><X size={20} /></button>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fundo de troco (R$)</label>
            <input
              type="number" min="0" step="0.01"
              value={initialBalance}
              onChange={e => setInitialBalance(e.target.value)}
              className="input-field w-full mb-4 text-lg"
              autoFocus
            />
            <button
              onClick={handleOpenCash}
              disabled={loadingCash}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loadingCash ? 'Abrindo...' : 'Confirmar Abertura'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
