export type Unit = 'кг' | 'г' | 'л' | 'мл' | 'шт' | 'упак' | 'порц'
export const UNITS: Unit[] = ['кг', 'г', 'л', 'мл', 'шт', 'упак', 'порц']

/** goods — покупной товар, prep — заготовка (есть рецепт и остаток), dish — блюдо (есть рецепт, остатка нет) */
export type ProductKind = 'goods' | 'prep' | 'dish'
export const PRODUCT_KIND_LABEL: Record<ProductKind, string> = { goods: 'Товар', prep: 'Заготовка', dish: 'Блюдо' }

export interface ProductGroup {
  id: number
  parentId: number | null
  name: string
}

export interface Product {
  id: number
  groupId: number
  code: string
  name: string
  unit: Unit
  kind: ProductKind
  /** Минимальный остаток — ниже него позиция подсвечивается */
  minStock: number
  /** Цена продажи (только для блюд), сум */
  price: number
  active: boolean
}

/** Строка тех. карты. Нетто = брутто × (1 − потери/100). Количество — в единицах ингредиента. */
export interface RecipeLine {
  productId: number
  gross: number
  lossPct: number
}

/** Тех. карта: из lines получается outputQty единиц продукта (блюда или заготовки). */
export interface Recipe {
  productId: number
  outputQty: number
  lines: RecipeLine[]
}

export interface Supplier {
  id: number
  name: string
  phone: string
  /** Контактное лицо */
  contact?: string
  note?: string
}

export type DocType = 'income' | 'expense'
export type DocStatus = 'draft' | 'posted'

export const EXPENSE_REASONS = ['Порча', 'Брак', 'Сотрудникам', 'Инвентаризация', 'Прочее'] as const

/** Причина документов, которые создаёт система при готовности блюда */
export const AUTO_REASON = 'Продажа (авто)'

export interface DocLine {
  productId: number
  qty: number
  /** Приход: закупочная цена. Расход: не хранится — берётся средняя себестоимость при проведении */
  price: number
}

export interface WarehouseDoc {
  id: number
  type: DocType
  number: string
  /** YYYY-MM-DD */
  date: string
  status: DocStatus
  supplierId: number | null
  reason: string
  comment: string
  lines: DocLine[]
  /** Номер документа-источника, если создан автоматически (ИН-…, ПЗ-…, ЗП-…) */
  source?: string
}

export interface StockRow {
  /** = productId, нужен для CusTable */
  id: number
  productId: number
  qty: number
  avgCost: number
  sum: number
}

export interface Movement {
  id: number
  date: string
  docId: number
  docNumber: string
  type: DocType
  productId: number
  /** со знаком: приход +, расход − */
  qty: number
  cost: number
  sum: number
}

// ───── Инвентаризация, приготовление заготовок, заказы поставщикам ─────

/** Строка инвентаризации. expected и cost фиксируются в момент проведения. */
export interface InventoryLine {
  productId: number
  /** Фактический остаток по пересчёту */
  fact: number
  /** Остаток по учёту на момент проведения */
  expected: number
  /** Себестоимость единицы на момент проведения */
  cost: number
}

/** Акт инвентаризации. При проведении недостача и излишек превращаются в обычные документы расхода/прихода. */
export interface Inventory {
  id: number
  number: string
  /** YYYY-MM-DD */
  date: string
  status: DocStatus
  comment: string
  lines: InventoryLine[]
  /** Документы склада, созданные при проведении */
  docIds: number[]
}

export interface ProductionLine {
  /** Заготовка (тип prep), у которой есть тех. карта */
  productId: number
  /** Сколько единиц заготовки приготовили */
  qty: number
}

/** Акт приготовления: списывает сырьё по тех. карте и приходует готовую заготовку. */
export interface Production {
  id: number
  number: string
  date: string
  status: DocStatus
  comment: string
  lines: ProductionLine[]
  docIds: number[]
  /** Общая себестоимость партии, фиксируется при проведении */
  totalCost?: number
}

/** draft — составляется; sent — отправлен поставщику; received — товар принят на склад */
export type PurchaseStatus = 'draft' | 'sent' | 'received'

export const PURCHASE_STATUS_LABEL: Record<PurchaseStatus, string> = {
  draft: 'Черновик',
  sent: 'Отправлен',
  received: 'Принят',
}

export interface PurchaseOrder {
  id: number
  number: string
  date: string
  supplierId: number | null
  status: PurchaseStatus
  comment: string
  lines: DocLine[]
  /** Приходная накладная, созданная при приёмке */
  incomeDocId?: number
}
