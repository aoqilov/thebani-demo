import type { ModifierGroup, ModifierOption } from '@/types/menu.types'
import { seedProducts } from './warehouse.mock'

// Категории и позиции меню строятся из реального меню — см. data/real/catalog.ts
export { seedCategories, seedMenuItems } from './warehouse.mock'

/** Привязка варианта к складу по названию товара (если такого товара нет — вариант без списания). */
const stock = (name: string, qty: number, replace?: string): Pick<ModifierOption, 'productId' | 'qty' | 'replaceProductId'> => {
  const id = seedProducts.find((p) => p.name === name)?.id
  const rid = replace ? seedProducts.find((p) => p.name === replace)?.id : undefined
  return id ? { productId: id, qty, replaceProductId: rid } : {}
}

export const seedModifierGroups: ModifierGroup[] = [
  {
    id: 1, name: 'Прожарка', required: true, multiple: false,
    options: [{ id: 1, name: 'Medium rare', price: 0 }, { id: 2, name: 'Medium', price: 0 }, { id: 3, name: 'Well done', price: 0 }],
  },
  {
    id: 2, name: 'Добавки', required: false, multiple: true,
    options: [{ id: 4, name: 'Сыр', price: 15000, ...stock('Сыр твёрдый', 0.03) }, { id: 5, name: 'Соус', price: 10000 }, { id: 6, name: 'Лаваш', price: 8000 }],
  },
  {
    id: 3, name: 'Острота', required: true, multiple: false,
    options: [{ id: 7, name: 'Не острый', price: 0 }, { id: 8, name: 'Средний', price: 0 }, { id: 9, name: 'Острый', price: 0 }],
  },
  {
    id: 4, name: 'Без…', required: false, multiple: true,
    options: [{ id: 10, name: 'Без лука', price: 0 }, { id: 11, name: 'Без зелени', price: 0 }, { id: 12, name: 'Без чеснока', price: 0 }],
  },
  {
    id: 5, name: 'Молоко', required: false, multiple: false,
    options: [{ id: 13, name: 'Обычное', price: 0 }, { id: 14, name: 'Безлактозное', price: 8000 }, { id: 15, name: 'Овсяное', price: 10000 }],
  },
]
