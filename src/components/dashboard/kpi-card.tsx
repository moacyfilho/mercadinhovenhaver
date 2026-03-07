import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: 'green' | 'blue' | 'amber' | 'red' | 'purple'
  trend?: { value: number; label: string }
}

const colorMap = {
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-700', value: 'text-green-700' },
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-700', value: 'text-blue-700' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-700', value: 'text-amber-700' },
  red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-700', value: 'text-red-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-700', value: 'text-purple-700' },
}

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'green', trend }: KpiCardProps) {
  const colors = colorMap[color]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', colors.value)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
