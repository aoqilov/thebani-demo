import type { IconType } from 'react-icons'
import {
  LuShoppingBasket, LuTrash2, LuWallet, LuArrowLeftRight, LuChefHat, LuUserCheck,
  LuSplit,
  LuActivity, LuBadgeDollarSign, LuBed, LuCalendarCheck, LuChartBar, LuChartLine, LuClipboardList, LuFileInput,
  LuFileOutput, LuHandHelping, LuHistory, LuKeyRound, LuLayoutDashboard, LuLifeBuoy, LuMonitorPlay, LuNfc, LuPackage, LuPalette,
  LuPercent, LuSettings, LuTags, LuUsers, LuUtensils, LuWarehouse, LuBookOpen, LuUserCog, LuClipboardCheck, LuShapes,
  LuBookOpenCheck, LuCookingPot, LuHandshake, LuScale, LuTable2, LuTruck,
} from 'react-icons/lu'
import { RoleGroups, RoleTypes } from '@/const/constData'

export type NavBadge = 'new' | 'soon' | 'beta'

interface NavBase {
  labelKey: string
  icon: IconType
  roles?: RoleTypes[]
  badge?: NavBadge
}

export interface NavItemDef extends NavBase {
  to: string
  subItems?: never
}

export interface SubItemDef extends NavBase {
  to: string
}

export interface NavSubMenuDef extends NavBase {
  to?: never
  subItems: SubItemDef[]
}

export type NavEntry = NavItemDef | NavSubMenuDef

export interface NavGroupDef {
  labelKey: string
  items: NavEntry[]
}

const G = RoleGroups

