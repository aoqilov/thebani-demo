import type { MenuItem } from '@/types/menu.types'
import type { Order } from '@/types/order.types'

/** Классы меню (меню-инжиниринг): популярность × маржинальность. */
export type MenuClass = 'star' | 'plowhorse' | 'puzzle' | 'dog'

export const MENU_CLASS_LABEL: Record<MenuClass, string> = {
  star: 'Звезда',
  plowhorse: 'Рабочая лошадка',
  puzzle: 'Загадка',
  dog: 'Собака',
}

export const MENU_CLASS_HINT: Record<MenuClass, string> = {
  star: 'Берут часто и зарабатываем много. Держать в меню, не трогать рецептуру и цену.',
  plowhorse: 'Берут часто, но маржа ниже средней. Поднять цену или удешевить рецептуру.',
  puzzle: 'Маржа высокая, но берут редко. Продвигать: подсказка официанту, место в меню, фото.',
  dog: 'Берут редко и маржа невысокая. Пересмотреть или убрать из меню.',
}

export interface MenuRow {
  id: number
  name: string
  categoryId: number
  price: number
  /** Себестоимость порции; 0 — не удалось посчитать (нет тех. карты или остатков) */
  cost: number
  foodCost: number | null
  /** Маржа с порции = цена − себестоимость */
  margin: number
  qty: number
  revenue: number
  profit: number
  cls: MenuClass | null
}

export interface MenuAnalysis {
  rows: MenuRow[]
  totalQty: number
  totalRevenue: number
  totalProfit: number
  /** Средний food cost по выручке, % */
  avgFoodCost: number | null
  /** Порог популярности (шт.) и маржи (сум), по которым разнесены классы */
  qtyThreshold: number
  marginThreshold: number
}

/**
 * Анализ меню за период. Классы — по методу меню-инжиниринга: популярной считается позиция,
 * проданная не менее чем на 70% от среднего по меню; маржа «высокая» — не ниже средней, взвешенной по продажам.
 */
export function menuAnalysis(items: MenuItem[], orders: Order[], from: string, to: string, costOf: (item: MenuItem) => number): MenuAnalysis {
  const sold = new Map<number, { qty: number; revenue: number }>()
  for (const o of orders) {
    if (o.status !== 'closed' || !o.payment) continue
    const date = o.payment.at.slice(0, 10)
    if (date < from || date > to) continue
    for (const i of o.items) {
      const c = sold.get(i.menuItemId) ?? { qty: 0, revenue: 0 }
      c.qty += i.qty
      c.revenue += i.unitPrice * i.qty
      sold.set(i.menuItemId, c)
    }
  }

  const base = items.filter((m) => m.active).map((m) => {
    const s = sold.get(m.id) ?? { qty: 0, revenue: 0 }
    const cost = costOf(m)
    const margin = cost > 0 ? m.price - cost : 0
    return { id: m.id, name: m.name, categoryId: m.categoryId, price: m.price, cost, foodCost: cost > 0 && m.price > 0 ? (cost / m.price) * 100 : null, margin, qty: s.qty, revenue: s.revenue, profit: cost > 0 ? s.revenue - cost * s.qty : 0 }
  })

  const costed = base.filter((r) => r.cost > 0)
  const totalQty = base.reduce((s, r) => s + r.qty, 0)
  const costedQty = costed.reduce((s, r) => s + r.qty, 0)
  const qtyThreshold = costed.length ? (costedQty / costed.length) * 0.7 : 0
  const marginThreshold = costedQty > 0 ? costed.reduce((s, r) => s + r.margin * r.qty, 0) / costedQty : 0

  const rows: MenuRow[] = base.map((r) => {
    if (r.cost <= 0) return { ...r, cls: null }
    const popular = r.qty >= qtyThreshold
    const rich = r.margin >= marginThreshold
    return { ...r, cls: popular ? (rich ? 'star' : 'plowhorse') : rich ? 'puzzle' : 'dog' }
  })

  const costedRevenue = costed.reduce((s, r) => s + r.revenue, 0)
  const costedCost = costed.reduce((s, r) => s + r.cost * r.qty, 0)
  return {
    rows,
    totalQty,
    totalRevenue: base.reduce((s, r) => s + r.revenue, 0),
    totalProfit: costed.reduce((s, r) => s + r.profit, 0),
    avgFoodCost: costedRevenue > 0 ? (costedCost / costedRevenue) * 100 : null,
    qtyThreshold,
    marginThreshold,
  }
}
