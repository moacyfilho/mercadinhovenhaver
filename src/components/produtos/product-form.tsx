'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency, calcMargin } from '@/lib/utils'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import type { Product, Category, Brand } from '@/types/database'

interface NcmCode { code: string; description: string }

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
  const [fiscalOpen, setFiscalOpen] = useState(false)
  const [ncmSearch, setNcmSearch] = useState('')
  const [ncmResults, setNcmResults] = useState<NcmCode[]>([])
  const [ncmLoading, setNcmLoading] = useState(false)
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
    // Fiscal
    ncm: product?.ncm ?? '',
    cfop: product?.cfop ?? '5102',
    cest: product?.cest ?? '',
    origem: product?.origem ?? 0,
    icms_cst: product?.icms_cst ?? '',
    icms_percent: product?.icms_percent ?? 0,
    pis_cst: product?.pis_cst ?? '07',
    pis_percent: product?.pis_percent ?? 0,
    cofins_cst: product?.cofins_cst ?? '07',
    cofins_percent: product?.cofins_percent ?? 0,
  })

  const margin = calcMargin(form.cost_price, form.sale_price)

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function searchNcm(q: string) {
    setNcmSearch(q)
    if (q.length < 2) { setNcmResults([]); return }
    setNcmLoading(true)
    const isCode = /^\d+$/.test(q)
    const { data } = isCode
      ? await (supabase as any).from('ncm_codes').select('code, description').ilike('code', `${q}%`).limit(8)
      : await (supabase as any).from('ncm_codes').select('code, description').ilike('description', `%${q}%`).limit(8)
    setNcmResults(data ?? [])
    setNcmLoading(false)
  }

  function selectNcm(item: NcmCode) {
    set('ncm', item.code)
    setNcmSearch('')
    setNcmResults([])
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
      ncm: form.ncm || null,
      cfop: form.cfop || null,
      cest: form.cest || null,
      icms_cst: form.icms_cst || null,
      pis_cst: form.pis_cst || null,
      cofins_cst: form.cofins_cst || null,
    }

    const { error } = isNew
      ? await (supabase as any).from('products').insert(data)
      : await (supabase as any).from('products').update(data).eq('id', product!.id)

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

      {/* Dados Fiscais */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setFiscalOpen(v => !v)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div>
            <h2 className="text-base font-semibold text-gray-800">Dados Fiscais (NFC-e)</h2>
            <p className="text-xs text-gray-500 mt-0.5">NCM, CFOP, PIS, COFINS, ICMS — necessário para emissão de nota fiscal</p>
          </div>
          {fiscalOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {fiscalOpen && (
          <div className="px-6 pb-6 border-t border-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NCM <span className="text-gray-400 font-normal">(código ou descrição do produto)</span>
                </label>

                {/* Campo NCM selecionado */}
                {form.ncm ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="font-mono font-bold text-green-800 text-sm">{form.ncm}</span>
                    <button type="button" onClick={() => { set('ncm', ''); setNcmSearch('') }}
                      className="ml-auto text-xs text-red-500 hover:text-red-700 underline">
                      alterar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={ncmSearch}
                        onChange={e => searchNcm(e.target.value)}
                        placeholder="Buscar por código (ex: 0401) ou produto (ex: leite, arroz, café)..."
                        className="input-field w-full pl-9"
                        autoComplete="off"
                      />
                      {ncmLoading && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">buscando...</span>
                      )}
                    </div>
                    {ncmResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                        {ncmResults.map(item => (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => selectNcm(item)}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b last:border-0 flex items-start gap-3"
                          >
                            <span className="font-mono text-sm font-bold text-blue-700 shrink-0 mt-0.5">{item.code}</span>
                            <span className="text-sm text-gray-700 leading-tight">{item.description}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {ncmSearch.length >= 2 && ncmResults.length === 0 && !ncmLoading && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow p-3 z-20">
                        <p className="text-sm text-gray-500">Nenhum NCM encontrado. Digite o código manualmente:</p>
                        <input
                          type="text"
                          value={form.ncm}
                          onChange={e => set('ncm', e.target.value.replace(/\D/g, '').slice(0, 8))}
                          className="input-field w-full mt-2 font-mono"
                          placeholder="00000000"
                          maxLength={8}
                        />
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  NCM é obrigatório para emissão de NFC-e
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CFOP</label>
                <input
                  value={form.cfop}
                  onChange={e => set('cfop', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field w-full font-mono"
                  placeholder="5102"
                  maxLength={4}
                />
                <p className="text-xs text-gray-400 mt-0.5">5102 = venda de mercadoria</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEST <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input
                  value={form.cest}
                  onChange={e => set('cest', e.target.value.replace(/\D/g, '').slice(0, 7))}
                  className="input-field w-full font-mono"
                  placeholder="0000000"
                  maxLength={7}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origem da mercadoria</label>
                <select value={form.origem} onChange={e => set('origem', parseInt(e.target.value))} className="input-field w-full">
                  <option value={0}>0 — Nacional</option>
                  <option value={1}>1 — Estrangeira (importação direta)</option>
                  <option value={2}>2 — Estrangeira (adquirida no mercado interno)</option>
                  <option value={3}>3 — Nacional com mais de 40% de conteúdo estrangeiro</option>
                  <option value={4}>4 — Nacional (prod. básicos)</option>
                  <option value={5}>5 — Nacional com até 40% de conteúdo estrangeiro</option>
                  <option value={6}>6 — Estrangeira (importação direta, sem similar nacional)</option>
                  <option value={7}>7 — Estrangeira (mercado interno, sem similar nacional)</option>
                  <option value={8}>8 — Nacional com 70%+ de conteúdo estrangeiro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICMS CST/CSOSN</label>
                <input
                  value={form.icms_cst}
                  onChange={e => set('icms_cst', e.target.value.slice(0, 3))}
                  className="input-field w-full font-mono"
                  placeholder="400 ou 102"
                  maxLength={3}
                />
                <p className="text-xs text-gray-400 mt-0.5">400=Simples / 00=Normal</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota ICMS (%)</label>
                <input
                  type="number" step="0.01" min="0" max="100"
                  value={form.icms_percent}
                  onChange={e => set('icms_percent', parseFloat(e.target.value) || 0)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIS CST</label>
                <input
                  value={form.pis_cst}
                  onChange={e => set('pis_cst', e.target.value.replace(/\D/g, '').slice(0, 2))}
                  className="input-field w-full font-mono"
                  placeholder="07"
                  maxLength={2}
                />
                <p className="text-xs text-gray-400 mt-0.5">07=Simples Nacional</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota PIS (%)</label>
                <input
                  type="number" step="0.01" min="0" max="100"
                  value={form.pis_percent}
                  onChange={e => set('pis_percent', parseFloat(e.target.value) || 0)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">COFINS CST</label>
                <input
                  value={form.cofins_cst}
                  onChange={e => set('cofins_cst', e.target.value.replace(/\D/g, '').slice(0, 2))}
                  className="input-field w-full font-mono"
                  placeholder="07"
                  maxLength={2}
                />
                <p className="text-xs text-gray-400 mt-0.5">07=Simples Nacional</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota COFINS (%)</label>
                <input
                  type="number" step="0.01" min="0" max="100"
                  value={form.cofins_percent}
                  onChange={e => set('cofins_percent', parseFloat(e.target.value) || 0)}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>
        )}
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
