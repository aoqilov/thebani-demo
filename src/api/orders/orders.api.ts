import { issueBraceletTo, pickFreeBracelet } from '@/data/bracelets'
import { consumptionForItem } from '@/data/consumption'
import { itemState, modAvailability } from '@/data/menu.calc'
import { delay } from '@/data/mock'
import { buildStock } from '@/data/warehouse.calc'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import type { CostCtx } from '@/data/recipe.calc'
import { orderTotal, type DraftLine, type Order, type OrderItem, type OrderItemStatus, type TableCleaning, type TableDef } from '@/types/order.types'
import { AUTO_REASON, type WarehouseDoc } from '@/types/warehouse.types'

export interface WriteOffResult {
  lines: { name: string; qty: number; unit: string }[]
  /** Товары, которых на складе не хватило (остаток ушёл в минус) */
  shortage: string[]
}

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 80

export const fetchCleanings = (): Promise<TableCleaning[]> => delay([...getWarehouse().tableCleanings].sort((a, b) => b.closedAt.localeCompare(a.closedAt)), ms)

export const fetchTables = (): Promise<TableDef[]> => delay(getWarehouse().tables, ms)

/** Заказы, которые ещё не закрыты кассой. */
export const fetchOrders = (): Promise<Order[]> => delay(getWarehouse().orders.filter((o) => o.status !== 'closed'), ms)

/** Имитация считывания NFC-браслета. */
export const scanBracelet = async (): Promise<string> => {
  const b = pickFreeBracelet(getWarehouse())
  if (!b) throw new Error('Свободных браслетов нет — зарегистрируйте новую партию.')
  return delay(b.code, 500)
}

/** Браслет гостя, который вошёл по тарифу, но ещё не сел за стол (имитация считывания у стола). */
export const scanGuestBracelet = (): Promise<string | null> => {
  const free = getWarehouse().orders.filter((o) => o.status !== 'closed' && o.tableId === null && o.bracelet)
  return delay(free.length ? free[Math.floor(Math.random() * free.length)].bracelet : null, 500)
}

/**
 * Посадка за стол. Если браслет уже зарегистрирован на ресепшн (счёт без стола) —
 * к счёту просто привязывается стол, иначе открывается новый счёт.
 */
export async function openTable({ tableId, guests, bracelet, waiter, mode = 'table' }: { tableId: number; guests: number; bracelet: string | null; waiter: string; mode?: 'table' | 'guest' }): Promise<Order> {
  const { orders } = getWarehouse()
  if (getWarehouse().tableCleanings.some((c) => c.tableId === tableId && !c.cleanedAt)) throw new Error('Стол ждёт уборки. Откройте его после того, как он будет убран.')
  const here = orders.filter((o) => o.tableId === tableId && o.status !== 'closed')
  let guestLabel: string | undefined
  if (mode === 'table') {
    if (here.length) throw new Error('Стол уже занят.')
  } else {
    if (here.some((o) => !o.guestLabel)) throw new Error('Стол ведётся одним общим счётом. Закройте его или откройте счёт на весь стол.')
    const n = Math.max(0, ...here.map((o) => Number(o.guestLabel?.replace(/\D/g, '')) || 0)) + 1
    guestLabel = `Гость ${n}`
    guests = 1
  }
  const existing = bracelet ? orders.find((o) => o.status !== 'closed' && o.bracelet === bracelet) : undefined
  if (existing && existing.tableId !== null) throw new Error('Этот браслет уже привязан к другому столу.')
  if (existing) {
    let seated!: Order
    updateWarehouse((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== existing.id) return o
        seated = { ...o, tableId, waiter, guests: guestLabel ? 1 : Math.max(o.guests, guests), guestLabel }
        return seated
      }),
    }))
    return delay(seated, ms)
  }
  let created!: Order
  updateWarehouse((s) => {
    created = { id: Math.max(0, ...s.orders.map((o) => o.id)) + 1, tableId, guests, bracelet, guestLabel, waiter, status: 'open', openedAt: new Date().toISOString(), items: [], charges: [], durationMin: 180 }
    const next = { ...s, orders: [...s.orders, created] }
    return bracelet ? issueBraceletTo(next, bracelet, created.id, waiter) : next
  })
  return delay(created, ms)
}

