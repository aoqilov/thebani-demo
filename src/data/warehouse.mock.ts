import type { Butchering, DocLine, Inventory, Product, ProductGroup, ProductKind, Production, PurchaseOrder, Recipe, Supplier, Unit, WarehouseDoc } from '@/types/warehouse.types'
import { buildCatalog } from './real/catalog'
import { buildStock } from './warehouse.calc'

export const seedSuppliers: Supplier[] = [
  { id: 1, name: 'ООО «Мясной двор»', phone: '+998 90 111 22 33' },
  { id: 2, name: 'ИП Рахимов (овощи)', phone: '+998 91 222 33 44' },
  { id: 3, name: 'ООО «Молочный мир»', phone: '+998 93 333 44 55' },
  { id: 4, name: 'ООО «Оптовик Бакалея»', phone: '+998 94 444 55 66' },
  { id: 5, name: 'ООО «Напитки Групп»', phone: '+998 97 555 66 77' },
  { id: 6, name: 'ИП Каримова (хозтовары)', phone: '+998 99 666 77 88' },
  { id: 7, name: 'ООО «Рыба и морепродукты»', phone: '+998 90 777 88 99' },
]

// ───── Сырьё и заготовки: [группа, название, ед., мин. остаток, закупочная цена, тип] ─────
type Row = [number, string, Unit, number, number, ProductKind?]
const ingredientRows: Row[] = [
  [2, 'Говядина вырезка', 'кг', 10, 95000], [2, 'Баранина (лопатка)', 'кг', 10, 85000], [2, 'Куриное филе', 'кг', 15, 38000],
  [2, 'Фарш говяжий', 'кг', 8, 70000], [2, 'Колбаса казы', 'кг', 3, 120000], [2, 'Язык говяжий', 'кг', 4, 90000], [2, 'Печень говяжья', 'кг', 5, 45000],
  [17, 'Форель', 'кг', 8, 130000], [17, 'Креветки', 'кг', 5, 260000],
  [3, 'Картофель', 'кг', 30, 5000], [3, 'Лук репчатый', 'кг', 20, 4000], [3, 'Морковь', 'кг', 20, 4500], [3, 'Помидоры', 'кг', 15, 12000],
  [3, 'Огурцы', 'кг', 15, 10000], [3, 'Капуста белокочанная', 'кг', 10, 4000], [3, 'Зелень (укроп, кинза)', 'кг', 3, 30000],
  [3, 'Чеснок', 'кг', 2, 25000], [3, 'Перец болгарский', 'кг', 5, 18000], [3, 'Грибы шампиньоны', 'кг', 4, 40000],
  [4, 'Молоко 3,2%', 'л', 20, 11000], [4, 'Сметана 20%', 'кг', 5, 28000], [4, 'Сыр моцарелла', 'кг', 5, 90000], [4, 'Сыр твёрдый', 'кг', 4, 95000],
  [4, 'Масло сливочное', 'кг', 5, 85000], [4, 'Яйца куриные', 'шт', 100, 1200], [4, 'Кефир', 'л', 10, 12000],
  [5, 'Мука пшеничная', 'кг', 40, 7000], [5, 'Рис девзира', 'кг', 40, 16000], [5, 'Масло подсолнечное', 'л', 20, 17000], [5, 'Соль', 'кг', 10, 2000],
  [5, 'Сахар', 'кг', 15, 11000], [5, 'Чай чёрный', 'кг', 3, 80000], [5, 'Кофе в зёрнах', 'кг', 5, 220000], [5, 'Лапша сухая', 'кг', 10, 14000],
  [5, 'Томатная паста', 'кг', 5, 25000], [5, 'Зира', 'кг', 1, 150000],
  [7, 'Бульон говяжий', 'л', 10, 0, 'prep'], [7, 'Тесто', 'кг', 5, 0, 'prep'], [7, 'Зажарка', 'кг', 3, 0, 'prep'],
  [8, 'Салфетки', 'упак', 20, 6000], [8, 'Перчатки одноразовые', 'упак', 10, 18000], [8, 'Моющее средство', 'л', 5, 22000],
  [2, 'Курица тушка', 'кг', 10, 32000], [2, 'Куриные кости и крылья', 'кг', 3, 9000],
]

const base: Product[] = ingredientRows.map(([groupId, name, unit, minStock, , kind], i) => ({
  id: i + 1, groupId, code: `T-${String(i + 1).padStart(4, '0')}`, name, unit, kind: kind ?? 'goods', minStock, price: 0, active: true,
}))
const idByName = new Map(base.map((p) => [p.name, p.id]))
const ing = (name: string) => {
  const id = idByName.get(name)
  if (!id) throw new Error(`Нет ингредиента «${name}» в справочнике склада`)
  return id
}

