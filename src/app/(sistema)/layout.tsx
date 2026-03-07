import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SistemaLayout } from './sistema-layout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <SistemaLayout profile={profile}>{children}</SistemaLayout>
}
