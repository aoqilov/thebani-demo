import type { Station } from './menu.types'

export type TableZone = 'Зал' | 'Терраса' | 'VIP'

export interface TableDef {
  id: number
  name: string
  zone: TableZone
  seats: number
}

/** sent — отправлено; cooking — готовится; ready — готово, ждёт официанта; served — подано */
export type OrderItemStatus = 'sent' | 'cooking' | 'ready' | 'served'

export const ITEM_STATUS_LABEL: Record<OrderItemStatus, string> = {
  sent: 'Отправлено',
  cooking: 'Готовится',
  ready: 'Готово',
  served: 'Подано',
}

export interface OrderItemMod {
  group: string
  option: string
  price: number
}

export interface OrderItem {
  id: number
  menuItemId: number
  name: string
  /** Цена одной штуки с учётом модификаторов */
  unitPrice: number
  qty: number
  mods: OrderItemMod[]
  comment: string
  station: Station
  status: OrderItemStatus
  /** ISO */
  sentAt: string
  /** Номер отправки (чтобы показывать «заход» отдельно) */
  batch: number
  /** Кто принял в работу (повар/бармен) */
  cookBy?: string
}

/** Начисление на счёт браслета, не относящееся к кухне/бару: вход по тарифу, услуги мастеров. */
export interface Charge {
  id: number
  kind: 'tariff' | 'service' | 'goods' | 'fine'
  title: string
  amount: number
  /** Кто добавил (ресепшн / массажист) */
  by: string
  /** Для услуг: какой мастер и какая услуга (для отчётов и комиссии) */
  masterId?: number
  serviceId?: number
  /** ISO-время добавления */
  at?: string
}

export type PayMethod = 'cash' | 'uzcard' | 'humo' | 'online'

export const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  cash: 'Наличные',
  uzcard: 'UzCard',
  humo: 'Humo',
  online: 'Click / Payme',
}

export interface PaymentLine {
  method: PayMethod
  amount: number
}

/** Итог закрытого счёта. Наличные в lines записаны уже за вычетом сдачи. */
export interface Payment {
  lines: PaymentLine[]
  subtotal: number
  discount: number
  service: number
  total: number
  /** Принято от гостя (с учётом сдачи) */
  received: number
  change: number
  cashier: string
  at: string
}

/** open — идёт обслуживание; bill — гость попросил счёт; closed — закрыт кассой */
export type OrderStatus = 'open' | 'bill' | 'closed'

export interface Order {
  id: number
  /** null — гость вошёл по тарифу, но ещё не сел за стол */
  tableId: number | null
  guests: number
  /** Оплаченное время пребывания, минут (продлевается на ресепшн) */
  durationMin: number
  /** NFC-браслет гостя, на который идёт счёт */
  bracelet: string | null
  waiter: string
  status: OrderStatus
  openedAt: string
  items: OrderItem[]
  charges: Charge[]
  closedAt?: string
  payment?: Payment
}

/** Смена кассира. */
export interface Shift {
  id: number
  cashier: string
  openedAt: string
  openingCash: number
  closedAt?: string
  /** Пересчитанная наличка при закрытии */
  countedCash?: number
  /** Ожидаемая наличка на момент закрытия */
  expectedCash?: number
}

/** Позиция, ещё не отправленная на кухню — живёт только в интерфейсе официанта. */
export interface DraftLine {
  key: string
  menuItemId: number
  name: string
  unitPrice: number
  qty: number
  mods: OrderItemMod[]
  comment: string
  station: Station
}

/** Сумма только по блюдам и напиткам. */
export const orderTotal = (o: Pick<Order, 'items'>) => o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0)
export const chargesTotal = (o: Pick<Order, 'charges'>) => o.charges.reduce((s, c) => s + c.amount, 0)
export const draftTotal = (lines: DraftLine[]) => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
