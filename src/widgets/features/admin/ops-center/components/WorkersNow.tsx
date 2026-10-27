import { useState } from 'react'
import { CusAvatar } from '@/components/ui/avatar/CusAvatar'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import { cn } from '@/lib/cn'
import type { WorkerNow } from '../types'

type Filter = 'all' | 'busy' | 'idle'

const dot: Record<WorkerNow['state'], string> = { busy: 'bg-primary', idle: 'bg-success', off: 'bg-park-border2' }
const stateText: Record<WorkerNow['state'], string> = { busy: 'Занят', idle: 'Свободен', off: 'Не на смене' }
const mins = (iso?: string) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)) : null)

/** Что делает каждый сотрудник прямо сейчас — по всем рабочим местам. */
export default function WorkersNow({ workers }: { workers: WorkerNow[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const busy = workers.filter((w) => w.state === 'busy').length
  const idle = workers.filter((w) => w.state === 'idle').length
  const rows = workers.filter((w) => filter === 'all' || w.state === filter)

  return (
    <CusCard>
      <CusCardHeader title="Что делают сотрудники" subtitle={`Заняты: ${busy} · свободны: ${idle} · всего: ${workers.length}`} />
      <div className="flex gap-1.5 border-b border-park-border px-5 py-3">
        <CusChip active={filter === 'all'} onClick={() => setFilter('all')}>Все</CusChip>
        <CusChip active={filter === 'busy'} onClick={() => setFilter('busy')}>Заняты</CusChip>
        <CusChip active={filter === 'idle'} onClick={() => setFilter('idle')}>Свободны</CusChip>
      </div>
      <ul className="max-h-[520px] divide-y divide-park-border overflow-y-auto">
        {rows.length === 0 && <li className="p-8 text-center text-sm text-park-textMuted">Нет сотрудников</li>}
        {rows.map((w) => {
          const m = mins(w.since)
          return (
            <li key={`${w.role}|${w.name}`} className="flex items-start gap-3 px-5 py-3">
              <div className="relative shrink-0">
                <CusAvatar name={w.name} size={36} />
                <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-park-bgCard', dot[w.state])} title={stateText[w.state]} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-park-text">{w.name}<span className="text-xs font-normal text-park-textMuted">{w.role}</span></p>
                <p className={cn('text-sm', w.tone === 'bad' ? 'font-semibold text-danger' : w.tone === 'warn' ? 'text-warning' : 'text-park-text3')}>{w.doing}</p>
              </div>
              {m !== null && <span className="shrink-0 text-xs text-park-textMuted">{m < 1 ? 'только что' : `${m} мин`}</span>}
            </li>
          )
        })}
      </ul>
    </CusCard>
  )
}
