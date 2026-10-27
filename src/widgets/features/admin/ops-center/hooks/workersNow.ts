import { RoleLabel, RoleTypes } from '@/const/constData'
import type { LockEvent } from '@/types/locker.types'
import type { Order } from '@/types/order.types'
import type { Master, Service } from '@/types/services.types'
import type { ApiEmployee } from '@/types/employee.types'
import { masterName } from '@/types/services.types'
import type { Shift } from '@/types/order.types'
import { minutesSince } from '../../../waiter/constants'
import type { WorkerNow } from '../types'

interface Input {
  employees: ApiEmployee[]
  masters: Master[]
  services: Service[]
  open: Order[]
  all: Order[]
  tableName: (id: number | null) => string
  lockEvents: LockEvent[]
  shifts: Shift[]
}

const full = (e: ApiEmployee) => `${e.firstname} ${e.lastname}`
const left = (min: number) => (min < 1 ? 'меньше минуты' : `${min} мин`)

/**
 * Что делает каждый сотрудник прямо сейчас — выводится из тех же данных, с которыми работают роли.
 * busy — занят конкретным делом, idle — свободен (в описании видно, чего ждёт).
 */
export function buildWorkers({ employees, masters, services, open, all, tableName, lockEvents, shifts }: Input): WorkerNow[] {
  const out: WorkerNow[] = []
  const active = employees.filter((e) => e.status === 'active')
  const activeItems = open.flatMap((o) => o.items.map((i) => ({ ...i, order: o })))

  // ── Официанты
  for (const e of active.filter((x) => x.role === RoleTypes.WAITER)) {
    const name = full(e)
    const mine = open.filter((o) => o.waiter === name && o.tableId !== null)
    const ready = mine.flatMap((o) => o.items.filter((i) => i.status === 'ready').map((i) => ({ ...i, order: o })))
    const bills = mine.filter((o) => o.status === 'bill')
    const waiting = mine.flatMap((o) => o.items.filter((i) => i.status === 'sent' || i.status === 'cooking'))
    if (ready.length) {
      const wait = Math.max(...ready.map((i) => minutesSince(i.sentAt)))
      out.push({ name, role: RoleLabel.waiter, state: 'busy', tone: wait >= 10 ? 'warn' : 'ok', doing: `Должен подать: ${ready.map((i) => `${i.qty} × ${i.name} (${tableName(i.order.tableId)})`).join(', ')}`, since: ready[0].sentAt })
    } else if (mine.length) {
      out.push({ name, role: RoleLabel.waiter, state: 'busy', tone: bills.length ? 'warn' : 'ok', doing: `Ведёт ${mine.length} стол(а): ${mine.map((o) => tableName(o.tableId)).join(', ')}${bills.length ? ` · ${tableName(bills[0].tableId)} просит счёт` : waiting.length ? ` · ждёт кухню: ${waiting.length} поз.` : ''}` })
    } else {
      out.push({ name, role: RoleLabel.waiter, state: 'idle', tone: 'ok', doing: 'Свободен — нет открытых столов' })
    }
  }

  // ── Повар и бармен: кто что сейчас готовит
  for (const [role, station] of [[RoleTypes.COOK, 'kitchen'], [RoleTypes.BARTENDER, 'bar']] as const) {
    for (const e of active.filter((x) => x.role === role)) {
      const name = full(e)
      const cooking = activeItems.filter((i) => i.station === station && i.status === 'cooking' && i.cookBy === name)
      const queue = activeItems.filter((i) => i.station === station && i.status === 'sent').length
      if (cooking.length) {
        const wait = Math.max(...cooking.map((i) => minutesSince(i.sentAt)))
        out.push({ name, role: RoleLabel[role], state: 'busy', tone: wait >= 20 ? 'bad' : wait >= 10 ? 'warn' : 'ok', doing: `Готовит: ${cooking.map((i) => `${i.qty} × ${i.name} (${tableName(i.order.tableId)})`).join(', ')}`, since: cooking[0].sentAt })
      } else {
        out.push({ name, role: RoleLabel[role], state: 'idle', tone: queue ? 'warn' : 'ok', doing: queue ? `Свободен, но в очереди ждут ${queue} поз.` : 'Свободен — очередь пуста' })
      }
    }
  }

  // ── Кассир
  const shift = shifts.find((s) => !s.closedAt)
  for (const e of active.filter((x) => x.role === RoleTypes.CASHIER)) {
    const name = full(e)
    const onShift = shift?.cashier === name
    const bills = open.filter((o) => o.status === 'bill')
    if (!onShift) {
      out.push({ name, role: RoleLabel.cashier, state: 'off', tone: 'idle', doing: 'Не на смене' })
    } else if (bills.length) {
      out.push({ name, role: RoleLabel.cashier, state: 'busy', tone: 'warn', doing: `Ждут оплаты: ${bills.length} счёт(а) (${bills.map((o) => o.bracelet).join(', ')})`, since: shift!.openedAt })
    } else {
      const last = all.filter((o) => o.payment).map((o) => o.payment!.at).sort().at(-1)
      out.push({ name, role: RoleLabel.cashier, state: 'idle', tone: 'ok', doing: `На смене с ${new Date(shift!.openedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}${last ? ` · последний чек ${left(minutesSince(last))} назад` : ''}` })
    }
  }

  // ── Ресепшн
  for (const e of active.filter((x) => x.role === RoleTypes.RECEPTION)) {
    const name = full(e)
    const mine = all.flatMap((o) => o.charges.filter((c) => c.kind === 'tariff' && c.by === name).map((c) => ({ c, o })))
    const last = mine.map((x) => x.c.at ?? x.o.openedAt).sort().at(-1)
    const overdue = open.filter((o) => minutesSince(o.openedAt) > o.durationMin).length
    if (last && minutesSince(last) <= 5) out.push({ name, role: RoleLabel.reception, state: 'busy', tone: 'ok', doing: `Оформляет гостя (вход ${left(minutesSince(last))} назад)`, since: last })
    else out.push({ name, role: RoleLabel.reception, state: 'idle', tone: overdue ? 'warn' : 'ok', doing: `${last ? `Последний вход ${left(minutesSince(last))} назад` : 'Входов не было'}${overdue ? ` · у ${overdue} гостей вышло время` : ''}` })
  }

  // ── Раздевалка
  for (const e of active.filter((x) => x.role === RoleTypes.RAZDEVALKA)) {
    const name = full(e)
    const last = lockEvents.find((ev) => ev.by === name)
    if (last && minutesSince(last.at) <= 3) out.push({ name, role: RoleLabel.razdevalka, state: 'busy', tone: 'ok', doing: `Работает с шкафом №${last.lockerNumber}`, since: last.at })
    else out.push({ name, role: RoleLabel.razdevalka, state: 'idle', tone: 'ok', doing: last ? `Свободен · последнее действие ${left(minutesSince(last.at))} назад` : 'Свободен' })
  }

  // ── Мастера (массаж, парение): занят, пока идёт услуга
  for (const m of masters.filter((x) => x.active)) {
    const name = masterName(m)
    const records = all.flatMap((o) => o.charges.filter((c) => c.kind === 'service' && c.masterId === m.id).map((c) => ({ c, o })))
    const running = records
      .map(({ c, o }) => {
        const dur = services.find((s) => s.id === c.serviceId)?.durationMin ?? 60
        const endsIn = dur - minutesSince(c.at ?? o.openedAt)
        return { c, o, dur, endsIn }
      })
      .filter((r) => r.endsIn > 0)
      .sort((a, b) => a.endsIn - b.endsIn)[0]
    const today = records.filter((r) => (r.c.at ?? '') >= new Date(new Date().setHours(0, 0, 0, 0)).toISOString()).length
    if (running) out.push({ name, role: 'Мастер', state: 'busy', tone: 'ok', doing: `Оказывает: ${running.c.title.replace(/, \d+ мин$/, '')} · гость ${running.o.bracelet} · ещё ${left(running.endsIn)}`, since: running.c.at })
    else out.push({ name, role: 'Мастер', state: 'idle', tone: 'ok', doing: `Свободен · сегодня услуг: ${today}` })
  }

  const order = { busy: 0, idle: 1, off: 2 } as const
  return out.sort((a, b) => order[a.state] - order[b.state] || a.role.localeCompare(b.role))
}
