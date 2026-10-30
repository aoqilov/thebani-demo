import { useMemo } from 'react'
import { itemState, modCost } from '@/data/menu.calc'
import type { OrderItem } from '@/types/order.types'
import { useMenuItems } from '../../menu/hooks/useMenu'
import { useCostCtx } from '../../warehouse-recipes/components/useCostCtx'

/** Себестоимость одной штуки позиции заказа: по тех. карте блюда плюс расход выбранных модификаторов. */
export function useItemCost(): (i: OrderItem) => number {
  const { data: menu = [] } = useMenuItems()
  const { ctx } = useCostCtx()
  return useMemo(() => {
    const byId = new Map(menu.map((m) => [m.id, m]))
    return (i: OrderItem) => {
      const m = byId.get(i.menuItemId)
      if (!m) return 0
      const recipe = ctx.recipes.get(m.productId)
      return itemState(m, ctx).cost + i.mods.reduce((s, mod) => s + modCost(mod, ctx, recipe), 0)
    }
  }, [menu, ctx])
}
