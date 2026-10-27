import { chargesTotal, orderTotal, type Order, type PaymentLine } from '@/types/order.types'

/** Обслуживание на кухню и бар, % (по данным thebani.uz/menu). На тариф и услуги не начисляется. */
export const SERVICE_PCT = 20

export interface BillTotals {
  subtotal: number
  discount: number
  service: number
  total: number
}

/** Итог счёта: тариф + услуги + блюда − скидка + обслуживание. */
export function billTotals(order: Pick<Order, 'items' | 'charges'>, discount: number, serviceOn: boolean): BillTotals {
  const subtotal = orderTotal(order) + chargesTotal(order)
  const d = Math.min(Math.max(discount, 0), subtotal)
  const after = subtotal - d
  // обслуживание считается только с суммы блюд и напитков (за вычетом доли скидки)
  const items = orderTotal(order)
  const itemsAfter = subtotal > 0 ? items * (after / subtotal) : 0
  const service = serviceOn ? Math.round((itemsAfter * SERVICE_PCT) / 100) : 0
  return { subtotal, discount: d, service, total: after + service }
}

export interface PaymentCheck {
  received: number
  change: number
  /** Сколько ещё нужно принять */
  remaining: number
  error: string | null
}

/** Проверка введённой оплаты: безнал не может превышать сумму, сдача возможна только с наличных. */
export function checkPayment(total: number, lines: PaymentLine[]): PaymentCheck {
  const received = lines.reduce((s, l) => s + l.amount, 0)
  const cash = lines.filter((l) => l.method === 'cash').reduce((s, l) => s + l.amount, 0)
  const nonCash = received - cash
  const remaining = Math.max(total - received, 0)
  const change = Math.max(received - total, 0)
  let error: string | null = null
  if (nonCash > total) error = 'Безналичная оплата не может быть больше суммы счёта.'
  else if (change > cash) error = 'Сдачу можно выдать только с наличных.'
  return { received, change, remaining, error }
}
