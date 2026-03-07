import { create } from 'zustand'
import type { Product, Customer, PaymentMethod } from '@/types/database'

export interface CartItem {
  product: Product
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
}

interface PdvStore {
  // Caixa
  cashRegisterId: string | null
  setCashRegisterId: (id: string | null) => void

  // Carrinho
  items: CartItem[]
  addItem: (product: Product, qty?: number) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  applyItemDiscount: (productId: string, discount: number) => void
  clearCart: () => void

  // Cliente
  customer: Customer | null
  setCustomer: (customer: Customer | null) => void

  // Desconto/Acréscimo geral
  discount: number
  surcharge: number
  setDiscount: (v: number) => void
  setSurcharge: (v: number) => void

  // Forma de pagamento
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  amountPaid: number
  setAmountPaid: (v: number) => void

  // Computed
  subtotal: () => number
  total: () => number
  change: () => number
}

export const usePdvStore = create<PdvStore>((set, get) => ({
  cashRegisterId: null,
  setCashRegisterId: id => set({ cashRegisterId: id }),

  items: [],
  addItem: (product, qty = 1) => {
    set(state => {
      const existing = state.items.find(i => i.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map(i =>
            i.product.id === product.id
              ? {
                  ...i,
                  quantity: i.quantity + qty,
                  subtotal: (i.quantity + qty) * i.unit_price - i.discount,
                }
              : i
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            product,
            quantity: qty,
            unit_price: product.sale_price,
            discount: 0,
            subtotal: product.sale_price * qty,
          },
        ],
      }
    })
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId)
      return
    }
    set(state => ({
      items: state.items.map(i =>
        i.product.id === productId
          ? { ...i, quantity: qty, subtotal: qty * i.unit_price - i.discount }
          : i
      ),
    }))
  },

  removeItem: productId =>
    set(state => ({ items: state.items.filter(i => i.product.id !== productId) })),

  applyItemDiscount: (productId, discount) =>
    set(state => ({
      items: state.items.map(i =>
        i.product.id === productId
          ? { ...i, discount, subtotal: i.quantity * i.unit_price - discount }
          : i
      ),
    })),

  clearCart: () =>
    set({ items: [], customer: null, discount: 0, surcharge: 0, amountPaid: 0, paymentMethod: 'dinheiro' }),

  customer: null,
  setCustomer: customer => set({ customer }),

  discount: 0,
  surcharge: 0,
  setDiscount: discount => set({ discount }),
  setSurcharge: surcharge => set({ surcharge }),

  paymentMethod: 'dinheiro',
  setPaymentMethod: paymentMethod => set({ paymentMethod }),
  amountPaid: 0,
  setAmountPaid: amountPaid => set({ amountPaid }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
  total: () => {
    const sub = get().subtotal()
    return Math.max(0, sub - get().discount + get().surcharge)
  },
  change: () => Math.max(0, get().amountPaid - get().total()),
}))
