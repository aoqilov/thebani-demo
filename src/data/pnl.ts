import { OPEX_CATEGORIES, ExpenseCategory, type Expense } from '@/types/accounting.types'
import type { Order, OrderItem } from '@/types/order.types'
import type { Master } from '@/types/services.types'
import { structure, STRUCTURE_LABEL, type Structure } from './analytics'

export interface PnlInput {
  /** Все закрытые счета; период отбирается по дате оплаты */
  orders: Order[]
  expenses: Expense[]
  masters: Master[]
  /** Себестоимость позиции заказа за одну штуку (по тех. карте, с модификаторами) */
  itemCost: (i: OrderItem) => number
  from: string
  to: string
}

export interface PnlResult {
  /** Выручка по источникам (до скидок и сбора за обслуживание) */
  revenue: Structure
  revenueGross: number
  discounts: number
  serviceCharge: number
  /** Итоговая выручка = валовая − скидки + сбор за обслуживание = сумма оплаченных счетов */
  revenueNet: number
  cogsKitchen: number
  cogsBar: number
  cogs: number
  masterCommission: number
  grossProfit: number
  grossMargin: number
  opex: Record<string, number>
  opexTotal: number
  operatingProfit: number
  taxes: number
  netProfit: number
  netMargin: number
  /** Сколько счетов закрыто за период */
  orders: number
}

const inRange = (d: string, from: string, to: string) => d >= from && d <= to

/** Отчёт о прибылях и убытках за период. Суммы в сумах. */
export function pnl({ orders, expenses, masters, itemCost, from, to }: PnlInput): PnlResult {
  const paid = orders.filter((o) => o.status === 'closed' && o.payment && inRange(o.payment.at.slice(0, 10), from, to))

  const revenue = structure(paid)
  const revenueGross = Object.values(revenue).reduce((s, v) => s + v, 0)
  const discounts = paid.reduce((s, o) => s + o.payment!.discount, 0)
  const serviceCharge = paid.reduce((s, o) => s + o.payment!.service, 0)
  const revenueNet = revenueGross - discounts + serviceCharge

  let cogsKitchen = 0
  let cogsBar = 0
  let masterCommission = 0
  const pct = new Map(masters.map((m) => [m.id, m.commissionPct]))
  for (const o of paid) {
    for (const i of o.items) {
      const c = itemCost(i) * i.qty
      if (i.station === 'kitchen') cogsKitchen += c
      else cogsBar += c
    }
    for (const c of o.charges) if (c.kind === 'service' && c.masterId) masterCommission += (c.amount * (pct.get(c.masterId) ?? 0)) / 100
  }
  const cogs = cogsKitchen + cogsBar
  const grossProfit = revenueNet - cogs - masterCommission

  const period = expenses.filter((e) => inRange(e.date, from, to))
  const opex: Record<string, number> = Object.fromEntries(OPEX_CATEGORIES.map((c) => [c, 0]))
  let taxes = 0
  for (const e of period) {
    if (e.category === ExpenseCategory.TAXES) taxes += e.amount
    else opex[e.category] += e.amount
  }
  const opexTotal = Object.values(opex).reduce((s, v) => s + v, 0)
  const operatingProfit = grossProfit - opexTotal
  const netProfit = operatingProfit - taxes

  return {
    revenue, revenueGross, discounts, serviceCharge, revenueNet, cogsKitchen, cogsBar, cogs, masterCommission,
    grossProfit, grossMargin: revenueNet > 0 ? (grossProfit / revenueNet) * 100 : 0,
    opex, opexTotal, operatingProfit, taxes, netProfit, netMargin: revenueNet > 0 ? (netProfit / revenueNet) * 100 : 0,
    orders: paid.length,
  }
}

export { STRUCTURE_LABEL }
