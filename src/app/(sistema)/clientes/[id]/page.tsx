import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ClienteForm } from './cliente-form'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default async function ClientePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const isNew = params.id === 'novo'
  let customer = null

  if (!isNew) {
    const { data } = await supabase.from('customers').select('*').eq('id', params.id).single()
    if (!data) notFound()
    customer = data
  }

  const { data: sales } = isNew ? { data: null } : await supabase
    .from('sales')
    .select('id, sale_number, total, payment_method, created_at, status')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: receivables } = isNew ? { data: null } : await supabase
    .from('accounts_receivable')
    .select('*')
    .eq('customer_id', params.id)
    .eq('status', 'pendente')

  return (
    <div>
      <PageHeader
        title={isNew ? 'Novo Cliente' : customer?.name ?? 'Cliente'}
        description={isNew ? 'Cadastre um novo cliente' : 'Ficha do cliente'}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ClienteForm customer={customer} />
        </div>

        {!isNew && (
          <div className="space-y-4">
            {/* Situação financeira */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Situação Financeira</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Saldo devedor</span>
                  <span className={`font-bold ${(customer?.current_debt ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(customer?.current_debt ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Limite de crédito</span>
                  <span className="font-semibold">{formatCurrency(customer?.credit_limit ?? 0)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Disponível</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(Math.max(0, (customer?.credit_limit ?? 0) - (customer?.current_debt ?? 0)))}
                  </span>
                </div>
              </div>
            </div>

            {/* Fiados pendentes */}
            {receivables && receivables.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                <h3 className="font-semibold text-red-700 mb-3 text-sm">Fiados em Aberto</h3>
                <div className="space-y-2">
                  {receivables.map(r => (
                    <div key={r.id} className="flex justify-between text-sm py-1 border-b border-red-100 last:border-0">
                      <span className="text-gray-600">{r.description}</span>
                      <span className="font-bold text-red-600">{formatCurrency(r.amount - r.paid_amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de compras */}
            {sales && sales.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Últimas Compras</h3>
                <div className="space-y-2">
                  {sales.map(s => (
                    <div key={s.id} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-medium text-gray-700">Venda #{s.sale_number}</p>
                        <p className="text-gray-400">{formatDateTime(s.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">{formatCurrency(s.total)}</p>
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
