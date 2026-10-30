export type Station = 'kitchen' | 'bar'
export const STATION_LABEL: Record<Station, string> = { kitchen: 'Кухня', bar: 'Бар' }

export interface MenuCategory {
  id: number
  name: string
  sort: number
}

export interface ModifierOption {
  id: number
  name: string
  /** Доплата, сум (0 — бесплатно) */
  price: number
  /** Что списывать со склада при выборе варианта (товар или заготовка) */
  productId?: number
  /** Сколько списывать на одну порцию блюда, в единицах товара */
  qty?: number
  /** Ингредиент основной тех. карты, который вариант заменяет (он не списывается) */
  replaceProductId?: number
}

export interface ModifierGroup {
  id: number
  name: string
  /** Обязательно выбрать хотя бы один вариант */
  required: boolean
  /** Можно выбрать несколько */
  multiple: boolean
  options: ModifierOption[]
}

/** Позиция меню: блюдо (по тех. карте) или покупной товар (кола, пиво). */
export interface MenuItem {
  id: number
  categoryId: number
  /** Блюдо или товар из номенклатуры склада */
  productId: number
  name: string
  price: number
  station: Station
  modifierGroupIds: number[]
  /** Ручной стоп */
  stopped: boolean
  /** Выключенная позиция скрыта от официантов */
  active: boolean
  /** URL или data:-URL фото; без фото показывается заглушка */
  image?: string
}
