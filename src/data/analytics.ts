import type { Order, PayMethod } from '@/types/order.types'

export const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

/** Закрытые сегодня счета. */
export const closedToday = (orders: Order[]) => orders.filter((o) => o.status === 'closed' && o.payment && o.payment.at >= startOfToday())

export interface Structure {
  tariffs: number
  services: number
  goods: number
  fines: number
  kitchen: number
  bar: number
}

/** Из чего сложилась выручка (до скидок и обслуживания). */
export function structure(orders: Order[]): Structure {
  const s: Structure = { tariffs: 0, services: 0, goods: 0, fines: 0, kitchen: 0, bar: 0 }
  for (const o of orders) {
    for (const c of o.charges) s[c.kind === 'tariff' ? 'tariffs' : c.kind === 'fine' ? 'fines' : c.kind === 'goods' ? 'goods' : 'services'] += c.amount
    for (const i of o.items) s[i.station] += i.unitPrice * i.qty
  }
  return s
}

export const STRUCTURE_LABEL: Record<keyof Structure, string> = { tariffs: 'Тарифы', services: 'Услуги', goods: 'Товары', fines: 'Штрафы', kitchen: 'Кухня', bar: 'Бар' }

/** Выручка по часам (с 09:00 до 23:00) по времени закрытия счёта. */
export function byHour(orders: Order[]): { hour: string; revenue: number }[] {
  const sums = new Map<number, number>()
  for (const o of orders) {
    const h = new Date(o.payment!.at).getHours()
    sums.set(h, (sums.get(h) ?? 0) + o.payment!.total)
  }
  return Array.from({ length: 15 }, (_, i) => 9 + i).map((h) => ({ hour: `${String(h).padStart(2, '0')}:00`, revenue: sums.get(h) ?? 0 }))
}

export function methodTotals(orders: Order[]): Record<PayMethod, number> {
  const t: Record<PayMethod, number> = { cash: 0, uzcard: 0, humo: 0, online: 0 }
  for (const o of orders) for (const l of o.payment!.lines) t[l.method] += l.amount
  return t
}

export interface ItemStat {
  menuItemId: number
  name: string
  qty: number
  revenue: number
}

/** Самые продаваемые позиции кухни и бара по выручке. */
export function topItems(orders: Order[]): ItemStat[] {
  const m = new Map<number, ItemStat>()
  for (const o of orders) {
    for (const i of o.items) {
      const cur = m.get(i.menuItemId) ?? { menuItemId: i.menuItemId, name: i.name, qty: 0, revenue: 0 }
      cur.qty += i.qty
      cur.revenue += i.unitPrice * i.qty
      m.set(i.menuItemId, cur)
    }
  }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue)
}

export const sum = <T,>(list: T[], f: (x: T) => number) => list.reduce((s, x) => s + f(x), 0)
