import type { ReactNode } from 'react'
import { cn, solid, type CusColor } from '@/lib/cn'
import { CusCard } from './CusCard'

/** Kaiadmin stat card: rangli icon-box + label/value. */
export function CusStatCard({ icon, label, value, color = 'primary' }: { icon: ReactNode; label: string; value: ReactNode; color?: CusColor }) {
  return (
    <CusCard className="flex items-center gap-4 p-5">
      <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-md', solid[color])}>{icon}</span>
      <div>
        <p className="text-xs text-park-textMuted">{label}</p>
        <p className="text-xl font-bold text-park-text">{value}</p>
      </div>
    </CusCard>
  )
}
