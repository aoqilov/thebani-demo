import type { Product, Recipe, StockRow } from '@/types/warehouse.types'

export interface CostCtx {
  products: Map<number, Product>
  recipes: Map<number, Recipe>
  stock: Map<number, StockRow>
}

/** Себестоимость единицы: средняя по складу, а если закупок не было — по рецепту (рекурсивно, для заготовок). */
export function unitCost(pid: number, ctx: CostCtx, seen: Set<number> = new Set()): number {
  const st = ctx.stock.get(pid)
  if (st && st.avgCost > 0) return st.avgCost
  const r = ctx.recipes.get(pid)
  if (!r || seen.has(pid) || r.outputQty <= 0) return 0
  const next = new Set(seen).add(pid)
  const total = r.lines.reduce((s, l) => s + l.gross * unitCost(l.productId, ctx, next), 0)
  return total / r.outputQty
}

export interface RecipeLineStat {
  netto: number
  cost: number
  sum: number
}

export interface RecipeStats {
  lines: RecipeLineStat[]
  total: number
  /** Себестоимость одной единицы выхода (порции / кг) */
  perUnit: number
  /** Food cost, % от цены продажи; null если цены нет */
  foodCost: number | null
  margin: number | null
  nettoTotal: number
}

export function recipeStats(r: Recipe, price: number, ctx: CostCtx): RecipeStats {
  const lines = r.lines.map((l) => {
    const cost = unitCost(l.productId, ctx)
    return { netto: l.gross * (1 - l.lossPct / 100), cost, sum: l.gross * cost }
  })
  const total = lines.reduce((s, l) => s + l.sum, 0)
  const perUnit = r.outputQty > 0 ? total / r.outputQty : 0
  return {
    lines,
    total,
    perUnit,
    foodCost: price > 0 ? (perUnit / price) * 100 : null,
    margin: price > 0 ? price - perUnit : null,
    nettoTotal: lines.reduce((s, l) => s + l.netto, 0),
  }
}

export interface Capacity {
  /** Сколько единиц можно приготовить из текущих остатков; null — нечего считать */
  portions: number | null
  limitingProductId: number | null
}

/** «Хватит на N порций»: считаем по покупным товарам и заготовкам, у которых есть остаток. */
export function capacity(r: Recipe, ctx: CostCtx): Capacity {
  let best: number | null = null
  let limiting: number | null = null
  for (const l of r.lines) {
    const p = ctx.products.get(l.productId)
    const qty = ctx.stock.get(l.productId)?.qty ?? 0
    if (!p || l.gross <= 0 || r.outputQty <= 0) continue
    if (p.kind === 'prep' && qty <= 0) continue // заготовку можно приготовить — не ограничивает
    const n = Math.floor(Math.max(qty, 0) / (l.gross / r.outputQty))
    if (best === null || n < best) {
      best = n
      limiting = l.productId
    }
  }
  return { portions: best, limitingProductId: limiting }
}

export function foodCostColor(pct: number | null): 'success' | 'warning' | 'danger' | 'dark' {
  if (pct === null) return 'dark'
  return pct <= 30 ? 'success' : pct <= 40 ? 'warning' : 'danger'
}
