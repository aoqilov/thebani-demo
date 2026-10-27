import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Панель действий над таблицей (как тулбар в iiko Office). */
export function CusToolbar({ left, right, className }: { left?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 border-b border-park-border bg-park-bgHover/60 px-3 py-2', className)}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  )
}

/** Переключатель-«чип» для фильтров. */
export function CusChip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition', active ? 'border-primary bg-primary text-white' : 'border-park-border bg-park-bgCard text-park-text3 hover:bg-park-bgHover')}
    >
      {children}
    </button>
  )
}
