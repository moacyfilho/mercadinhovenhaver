import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { CaixaClient } from './caixa-client'

export default async function CaixaPage() {
  const supabase = await createClient()

  const { data: registers } = await supabase
    .from('cash_registers')
    .select('*, user:profiles(name)')
    .order('opened_at', { ascending: false })
    .limit(30)

  return (
    <div>
      <PageHeader
        title="Controle de Caixa"
        description="Histórico de abertura e fechamento de caixas"
      />
      <CaixaClient registers={(registers ?? []) as any} />
    </div>
  )
}
