'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePdvStore } from '@/lib/stores/pdv-store'
import { PdvSearchBar } from '@/components/pdv/search-bar'
import { PdvCart } from '@/components/pdv/cart'
import { PaymentModal } from '@/components/pdv/payment-modal'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ShoppingCart, Lock, Unlock, AlertTriangle, Trash2, X } from 'lucide-react'
import type { CashRegister, Product, Category } from '@/types/database'

interface Props {
  cashRegister: CashRegister | null
  products: Product[]
  categories: Category[]
}

export function PdvClient({ cashRegister: initialCashRegister, products, categories }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { setCashRegisterId, cashRegisterId, items, clearCart, total } = usePdvStore()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cashRegister, setCashRegister] = useState(initialCashRegister)
  const [openCashModal, setOpenCashModal] = useState(false)
  const [initialBalance, setInitialBalance] = useState('0')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loadingCash, setLoadingCash] = useState(false)

  useEffect(() => {
    if (cashRegister) setCashRegisterId(cashRegister.id)
  }, [cashRegister])

  // Atalho F10
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F10') { e.preventDefault(); setPaymentOpen(true) }
      if (e.key === 'Escape') setPaymentOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function handleOpenCash() {
    setLoadingCash(true)
    const { data: user } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('cash_registers')
      .insert({
        user_id: user.user!.id,
        initial_balance: parseFloat(initialBalance) || 0,
        status: 'aberto',
      })
      .select()
      .single()

    if (error) toast.error('Erro ao abrir caixa')
    else {
      setCashRegister(data)
      setCashRegisterId(data.id)
      setOpenCashModal(false)
      toast.success('Caixa aberto!')
    }
    setLoadingCash(false)
  }

  async function handleCloseCash() {
    if (!cashRegister) return
    if (!confirm('Confirmar fechamento do caixa?')) return

    const { error } = await supabase
      .from('cash_registers')
      .update({ status: 'fechado', closed_at: new Date().toISOString() })
      .eq('id', cashRegister.id)

    if (error) toast.error('Erro ao fechar caixa')
    else {
      setCashRegister(null)
      setCashRegisterId(null)
      toast.success('Caixa fechado!')
      router.refresh()
    }
  }

  const filteredProducts = categoryFilter
    ? products.filter(p => p.category_id === categoryFilter)
    : products

  return (
    <div className="fixed inset-0 bg-slate-100 flex overflow-hidden">
      {/* Left - Catálogo */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header PDV */}
        <div className="bg-green-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛒</span>
            <div>
              <p className="font-bold text-sm">PDV — Venha Ver</p>
              {cashRegister ? (
                <p className="text-green-300 text-xs">
                  Caixa aberto • {formatDateTime(cashRegister.opened_at)}
                </p>
              ) : (
                <p className="text-amber-300 text-xs font-semibold">⚠ Caixa fechado</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cashRegister ? (
              <button onClick={handleCloseCash}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                <Lock size={13} /> Fechar Caixa
              </button>
            ) : (
              <button onClick={() => setOpenCashModal(true)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                <Unlock size={13} /> Abrir Caixa
              </button>
            )}
          </div>
        </div>

        {/* Busca */}
        <div className="bg-white border-b border-gray-200 p-3">
          <PdvSearchBar />
        </div>

        {/* Filtro categorias */}
        <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !categoryFilter ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(categoryFilter === c.id ? '' : c.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === c.id ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Grid de produtos */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>

      {/* Right - Carrinho */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={18} className="text-green-600" />
            Carrinho
          </h2>
          {items.length > 0 && (
            <button onClick={() => { if(confirm('Limpar carrinho?')) clearCart() }}
              className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <PdvCart />
        </div>

        {/* Botão finalizar */}
        <div className="p-4 border-t border-gray-100">
          {!cashRegister && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 rounded-lg p-2 mb-3 text-xs font-medium">
              <AlertTriangle size={14} />
              Abra o caixa para vender
            </div>
          )}
          <button
            onClick={() => setPaymentOpen(true)}
            disabled={items.length === 0 || !cashRegister}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formatCurrency(total())}
            <span className="block text-xs font-normal opacity-80">F10 para finalizar</span>
          </button>
        </div>
      </div>

      {/* Modal pagamento */}
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} />

      {/* Modal abrir caixa */}
      {openCashModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Abrir Caixa</h2>
              <button onClick={() => setOpenCashModal(false)} className="text-gray-400">
                <X size={20} />
              </button>
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
              {loadingCash ? 'Abrindo...' : 'Abrir Caixa'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = usePdvStore()
  return (
    <button
      onClick={() => addItem(product)}
      className="bg-white rounded-xl border border-gray-200 p-3 hover:border-green-400 hover:shadow-md transition-all text-left group"
    >
      <div className="w-full aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center text-2xl group-hover:bg-green-50 transition-colors">
        🛒
      </div>
      <p className="text-xs font-medium text-gray-700 leading-tight line-clamp-2">{product.name}</p>
      <p className="text-sm font-bold text-green-700 mt-1">{formatCurrency(product.sale_price)}</p>
      {product.low_stock && (
        <p className="text-xs text-amber-500 font-medium">⚠ Estoque baixo</p>
      )}
    </button>
  )
}
