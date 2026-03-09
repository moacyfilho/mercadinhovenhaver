'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePdvStore } from '@/lib/stores/pdv-store'
import { toast } from 'sonner'
import { formatCurrency, paymentLabel } from '@/lib/utils'
import { X, Check, DollarSign, CreditCard, Smartphone, BookOpen, Search, CheckCircle, FileText } from 'lucide-react'
import { NfceModal } from './nfce-modal'
import type { PaymentMethod, Customer } from '@/types/database'

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: typeof DollarSign }[] = [
  { method: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
  { method: 'pix', label: 'PIX', icon: Smartphone },
  { method: 'debito', label: 'Débito', icon: CreditCard },
  { method: 'credito', label: 'Crédito', icon: CreditCard },
  { method: 'fiado', label: 'Fiado', icon: BookOpen },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function PaymentModal({ open, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const {
    items, customer, setCustomer, paymentMethod, setPaymentMethod,
    amountPaid, setAmountPaid, discount, setDiscount, surcharge, setSurcharge,
    total, change, cashRegisterId, clearCart
  } = usePdvStore()

  const [loading, setLoading] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [saleResult, setSaleResult] = useState<{
    saleId: string; saleNumber: number; total: number; changeAmount: number; items: typeof items
  } | null>(null)
  const [nfceOpen, setNfceOpen] = useState(false)

  if (!open) return null

  async function searchCustomer(q: string) {
    setCustomerSearch(q)
    if (!q.trim()) return setCustomerResults([])
    const { data } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${q}%`)
      .limit(5)
    setCustomerResults(data ?? [])
  }

  async function handleFinalize() {
    if (items.length === 0) return toast.error('Carrinho vazio')
    if (!cashRegisterId) return toast.error('Abra o caixa antes de vender')
    if (paymentMethod === 'fiado' && !customer) return toast.error('Selecione o cliente para fiado')
    if (paymentMethod === 'fiado' && customer) {
      const remaining = customer.credit_limit - customer.current_debt
      if (total() > remaining) {
        return toast.error(`Limite de crédito insuficiente. Disponível: ${formatCurrency(remaining)}`)
      }
    }

    setLoading(true)

    const saleData = {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      customer_id: customer?.id ?? null,
      cash_register_id: cashRegisterId,
      status: 'finalizada' as const,
      payment_method: paymentMethod,
      subtotal: items.reduce((s, i) => s + i.subtotal, 0),
      discount,
      surcharge,
      total: total(),
      amount_paid: paymentMethod === 'dinheiro' ? amountPaid : total(),
      change_amount: paymentMethod === 'dinheiro' ? change() : 0,
    }

    const { data: sale, error } = await supabase.from('sales').insert(saleData).select().single()

    if (error || !sale) {
      toast.error('Erro ao registrar venda')
      setLoading(false)
      return
    }

    // Inserir itens
    const saleItems = items.map(i => ({
      sale_id: sale.id,
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      cost_price: i.product.cost_price,
      discount: i.discount,
      subtotal: i.subtotal,
    }))

    await supabase.from('sale_items').insert(saleItems)

    // Conta a receber (fiado)
    if (paymentMethod === 'fiado' && customer) {
      await supabase.from('accounts_receivable').insert({
        description: `Fiado - Venda #${sale.sale_number}`,
        customer_id: customer.id,
        sale_id: sale.id,
        amount: total(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pendente',
      })
    }

    // Atualizar totais do caixa
    const { data: reg } = await supabase
      .from('cash_registers')
      .select('total_sales, cash_sales, pix_sales, debit_sales, credit_sales')
      .eq('id', cashRegisterId)
      .single()

    if (reg) {
      const saleTotal = total()
      const updates: Record<string, number> = {
        total_sales: ((reg as any).total_sales ?? 0) + saleTotal,
      }
      if (paymentMethod === 'dinheiro') updates.cash_sales = ((reg as any).cash_sales ?? 0) + saleTotal
      else if (paymentMethod === 'pix') updates.pix_sales = ((reg as any).pix_sales ?? 0) + saleTotal
      else if (paymentMethod === 'debito') updates.debit_sales = ((reg as any).debit_sales ?? 0) + saleTotal
      else if (paymentMethod === 'credito') updates.credit_sales = ((reg as any).credit_sales ?? 0) + saleTotal
      await supabase.from('cash_registers').update(updates).eq('id', cashRegisterId)
    }

    const saleTotal = total()
    const changeAmt = paymentMethod === 'dinheiro' ? change() : 0
    setSaleResult({
      saleId: sale.id,
      saleNumber: sale.sale_number,
      total: saleTotal,
      changeAmount: changeAmt,
      items: [...items],
    })
    setLoading(false)
  }

  function handleCloseSuccess() {
    setSaleResult(null)
    setNfceOpen(false)
    clearCart()
    onClose()
    router.refresh()
  }

  // Tela de sucesso após venda
  if (saleResult) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <CheckCircle size={52} className="text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-800">Venda Finalizada!</h2>
            <p className="text-gray-500 text-sm mt-1">Venda #{saleResult.saleNumber}</p>
            <div className="my-4 bg-green-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-green-700">{formatCurrency(saleResult.total)}</p>
              {saleResult.changeAmount > 0 && (
                <p className="text-sm text-gray-600 mt-1">Troco: <strong>{formatCurrency(saleResult.changeAmount)}</strong></p>
              )}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setNfceOpen(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-green-700 text-green-700 hover:bg-green-50 py-3 rounded-xl text-sm font-bold transition-colors"
              >
                <FileText size={16} />
                Emitir NFC-e
              </button>
              <button
                onClick={handleCloseSuccess}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
        <NfceModal
          open={nfceOpen}
          onClose={() => { setNfceOpen(false); handleCloseSuccess() }}
          saleResult={{
            saleId: saleResult.saleId,
            saleNumber: saleResult.saleNumber,
            total: saleResult.total,
            changeAmount: saleResult.changeAmount,
            items: saleResult.items.map(i => ({
              product_name: i.product.name,
              quantity: i.quantity,
              unit_price: i.unit_price,
              subtotal: i.subtotal,
              product: i.product,
            })),
          }}
        />
      </>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">Finalizar Venda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Total */}
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">{items.length} item(s)</p>
            <p className="text-4xl font-bold text-green-700">{formatCurrency(total())}</p>
          </div>

          {/* Desconto / Acréscimo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Desconto (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={discount}
                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                className="input-field w-full text-green-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Acréscimo (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={surcharge}
                onChange={e => setSurcharge(parseFloat(e.target.value) || 0)}
                className="input-field w-full text-amber-600"
              />
            </div>
          </div>

          {/* Formas de pagamento */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Forma de pagamento</label>
            <div className="grid grid-cols-5 gap-1.5">
              {PAYMENT_METHODS.map(({ method, label, icon: Icon }) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                    paymentMethod === method
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Dinheiro recebido */}
          {paymentMethod === 'dinheiro' && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Valor recebido (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={amountPaid || ''}
                onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="input-field w-full text-lg font-bold"
                placeholder={formatCurrency(total())}
                autoFocus
              />
              {amountPaid >= total() && (
                <p className="text-green-600 font-semibold mt-1 text-sm">
                  Troco: {formatCurrency(change())}
                </p>
              )}
            </div>
          )}

          {/* Fiado - busca cliente */}
          {paymentMethod === 'fiado' && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Cliente (obrigatório)</label>
              {customer ? (
                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-800">{customer.name}</p>
                    <p className="text-xs text-gray-500">
                      Saldo devedor: {formatCurrency(customer.current_debt)} / Limite: {formatCurrency(customer.credit_limit)}
                    </p>
                  </div>
                  <button onClick={() => setCustomer(null)} className="text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={customerSearch}
                    onChange={e => searchCustomer(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="input-field w-full pl-8"
                  />
                  {customerResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {customerResults.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setCustomer(c); setCustomerResults([]); setCustomerSearch('') }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-0"
                        >
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-gray-400">Limite: {formatCurrency(c.credit_limit)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão finalizar */}
        <div className="p-5 pt-0">
          <button
            onClick={handleFinalize}
            disabled={loading || items.length === 0}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl text-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Check size={22} />
            {loading ? 'Processando...' : `Confirmar ${formatCurrency(total())}`}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">F10 para finalizar • Esc para cancelar</p>
        </div>
      </div>
    </div>
  )
}
