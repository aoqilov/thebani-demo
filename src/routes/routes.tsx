import { lazy, type ReactElement } from 'react'
import { type RouteObject } from 'react-router-dom'
import AppLayout from '@/components/layout/admin/AppLayout'
import RoleAppLayout from '@/components/layout/role-app/RoleAppLayout'
import WaiterLayout from '@/widgets/features/waiter/WaiterLayout'
import { AuthGuard } from '@/middleware/AuthGuard'
import { RoleGroups, RoleTypes } from '@/const/constData'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import Unauthorized from '@/pages/Unauthorized'

const WarehouseInventory = lazy(() => import('@/pages/admin/control/WarehouseInventory'))
const WarehouseProduction = lazy(() => import('@/pages/admin/control/WarehouseProduction'))
const WarehousePurchases = lazy(() => import('@/pages/admin/control/WarehousePurchases'))
const WarehouseButchering = lazy(() => import('@/pages/admin/control/WarehouseButchering'))
const WarehouseOrders = lazy(() => import('@/pages/admin/control/WarehouseOrders'))
const WarehouseTurnover = lazy(() => import('@/pages/admin/control/WarehouseTurnover'))
const WarehouseVariance = lazy(() => import('@/pages/admin/control/WarehouseVariance'))
const WarehouseGuide = lazy(() => import('@/pages/admin/control/WarehouseGuide'))
const WarehouseSuppliers = lazy(() => import('@/pages/admin/control/WarehouseSuppliers'))
const OpsCenter = lazy(() => import('@/pages/admin/main/OpsCenter'))
const Dashboard = lazy(() => import('@/pages/admin/main/Dashboard'))
const Employees = lazy(() => import('@/pages/admin/control/Employees'))
const DevUI = lazy(() => import('@/pages/admin/DevUI'))
const LiveGuests = lazy(() => import('@/pages/admin/main/LiveGuests'))
const LiveRooms = lazy(() => import('@/pages/admin/main/LiveRooms'))
const LiveKitchen = lazy(() => import('@/pages/admin/main/LiveKitchen'))
const ReportsFinance = lazy(() => import('@/pages/admin/main/ReportsFinance'))
const ReportsShifts = lazy(() => import('@/pages/admin/main/ReportsShifts'))
const ReportsCashflow = lazy(() => import('@/pages/admin/main/ReportsCashflow'))
const ReportsMenu = lazy(() => import('@/pages/admin/main/ReportsMenu'))
const ReportsStaff = lazy(() => import('@/pages/admin/main/ReportsStaff'))
const ReportsLosses = lazy(() => import('@/pages/admin/main/ReportsLosses'))
const ReportsPnl = lazy(() => import('@/pages/admin/main/ReportsPnl'))
const AccountingExpenses = lazy(() => import('@/pages/admin/main/AccountingExpenses'))
const ReportsServices = lazy(() => import('@/pages/admin/main/ReportsServices'))
const EmployeeDetail = lazy(() => import('@/pages/admin/control/EmployeeDetail'))
const Tariffs = lazy(() => import('@/pages/admin/control/Tariffs'))
const Promotions = lazy(() => import('@/pages/admin/control/Promotions'))
const Rooms = lazy(() => import('@/pages/admin/control/Rooms'))
const Bookings = lazy(() => import('@/pages/admin/control/Bookings'))
const Bracelets = lazy(() => import('@/pages/admin/control/Bracelets'))
const ServicesList = lazy(() => import('@/pages/admin/control/ServicesList'))
const ServicesDirections = lazy(() => import('@/pages/admin/control/ServicesDirections'))
const ServicesMasters = lazy(() => import('@/pages/admin/control/ServicesMasters'))
const Menu = lazy(() => import('@/pages/admin/control/Menu'))
const WarehouseStock = lazy(() => import('@/pages/admin/control/WarehouseStock'))
const WarehouseIncome = lazy(() => import('@/pages/admin/control/WarehouseIncome'))
const WarehouseExpense = lazy(() => import('@/pages/admin/control/WarehouseExpense'))
const WarehouseRecipes = lazy(() => import('@/pages/admin/control/WarehouseRecipes'))
const WarehouseProducts = lazy(() => import('@/pages/admin/control/WarehouseProducts'))
const ActivityLog = lazy(() => import('@/pages/admin/main/ActivityLog'))
const Settings = lazy(() => import('@/pages/admin/Settings'))
const Support = lazy(() => import('@/pages/admin/Support'))
const ReceptionNewGuest = lazy(() => import('@/pages/roles/reception/ReceptionNewGuest'))
const ReceptionGuests = lazy(() => import('@/pages/roles/reception/ReceptionGuests'))
const ReceptionProfile = lazy(() => import('@/pages/roles/reception/ReceptionProfile'))
const CashierCheckout = lazy(() => import('@/pages/roles/cashier/CashierCheckout'))
const CashierSmena = lazy(() => import('@/pages/roles/cashier/CashierSmena'))
const CashierOtchet = lazy(() => import('@/pages/roles/cashier/CashierOtchet'))
const CashierProfile = lazy(() => import('@/pages/roles/cashier/CashierProfile'))
const RazdevalkaKeyIssue = lazy(() => import('@/pages/roles/razdevalka/RazdevalkaKeyIssue'))
const RazdevalkaRooms = lazy(() => import('@/pages/roles/razdevalka/RazdevalkaRooms'))
const RazdevalkaProfile = lazy(() => import('@/pages/roles/razdevalka/RazdevalkaProfile'))
const WaiterTableOrder = lazy(() => import('@/pages/roles/waiter/WaiterTableOrder'))
const WaiterTables = lazy(() => import('@/pages/roles/waiter/WaiterTables'))
const WaiterOrders = lazy(() => import('@/pages/roles/waiter/WaiterOrders'))
const WaiterClosed = lazy(() => import('@/pages/roles/waiter/WaiterClosed'))
const WaiterProfile = lazy(() => import('@/pages/roles/waiter/WaiterProfile'))
const CookOrders = lazy(() => import('@/pages/roles/cook/CookOrders'))
const CookProfile = lazy(() => import('@/pages/roles/cook/CookProfile'))
const BartenderOrders = lazy(() => import('@/pages/roles/bartender/BartenderOrders'))
const BartenderProfile = lazy(() => import('@/pages/roles/bartender/BartenderProfile'))
const CleanerRooms = lazy(() => import('@/pages/roles/cleaner/CleanerRooms'))
const CleanerProfile = lazy(() => import('@/pages/roles/cleaner/CleanerProfile'))
const MasseurService = lazy(() => import('@/pages/roles/masseur/MasseurService'))
const MasseurHistory = lazy(() => import('@/pages/roles/masseur/MasseurHistory'))
const MasseurProfile = lazy(() => import('@/pages/roles/masseur/MasseurProfile'))

