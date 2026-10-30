import type { Structure } from '@/data/analytics'

export interface DashboardKpi {
  guestsNow: number
  openOrders: number
  revenueToday: number
  checksToday: number
}

/** KPI за выбранный период: деньги и эффективность. */
export interface DashboardKpi2 {
  avgCheck: number
  /** Изменение среднего чека к предыдущему периоду такой же длины, %; null — тогда чеков не было */
  avgCheckDelta: number | null
  revenue: number
  /** Чистая прибыль за период (с учётом расходов и налогов) */
  netProfit: number
  /** Food cost по кухне и бару, %; null — не было продаж */
  foodCost: number | null
}

export interface AttentionItem {
  id: string
  tone: 'danger' | 'warning' | 'info' | 'success'
  title: string
  hint: string
  /** Куда перейти по клику */
  to: string
}

export interface TopItem {
  id: number
  name: string
  qty: number
  revenue: number
}

export interface LowStockItem {
  id: number
  name: string
  qty: number
  minStock: number
  unit: string
}

export interface PendingDelivery {
  id: number
  number: string
  supplier: string
  days: number
  sum: number
}

export interface DashboardData {
  kpi: DashboardKpi
  kpi2: DashboardKpi2
  hourly: { hour: string; revenue: number }[]
  /** Выручка и валовая прибыль по дням выбранного периода */
  daily: { day: string; Выручка: number; 'Валовая прибыль': number }[]
  /** Оплаты за период по способам */
  methods: { name: string; value: number }[]
  topItems: TopItem[]
  lowStock: LowStockItem[]
  deliveries: PendingDelivery[]
  structure: Structure
  attention: AttentionItem[]
}
