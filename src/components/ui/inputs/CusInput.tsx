import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CusInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
}

export function CusInput({ label, error, leftIcon, className, ...p }: CusInputProps) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block font-semibold text-park-text3">{label}</span>}
      <span className="relative block">
        {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-park-textMuted">{leftIcon}</span>}
        <input
          {...p}
          className={cn(
            'w-full rounded-lg border bg-park-bgInput px-3 py-2 text-park-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
            !!leftIcon && 'pl-9',
            error ? 'border-danger' : 'border-park-border',
            className,
          )}
        />
      </span>
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}
