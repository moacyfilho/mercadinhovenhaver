'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { StoreSettings } from '@/types/database'

export function LojaForm({ settings }: { settings: StoreSettings | null }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: settings?.name ?? 'Mercadinho Venha Ver',
    document: settings?.document ?? '',
    phone: settings?.phone ?? '',
    address: settings?.address ?? '',
    city: settings?.city ?? '',
    state: settings?.state ?? '',
    receipt_footer: settings?.receipt_footer ?? 'Obrigado pela preferência!',
    max_discount_cashier: settings?.max_discount_cashier ?? 5,
  })

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = settings
      ? await supabase.from('store_settings').update(form).eq('id', settings.id)
      : await supabase.from('store_settings').insert(form)

    if (error) toast.error(error.message)
    else toast.success('Configurações salvas com sucesso!')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Dados da Loja</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nome da loja *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required className="input-field w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">CNPJ/CPF</label>
            <input value={form.document} onChange={e => set('document', e.target.value)} className="input-field w-full" placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Telefone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field w-full" placeholder="(00) 00000-0000" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Endereço</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} className="input-field w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Cidade</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} className="input-field w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Estado</label>
              <input value={form.state} onChange={e => set('state', e.target.value)} className="input-field w-full" maxLength={2} placeholder="SP" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Configurações do PDV</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Desconto máximo para operador Caixa (%)
            </label>
            <input
              type="number" min="0" max="100" step="0.5"
              value={form.max_discount_cashier}
              onChange={e => set('max_discount_cashier', parseFloat(e.target.value) || 0)}
              className="input-field w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Descontos acima deste % precisam de aprovação do Gerente/Admin</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Rodapé do comprovante</label>
            <textarea
              value={form.receipt_footer}
              onChange={e => set('receipt_footer', e.target.value)}
              rows={3}
              className="input-field w-full resize-none"
              placeholder="Mensagem no comprovante de venda"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60"
      >
        {loading ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </form>
  )
}
