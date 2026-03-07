'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Customer } from '@/types/database'

export function ClienteForm({ customer }: { customer?: Customer | null }) {
  const router = useRouter()
  const supabase = createClient()
  const isNew = !customer
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    document: customer?.document ?? '',
    phone: customer?.phone ?? '',
    whatsapp: customer?.whatsapp ?? '',
    email: customer?.email ?? '',
    address: customer?.address ?? '',
    city: customer?.city ?? '',
    birth_date: customer?.birth_date ?? '',
    credit_limit: customer?.credit_limit ?? 0,
    notes: customer?.notes ?? '',
    active: customer?.active ?? true,
  })

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Nome é obrigatório')
    setLoading(true)

    const data = {
      ...form,
      birth_date: form.birth_date || null,
      document: form.document || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      address: form.address || null,
      city: form.city || null,
      notes: form.notes || null,
    }

    const { error } = isNew
      ? await supabase.from('customers').insert(data)
      : await supabase.from('customers').update(data).eq('id', customer.id)

    if (error) toast.error(error.message)
    else {
      toast.success(isNew ? 'Cliente cadastrado!' : 'Cliente atualizado!')
      router.push('/clientes')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Dados do Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nome completo *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required className="input-field w-full" placeholder="Nome do cliente" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">CPF/CNPJ</label>
            <input value={form.document} onChange={e => set('document', e.target.value)} className="input-field w-full" placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Data de nascimento</label>
            <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Telefone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field w-full" placeholder="(00) 00000-0000" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">WhatsApp</label>
            <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className="input-field w-full" placeholder="(00) 00000-0000" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Limite de crédito (Fiado) R$</label>
            <input type="number" min="0" step="0.01" value={form.credit_limit}
              onChange={e => set('credit_limit', parseFloat(e.target.value) || 0)} className="input-field w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Endereço</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Cidade</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} className="input-field w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="input-field w-full resize-none" />
          </div>
          {!isNew && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-green-600" />
              <label htmlFor="active" className="text-sm text-gray-600">Cliente ativo</label>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60">
          {loading ? 'Salvando...' : isNew ? 'Cadastrar Cliente' : 'Salvar Alterações'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
