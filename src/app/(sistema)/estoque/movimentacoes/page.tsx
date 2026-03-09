import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { MovimentacoesClient } from './movimentacoes-client'

export default async function MovimentacoesPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: suppliers }, { data: pendingNotes }, { data: recentMovements }] =
    await Promise.all([
      supabase.from('products').select('id, name, unit, stock_qty, cost_price').eq('active', true).order('name'),
      supabase.from('suppliers').select('id, trade_name').eq('active', true).order('trade_name'),
      (supabase as any).from('stock_notes').select('*, supplier:suppliers(trade_name)').eq('status', 'rascunho').order('created_at', { ascending: false }),
      supabase.from('stock_movements')
        .select('*, product:products(name, unit)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

  return (
    <div>
      <PageHeader
        title="Entrada, Saída e Ajuste de Estoque"
        description="Registre movimentações de estoque com ou sem nota fiscal"
      />
      <MovimentacoesClient
        products={products ?? []}
        suppliers={suppliers ?? []}
        pendingNotes={(pendingNotes ?? []) as any[]}
        recentMovements={(recentMovements ?? []) as any[]}
      />
    </div>
  )
}
