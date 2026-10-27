import { billTotals, checkPayment } from '@/data/billing'
import { returnBraceletOf } from '@/data/bracelets'
import { pendingOvertime } from '@/data/overtime'
import { delay } from '@/data/mock'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import type { LockEvent } from '@/types/locker.types'
import type { Charge, Order, Payment, PaymentLine, Shift } from '@/types/order.types'

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 100

export const fetchShifts = (): Promise<Shift[]> => delay([...getWarehouse().shifts].sort((a, b) => b.openedAt.localeCompare(a.openedAt)), ms)
export const fetchClosedOrders = (): Promise<Order[]> =>
  delay(getWarehouse().orders.filter((o) => o.status === 'closed').sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? '')), ms)

/** Наличные, принятые в смену (за вычетом сдачи), начиная с `since`. */
export function cashSince(orders: Order[], since: string): number {
  return orders
    .filter((o) => o.payment && o.payment.at >= since)
    .reduce((s, o) => s + o.payment!.lines.filter((l) => l.method === 'cash').reduce((a, l) => a + l.amount, 0), 0)
}

export async function openShift({ openingCash, cashier }: { openingCash: number; cashier: string }): Promise<void> {
  if (getWarehouse().shifts.some((s) => !s.closedAt)) throw new Error('Смена уже открыта.')
  if (openingCash < 0) throw new Error('Сумма не может быть отрицательной.')
  updateWarehouse((s) => ({ ...s, shifts: [...s.shifts, { id: Math.max(0, ...s.shifts.map((x) => x.id)) + 1, cashier, openedAt: new Date().toISOString(), openingCash }] }))
  await delay(null, ms)
}

export async function closeShift({ countedCash }: { countedCash: number }): Promise<void> {
  const st = getWarehouse()
  const shift = st.shifts.find((s) => !s.closedAt)
  if (!shift) throw new Error('Нет открытой смены.')
  if (st.orders.some((o) => o.status !== 'closed')) throw new Error('Есть незакрытые счета. Закройте их перед закрытием смены.')
  const expected = shift.openingCash + cashSince(st.orders, shift.openedAt)
  updateWarehouse((s) => ({ ...s, shifts: s.shifts.map((x) => (x.id === shift.id ? { ...x, closedAt: new Date().toISOString(), countedCash, expectedCash: expected } : x)) }))
  await delay(null, ms)
}

interface CloseArgs {
  orderId: number
  discount: number
  serviceOn: boolean
  lines: PaymentLine[]
  cashier: string
}

/** Закрытие счёта: проверка оплаты, расчёт сдачи, освобождение стола. */
export async function closeOrder({ orderId, discount, serviceOn, lines, cashier }: CloseArgs): Promise<Order> {
  const st = getWarehouse()
  if (!st.shifts.some((s) => !s.closedAt)) throw new Error('Смена не открыта. Откройте смену, чтобы принимать оплату.')
  const order = st.orders.find((o) => o.id === orderId)
  if (!order || order.status === 'closed') throw new Error('Счёт не найден или уже закрыт.')

  const totals = billTotals(order, discount, serviceOn)
  const clean = lines.filter((l) => l.amount > 0)
  const chk = checkPayment(totals.total, clean)
  if (chk.error) throw new Error(chk.error)
  if (chk.remaining > 0) throw new Error(`Не хватает ${chk.remaining.toLocaleString('ru-RU')} сум.`)

  // сдача вычитается из наличных, чтобы в отчёте была чистая выручка
  let change = chk.change
  const net = clean.map((l) => {
    if (l.method !== 'cash' || change <= 0) return l
    const take = Math.min(change, l.amount)
    change -= take
    return { ...l, amount: l.amount - take }
  }).filter((l) => l.amount > 0)

  const payment: Payment = { lines: net, ...totals, received: chk.received, change: chk.change, cashier, at: new Date().toISOString() }
  let saved!: Order
  updateWarehouse((s0) => {
    const s = returnBraceletOf(s0, orderId, cashier)
    // браслет гостя перестаёт действовать — закреплённый шкаф освобождается
    const freed = s.lockers.filter((l) => l.orderId === orderId)
    let eid = Math.max(0, ...s.lockEvents.map((e) => e.id))
    const events: LockEvent[] = freed.map((l) => ({ id: ++eid, at: payment.at, lockerNumber: l.number, bracelet: order.bracelet, kind: 'released', by: cashier }))
    return {
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o
        saved = { ...o, status: 'closed', closedAt: payment.at, payment }
        return saved
      }),
      lockers: s.lockers.map((l) => (l.orderId === orderId ? { ...l, orderId: null, assignedAt: undefined } : l)),
      lockEvents: [...events, ...s.lockEvents].slice(0, 200),
    }
  })
  return delay(saved, ms)
}

/**
 * Начисляет экстра-часы за время сверх оплаченного (правило сайта: более 15 минут → +1 час).
 * Время пребывания продлевается, поэтому повторно начислить за тот же период нельзя.
 */
export async function settleOvertime({ orderId, by }: { orderId: number; by: string }): Promise<void> {
  const st = getWarehouse()
  const order = st.orders.find((o) => o.id === orderId)
  if (!order || order.status === 'closed') throw new Error('Счёт не найден или уже закрыт.')
  const ot = pendingOvertime(order, st.tariffs)
  if (!ot) throw new Error('Сверх оплаченного времени ничего не начислено.')

  updateWarehouse((s) => ({
    ...s,
    orders: s.orders.map((o) => {
      if (o.id !== orderId) return o
      const id = Math.max(0, ...s.orders.flatMap((x) => x.charges.map((c) => c.id))) + 1
      const charge: Charge = {
        id, kind: 'tariff', by, at: new Date().toISOString(), amount: ot.amount,
        title: `Экстра-час${ot.hours > 1 ? ` × ${ot.hours}` : ''}${ot.people > 1 ? ` · ${ot.people} чел.` : ''}`,
      }
      return { ...o, durationMin: o.durationMin + ot.hours * 60, charges: [...o.charges, charge] }
    }),
  }))
  await delay(null, ms)
}
