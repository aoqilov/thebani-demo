import type { WarehouseDoc } from '@/types/warehouse.types'
import { replay } from './warehouse.calc'

export interface VarianceRow {
  /** = productId, нужен для CusTable */
  id: number
  productId: number
  opening: number
  /** Закупки у поставщиков */
  purchases: number
  /** Приготовлено заготовок */
  produced: number
  /** Теоретический расход: списано по тех. картам при продажах и приготовлении */
  theoretical: number
  theoSum: number
  /** Известные списания: порча, брак, питание персонала… */
  writeoff: number
  writeoffSum: number
  /** По итогам инвентаризации */
  invShort: number
  invSurplus: number
  closing: number
  /** Потери = недостача − излишек по инвентаризации (то, что не объяснено ни продажами, ни списаниями) */
  lossQty: number
  lossSum: number
}

const THEORETICAL_REASONS = ['Продажа (авто)', 'Приготовление']

/**
 * Теоретический и фактический расход за период [from, to].
 * Теория — всё, что система списала сама (продажи по тех. картам, приготовление).
 * Факт — результат инвентаризации: недостача/излишек показывают, куда продукт «ушёл» без документов.
 */
export function variance(docs: WarehouseDoc[], from: string, to: string): VarianceRow[] {
  const { movements } = replay(docs)
  const docById = new Map(docs.map((d) => [d.id, d]))
  const rows = new Map<number, VarianceRow & { shortSum: number; surplusSum: number }>()
  const row = (pid: number) => {
    let r = rows.get(pid)
    if (!r) {
      r = { id: pid, productId: pid, opening: 0, purchases: 0, produced: 0, theoretical: 0, theoSum: 0, writeoff: 0, writeoffSum: 0, invShort: 0, invSurplus: 0, closing: 0, lossQty: 0, lossSum: 0, shortSum: 0, surplusSum: 0 }
      rows.set(pid, r)
    }
    return r
  }

  for (const m of movements) {
    if (m.date > to) continue
    const r = row(m.productId)
    if (m.date < from) { r.opening += m.qty; continue }
    const doc = docById.get(m.docId)
    const q = Math.abs(m.qty)
    const s = Math.abs(m.sum)
    if (m.qty > 0) {
      if (doc?.source?.startsWith('ИН')) { r.invSurplus += q; r.surplusSum += s }
      else if (doc?.source?.startsWith('ПЗ')) r.produced += q
      else r.purchases += q
    } else if (doc?.source?.startsWith('ИН')) {
      r.invShort += q
      r.shortSum += s
    } else if (THEORETICAL_REASONS.includes(doc?.reason ?? '')) {
      r.theoretical += q
      r.theoSum += s
    } else {
      r.writeoff += q
      r.writeoffSum += s
    }
  }

  return [...rows.values()].map((r) => ({
    ...r,
    closing: r.opening + r.purchases + r.produced + r.invSurplus - r.theoretical - r.writeoff - r.invShort,
    lossQty: r.invShort - r.invSurplus,
    lossSum: r.shortSum - r.surplusSum,
  }))
}
