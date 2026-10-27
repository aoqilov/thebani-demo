import { useMemo } from 'react'
import { byHour, closedToday, structure, sum } from '@/data/analytics'
import { isStopped, itemState } from '@/data/menu.calc'
import { minutesSince } from '../../../waiter/constants'
import { useLockers } from '../../../razdevalka/hooks/useLockers'
import { useClosedOrders } from '../../../cashier/hooks/useCashier'
import { useOrders } from '../../../waiter/hooks/useOrders'
import { useMenuItems } from '../../menu/hooks/useMenu'
import { useCostCtx } from '../../warehouse-recipes/components/useCostCtx'
import type { AttentionItem, DashboardData } from '../types'

/** Сводка для дашборда считается из тех же данных, с которыми работают роли (склад, заказы, касса). */
export function useDashboard(): DashboardData {
  const { data: open = [] } = useOrders()
  const { data: closed = [] } = useClosedOrders()
  const { data: menu = [] } = useMenuItems()
  const { data: lockers = [] } = useLockers()
  const { ctx } = useCostCtx()

  return useMemo(() => {
    const today = closedToday(closed)
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

    return {
      kpi: {
        guestsNow: sum(open, (o) => o.guests),
        openOrders: open.length,
        revenueToday: sum(today, (o) => o.payment!.total),
        checksToday: today.length,
      },
      hourly: byHour(today),
      structure: structure(today),
      attention,
    }
  }, [open, closed, menu, lockers, ctx])
}
