import type { MenuItem } from '@/types/menu.types'
import type { Recipe } from '@/types/warehouse.types'
import { capacity, recipeStats, unitCost, type CostCtx } from './recipe.calc'

export type Availability = 'ok' | 'low' | 'stop-manual' | 'stop-auto' | 'norecipe' | 'hidden'

export interface ItemState {
  status: Availability
  /** Сколько порций/единиц ещё можно продать; null — не считается */
  portions: number | null
  /** Пояснение для стоп-листа */
  reason: string
  /** Можно ли заказать официанту */
  sellable: boolean
  cost: number
  foodCost: number | null
}

const LOW_PORTIONS = 5

/**
 * Состояние позиции меню.
 * Стоп-лист: вручную (stopped) или автоматически — когда ингредиентов не хватает даже на одну порцию.
 */
export function itemState(item: MenuItem, ctx: CostCtx): ItemState {
  const product = ctx.products.get(item.productId)
  const recipe = ctx.recipes.get(item.productId)
  const isDish = product?.kind === 'dish'

  const cost = isDish ? (recipe ? recipeStats(recipe, item.price, ctx).perUnit : 0) : unitCost(item.productId, ctx)
  const foodCost = item.price > 0 && cost > 0 ? (cost / item.price) * 100 : null
  const base = { cost, foodCost }

  if (!item.active) return { ...base, status: 'hidden', portions: null, reason: 'Скрыта из меню', sellable: false }
  if (item.stopped) return { ...base, status: 'stop-manual', portions: null, reason: 'Стоп вручную', sellable: false }

  if (isDish) {
    if (!recipe) return { ...base, status: 'norecipe', portions: null, reason: 'Нет тех. карты', sellable: false }
    const cap = capacity(recipe, ctx)
    if (cap.portions === 0) {
      const lack = cap.limitingProductId !== null ? ctx.products.get(cap.limitingProductId)?.name : undefined
      return { ...base, status: 'stop-auto', portions: 0, reason: lack ? `Нет на складе: ${lack}` : 'Нет продуктов', sellable: false }
    }
    const low = cap.portions !== null && cap.portions < LOW_PORTIONS
    return { ...base, status: low ? 'low' : 'ok', portions: cap.portions, reason: low ? 'Заканчивается' : '', sellable: true }
  }

  const qty = ctx.stock.get(item.productId)?.qty ?? 0
  if (qty <= 0) return { ...base, status: 'stop-auto', portions: 0, reason: 'Нет на складе', sellable: false }
  const low = qty < (product?.minStock ?? 0)
  return { ...base, status: low ? 'low' : 'ok', portions: Math.floor(qty), reason: low ? 'Заканчивается' : '', sellable: true }
}

/** Складская привязка модификатора (и у варианта в настройках, и у выбранного в заказе). */
export interface ModStock {
  productId?: number
  qty?: number
  replaceProductId?: number
}

/** Хватает ли на складе на одну порцию модификатора. Заготовку и блюдо можно приготовить — их проверяем мягче. */
export function modAvailability(m: ModStock, ctx: CostCtx): { available: boolean; reason: string } {
  if (!m.productId || !m.qty) return { available: true, reason: '' }
  const p = ctx.products.get(m.productId)
  if (!p) return { available: true, reason: '' }
  const have = ctx.stock.get(m.productId)?.qty ?? 0
  if (p.kind === 'goods') return have >= m.qty ? { available: true, reason: '' } : { available: false, reason: `Нет на складе: ${p.name}` }
  if (p.kind === 'prep' && have >= m.qty) return { available: true, reason: '' }
  const r = ctx.recipes.get(m.productId)
  if (!r) return { available: false, reason: `Нет тех. карты: ${p.name}` }
  const cap = capacity(r, ctx).portions
  return cap === null || cap >= m.qty ? { available: true, reason: '' } : { available: false, reason: `Нет на складе: ${p.name}` }
}

/**
 * Себестоимость модификатора на одну порцию блюда: + товар модификатора − заменённый ингредиент.
 * Заменённый ингредиент считаем, только если передана тех. карта блюда.
 */
export function modCost(m: ModStock, ctx: CostCtx, baseRecipe?: Recipe): number {
  if (!m.productId || !m.qty) return 0
  let cost = m.qty * unitCost(m.productId, ctx)
  if (m.replaceProductId && baseRecipe && baseRecipe.outputQty > 0) {
    const line = baseRecipe.lines.find((l) => l.productId === m.replaceProductId)
    if (line) cost -= (line.gross / baseRecipe.outputQty) * unitCost(line.productId, ctx)
  }
  return cost
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  ok: 'В продаже',
  low: 'Заканчивается',
  'stop-manual': 'Стоп (вручную)',
  'stop-auto': 'Стоп (нет продуктов)',
  norecipe: 'Нет тех. карты',
  hidden: 'Скрыта',
}

export const isStopped = (s: Availability) => s === 'stop-manual' || s === 'stop-auto' || s === 'norecipe'
