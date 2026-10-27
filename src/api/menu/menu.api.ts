import { delay } from '@/data/mock'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import type { MenuCategory, MenuItem, ModifierGroup } from '@/types/menu.types'

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 100
const nextId = (list: { id: number }[]) => Math.max(0, ...list.map((x) => x.id)) + 1

export const fetchMenuCategories = (): Promise<MenuCategory[]> => delay([...getWarehouse().menuCategories].sort((a, b) => a.sort - b.sort), ms)
export const fetchMenuItems = (): Promise<MenuItem[]> => delay(getWarehouse().menuItems, ms)
export const fetchModifierGroups = (): Promise<ModifierGroup[]> => delay(getWarehouse().modifierGroups, ms)

export async function saveCategory(c: { id?: number; name: string }): Promise<void> {
  if (!c.name.trim()) throw new Error('Укажите название категории.')
  updateWarehouse((s) => {
    if (c.id) return { ...s, menuCategories: s.menuCategories.map((x) => (x.id === c.id ? { ...x, name: c.name.trim() } : x)) }
    const sort = Math.max(0, ...s.menuCategories.map((x) => x.sort)) + 1
    return { ...s, menuCategories: [...s.menuCategories, { id: nextId(s.menuCategories), name: c.name.trim(), sort }] }
  })
  await delay(null, ms)
}

export async function deleteCategory(id: number): Promise<void> {
  if (getWarehouse().menuItems.some((i) => i.categoryId === id)) throw new Error('В категории есть позиции — сначала перенесите или удалите их.')
  updateWarehouse((s) => ({ ...s, menuCategories: s.menuCategories.filter((c) => c.id !== id) }))
  await delay(null, ms)
}

/** Сдвиг категории вверх (-1) или вниз (+1). */
export async function moveCategory({ id, dir }: { id: number; dir: -1 | 1 }): Promise<void> {
  updateWarehouse((s) => {
    const sorted = [...s.menuCategories].sort((a, b) => a.sort - b.sort)
    const i = sorted.findIndex((c) => c.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= sorted.length) return s
    ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
    return { ...s, menuCategories: sorted.map((c, idx) => ({ ...c, sort: idx + 1 })) }
  })
  await delay(null, ms)
}

export async function saveMenuItem(item: Omit<MenuItem, 'id'> & { id?: number }): Promise<void> {
  if (!item.productId) throw new Error('Выберите блюдо или товар.')
  if (!item.name.trim()) throw new Error('Укажите название.')
  if (!(item.price > 0)) throw new Error('Цена должна быть больше нуля.')
  updateWarehouse((s) => {
    const isDish = s.products.find((p) => p.id === item.productId)?.kind === 'dish'
    // цена блюда живёт в номенклатуре — тех. карта считает по ней food cost
    const products = isDish ? s.products.map((p) => (p.id === item.productId ? { ...p, price: item.price } : p)) : s.products
    const menuItems = item.id
      ? s.menuItems.map((i) => (i.id === item.id ? { ...item, id: item.id } : i))
      : [...s.menuItems, { ...item, id: nextId(s.menuItems) }]
    return { ...s, products, menuItems }
  })
  await delay(null, ms)
}

export async function deleteMenuItem(id: number): Promise<void> {
  updateWarehouse((s) => ({ ...s, menuItems: s.menuItems.filter((i) => i.id !== id) }))
  await delay(null, ms)
}

export async function setItemStopped({ id, stopped }: { id: number; stopped: boolean }): Promise<void> {
  updateWarehouse((s) => ({ ...s, menuItems: s.menuItems.map((i) => (i.id === id ? { ...i, stopped } : i)) }))
  await delay(null, 60)
}

export async function saveModifierGroup(g: Omit<ModifierGroup, 'id'> & { id?: number }): Promise<void> {
  if (!g.name.trim()) throw new Error('Укажите название группы.')
  const options = g.options.filter((o) => o.name.trim())
  if (!options.length) throw new Error('Добавьте хотя бы один вариант.')
  updateWarehouse((s) => {
    let oid = Math.max(0, ...s.modifierGroups.flatMap((x) => x.options.map((o) => o.id)))
    const fixed = options.map((o) => ({ ...o, id: o.id || ++oid }))
    if (g.id) return { ...s, modifierGroups: s.modifierGroups.map((x) => (x.id === g.id ? { ...g, id: g.id, options: fixed } : x)) }
    return { ...s, modifierGroups: [...s.modifierGroups, { ...g, id: nextId(s.modifierGroups), options: fixed }] }
  })
  await delay(null, ms)
}

export async function deleteModifierGroup(id: number): Promise<void> {
  updateWarehouse((s) => ({
    ...s,
    modifierGroups: s.modifierGroups.filter((g) => g.id !== id),
    menuItems: s.menuItems.map((i) => ({ ...i, modifierGroupIds: i.modifierGroupIds.filter((x) => x !== id) })),
  }))
  await delay(null, ms)
}
