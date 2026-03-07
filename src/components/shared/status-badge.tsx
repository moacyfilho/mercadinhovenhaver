import { cn, getStatusColor } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  vencido: 'Vencido',
  aberto: 'Aberto',
  fechado: 'Fechado',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
  aberta: 'Aberta',
  ativo: 'Ativo',
  inativo: 'Inativo',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      getStatusColor(status)
    )}>
      {statusLabels[status] ?? status}
    </span>
  )
}
