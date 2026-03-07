import { createClient } from '@/lib/supabase/server'
import { PdvClient } from './pdv-client'

export default async function PdvPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca caixa aberto do usuário
  const { data: cashRegister } = await supabase
    .from('cash_registers')
    .select('*')
    .eq('user_id', user!.id)
    .eq('status', 'aberto')
    .single()

  // Busca produtos ativos para o grid
  const { data: products } = await supabase
    .from('products_with_margin')
    .select('*')
    .eq('active', true)
    .order('name')
    .limit(200)

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <PdvClient
      cashRegister={cashRegister}
      products={products ?? []}
      categories={categories ?? []}
    />
  )
}