// ───── Меню, блюда и товары бара из реального меню ─────
const catalog = buildCatalog(base.length + 1, ing)

export const seedGroups: ProductGroup[] = [
  { id: 1, parentId: null, name: 'Продукты' },
  { id: 2, parentId: 1, name: 'Мясо и птица' },
  { id: 17, parentId: 1, name: 'Рыба и морепродукты' },
  { id: 3, parentId: 1, name: 'Овощи и зелень' },
  { id: 4, parentId: 1, name: 'Молочные продукты' },
  { id: 5, parentId: 1, name: 'Бакалея' },
  { id: 6, parentId: null, name: 'Напитки' },
  { id: 9, parentId: 6, name: 'Безалкогольные' },
  { id: 10, parentId: 6, name: 'Алкоголь' },
  { id: 7, parentId: null, name: 'Заготовки' },
  { id: 8, parentId: null, name: 'Хозтовары' },
  { id: 11, parentId: null, name: 'Блюда' },
  ...catalog.groups,
]

export const seedProducts: Product[] = [...base, ...catalog.goods, ...catalog.dishes]

export const seedCategories = catalog.categories
export const seedMenuItems = catalog.menuItems

// ───── Тех. карты заготовок и блюд ─────
const toLines = (l: [string, number, number][]) => l.map(([name, gross, lossPct]) => ({ productId: ing(name), gross, lossPct }))
const prepRecipes: Recipe[] = [
  { productId: ing('Бульон говяжий'), outputQty: 5, lines: toLines([['Говядина вырезка', 1.5, 0], ['Морковь', 0.3, 15], ['Лук репчатый', 0.3, 15], ['Соль', 0.02, 0]]) },
  { productId: ing('Тесто'), outputQty: 3, lines: toLines([['Мука пшеничная', 2, 0], ['Яйца куриные', 4, 0], ['Соль', 0.03, 0]]) },
  { productId: ing('Зажарка'), outputQty: 2, lines: toLines([['Говядина вырезка', 1, 10], ['Лук репчатый', 0.6, 15], ['Морковь', 0.4, 15], ['Масло подсолнечное', 0.2, 0], ['Томатная паста', 0.1, 0]]) },
]
export const seedRecipes: Recipe[] = [...prepRecipes, ...catalog.recipes]

// ───── Документы склада ─────
const byId = new Map(seedProducts.map((p) => [p.id, p]))
const nameId = (n: string) => {
  const p = seedProducts.find((x) => x.name === n)
  if (!p) throw new Error(`Нет товара «${n}»`)
  return p.id
}
const buy = (id: number): number => catalog.buy.get(id) ?? ingredientRows[id - 1][4]

/** Остатки на начало: у большинства выше минимума, у нескольких — ниже, чтобы стоп-лист и «заканчивается» было на чём показать. */
const lowOverride = new Map<string, number>([
  ['Говядина вырезка', 6], ['Сметана 20%', 2], ['Масло сливочное', 0], ['Масло подсолнечное', 12], ['Tassay вода · 0.5 л', 18], ['Креветки', 1.5],
])
const opening: DocLine[] = seedProducts
  .filter((p) => p.kind === 'goods')
  .map((p) => ({
    productId: p.id,
    qty: lowOverride.get(p.name) ?? Math.round(p.minStock * (1.4 + (p.id % 4) * 0.55) * 10) / 10,
    price: buy(p.id),
  }))
  .filter((l) => l.qty > 0)

const incomeLines = (names: string[], bump: number): DocLine[] =>
  names.map((n) => { const id = nameId(n); return { productId: id, qty: Math.max(1, Math.round((byId.get(id)?.minStock ?? 5) * 0.8)), price: Math.round(buy(id) * bump) } })
const out = (n: string, qty: number): DocLine => ({ productId: nameId(n), qty, price: 0 })

