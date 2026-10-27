import { Link } from 'react-router-dom'
import { LuArrowUpRight } from 'react-icons/lu'
import { cn } from '@/lib/cn'
import type { Dept, Tone } from '../types'

const ring: Record<Tone, string> = {
  ok: 'border-success/30',
  warn: 'border-warning',
  bad: 'border-danger',
  idle: 'border-park-border',
}
const dot: Record<Tone, string> = { ok: 'bg-success', warn: 'bg-warning', bad: 'bg-danger animate-pulse', idle: 'bg-park-border2' }
const text: Record<Tone, string> = { ok: 'text-park-text', warn: 'text-warning', bad: 'text-danger', idle: 'text-park-textMuted' }

/** Один участок работы: светофор, пояснение и 4 ключевых показателя. */
export default function DeptCard({ dept }: { dept: Dept }) {
  return (
    <Link to={dept.to} className={cn('group flex flex-col rounded-2xl border-2 bg-park-bgCard p-4 shadow-card transition hover:shadow-lg', ring[dept.tone])}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={cn('h-3 w-3 shrink-0 rounded-full', dot[dept.tone])} />
          <h3 className="text-base font-bold text-park-text">{dept.title}</h3>
        </div>
        <LuArrowUpRight size={16} className="text-park-textMuted opacity-0 transition group-hover:opacity-100" />
      </div>
      <p className={cn('mt-1 text-xs font-semibold', dept.tone === 'ok' ? 'text-success' : text[dept.tone])}>{dept.note}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        {dept.metrics.map((m) => (
          <div key={m.label}>
            <dd className={cn('text-lg font-bold leading-tight', text[m.tone ?? 'ok'])}>{m.value}</dd>
            <dt className="text-[11px] leading-tight text-park-textMuted">{m.label}</dt>
          </div>
        ))}
      </dl>
    </Link>
  )
}
