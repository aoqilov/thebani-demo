import type { Structure } from '@/data/analytics'

export interface DashboardKpi {
  guestsNow: number
  openOrders: number
  revenueToday: number
  checksToday: number
}

export interface AttentionItem {
  id: string
  tone: 'danger' | 'warning' | 'info' | 'success'
  title: string
  hint: string
  /** Куда перейти по клику */
  to: string
}

export interface DashboardData {
  kpi: DashboardKpi
  hourly: { hour: string; revenue: number }[]
  structure: Structure
  attention: AttentionItem[]
}
