import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { ProductTable } from '@/components/produtos/product-table'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ProdutosPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products_with_margin')
    .select('*')
    .order('name')

  const { data: categories } = await supabase.from('categories').select('*').order('name')
  const { data: brands } = await supabase.from('brands').select('*').order('name')

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Gerencie o catálogo de produtos da loja"
        action={
          <Link
            href="/produtos/novo"
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Novo Produto
          </Link>
        }
      />
      <ProductTable
        products={products ?? []}
        categories={categories ?? []}
        brands={brands ?? []}
      />
    </div>
  )
}
