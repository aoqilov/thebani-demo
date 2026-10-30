import type { Order } from '@/types/order.types'
import { orderTotal } from '@/types/order.types'

export interface CashierStat {
  id: number
  name: string
  orders: number
  /** Принято по закрытым счетам, сум */
  revenue: number
  avgCheck: number
  discount: number
  /** Доля скидок от суммы до скидки, % */
  discountPct: number
  cash: number
  cashless: number
}

export interface WaiterStat {
  id: number
  name: string
  orders: number
  guests: number
  /** Продано блюд и напитков, сум */
  sales: number
  avgOrder: number
  avgPerGuest: number
  /** Сбор за обслуживание по счетам официанта */
  service: number
}

const paidIn = (orders: Order[], from: string, to: string) =>
  orders.filter((o) => o.status === 'closed' && o.payment && o.payment.at.slice(0, 10) >= from && o.payment.at.slice(0, 10) <= to)

export function cashierStats(orders: Order[], from: string, to: string): CashierStat[] {
  const m = new Map<string, Omit<CashierStat, 'id' | 'avgCheck' | 'discountPct'> & { subtotal: number }>()
  for (const o of paidIn(orders, from, to)) {
    const p = o.payment!
    const c = m.get(p.cashier) ?? { name: p.cashier, orders: 0, revenue: 0, discount: 0, cash: 0, cashless: 0, subtotal: 0 }
    c.orders += 1
    c.revenue += p.total
    c.discount += p.discount
    c.subtotal += p.subtotal
    for (const l of p.lines) c[l.method === 'cash' ? 'cash' : 'cashless'] += l.amount
    m.set(p.cashier, c)
  }
  return [...m.values()]
    .map((c, i) => ({ id: i + 1, name: c.name, orders: c.orders, revenue: c.revenue, avgCheck: c.orders ? c.revenue / c.orders : 0, discount: c.discount, discountPct: c.subtotal > 0 ? (c.discount / c.subtotal) * 100 : 0, cash: c.cash, cashless: c.cashless }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function waiterStats(orders: Order[], from: string, to: string): WaiterStat[] {
  const m = new Map<string, Omit<WaiterStat, 'id' | 'avgOrder' | 'avgPerGuest'>>()
  for (const o of paidIn(orders, from, to)) {
    // счета без блюд (только тариф) официанту не засчитываем
    if (o.items.length === 0) continue
    const w = m.get(o.waiter) ?? { name: o.waiter, orders: 0, guests: 0, sales: 0, service: 0 }
    w.orders += 1
    w.guests += o.guests
    w.sales += orderTotal(o)
    w.service += o.payment!.service
    m.set(o.waiter, w)
  }
  return [...m.values()]
    .map((w, i) => ({ id: i + 1, ...w, avgOrder: w.orders ? w.sales / w.orders : 0, avgPerGuest: w.guests ? w.sales / w.guests : 0 }))
    .sort((a, b) => b.sales - a.sales)
}
