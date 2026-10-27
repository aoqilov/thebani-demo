import type { Product, Recipe } from '@/types/warehouse.types'

/**
 * Что списать со склада при продаже `qty` единиц продукта `productId`.
 * Покупной товар списывается как есть. У заготовки сначала берётся остаток со склада,
 * недостающая часть «раскладывается» по её тех. карте. Блюдо всегда раскладывается по тех. карте.
 * @returns productId -> количество в единицах товара
 */
export function consumptionFor(
  productId: number,
  qty: number,
  products: Map<number, Product>,
  recipes: Map<number, Recipe>,
  stockQty: Map<number, number>,
): Map<number, number> {
  const out = new Map<number, number>()
  const avail = new Map(stockQty)
  const add = (id: number, q: number) => out.set(id, (out.get(id) ?? 0) + q)

  const walk = (pid: number, q: number, depth: number) => {
    const p = products.get(pid)
    if (!p || q <= 0 || depth > 6) return
    if (p.kind === 'goods') return add(pid, q)

    let need = q
    if (p.kind === 'prep') {
      const have = Math.max(avail.get(pid) ?? 0, 0)
      const take = Math.min(have, q)
      if (take > 0) {
        add(pid, take)
        avail.set(pid, have - take)
      }
      need = q - take
      if (need <= 1e-9) return
    }
    const r = recipes.get(pid)
    if (!r || r.outputQty <= 0) return
    for (const l of r.lines) walk(l.productId, (l.gross * need) / r.outputQty, depth + 1)
  }

  walk(productId, qty, 0)
  return out
}