/** Отправка новых позиций на кухню и бар. Позиции в стопе отклоняются. */
export async function sendItems({ orderId, lines }: { orderId: number; lines: DraftLine[] }): Promise<void> {
  const st = getWarehouse()
  const ctx: CostCtx = {
    products: new Map(st.products.map((p) => [p.id, p])),
    recipes: new Map(st.recipes.map((r) => [r.productId, r])),
    stock: new Map(buildStock(st.docs, st.products).map((r) => [r.productId, r])),
  }
  const blocked = lines
    .map((l) => ({ l, item: st.menuItems.find((i) => i.id === l.menuItemId) }))
    .filter(({ item }) => !item || !itemState(item, ctx).sellable)
    .map(({ l }) => l.name)
  if (blocked.length) throw new Error(`Позиции в стопе: ${blocked.join(', ')}. Уберите их из заказа.`)
  const modBlocked = lines.flatMap((l) => l.mods.map((m) => ({ l, m, a: modAvailability(m, ctx) }))).filter((x) => !x.a.available)
  if (modBlocked.length) throw new Error(`Модификаторы в стопе: ${[...new Set(modBlocked.map((x) => `${x.m.option} (${x.l.name})`))].join(', ')}. Уберите их из заказа.`)

  updateWarehouse((s) => {
    const order = s.orders.find((o) => o.id === orderId)
    if (!order) return s
    const batch = Math.max(0, ...order.items.map((i) => i.batch)) + 1
    let id = Math.max(0, ...s.orders.flatMap((o) => o.items.map((i) => i.id)))
    const now = new Date().toISOString()
    const added: OrderItem[] = lines.map((l) => ({
      id: ++id, menuItemId: l.menuItemId, name: l.name, unitPrice: l.unitPrice, qty: l.qty, mods: l.mods,
      comment: l.comment, station: l.station, status: 'sent', sentAt: now, batch,
    }))
    return { ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, items: [...o.items, ...added] } : o)) }
  })
  await delay(null, ms)
}

/**
 * Смена статуса позиции. Когда блюдо становится «Готово», со склада автоматически списываются
 * ингредиенты по тех. карте (создаётся проведённый акт списания «Продажа (авто)»).
 */
export async function setItemStatus({ orderId, itemId, status, by }: { orderId: number; itemId: number; status: OrderItemStatus; by?: string }): Promise<WriteOffResult | null> {
  let result = null as WriteOffResult | null

  updateWarehouse((s) => {
    const order = s.orders.find((o) => o.id === orderId)
    const item = order?.items.find((i) => i.id === itemId)
    if (!order || !item) return s

    const orders = s.orders.map((o) => (o.id === orderId ? { ...o, items: o.items.map((i) => (i.id === itemId ? { ...i, status, cookBy: by && (status === 'cooking' || status === 'ready') ? by : i.cookBy } : i)) } : o))
    const firstReady = status === 'ready' && item.status !== 'ready' && item.status !== 'served'
    if (!firstReady) return { ...s, orders }

    const menuItem = s.menuItems.find((m) => m.id === item.menuItemId)
    if (!menuItem) return { ...s, orders }

    const products = new Map(s.products.map((p) => [p.id, p]))
    const stockQty = new Map(buildStock(s.docs, s.products).map((r) => [r.productId, r.qty]))
    const used = consumptionForItem(menuItem.productId, item.qty, item.mods, products, new Map(s.recipes.map((r) => [r.productId, r])), stockQty)
    if (used.size === 0) return { ...s, orders }

    const lines = [...used.entries()].map(([productId, qty]) => ({ productId, qty: Math.round(qty * 10000) / 10000, price: 0 }))
    const id = Math.max(0, ...s.docs.map((d) => d.id)) + 1
    const n = s.docs.filter((d) => d.type === 'expense').length + 1
    const table = s.tables.find((t) => t.id === order.tableId)?.name ?? ''
    const doc: WarehouseDoc = {
      id, type: 'expense', number: `СП-${String(n).padStart(6, '0')}`, date: new Date().toISOString().slice(0, 10), status: 'posted',
      supplierId: null, reason: AUTO_REASON, comment: `Заказ №${order.id}, ${table}: ${item.qty} × ${item.name}`, lines,
    }
    result = {
      lines: lines.map((l) => ({ name: products.get(l.productId)!.name, qty: l.qty, unit: products.get(l.productId)!.unit })),
      shortage: lines.filter((l) => (stockQty.get(l.productId) ?? 0) < l.qty).map((l) => products.get(l.productId)!.name),
    }
    return { ...s, orders, docs: [...s.docs, doc] }
  })

  await delay(null, 50)
  return result
}

