import type { Bracelet, BraceletEvent, BraceletEventKind } from '@/types/bracelet.types'
import type { WarehouseState } from './warehouse.store'

/** Добавляет запись в журнал браслетов (храним последние 300). */
export function addBraceletEvent(s: WarehouseState, code: string, kind: BraceletEventKind, by: string, note?: string): BraceletEvent[] {
  const ev: BraceletEvent = { id: Math.max(0, ...s.braceletEvents.map((e) => e.id)) + 1, at: new Date().toISOString(), code, kind, by, note }
  return [ev, ...s.braceletEvents].slice(0, 300)
}

/** Случайный свободный браслет со склада (имитация: гость берёт любой). */
export function pickFreeBracelet(s: Pick<WarehouseState, 'bracelets'>): Bracelet | undefined {
  const free = s.bracelets.filter((b) => b.status === 'free')
  return free.length ? free[Math.floor(Math.random() * free.length)] : undefined
}

/** Браслет `code` выдан гостю по счёту `orderId`. Если кода нет в реестре, состояние не меняется. */
export function issueBraceletTo(s: WarehouseState, code: string, orderId: number, by: string): WarehouseState {
  if (!s.bracelets.some((b) => b.code === code)) return s
  return {
    ...s,
    bracelets: s.bracelets.map((b) => (b.code === code ? { ...b, status: 'issued', orderId, issuedAt: new Date().toISOString() } : b)),
    braceletEvents: addBraceletEvent(s, code, 'issued', by),
  }
}

/** Гость рассчитался — браслет возвращается на склад. */
export function returnBraceletOf(s: WarehouseState, orderId: number, by: string): WarehouseState {
  const b = s.bracelets.find((x) => x.orderId === orderId)
  if (!b) return s
  return {
    ...s,
    bracelets: s.bracelets.map((x) => (x.id === b.id ? { ...x, status: 'free', orderId: null, issuedAt: undefined } : x)),
    braceletEvents: addBraceletEvent(s, b.code, 'returned', by),
  }
}
