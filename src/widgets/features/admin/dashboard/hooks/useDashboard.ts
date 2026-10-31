import { useMemo } from 'react'
import { byHour, closedToday, methodTotals, structure, sum, topItems } from '@/data/analytics'
import { isStopped, itemState } from '@/data/menu.calc'
import { pnl } from '@/data/pnl'
import { cashierStats, waiterStats } from '@/data/staffStats'
import { masterName } from '@/types/services.types'
import { PAY_METHOD_LABEL, type PayMethod } from '@/types/order.types'
import type { Period } from '@/widgets/shared-ui/PeriodFilter'
import { minutesSince } from '../../../waiter/constants'
import { useLockers } from '../../../razdevalka/hooks/useLockers'
import { useClosedOrders } from '../../../cashier/hooks/useCashier'
import { useOrders } from '../../../waiter/hooks/useOrders'
import { useExpenses } from '../../accounting-expenses/hooks/useExpenses'
import { useMenuItems } from '../../menu/hooks/useMenu'
import { useItemCost } from '../../reports-pnl/hooks/useItemCost'
import { useMasters, useServiceRecords, useServices } from '../../services-list/hooks/useServices'
import { useProducts, useStock, useSuppliers } from '../../warehouse-common/hooks/useWarehouse'
import { usePurchaseOrders } from '../../warehouse-common/hooks/useWarehouseOps'
import { useCostCtx } from '../../warehouse-recipes/components/useCostCtx'
import type { AttentionItem, DashboardData } from '../types'

const DAY = 86_400_000
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

/** Сводка для дашборда считается из тех же данных, с которыми работают роли (склад, заказы, касса). */
const MAX_DAYS = 120

