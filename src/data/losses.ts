import type { MenuItem } from '@/types/menu.types'
import type { Order } from '@/types/order.types'
import type { Butchering, Product, Recipe, WarehouseDoc } from '@/types/warehouse.types'
import { consumptionFor } from './consumption'
import { unitCost, type CostCtx } from './recipe.calc'
import { replay } from './warehouse.calc'

/** Откуда берутся потери. Порядок — как в отчёте. */
export const LossCause = {
  SPOILAGE: 'spoilage',
  DEFECT: 'defect',
  INVENTORY: 'inventory',
  CANCELLED: 'cancelled',
  BUTCHERING: 'butchering',
  STAFF: 'staff',
  OTHER: 'other',
} as const
export type LossCause = (typeof LossCause)[keyof typeof LossCause]

export const LOSS_CAUSES = Object.values(LossCause) as LossCause[]

export const LOSS_LABEL: Record<LossCause, string> = {
  spoilage: 'Порча',
  defect: 'Брак',
  inventory: 'Недостача при инвентаризации',
  cancelled: 'Отменённые блюда',
  butchering: 'Отход при разделке',
  staff: 'Питание персонала',
  other: 'Прочие списания',
}

export const LOSS_HINT: Record<LossCause, string> = {
  spoilage: 'Ручные акты списания с причиной «Порча»: продукт испортился или не прошёл проверку качества.',
  defect: 'Ручные акты списания с причиной «Брак».',
  inventory: 'Факт на инвентаризации меньше учёта: продукт ушёл без документов. Излишки здесь не вычитаются — их видно в отчёте «Потери и расхождения».',
  cancelled: 'Блюда, которые официант отменил, когда кухня уже готовила или блюдо было готово. Продукты считаются по тех. карте.',
  butchering: 'Часть сырья, которая не попала ни в один продукт разделки (остаток доли до 100%): кожа, жилы, обрезки.',
  staff: 'Списания с причиной «Сотрудникам». Это не порча, но продукты уходят со склада без выручки.',
  other: 'Остальные ручные списания («Прочее» и т. п.).',
}

/**
 * Цвета причин: пять основных — слоты палитры, проверенные validate_palette (светлая и тёмная тема; в светлой у жёлтого
 * контраст 2,99:1, поэтому у каждой причины есть подпись). «Питание персонала» и «Прочее» — нейтральные серые.
 */
export const LOSS_COLOR: Record<LossCause, string> = {
  spoilage: '#3987e5',
  defect: '#d95926',
  inventory: '#199e70',
  cancelled: '#c98500',
  butchering: '#d55181',
  staff: '#94a3b8',
  other: '#64748b',
}

export interface LossEvent {
  id: number
  date: string
  productId: number
  qty: number
  /** Стоимость потерянного по себестоимости, сум */
  sum: number
  cause: LossCause
  /** Документ или счёт, из-за которого возникла потеря */
  ref: string
  /** Кто или почему, если известно */
  note: string
}

export interface LossInput {
  docs: WarehouseDoc[]
  orders: Order[]
  butcherings: Butchering[]
  menuItems: MenuItem[]
  products: Product[]
  recipes: Recipe[]
  ctx: CostCtx
  from: string
  to: string
}

const AUTO_REASONS = ['Продажа (авто)', 'Приготовление', 'Разделка']
const MANUAL_CAUSE: Record<string, LossCause> = { Порча: LossCause.SPOILAGE, Брак: LossCause.DEFECT, Сотрудникам: LossCause.STAFF }