/**
 * Отмена ошибочной позиции официантом. Подано — отменить нельзя (возврат делает кассир или администратор).
 * Позиция уходит из счёта и из очереди кухни; запись остаётся в журнале отмен с причиной.
 * Если блюдо уже было готово, продукты со склада уже списаны — это видно как потери в отчёте «Потери и расхождения».
 */
export async function cancelItem({ orderId, itemId, qty, reason, by }: { orderId: number; itemId: number; qty: number; reason: string; by: string }): Promise<void> {
  const order = getWarehouse().orders.find((o) => o.id === orderId)
  const item = order?.items.find((i) => i.id === itemId)
  if (!order || !item) throw new Error('Позиция не найдена.')
  if (order.status === 'closed') throw new Error('Счёт уже закрыт.')
  if (item.status === 'served') throw new Error('Блюдо уже подано. Возврат оформляет кассир или администратор.')
  if (!reason.trim()) throw new Error('Укажите причину отмены.')
  const n = Math.min(Math.max(Math.round(qty), 1), item.qty)

  updateWarehouse((s) => ({
    ...s,
    orders: s.orders.map((o) => {
      if (o.id !== orderId) return o
      const log = o.cancelled ?? []
      const entry = {
        id: Math.max(0, ...log.map((c) => c.id)) + 1, menuItemId: item.menuItemId, name: item.name, qty: n, unitPrice: item.unitPrice,
        station: item.station, wasStatus: item.status, reason, by, at: new Date().toISOString(),
      }
      const items = n === item.qty ? o.items.filter((i) => i.id !== itemId) : o.items.map((i) => (i.id === itemId ? { ...i, qty: i.qty - n } : i))
      return { ...o, items, cancelled: [...log, entry] }
    }),
  }))
  await delay(null, 50)
}

/**
 * Закрытие стола официантом: гости поели и ушли. Счета остаются открытыми — гость оплатит на кассе при выходе по браслету,
 * но к столу они больше не привязаны. Стол переходит в «ждёт уборки», запись попадает в историю.
 */
export async function closeTable({ tableId, by }: { tableId: number; by: string }): Promise<TableCleaning> {
  const st = getWarehouse()
  const here = st.orders.filter((o) => o.tableId === tableId && o.status !== 'closed')
  if (!here.length) throw new Error('За столом нет открытых счетов.')
  const unserved = here.flatMap((o) => o.items).filter((i) => i.status !== 'served')
  if (unserved.length) throw new Error(`Не всё подано: ${unserved.map((i) => `${i.qty} × ${i.name}`).join(', ')}. Подайте или отмените эти позиции.`)

  const now = new Date().toISOString()
  const entry: TableCleaning = {
    id: Math.max(0, ...st.tableCleanings.map((c) => c.id)) + 1, tableId, closedAt: now, closedBy: by,
    guests: here.reduce((s, o) => s + o.guests, 0),
    total: here.reduce((s, o) => s + orderTotal(o), 0),
    bills: here.map((o) => ({
      orderId: o.id, label: o.guestLabel, total: orderTotal(o), cancelled: o.cancelled?.length ?? 0,
      items: o.items.map((i) => ({ name: i.name, qty: i.qty })),
    })),
  }
  const ids = new Set(here.map((o) => o.id))
  updateWarehouse((s) => ({
    ...s,
    orders: s.orders.map((o) => (ids.has(o.id) ? { ...o, tableId: null, closedTable: { tableId, at: now, by } } : o)),
    tableCleanings: [...s.tableCleanings, entry],
  }))
  return delay(entry, ms)
}

/** Стол убран — он снова свободен. */
export async function cleanTable({ id, by }: { id: number; by: string }): Promise<void> {
  const c = getWarehouse().tableCleanings.find((x) => x.id === id)
  if (!c) throw new Error('Запись не найдена.')
  if (c.cleanedAt) throw new Error('Стол уже отмечен убранным.')
  updateWarehouse((s) => ({ ...s, tableCleanings: s.tableCleanings.map((x) => (x.id === id ? { ...x, cleanedAt: new Date().toISOString(), cleanedBy: by } : x)) }))
  await delay(null, 50)
}

export async function requestBill(orderId: number): Promise<void> {
  updateWarehouse((s) => ({ ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'bill' as const } : o)) }))
  await delay(null, ms)
}
