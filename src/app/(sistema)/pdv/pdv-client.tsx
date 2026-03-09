'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePdvStore } from '@/lib/stores/pdv-store'
import { PaymentModal } from '@/components/pdv/payment-modal'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Search, X, Minus, Plus, Trash2, Maximize2, Minimize2, ArrowDownCircle, ArrowUpCircle, Edit3 } from 'lucide-react'
import type { CashRegister, Product, Category } from '@/types/database'

interface Props {
  cashRegister: CashRegister | null
  products: Product[]
  categories: Category[]
}

export function PdvClient({ cashRegister: initialCashRegister, products }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { setCashRegisterId, items, addItem, updateQty, removeItem, applyItemDiscount, clearCart, total } = usePdvStore()

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
  const [now, setNow] = useState<Date | null>(null)

  // Edição de item (inline)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setNow(new Date())
    const clock = setInterval(() => setNow(new Date()), 1000)
    setSidebarCollapsed(localStorage.getItem('sidebar-collapsed') === 'true')
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sidebar-collapsed') setSidebarCollapsed(e.newValue === 'true')
    }
    const onCollapse = (e: Event) => setSidebarCollapsed((e as CustomEvent).detail as boolean)
    window.addEventListener('storage', onStorage)
    window.addEventListener('sidebar-collapse', onCollapse)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('sidebar-collapse', onCollapse)
      clearInterval(clock)
    }
  }, [])

  // Item selecionado na tabela
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Modal F6 - alterar item
  const [f6Open, setF6Open] = useState(false)
  const [f6Qty, setF6Qty] = useState('')
  const [f6Price, setF6Price] = useState('')
  const [f6Discount, setF6Discount] = useState('')

  // Modal Sangria / Suprimento
  const [movModal, setMovModal] = useState<{ type: 'sangria' | 'suprimento' } | null>(null)
  const [movAmount, setMovAmount] = useState('')
  const [movReason, setMovReason] = useState('')
  const [movLoading, setMovLoading] = useState(false)

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
      if (e.key === 'F6') { e.preventDefault(); openF6() }
      if (e.key === 's' && e.ctrlKey) { e.preventDefault(); if (cashRegister) openMov('sangria') }
      if (e.key === 'e' && e.ctrlKey) { e.preventDefault(); if (cashRegister) openMov('suprimento') }
      if (e.key === 'Escape') { setPaymentOpen(false); setSearchOpen(false); setF6Open(false); setMovModal(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items, cashRegister, selectedItemId])

  // Focus automático no input de código
  useEffect(() => {
    if (!paymentOpen && !searchOpen && !openCashModal && !f6Open && !movModal) {
      setTimeout(() => barcodeRef.current?.focus(), 100)
    }
  }, [paymentOpen, searchOpen, openCashModal, f6Open, movModal])

  function openF6() {
    const id = selectedItemId ?? items[items.length - 1]?.product.id ?? null
    if (!id) return
    const item = items.find(i => i.product.id === id)
    if (!item) return
    setSelectedItemId(id)
    setF6Qty(String(item.quantity))
    setF6Price(String(item.unit_price))
    setF6Discount(String(item.discount))
    setF6Open(true)
  }

  function handleF6Confirm() {
    if (!selectedItemId) return
    const qty = parseFloat(f6Qty) || 0
    const newPrice = parseFloat(f6Price) || 0
    const discount = parseFloat(f6Discount) || 0
    if (qty > 0) updateQty(selectedItemId, qty)
    if (newPrice > 0) {
      // update unit price and recalculate via store
      usePdvStore.setState(state => ({
        items: state.items.map(i =>
          i.product.id === selectedItemId
            ? { ...i, unit_price: newPrice, subtotal: qty * newPrice - discount }
            : i
        )
      }))
    }
    applyItemDiscount(selectedItemId, discount)
    setF6Open(false)
  }

  function openMov(type: 'sangria' | 'suprimento') {
    setMovAmount('')
    setMovReason('')
    setMovModal({ type })
  }

  async function handleMovimento() {
    if (!cashRegister) return
    const amount = parseFloat(movAmount)
    if (!amount || amount <= 0) return toast.error('Informe o valor')
    setMovLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await (supabase as any).from('cash_movements').insert({
      cash_register_id: cashRegister.id,
      type: movModal!.type,
      amount,
      reason: movReason || null,
      user_id: user?.id ?? null,
    })
    if (error) { toast.error('Erro ao registrar movimento'); setMovLoading(false); return }
    const field = movModal!.type === 'sangria' ? 'total_sangria' : 'total_suprimento'
    await (supabase as any).from('cash_registers')
      .update({ [field]: (cashRegister as any)[field] ?? 0 + amount })
      .eq('id', cashRegister.id)
    toast.success(movModal!.type === 'sangria' ? 'Sangria registrada!' : 'Suprimento registrado!')
    setMovModal(null)
    setMovLoading(false)
  }

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

  const nowStr = now
    ? now.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : ''

  return (
    <div className={`fixed inset-0 top-0 bg-[#1a2744] flex flex-col overflow-hidden transition-all duration-300 ${fullscreen ? 'left-0' : sidebarCollapsed ? 'lg:left-14' : 'lg:left-64'}`} style={{ zIndex: fullscreen ? 40 : 10 }}>

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
        <button
          onClick={() => setFullscreen(f => !f)}
          title={fullscreen ? 'Mostrar menu lateral' : 'Tela cheia'}
          className="flex items-center px-3 py-1.5 border-l border-[#2a3a5c] text-gray-400 hover:text-white hover:bg-[#1a2744] transition-colors"
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
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
                  onClick={() => setSelectedItemId(item.product.id)}
                  className={`grid text-xs border-b border-gray-100 transition-colors cursor-pointer ${
                    selectedItemId === item.product.id
                      ? 'bg-blue-100 border-l-2 border-l-cyan-500'
                      : idx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'
                  }`}
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
      <div className="bg-[#0e1b35] border-t-2 border-[#1e3a6e] shrink-0">

        {/* ── Linha 1: ações principais ── */}
        <div className="flex items-stretch text-white border-b border-[#1a3060]">

          {/* Grupo de botões primários (2 linhas × 3 col) */}
          <div className="grid grid-cols-3 border-r border-[#1a3060]">
            {/* Linha 1 */}
            <BotaoAcao label={cashRegister ? 'Fechar Caixa' : 'Abrir Caixa'} atalho="Ctrl+X"
              onClick={() => cashRegister ? handleCloseCash() : setOpenCashModal(true)} />
            <BotaoAcao label="Alterar Item" atalho="F6" amarelo
              onClick={openF6} disabled={items.length === 0} />
            <BotaoAcao label="Consultar" atalho="F9"
              onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100) }} />
            {/* Linha 2 */}
            <BotaoAcao label="Sangria" atalho="Ctrl+S" vermelho
              onClick={() => openMov('sangria')} disabled={!cashRegister} />
            <BotaoAcao label="Entrada" atalho="Ctrl+E" verde
              onClick={() => openMov('suprimento')} disabled={!cashRegister} />
            <BotaoAcao label="Cancelar Item" atalho="F8"
              onClick={() => { if (selectedItemId) removeItem(selectedItemId) }}
              disabled={!selectedItemId} />
          </div>

          {/* Totalizadores */}
          <div className="flex items-stretch border-r border-[#1a3060]">
            <TotBox label="TOTAL ITENS" value={String(items.length)} />
            <TotBox label="TOTAL QTD" value={totalItems.toFixed(totalItems % 1 !== 0 ? 3 : 0)} />
          </div>

          {/* R$ Desconto */}
          <div className="flex flex-col items-center justify-center px-4 border-r border-[#1a3060] min-w-[100px]">
            <p className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">R$ DESCONTO</p>
            <p className="text-lg font-bold text-pink-400 font-mono mt-0.5">
              {formatCurrency(items.reduce((s, i) => s + i.discount, 0))}
            </p>
          </div>

          {/* R$ Total */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 bg-[#071228] border-r border-[#1a3060]">
            <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider">R$ TOTAL</p>
            <p className="text-3xl font-bold text-cyan-400 font-mono mt-0.5">{formatCurrency(total())}</p>
          </div>

          {/* CANCELAR VENDA */}
          <button
            onClick={() => { if (items.length > 0 && confirm('Cancelar venda?')) clearCart() }}
            disabled={items.length === 0}
            className="flex flex-col items-center justify-center px-4 bg-[#5c1010] hover:bg-[#7a1515] border-r border-[#1a3060] transition-colors min-w-[110px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="font-bold text-sm tracking-wide">CANCELAR</span>
            <span className="font-bold text-sm tracking-wide">VENDA</span>
            <span className="text-red-400 text-[10px] mt-0.5">(F11)</span>
          </button>

          {/* FECHAR VENDA */}
          <button
            onClick={() => { if (items.length > 0 && cashRegister) setPaymentOpen(true) }}
            disabled={items.length === 0 || !cashRegister}
            className="flex flex-col items-center justify-center px-6 bg-[#0a7a7a] hover:bg-[#0c9999] transition-colors min-w-[130px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="font-bold text-lg tracking-wide">FECHAR</span>
            <span className="font-bold text-lg tracking-wide">VENDA</span>
            <span className="text-cyan-300 text-[10px] mt-0.5">(F10)</span>
          </button>
        </div>

        {/* ── Linha 2: atalhos rápidos ── */}
        <div className="flex items-center text-[10px] text-gray-500 px-2 py-1 gap-1 overflow-x-auto">
          {[
            ['F9', 'Buscar Produto'],
            ['F6', 'Alterar Item'],
            ['F10', 'Fechar Venda'],
            ['F11', 'Cancelar Venda'],
            ['Ctrl+S', 'Sangria'],
            ['Ctrl+E', 'Entrada'],
            ['Esc', 'Fechar Modal'],
          ].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded bg-[#1a2744] text-gray-400">
              <kbd className="text-cyan-500 font-mono font-bold text-[10px]">{key}</kbd>
              <span>{label}</span>
            </span>
          ))}
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

      {/* ── Modal F6 - Alterar Item ── */}
      {f6Open && selectedItemId && (() => {
        const item = items.find(i => i.product.id === selectedItemId)
        if (!item) return null
        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Edit3 size={18} className="text-yellow-500" />
                  Alterar Item (F6)
                </h2>
                <button onClick={() => setF6Open(false)} className="text-gray-400"><X size={20} /></button>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-4 truncate">{item.product.name}</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Quantidade</label>
                  <input type="number" min="0.001" step="0.001" value={f6Qty}
                    onChange={e => setF6Qty(e.target.value)}
                    className="input-field w-full text-lg font-bold" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Preço Unitário (R$)</label>
                  <input type="number" min="0" step="0.01" value={f6Price}
                    onChange={e => setF6Price(e.target.value)}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Desconto (R$)</label>
                  <input type="number" min="0" step="0.01" value={f6Discount}
                    onChange={e => setF6Discount(e.target.value)}
                    className="input-field w-full text-red-600" />
                </div>
              </div>
              <button onClick={handleF6Confirm}
                className="w-full mt-4 bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Modal Sangria / Suprimento ── */}
      {movModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {movModal.type === 'sangria'
                  ? <><ArrowUpCircle size={18} className="text-red-500" /> Sangria</>
                  : <><ArrowDownCircle size={18} className="text-green-500" /> Suprimento</>
                }
              </h2>
              <button onClick={() => setMovModal(null)} className="text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
                <input type="number" min="0.01" step="0.01" value={movAmount}
                  onChange={e => setMovAmount(e.target.value)}
                  className="input-field w-full text-lg font-bold" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Observação</label>
                <input type="text" value={movReason}
                  onChange={e => setMovReason(e.target.value)}
                  placeholder="Opcional"
                  className="input-field w-full" />
              </div>
            </div>
            <button onClick={handleMovimento} disabled={movLoading}
              className={`w-full mt-4 font-bold py-3 rounded-xl transition-colors text-white disabled:opacity-60 ${
                movModal.type === 'sangria' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'
              }`}>
              {movLoading ? 'Registrando...' : 'Confirmar'}
            </button>
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

// ── Sub-componentes ──────────────────────────────────────────────────
function BotaoAcao({ label, atalho, onClick, disabled, amarelo, vermelho, verde }: {
  label: string; atalho: string; onClick: () => void; disabled?: boolean
  amarelo?: boolean; vermelho?: boolean; verde?: boolean
}) {
  const base = 'flex flex-col items-center justify-center px-3 py-2 border-r border-b border-[#1a3060] transition-colors text-[11px] font-semibold min-w-[80px] disabled:opacity-40 disabled:cursor-not-allowed'
  const color = vermelho ? 'text-red-300 hover:bg-red-900/40'
    : verde ? 'text-green-300 hover:bg-green-900/40'
    : amarelo ? 'text-yellow-300 hover:bg-yellow-900/30'
    : 'text-gray-200 hover:bg-[#1a2744]'
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${color}`}>
      <span>{label}</span>
      <span className="text-[10px] opacity-50 font-normal">({atalho})</span>
    </button>
  )
}

function TotBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 border-r border-[#1a3060] min-w-[80px]">
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white font-mono mt-0.5">{value}</p>
    </div>
  )
}