/** Защита маршрута по роли. */
function rg(element: ReactElement, roles: RoleTypes[]) {
  return <AuthGuard roles={roles}>{element}</AuthGuard>
}

export const routes: RouteObject[] = [
  {
    // Админ-панель
    element: <AuthGuard roles={RoleGroups.ALL_ADMIN}><AppLayout /></AuthGuard>,
    children: [
      // Превью UI-кита — только dev-режим
      ...(import.meta.env.DEV ? [{ path: '/test-ui', element: rg(<DevUI />, [RoleTypes.SUPERADMIN]) }] : []),
      { path: '/', element: rg(<Dashboard />, RoleGroups.DASH) },
      { path: '/ops', element: rg(<OpsCenter />, RoleGroups.OPS) },
      { path: '/warehouse/inventory', element: rg(<WarehouseInventory />, RoleGroups.STOCK) },
      { path: '/warehouse/production', element: rg(<WarehouseProduction />, RoleGroups.STOCK) },
      { path: '/warehouse/butchering', element: rg(<WarehouseButchering />, RoleGroups.STOCK) },
      { path: '/warehouse/purchases', element: rg(<WarehousePurchases />, RoleGroups.STOCK) },
      { path: '/warehouse/orders', element: rg(<WarehouseOrders />, RoleGroups.STOCK) },
      { path: '/warehouse/turnover', element: rg(<WarehouseTurnover />, RoleGroups.STOCK) },
      { path: '/warehouse/variance', element: rg(<WarehouseVariance />, RoleGroups.STOCK) },
      { path: '/employees', element: rg(<Employees />, RoleGroups.PEOPLE) },
      { path: '/live/guests', element: rg(<LiveGuests />, RoleGroups.OPS) },
      { path: '/live/rooms', element: rg(<LiveRooms />, RoleGroups.OPS) },
      { path: '/live/kitchen', element: rg(<LiveKitchen />, RoleGroups.OPS) },
      { path: '/reports/finance', element: rg(<ReportsFinance />, RoleGroups.FINANCE) },
      { path: '/reports/shifts', element: rg(<ReportsShifts />, RoleGroups.FINANCE_SHIFT) },
      { path: '/reports/cashflow', element: rg(<ReportsCashflow />, RoleGroups.FINANCE) },
      { path: '/reports/menu', element: rg(<ReportsMenu />, RoleGroups.FINANCE) },
      { path: '/reports/staff', element: rg(<ReportsStaff />, RoleGroups.FINANCE) },
      { path: '/reports/losses', element: rg(<ReportsLosses />, RoleGroups.STOCK) },
      { path: '/reports/pnl', element: rg(<ReportsPnl />, RoleGroups.FINANCE) },
      { path: '/reports/expenses', element: rg(<AccountingExpenses />, RoleGroups.FINANCE) },
      { path: '/reports/services', element: rg(<ReportsServices />, RoleGroups.SERVICES) },
      { path: '/employee/:id', element: rg(<EmployeeDetail />, RoleGroups.PEOPLE) },
      { path: '/tariffs', element: rg(<Tariffs />, RoleGroups.PRICING) },
      { path: '/promotions', element: rg(<Promotions />, RoleGroups.PRICING) },
      { path: '/rooms', element: rg(<Rooms />, RoleGroups.OPS) },
      { path: '/bookings', element: rg(<Bookings />, RoleGroups.OPS) },
      { path: '/bracelets', element: rg(<Bracelets />, RoleGroups.OPS) },
      { path: '/services/list', element: rg(<ServicesList />, RoleGroups.SERVICES) },
      { path: '/services/directions', element: rg(<ServicesDirections />, RoleGroups.SERVICES) },
      { path: '/services/masters', element: rg(<ServicesMasters />, RoleGroups.SERVICES) },
      { path: '/menu', element: rg(<Menu />, RoleGroups.MENU) },
      { path: '/warehouse/suppliers', element: rg(<WarehouseSuppliers />, RoleGroups.STOCK) },
      { path: '/warehouse/guide', element: rg(<WarehouseGuide />, RoleGroups.STOCK) },
      { path: '/warehouse/stock', element: rg(<WarehouseStock />, RoleGroups.STOCK) },
      { path: '/warehouse/income', element: rg(<WarehouseIncome />, RoleGroups.STOCK) },
      { path: '/warehouse/expense', element: rg(<WarehouseExpense />, RoleGroups.STOCK) },
      { path: '/warehouse/recipes', element: rg(<WarehouseRecipes />, RoleGroups.STOCK) },
      { path: '/warehouse/products', element: rg(<WarehouseProducts />, RoleGroups.STOCK) },
      { path: '/activity-log', element: rg(<ActivityLog />, RoleGroups.OPS) },
      { path: '/settings', element: <Settings /> },
      { path: '/support', element: <Support /> },
    ],
  },
  // Мобильные рабочие места (по одному на роль)
  {
    path: '/reception',
    element: <AuthGuard roles={[RoleTypes.RECEPTION]}><RoleAppLayout appKey="reception" /></AuthGuard>,
    children: [
      { index: true, element: <ReceptionNewGuest /> },
      { path: 'guests', element: <ReceptionGuests /> },
      { path: 'profile', element: <ReceptionProfile /> },
    ],
  },
  {
    path: '/cashier',
    element: <AuthGuard roles={[RoleTypes.CASHIER]}><RoleAppLayout appKey="cashier" /></AuthGuard>,
    children: [
      { index: true, element: <CashierCheckout /> },
      { path: 'smena', element: <CashierSmena /> },
      { path: 'otchet', element: <CashierOtchet /> },
      { path: 'profile', element: <CashierProfile /> },
    ],
  },
  {
    path: '/razdevalka',
    element: <AuthGuard roles={[RoleTypes.RAZDEVALKA]}><RoleAppLayout appKey="razdevalka" /></AuthGuard>,
    children: [
      { index: true, element: <RazdevalkaKeyIssue /> },
      { path: 'rooms', element: <RazdevalkaRooms /> },
      { path: 'profile', element: <RazdevalkaProfile /> },
    ],
  },
  {
    path: '/waiter',
    element: <AuthGuard roles={[RoleTypes.WAITER]}><WaiterLayout /></AuthGuard>,
    children: [
      { index: true, element: <WaiterTables /> },
      { path: 'table/:tableId', element: <WaiterTableOrder /> },
      { path: 'orders', element: <WaiterOrders /> },
      { path: 'closed', element: <WaiterClosed /> },
      { path: 'profile', element: <WaiterProfile /> },
    ],
  },
  {
    path: '/cook',
    element: <AuthGuard roles={[RoleTypes.COOK]}><RoleAppLayout appKey="cook" /></AuthGuard>,
    children: [
      { index: true, element: <CookOrders /> },
      { path: 'profile', element: <CookProfile /> },
    ],
  },
  {
    path: '/bar',
    element: <AuthGuard roles={[RoleTypes.BARTENDER]}><RoleAppLayout appKey="bartender" /></AuthGuard>,
    children: [
      { index: true, element: <BartenderOrders /> },
      { path: 'profile', element: <BartenderProfile /> },
    ],
  },
  {
    path: '/cleaner',
    element: <AuthGuard roles={[RoleTypes.CLEANER]}><RoleAppLayout appKey="cleaner" /></AuthGuard>,
    children: [
      { index: true, element: <CleanerRooms /> },
      { path: 'profile', element: <CleanerProfile /> },
    ],
  },
  {
    path: '/masseur',
    element: <AuthGuard roles={[RoleTypes.MASSEUR]}><RoleAppLayout appKey="masseur" /></AuthGuard>,
    children: [
      { index: true, element: <MasseurService /> },
      { path: 'history', element: <MasseurHistory /> },
      { path: 'profile', element: <MasseurProfile /> },
    ],
  },
  { path: '/login', element: <Login /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  { path: '*', element: <NotFound /> },
]