/** Все события потерь за период [from, to]: списания, недостачи, отменённые блюда и отходы разделки. */
export function lossEvents({ docs, orders, butcherings, menuItems, products, recipes, ctx, from, to }: LossInput): LossEvent[] {
  const out: LossEvent[] = []
  let id = 1
  const inRange = (d: string) => d >= from && d <= to

  // 1. Документы склада: ручные списания и недостачи инвентаризации (по фактической себестоимости движения)
  const docById = new Map(docs.map((d) => [d.id, d]))
  for (const m of replay(docs).movements) {
    if (m.qty >= 0 || !inRange(m.date)) continue
    const d = docById.get(m.docId)
    if (!d || AUTO_REASONS.includes(d.reason)) continue
    const inventory = !!d.source?.startsWith('ИН')
    out.push({
      id: id++, date: m.date, productId: m.productId, qty: Math.abs(m.qty), sum: Math.abs(m.sum),
      cause: inventory ? LossCause.INVENTORY : (MANUAL_CAUSE[d.reason] ?? LossCause.OTHER),
      ref: d.number, note: d.comment || d.reason,
    })
  }

  // 2. Отменённые блюда, которые кухня уже начала или приготовила
  const pm = new Map(products.map((p) => [p.id, p]))
  const rm = new Map(recipes.map((r) => [r.productId, r]))
  const mi = new Map(menuItems.map((m) => [m.id, m]))
  for (const o of orders) {
    for (const c of o.cancelled ?? []) {
      const date = c.at.slice(0, 10)
      if (!inRange(date) || (c.wasStatus !== 'ready' && c.wasStatus !== 'cooking')) continue
      const menu = mi.get(c.menuItemId)
      if (!menu) continue
      for (const [pid, qty] of consumptionFor(menu.productId, c.qty, pm, rm, new Map())) {
        out.push({
          id: id++, date, productId: pid, qty, sum: qty * unitCost(pid, ctx), cause: LossCause.CANCELLED,
          ref: `Счёт №${o.id}`, note: `${c.qty} × ${c.name}: ${c.reason}${c.wasStatus === 'ready' ? ' (было готово)' : ' (готовилось)'}`,
        })
      }
    }
  }

  // 3. Отход при разделке: доля себестоимости, не попавшая ни в один продукт
  for (const b of butcherings) {
    if (b.status !== 'posted' || !inRange(b.date)) continue
    const share = b.outputs.reduce((s, o) => s + o.sharePct, 0)
    const waste = Math.max(0, 100 - share)
    if (waste <= 0 || !b.totalCost) continue
    const outQty = b.outputs.reduce((s, o) => s + o.qty, 0)
    out.push({
      id: id++, date: b.date, productId: b.inputProductId, qty: Math.max(0, b.inputQty - outQty),
      sum: (b.totalCost * waste) / 100, cause: LossCause.BUTCHERING, ref: b.number, note: `Отход ${waste.toFixed(0)}% от сырья`,
    })
  }

  return out.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
}

export interface LossByProduct {
  id: number
  productId: number
  qty: number
  sum: number
  /** Доля в общей сумме потерь, % */
  share: number
  byCause: Partial<Record<LossCause, number>>
  topCause: LossCause
}

export function lossByProduct(events: LossEvent[]): LossByProduct[] {
  const total = events.reduce((s, e) => s + e.sum, 0)
  const m = new Map<number, Omit<LossByProduct, 'share' | 'topCause'>>()
  for (const e of events) {
    const c = m.get(e.productId) ?? { id: e.productId, productId: e.productId, qty: 0, sum: 0, byCause: {} }
    c.qty += e.qty
    c.sum += e.sum
    c.byCause[e.cause] = (c.byCause[e.cause] ?? 0) + e.sum
    m.set(e.productId, c)
  }
  return [...m.values()]
    .map((c) => ({ ...c, share: total > 0 ? (c.sum / total) * 100 : 0, topCause: (Object.entries(c.byCause).sort((a, b) => b[1] - a[1])[0][0]) as LossCause }))
    .sort((a, b) => b.sum - a.sum)
}

export interface LossByCause {
  id: number
  cause: LossCause
  events: number
  products: number
  sum: number
  share: number
}

export function lossByCause(events: LossEvent[]): LossByCause[] {
  const total = events.reduce((s, e) => s + e.sum, 0)
  return LOSS_CAUSES.map((cause, i) => {
    const list = events.filter((e) => e.cause === cause)
    const sum = list.reduce((s, e) => s + e.sum, 0)
    return { id: i + 1, cause, events: list.length, products: new Set(list.map((e) => e.productId)).size, sum, share: total > 0 ? (sum / total) * 100 : 0 }
  }).filter((r) => r.events > 0).sort((a, b) => b.sum - a.sum)
}
