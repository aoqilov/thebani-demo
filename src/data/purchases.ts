import type { WarehouseDoc } from '@/types/warehouse.types'

/** Строка закупки: одна позиция одной проведённой приходной накладной от поставщика. */
export interface PurchaseRow {
  docId: number
  number: string
  date: string
  supplierId: number
  productId: number
  qty: number
  price: number
  sum: number
  /** Документ-источник (например, заказ поставщику ЗП-…), если накладная создана автоматически */
  source?: string
}

export interface PurchaseFilter {
  from: string
  to: string
  supplierId: number | null
  /** null — все товары; иначе допустимые productId (например, из выбранной группы) */
  productIds: Set<number> | null
}

/** Только проведённые приходы от поставщика: инвентаризация, приготовление и разделка приходуют без поставщика. */
export function purchaseRows(docs: WarehouseDoc[], f: PurchaseFilter): PurchaseRow[] {
  const out: PurchaseRow[] = []
  for (const d of docs) {
    if (d.type !== 'income' || d.status !== 'posted' || d.supplierId === null) continue
    if (d.date < f.from || d.date > f.to) continue
    if (f.supplierId !== null && d.supplierId !== f.supplierId) continue
    for (const l of d.lines) {
      if (f.productIds && !f.productIds.has(l.productId)) continue
      out.push({ docId: d.id, number: d.number, date: d.date, supplierId: d.supplierId, productId: l.productId, qty: l.qty, price: l.price, sum: l.qty * l.price, source: d.source })
    }
  }
  return out
}

export interface SupplierStat {
  id: number
  supplierId: number
  docs: number
  positions: number
  sum: number
  /** Доля в закупках за период, % */
  share: number
  lastDate: string
}

export function bySupplier(rows: PurchaseRow[]): SupplierStat[] {
  const total = rows.reduce((s, r) => s + r.sum, 0)
  const m = new Map<number, { docs: Set<number>; products: Set<number>; sum: number; last: string }>()
  for (const r of rows) {
    const c = m.get(r.supplierId) ?? { docs: new Set(), products: new Set(), sum: 0, last: '' }
    c.docs.add(r.docId)
    c.products.add(r.productId)
    c.sum += r.sum
    if (r.date > c.last) c.last = r.date
    m.set(r.supplierId, c)
  }
  return [...m.entries()]
    .map(([supplierId, c]) => ({ id: supplierId, supplierId, docs: c.docs.size, positions: c.products.size, sum: c.sum, share: total > 0 ? (c.sum / total) * 100 : 0, lastDate: c.last }))
    .sort((a, b) => b.sum - a.sum)
}

export interface ProductStat {
  id: number
  productId: number
  suppliers: number
  qty: number
  sum: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  lastPrice: number
  /** Изменение цены от первой закупки периода к последней, %; null — одна закупка */
  priceChange: number | null
  /** Самый дешёвый поставщик по средней цене (если их несколько) */
  cheapestSupplierId: number | null
}

export function byProduct(rows: PurchaseRow[]): ProductStat[] {
  const m = new Map<number, PurchaseRow[]>()
  for (const r of rows) m.set(r.productId, [...(m.get(r.productId) ?? []), r])
  return [...m.entries()]
    .map(([productId, list]) => {
      const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.docId - b.docId)
      const qty = list.reduce((s, r) => s + r.qty, 0)
      const sum = list.reduce((s, r) => s + r.sum, 0)
      const prices = list.map((r) => r.price)
      const first = sorted[0].price
      const last = sorted[sorted.length - 1].price

      const sup = new Map<number, { q: number; s: number }>()
      for (const r of list) {
        const c = sup.get(r.supplierId) ?? { q: 0, s: 0 }
        c.q += r.qty
        c.s += r.sum
        sup.set(r.supplierId, c)
      }
      const cheapest = sup.size > 1 ? [...sup.entries()].filter(([, c]) => c.q > 0).sort((a, b) => a[1].s / a[1].q - b[1].s / b[1].q)[0]?.[0] ?? null : null

      return {
        id: productId, productId, suppliers: sup.size, qty, sum,
        avgPrice: qty > 0 ? sum / qty : 0, minPrice: Math.min(...prices), maxPrice: Math.max(...prices), lastPrice: last,
        priceChange: list.length > 1 && first > 0 ? ((last - first) / first) * 100 : null,
        cheapestSupplierId: cheapest,
      }
    })
    .sort((a, b) => b.sum - a.sum)
}

export interface InvoiceStat {
  id: number
  number: string
  date: string
  supplierId: number
  lines: PurchaseRow[]
  sum: number
  source?: string
}

export function invoices(rows: PurchaseRow[]): InvoiceStat[] {
  const m = new Map<number, InvoiceStat>()
  for (const r of rows) {
    const c = m.get(r.docId) ?? { id: r.docId, number: r.number, date: r.date, supplierId: r.supplierId, lines: [], sum: 0, source: r.source }
    c.lines.push(r)
    c.sum += r.sum
    m.set(r.docId, c)
  }
  return [...m.values()].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
}
