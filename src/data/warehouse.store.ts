import { queryClient } from '@/api-config/queryClient'
import type { Expense } from '@/types/accounting.types'
import type { Butchering, Inventory, Product, ProductGroup, Production, PurchaseOrder, Recipe, Supplier, WarehouseDoc } from '@/types/warehouse.types'
import type { MenuCategory, MenuItem, ModifierGroup } from '@/types/menu.types'
import type { Order, Shift, TableCleaning, TableDef } from '@/types/order.types'
import type { Bracelet, BraceletEvent } from '@/types/bracelet.types'
import type { LockEvent, Locker } from '@/types/locker.types'
import type { Master, Service, ServiceDirection } from '@/types/services.types'
import type { ShopItem } from '@/types/shop.types'
import type { Tariff } from '@/types/tariff.types'
import { seedBraceletEvents, seedBracelets } from './bracelet.mock'
import { seedLockEvents, seedLockers } from './locker.mock'
import { seedShopItems } from './shop.mock'
import { seedDirections, seedMasters, seedServices } from './services.mock'
import { seedTariffs } from './tariff.mock'
import { seedOrders, seedShifts, seedTableCleanings, seedTables } from './order.mock'
import { seedCategories, seedMenuItems, seedModifierGroups } from './menu.mock'
import { seedExpenses } from './expenses.mock'
import { seedButcherings, seedDocs, seedGroups, seedInventories, seedProductions, seedProducts, seedPurchaseOrders, seedRecipes, seedSuppliers } from './warehouse.mock'

export interface WarehouseState {
  groups: ProductGroup[]
  products: Product[]
  suppliers: Supplier[]
  docs: WarehouseDoc[]
  recipes: Recipe[]
  menuCategories: MenuCategory[]
  menuItems: MenuItem[]
  modifierGroups: ModifierGroup[]
  tables: TableDef[]
  orders: Order[]
  tableCleanings: TableCleaning[]
  shifts: Shift[]
  tariffs: Tariff[]
  directions: ServiceDirection[]
  services: Service[]
  masters: Master[]
  lockers: Locker[]
  lockEvents: LockEvent[]
  bracelets: Bracelet[]
  braceletEvents: BraceletEvent[]
  shopItems: ShopItem[]
  inventories: Inventory[]
  productions: Production[]
  butcherings: Butchering[]
  expenses: Expense[]
  purchaseOrders: PurchaseOrder[]
}

const KEY = 'thebani_warehouse_v22'

function load(): WarehouseState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as WarehouseState) : null
  } catch {
    return null
  }
}

let state: WarehouseState = load() ?? { groups: seedGroups, products: seedProducts, suppliers: seedSuppliers, docs: seedDocs, recipes: seedRecipes, menuCategories: seedCategories, menuItems: seedMenuItems, modifierGroups: seedModifierGroups, tables: seedTables, orders: seedOrders, tableCleanings: seedTableCleanings, shifts: seedShifts, tariffs: seedTariffs, directions: seedDirections, services: seedServices, masters: seedMasters, lockers: seedLockers, lockEvents: seedLockEvents, bracelets: seedBracelets, braceletEvents: seedBraceletEvents, shopItems: seedShopItems, inventories: seedInventories, productions: seedProductions, butcherings: seedButcherings, expenses: seedExpenses, purchaseOrders: seedPurchaseOrders }

// Синхронизация между вкладками (например, склад и официант в разных окнах).
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('thebani-store') : null
if (channel) {
  channel.onmessage = (e) => {
    if (e.data !== 'warehouse') return
    state = load() ?? state
    queryClient.invalidateQueries({ queryKey: ['wh'] })
  }
}

export const getWarehouse = () => state

export function updateWarehouse(fn: (s: WarehouseState) => WarehouseState) {
  state = fn(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* хранилище недоступно — работаем только в памяти */
  }
  channel?.postMessage('warehouse')
}

/** Сброс демо-данных к исходным. */
export function resetWarehouse() {
  localStorage.removeItem(KEY)
  state = { groups: seedGroups, products: seedProducts, suppliers: seedSuppliers, docs: seedDocs, recipes: seedRecipes, menuCategories: seedCategories, menuItems: seedMenuItems, modifierGroups: seedModifierGroups, tables: seedTables, orders: seedOrders, tableCleanings: seedTableCleanings, shifts: seedShifts, tariffs: seedTariffs, directions: seedDirections, services: seedServices, masters: seedMasters, lockers: seedLockers, lockEvents: seedLockEvents, bracelets: seedBracelets, braceletEvents: seedBraceletEvents, shopItems: seedShopItems, inventories: seedInventories, productions: seedProductions, butcherings: seedButcherings, expenses: seedExpenses, purchaseOrders: seedPurchaseOrders }
  channel?.postMessage('warehouse')
  queryClient.invalidateQueries({ queryKey: ['wh'] })
}
