import type { ReactNode } from 'react'

export default function PageHeader({ title, highlight, label, subtitle, actions }: {
  title: string; highlight?: string; label?: string; subtitle?: string; actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {label && <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-park-textDim">{label}</p>}
        <h1 className="text-2xl font-bold text-park-text">
          {title} {highlight && <span className="text-primary">{highlight}</span>}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-park-textMuted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}
