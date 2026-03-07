'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck,
  CreditCard, TrendingDown, TrendingUp, BarChart3,
  Settings, DollarSign, ChevronRight, X
} from 'lucide-react'

const menu = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pdv', label: 'PDV', icon: ShoppingCart, highlight: true },
  {
    label: 'Estoque',
    icon: Package,
    children: [
      { href: '/estoque', label: 'Visão Geral' },
      { href: '/estoque/movimentacoes', label: 'Movimentações' },
    ],
  },
  {
    label: 'Cadastros',
    icon: Users,
    children: [
      { href: '/produtos', label: 'Produtos' },
      { href: '/clientes', label: 'Clientes' },
      { href: '/fornecedores', label: 'Fornecedores' },
    ],
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    children: [
      { href: '/financeiro/caixa', label: 'Controle de Caixa' },
      { href: '/financeiro/contas-pagar', label: 'Contas a Pagar' },
      { href: '/financeiro/contas-receber', label: 'Contas a Receber' },
    ],
  },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/configuracoes/loja', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-green-900 text-white z-30 transition-transform duration-300 flex flex-col',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <div>
              <p className="font-bold text-sm leading-tight">Venha Ver</p>
              <p className="text-green-400 text-xs">Gestão</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-green-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menu.map((item, i) => {
            if (item.children) {
              const isGroupActive = item.children.some(c => pathname.startsWith(c.href))
              return (
                <div key={i}>
                  <div className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-green-300 mt-2 mb-1',
                  )}>
                    <item.icon size={16} />
                    {item.label}
                  </div>
                  <div className="ml-4 space-y-1">
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          'block px-3 py-2 rounded-lg text-sm transition-colors',
                          pathname === child.href || pathname.startsWith(child.href + '/')
                            ? 'bg-green-700 text-white font-medium'
                            : 'text-green-200 hover:bg-green-800 hover:text-white'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  item.highlight
                    ? 'bg-amber-500 hover:bg-amber-600 text-white mt-2'
                    : pathname === item.href
                    ? 'bg-green-700 text-white'
                    : 'text-green-200 hover:bg-green-800 hover:text-white'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
