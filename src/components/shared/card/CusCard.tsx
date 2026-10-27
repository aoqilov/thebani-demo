import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function CusCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-md bg-park-bgCard shadow-card dark:border dark:border-park-border dark:shadow-none', className)}>{children}</section>
}

export function CusCardHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-park-border px-5 py-4">
      <div>
        <h3 className="text-base font-bold text-park-text">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-park-textMuted">{subtitle}</p>}
      </div>
      {actions}
    </header>
  )
}

export function CusInfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-park-textMuted">{label}</span>
      <span className="font-semibold text-park-text">{value}</span>
    </div>
  )
}
