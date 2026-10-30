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

/** Отменённая позиция: убирается из счёта, но остаётся в журнале с причиной. */
export interface CancelledItem {
  id: number
  menuItemId: number
  name: string
  qty: number
  unitPrice: number
  station: Station
  /** На каком этапе была позиция в момент отмены */
  wasStatus: OrderItemStatus
  reason: string
  by: string
  /** ISO */
  at: string
}

export interface OrderItemMod {
  group: string
  option: string
  price: number
  /** Списание со склада — копия настроек варианта на момент заказа */
  productId?: number
  qty?: number
  replaceProductId?: number
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
  /** Стол закрыт официантом (гости поели и ушли), а счёт остаётся открытым до оплаты на кассе */
  closedTable?: { tableId: number; at: string; by: string }
  /** Счёт на конкретного гостя за общим столом («Гость 1»). Нет — счёт на весь стол */
  guestLabel?: string
  waiter: string
  status: OrderStatus
  openedAt: string
  items: OrderItem[]
  /** Отменённые позиции (журнал) */
  cancelled?: CancelledItem[]
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

/** Счёт стола на момент закрытия: что заказывали (для истории закрытых столов). */
export interface TableCleaningBill {
  orderId: number
  /** «Гость 1» и т. п.; нет — счёт на весь стол */
  label?: string
  total: number
  items: { name: string; qty: number }[]
  cancelled: number
}

/**
 * Закрытие стола официантом. Пока `cleanedAt` пустой — стол ждёт уборки и занять его нельзя.
 * Запись остаётся в истории и после уборки.
 */
export interface TableCleaning {
  id: number
  tableId: number
  guests: number
  bills: TableCleaningBill[]
  total: number
  /** ISO */
  closedAt: string
  closedBy: string
  cleanedAt?: string
  cleanedBy?: string
}
