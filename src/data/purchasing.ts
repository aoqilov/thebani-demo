import type { Product, ProductGroup, StockRow } from '@/types/warehouse.types'

/** Какой поставщик обычно привозит товары группы (id группы → id поставщика). */
const SUPPLIER_BY_GROUP: Record<number, number> = { 2: 1, 17: 7, 3: 2, 4: 3, 5: 4, 9: 5, 10: 5, 16: 5, 8: 6 }

export function supplierOf(product: Product, groups: ProductGroup[]): number | undefined {
  let g: ProductGroup | undefined = groups.find((x) => x.id === product.groupId)
  while (g) {
    if (SUPPLIER_BY_GROUP[g.id]) return SUPPLIER_BY_GROUP[g.id]
    g = groups.find((x) => x.id === g!.parentId)
  }
  return undefined
}

export interface Suggestion {
  productId: number
  qty: number
  price: number
}

/**
 * Предложение заказа: товары поставщика, остаток которых ниже минимума.
 * Заказываем до 2,5 минимальных остатков; цена — последняя закупочная (или средняя по складу).
 */
export function suggestOrder(supplierId: number, products: Product[], groups: ProductGroup[], stock: StockRow[], lastPrice: Map<number, number>): Suggestion[] {
  const qtyOf = new Map(stock.map((s) => [s.productId, s]))
  return products
    .filter((p) => p.active && p.kind === 'goods' && supplierOf(p, groups) === supplierId)
    .map((p) => {
      const st = qtyOf.get(p.id)
      const have = st?.qty ?? 0
      if (have >= p.minStock) return null
      const raw = p.minStock * 2.5 - have
      const qty = p.unit === 'шт' || p.unit === 'упак' || p.unit === 'порц' ? Math.ceil(raw) : Math.round(raw * 10) / 10
      return { productId: p.id, qty, price: Math.round(lastPrice.get(p.id) ?? st?.avgCost ?? 0) }
    })
    .filter((x): x is Suggestion => x !== null && x.qty > 0)
}