export function useDashboard(period: Period): DashboardData {
  const { data: open = [] } = useOrders()
  const { data: closed = [] } = useClosedOrders()
  const { data: menu = [] } = useMenuItems()
  const { data: lockers = [] } = useLockers()
  const { data: expenses = [] } = useExpenses()
  const { data: masters = [] } = useMasters()
  const { data: records = [] } = useServiceRecords()
  const { data: services = [] } = useServices()
  const { data: stock = [] } = useStock()
  const { data: products = [] } = useProducts()
  const { data: suppliers = [] } = useSuppliers()
  const { data: purchaseOrders = [] } = usePurchaseOrders()
  const { ctx } = useCostCtx()
  const itemCost = useItemCost()

  return useMemo(() => {
    const todayOrders = closedToday(closed)
    const attention: AttentionItem[] = []

    const overdue = open.filter((o) => minutesSince(o.openedAt) > o.durationMin).length
    if (overdue) attention.push({ id: 'overdue', tone: 'danger', title: `Время вышло у ${overdue} гостей`, hint: 'Продлить или попросить выйти', to: '/live/guests' })

    const waiting = open.flatMap((o) => o.items).filter((i) => i.status === 'ready').length
    if (waiting) attention.push({ id: 'ready', tone: 'warning', title: `${waiting} готовых блюд ждут подачи`, hint: 'Официанты не забрали', to: '/live/kitchen' })

    const states = menu.map((m) => itemState(m, ctx))
    const stop = states.filter((s) => isStopped(s.status)).length
    if (stop) attention.push({ id: 'stop', tone: 'warning', title: `В стоп-листе ${stop} поз.`, hint: 'Проверьте остатки склада', to: '/menu' })

    const low = states.filter((s) => s.status === 'low').length
    if (low) attention.push({ id: 'low', tone: 'info', title: `${low} поз. заканчиваются`, hint: 'Пора заказать товар', to: '/warehouse/stock' })

    const free = lockers.filter((l) => l.condition === 'ok' && l.orderId === null).length
    const bills = open.filter((o) => o.status === 'bill').length
    if (bills) attention.push({ id: 'bills', tone: 'info', title: `${bills} счёт(а) ждут кассира`, hint: 'Гость попросил счёт', to: '/live/guests' })
    attention.push({ id: 'lockers', tone: free < 5 ? 'warning' : 'success', title: `Свободно шкафов: ${free}`, hint: `Всего ${lockers.length}`, to: '/rooms' })

    // ── деньги за выбранный период и за предыдущий такой же длины ──
    const now = Date.now()
    const t0 = iso(now)
    const { from, to } = period
    const calc = (f: string, t: string) => pnl({ orders: closed, expenses, masters, itemCost, from: f, to: t })

    const len = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY) + 1)
    const prevTo = iso(new Date(from).getTime() - DAY)
    const prevFrom = iso(new Date(from).getTime() - len * DAY)

    const cur = calc(from, to)
    const prev = calc(prevFrom, prevTo)
    const avg = (r: ReturnType<typeof calc>) => (r.orders > 0 ? r.revenueNet / r.orders : 0)
    const kitchenBarRevenue = cur.revenue.kitchen + cur.revenue.bar

    const daily: DashboardData['daily'] = []
    const end = new Date(to).getTime()
    for (let t = Math.max(new Date(from).getTime(), end - (MAX_DAYS - 1) * DAY); t <= end; t += DAY) {
      const d = iso(t)
      const r = calc(d, d)
      daily.push({ day: `${d.slice(8)}.${d.slice(5, 7)}`, Выручка: Math.round(r.revenueNet), 'Валовая прибыль': Math.round(r.grossProfit) })
    }

    const periodOrders = closed.filter((o) => o.status === 'closed' && o.payment && o.payment.at.slice(0, 10) >= from && o.payment.at.slice(0, 10) <= to)
    const mt = methodTotals(periodOrders)
    const methods = (Object.keys(mt) as PayMethod[]).map((m) => ({ name: PAY_METHOD_LABEL[m], value: mt[m] })).filter((r) => r.value > 0)

    const top = topItems(periodOrders).slice(0, 5).map((s) => ({ id: s.menuItemId, name: s.name, qty: s.qty, revenue: s.revenue }))

    // ── топ сотрудников и услуг за период ──
    const inPeriod = (at?: string) => !!at && at.slice(0, 10) >= from && at.slice(0, 10) <= to
    const periodRecords = records.filter((r) => inPeriod(r.charge.at))
    const topMasters = masters
      .map((m) => {
        const mine = periodRecords.filter((r) => r.charge.masterId === m.id)
        return { name: masterName(m), count: mine.length, amount: mine.reduce((s, r) => s + r.charge.amount, 0) }
      })
      .filter((m) => m.count > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
    const topStaff: DashboardData['topStaff'] = {
      waiters: waiterStats(closed, from, to).slice(0, 5).map((w) => ({ name: w.name, count: w.orders, amount: w.sales })),
      cashiers: cashierStats(closed, from, to).slice(0, 5).map((c) => ({ name: c.name, count: c.orders, amount: c.revenue })),
      masters: topMasters,
    }
    const bySvc = new Map<string, { name: string; count: number; amount: number }>()
    for (const r of periodRecords) {
      const name = services.find((s) => s.id === r.charge.serviceId)?.name ?? r.charge.title.replace(/, \d+ мин$/, '')
      const cur = bySvc.get(name) ?? { name, count: 0, amount: 0 }
      cur.count += 1
      cur.amount += r.charge.amount
      bySvc.set(name, cur)
    }
    const topServices = [...bySvc.values()].sort((a, b) => b.amount - a.amount).slice(0, 5)

    // ── склад и поставки ──
    const pm = new Map(products.map((p) => [p.id, p]))
    const lowStock = stock
      .map((r) => ({ r, p: pm.get(r.productId) }))
      .filter(({ r, p }) => p && p.active && p.kind !== 'dish' && p.minStock > 0 && r.qty < p.minStock)
      .sort((a, b) => a.r.qty / a.p!.minStock - b.r.qty / b.p!.minStock)
      .slice(0, 5)
      .map(({ r, p }) => ({ id: r.productId, name: p!.name, qty: r.qty, minStock: p!.minStock, unit: p!.unit }))

    const deliveries = purchaseOrders
      .filter((o) => o.status === 'sent')
      .map((o) => ({
        id: o.id, number: o.number, supplier: suppliers.find((s) => s.id === o.supplierId)?.name ?? '—',
        days: Math.max(0, Math.floor((new Date(t0).getTime() - new Date(o.date).getTime()) / DAY)),
        sum: o.lines.reduce((s, l) => s + l.qty * l.price, 0),
      }))
      .sort((a, b) => b.days - a.days)

    const lateDeliveries = deliveries.filter((d) => d.days >= 3).length
    if (lateDeliveries) attention.push({ id: 'late', tone: 'warning', title: `${lateDeliveries} поставки задерживаются`, hint: 'Заказ отправлен 3 и более дня назад', to: '/warehouse/orders' })

    return {
      kpi: {
        guestsNow: sum(open, (o) => o.guests),
        openOrders: open.length,
        revenueToday: sum(todayOrders, (o) => o.payment!.total),
        checksToday: todayOrders.length,
      },
      kpi2: {
        avgCheck: avg(cur),
        avgCheckDelta: avg(prev) > 0 && cur.orders > 0 ? ((avg(cur) - avg(prev)) / avg(prev)) * 100 : null,
        revenue: cur.revenueNet,
        netProfit: cur.netProfit,
        foodCost: kitchenBarRevenue > 0 ? (cur.cogs / kitchenBarRevenue) * 100 : null,
      },
      hourly: byHour(todayOrders),
      daily,
      methods,
      topItems: top,
      topStaff,
      topServices,
      lowStock,
      deliveries,
      structure: structure(periodOrders),
      attention,
    }
  }, [period, open, closed, menu, lockers, expenses, masters, stock, products, suppliers, purchaseOrders, ctx, itemCost, records, services])
}
