import { delay } from '@/data/mock'
import { getWarehouse, updateWarehouse, type WarehouseState } from '@/data/warehouse.store'
import type { LockEvent, LockEventKind, Locker } from '@/types/locker.types'

// TODO: когда появится backend / контроллер замков — заменить тела функций (интерфейс не меняется).
const ms = 80

export const fetchLockers = (): Promise<Locker[]> => delay(getWarehouse().lockers, ms)
export const fetchLockEvents = (): Promise<LockEvent[]> => delay(getWarehouse().lockEvents, ms)

/** Запись в журнал замков (последние 200). */
function log(s: WarehouseState, locker: Locker, kind: LockEventKind, by: string): LockEvent[] {
  const order = s.orders.find((o) => o.id === locker.orderId)
  const ev: LockEvent = {
    id: Math.max(0, ...s.lockEvents.map((e) => e.id)) + 1, at: new Date().toISOString(), lockerNumber: locker.number,
    bracelet: order?.bracelet ?? null, kind, by,
  }
  return [ev, ...s.lockEvents].slice(0, 200)
}

/**
 * Закрепляет шкаф за гостем. Если lockerId не указан — выбирается первый свободный исправный.
 * Дальше шкаф открывается только браслетом этого гостя (и мастер-ключом раздевалщика).
 */
export async function assignLocker({ orderId, lockerId, by }: { orderId: number; lockerId?: number; by: string }): Promise<Locker> {
  const st = getWarehouse()
  const order = st.orders.find((o) => o.id === orderId)
  if (!order || order.status === 'closed') throw new Error('Счёт не найден или уже закрыт.')
  if (st.lockers.some((l) => l.orderId === orderId)) throw new Error('За этим гостем уже закреплён шкаф.')

  const target = lockerId !== undefined ? st.lockers.find((l) => l.id === lockerId) : st.lockers.find((l) => l.condition === 'ok' && l.orderId === null)
  if (!target) throw new Error('Свободных шкафов нет.')
  if (target.condition === 'broken') throw new Error(`Шкаф №${target.number} неисправен.`)
  if (target.orderId !== null) throw new Error(`Шкаф №${target.number} уже занят.`)

  let saved!: Locker
  updateWarehouse((s) => {
    saved = { ...target, orderId, assignedAt: new Date().toISOString() }
    return { ...s, lockers: s.lockers.map((l) => (l.id === target.id ? saved : l)), lockEvents: log({ ...s, orders: s.orders }, saved, 'assigned', by) }
  })
  return delay(saved, ms)
}

/** Открытие шкафа браслетом гостя (имитация срабатывания замка). */
export async function openLocker({ orderId, by }: { orderId: number; by: string }): Promise<Locker> {
  const st = getWarehouse()
  const locker = st.lockers.find((l) => l.orderId === orderId)
  if (!locker) throw new Error('За этим гостем шкаф не закреплён.')
  updateWarehouse((s) => ({ ...s, lockEvents: log(s, locker, 'opened', by) }))
  return delay(locker, 300)
}

/** Освобождение шкафа раздевалщиком; emergency — открыть мастер-ключом (потерян браслет). */
export async function releaseLocker({ lockerId, emergency, by }: { lockerId: number; emergency?: boolean; by: string }): Promise<void> {
  const locker = getWarehouse().lockers.find((l) => l.id === lockerId)
  if (!locker) throw new Error('Шкаф не найден.')
  updateWarehouse((s) => ({
    ...s,
    lockEvents: log(s, locker, emergency ? 'emergency' : 'released', by),
    lockers: s.lockers.map((l) => (l.id === lockerId ? { ...l, orderId: null, assignedAt: undefined } : l)),
  }))
  await delay(null, ms)
}

export async function setLockerCondition({ lockerId, broken }: { lockerId: number; broken: boolean }): Promise<void> {
  const locker = getWarehouse().lockers.find((l) => l.id === lockerId)
  if (!locker) throw new Error('Шкаф не найден.')
  if (broken && locker.orderId !== null) throw new Error('В шкафу гость — сначала освободите его.')
  updateWarehouse((s) => ({ ...s, lockers: s.lockers.map((l) => (l.id === lockerId ? { ...l, condition: broken ? 'broken' : 'ok' } : l)) }))
  await delay(null, ms)
}

/** Администратор добавляет шкафы с номера `from` по `to`. */
export async function addLockers({ from, to }: { from: number; to: number }): Promise<void> {
  if (!(from >= 1) || !(to >= from)) throw new Error('Укажите корректный диапазон номеров.')
  if (to - from > 199) throw new Error('За раз можно добавить не больше 200 шкафов.')
  const exists = getWarehouse().lockers.map((l) => l.number)
  const toAdd = Array.from({ length: to - from + 1 }, (_, i) => String(from + i)).filter((n) => !exists.includes(n))
  if (toAdd.length === 0) throw new Error('Все шкафы из этого диапазона уже есть.')
  updateWarehouse((s) => {
    let id = Math.max(0, ...s.lockers.map((l) => l.id))
    return { ...s, lockers: [...s.lockers, ...toAdd.map((number) => ({ id: ++id, number, condition: 'ok' as const, orderId: null }))] }
  })
  await delay(null, ms)
}

export async function deleteLocker(lockerId: number): Promise<void> {
  const locker = getWarehouse().lockers.find((l) => l.id === lockerId)
  if (locker?.orderId !== null && locker?.orderId !== undefined) throw new Error('Нельзя удалить занятый шкаф.')
  updateWarehouse((s) => ({ ...s, lockers: s.lockers.filter((l) => l.id !== lockerId) }))
  await delay(null, ms)
}
