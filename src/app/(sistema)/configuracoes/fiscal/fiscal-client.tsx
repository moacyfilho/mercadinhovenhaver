'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, FileText, MapPin } from 'lucide-react'
import type { CompanyConfig } from '@/types/database'

interface Props {
  config: CompanyConfig | null
}

const REGIMES = [
  { value: 1, label: '1 — Simples Nacional' },
  { value: 2, label: '2 — Simples Nacional — Excesso' },
  { value: 3, label: '3 — Regime Normal (Lucro Presumido/Real)' },
]

function maskCnpj(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function maskCep(v: string) {
  return v.replace(/\D/g, '').slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2')
}

export function FiscalClient({ config }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    cnpj: config?.cnpj ?? '',
    razao_social: config?.razao_social ?? '',
    nome_fantasia: config?.nome_fantasia ?? '',
    ie: config?.ie ?? '',
    cnae: config?.cnae ?? '',
    regime_tributario: config?.regime_tributario ?? 1,
    cep: config?.cep ?? '',
    logradouro: config?.logradouro ?? '',
    numero: config?.numero ?? '',
    complemento: config?.complemento ?? '',
    bairro: config?.bairro ?? '',
    municipio: config?.municipio ?? '',
    uf: config?.uf ?? '',
    codigo_municipio: config?.codigo_municipio ?? '',
    telefone: config?.telefone ?? '',
    email: config?.email ?? '',
  })

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cnpj) return toast.error('CNPJ é obrigatório')
    if (!form.razao_social) return toast.error('Razão Social é obrigatória')

    setLoading(true)
    const data = { ...form }

    const { error } = config?.id
      ? await supabase.from('company_config').update(data).eq('id', config.id)
      : await supabase.from('company_config').insert(data)

    if (error) toast.error(error.message)
    else toast.success('Dados fiscais salvos!')
    setLoading(false)
  }

  async function handleBuscaCep() {
    const cep = form.cep.replace(/\D/g, '')
    if (cep.length !== 8) return toast.error('CEP inválido')
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()
    if (data.erro) return toast.error('CEP não encontrado')
    setForm(prev => ({
      ...prev,
      logradouro: data.logradouro ?? '',
      bairro: data.bairro ?? '',
      municipio: data.localidade ?? '',
      uf: data.uf ?? '',
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

      {/* Dados da Empresa */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 size={16} />
          Dados da Empresa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
            <input
              value={form.cnpj}
              onChange={e => set('cnpj', maskCnpj(e.target.value))}
              className="input-field w-full font-mono"
              placeholder="00.000.000/0001-00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual (IE)</label>
            <input
              value={form.ie}
              onChange={e => set('ie', e.target.value)}
              className="input-field w-full"
              placeholder="Ex: 123456789"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
            <input
              value={form.razao_social}
              onChange={e => set('razao_social', e.target.value)}
              className="input-field w-full"
              placeholder="Nome jurídico da empresa"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
            <input
              value={form.nome_fantasia}
              onChange={e => set('nome_fantasia', e.target.value)}
              className="input-field w-full"
              placeholder="Nome comercial"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNAE</label>
            <input
              value={form.cnae}
              onChange={e => set('cnae', e.target.value.replace(/\D/g, '').slice(0, 7))}
              className="input-field w-full font-mono"
              placeholder="4711302"
              maxLength={7}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regime Tributário</label>
            <select
              value={form.regime_tributario}
              onChange={e => set('regime_tributario', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {REGIMES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              value={form.telefone}
              onChange={e => set('telefone', e.target.value)}
              className="input-field w-full"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="input-field w-full"
              placeholder="contato@empresa.com"
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin size={16} />
          Endereço
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
            <div className="flex gap-2">
              <input
                value={form.cep}
                onChange={e => set('cep', maskCep(e.target.value))}
                className="input-field flex-1 font-mono"
                placeholder="00000-000"
              />
              <button
                type="button"
                onClick={handleBuscaCep}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
            <input value={form.logradouro} onChange={e => set('logradouro', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input value={form.numero} onChange={e => set('numero', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
            <input value={form.complemento} onChange={e => set('complemento', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input value={form.bairro} onChange={e => set('bairro', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
            <input value={form.municipio} onChange={e => set('municipio', e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
            <input value={form.uf} onChange={e => set('uf', e.target.value.toUpperCase().slice(0, 2))} className="input-field w-full font-mono" maxLength={2} placeholder="MG" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código IBGE do Município</label>
            <input
              value={form.codigo_municipio}
              onChange={e => set('codigo_municipio', e.target.value.replace(/\D/g, '').slice(0, 7))}
              className="input-field w-full font-mono"
              placeholder="3106200"
            />
          </div>
        </div>
      </div>

      {/* Aviso NFC-e */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <FileText size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Pronto para NFC-e</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Após preencher estes dados e configurar o NCM nos produtos, o sistema estará pronto para integração
            com o serviço de emissão (Focus NFe, NFe.io ou similar). Você precisará também do certificado digital A1.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60"
        >
          {loading ? 'Salvando...' : 'Salvar Dados Fiscais'}
        </button>
      </div>
    </form>
  )
}