export const navGroups: NavGroupDef[] = [
  {
    labelKey: 'main',
    items: [
      { labelKey: 'ops', icon: LuMonitorPlay, to: '/ops', roles: G.OPS },
      { labelKey: 'dashboard', icon: LuLayoutDashboard, to: '/', roles: G.DASH },
      {
        labelKey: 'live',
        icon: LuActivity,
        subItems: [
          { labelKey: 'liveGuests', icon: LuUsers, to: '/live/guests', roles: G.OPS },
          { labelKey: 'liveRooms', icon: LuBed, to: '/live/rooms', roles: G.OPS },
          { labelKey: 'liveKitchen', icon: LuUtensils, to: '/live/kitchen', roles: G.OPS },
        ],
      },
      {
        labelKey: 'reports',
        icon: LuChartBar,
        subItems: [
          { labelKey: 'reportsFinance', icon: LuChartLine, to: '/reports/finance', roles: G.FINANCE },
          { labelKey: 'reportsLosses', icon: LuTrash2, to: '/reports/losses', roles: G.STOCK, badge: 'new' },
          { labelKey: 'reportsPnl', icon: LuScale, to: '/reports/pnl', roles: G.FINANCE, badge: 'new' },
          { labelKey: 'reportsCashflow', icon: LuArrowLeftRight, to: '/reports/cashflow', roles: G.FINANCE, badge: 'new' },
          { labelKey: 'reportsMenu', icon: LuChefHat, to: '/reports/menu', roles: G.FINANCE, badge: 'new' },
          { labelKey: 'reportsStaff', icon: LuUserCheck, to: '/reports/staff', roles: G.FINANCE, badge: 'new' },
          { labelKey: 'reportsExpenses', icon: LuWallet, to: '/reports/expenses', roles: G.FINANCE, badge: 'new' },
          { labelKey: 'reportsShifts', icon: LuClipboardCheck, to: '/reports/shifts', roles: G.FINANCE_SHIFT },
          { labelKey: 'reportsServices', icon: LuHandHelping, to: '/reports/services', roles: G.SERVICES },
        ],
      },
    ],
  },
  {
    labelKey: 'control',
    items: [
      { labelKey: 'employees', icon: LuUsers, to: '/employees', roles: G.PEOPLE },
      { labelKey: 'tariffs', icon: LuTags, to: '/tariffs', roles: G.PRICING },
      { labelKey: 'promotions', icon: LuPercent, to: '/promotions', roles: G.PRICING },
      { labelKey: 'rooms', icon: LuKeyRound, to: '/rooms', roles: G.OPS },
      { labelKey: 'bookings', icon: LuCalendarCheck, to: '/bookings', roles: G.OPS },
      { labelKey: 'bracelets', icon: LuNfc, to: '/bracelets', roles: G.OPS },
      {
        labelKey: 'services',
        icon: LuHandHelping,
        subItems: [
          { labelKey: 'servicesList', icon: LuBadgeDollarSign, to: '/services/list', roles: G.SERVICES },
          { labelKey: 'servicesDirections', icon: LuShapes, to: '/services/directions', roles: G.SERVICES },
          { labelKey: 'servicesMasters', icon: LuUserCog, to: '/services/masters', roles: G.SERVICES },
        ],
      },
      { labelKey: 'menu', icon: LuBookOpen, to: '/menu', roles: G.MENU },
      {
        labelKey: 'warehouse',
        icon: LuWarehouse,
        subItems: [
          { labelKey: 'warehouseGuide', icon: LuBookOpenCheck, to: '/warehouse/guide', roles: G.STOCK, badge: 'new' },
          { labelKey: 'warehouseStock', icon: LuPackage, to: '/warehouse/stock', roles: G.STOCK },
          { labelKey: 'warehouseIncome', icon: LuFileInput, to: '/warehouse/income', roles: G.STOCK },
          { labelKey: 'warehouseExpense', icon: LuFileOutput, to: '/warehouse/expense', roles: G.STOCK },
          { labelKey: 'warehouseRecipes', icon: LuClipboardList, to: '/warehouse/recipes', roles: G.STOCK },
          { labelKey: 'warehouseInventory', icon: LuClipboardCheck, to: '/warehouse/inventory', roles: G.STOCK, badge: 'new' },
          { labelKey: 'warehouseProduction', icon: LuCookingPot, to: '/warehouse/production', roles: G.STOCK, badge: 'new' },
          { labelKey: 'warehouseButchering', icon: LuSplit, to: '/warehouse/butchering', roles: G.STOCK, badge: 'new' },
          { labelKey: 'warehousePurchases', icon: LuShoppingBasket, to: '/warehouse/purchases', roles: G.STOCK, badge: 'new' },
          { labelKey: 'warehouseOrders', icon: LuTruck, to: '/warehouse/orders', roles: G.STOCK, badge: 'new' },
          { labelKey: 'warehouseSuppliers', icon: LuHandshake, to: '/warehouse/suppliers', roles: G.STOCK, badge: 'new' },
          { labelKey: 'warehouseTurnover', icon: LuTable2, to: '/warehouse/turnover', roles: G.STOCK, badge: 'new' },
          { labelKey: 'warehouseVariance', icon: LuScale, to: '/warehouse/variance', roles: G.STOCK, badge: 'new' },
          { labelKey: 'warehouseProducts', icon: LuPackage, to: '/warehouse/products', roles: G.STOCK },
        ],
      },
      { labelKey: 'activityLog', icon: LuHistory, to: '/activity-log', roles: G.OPS },
    ],
  },
]

/** Раздел «Система» — пустой `roles` значит «видно всем». */
export const systemItems: NavItemDef[] = [
  { labelKey: 'settings', icon: LuSettings, to: '/settings', roles: [] },
  { labelKey: 'support', icon: LuLifeBuoy, to: '/support', roles: [] },
  // Превью UI-кита: только dev-режим и только superadmin
  ...(import.meta.env.DEV ? [{ labelKey: 'testUi', icon: LuPalette, to: '/test-ui', roles: [RoleTypes.SUPERADMIN], badge: 'beta' as const }] : []),
]
