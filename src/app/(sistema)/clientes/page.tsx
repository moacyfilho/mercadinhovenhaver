import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import Link from 'next/link'
import { Plus, User, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('name')

  const inadimplentes = customers?.filter(c => c.current_debt > 0) ?? []
  const totalDevendo = inadimplentes.reduce((sum, c) => sum + c.current_debt, 0)

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes e controle de fiado"
        action={
          <Link href="/clientes/novo"
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Novo Cliente
          </Link>
        }
      />

      {inadimplentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={16} />
            <p className="text-sm font-medium">{inadimplentes.length} cliente(s) com fiado em aberto</p>
          </div>
          <p className="font-bold text-amber-700">{formatCurrency(totalDevendo)}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-3 py-2 sm:px-4 sm:py-3">Cliente</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Telefone</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Saldo Fiado</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Limite</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(customers ?? []).map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{c.name}</p>
                        {c.document && <p className="text-xs text-gray-400">{c.document}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-600">{c.phone ?? '-'}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                    <span className={c.current_debt > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}>
                      {formatCurrency(c.current_debt)}
                    </span>
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right text-gray-600">{formatCurrency(c.credit_limit)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <Link href={`/clientes/${c.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium">
                      Ver / Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {(customers ?? []).length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Nenhum cliente cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
