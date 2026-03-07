import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function FornecedoresPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase.from('suppliers').select('*').order('trade_name')

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description="Cadastro de fornecedores"
        action={
          <Link href="/fornecedores/novo"
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Novo Fornecedor
          </Link>
        }
      />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">CNPJ/CPF</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(suppliers ?? []).map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{s.trade_name}</p>
                    {s.company_name && <p className="text-xs text-gray-400">{s.company_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.document ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone ?? s.whatsapp ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.contact_name ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.email ?? '-'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/fornecedores/${s.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium">
                      Ver / Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {(suppliers ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Nenhum fornecedor cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          {(suppliers ?? []).length} fornecedor(es)
        </div>
      </div>
    </div>
  )
}
