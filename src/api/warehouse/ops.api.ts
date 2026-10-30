import { delay } from '@/data/mock'
import { negativeProducts } from '@/data/warehouse.calc'
import { buildStock } from '@/data/warehouse.calc'
import { unitCost, type CostCtx } from '@/data/recipe.calc'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import type { Butchering, DocLine, Inventory, Production, PurchaseOrder, WarehouseDoc } from '@/types/warehouse.types'

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 100
const r3 = (n: number) => Math.round(n * 1000) / 1000
const nextId = (list: { id: number }[]) => Math.max(0, ...list.map((x) => x.id)) + 1

function nextNumber(prefix: string, list: { number: string }[]): string {
  const max = Math.max(0, ...list.map((x) => Number(x.number.split('-')[1]) || 0))
  return `${prefix}-${String(max + 1).padStart(6, '0')}`
}

/** Товары, у которых остаток стал отрицательным именно из-за этого изменения. */
function newNegatives(before: WarehouseDoc[], after: WarehouseDoc[]): number[] {
  const had = new Set(negativeProducts(before))
  return negativeProducts(after).filter((id) => !had.has(id))
}

function namesOf(ids: number[]): string {
  const { products } = getWarehouse()
  return ids.map((id) => products.find((p) => p.id === id)?.name ?? id).join(', ')
}

function costCtx(s = getWarehouse()): CostCtx {
  return {
    products: new Map(s.products.map((p) => [p.id, p])),
    recipes: new Map(s.recipes.map((r) => [r.productId, r])),
    stock: new Map(buildStock(s.docs, s.products).map((r) => [r.productId, r])),
  }
}

/** Добавляет в список проведённый документ склада и возвращает его. */
function appendDoc(docs: WarehouseDoc[], p: Omit<WarehouseDoc, 'id' | 'number' | 'status'>): { docs: WarehouseDoc[]; doc: WarehouseDoc } {
  const id = nextId(docs)
  const prefix = p.type === 'income' ? 'ПР' : 'СП'
  const doc: WarehouseDoc = { ...p, id, number: nextNumber(prefix, docs.filter((d) => d.type === p.type)), status: 'posted' }
  return { docs: [...docs, doc], doc }
}

const today = () => new Date().toISOString().slice(0, 10)

// ════════════════ Инвентаризация ════════════════

export const fetchInventories = (): Promise<Inventory[]> =>
  delay([...getWarehouse().inventories].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), ms)
export const fetchInventory = (id: number): Promise<Inventory | undefined> => delay(getWarehouse().inventories.find((i) => i.id === id), ms)

export async function saveInventory(inv: Inventory): Promise<Inventory> {
  const existing = getWarehouse().inventories.find((i) => i.id === inv.id)
  if (existing?.status === 'posted') throw new Error('Проведённую инвентаризацию нельзя изменить. Сначала отмените проведение.')
  if (inv.lines.some((l) => !(l.fact >= 0))) throw new Error('Фактический остаток не может быть отрицательным.')
  let saved!: Inventory
  updateWarehouse((s) => {
    if (existing) {
      saved = { ...inv, status: 'draft', docIds: [] }
      return { ...s, inventories: s.inventories.map((i) => (i.id === inv.id ? saved : i)) }
    }
    saved = { ...inv, id: nextId(s.inventories), number: nextNumber('ИН', s.inventories), status: 'draft', docIds: [] }
    return { ...s, inventories: [...s.inventories, saved] }
  })
  return delay(saved, ms)
}

/** Проведение: недостача → расход, излишек → приход (по средней себестоимости). */
export async function postInventory(id: number): Promise<void> {
  const st = getWarehouse()
  const inv = st.inventories.find((i) => i.id === id)
  if (!inv) throw new Error('Инвентаризация не найдена.')
  if (!inv.lines.length) throw new Error('Добавьте хотя бы одну позицию.')

  const stock = new Map(buildStock(st.docs, st.products).map((r) => [r.productId, r]))
  const lines = inv.lines.map((l) => ({ ...l, expected: r3(stock.get(l.productId)?.qty ?? 0), cost: stock.get(l.productId)?.avgCost ?? 0 }))
  const EPS = 0.0005
  const short = lines.filter((l) => l.fact < l.expected - EPS)
  const over = lines.filter((l) => l.fact > l.expected + EPS)

  updateWarehouse((s) => {
    let docs = s.docs
    const ids: number[] = []
    if (short.length) {
      const res = appendDoc(docs, {
        type: 'expense', date: inv.date, supplierId: null, reason: 'Инвентаризация', source: inv.number, comment: `Недостача по ${inv.number}`,
        lines: short.map((l): DocLine => ({ productId: l.productId, qty: r3(l.expected - l.fact), price: 0 })),
      })
      docs = res.docs
      ids.push(res.doc.id)
    }
    if (over.length) {
      const res = appendDoc(docs, {
        type: 'income', date: inv.date, supplierId: null, reason: '', source: inv.number, comment: `Излишек по ${inv.number}`,
        lines: over.map((l): DocLine => ({ productId: l.productId, qty: r3(l.fact - l.expected), price: Math.round(l.cost) })),
      })
      docs = res.docs
      ids.push(res.doc.id)
    }
    return { ...s, docs, inventories: s.inventories.map((i) => (i.id === id ? { ...i, status: 'posted' as const, lines, docIds: ids } : i)) }
  })
  await delay(null, ms)
}

