import { useMemo } from 'react'
import { isStopped, itemState } from '@/data/menu.calc'
import { variance } from '@/data/variance'
import { useMenuItems } from '../../menu/hooks/useMenu'
import { useDocs, useProducts, useRecipes, useStock } from '../../warehouse-common/hooks/useWarehouse'
import { useInventories, useProductions, usePurchaseOrders } from '../../warehouse-common/hooks/useWarehouseOps'
import { useCostCtx } from '../../warehouse-recipes/components/useCostCtx'

export interface WarehouseLive {
  goods: number
  dishes: number
  recipes: number
  lowStock: number
  draftIncome: number
  draftExpense: number
  draftProductions: number
  ordersDraft: number
  ordersSent: number
  stopCount: number
  /** Дата последней проведённой инвентаризации (YYYY-MM-DD) */
  lastInventory: string | null
  inventoryThisMonth: boolean
  /** Потери за текущий месяц по инвентаризациям, сум */
  monthLoss: number
  monthStart: string
}

/** Живые показатели склада для страницы-инструкции: показывают, на каком этапе сейчас склад. */
export function useWarehouseLive(): WarehouseLive {
  const { data: products = [] } = useProducts()
  const { data: recipes = [] } = useRecipes()
  const { data: stock = [] } = useStock()
  const { data: income = [] } = useDocs('income')
  const { data: expense = [] } = useDocs('expense')
  const { data: productions = [] } = useProductions()
  const { data: orders = [] } = usePurchaseOrders()
  const { data: inventories = [] } = useInventories()
  const { data: menu = [] } = useMenuItems()
  const { ctx } = useCostCtx()

  return useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('sv-SE')
    const stockMap = new Map(stock.map((s) => [s.productId, s.qty]))
    const posted = inventories.filter((i) => i.status === 'posted').map((i) => i.date).sort()
    const lastInventory = posted.at(-1) ?? null
    const loss = variance([...income, ...expense], monthStart, now.toLocaleDateString('sv-SE')).reduce((s, r) => s + Math.max(r.lossSum, 0), 0)

    return {
      goods: products.filter((p) => p.kind === 'goods').length,
      dishes: products.filter((p) => p.kind === 'dish').length,
      recipes: recipes.length,
      lowStock: products.filter((p) => p.active && p.kind === 'goods' && (stockMap.get(p.id) ?? 0) < p.minStock).length,
      draftIncome: income.filter((d) => d.status === 'draft').length,
      draftExpense: expense.filter((d) => d.status === 'draft').length,
      draftProductions: productions.filter((p) => p.status === 'draft').length,
      ordersDraft: orders.filter((o) => o.status === 'draft').length,
      ordersSent: orders.filter((o) => o.status === 'sent').length,
      stopCount: menu.filter((m) => isStopped(itemState(m, ctx).status)).length,
      lastInventory,
      inventoryThisMonth: !!lastInventory && lastInventory >= monthStart,
      monthLoss: Math.round(loss),
      monthStart,
    }
  }, [products, recipes, stock, income, expense, productions, orders, inventories, menu, ctx])
}
