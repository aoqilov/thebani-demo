import type { Movement } from '@/types/warehouse.types'

export interface Flow {
  qty: number
  sum: number
}

export interface TurnoverRow {
  /** = productId, нужен для CusTable */
  id: number
  productId: number
  opening: Flow
  income: Flow
  expense: Flow
  closing: Flow
}

const empty = (): Flow => ({ qty: 0, sum: 0 })

/**
 * Оборотная ведомость за период [from, to] (YYYY-MM-DD, включительно):
 * начальный остаток + приход − расход = конечный остаток, в количестве и в деньгах.
 */
export function turnover(movements: Movement[], from: string, to: string): TurnoverRow[] {
  const rows = new Map<number, TurnoverRow>()
  const row = (id: number) => {
    let r = rows.get(id)
    if (!r) { r = { id, productId: id, opening: empty(), income: empty(), expense: empty(), closing: empty() }; rows.set(id, r) }
    return r
  }
  for (const m of movements) {
    if (m.date > to) continue
    const r = row(m.productId)
    if (m.date < from) { r.opening.qty += m.qty; r.opening.sum += m.sum; continue }
    const f = m.qty > 0 ? r.income : r.expense
    f.qty += Math.abs(m.qty)
    f.sum += Math.abs(m.sum)
  }
  for (const r of rows.values()) {
    r.closing = { qty: r.opening.qty + r.income.qty - r.expense.qty, sum: r.opening.sum + r.income.sum - r.expense.sum }
  }
  return [...rows.values()]
}
