import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn, outline, solid, type CusColor } from '@/lib/cn'

export interface CusButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'color'> {
  color?: CusColor
  variant?: 'solid' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  round?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  leftIcon?: ReactNode
}

export function CusButton({ color = 'primary', variant = 'solid', size = 'md', round, isDisabled, isLoading, leftIcon, className, children, ...p }: CusButtonProps) {
  const sizes = { sm: 'px-3 py-1 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 min-h-14 text-base' }
  return (
    <button
      {...p}
      disabled={isDisabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 border border-transparent font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        round ? 'rounded-full' : 'rounded-lg',
        sizes[size],
        variant === 'solid' && cn(solid[color], 'hover:brightness-95'),
        variant === 'outline' && outline[color],
        variant === 'ghost' && 'text-park-text4 hover:bg-park-bgHover',
        className,
      )}
    >
      {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : leftIcon}
      {children}
    </button>
  )
}
