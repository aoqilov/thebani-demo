import type { Charge, Order, OrderItem, PayMethod, Payment, Shift, TableDef } from '@/types/order.types'
import { billTotals } from './billing'
import { seedMenuItems } from './menu.mock'
import { seedMasters, seedServices } from './services.mock'
import { seedShopItems } from './shop.mock'
import { seedTariffs } from './tariff.mock'

export const seedTables: TableDef[] = [
  { id: 1, name: 'Стол 1', zone: 'Зал', seats: 4 },
  { id: 2, name: 'Стол 2', zone: 'Зал', seats: 4 },
  { id: 3, name: 'Стол 3', zone: 'Зал', seats: 6 },
  { id: 4, name: 'Стол 4', zone: 'Зал', seats: 2 },
  { id: 5, name: 'Стол 5', zone: 'Зал', seats: 4 },
  { id: 6, name: 'Стол 6', zone: 'Зал', seats: 8 },
  { id: 7, name: 'Беседка 1', zone: 'Терраса', seats: 6 },
  { id: 8, name: 'Беседка 2', zone: 'Терраса', seats: 6 },
  { id: 9, name: 'Терраса 1', zone: 'Терраса', seats: 4 },
  { id: 10, name: 'Терраса 2', zone: 'Терраса', seats: 4 },
  { id: 11, name: 'VIP 1', zone: 'VIP', seats: 10 },
  { id: 12, name: 'VIP 2', zone: 'VIP', seats: 8 },
]

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

/** Поиск по началу названия: опечатка сразу видна ошибкой при загрузке, а не пустым счётом. */
function must<T extends { name: string }>(list: T[], prefix: string, what: string): T {
  const found = list.find((x) => x.name.startsWith(prefix))
  if (!found) throw new Error(`Нет ${what} «${prefix}»`)
  return found
}

let iid = 0
const item = (prefix: string, qty: number, status: OrderItem['status'], minAgo: number, batch = 1, cookBy?: string): OrderItem => {
  const m = must(seedMenuItems, prefix, 'позиции меню')
  return { id: ++iid, menuItemId: m.id, name: m.name, unitPrice: m.price, qty, mods: [], comment: '', station: m.station, status, sentAt: ago(minAgo), batch, cookBy }
}

let cid = 0
const RECEPTION = 'Зилола Хасанова'
const CASHIER = 'Мария Козлова'
const tariff = (prefix: string, qty = 1): Charge => {
  const t = must(seedTariffs, prefix, 'тарифа')
  return { id: ++cid, kind: 'tariff', title: `Тариф «${t.name}»${qty > 1 ? ` × ${qty}` : ''}`, amount: t.price * qty, by: RECEPTION }
}
const service = (prefix: string, masterId: number, minAgo: number): Charge => {
  const s = must(seedServices, prefix, 'услуги')
  const m = seedMasters.find((x) => x.id === masterId)!
  return { id: ++cid, kind: 'service', title: `${s.name}, ${s.durationMin} мин`, amount: s.price, by: `${m.firstname} ${m.lastname}`, masterId, serviceId: s.id, at: ago(minAgo) }
}
const goods = (prefix: string, qty: number, minAgo: number): Charge => {
  const g = must(seedShopItems, prefix, 'товара')
  return { id: ++cid, kind: 'goods', title: `${g.name} × ${qty}`, amount: g.price * qty, by: CASHIER, at: ago(minAgo) }
}

export const CASHIER_NAME = CASHIER

/** Закрытый счёт для истории смены (для отчёта). */
function closed(id: number, tableId: number, guests: number, items: OrderItem[], charges: Charge[], pay: Array<[PayMethod, number | 'rest']>, closedMinAgo: number, discount = 0, serviceOn = false): Order {
  const totals = billTotals({ items, charges }, discount, serviceOn)
  let left = totals.total
  const lines = pay.map(([method, amount]) => {
    const a = amount === 'rest' ? left : Math.min(amount, left)
    left -= a
    return { method, amount: a }
  })
  const payment: Payment = { lines, ...totals, received: totals.total, change: 0, cashier: CASHIER, at: ago(closedMinAgo) }
  return {
    id, tableId, guests, durationMin: 180, bracelet: `NFC-${(0x2a0000 + id * 4711).toString(16).toUpperCase()}`, waiter: 'Мадина Орипова',
    status: 'closed', openedAt: ago(closedMinAgo + 190), closedAt: ago(closedMinAgo), items, charges, payment,
  }
}

export const seedOrders: Order[] = [
  {
    id: 1, tableId: 2, guests: 3, durationMin: 180, bracelet: 'NFC-4F2A91', waiter: 'Игорь Волков', status: 'open', openedAt: ago(42),
    charges: [tariff('Будни 14:00–01:00', 3), service('Балийский ритуал', 1, 30), goods('Веник дуб кавказский', 2, 25), goods('Шапка банная фетровая', 1, 25)],
    items: [
      item('Греческий салат', 1, 'served', 38),
      item('Шашлык из курицы', 2, 'ready', 14, 2, 'Виктор Попов'),
      item('Coca Cola', 3, 'served', 36),
      item('Ачичук', 1, 'sent', 1, 3),
    ],
  },
  {
    id: 2, tableId: 5, guests: 2, durationMin: 180, bracelet: 'NFC-9C03B7', waiter: 'Игорь Волков', status: 'open', openedAt: ago(15),
    charges: [tariff('Будни 14:00–01:00', 2)],
    items: [
      item('Шашлык из говядины', 2, 'cooking', 9, 1, 'Виктор Попов'),
      item('Сенча', 1, 'ready', 9, 1, 'Данияр Бекмуратов'),
      item('Борщ · 300 мл', 1, 'sent', 3, 2),
      item('Coca Cola', 2, 'sent', 3, 2),
    ],
  },
  {
    id: 3, tableId: 7, guests: 6, durationMin: 180, bracelet: 'NFC-17D8E2', waiter: 'Мадина Орипова', status: 'bill', openedAt: ago(95),
    charges: [tariff('Выходные и праздники, 3 часа', 6)],
    items: [
      item('Шашлык из говядины', 6, 'served', 80),
      item('Carlsberg · 0.5 л', 6, 'served', 78),
    ],
  },
  // История сегодняшней смены
  closed(4, 1, 2, [item('Борщ · 300 мл', 2, 'served', 200), item('Сенча', 2, 'served', 198)], [tariff('Будни 14:00–01:00', 2)], [['cash', 'rest']], 130, 0, true),
  closed(5, 4, 2, [item('Цезарь с курицей', 1, 'served', 150)], [tariff('Будни 14:00–01:00', 2), service('Турецкая помывка', 2, 140)], [['uzcard', 'rest']], 95, 100000, true),
  closed(6, 11, 8, [item('Шашлык из говядины', 8, 'served', 300), item('Moët Chandon Brut', 1, 'served', 290)], [tariff('VIP-кабинка (выходные)', 1)], [['cash', 3000000], ['humo', 'rest']], 60, 0, true),
]

export const seedShifts: Shift[] = [
  { id: 1, cashier: CASHIER, openedAt: ago(8 * 60), openingCash: 500000 },
]
