'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePdvStore } from '@/lib/stores/pdv-store'
import { Search, Barcode } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types/database'

export function PdvSearchBar() {
  const { addItem } = usePdvStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Atalho F2 para focar na busca
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    const timeout = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .or(`name.ilike.%${query}%,barcode.eq.${query},sku.ilike.%${query}%`)
        .limit(10)

      setResults(data ?? [])
      setOpen(true)
      setLoading(false)

      // Auto-seleciona se for código de barras exato
      if (data?.length === 1 && data[0].barcode === query) {
        handleSelect(data[0])
      }
    }, 200)

    return () => clearTimeout(timeout)
  }, [query])

  function handleSelect(product: Product) {
    addItem(product)
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar produto, código de barras... (F2)"
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-green-500 rounded-xl text-base focus:outline-none transition bg-white"
          autoFocus
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-80 overflow-y-auto">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-green-50 transition-colors text-left border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400">
                  {p.barcode ?? p.sku ?? 'sem código'} • Estoque: {p.stock_qty} {p.unit}
                </p>
              </div>
              <p className="text-green-700 font-bold ml-4">{formatCurrency(p.sale_price)}</p>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && query && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-4 text-center text-gray-400 text-sm">
          Produto não encontrado
        </div>
      )}
    </div>
  )
}
