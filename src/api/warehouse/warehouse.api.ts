import { buildStock, negativeProducts, replay } from '@/data/warehouse.calc'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import { delay } from '@/data/mock'
import type { DocType, Movement, Product, ProductGroup, Recipe, StockRow, Supplier, WarehouseDoc } from '@/types/warehouse.types'

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 120

/** Товары, у которых остаток стал отрицательным именно из-за изменения (старые минусы от автосписания не считаются). */
function newNegatives(before: WarehouseDoc[], after: WarehouseDoc[]): number[] {
  const had = new Set(negativeProducts(before))
  return negativeProducts(after).filter((id) => !had.has(id))
}

export const fetchGroups = (): Promise<ProductGroup[]> => delay(getWarehouse().groups, ms)
const groupDescendants = (groups: ProductGroup[], id: number): number[] => [id, ...groups.filter((g) => g.parentId === id).flatMap((g) => groupDescendants(groups, g.id))]

export async function saveGroup(g: { id?: number; name: string; parentId: number | null }): Promise<ProductGroup> {
  const name = g.name.trim()
  if (!name) throw new Error('Укажите название группы.')
  const { groups } = getWarehouse()
  if (groups.some((x) => x.id !== g.id && x.parentId === g.parentId && x.name.toLowerCase() === name.toLowerCase())) throw new Error('В этой папке уже есть группа с таким названием.')
  if (g.id && g.parentId !== null && groupDescendants(groups, g.id).includes(g.parentId)) throw new Error('Группу нельзя переместить внутрь самой себя.')
  let saved!: ProductGroup
  updateWarehouse((s) => {
    if (g.id) {
      saved = { id: g.id, name, parentId: g.parentId }
      return { ...s, groups: s.groups.map((x) => (x.id === g.id ? saved : x)) }
    }
    saved = { id: Math.max(0, ...s.groups.map((x) => x.id)) + 1, name, parentId: g.parentId }
    return { ...s, groups: [...s.groups, saved] }
  })
  return delay(saved, ms)
}

/** Удалять можно только пустую группу: без подгрупп и без номенклатуры (включая удалённую). */
export async function deleteGroup(id: number): Promise<void> {
  const s = getWarehouse()
  if (s.groups.some((g) => g.parentId === id)) throw new Error('В группе есть подгруппы. Сначала удалите или переместите их.')
  if (s.products.some((p) => p.groupId === id)) throw new Error('В группе есть товары. Сначала переместите их в другую группу.')
  updateWarehouse((st) => ({ ...st, groups: st.groups.filter((g) => g.id !== id) }))
  await delay(null, ms)
}

export const fetchSuppliers = (): Promise<Supplier[]> => delay(getWarehouse().suppliers, ms)
export const fetchProducts = (): Promise<Product[]> => delay(getWarehouse().products, ms)

/** copyRecipeFrom — при копировании товара тех. карта исходного копируется в новый. */
export async function saveProduct(input: Omit<Product, 'id' | 'code'> & { id?: number; copyRecipeFrom?: number }): Promise<Product> {
  const { copyRecipeFrom, ...p } = input
  let saved!: Product
  updateWarehouse((s) => {
    if (p.id) {
      saved = { ...s.products.find((x) => x.id === p.id)!, ...p, id: p.id }
      return { ...s, products: s.products.map((x) => (x.id === p.id ? saved : x)) }
    }
    const id = Math.max(0, ...s.products.map((x) => x.id)) + 1
    saved = { ...p, id, code: `${p.kind === 'dish' ? 'B' : 'T'}-${String(id).padStart(4, '0')}` }
    const src = copyRecipeFrom ? s.recipes.find((r) => r.productId === copyRecipeFrom) : undefined
    const recipes = src && p.kind !== 'goods' ? [...s.recipes, { ...src, productId: id, lines: src.lines.map((l) => ({ ...l })) }] : s.recipes
    return { ...s, products: [...s.products, saved], recipes }
  })
  return delay(saved, ms)
}

/**
 * Мягкое удаление, как в iiko: товар скрывается из справочника и выбора, но остаётся в документах и отчётах.
 * Нельзя удалить то, что входит в тех. карты действующих позиций или стоит в меню.
 */
export async function deleteProduct(id: number): Promise<void> {
  const s = getWarehouse()
  const alive = (pid: number) => !s.products.find((x) => x.id === pid)?.deleted
  const inRecipes = s.recipes.filter((r) => alive(r.productId) && r.lines.some((l) => l.productId === id)).map((r) => s.products.find((x) => x.id === r.productId)?.name ?? r.productId)
  if (inRecipes.length) throw new Error(`Входит в тех. карты: ${inRecipes.slice(0, 3).join(', ')}${inRecipes.length > 3 ? ` и ещё ${inRecipes.length - 3}` : ''}. Сначала уберите его из рецептов.`)
  if (s.menuItems.some((m) => m.productId === id)) throw new Error('Товар стоит в меню. Сначала уберите позицию из меню.')
  updateWarehouse((st) => ({ ...st, products: st.products.map((p) => (p.id === id ? { ...p, deleted: true, active: false } : p)) }))
  await delay(null, ms)
}

export async function restoreProduct(id: number): Promise<void> {
  updateWarehouse((s) => ({ ...s, products: s.products.map((p) => (p.id === id ? { ...p, deleted: false, active: true } : p)) }))
  await delay(null, ms)
}

export const fetchDocs = (type: DocType): Promise<WarehouseDoc[]> =>
  delay(getWarehouse().docs.filter((d) => d.type === type).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), ms)

export const fetchDoc = (id: number): Promise<WarehouseDoc | undefined> => delay(getWarehouse().docs.find((d) => d.id === id), ms)

