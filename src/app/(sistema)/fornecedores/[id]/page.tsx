import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { FornecedorForm } from './fornecedor-form'
import { notFound } from 'next/navigation'

export default async function FornecedorPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const isNew = params.id === 'novo'
  let supplier = null

  if (!isNew) {
    const { data } = await supabase.from('suppliers').select('*').eq('id', params.id).single()
    if (!data) notFound()
    supplier = data
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'Novo Fornecedor' : supplier?.trade_name ?? 'Fornecedor'}
        description={isNew ? 'Cadastre um novo fornecedor' : 'Editar dados do fornecedor'}
      />
      <FornecedorForm supplier={supplier} />
    </div>
  )
}
