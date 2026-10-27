import { useMemo } from 'react'
import type { CostCtx } from '@/data/recipe.calc'
import { useProducts, useRecipes, useStock } from '../../warehouse-common/hooks/useWarehouse'

/** Контекст расчёта себестоимости: продукты, тех. карты и текущие остатки. */
export function useCostCtx() {
  const { data: products = [], isLoading: l1 } = useProducts()
  const { data: recipes = [], isLoading: l2 } = useRecipes()
  const { data: stock = [], isLoading: l3 } = useStock()

  const ctx: CostCtx = useMemo(
    () => ({
      products: new Map(products.map((p) => [p.id, p])),
      recipes: new Map(recipes.map((r) => [r.productId, r])),
      stock: new Map(stock.map((s) => [s.productId, s])),
    }),
    [products, recipes, stock],
  )
  return { ctx, products, recipes, isLoading: l1 || l2 || l3 }
}
