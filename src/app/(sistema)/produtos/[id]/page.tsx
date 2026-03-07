import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { ProductForm } from '@/components/produtos/product-form'
import { notFound } from 'next/navigation'

export default async function ProdutoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const isNew = params.id === 'novo'

  let product = null
  if (!isNew) {
    const { data } = await supabase.from('products').select('*').eq('id', params.id).single()
    if (!data) notFound()
    product = data
  }

  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('brands').select('*').order('name'),
  ])

  return (
    <div>
      <PageHeader
        title={isNew ? 'Novo Produto' : 'Editar Produto'}
        description={isNew ? 'Cadastre um novo produto no sistema' : product?.name}
      />
      <ProductForm product={product} categories={categories ?? []} brands={brands ?? []} />
    </div>
  )
}