const baseDocs: WarehouseDoc[] = [
  { id: 1, type: 'income', number: 'ПР-000001', date: '2026-10-20', status: 'posted', supplierId: null, reason: '', comment: 'Остатки на начало', lines: opening },
  { id: 2, type: 'income', number: 'ПР-000002', date: '2026-10-24', status: 'posted', supplierId: 1, reason: '', comment: 'Мясо на неделю', lines: incomeLines(['Говядина вырезка', 'Баранина (лопатка)', 'Куриное филе', 'Фарш говяжий'], 1.06) },
  { id: 3, type: 'income', number: 'ПР-000003', date: '2026-10-25', status: 'posted', supplierId: 2, reason: '', comment: '', lines: incomeLines(['Картофель', 'Лук репчатый', 'Морковь', 'Помидоры', 'Огурцы'], 0.97) },
  { id: 4, type: 'expense', number: 'СП-000001', date: '2026-10-25', status: 'posted', supplierId: null, reason: 'Порча', comment: 'Не прошли проверку качества', lines: [out('Помидоры', 3), out('Капуста белокочанная', 2), out('Молоко 3,2%', 4)] },
  { id: 5, type: 'expense', number: 'СП-000002', date: '2026-10-26', status: 'posted', supplierId: null, reason: 'Сотрудникам', comment: 'Питание персонала', lines: [out('Куриное филе', 4), out('Рис девзира', 6), out('Картофель', 5)] },
  { id: 6, type: 'income', number: 'ПР-000004', date: '2026-10-27', status: 'draft', supplierId: 5, reason: '', comment: 'Заявка на напитки (черновик)', lines: incomeLines(['Coca Cola · 0.25 л', 'Pepsi · 0.25 л', 'Tassay вода · 0.5 л'], 1.02) },
]

// ───── Инвентаризации, приготовление, заказы поставщикам ─────
// Инвентаризация прошлого дня: небольшие расхождения, чтобы отчёт о потерях было на чём показать.
// Документы недостачи/излишка созданы так же, как их создаёт postInventory.
const INV_DATE = '2026-10-26'
const invStock = new Map(buildStock(baseDocs, seedProducts).map((r) => [r.productId, r]))
const invDiffs: Array<[string, number]> = [
  ['Говядина вырезка', -1.2], ['Куриное филе', -2.5], ['Картофель', -6], ['Лук репчатый', -3],
  ['Помидоры', 0.8], ['Масло подсолнечное', -1.5], ['Coca Cola · 0.25 л', -4], ['Рис девзира', 1.5],
]
const r3 = (n: number) => Math.round(n * 1000) / 1000
const invLines = invDiffs.map(([name, diff]) => {
  const id = nameId(name)
  const st = invStock.get(id)!
  const expected = r3(st.qty)
  return { productId: id, expected, fact: r3(expected + diff), cost: st.avgCost }
})
const invShortDoc: WarehouseDoc = {
  id: 7, type: 'expense', number: 'СП-000003', date: INV_DATE, status: 'posted', supplierId: null, reason: 'Инвентаризация', source: 'ИН-000001', comment: 'Недостача по ИН-000001',
  lines: invLines.filter((l) => l.fact < l.expected).map((l): DocLine => ({ productId: l.productId, qty: r3(l.expected - l.fact), price: 0 })),
}
const invOverDoc: WarehouseDoc = {
  id: 8, type: 'income', number: 'ПР-000005', date: INV_DATE, status: 'posted', supplierId: null, reason: '', source: 'ИН-000001', comment: 'Излишек по ИН-000001',
  lines: invLines.filter((l) => l.fact > l.expected).map((l): DocLine => ({ productId: l.productId, qty: r3(l.fact - l.expected), price: Math.round(l.cost) })),
}

export const seedDocs: WarehouseDoc[] = [...baseDocs, invShortDoc, invOverDoc]

export const seedInventories: Inventory[] = [
  { id: 1, number: 'ИН-000001', date: INV_DATE, status: 'posted', comment: 'Еженедельная инвентаризация', lines: invLines, docIds: [7, 8] },
]

export const seedProductions: Production[] = [
  { id: 1, number: 'ПЗ-000001', date: '2026-10-27', status: 'draft', comment: 'Бульон на день', lines: [{ productId: nameId('Бульон говяжий'), qty: 10 }], docIds: [] },
]

export const seedButcherings: Butchering[] = [
  {
    id: 1, number: 'РЗ-000001', date: '2026-10-27', status: 'draft', comment: 'Разделка тушек на день', inputProductId: nameId('Курица тушка'), inputQty: 10, docIds: [],
    outputs: [
      { productId: nameId('Куриное филе'), qty: 6, sharePct: 70 },
      { productId: nameId('Куриные кости и крылья'), qty: 3, sharePct: 25 },
    ],
  },
]

const orderLines = (items: Array<[string, number]>): DocLine[] => items.map(([n, qty]) => { const id = nameId(n); return { productId: id, qty, price: buy(id) } })

export const seedPurchaseOrders: PurchaseOrder[] = [
  { id: 1, number: 'ЗП-000001', date: '2026-10-26', supplierId: 1, status: 'sent', comment: 'Мясо на выходные', lines: orderLines([['Говядина вырезка', 25], ['Баранина (лопатка)', 20], ['Куриное филе', 30]]) },
  { id: 2, number: 'ЗП-000002', date: '2026-10-27', supplierId: 3, status: 'draft', comment: '', lines: orderLines([['Масло сливочное', 12], ['Сметана 20%', 10]]) },
]
