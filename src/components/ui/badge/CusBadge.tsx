import type { ReactNode } from 'react'
import { cn, soft, solid, type CusColor } from '@/lib/cn'

export function CusBadge({ color = 'primary', solidFill, children, className }: { color?: CusColor; solidFill?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', solidFill ? solid[color] : soft[color], className)}>
      {children}
    </span>
  )
}
