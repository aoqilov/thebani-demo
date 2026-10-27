import type { Movement, Product, StockRow, WarehouseDoc } from '@/types/warehouse.types'

interface Cell {
  qty: number
  avg: number
}

/**
 * Пересчёт склада по проведённым документам (как в iiko — средняя себестоимость).
 * Приход: средневзвешенная цена. Расход: списывается по текущей средней.
 */
export function replay(docs: WarehouseDoc[]) {
  const posted = docs.filter((d) => d.status === 'posted').sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
  const cells = new Map<number, Cell>()
  const movements: Movement[] = []
  let mid = 1

  for (const d of posted) {
    for (const l of d.lines) {
      const cur = cells.get(l.productId) ?? { qty: 0, avg: 0 }
      if (d.type === 'income') {
        const nq = cur.qty + l.qty
        const avg = nq > 0 ? (Math.max(cur.qty, 0) * cur.avg + l.qty * l.price) / (Math.max(cur.qty, 0) + l.qty) : l.price
        cells.set(l.productId, { qty: nq, avg })
        movements.push({ id: mid++, date: d.date, docId: d.id, docNumber: d.number, type: 'income', productId: l.productId, qty: l.qty, cost: l.price, sum: l.qty * l.price })
      } else {
        cells.set(l.productId, { qty: cur.qty - l.qty, avg: cur.avg })
        movements.push({ id: mid++, date: d.date, docId: d.id, docNumber: d.number, type: 'expense', productId: l.productId, qty: -l.qty, cost: cur.avg, sum: -l.qty * cur.avg })
      }
    }
  }
  return { cells, movements }
}

export function buildStock(docs: WarehouseDoc[], products: Product[]): StockRow[] {
  const { cells } = replay(docs)
  return products.map((p) => {
    const c = cells.get(p.id) ?? { qty: 0, avg: 0 }
    return { id: p.id, productId: p.id, qty: c.qty, avgCost: c.avg, sum: c.qty * c.avg }
  })
}

/** Id товаров, у которых остаток ушёл в минус. */
export function negativeProducts(docs: WarehouseDoc[]): number[] {
  const { cells } = replay(docs)
  return [...cells.entries()].filter(([, c]) => c.qty < -1e-9).map(([id]) => id)
}