export async function unpostInventory(id: number): Promise<void> {
  const st = getWarehouse()
  const inv = st.inventories.find((i) => i.id === id)
  if (!inv) throw new Error('Инвентаризация не найдена.')
  const docs = st.docs.filter((d) => !inv.docIds.includes(d.id))
  const bad = newNegatives(st.docs, docs)
  if (bad.length) throw new Error(`Отмена невозможна: остаток уйдёт в минус (${namesOf(bad)}).`)
  updateWarehouse((s) => ({ ...s, docs, inventories: s.inventories.map((i) => (i.id === id ? { ...i, status: 'draft' as const, docIds: [] } : i)) }))
  await delay(null, ms)
}

export async function deleteInventory(id: number): Promise<void> {
  if (getWarehouse().inventories.find((i) => i.id === id)?.status === 'posted') throw new Error('Нельзя удалить проведённую инвентаризацию.')
  updateWarehouse((s) => ({ ...s, inventories: s.inventories.filter((i) => i.id !== id) }))
  await delay(null, ms)
}

// ════════════════ Приготовление заготовок ════════════════

export const fetchProductions = (): Promise<Production[]> =>
  delay([...getWarehouse().productions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), ms)
export const fetchProduction = (id: number): Promise<Production | undefined> => delay(getWarehouse().productions.find((p) => p.id === id), ms)

export async function saveProduction(p: Production): Promise<Production> {
  const existing = getWarehouse().productions.find((x) => x.id === p.id)
  if (existing?.status === 'posted') throw new Error('Проведённый акт нельзя изменить. Сначала отмените проведение.')
  let saved!: Production
  updateWarehouse((s) => {
    if (existing) {
      saved = { ...p, status: 'draft', docIds: [] }
      return { ...s, productions: s.productions.map((x) => (x.id === p.id ? saved : x)) }
    }
    saved = { ...p, id: nextId(s.productions), number: nextNumber('ПЗ', s.productions), status: 'draft', docIds: [] }
    return { ...s, productions: [...s.productions, saved] }
  })
  return delay(saved, ms)
}

/** Проведение: сырьё списывается по тех. карте, заготовка приходуется по себестоимости партии. */
export async function postProduction(id: number): Promise<void> {
  const st = getWarehouse()
  const prod = st.productions.find((p) => p.id === id)
  if (!prod) throw new Error('Акт не найден.')
  if (!prod.lines.length) throw new Error('Добавьте хотя бы одну заготовку.')
  if (prod.lines.some((l) => !(l.qty > 0))) throw new Error('Количество в каждой строке должно быть больше нуля.')

  const ctx = costCtx(st)
  const raw = new Map<number, number>()
  const output: DocLine[] = []
  let total = 0
  for (const l of prod.lines) {
    const recipe = ctx.recipes.get(l.productId)
    if (!recipe || recipe.outputQty <= 0) throw new Error(`У заготовки «${ctx.products.get(l.productId)?.name}» нет тех. карты.`)
    const k = l.qty / recipe.outputQty
    let cost = 0
    for (const rl of recipe.lines) {
      raw.set(rl.productId, (raw.get(rl.productId) ?? 0) + rl.gross * k)
      cost += rl.gross * k * unitCost(rl.productId, ctx)
    }
    total += cost
    output.push({ productId: l.productId, qty: l.qty, price: Math.round(cost / l.qty) })
  }

  let docs = st.docs
  const ids: number[] = []
  const used = appendDoc(docs, {
    type: 'expense', date: prod.date, supplierId: null, reason: 'Приготовление', source: prod.number, comment: `Сырьё для ${prod.number}`,
    lines: [...raw.entries()].map(([productId, qty]): DocLine => ({ productId, qty: r3(qty), price: 0 })),
  })
  docs = used.docs
  ids.push(used.doc.id)
  const made = appendDoc(docs, { type: 'income', date: prod.date, supplierId: null, reason: '', source: prod.number, comment: `Приготовлено по ${prod.number}`, lines: output })
  docs = made.docs
  ids.push(made.doc.id)

  const bad = newNegatives(st.docs, docs)
  if (bad.length) throw new Error(`Не хватает сырья на складе: ${namesOf(bad)}.`)
  updateWarehouse((s) => ({ ...s, docs, productions: s.productions.map((p) => (p.id === id ? { ...p, status: 'posted' as const, docIds: ids, totalCost: Math.round(total) } : p)) }))
  await delay(null, ms)
}

