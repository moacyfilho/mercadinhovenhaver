'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { X, CheckCircle, AlertTriangle, FileText, ExternalLink } from 'lucide-react'
import type { Product } from '@/types/database'

interface SaleItem {
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  product?: Product
}

interface SaleResult {
  saleId: string
  saleNumber: number
  total: number
  changeAmount: number
  items: SaleItem[]
}

interface Props {
  open: boolean
  onClose: () => void
  saleResult: SaleResult | null
}

export function NfceModal({ open, onClose, saleResult }: Props) {
  const supabase = createClient()
  const [checking, setChecking] = useState(true)
  const [hasCompanyConfig, setHasCompanyConfig] = useState(false)
  const [itemsWithoutNcm, setItemsWithoutNcm] = useState<string[]>([])

  useEffect(() => {
    if (!open || !saleResult) return
    checkFiscalData()
  }, [open, saleResult])

  async function checkFiscalData() {
    setChecking(true)

    // Verificar se company_config existe
    const { data: config } = await supabase
      .from('company_config')
      .select('id, cnpj, razao_social')
      .limit(1)
      .single()
    setHasCompanyConfig(!!config?.cnpj)

    // Verificar produtos sem NCM
    if (saleResult?.items) {
      const productIds = saleResult.items
        .filter(i => (i.product as any)?.id)
        .map(i => (i.product as any).id)

      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, ncm')
          .in('id', productIds)

        const semNcm = (products ?? [])
          .filter(p => !p.ncm)
          .map(p => p.name)
        setItemsWithoutNcm(semNcm)
      }
    }

    setChecking(false)
  }

  if (!open || !saleResult) return null

  const isReady = hasCompanyConfig && itemsWithoutNcm.length === 0
  const hasFocusNfeToken = !!process.env.NEXT_PUBLIC_FOCUS_NFE_TOKEN

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText size={18} className="text-green-700" />
            Emitir NFC-e
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {checking ? (
            <div className="text-center py-6 text-gray-400 text-sm">Verificando dados fiscais...</div>
          ) : (
            <>
              {/* Resumo da venda */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Venda #{saleResult.saleNumber}</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(saleResult.total)}</p>
                <div className="mt-2 space-y-0.5">
                  {saleResult.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist fiscal */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Verificação Fiscal</p>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${hasCompanyConfig ? 'bg-green-50' : 'bg-amber-50'}`}>
                  {hasCompanyConfig
                    ? <CheckCircle size={16} className="text-green-600 shrink-0" />
                    : <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  }
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${hasCompanyConfig ? 'text-green-800' : 'text-amber-800'}`}>
                      Dados da empresa
                    </p>
                    {!hasCompanyConfig && (
                      <p className="text-xs text-amber-700 mt-0.5">
                        Configure em <strong>Configurações → Dados Fiscais</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${itemsWithoutNcm.length === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
                  {itemsWithoutNcm.length === 0
                    ? <CheckCircle size={16} className="text-green-600 shrink-0" />
                    : <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  }
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${itemsWithoutNcm.length === 0 ? 'text-green-800' : 'text-amber-800'}`}>
                      NCM dos produtos
                    </p>
                    {itemsWithoutNcm.length > 0 && (
                      <p className="text-xs text-amber-700 mt-0.5">
                        Sem NCM: {itemsWithoutNcm.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${hasFocusNfeToken ? 'bg-green-50' : 'bg-blue-50'}`}>
                  {hasFocusNfeToken
                    ? <CheckCircle size={16} className="text-green-600 shrink-0" />
                    : <FileText size={16} className="text-blue-600 shrink-0" />
                  }
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${hasFocusNfeToken ? 'text-green-800' : 'text-blue-800'}`}>
                      Serviço NFe (Focus NFe)
                    </p>
                    {!hasFocusNfeToken && (
                      <p className="text-xs text-blue-700 mt-0.5">
                        Contrate o serviço e adicione o token nas configurações
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Resultado */}
              {isReady && hasFocusNfeToken ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-800">Pronto para emitir!</p>
                  <p className="text-xs text-green-700 mt-1">Integração configurada — clique para emitir.</p>
                  <button className="mt-3 bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors w-full">
                    Emitir NFC-e
                  </button>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-1">Próximos passos</p>
                  <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    {!hasCompanyConfig && <li>Preencher dados fiscais da empresa</li>}
                    {itemsWithoutNcm.length > 0 && <li>Cadastrar NCM nos produtos</li>}
                    {!hasFocusNfeToken && <li>Contratar serviço NFe (Focus NFe ou similar)</li>}
                    {!hasFocusNfeToken && <li>Configurar token do serviço no sistema</li>}
                  </ol>
                  <a
                    href="https://focusnfe.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-medium"
                  >
                    <ExternalLink size={12} />
                    Conhecer o Focus NFe →
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
