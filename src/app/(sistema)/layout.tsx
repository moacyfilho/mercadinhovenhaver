import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SistemaLayout } from './sistema-layout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { count: lowStockCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('products_with_margin')
      .select('*', { count: 'exact', head: true })
      .eq('low_stock', true)
      .eq('active', true),
  ])

  return (
    <SistemaLayout profile={profile} lowStockCount={lowStockCount ?? 0}>
      {children}
    </SistemaLayout>
  )
}
