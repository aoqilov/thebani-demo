import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { cn } from '@/lib/cn'
import type { FeedEvent, StaffActivity } from '../types'

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
const ago = (iso: string) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
  return m < 1 ? 'только что' : m < 60 ? `${m} мин назад` : `${Math.floor(m / 60)} ч назад`
}

/** Что происходит прямо сейчас: кто, где, что сделал. */
export function ActivityFeed({ events }: { events: FeedEvent[] }) {
  return (
    <CusCard>
      <CusCardHeader title="Лента событий" subtitle="Кто, где и что сделал — все участки сразу" />
      <ul className="max-h-[520px] divide-y divide-park-border overflow-y-auto">
        {events.length === 0 && <li className="p-8 text-center text-sm text-park-textMuted">Событий пока нет</li>}
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-3 px-5 py-2.5">
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', e.tone === 'warn' ? 'bg-warning' : e.tone === 'bad' ? 'bg-danger' : 'bg-success')} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-park-text">{e.text}</p>
              <p className="text-xs text-park-textMuted"><b className="font-semibold text-park-text3">{e.actor}</b> · {e.role}</p>
            </div>
            <span className="shrink-0 text-right text-xs text-park-textMuted">{hhmm(e.at)}<span className="block">{ago(e.at)}</span></span>
          </li>
        ))}
      </ul>
    </CusCard>
  )
}

/** Кто сейчас на работе (по последнему действию). */
export function StaffPanel({ staff }: { staff: StaffActivity[] }) {
  const online = staff.filter((s) => s.online).length
  return (
    <CusCard>
      <CusCardHeader title="Сотрудники" subtitle={`Активны за 30 минут: ${online} из ${staff.length}`} />
      <ul className="max-h-[520px] divide-y divide-park-border overflow-y-auto">
        {staff.length === 0 && <li className="p-8 text-center text-sm text-park-textMuted">Нет данных</li>}
        {staff.map((s) => (
          <li key={`${s.actor}|${s.role}`} className="flex items-center gap-3 px-5 py-2.5">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', s.online ? 'bg-success' : 'bg-park-border2')} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-park-text">{s.actor}</p>
              <p className="truncate text-xs text-park-textMuted">{s.role} · {s.lastText}</p>
            </div>
            <span className="shrink-0 text-right text-xs text-park-textMuted">{ago(s.lastAt)}<span className="block">{s.count} действ.</span></span>
          </li>
        ))}
      </ul>
    </CusCard>
  )
}
