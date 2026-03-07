import { createClient } from "@/lib/supabase/server"
import { startOfMonth, format } from "date-fns"
import { RelatoriosClient } from "./relatorios-client"

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { tipo?: string; de?: string; ate?: string }
}) {
  const supabase = await createClient()
  const hoje = new Date()
  const tipo = searchParams.tipo ?? "vendas"
  // Para financeiro o padrão é sem filtro de data (mostra tudo)
  const de = searchParams.de ?? (tipo === "financeiro" ? "" : format(startOfMonth(hoje), "yyyy-MM-dd"))
  const ate = searchParams.ate ?? (tipo === "financeiro" ? "" : format(hoje, "yyyy-MM-dd"))

  let vendasData = null
  let financeiroData = null
  let estoqueData = null

  if (tipo === "vendas") {
    const deISO = de + "T00:00:00.000Z"
    const ateISO = ate + "T23:59:59.999Z"

    const [{ data: salesRaw }, { data: itemsRaw }] = await Promise.all([
      supabase
        .from("sales")
        .select("payment_method, total, discount, created_at")
        .eq("status", "finalizada")
        .gte("created_at", deISO)
        .lte("created_at", ateISO),
      supabase
        .from("sale_items")
        .select("product_name, quantity, subtotal, cost_price")
        .gte("created_at", deISO)
        .lte("created_at", ateISO),
    ])

    const sales = (salesRaw ?? []) as any[]
    const items = (itemsRaw ?? []) as any[]

    // Agrupar vendas por dia
    const dayMap: Record<string, any> = {}
    for (const s of sales) {
      const d = s.created_at.slice(0, 10)
      if (!dayMap[d]) dayMap[d] = { count: 0, total: 0, dinheiro: 0, pix: 0, debito: 0, credito: 0, fiado: 0, desconto: 0 }
      dayMap[d].count++
      dayMap[d].total += s.total
      dayMap[d][s.payment_method] = (dayMap[d][s.payment_method] || 0) + s.total
      dayMap[d].desconto += s.discount ?? 0
    }
    const salesByDay = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...(v as any) })) as any[]

    const totalMes: number = sales.reduce((s: number, r: any) => s + r.total, 0)
    const qtdVendas = sales.length
    const ticketMedio: number = qtdVendas > 0 ? totalMes / qtdVendas : 0
    const totalDesconto: number = sales.reduce((s: number, r: any) => s + (r.discount ?? 0), 0)

    const byPayment: Record<string, number> = {}
    for (const s of sales) byPayment[s.payment_method] = (byPayment[s.payment_method] ?? 0) + s.total

    const prodMap: Record<string, { qty: number; revenue: number; cost: number }> = {}
    for (const it of items) {
      if (!prodMap[it.product_name]) prodMap[it.product_name] = { qty: 0, revenue: 0, cost: 0 }
      prodMap[it.product_name].qty += it.quantity
      prodMap[it.product_name].revenue += it.subtotal
      prodMap[it.product_name].cost += it.cost_price * it.quantity
    }
    const topProducts = (Object.entries(prodMap) as [string, { qty: number; revenue: number; cost: number }][])
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)

    const lucroEstimado: number = Object.values(prodMap).reduce((s: number, p: any) => s + (p.revenue - p.cost), 0)
    const margemPct: number = totalMes > 0 ? (lucroEstimado / totalMes) * 100 : 0

    vendasData = { salesByDay, totalMes, qtdVendas, ticketMedio, lucroEstimado, margemPct, totalDesconto, byPayment, topProducts }
  }

  if (tipo === "financeiro") {
    const [{ data: pagarRaw }, { data: receberRaw }] = await Promise.all([
      (() => {
        let q = supabase.from("accounts_payable").select("*, supplier:suppliers(trade_name)")
        if (de) q = q.gte("due_date", de) as typeof q
        if (ate) q = q.lte("due_date", ate) as typeof q
        return q.order("due_date")
      })(),
      (() => {
        let q = supabase.from("accounts_receivable").select("*, customer:customers(name)")
        if (de) q = q.gte("due_date", de) as typeof q
        if (ate) q = q.lte("due_date", ate) as typeof q
        return q.order("due_date")
      })(),
    ])

    const pagar = (pagarRaw ?? []) as any[]
    const receber = (receberRaw ?? []) as any[]

    const pagarPendente: number = pagar.filter((a: any) => a.status === "pendente").reduce((s: number, a: any) => s + a.amount, 0)
    const pagarVencido: number = pagar.filter((a: any) => a.status === "vencido").reduce((s: number, a: any) => s + a.amount, 0)
    const receberPendente: number = receber.filter((a: any) => a.status === "pendente").reduce((s: number, a: any) => s + (a.amount - a.paid_amount), 0)
    const receberVencido: number = receber.filter((a: any) => a.status === "vencido").reduce((s: number, a: any) => s + (a.amount - a.paid_amount), 0)

    financeiroData = { pagar, receber, pagarPendente, pagarVencido, receberPendente, receberVencido }
  }

  if (tipo === "estoque") {
    const { data: prodsRaw } = await supabase
      .from("products_with_margin")
      .select("*")
      .eq("active", true)
      .order("name")

    const prods = (prodsRaw ?? []) as any[]
    const totalValue: number = prods.reduce((s: number, p: any) => s + p.cost_price * p.stock_qty, 0)
    const lowStockCount = prods.filter((p: any) => p.low_stock).length
    const zeroStockCount = prods.filter((p: any) => p.stock_qty <= 0).length

    estoqueData = { products: prods, totalValue, lowStockCount, zeroStockCount }
  }

  return (
    <RelatoriosClient
      tipo={tipo}
      de={de}
      ate={ate}
      vendasData={vendasData}
      financeiroData={financeiroData}
      estoqueData={estoqueData}
    />
  )
}
