'use client'

import { usePdvStore } from '@/lib/stores/pdv-store'
import { formatCurrency } from '@/lib/utils'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'

export function PdvCart() {
  const { items, updateQty, removeItem, subtotal, discount, surcharge, total } = usePdvStore()

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
        <ShoppingCart size={48} strokeWidth={1} />
        <p className="mt-3 text-sm">Carrinho vazio</p>
        <p className="text-xs mt-1">Busque ou escaneie um produto</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Itens */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {items.map(item => (
          <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 leading-tight flex-1">{item.product.name}</p>
              <button
                onClick={() => removeItem(item.product.id)}
                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2">
              {/* Controle de quantidade */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.product.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Minus size={12} />
                </button>
                <input
                  type="number"
                  min="0.001"
                  step="1"
                  value={item.quantity}
                  onChange={e => updateQty(item.product.id, parseFloat(e.target.value) || 0)}
                  className="w-14 text-center border border-gray-200 rounded-lg py-0.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <button
                  onClick={() => updateQty(item.product.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                <p className="font-bold text-green-700">{formatCurrency(item.subtotal)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totais */}
      <div className="border-t border-gray-200 pt-3 mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal())}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Desconto</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        {surcharge > 0 && (
          <div className="flex justify-between text-amber-600">
            <span>Acréscimo</span>
            <span>+{formatCurrency(surcharge)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg text-gray-900 pt-1 border-t border-gray-200">
          <span>TOTAL</span>
          <span className="text-green-700">{formatCurrency(total())}</span>
        </div>
      </div>
    </div>
  )
}
