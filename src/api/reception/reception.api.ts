import { issueBraceletTo, pickFreeBracelet } from '@/data/bracelets'
import { delay } from '@/data/mock'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import type { Charge, Order } from '@/types/order.types'
import type { Tariff } from '@/types/tariff.types'

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 100

export const fetchTariffs = (): Promise<Tariff[]> => delay(getWarehouse().tariffs, ms)

export async function saveTariff(t: Omit<Tariff, 'id'> & { id?: number }): Promise<void> {
  if (!t.name.trim()) throw new Error('Укажите название тарифа.')
  if (!(t.price >= 0)) throw new Error('Цена не может быть отрицательной.')
  if (!(t.durationMin > 0)) throw new Error('Укажите длительность.')
  if (!(t.guests >= 1)) throw new Error('В тариф должен входить хотя бы один гость.')
  updateWarehouse((s) => ({
    ...s,
    tariffs: t.id ? s.tariffs.map((x) => (x.id === t.id ? { ...t, id: t.id } : x)) : [...s.tariffs, { ...t, id: Math.max(0, ...s.tariffs.map((x) => x.id)) + 1 }],
  }))
  await delay(null, ms)
}

export async function deleteTariff(id: number): Promise<void> {
  updateWarehouse((s) => ({ ...s, tariffs: s.tariffs.filter((t) => t.id !== id) }))
  await delay(null, ms)
}

/** Свободный номер браслета (имитация выдачи нового браслета с NFC-считывателя). */
export async function issueBracelet(): Promise<string> {
  const free = pickFreeBracelet(getWarehouse())
  if (!free) throw new Error('Свободных браслетов нет — зарегистрируйте новую партию в разделе «Браслеты NFC».')
  return delay(free.code, 500)
}

interface CheckInArgs {
  lines: { tariffId: number; qty: number }[]
  bracelet: string
  receptionist: string
}

/** Вход гостя: выбор тарифов, выдача браслета, открытие счёта (оплата — при выходе у кассира). */
export async function checkIn({ lines, bracelet, receptionist }: CheckInArgs): Promise<Order> {
  const st = getWarehouse()
  const picked = lines.filter((l) => l.qty > 0).map((l) => ({ tariff: st.tariffs.find((t) => t.id === l.tariffId), qty: l.qty }))
  if (picked.length === 0) throw new Error('Выберите хотя бы один тариф.')
  if (picked.some((p) => !p.tariff || !p.tariff.active)) throw new Error('Один из тарифов недоступен.')
  const reg = st.bracelets.find((x) => x.code === bracelet)
  if (!reg) throw new Error('Браслет не зарегистрирован в системе.')
  if (reg.status !== 'free') throw new Error('Этот браслет сейчас недоступен: ' + (reg.status === 'issued' ? 'он уже выдан другому гостю.' : 'он заблокирован или утерян.'))

  let id = Math.max(0, ...st.orders.flatMap((o) => o.charges.map((c) => c.id)))
  const charges: Charge[] = picked.map(({ tariff, qty }) => ({
    id: ++id, kind: 'tariff', title: `Тариф «${tariff!.name}»${qty > 1 ? ` × ${qty}` : ''}`, amount: tariff!.price * qty, by: receptionist,
  }))
  const guests = picked.reduce((s, { tariff, qty }) => s + tariff!.guests * qty, 0)
  const durationMin = Math.max(...picked.map(({ tariff }) => tariff!.durationMin))

  let created!: Order
  updateWarehouse((s) => {
    created = {
      id: Math.max(0, ...s.orders.map((o) => o.id)) + 1, tableId: null, guests, durationMin, bracelet, waiter: '—',
      status: 'open', openedAt: new Date().toISOString(), items: [], charges,
    }
    return issueBraceletTo({ ...s, orders: [...s.orders, created] }, bracelet, created.id, receptionist)
  })
  return delay(created, ms)
}

/** Продление на 1 час: добавляет начисление и увеличивает оплаченное время. */
export async function extendStay({ orderId, receptionist }: { orderId: number; receptionist: string }): Promise<void> {
  const st = getWarehouse()
  const order = st.orders.find((o) => o.id === orderId)
  if (!order || order.status === 'closed') throw new Error('Счёт не найден или уже закрыт.')
  // цена продления — по самому дорогому тарифу, который в счёте
  const tariff = [...st.tariffs].filter((t) => order.charges.some((c) => c.kind === 'tariff' && c.title.includes(`«${t.name}»`))).sort((a, b) => b.extraHourPrice - a.extraHourPrice)[0]
  const perHour = tariff?.extraHourPrice ?? 40000
  const people = tariff && tariff.guests > 1 ? 1 : order.guests
  updateWarehouse((s) => ({
    ...s,
    orders: s.orders.map((o) => {
      if (o.id !== orderId) return o
      const cid = Math.max(0, ...s.orders.flatMap((x) => x.charges.map((c) => c.id))) + 1
      const charge: Charge = { id: cid, kind: 'tariff', title: `Продление +1 час${people > 1 ? ` × ${people}` : ''}`, amount: perHour * people, by: receptionist }
      return { ...o, durationMin: o.durationMin + 60, charges: [...o.charges, charge] }
    }),
  }))
  await delay(null, ms)
}