export async function unpostProduction(id: number): Promise<void> {
  const st = getWarehouse()
  const prod = st.productions.find((p) => p.id === id)
  if (!prod) throw new Error('Акт не найден.')
  const docs = st.docs.filter((d) => !prod.docIds.includes(d.id))
  const bad = newNegatives(st.docs, docs)
  if (bad.length) throw new Error(`Отмена невозможна: заготовка уже использована (${namesOf(bad)}).`)
  updateWarehouse((s) => ({ ...s, docs, productions: s.productions.map((p) => (p.id === id ? { ...p, status: 'draft' as const, docIds: [], totalCost: undefined } : p)) }))
  await delay(null, ms)
}

export async function deleteProduction(id: number): Promise<void> {
  if (getWarehouse().productions.find((p) => p.id === id)?.status === 'posted') throw new Error('Нельзя удалить проведённый акт.')
  updateWarehouse((s) => ({ ...s, productions: s.productions.filter((p) => p.id !== id) }))
  await delay(null, ms)
}

// ════════════════ Разделка ════════════════

export const fetchButcherings = (): Promise<Butchering[]> =>
  delay([...getWarehouse().butcherings].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), ms)
export const fetchButchering = (id: number): Promise<Butchering | undefined> => delay(getWarehouse().butcherings.find((b) => b.id === id), ms)

export async function saveButchering(b: Butchering): Promise<Butchering> {
  const existing = getWarehouse().butcherings.find((x) => x.id === b.id)
  if (existing?.status === 'posted') throw new Error('Проведённый акт нельзя изменить. Сначала отмените проведение.')
  let saved!: Butchering
  updateWarehouse((s) => {
    if (existing) {
      saved = { ...b, status: 'draft', docIds: [], totalCost: undefined }
      return { ...s, butcherings: s.butcherings.map((x) => (x.id === b.id ? saved : x)) }
    }
    saved = { ...b, id: nextId(s.butcherings), number: nextNumber('РЗ', s.butcherings), status: 'draft', docIds: [] }
    return { ...s, butcherings: [...s.butcherings, saved] }
  })
  return delay(saved, ms)
}

/**
 * Проведение: сырьё списывается, каждый выход приходуется по своей доле себестоимости сырья.
 * Остаток доли до 100% — отход: он не приходуется (убыток).
 */
export async function postButchering(id: number): Promise<void> {
  const st = getWarehouse()
  const b = st.butcherings.find((x) => x.id === id)
  if (!b) throw new Error('Акт не найден.')
  if (!b.inputProductId) throw new Error('Выберите сырьё для разделки.')
  if (!(b.inputQty > 0)) throw new Error('Укажите количество сырья.')
  if (!b.outputs.length) throw new Error('Добавьте хотя бы один выход.')
  if (b.outputs.some((o) => !(o.qty > 0))) throw new Error('Количество в каждой строке выходов должно быть больше нуля.')
  if (b.outputs.some((o) => o.sharePct < 0)) throw new Error('Доля себестоимости не может быть отрицательной.')
  if (b.outputs.some((o) => o.productId === b.inputProductId)) throw new Error('Сырьё не может быть и выходом разделки.')
  const share = b.outputs.reduce((sum, o) => sum + o.sharePct, 0)
  if (share > 100 + 1e-9) throw new Error(`Сумма долей себестоимости ${share}% — больше 100%.`)

  const ctx = costCtx(st)
  const cost = b.inputQty * unitCost(b.inputProductId, ctx)

  let docs = st.docs
  const used = appendDoc(docs, {
    type: 'expense', date: b.date, supplierId: null, reason: 'Разделка', source: b.number, comment: `Сырьё для ${b.number}`,
    lines: [{ productId: b.inputProductId, qty: r3(b.inputQty), price: 0 }],
  })
  docs = used.docs
  const made = appendDoc(docs, {
    type: 'income', date: b.date, supplierId: null, reason: '', source: b.number, comment: `Получено по ${b.number}`,
    lines: b.outputs.map((o): DocLine => ({ productId: o.productId, qty: o.qty, price: Math.round((cost * o.sharePct) / 100 / o.qty) })),
  })
  docs = made.docs

  const bad = newNegatives(st.docs, docs)
  if (bad.length) throw new Error(`Не хватает сырья на складе: ${namesOf(bad)}.`)
  updateWarehouse((s) => ({ ...s, docs, butcherings: s.butcherings.map((x) => (x.id === id ? { ...x, status: 'posted' as const, docIds: [used.doc.id, made.doc.id], totalCost: Math.round(cost) } : x)) }))
  await delay(null, ms)
}

