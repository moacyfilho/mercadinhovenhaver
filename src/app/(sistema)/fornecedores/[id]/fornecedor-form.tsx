'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'

export function FornecedorForm({ supplier }: { supplier?: Supplier | null }) {
  const router = useRouter()
  const supabase = createClient()
  const isNew = !supplier
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    trade_name: supplier?.trade_name ?? '',
    company_name: supplier?.company_name ?? '',
    document: supplier?.document ?? '',
    phone: supplier?.phone ?? '',
    whatsapp: supplier?.whatsapp ?? '',
    email: supplier?.email ?? '',
    address: supplier?.address ?? '',
    city: supplier?.city ?? '',
    state: supplier?.state ?? '',
    zip_code: supplier?.zip_code ?? '',
    contact_name: supplier?.contact_name ?? '',
    notes: supplier?.notes ?? '',
    active: supplier?.active ?? true,
  })

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.trade_name.trim()) return toast.error('Nome fantasia é obrigatório')
    setLoading(true)

    const data = {
      ...form,
      company_name: form.company_name || null,
      document: form.document || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zip_code: form.zip_code || null,
      contact_name: form.contact_name || null,
      notes: form.notes || null,
    }

    const { error } = isNew
      ? await supabase.from('suppliers').insert(data)
      : await supabase.from('suppliers').update(data).eq('id', supplier.id)

    if (error) toast.error(error.message)
    else {
      toast.success(isNew ? 'Fornecedor cadastrado!' : 'Fornecedor atualizado!')
      router.push('/fornecedores')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Dados do Fornecedor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nome fantasia *</label>
            <input value={form.trade_name} onChange={e => set('trade_name', e.target.value)} required className="input-field w-full" placeholder="Nome do fornecedor" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Razão social</label>
            <input value={form.company_name} onChange={e => set('company_name', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">CNPJ/CPF</label>
            <input value={form.document} onChange={e => set('document', e.target.value)} className="input-field w-full" placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Contato responsável</label>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Telefone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field w-full" placeholder="(00) 0000-0000" />
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
            <label className="text-sm font-medium text-gray-700 mb-1 block">CEP</label>
            <input value={form.zip_code} onChange={e => set('zip_code', e.target.value)} className="input-field w-full" placeholder="00000-000" />
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
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="input-field w-full resize-none" />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60">
          {loading ? 'Salvando...' : isNew ? 'Cadastrar Fornecedor' : 'Salvar Alterações'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
