import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { FiscalClient } from './fiscal-client'

export default async function FiscalPage() {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('company_config')
    .select('*')
    .limit(1)
    .single()

  return (
    <div>
      <PageHeader
        title="Dados Fiscais (NFC-e)"
        description="Configure os dados da empresa para emissão de nota fiscal eletrônica"
      />
      <FiscalClient config={config ?? null} />
    </div>
  )
}