/** Создание или обновление черновика. Проведённый документ менять нельзя. */
export async function saveDoc(doc: WarehouseDoc): Promise<WarehouseDoc> {
  const existing = getWarehouse().docs.find((d) => d.id === doc.id)
  if (existing?.status === 'posted') throw new Error('Проведённый документ нельзя изменить. Сначала отмените проведение.')
  let saved!: WarehouseDoc
  updateWarehouse((s) => {
    if (existing) {
      saved = { ...doc }
      return { ...s, docs: s.docs.map((d) => (d.id === doc.id ? saved : d)) }
    }
    const id = Math.max(0, ...s.docs.map((d) => d.id)) + 1
    const prefix = doc.type === 'income' ? 'ПР' : 'СП'
    const n = s.docs.filter((d) => d.type === doc.type).length + 1
    saved = { ...doc, id, number: `${prefix}-${String(n).padStart(6, '0')}` }
    return { ...s, docs: [...s.docs, saved] }
  })
  return delay(saved, ms)
}

export async function postDoc(id: number): Promise<void> {
  const { docs, products } = getWarehouse()
  const doc = docs.find((d) => d.id === id)
  if (!doc) throw new Error('Документ не найден')
  if (!doc.lines.length) throw new Error('Добавьте хотя бы одну позицию.')
  if (doc.lines.some((l) => !(l.qty > 0))) throw new Error('Количество в каждой строке должно быть больше нуля.')
  if (doc.type === 'income' && !doc.supplierId) throw new Error('Выберите поставщика.')

  const next = docs.map((d) => (d.id === id ? { ...d, status: 'posted' as const } : d))
  const bad = newNegatives(docs, next)
  if (bad.length) {
    const names = bad.map((pid) => products.find((p) => p.id === pid)?.name).join(', ')
    throw new Error(`Недостаточно на складе: ${names}.`)
  }
  updateWarehouse((s) => ({ ...s, docs: next }))
  await delay(null, ms)
}

export async function unpostDoc(id: number): Promise<void> {
  const { docs, products } = getWarehouse()
  const next = docs.map((d) => (d.id === id ? { ...d, status: 'draft' as const } : d))
  const bad = newNegatives(docs, next)
  if (bad.length) {
    const names = bad.map((pid) => products.find((p) => p.id === pid)?.name).join(', ')
    throw new Error(`Отмена невозможна: остаток уйдёт в минус (${names}).`)
  }
  updateWarehouse((s) => ({ ...s, docs: next }))
  await delay(null, ms)
}

export async function deleteDoc(id: number): Promise<void> {
  const doc = getWarehouse().docs.find((d) => d.id === id)
  if (doc?.status === 'posted') throw new Error('Нельзя удалить проведённый документ.')
  updateWarehouse((s) => ({ ...s, docs: s.docs.filter((d) => d.id !== id) }))
  await delay(null, ms)
}

export const fetchStock = (): Promise<StockRow[]> => {
  const { docs, products } = getWarehouse()
  return delay(buildStock(docs, products), ms)
}

export const fetchMovements = (productId?: number): Promise<Movement[]> => {
  const { movements } = replay(getWarehouse().docs)
  return delay(movements.filter((m) => productId === undefined || m.productId === productId).reverse(), ms)
}

export const fetchRecipes = (): Promise<Recipe[]> => delay(getWarehouse().recipes, ms)

/** Создание или замена тех. карты продукта. */
export async function saveRecipe(r: Recipe): Promise<Recipe> {
  if (!(r.outputQty > 0)) throw new Error('Укажите выход больше нуля.')
  const lines = r.lines.filter((l) => l.productId)
  if (!lines.length) throw new Error('Добавьте хотя бы один ингредиент.')
  if (lines.some((l) => !(l.gross > 0))) throw new Error('Брутто каждого ингредиента должно быть больше нуля.')
  if (lines.some((l) => l.productId === r.productId)) throw new Error('Продукт не может входить в собственный рецепт.')
  const saved = { ...r, lines }
  updateWarehouse((s) => ({ ...s, recipes: [...s.recipes.filter((x) => x.productId !== r.productId), saved] }))
  return delay(saved, ms)
}

export async function deleteRecipe(productId: number): Promise<void> {
  updateWarehouse((s) => ({ ...s, recipes: s.recipes.filter((r) => r.productId !== productId) }))
  await delay(null, ms)
}

export async function saveSupplier(sp: Omit<Supplier, 'id'> & { id?: number }): Promise<void> {
  if (!sp.name.trim()) throw new Error('Укажите название поставщика.')
  const dup = getWarehouse().suppliers.some((x) => x.id !== sp.id && x.name.trim().toLowerCase() === sp.name.trim().toLowerCase())
  if (dup) throw new Error('Поставщик с таким названием уже есть.')
  updateWarehouse((s) => ({
    ...s,
    suppliers: sp.id
      ? s.suppliers.map((x) => (x.id === sp.id ? { ...sp, id: sp.id, name: sp.name.trim() } : x))
      : [...s.suppliers, { ...sp, name: sp.name.trim(), id: Math.max(0, ...s.suppliers.map((x) => x.id)) + 1 }],
  }))
  await delay(null, ms)
}

export async function deleteSupplier(id: number): Promise<void> {
  const st = getWarehouse()
  if (st.docs.some((d) => d.supplierId === id) || st.purchaseOrders.some((o) => o.supplierId === id)) {
    throw new Error('Поставщик есть в накладных или заказах — удалить его нельзя.')
  }
  updateWarehouse((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) }))
  await delay(null, ms)
}
