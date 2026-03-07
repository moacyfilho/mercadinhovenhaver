import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return `Hoje, ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `Ontem, ${format(d, 'HH:mm')}`
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatQuantity(qty: number, unit: string): string {
  if (unit === 'kg' || unit === 'g' || unit === 'l' || unit === 'ml') {
    return `${qty.toFixed(3).replace('.', ',')} ${unit}`
  }
  return `${qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2)} ${unit}`
}

export function calcMargin(costPrice: number, salePrice: number): number {
  if (salePrice <= 0) return 0
  return ((salePrice - costPrice) / salePrice) * 100
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    pago: 'bg-green-100 text-green-800',
    vencido: 'bg-red-100 text-red-800',
    aberto: 'bg-blue-100 text-blue-800',
    fechado: 'bg-gray-100 text-gray-800',
    finalizada: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800',
    aberta: 'bg-yellow-100 text-yellow-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}

export function paymentLabel(method: string): string {
  const labels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    debito: 'Cartão Débito',
    credito: 'Cartão Crédito',
    fiado: 'Fiado',
  }
  return labels[method] ?? method
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    administrador: 'Administrador',
    gerente: 'Gerente',
    caixa: 'Caixa',
    estoquista: 'Estoquista',
  }
  return labels[role] ?? role
}

export function unitLabel(unit: string): string {
  const labels: Record<string, string> = {
    un: 'Unidade', kg: 'Quilograma', g: 'Grama',
    l: 'Litro', ml: 'Mililitro', cx: 'Caixa',
    pct: 'Pacote', dz: 'Dúzia',
  }
  return labels[unit] ?? unit
}
