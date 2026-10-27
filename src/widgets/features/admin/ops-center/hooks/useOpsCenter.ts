import { useMemo } from 'react'
import { closedToday, startOfToday, sum } from '@/data/analytics'
import { isStopped, itemState } from '@/data/menu.calc'
import { BRACELET_EVENT_LABEL } from '@/types/bracelet.types'
import { LOCK_EVENT_LABEL } from '@/types/locker.types'
import { fmtMoney } from '@/utils/format'
import { useBraceletEvents, useBracelets } from '../../bracelets/hooks/useBracelets'
import { cashSince } from '@/api/cashier/cashier.api'
import { useClosedOrders, useShifts } from '../../../cashier/hooks/useCashier'
import { useLockEvents, useLockers } from '../../../razdevalka/hooks/useLockers'
import { minutesSince } from '../../../waiter/constants'
import { useOrders, useTables } from '../../../waiter/hooks/useOrders'
import { useEmployees } from '../../employees/hooks/useApiEmployees'
import { useMenuItems } from '../../menu/hooks/useMenu'
import { useMasters, useServiceRecords, useServices } from '../../services-list/hooks/useServices'
import { useStock } from '../../warehouse-common/hooks/useWarehouse'
import { useCostCtx } from '../../warehouse-recipes/components/useCostCtx'
import { buildWorkers } from './workersNow'
import type { Dept, FeedEvent, OpsData, StaffActivity, Tone } from '../types'

const worst = (...t: Tone[]): Tone => (t.includes('bad') ? 'bad' : t.includes('warn') ? 'warn' : 'ok')

/**
 * Сводка по всей работе комплекса: каждый участок со светофором, лента событий и «кто сейчас работает».
 * Источники те же, что у ролей, — поэтому данные меняются сразу, когда кто-то нажимает кнопку на своём месте.
 */
