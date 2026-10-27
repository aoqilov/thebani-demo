import { addBraceletEvent, pickFreeBracelet } from '@/data/bracelets'
import { delay } from '@/data/mock'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import { LOST_BRACELET_FINE, type Bracelet, type BraceletEvent, type BraceletStatus } from '@/types/bracelet.types'
import type { Charge } from '@/types/order.types'

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 80

export const fetchBracelets = (): Promise<Bracelet[]> => delay(getWarehouse().bracelets, ms)
export const fetchBraceletEvents = (): Promise<BraceletEvent[]> => delay(getWarehouse().braceletEvents, ms)

/** Регистрация новой партии браслетов (коды с NFC-меток; здесь генерируются). */
export async function registerBracelets({ count, by }: { count: number; by: string }): Promise<void> {
  if (!(count >= 1) || count > 200) throw new Error('Укажите количество от 1 до 200.')
  updateWarehouse((s) => {
    const used = new Set(s.bracelets.map((b) => b.code))
    let id = Math.max(0, ...s.bracelets.map((b) => b.id))
    const added: Bracelet[] = []
    while (added.length < count) {
      const code = `NFC-${Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0')}`
      if (used.has(code)) continue
      used.add(code)
      added.push({ id: ++id, code, status: 'free', orderId: null, registeredAt: new Date().toISOString() })
    }
    return { ...s, bracelets: [...s.bracelets, ...added], braceletEvents: addBraceletEvent(s, added[0].code, 'registered', by, `Партия: ${count} шт.`) }
  })
  await delay(null, ms)
}

type Target = Extract<BraceletStatus, 'free' | 'lost' | 'blocked' | 'retired'>

const EVENT_FOR: Record<string, 'found' | 'lost' | 'blocked' | 'unblocked' | 'retired'> = {
  'lost>free': 'found', 'free>lost': 'lost', 'free>blocked': 'blocked', 'blocked>free': 'unblocked', 'free>retired': 'retired', 'lost>retired': 'retired', 'blocked>retired': 'retired',
}

/** Ручная смена статуса браслета на складе. Выданный браслет меняется только через «Заменить» или закрытие счёта. */
export async function setBraceletStatus({ id, status, by }: { id: number; status: Target; by: string }): Promise<void> {
  const b = getWarehouse().bracelets.find((x) => x.id === id)
  if (!b) throw new Error('Браслет не найден.')
  if (b.status === 'issued') throw new Error('Браслет выдан гостю — используйте «Заменить браслет».')
  const kind = EVENT_FOR[`${b.status}>${status}`]
  if (!kind) throw new Error('Такой переход недоступен.')
  updateWarehouse((s) => ({
    ...s,
    bracelets: s.bracelets.map((x) => (x.id === id ? { ...x, status } : x)),
    braceletEvents: addBraceletEvent(s, b.code, kind, by),
  }))
  await delay(null, ms)
}

export async function deleteBracelet(id: number): Promise<void> {
  const b = getWarehouse().bracelets.find((x) => x.id === id)
  if (!b) throw new Error('Браслет не найден.')
  if (b.status === 'issued') throw new Error('Нельзя удалить выданный браслет.')
  updateWarehouse((s) => ({ ...s, bracelets: s.bracelets.filter((x) => x.id !== id) }))
  await delay(null, ms)
}

/**
 * Замена браслета гостю (потерян или сломан). Старый помечается утерянным/списанным, гостю выдаётся новый,
 * счёт и шкаф остаются на нём. При утере можно взять штраф.
 */
export async function replaceBracelet({ orderId, reason, fine, by }: { orderId: number; reason: 'lost' | 'broken'; fine: boolean; by: string }): Promise<string> {
  const st = getWarehouse()
  const order = st.orders.find((o) => o.id === orderId)
  if (!order || order.status === 'closed') throw new Error('Счёт не найден или уже закрыт.')
  const old = st.bracelets.find((b) => b.orderId === orderId)
  const next = pickFreeBracelet(st)
  if (!next) throw new Error('Свободных браслетов нет — зарегистрируйте новую партию.')

  updateWarehouse((s) => {
    const now = new Date().toISOString()
    const cid = Math.max(0, ...s.orders.flatMap((o) => o.charges.map((c) => c.id))) + 1
    const charge: Charge | null = fine && reason === 'lost'
      ? { id: cid, kind: 'fine', title: 'Штраф: утерян браслет', amount: LOST_BRACELET_FINE, by, at: now }
      : null
    let events = s.braceletEvents
    if (old) events = addBraceletEvent({ ...s, braceletEvents: events }, old.code, reason === 'lost' ? 'lost' : 'retired', by, reason === 'lost' ? 'Утерян гостем' : 'Сломан')
    events = addBraceletEvent({ ...s, braceletEvents: events }, next.code, 'replaced', by, old ? `Вместо ${old.code}` : undefined)
    return {
      ...s,
      bracelets: s.bracelets.map((b) => {
        if (old && b.id === old.id) return { ...b, status: reason === 'lost' ? 'lost' : 'retired', orderId: null, issuedAt: undefined }
        if (b.id === next.id) return { ...b, status: 'issued', orderId, issuedAt: now }
        return b
      }),
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, bracelet: next.code, charges: charge ? [...o.charges, charge] : o.charges } : o)),
      braceletEvents: events,
    }
  })
  return delay(next.code, ms)
}