export async function unpostButchering(id: number): Promise<void> {
  const st = getWarehouse()
  const b = st.butcherings.find((x) => x.id === id)
  if (!b) throw new Error('Акт не найден.')
  const docs = st.docs.filter((d) => !b.docIds.includes(d.id))
  const bad = newNegatives(st.docs, docs)
  if (bad.length) throw new Error(`Отмена невозможна: продукт уже использован (${namesOf(bad)}).`)
  updateWarehouse((s) => ({ ...s, docs, butcherings: s.butcherings.map((x) => (x.id === id ? { ...x, status: 'draft' as const, docIds: [], totalCost: undefined } : x)) }))
  await delay(null, ms)
}

export async function deleteButchering(id: number): Promise<void> {
  if (getWarehouse().butcherings.find((b) => b.id === id)?.status === 'posted') throw new Error('Нельзя удалить проведённый акт.')
  updateWarehouse((s) => ({ ...s, butcherings: s.butcherings.filter((b) => b.id !== id) }))
  await delay(null, ms)
}

// ════════════════ Заказы поставщикам ════════════════

export const fetchPurchaseOrders = (): Promise<PurchaseOrder[]> =>
  delay([...getWarehouse().purchaseOrders].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), ms)
export const fetchPurchaseOrder = (id: number): Promise<PurchaseOrder | undefined> => delay(getWarehouse().purchaseOrders.find((o) => o.id === id), ms)

export async function savePurchaseOrder(o: PurchaseOrder): Promise<PurchaseOrder> {
  const existing = getWarehouse().purchaseOrders.find((x) => x.id === o.id)
  if (existing && existing.status !== 'draft') throw new Error('Отправленный заказ нельзя изменить.')
  let saved!: PurchaseOrder
  updateWarehouse((s) => {
    if (existing) {
      saved = { ...o, status: 'draft' }
      return { ...s, purchaseOrders: s.purchaseOrders.map((x) => (x.id === o.id ? saved : x)) }
    }
    saved = { ...o, id: nextId(s.purchaseOrders), number: nextNumber('ЗП', s.purchaseOrders), status: 'draft', date: o.date || today() }
    return { ...s, purchaseOrders: [...s.purchaseOrders, saved] }
  })
  return delay(saved, ms)
}

function validateOrder(o: PurchaseOrder) {
  if (!o.supplierId) throw new Error('Выберите поставщика.')
  if (!o.lines.length) throw new Error('Добавьте хотя бы одну позицию.')
  if (o.lines.some((l) => !(l.qty > 0))) throw new Error('Количество в каждой строке должно быть больше нуля.')
}

export async function sendPurchaseOrder(id: number): Promise<void> {
  const o = getWarehouse().purchaseOrders.find((x) => x.id === id)
  if (!o) throw new Error('Заказ не найден.')
  validateOrder(o)
  updateWarehouse((s) => ({ ...s, purchaseOrders: s.purchaseOrders.map((x) => (x.id === id ? { ...x, status: 'sent' as const } : x)) }))
  await delay(null, ms)
}

/** Приёмка: создаётся и сразу проводится приходная накладная с позициями заказа. */
export async function receivePurchaseOrder(id: number): Promise<void> {
  const o = getWarehouse().purchaseOrders.find((x) => x.id === id)
  if (!o) throw new Error('Заказ не найден.')
  if (o.status === 'received') throw new Error('Товар по этому заказу уже принят.')
  validateOrder(o)
  updateWarehouse((s) => {
    const res = appendDoc(s.docs, { type: 'income', date: today(), supplierId: o.supplierId, reason: '', source: o.number, comment: `Приёмка по заказу ${o.number}`, lines: o.lines })
    return { ...s, docs: res.docs, purchaseOrders: s.purchaseOrders.map((x) => (x.id === id ? { ...x, status: 'received' as const, incomeDocId: res.doc.id } : x)) }
  })
  await delay(null, ms)
}

export async function deletePurchaseOrder(id: number): Promise<void> {
  if (getWarehouse().purchaseOrders.find((o) => o.id === id)?.status === 'received') throw new Error('Нельзя удалить принятый заказ.')
  updateWarehouse((s) => ({ ...s, purchaseOrders: s.purchaseOrders.filter((o) => o.id !== id) }))
  await delay(null, ms)
}
