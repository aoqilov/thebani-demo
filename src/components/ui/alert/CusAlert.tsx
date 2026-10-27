import type { ReactNode } from 'react'
import { cn, soft, type CusColor } from '@/lib/cn'

export function CusAlert({ color = 'info', children }: { color?: CusColor; children: ReactNode }) {
  return <div className={cn('rounded-lg px-4 py-3 text-sm font-medium', soft[color])}>{children}</div>
}
