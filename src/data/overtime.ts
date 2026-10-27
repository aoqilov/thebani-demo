import type { Order } from '@/types/order.types'
import type { Tariff } from '@/types/tariff.types'

/**
 * Правило сайта: если гость остался больше чем на 15 минут сверх оплаченного времени,
 * автоматически начисляется дополнительный (экстра) час. Безлимитные тарифы не продлеваются.
 */
export const OVERTIME_GRACE_MIN = 15
const UNLIMITED_MIN = 16 * 60

export interface Overtime {
  /** Сколько минут сверх оплаченного */
  overMin: number
  hours: number
  perHour: number
  people: number
  amount: number
}

/** Цена и «на кого» считается экстра-час — по самому дорогому тарифу в счёте. */
export function extraHourPricing(order: Pick<Order, 'charges' | 'guests'>, tariffs: Tariff[]): { perHour: number; people: number } {
  const t = [...tariffs]
    .filter((x) => order.charges.some((c) => c.kind === 'tariff' && c.title.includes(`«${x.name}»`)))
    .sort((a, b) => b.extraHourPrice - a.extraHourPrice)[0]
  return { perHour: t?.extraHourPrice ?? 150000, people: t && t.guests > 1 ? 1 : order.guests }
}

/** Экстра-часы, которые ещё не начислены. null — всё в рамках оплаченного времени. */
export function pendingOvertime(order: Order, tariffs: Tariff[], now = Date.now()): Overtime | null {
  if (order.status === 'closed' || order.durationMin >= UNLIMITED_MIN) return null
  const elapsed = Math.floor((now - new Date(order.openedAt).getTime()) / 60_000)
  const over = elapsed - order.durationMin
  if (over <= OVERTIME_GRACE_MIN) return null
  const hours = Math.ceil((over - OVERTIME_GRACE_MIN) / 60)
  const { perHour, people } = extraHourPricing(order, tariffs)
  return { overMin: over, hours, perHour, people, amount: perHour * people * hours }
}