export function useOpsCenter(): OpsData {
  const { data: open = [] } = useOrders()
  const { data: closed = [] } = useClosedOrders()
  const { data: tables = [] } = useTables()
  const { data: lockers = [] } = useLockers()
  const { data: lockEvents = [] } = useLockEvents()
  const { data: bracelets = [] } = useBracelets()
  const { data: braceletEvents = [] } = useBraceletEvents()
  const { data: shifts = [] } = useShifts()
  const { data: menu = [] } = useMenuItems()
  const { data: masters = [] } = useMasters()
  const { data: services = [] } = useServices()
  const { data: empData } = useEmployees()
  const employees = empData?.employees
  const { data: records = [] } = useServiceRecords()
  const { data: stock = [] } = useStock()
  const { ctx } = useCostCtx()

  return useMemo(() => {
    const day = startOfToday()
    const tableName = (id: number | null) => tables.find((t) => t.id === id)?.name ?? 'без стола'
    const todayClosed = closedToday(closed)
    const allOrders = [...open, ...closed]
    const activeItems = open.flatMap((o) => o.items.filter((i) => i.status !== 'served').map((i) => ({ ...i, orderId: o.id })))

    // ── Ресепшн
    const entriesToday = allOrders.filter((o) => o.openedAt >= day)
    const overdue = open.filter((o) => minutesSince(o.openedAt) > o.durationMin).length
    const freeBr = bracelets.filter((b) => b.status === 'free').length
    const lastEntry = entriesToday.map((o) => o.openedAt).sort().at(-1)
    const reception: Dept = {
      id: 'reception', title: 'Ресепшн', to: '/live/guests',
      tone: worst(freeBr < 5 ? 'bad' : freeBr < 10 ? 'warn' : 'ok', overdue ? 'warn' : 'ok'),
      note: overdue ? `У ${overdue} гостей вышло время` : freeBr < 10 ? 'Мало свободных браслетов' : 'Всё в норме',
      metrics: [
        { label: 'Вошло сегодня', value: sum(entriesToday, (o) => o.guests) },
        { label: 'Сейчас в зале', value: sum(open, (o) => o.guests) },
        { label: 'Время вышло', value: overdue, tone: overdue ? 'warn' : 'ok' },
        { label: 'Последний вход', value: lastEntry ? `${minutesSince(lastEntry)} мин назад` : '—' },
      ],
    }

    // ── Раздевалка
    const freeL = lockers.filter((l) => l.condition === 'ok' && l.orderId === null).length
    const brokenL = lockers.filter((l) => l.condition === 'broken').length
    const withoutLocker = open.filter((o) => !lockers.some((l) => l.orderId === o.id)).length
    const lockerDept: Dept = {
      id: 'lockers', title: 'Раздевалка', to: '/rooms',
      tone: freeL < 3 ? 'bad' : freeL < 8 || withoutLocker > 0 ? 'warn' : 'ok',
      note: withoutLocker ? `${withoutLocker} гостей без шкафа` : freeL < 8 ? 'Шкафы заканчиваются' : 'Всё в норме',
      metrics: [
        { label: 'Свободно шкафов', value: freeL, tone: freeL < 8 ? 'warn' : 'ok' },
        { label: 'Занято', value: lockers.filter((l) => l.orderId !== null).length },
        { label: 'Неисправно', value: brokenL, tone: brokenL ? 'warn' : 'ok' },
        { label: 'Гостей без шкафа', value: withoutLocker, tone: withoutLocker ? 'warn' : 'ok' },
      ],
    }

    // ── Массаж и услуги
    const recToday = records.filter((r) => (r.charge.at ?? '') >= day)
    const busyMasters = new Set(records.filter((r) => minutesSince(r.charge.at ?? day) < 90).map((r) => r.charge.masterId)).size
    const activeMasters = masters.filter((m) => m.active).length
    const spa: Dept = {
      id: 'spa', title: 'Массаж и услуги', to: '/reports/services', tone: 'ok', note: 'Всё в норме',
      metrics: [
        { label: 'Услуг сегодня', value: recToday.length },
        { label: 'Выручка, сум', value: fmtMoney(sum(recToday, (r) => r.charge.amount)) },
        { label: 'Мастеров работало за 1,5 ч', value: `${busyMasters} из ${activeMasters}` },
        { label: 'Всего услуг', value: records.length },
      ],
    }

    // ── Кухня и бар
    const stationDept = (station: 'kitchen' | 'bar', title: string): Dept => {
      const items = activeItems.filter((i) => i.station === station)
      const queue = items.filter((i) => i.status === 'sent' || i.status === 'cooking')
      const waits = queue.map((i) => minutesSince(i.sentAt))
      const oldest = waits.length ? Math.max(...waits) : 0
      const avg = waits.length ? Math.round(sum(waits, (w) => w) / waits.length) : 0
      const ready = items.filter((i) => i.status === 'ready').length
      return {
        id: station, title, to: '/live/kitchen',
        tone: oldest >= 20 ? 'bad' : oldest >= 10 ? 'warn' : 'ok',
        note: oldest >= 20 ? `Заказ ждёт ${oldest} мин` : oldest >= 10 ? 'Есть задержки' : queue.length ? 'Работают без задержек' : 'Очередь пуста',
        metrics: [
          { label: 'В очереди', value: queue.length },
          { label: 'Среднее ожидание', value: `${avg} мин`, tone: avg >= 10 ? 'warn' : 'ok' },
          { label: 'Самый долгий', value: `${oldest} мин`, tone: oldest >= 20 ? 'bad' : oldest >= 10 ? 'warn' : 'ok' },
          { label: 'Готово, ждёт подачи', value: ready, tone: ready ? 'warn' : 'ok' },
        ],
      }
    }

    // ── Зал (официанты)
    const seated = open.filter((o) => o.tableId !== null)
    const readyWaiting = activeItems.filter((i) => i.status === 'ready').length
    const bills = open.filter((o) => o.status === 'bill').length
    const hall: Dept = {
      id: 'hall', title: 'Зал и официанты', to: '/live/rooms',
      tone: readyWaiting > 3 ? 'warn' : 'ok',
      note: readyWaiting ? `${readyWaiting} готовых блюд ждут подачи` : 'Всё в норме',
      metrics: [
        { label: 'Занято столов', value: `${seated.length} из ${tables.length}` },
        { label: 'Ждут подачи', value: readyWaiting, tone: readyWaiting ? 'warn' : 'ok' },
        { label: 'Попросили счёт', value: bills, tone: bills ? 'warn' : 'ok' },
        { label: 'Заказов в работе', value: activeItems.length },
      ],
    }

    // ── Касса
    const shift = shifts.find((s) => !s.closedAt)
    const cashbox: Dept = {
      id: 'cashbox', title: 'Касса', to: '/reports/shifts',
      tone: !shift && open.length > 0 ? 'bad' : bills > 0 ? 'warn' : shift ? 'ok' : 'idle',
      note: !shift ? (open.length ? 'Смена не открыта, а гости есть!' : 'Смена закрыта') : bills ? `${bills} счёт(а) ждут кассира` : 'Всё в норме',
      metrics: [
        { label: 'Смена', value: shift ? `с ${new Date(shift.openedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : 'закрыта', tone: shift ? 'ok' : 'warn' },
        { label: 'Чеков сегодня', value: todayClosed.length },
        { label: 'Выручка, сум', value: fmtMoney(sum(todayClosed, (o) => o.payment!.total)) },
        { label: 'Наличными в кассе, сум', value: shift ? fmtMoney(shift.openingCash + cashSince(closed, shift.openedAt)) : '—' },
      ],
    }

    // ── Склад
    const negative = stock.filter((s) => s.qty < -1e-9).length
    const states = menu.map((m) => itemState(m, ctx))
    const stop = states.filter((s) => isStopped(s.status)).length
    const low = states.filter((s) => s.status === 'low').length
    const warehouse: Dept = {
      id: 'warehouse', title: 'Склад и меню', to: '/warehouse/stock',
      tone: negative ? 'bad' : stop || low ? 'warn' : 'ok',
      note: negative ? `${negative} товаров ушли в минус` : stop ? `В стоп-листе ${stop} поз.` : low ? 'Часть позиций заканчивается' : 'Всё в норме',
      metrics: [
        { label: 'В стоп-листе', value: stop, tone: stop ? 'warn' : 'ok' },
        { label: 'Заканчиваются', value: low, tone: low ? 'warn' : 'ok' },
        { label: 'Остаток в минусе', value: negative, tone: negative ? 'bad' : 'ok' },
        { label: 'Позиций в меню', value: menu.filter((m) => m.active).length },
      ],
    }

    // ── Браслеты
    const lostBr = bracelets.filter((b) => b.status === 'lost').length
    const braceletsDept: Dept = {
      id: 'bracelets', title: 'Браслеты NFC', to: '/bracelets',
      tone: freeBr < 5 ? 'bad' : freeBr < 10 || lostBr > 3 ? 'warn' : 'ok',
      note: freeBr < 10 ? 'Свободных браслетов мало' : 'Всё в норме',
      metrics: [
        { label: 'Свободно', value: freeBr, tone: freeBr < 10 ? 'warn' : 'ok' },
        { label: 'У гостей', value: bracelets.filter((b) => b.status === 'issued').length },
        { label: 'Утеряно', value: lostBr, tone: lostBr > 3 ? 'warn' : 'ok' },
        { label: 'Заблокировано', value: bracelets.filter((b) => b.status === 'blocked').length },
      ],
    }

    const depts = [reception, lockerDept, spa, stationDept('kitchen', 'Кухня'), stationDept('bar', 'Бар'), hall, cashbox, warehouse, braceletsDept]

    // ── Лента событий (кто, что, когда)
    const feed: FeedEvent[] = []
    let n = 0
    const push = (at: string, actor: string, role: string, text: string, tone: Tone = 'ok') => feed.push({ id: String(++n), at, actor, role, text, tone })

    lockEvents.forEach((e) => push(e.at, e.by, 'Раздевалка', `Шкаф №${e.lockerNumber}: ${LOCK_EVENT_LABEL[e.kind].toLowerCase()}`, e.kind === 'emergency' ? 'warn' : 'ok'))
    braceletEvents.forEach((e) => {
      const role = e.kind === 'issued' || e.kind === 'replaced' ? 'Ресепшн' : e.kind === 'returned' ? 'Касса' : 'Администратор'
      push(e.at, e.by, role, `Браслет ${e.code}: ${BRACELET_EVENT_LABEL[e.kind].toLowerCase()}${e.note ? ` (${e.note})` : ''}`, e.kind === 'lost' || e.kind === 'blocked' ? 'warn' : 'ok')
    })
    allOrders.forEach((o) => {
      o.charges.forEach((c) => {
        const role = c.kind === 'service' ? 'Массажист' : c.kind === 'goods' ? 'Касса' : c.kind === 'fine' ? 'Администратор' : 'Ресепшн'
        push(c.at ?? o.openedAt, c.by, role, `${c.title} — ${fmtMoney(c.amount)} сум`, c.kind === 'fine' ? 'warn' : 'ok')
      })
      const batches = [...new Set(o.items.map((i) => i.batch))]
      batches.forEach((b) => {
        const its = o.items.filter((i) => i.batch === b)
        push(its[0].sentAt, o.waiter, 'Официант', `${tableName(o.tableId)}: отправлено ${its.reduce((s, i) => s + i.qty, 0)} шт. на кухню и бар`)
      })
      if (o.payment) push(o.payment.at, o.payment.cashier, 'Касса', `Закрыт счёт ${o.bracelet ?? ''} на ${fmtMoney(o.payment.total)} сум`)
    })
    shifts.forEach((s) => {
      push(s.openedAt, s.cashier, 'Касса', 'Открыта смена')
      if (s.closedAt) push(s.closedAt, s.cashier, 'Касса', 'Закрыта смена', (s.countedCash ?? 0) === (s.expectedCash ?? 0) ? 'ok' : 'warn')
    })
    feed.sort((a, b) => b.at.localeCompare(a.at))

    // ── Кто сейчас работает (по последней активности)
    const byActor = new Map<string, StaffActivity>()
    for (const e of [...feed].reverse()) {
      if (e.actor === '—') continue
      const key = `${e.actor}|${e.role}`
      const cur = byActor.get(key)
      byActor.set(key, { actor: e.actor, role: e.role, lastAt: e.at, lastText: e.text, count: (cur?.count ?? 0) + 1, online: minutesSince(e.at) <= 30 })
    }
    const staff = [...byActor.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt))

    const workers = buildWorkers({
      employees: employees ?? [], masters, services, open, all: allOrders, tableName, lockEvents, shifts,
    })

    return { depts, workers, feed: feed.slice(0, 40), staff, issues: depts.filter((d) => d.tone === 'bad' || d.tone === 'warn').length }
  }, [open, closed, tables, lockers, lockEvents, bracelets, braceletEvents, shifts, menu, masters, services, employees, records, stock, ctx])
}
