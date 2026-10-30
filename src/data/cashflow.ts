import type { Expense } from '@/types/accounting.types'
import type { Order, PayMethod } from '@/types/order.types'
import type { PurchaseRow } from './purchases'

export interface CashflowDay {
  id: number
  date: string
  /** Поступления по способам оплаты (наличные — за вычетом сдачи) */
  inflow: Record<PayMethod, number>
  inTotal: number
  expenses: number
  purchases: number
  outTotal: number
  net: number
  /** Чистый поток нарастающим итогом с начала периода */
  running: number
}

export interface CashflowResult {
  days: CashflowDay[]
  byMethod: Record<PayMethod, number>
  inTotal: number
  /** Выплаты по статьям журнала расходов */
  byCategory: Record<string, number>
  expensesTotal: number
  purchasesTotal: number
  outTotal: number
  net: number
}

const MAX_DAYS = 366

/**
 * Отчёт о движении денежных средств (ОДДС): поступления от гостей по способам оплаты
 * против выплат — журнал расходов и закупки у поставщиков (по дате накладной).
 */
export function cashflow(orders: Order[], expenses: Expense[], purchases: PurchaseRow[], from: string, to: string): CashflowResult {
  const emptyIn = (): Record<PayMethod, number> => ({ cash: 0, uzcard: 0, humo: 0, online: 0 })
  const map = new Map<string, CashflowDay>()
  const day = (date: string): CashflowDay => {
    let d = map.get(date)
    if (!d) {
      d = { id: 0, date, inflow: emptyIn(), inTotal: 0, expenses: 0, purchases: 0, outTotal: 0, net: 0, running: 0 }
      map.set(date, d)
    }
    return d
  }

  const byMethod = emptyIn()
  const byCategory: Record<string, number> = {}

  for (const o of orders) {
    if (o.status !== 'closed' || !o.payment) continue
    const date = o.payment.at.slice(0, 10)
    if (date < from || date > to) continue
    const d = day(date)
    for (const l of o.payment.lines) {
      d.inflow[l.method] += l.amount
      d.inTotal += l.amount
      byMethod[l.method] += l.amount
    }
  }
  for (const e of expenses) {
    if (e.date < from || e.date > to) continue
    const d = day(e.date)
    d.expenses += e.amount
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
  }
  for (const p of purchases) {
    if (p.date < from || p.date > to) continue
    day(p.date).purchases += p.sum
  }

  // Каждый день периода, даже без движений — график и таблица без «дыр»
  const days: CashflowDay[] = []
  let running = 0
  const end = new Date(to).getTime()
  const start = Math.max(new Date(from).getTime(), end - (MAX_DAYS - 1) * 86_400_000)
  for (let t = start, i = 1; t <= end; t += 86_400_000, i++) {
    const date = new Date(t).toISOString().slice(0, 10)
    const d = day(date)
    d.id = i
    d.outTotal = d.expenses + d.purchases
    d.net = d.inTotal - d.outTotal
    running += d.net
    d.running = running
    days.push(d)
  }

  const inTotal = days.reduce((s, d) => s + d.inTotal, 0)
  const expensesTotal = days.reduce((s, d) => s + d.expenses, 0)
  const purchasesTotal = days.reduce((s, d) => s + d.purchases, 0)
  return { days, byMethod, inTotal, byCategory, expensesTotal, purchasesTotal, outTotal: expensesTotal + purchasesTotal, net: inTotal - expensesTotal - purchasesTotal }
}
