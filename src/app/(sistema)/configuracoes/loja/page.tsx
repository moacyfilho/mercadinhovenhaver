import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { LojaForm } from './loja-form'

export default async function LojaPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('store_settings').select('*').single()

  return (
    <div>
      <PageHeader
        title="Configurações da Loja"
        description="Dados da loja e preferências do sistema"
      />
      <LojaForm settings={settings} />
    </div>
  )
}
